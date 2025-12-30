import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProductTemplate } from '../types';
import { uploadImageToStorage } from '../utils/imageCompressor';

// ENV-I Product type (simplified for sync purposes)
export interface InventoryProduct {
  id: string;
  name: string;
  description?: string;
  manufacturer: string;
  modelNumber?: string;
  partNumber?: string;
  barcode?: string;
  stock: number;
  price?: number;
  imageUrl?: string;
  externalId?: string;
  weaveTemplateId?: string;
  weaveConfigured?: boolean;
  weaveFileUrl?: string;
}

interface UseInventorySyncOptions {
  templates: ProductTemplate[];
  setTemplates: (templates: ProductTemplate[]) => void;
}

interface InventorySyncState {
  products: InventoryProduct[];
  isLoading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
}

export function useInventorySync({ templates, setTemplates }: UseInventorySyncOptions) {
  const [state, setState] = useState<InventorySyncState>({
    products: [],
    isLoading: false,
    error: null,
    lastSyncTime: null,
  });

  // Fetch all products from ENV-I Firestore
  const fetchProducts = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);
      
      const productsMap = new Map<string, InventoryProduct>();
      
      snapshot.docs.forEach(doc => {
        productsMap.set(doc.id, {
          id: doc.id,
          ...doc.data(),
        } as InventoryProduct);
      });
      
      const products = Array.from(productsMap.values());

      setState(prev => ({
        ...prev,
        products,
        isLoading: false,
        lastSyncTime: new Date(),
      }));

      return products;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Envanter yüklenirken hata oluştu',
      }));
      return [];
    }
  }, []);

  // Convert an ENV-I product to a basic ProductTemplate (unconfigured)
  const productToTemplate = useCallback((product: InventoryProduct): ProductTemplate => {
    return {
      id: crypto.randomUUID(),
      name: product.name,
      modelNumber: product.modelNumber,
      description: product.description,
      imageUrl: product.imageUrl || '', // Placeholder if no image
      width: 100, // Default size
      height: 80,
      ports: [], // No ports - unconfigured
      isConfigured: false,
      envInventoryId: product.id,
      externalId: product.externalId || product.id,
      stockCount: product.stock,
      weaveFileUrl: product.weaveFileUrl,
    };
  }, []);

  // Import a product from ENV-I as a template
  const importProductAsTemplate = useCallback((product: InventoryProduct) => {
    // Check if already imported
    const existing = templates.find(t => t.envInventoryId === product.id);
    if (existing) {
      console.log('Product already imported:', product.name);
      return existing;
    }

    const newTemplate = productToTemplate(product);
    setTemplates([...templates, newTemplate]);

    // Optionally update ENV-I with the weaveTemplateId reference
    // This creates bidirectional linking
    try {
      const productRef = doc(db, 'products', product.id);
      updateDoc(productRef, {
        weaveTemplateId: newTemplate.id,
        externalId: newTemplate.externalId,
      });
    } catch (error) {
      console.error('Failed to update ENV-I product:', error);
    }

    return newTemplate;
  }, [templates, setTemplates, productToTemplate]);

  // Get products that are not yet imported to Weave
  const getUnimportedProducts = useCallback(() => {
    const importedEnvIds = new Set(
      templates
        .filter(t => t.envInventoryId)
        .map(t => t.envInventoryId)
    );
    
    return state.products.filter(p => !importedEnvIds.has(p.id));
  }, [state.products, templates]);

  // Get products that are already imported
  const getImportedProducts = useCallback(() => {
    const importedEnvIds = new Set(
      templates
        .filter(t => t.envInventoryId)
        .map(t => t.envInventoryId)
    );
    
    return state.products.filter(p => importedEnvIds.has(p.id));
  }, [state.products, templates]);

  // Sync stock counts from ENV-I to templates
  const syncStockCounts = useCallback(() => {
    const productMap = new Map<string, InventoryProduct>(
      state.products.map(p => [p.id, p])
    );
    
    const updatedTemplates = templates.map(template => {
      if (template.envInventoryId) {
        const product = productMap.get(template.envInventoryId);
        if (product) {
          return { ...template, stockCount: product.stock, weaveFileUrl: product.weaveFileUrl };
        }
      }
      return template;
    });

    setTemplates(updatedTemplates);
  }, [state.products, templates, setTemplates]);

  // Save template configuration back to ENV-I
  const syncTemplateToEnv = useCallback(async (template: ProductTemplate) => {
    if (!template.envInventoryId) return;

    try {
      const productRef = doc(db, 'products', template.envInventoryId);
      await updateDoc(productRef, {
        weaveTemplateId: template.id,
        weaveConfigured: template.isConfigured ?? (template.ports.length > 0),
        imageUrl: template.imageUrl || null,
        // Also update weaveFileUrl if available (assuming template.imageUrl is the file for now, or explicit field)
        weaveFileUrl: template.weaveFileUrl || template.imageUrl || null
      });
    } catch (error) {
      console.error('Failed to sync template to ENV-I:', error);
    }
  }, []);

  return {
    ...state,
    fetchProducts,
    importProductAsTemplate,
    getUnimportedProducts,
    getImportedProducts,
    syncStockCounts,
    syncTemplateToEnv,
  };
}

// Standalone function for sending template to ENV-I (can be imported directly without hook)
export async function syncTemplateToEnv(template: ProductTemplate): Promise<{ success: boolean; error?: string }> {
  if (!template.envInventoryId) {
    return { success: false, error: "Bu şablon ENV-I'dan içe aktarılmadı." };
  }

  try {
    // Upload image to Firebase Storage instead of storing base64 in Firestore
    // This avoids the 1MB document size limit
    const imageUrl = await uploadImageToStorage(
      template.imageUrl || '',
      template.envInventoryId
    );
    
    const productRef = doc(db, 'products', template.envInventoryId);
    // Use setDoc with merge to create document if it doesn't exist, or update if it does
    await setDoc(productRef, {
      weaveTemplateId: template.id,
      weaveConfigured: template.isConfigured ?? (template.ports.length > 0),
      imageUrl: imageUrl || null,
      weaveFileUrl: template.weaveFileUrl || imageUrl || null,
      name: template.name || 'Unnamed Product',
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Failed to sync template to ENV-I:', error);
    return { success: false, error: String(error) };
  }
}
