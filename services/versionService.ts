// Version Control Service for Weave

import type { ProjectData } from '../types';
import type { ProjectVersion, VersionDiff, AutoSaveConfig } from '../types/version';

// Local storage key for versions
const VERSIONS_KEY = 'weave_versions';
const AUTO_SAVE_KEY = 'weave_autosave_config';

interface VersionStore {
  versions: ProjectVersion[];
  lastVersionNumber: Record<string, number>; // projectId -> lastVersionNumber
}

// Generate unique ID
function generateId(): string {
  return `ver_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Get versions from localStorage
function getVersionStore(): VersionStore {
  try {
    const stored = localStorage.getItem(VERSIONS_KEY);
    return stored ? JSON.parse(stored) : { versions: [], lastVersionNumber: {} };
  } catch {
    return { versions: [], lastVersionNumber: {} };
  }
}

// Save versions to localStorage
function saveVersionStore(store: VersionStore): void {
  localStorage.setItem(VERSIONS_KEY, JSON.stringify(store));
}

// Get auto-save config
export function getAutoSaveConfig(): AutoSaveConfig {
  try {
    const stored = localStorage.getItem(AUTO_SAVE_KEY);
    return stored ? JSON.parse(stored) : {
      enabled: true,
      intervalMs: 60000,
      maxAutoSaves: 10,
    };
  } catch {
    return { enabled: true, intervalMs: 60000, maxAutoSaves: 10 };
  }
}

// Save auto-save config
export function updateAutoSaveConfig(config: Partial<AutoSaveConfig>): AutoSaveConfig {
  const current = getAutoSaveConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(updated));
  return updated;
}

// Create a new version
export function createVersion(
  projectId: string,
  projectData: ProjectData,
  commitMessage: string,
  createdBy: string,
  options?: {
    label?: string;
    isTagged?: boolean;
    isAutoSave?: boolean;
  }
): ProjectVersion {
  const store = getVersionStore();
  
  // Get next version number for this project
  const lastNumber = store.lastVersionNumber[projectId] || 0;
  const versionNumber = lastNumber + 1;
  
  const version: ProjectVersion = {
    id: generateId(),
    projectId,
    versionNumber,
    label: options?.label,
    isTagged: options?.isTagged || false,
    commitMessage: options?.isAutoSave ? `[Auto-save] ${commitMessage}` : commitMessage,
    createdBy,
    snapshot: JSON.stringify(projectData),
    createdAt: new Date(),
  };
  
  // Find parent version (previous version)
  const projectVersions = store.versions.filter(v => v.projectId === projectId);
  if (projectVersions.length > 0) {
    const sorted = projectVersions.sort((a, b) => b.versionNumber - a.versionNumber);
    version.parentVersionId = sorted[0].id;
  }
  
  store.versions.push(version);
  store.lastVersionNumber[projectId] = versionNumber;
  
  // If auto-save, clean up old auto-saves
  if (options?.isAutoSave) {
    const config = getAutoSaveConfig();
    const autoSaves = store.versions
      .filter(v => v.projectId === projectId && v.commitMessage.startsWith('[Auto-save]'))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (autoSaves.length > config.maxAutoSaves) {
      const toRemove = autoSaves.slice(config.maxAutoSaves);
      store.versions = store.versions.filter(v => !toRemove.some(r => r.id === v.id));
    }
  }
  
  saveVersionStore(store);
  return version;
}

// Get all versions for a project
export function getVersionHistory(
  projectId: string,
  filter?: 'all' | 'tagged' | 'manual' | 'autosave'
): ProjectVersion[] {
  const store = getVersionStore();
  let versions = store.versions.filter(v => v.projectId === projectId);
  
  if (filter === 'tagged') {
    versions = versions.filter(v => v.isTagged);
  } else if (filter === 'manual') {
    versions = versions.filter(v => !v.commitMessage.startsWith('[Auto-save]'));
  } else if (filter === 'autosave') {
    versions = versions.filter(v => v.commitMessage.startsWith('[Auto-save]'));
  }
  
  return versions.sort((a, b) => b.versionNumber - a.versionNumber);
}

// Get a specific version
export function getVersion(versionId: string): ProjectVersion | null {
  const store = getVersionStore();
  return store.versions.find(v => v.id === versionId) || null;
}

// Get the latest version
export function getLatestVersion(projectId: string): ProjectVersion | null {
  const versions = getVersionHistory(projectId);
  return versions[0] || null;
}

// Restore a version (returns the project data)
export function restoreVersion(versionId: string): ProjectData | null {
  const version = getVersion(versionId);
  if (!version) return null;
  
  try {
    return JSON.parse(version.snapshot) as ProjectData;
  } catch {
    return null;
  }
}

// Tag/untag a version
export function toggleVersionTag(versionId: string, label?: string): ProjectVersion | null {
  const store = getVersionStore();
  const index = store.versions.findIndex(v => v.id === versionId);
  
  if (index === -1) return null;
  
  store.versions[index].isTagged = !store.versions[index].isTagged;
  if (label) {
    store.versions[index].label = label;
  }
  
  saveVersionStore(store);
  return store.versions[index];
}

// Delete a version (except tagged ones)
export function deleteVersion(versionId: string): boolean {
  const store = getVersionStore();
  const version = store.versions.find(v => v.id === versionId);
  
  if (!version || version.isTagged) return false;
  
  store.versions = store.versions.filter(v => v.id !== versionId);
  saveVersionStore(store);
  return true;
}

// Compare two versions
export function compareVersions(versionAId: string, versionBId: string): VersionDiff | null {
  const versionA = getVersion(versionAId);
  const versionB = getVersion(versionBId);
  
  if (!versionA || !versionB) return null;
  
  try {
    const dataA = JSON.parse(versionA.snapshot) as ProjectData;
    const dataB = JSON.parse(versionB.snapshot) as ProjectData;
    
    const changes: VersionDiff['changes'] = [];
    
    // Compare templates
    const templateIdsA = new Set(dataA.templates.map(t => t.id));
    const templateIdsB = new Set(dataB.templates.map(t => t.id));
    
    dataB.templates.forEach(t => {
      if (!templateIdsA.has(t.id)) {
        changes.push({ type: 'added', elementType: 'template', elementId: t.id, elementName: t.name });
      }
    });
    
    dataA.templates.forEach(t => {
      if (!templateIdsB.has(t.id)) {
        changes.push({ type: 'deleted', elementType: 'template', elementId: t.id, elementName: t.name });
      }
    });
    
    // Compare pages
    const pageIdsA = new Set(dataA.pages.map(p => p.id));
    const pageIdsB = new Set(dataB.pages.map(p => p.id));
    
    dataB.pages.forEach(p => {
      if (!pageIdsA.has(p.id)) {
        changes.push({ type: 'added', elementType: 'page', elementId: p.id, elementName: p.name });
      } else {
        // Compare instances within pages
        const pageA = dataA.pages.find(pa => pa.id === p.id);
        if (pageA) {
          const instanceIdsA = new Set(pageA.instances.map(i => i.id));
          const instanceIdsB = new Set(p.instances.map(i => i.id));
          
          p.instances.forEach(i => {
            if (!instanceIdsA.has(i.id)) {
              changes.push({ type: 'added', elementType: 'instance', elementId: i.id });
            }
          });
          
          pageA.instances.forEach(i => {
            if (!instanceIdsB.has(i.id)) {
              changes.push({ type: 'deleted', elementType: 'instance', elementId: i.id });
            }
          });
          
          // Compare connections
          const connIdsA = new Set(pageA.connections.map(c => c.id));
          const connIdsB = new Set(p.connections.map(c => c.id));
          
          p.connections.forEach(c => {
            if (!connIdsA.has(c.id)) {
              changes.push({ type: 'added', elementType: 'connection', elementId: c.id });
            }
          });
          
          pageA.connections.forEach(c => {
            if (!connIdsB.has(c.id)) {
              changes.push({ type: 'deleted', elementType: 'connection', elementId: c.id });
            }
          });
        }
      }
    });
    
    dataA.pages.forEach(p => {
      if (!pageIdsB.has(p.id)) {
        changes.push({ type: 'deleted', elementType: 'page', elementId: p.id, elementName: p.name });
      }
    });
    
    return {
      versionAId,
      versionBId,
      changes,
      summary: {
        added: changes.filter(c => c.type === 'added').length,
        modified: changes.filter(c => c.type === 'modified').length,
        deleted: changes.filter(c => c.type === 'deleted').length,
      },
    };
  } catch {
    return null;
  }
}

// Clear all versions for a project
export function clearProjectVersions(projectId: string): void {
  const store = getVersionStore();
  store.versions = store.versions.filter(v => v.projectId !== projectId);
  delete store.lastVersionNumber[projectId];
  saveVersionStore(store);
}

// Export versions (for backup)
export function exportVersions(projectId: string): string {
  const versions = getVersionHistory(projectId);
  return JSON.stringify(versions, null, 2);
}

// Import versions (from backup)
export function importVersions(versionsJson: string): number {
  try {
    const imported = JSON.parse(versionsJson) as ProjectVersion[];
    const store = getVersionStore();
    
    let count = 0;
    imported.forEach(v => {
      if (!store.versions.some(existing => existing.id === v.id)) {
        store.versions.push(v);
        count++;
        
        // Update last version number
        const current = store.lastVersionNumber[v.projectId] || 0;
        if (v.versionNumber > current) {
          store.lastVersionNumber[v.projectId] = v.versionNumber;
        }
      }
    });
    
    saveVersionStore(store);
    return count;
  } catch {
    return 0;
  }
}
