/**
 * libraryStore - product library persistence (IndexedDB).
 *
 * Product templates embed base64 images; a single photo easily exceeds the
 * ~5MB localStorage quota, so libraries live in IndexedDB. Data written by
 * older versions in localStorage is migrated on first load.
 */

import type { LibraryMetadata, ProductTemplate } from '../types';

const DB_NAME = 'weave-library';
const STORE = 'kv';
const META_KEY = 'meta';
const libKey = (id: string) => `lib:${id}`;

const LS_META = 'techschematic_libraries_meta';
const LS_LIB_PREFIX = 'techschematic_library_';
const LS_LEGACY = 'techschematic_templates_v1';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => { dbPromise = null; reject(req.error); };
    });
  }
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(db => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}

const get = <T>(key: string) => run<T | undefined>('readonly', s => s.get(key));
const put = (key: string, value: unknown) => run('readwrite', s => s.put(value, key));
const del = (key: string) => run('readwrite', s => s.delete(key));

export const saveLibraryMeta = (libs: LibraryMetadata[]) => put(META_KEY, libs);
export const loadTemplates = async (id: string) => (await get<ProductTemplate[]>(libKey(id))) ?? [];
export const saveTemplates = (id: string, templates: ProductTemplate[]) => put(libKey(id), templates);
export const deleteLibraryData = (id: string) => del(libKey(id));

const readJson = <T>(key: string): T | null => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : null; } catch { return null; }
};

/** Loads all library metadata, migrating localStorage data or creating a default library. */
export async function loadLibraries(): Promise<LibraryMetadata[]> {
  const stored = await get<LibraryMetadata[]>(META_KEY);
  if (stored && stored.length > 0) return stored;

  const legacyMeta = readJson<LibraryMetadata[]>(LS_META);
  if (legacyMeta && legacyMeta.length > 0) {
    for (const lib of legacyMeta) {
      await saveTemplates(lib.id, readJson<ProductTemplate[]>(LS_LIB_PREFIX + lib.id) ?? []);
    }
    await saveLibraryMeta(legacyMeta);
    try {
      legacyMeta.forEach(l => localStorage.removeItem(LS_LIB_PREFIX + l.id));
      localStorage.removeItem(LS_META);
    } catch { /* ignore */ }
    return legacyMeta;
  }

  const lib: LibraryMetadata = { id: crypto.randomUUID(), name: 'Varsayılan Kütüphane', createdAt: new Date().toISOString() };
  await saveTemplates(lib.id, readJson<ProductTemplate[]>(LS_LEGACY) ?? []);
  await saveLibraryMeta([lib]);
  return [lib];
}
