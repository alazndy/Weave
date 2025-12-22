import { useState, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { ProjectData } from '../types';

export interface UPHProject {
  id: string;
  name: string;
  description?: string;
}

export function useUPHSync() {
  const [projects, setProjects] = useState<UPHProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'projects'));
      const fetched = snapshot.docs.map(d => ({
        id: d.id,
        name: d.data().name,
        description: d.data().description
      }));
      setProjects(fetched);
    } catch (error) {
      console.error("Error fetching UPH projects:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDesign = async (projectId: string, projectData: ProjectData, designName: string, thumbnailDataUrl?: string) => {
    setUploading(true);
    try {
      // 1. Upload File to Storage (JSON)
      const jsonString = JSON.stringify(projectData);
      const fileName = `weave-designs/${projectId}/${Date.now()}_${designName.replace(/\s+/g, '_')}.weave`;
      const storageRef = ref(storage, fileName);
      
      await uploadString(storageRef, jsonString, 'raw', { contentType: 'application/json' });
      const downloadUrl = await getDownloadURL(storageRef);

      // 1b. Upload Thumbnail (if provided)
      let thumbnailUrl = '';
      if (thumbnailDataUrl) {
          const thumbName = `weave-designs/${projectId}/${Date.now()}_${designName.replace(/\s+/g, '_')}_thumb.png`;
          const thumbRef = ref(storage, thumbName);
          await uploadString(thumbRef, thumbnailDataUrl, 'data_url');
          thumbnailUrl = await getDownloadURL(thumbRef);
      }

      // 2. Update Firestore Project
      const projectRef = doc(db, 'projects', projectId);
      const designEntry = {
        id: crypto.randomUUID(),
        name: String(designName || 'Untitled'),
        fileUrl: String(downloadUrl || ''),
        thumbnailUrl: String(thumbnailUrl || ''),
        uploadedAt: new Date().toISOString(),
        pageCount: Number(projectData?.pages?.length || 0),
        componentCount: Number(projectData?.pages?.reduce((acc, p) => acc + (p?.instances?.length || 0), 0) || 0),
      };

      // Verify no undefined
      if (Object.values(designEntry).some(v => v === undefined)) {
          console.error("Design Entry contains undefined:", designEntry);
          throw new Error("Invalid design entry data");
      }

      await updateDoc(projectRef, {
        weaveDesigns: arrayUnion(designEntry)
      });

      return true;
    } catch (error) {
      console.error("Error uploading design:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return {
    projects,
    loading,
    uploading,
    fetchProjects,
    uploadDesign
  };
}
