import { useState, useEffect, useRef } from 'react';
import { LibraryMetadata, ProductTemplate } from '../types';

const STORAGE_KEY_TEMPLATES_LEGACY = 'techschematic_templates_v1';
const STORAGE_KEY_LIBRARIES_META = 'techschematic_libraries_meta';
const STORAGE_KEY_LIB_PREFIX = 'techschematic_library_';

export function useLibraryManager() {
  const [libraries, setLibraries] = useState<LibraryMetadata[]>([]);
  const [activeLibraryId, setActiveLibraryId] = useState<string>('');
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  
  // Track the ID of the library currently loaded in 'templates' state to prevent race conditions
  const lastLoadedLibraryId = useRef<string | null>(null);

  // Initialize Libraries (Migration Logic)
  useEffect(() => {
    try {
        const storedMeta = localStorage.getItem(STORAGE_KEY_LIBRARIES_META);
        
        if (storedMeta) {
            const parsedLibs = JSON.parse(storedMeta);
            if (parsedLibs.length > 0) {
                setLibraries(parsedLibs);
                setActiveLibraryId(parsedLibs[0].id);
                return;
            }
        }

        // Migration: No new libraries found, check for legacy data
        const legacyData = localStorage.getItem(STORAGE_KEY_TEMPLATES_LEGACY);
        const newLibId = crypto.randomUUID();
        const defaultLib: LibraryMetadata = {
            id: newLibId,
            name: 'Varsayılan Kütüphane',
            createdAt: new Date().toISOString()
        };

        const initialTemplates = legacyData ? JSON.parse(legacyData) : [];
        
        // Save new structure
        localStorage.setItem(STORAGE_KEY_LIBRARIES_META, JSON.stringify([defaultLib]));
        localStorage.setItem(`${STORAGE_KEY_LIB_PREFIX}${newLibId}`, JSON.stringify(initialTemplates));
        
        setLibraries([defaultLib]);
        setActiveLibraryId(newLibId);

    } catch (e) {
        console.error("Library initialization failed:", e);
        // Fallback
        const newId = crypto.randomUUID();
        const fallbackLib = { id: newId, name: 'Default', createdAt: new Date().toISOString() };
        setLibraries([fallbackLib]);
        setActiveLibraryId(newId);
    }
  }, []);

  // Load templates when active library changes
  useEffect(() => {
      if (!activeLibraryId) return;
      try {
          const data = localStorage.getItem(`${STORAGE_KEY_LIB_PREFIX}${activeLibraryId}`);
          const loadedTemplates = data ? JSON.parse(data) : [];
          setTemplates(loadedTemplates);
          lastLoadedLibraryId.current = activeLibraryId;
      } catch (e) {
          console.error("Failed to load library templates", e);
          setTemplates([]);
          lastLoadedLibraryId.current = activeLibraryId;
      }
  }, [activeLibraryId]);

  // Save templates whenever they change (to the active library)
  useEffect(() => {
      if (!activeLibraryId) return;

      // CRITICAL: Only save if the active library matches what we last loaded.
      if (activeLibraryId !== lastLoadedLibraryId.current) {
          return;
      }

      try {
          localStorage.setItem(`${STORAGE_KEY_LIB_PREFIX}${activeLibraryId}`, JSON.stringify(templates));
      } catch (e) {
          console.error("Failed to save templates", e);
      }
  }, [templates, activeLibraryId]);

  // Save library metadata whenever it changes
  useEffect(() => {
      if (libraries.length > 0) {
        localStorage.setItem(STORAGE_KEY_LIBRARIES_META, JSON.stringify(libraries));
      }
  }, [libraries]);

  // Handlers
  const handleCreateLibrary = (name: string) => {
      const newLib: LibraryMetadata = {
          id: crypto.randomUUID(),
          name: name.trim() || 'Yeni Kütüphane',
          createdAt: new Date().toISOString()
      };
      setLibraries(prev => [...prev, newLib]);
      setActiveLibraryId(newLib.id);
      localStorage.setItem(`${STORAGE_KEY_LIB_PREFIX}${newLib.id}`, JSON.stringify([]));
  };

  const handleDeleteLibrary = (id: string) => {
      if (libraries.length <= 1) {
          alert("En az bir kütüphane kalmalıdır.");
          return;
      }
      if (!confirm("Bu kütüphaneyi ve içindeki tüm ürünleri silmek istediğinize emin misiniz?")) return;

      const newLibs = libraries.filter(l => l.id !== id);
      setLibraries(newLibs);
      localStorage.removeItem(`${STORAGE_KEY_LIB_PREFIX}${id}`);

      if (activeLibraryId === id) {
          setActiveLibraryId(newLibs[0].id);
      }
  };

  const handleRenameLibrary = (id: string, newName: string) => {
      setLibraries(prev => prev.map(l => l.id === id ? { ...l, name: newName } : l));
  };
  
  const handleSwitchLibrary = (id: string) => {
      setActiveLibraryId(id);
  };

  return {
      libraries,
      activeLibraryId,
      templates,
      setTemplates,
      handleCreateLibrary,
      handleDeleteLibrary,
      handleRenameLibrary,
      handleSwitchLibrary
  };
}