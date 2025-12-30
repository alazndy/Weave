// Cloud Sync Service for Weave

import type { ProjectData } from '../types';
import type { 
  CloudProject, 
  SyncState, 
  SyncConflict, 
  OfflineAction, 
  SyncSettings 
} from '../types/cloud-sync';

// Storage keys
const SYNC_STATE_KEY = 'weave_sync_state';
const OFFLINE_QUEUE_KEY = 'weave_offline_queue';
const SYNC_SETTINGS_KEY = 'weave_sync_settings';
const CLOUD_PROJECTS_KEY = 'weave_cloud_projects';

// Generate unique ID
function generateId(): string {
  return `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Default sync settings
const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  autoSync: true,
  syncIntervalMs: 30000,
  offlineMode: false,
  maxOfflineActions: 100,
  conflictResolution: 'ask',
};

// Get sync settings
export function getSyncSettings(): SyncSettings {
  try {
    const stored = localStorage.getItem(SYNC_SETTINGS_KEY);
    return stored ? { ...DEFAULT_SYNC_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SYNC_SETTINGS;
  } catch {
    return DEFAULT_SYNC_SETTINGS;
  }
}

// Update sync settings
export function updateSyncSettings(settings: Partial<SyncSettings>): SyncSettings {
  const current = getSyncSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

// Get current sync state
export function getSyncState(projectId: string): SyncState {
  try {
    const stored = localStorage.getItem(`${SYNC_STATE_KEY}_${projectId}`);
    return stored ? JSON.parse(stored) : {
      status: 'offline',
      pendingChanges: 0,
    };
  } catch {
    return { status: 'offline', pendingChanges: 0 };
  }
}

// Update sync state
export function updateSyncState(projectId: string, state: Partial<SyncState>): SyncState {
  const current = getSyncState(projectId);
  const updated = { ...current, ...state };
  localStorage.setItem(`${SYNC_STATE_KEY}_${projectId}`, JSON.stringify(updated));
  return updated;
}

// Get offline action queue
export function getOfflineQueue(projectId: string): OfflineAction[] {
  try {
    const stored = localStorage.getItem(`${OFFLINE_QUEUE_KEY}_${projectId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Add action to offline queue
export function queueOfflineAction(
  projectId: string,
  action: 'create' | 'update' | 'delete',
  data: any
): OfflineAction {
  const queue = getOfflineQueue(projectId);
  const settings = getSyncSettings();
  
  const offlineAction: OfflineAction = {
    id: generateId(),
    projectId,
    action,
    data,
    timestamp: new Date(),
    retryCount: 0,
  };
  
  // Limit queue size
  if (queue.length >= settings.maxOfflineActions) {
    queue.shift(); // Remove oldest
  }
  
  queue.push(offlineAction);
  localStorage.setItem(`${OFFLINE_QUEUE_KEY}_${projectId}`, JSON.stringify(queue));
  
  // Update pending changes count
  updateSyncState(projectId, { pendingChanges: queue.length });
  
  return offlineAction;
}

// Remove action from queue (after successful sync)
export function removeFromOfflineQueue(projectId: string, actionId: string): void {
  const queue = getOfflineQueue(projectId);
  const filtered = queue.filter(a => a.id !== actionId);
  localStorage.setItem(`${OFFLINE_QUEUE_KEY}_${projectId}`, JSON.stringify(filtered));
  updateSyncState(projectId, { pendingChanges: filtered.length });
}

// Clear offline queue
export function clearOfflineQueue(projectId: string): void {
  localStorage.removeItem(`${OFFLINE_QUEUE_KEY}_${projectId}`);
  updateSyncState(projectId, { pendingChanges: 0 });
}

// Simulate cloud project list (in real implementation, this would call Firebase/API)
export function getCloudProjects(): CloudProject[] {
  try {
    const stored = localStorage.getItem(CLOUD_PROJECTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save cloud project (mock)
export function saveCloudProject(project: CloudProject): void {
  const projects = getCloudProjects();
  const index = projects.findIndex(p => p.id === project.id);
  
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.push(project);
  }
  
  localStorage.setItem(CLOUD_PROJECTS_KEY, JSON.stringify(projects));
}

// Upload project to cloud (mock implementation)
export async function uploadProject(
  projectId: string,
  projectData: ProjectData,
  userId: string
): Promise<CloudProject> {
  const settings = getSyncSettings();
  
  if (settings.offlineMode) {
    queueOfflineAction(projectId, 'update', projectData);
    throw new Error('Offline mode enabled');
  }
  
  updateSyncState(projectId, { status: 'syncing' });
  
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const now = new Date();
    const cloudProject: CloudProject = {
      id: projectId,
      localId: projectId,
      name: projectData.metadata.projectName,
      ownerId: userId,
      sharedWith: [],
      lastModifiedBy: userId,
      lastModifiedAt: now,
      version: (getSyncState(projectId).lastSyncedVersion || 0) + 1,
      sizeBytes: JSON.stringify(projectData).length,
      createdAt: now,
    };
    
    saveCloudProject(cloudProject);
    
    updateSyncState(projectId, {
      status: 'synced',
      lastSyncedAt: now,
      lastSyncedVersion: cloudProject.version,
      pendingChanges: 0,
      error: undefined,
    });
    
    // Clear offline queue after successful sync
    clearOfflineQueue(projectId);
    
    return cloudProject;
  } catch (error: any) {
    updateSyncState(projectId, {
      status: 'error',
      error: error.message,
    });
    throw error;
  }
}

// Download project from cloud (mock implementation)
export async function downloadProject(cloudProjectId: string): Promise<{ project: CloudProject; data: ProjectData } | null> {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const projects = getCloudProjects();
    const cloudProject = projects.find(p => p.id === cloudProjectId);
    
    if (!cloudProject) return null;
    
    // In real implementation, fetch actual project data
    // For now, return a placeholder
    const data: ProjectData = {
      metadata: {
        projectName: cloudProject.name,
        companyName: '',
        companyLogo: null,
        preparedBy: '',
        approvedBy: '',
        documentNo: '',
        scale: '1:1',
        pixelScale: 1,
        paperSize: 'A4',
        orientation: 'landscape',
        revision: '1',
        date: new Date().toISOString().split('T')[0],
        customFields: [],
        externalParts: [],
      },
      pages: [],
      templates: [],
      version: '1.0.0',
    };
    
    return { project: cloudProject, data };
  } catch (error) {
    console.error('Download error:', error);
    return null;
  }
}

// Check for conflicts
export function checkForConflicts(
  projectId: string,
  localVersion: number,
  remoteVersion: number
): SyncConflict | null {
  if (localVersion !== remoteVersion && localVersion > 0 && remoteVersion > 0) {
    return {
      id: generateId(),
      projectId,
      localVersion,
      remoteVersion,
      localSnapshot: '', // Would be populated with actual data
      remoteSnapshot: '',
      detectedAt: new Date(),
    };
  }
  return null;
}

// Resolve conflict
export function resolveConflict(
  conflict: SyncConflict,
  resolution: 'local' | 'remote' | 'merge'
): SyncConflict {
  return {
    ...conflict,
    resolution,
    resolvedAt: new Date(),
  };
}

// Process offline queue (sync pending changes)
export async function processOfflineQueue(projectId: string, userId: string): Promise<number> {
  const queue = getOfflineQueue(projectId);
  let processed = 0;
  
  for (const action of queue) {
    try {
      // In real implementation, send to server
      await new Promise(resolve => setTimeout(resolve, 100));
      
      removeFromOfflineQueue(projectId, action.id);
      processed++;
    } catch (error) {
      // Update retry count
      const updatedQueue = getOfflineQueue(projectId);
      const item = updatedQueue.find(a => a.id === action.id);
      if (item) {
        item.retryCount++;
        localStorage.setItem(`${OFFLINE_QUEUE_KEY}_${projectId}`, JSON.stringify(updatedQueue));
      }
    }
  }
  
  return processed;
}

// Check if online
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// Listen for online/offline events
export function setupConnectivityListener(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
