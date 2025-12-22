// Version Control Hook for Weave

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ProjectData } from '../types';
import type { ProjectVersion, AutoSaveConfig, VersionHistoryFilter } from '../types/version';
import * as versionService from '../services/versionService';

interface UseVersionControlOptions {
  projectId: string;
  userId: string;
  autoSaveEnabled?: boolean;
}

interface UseVersionControlReturn {
  // State
  versions: ProjectVersion[];
  currentVersion: ProjectVersion | null;
  isLoading: boolean;
  isSaving: boolean;
  autoSaveConfig: AutoSaveConfig;
  lastSavedAt: Date | null;
  
  // Actions
  saveVersion: (projectData: ProjectData, message: string, options?: { label?: string; isTagged?: boolean }) => Promise<ProjectVersion>;
  restoreVersion: (versionId: string) => ProjectData | null;
  deleteVersion: (versionId: string) => boolean;
  toggleTag: (versionId: string, label?: string) => ProjectVersion | null;
  compareVersions: (versionAId: string, versionBId: string) => ReturnType<typeof versionService.compareVersions>;
  setFilter: (filter: VersionHistoryFilter) => void;
  updateAutoSaveConfig: (config: Partial<AutoSaveConfig>) => void;
  
  // Auto-save
  triggerAutoSave: (projectData: ProjectData) => void;
  enableAutoSave: () => void;
  disableAutoSave: () => void;
}

export function useVersionControl(options: UseVersionControlOptions): UseVersionControlReturn {
  const { projectId, userId, autoSaveEnabled = true } = options;
  
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<ProjectVersion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filter, setFilter] = useState<VersionHistoryFilter>('all');
  const [autoSaveConfig, setAutoSaveConfig] = useState<AutoSaveConfig>(
    versionService.getAutoSaveConfig()
  );
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProjectDataRef = useRef<string | null>(null);
  
  // Load version history
  const loadVersions = useCallback(() => {
    setIsLoading(true);
    try {
      const history = versionService.getVersionHistory(projectId, filter);
      setVersions(history);
      setCurrentVersion(history[0] || null);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, filter]);
  
  // Initial load
  useEffect(() => {
    loadVersions();
  }, [loadVersions]);
  
  // Save a new version
  const saveVersion = useCallback(async (
    projectData: ProjectData,
    message: string,
    opts?: { label?: string; isTagged?: boolean }
  ): Promise<ProjectVersion> => {
    setIsSaving(true);
    try {
      const version = versionService.createVersion(
        projectId,
        projectData,
        message,
        userId,
        opts
      );
      
      loadVersions();
      setLastSavedAt(new Date());
      lastProjectDataRef.current = JSON.stringify(projectData);
      
      return version;
    } finally {
      setIsSaving(false);
    }
  }, [projectId, userId, loadVersions]);
  
  // Restore a version
  const restoreVersion = useCallback((versionId: string): ProjectData | null => {
    return versionService.restoreVersion(versionId);
  }, []);
  
  // Delete a version
  const deleteVersion = useCallback((versionId: string): boolean => {
    const result = versionService.deleteVersion(versionId);
    if (result) {
      loadVersions();
    }
    return result;
  }, [loadVersions]);
  
  // Toggle tag
  const toggleTag = useCallback((versionId: string, label?: string): ProjectVersion | null => {
    const result = versionService.toggleVersionTag(versionId, label);
    if (result) {
      loadVersions();
    }
    return result;
  }, [loadVersions]);
  
  // Compare versions
  const compareVersions = useCallback((versionAId: string, versionBId: string) => {
    return versionService.compareVersions(versionAId, versionBId);
  }, []);
  
  // Update auto-save config
  const updateAutoSaveConfigHandler = useCallback((config: Partial<AutoSaveConfig>) => {
    const updated = versionService.updateAutoSaveConfig(config);
    setAutoSaveConfig(updated);
  }, []);
  
  // Auto-save logic
  const triggerAutoSave = useCallback((projectData: ProjectData) => {
    if (!autoSaveConfig.enabled) return;
    
    const dataStr = JSON.stringify(projectData);
    
    // Skip if no changes
    if (lastProjectDataRef.current === dataStr) return;
    
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Set new timer
    autoSaveTimerRef.current = setTimeout(() => {
      versionService.createVersion(
        projectId,
        projectData,
        'Auto-saved changes',
        userId,
        { isAutoSave: true }
      );
      
      lastProjectDataRef.current = dataStr;
      setLastSavedAt(new Date());
      loadVersions();
    }, autoSaveConfig.intervalMs);
  }, [projectId, userId, autoSaveConfig, loadVersions]);
  
  // Enable auto-save
  const enableAutoSave = useCallback(() => {
    updateAutoSaveConfigHandler({ enabled: true });
  }, [updateAutoSaveConfigHandler]);
  
  // Disable auto-save
  const disableAutoSave = useCallback(() => {
    updateAutoSaveConfigHandler({ enabled: false });
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, [updateAutoSaveConfigHandler]);
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);
  
  return {
    versions,
    currentVersion,
    isLoading,
    isSaving,
    autoSaveConfig,
    lastSavedAt,
    saveVersion,
    restoreVersion,
    deleteVersion,
    toggleTag,
    compareVersions,
    setFilter,
    updateAutoSaveConfig: updateAutoSaveConfigHandler,
    triggerAutoSave,
    enableAutoSave,
    disableAutoSave,
  };
}
