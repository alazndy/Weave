import { useState, useEffect, useRef } from 'react';
import { LibraryMetadata, ProductTemplate } from '../types';
import {
  loadLibraries, loadTemplates, saveLibraryMeta, saveTemplates, deleteLibraryData,
} from '../services/libraryStore';

export function useLibraryManager() {
  const [libraries, setLibraries] = useState<LibraryMetadata[]>([]);
  const [activeLibraryId, setActiveLibraryId] = useState<string>('');
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [libraryError, setLibraryError] = useState(false);

  // ID of the library whose templates are currently in `templates` (prevents writing
  // one library's products into another while switching).
  const lastLoadedLibraryId = useRef<string | null>(null);
  const metaLoaded = useRef(false);

  useEffect(() => {
    loadLibraries()
      .then(libs => {
        metaLoaded.current = true;
        setLibraries(libs);
        setActiveLibraryId(libs[0].id);
      })
      .catch(e => {
        console.error('Library initialization failed:', e);
        setLibraryError(true);
        const fallback = { id: crypto.randomUUID(), name: 'Default', createdAt: new Date().toISOString() };
        setLibraries([fallback]);
        setActiveLibraryId(fallback.id);
        lastLoadedLibraryId.current = fallback.id;
      });
  }, []);

  useEffect(() => {
    if (!activeLibraryId) return;
    let cancelled = false;
    loadTemplates(activeLibraryId)
      .catch(e => { console.error('Failed to load library templates', e); setLibraryError(true); return [] as ProductTemplate[]; })
      .then(loaded => {
        if (cancelled) return;
        lastLoadedLibraryId.current = activeLibraryId;
        setTemplates(loaded);
      });
    return () => { cancelled = true; };
  }, [activeLibraryId]);

  useEffect(() => {
    if (!activeLibraryId || activeLibraryId !== lastLoadedLibraryId.current) return;
    saveTemplates(activeLibraryId, templates)
      .then(() => setLibraryError(false))
      .catch(e => { console.error('Failed to save templates', e); setLibraryError(true); });
  }, [templates, activeLibraryId]);

  useEffect(() => {
    if (!metaLoaded.current || libraries.length === 0) return;
    saveLibraryMeta(libraries).catch(e => { console.error('Failed to save libraries', e); setLibraryError(true); });
  }, [libraries]);

  const handleCreateLibrary = (name: string) => {
    const newLib: LibraryMetadata = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Yeni Kütüphane',
      createdAt: new Date().toISOString(),
    };
    setLibraries(prev => [...prev, newLib]);
    setActiveLibraryId(newLib.id);
  };

  const handleDeleteLibrary = (id: string) => {
    if (libraries.length <= 1) {
      alert('En az bir kütüphane kalmalıdır.');
      return;
    }
    if (!confirm('Bu kütüphaneyi ve içindeki tüm ürünleri silmek istediğinize emin misiniz?')) return;

    const newLibs = libraries.filter(l => l.id !== id);
    setLibraries(newLibs);
    deleteLibraryData(id).catch(e => console.error('Failed to delete library data', e));
    if (activeLibraryId === id) setActiveLibraryId(newLibs[0].id);
  };

  const handleRenameLibrary = (id: string, newName: string) => {
    setLibraries(prev => prev.map(l => l.id === id ? { ...l, name: newName } : l));
  };

  const handleSwitchLibrary = (id: string) => setActiveLibraryId(id);

  return {
    libraries, activeLibraryId, templates, setTemplates, libraryError,
    handleCreateLibrary, handleDeleteLibrary, handleRenameLibrary, handleSwitchLibrary,
  };
}
