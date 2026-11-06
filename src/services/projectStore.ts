/**
 * projectStore - local project persistence (IndexedDB).
 *
 * Projects embed base64 product images, so they routinely exceed the ~5MB
 * localStorage quota; IndexedDB has no such practical limit.
 */

import type { ProjectData } from '../types';

const DB_NAME = 'weave';
const DB_VERSION = 1;
const STORE = 'projects';
const RECENT_LIMIT = 20;

export interface StoredProject {
  id: string;
  name: string;
  updatedAt: string;
  data: ProjectData & { activePageId?: string };
}

export type RecentProject = Omit<StoredProject, 'data'>;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error);
      };
    });
  }
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(db => new Promise<T>((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

export async function saveProject(id: string, data: StoredProject['data']): Promise<void> {
  const record: StoredProject = {
    id,
    name: data.metadata.projectName || 'Adsız Proje',
    updatedAt: new Date().toISOString(),
    data,
  };
  await run('readwrite', store => store.put(record));
  await pruneOld();
}

export function loadProject(id: string): Promise<StoredProject | undefined> {
  return run('readonly', store => store.get(id) as IDBRequest<StoredProject | undefined>);
}

export function deleteProject(id: string): Promise<undefined> {
  return run('readwrite', store => store.delete(id));
}

export async function listRecentProjects(): Promise<RecentProject[]> {
  const all = await run('readonly', store => store.getAll() as IDBRequest<StoredProject[]>);
  return all
    .map(({ id, name, updatedAt }) => ({ id, name, updatedAt }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function pruneOld(): Promise<void> {
  const recent = await listRecentProjects();
  await Promise.all(recent.slice(RECENT_LIMIT).map(p => deleteProject(p.id)));
}
