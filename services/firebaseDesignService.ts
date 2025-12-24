/**
 * Firebase Design Storage Service for Weave
 * Handles cloud persistence of design files using Firebase Firestore and Storage
 */

import { db, storage } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import type { ProjectData } from '../types';

// Design file metadata stored in Firestore
export interface DesignMetadata {
  id: string;
  name: string;
  description?: string;
  userId: string;
  userEmail?: string;
  version: number;
  storageUrl: string;
  thumbnailUrl?: string;
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  componentCount: number;
  connectionCount: number;
  pageCount: number;
}

// Design with full data
export interface DesignWithData extends DesignMetadata {
  data: ProjectData;
}

class FirebaseDesignService {
  private readonly designsCollection = 'weave_designs';
  private unsubscribeDesigns: Unsubscribe | null = null;

  /**
   * Save design to Firebase
   */
  async saveDesign(
    designData: ProjectData,
    metadata: {
      name: string;
      description?: string;
      userId: string;
      userEmail?: string;
      tags?: string[];
      isPublic?: boolean;
    },
    existingId?: string
  ): Promise<string> {
    try {
      const now = new Date();
      
      // Calculate stats
      const componentCount = designData.components?.length || 0;
      const connectionCount = designData.connections?.length || 0;
      const pageCount = designData.pages?.length || 1;
      
      // Save design JSON to Storage
      const designId = existingId || `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const storageRef = ref(storage, `weave_designs/${metadata.userId}/${designId}.json`);
      const designJson = JSON.stringify(designData);
      
      await uploadString(storageRef, designJson, 'raw', {
        contentType: 'application/json'
      });
      
      const storageUrl = await getDownloadURL(storageRef);
      
      // Save/Update metadata in Firestore
      if (existingId) {
        // Update existing
        const docRef = doc(db, this.designsCollection, existingId);
        const existingDoc = await getDoc(docRef);
        const existingData = existingDoc.data();
        
        await updateDoc(docRef, {
          name: metadata.name,
          description: metadata.description || '',
          tags: metadata.tags || [],
          isPublic: metadata.isPublic ?? false,
          version: (existingData?.version || 0) + 1,
          storageUrl,
          componentCount,
          connectionCount,
          pageCount,
          updatedAt: Timestamp.fromDate(now)
        });
        
        return existingId;
      } else {
        // Create new
        const docRef = await addDoc(collection(db, this.designsCollection), {
          name: metadata.name,
          description: metadata.description || '',
          userId: metadata.userId,
          userEmail: metadata.userEmail || '',
          version: 1,
          storageUrl,
          thumbnailUrl: '',
          tags: metadata.tags || [],
          isPublic: metadata.isPublic ?? false,
          componentCount,
          connectionCount,
          pageCount,
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now)
        });
        
        return docRef.id;
      }
    } catch (error) {
      console.error('Error saving design:', error);
      throw error;
    }
  }

  /**
   * Load design from Firebase
   */
  async loadDesign(designId: string): Promise<DesignWithData | null> {
    try {
      const docRef = doc(db, this.designsCollection, designId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      
      // Fetch design data from Storage
      const response = await fetch(data.storageUrl);
      const designData = await response.json() as ProjectData;
      
      return {
        id: docSnap.id,
        name: data.name,
        description: data.description,
        userId: data.userId,
        userEmail: data.userEmail,
        version: data.version,
        storageUrl: data.storageUrl,
        thumbnailUrl: data.thumbnailUrl,
        tags: data.tags || [],
        isPublic: data.isPublic || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        componentCount: data.componentCount || 0,
        connectionCount: data.connectionCount || 0,
        pageCount: data.pageCount || 1,
        data: designData
      };
    } catch (error) {
      console.error('Error loading design:', error);
      throw error;
    }
  }

  /**
   * Get all designs for a user
   */
  async getUserDesigns(userId: string): Promise<DesignMetadata[]> {
    try {
      const q = query(
        collection(db, this.designsCollection),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.mapDocToMetadata(doc));
    } catch (error) {
      console.error('Error getting user designs:', error);
      throw error;
    }
  }

  /**
   * Get public designs
   */
  async getPublicDesigns(): Promise<DesignMetadata[]> {
    try {
      const q = query(
        collection(db, this.designsCollection),
        where('isPublic', '==', true),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => this.mapDocToMetadata(doc));
    } catch (error) {
      console.error('Error getting public designs:', error);
      throw error;
    }
  }

  /**
   * Subscribe to user's designs (real-time updates)
   */
  subscribeToUserDesigns(
    userId: string,
    onUpdate: (designs: DesignMetadata[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const q = query(
      collection(db, this.designsCollection),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const designs = snapshot.docs.map(doc => this.mapDocToMetadata(doc));
        onUpdate(designs);
      },
      (error) => {
        console.error('Design subscription error:', error);
        onError?.(error);
      }
    );
    
    this.unsubscribeDesigns = unsubscribe;
    return unsubscribe;
  }

  /**
   * Delete design
   */
  async deleteDesign(designId: string, userId: string): Promise<void> {
    try {
      const docRef = doc(db, this.designsCollection, designId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Design not found');
      }
      
      const data = docSnap.data();
      
      // Verify ownership
      if (data.userId !== userId) {
        throw new Error('Permission denied');
      }
      
      // Delete from Storage
      try {
        const storageRef = ref(storage, `weave_designs/${userId}/${designId}.json`);
        await deleteObject(storageRef);
      } catch (storageError) {
        console.warn('Could not delete storage file:', storageError);
      }
      
      // Delete from Firestore
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting design:', error);
      throw error;
    }
  }

  /**
   * Update design name/description/tags
   */
  async updateDesignMetadata(
    designId: string,
    userId: string,
    updates: {
      name?: string;
      description?: string;
      tags?: string[];
      isPublic?: boolean;
    }
  ): Promise<void> {
    try {
      const docRef = doc(db, this.designsCollection, designId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Design not found');
      }
      
      const data = docSnap.data();
      
      // Verify ownership
      if (data.userId !== userId) {
        throw new Error('Permission denied');
      }
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating design metadata:', error);
      throw error;
    }
  }

  /**
   * Duplicate design
   */
  async duplicateDesign(
    designId: string,
    userId: string,
    newName: string
  ): Promise<string> {
    try {
      const original = await this.loadDesign(designId);
      
      if (!original) {
        throw new Error('Design not found');
      }
      
      return await this.saveDesign(original.data, {
        name: newName,
        description: original.description,
        userId,
        tags: original.tags,
        isPublic: false
      });
    } catch (error) {
      console.error('Error duplicating design:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from all listeners
   */
  unsubscribeAll(): void {
    if (this.unsubscribeDesigns) {
      this.unsubscribeDesigns();
      this.unsubscribeDesigns = null;
    }
  }

  /**
   * Helper: Map Firestore document to DesignMetadata
   */
  private mapDocToMetadata(doc: any): DesignMetadata {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      description: data.description,
      userId: data.userId,
      userEmail: data.userEmail,
      version: data.version,
      storageUrl: data.storageUrl,
      thumbnailUrl: data.thumbnailUrl,
      tags: data.tags || [],
      isPublic: data.isPublic || false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      componentCount: data.componentCount || 0,
      connectionCount: data.connectionCount || 0,
      pageCount: data.pageCount || 1
    };
  }
}

// Export singleton instance
export const firebaseDesignService = new FirebaseDesignService();
