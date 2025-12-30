// Cloud Sync Hook for Weave

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ProjectData } from '../types';
import type { CloudProject, SyncState, SyncSettings } from '../types/cloud-sync';
import * as cloudSyncService from '../services/cloudSyncService';

interface UseCloudSyncOptions {
  projectId: string;
  userId: string;
}

interface UseCloudSyncReturn {
  // State
  syncState: SyncState;
  cloudProjects: CloudProject[];
  settings: SyncSettings;
  isOnline: boolean;
  pendingChanges: number;
  
  // Actions
  sync: (projectData: ProjectData) => Promise<CloudProject>;
  download: (cloudProjectId: string) => Promise<ProjectData | null>;
  forceSync: () => Promise<void>;
  setOfflineMode: (enabled: boolean) => void;
  updateSettings: (settings: Partial<SyncSettings>) => void;
  
  // Status
  getStatusMessage: () => string;
  getStatusColor: () => 'green' | 'yellow' | 'red' | 'gray';
}

export function useCloudSync(options: UseCloudSyncOptions): UseCloudSyncReturn {
  const { projectId, userId } = options;
  
  const [syncState, setSyncState] = useState<SyncState>(() => 
    cloudSyncService.getSyncState(projectId)
  );
  const [cloudProjects, setCloudProjects] = useState<CloudProject[]>([]);
  const [settings, setSettings] = useState<SyncSettings>(() => 
    cloudSyncService.getSyncSettings()
  );
  const [isOnline, setIsOnline] = useState(() => cloudSyncService.isOnline());
  
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load cloud projects
  useEffect(() => {
    setCloudProjects(cloudSyncService.getCloudProjects());
  }, []);
  
  // Setup connectivity listener
  useEffect(() => {
    const cleanup = cloudSyncService.setupConnectivityListener(
      () => {
        setIsOnline(true);
        // Attempt to process offline queue when coming online
        if (settings.autoSync) {
          cloudSyncService.processOfflineQueue(projectId, userId);
        }
      },
      () => {
        setIsOnline(false);
        setSyncState(prev => ({ ...prev, status: 'offline' }));
      }
    );
    
    return cleanup;
  }, [projectId, userId, settings.autoSync]);
  
  // Auto-sync timer
  useEffect(() => {
    if (!settings.autoSync || settings.offlineMode) {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      return;
    }
    
    // Removed auto-sync interval to prevent unnecessary syncs
    // In production, this would be triggered by project changes
    
    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
    };
  }, [settings.autoSync, settings.offlineMode, settings.syncIntervalMs]);
  
  // Sync project
  const sync = useCallback(async (projectData: ProjectData): Promise<CloudProject> => {
    setSyncState(prev => ({ ...prev, status: 'syncing' }));
    
    try {
      const cloudProject = await cloudSyncService.uploadProject(projectId, projectData, userId);
      
      setSyncState({
        status: 'synced',
        lastSyncedAt: new Date(),
        lastSyncedVersion: cloudProject.version,
        pendingChanges: 0,
      });
      
      // Refresh cloud projects list
      setCloudProjects(cloudSyncService.getCloudProjects());
      
      return cloudProject;
    } catch (error: any) {
      setSyncState(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));
      throw error;
    }
  }, [projectId, userId]);
  
  // Download project
  const download = useCallback(async (cloudProjectId: string): Promise<ProjectData | null> => {
    try {
      const result = await cloudSyncService.downloadProject(cloudProjectId);
      return result?.data || null;
    } catch (error) {
      console.error('Download error:', error);
      return null;
    }
  }, []);
  
  // Force sync (process offline queue)
  const forceSync = useCallback(async () => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }
    
    setSyncState(prev => ({ ...prev, status: 'syncing' }));
    
    try {
      await cloudSyncService.processOfflineQueue(projectId, userId);
      
      const state = cloudSyncService.getSyncState(projectId);
      setSyncState(state);
    } catch (error: any) {
      setSyncState(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
      }));
    }
  }, [projectId, userId, isOnline]);
  
  // Set offline mode
  const setOfflineMode = useCallback((enabled: boolean) => {
    const updated = cloudSyncService.updateSyncSettings({ offlineMode: enabled });
    setSettings(updated);
    
    if (enabled) {
      setSyncState(prev => ({ ...prev, status: 'offline' }));
    }
  }, []);
  
  // Update settings
  const updateSettings = useCallback((newSettings: Partial<SyncSettings>) => {
    const updated = cloudSyncService.updateSyncSettings(newSettings);
    setSettings(updated);
  }, []);
  
  // Get status message
  const getStatusMessage = useCallback((): string => {
    switch (syncState.status) {
      case 'synced':
        return syncState.lastSyncedAt 
          ? `Synced ${formatTimeAgo(syncState.lastSyncedAt)}`
          : 'Synced';
      case 'syncing':
        return 'Syncing...';
      case 'pending':
        return `${syncState.pendingChanges} changes pending`;
      case 'conflict':
        return 'Sync conflict - action required';
      case 'offline':
        return settings.offlineMode ? 'Offline mode' : 'No connection';
      case 'error':
        return syncState.error || 'Sync error';
      default:
        return 'Unknown status';
    }
  }, [syncState, settings.offlineMode]);
  
  // Get status color
  const getStatusColor = useCallback((): 'green' | 'yellow' | 'red' | 'gray' => {
    switch (syncState.status) {
      case 'synced':
        return 'green';
      case 'syncing':
      case 'pending':
        return 'yellow';
      case 'conflict':
      case 'error':
        return 'red';
      case 'offline':
      default:
        return 'gray';
    }
  }, [syncState.status]);
  
  return {
    syncState,
    cloudProjects,
    settings,
    isOnline,
    pendingChanges: syncState.pendingChanges,
    sync,
    download,
    forceSync,
    setOfflineMode,
    updateSettings,
    getStatusMessage,
    getStatusColor,
  };
}

// Helper function
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
