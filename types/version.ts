// Version Control Types for Weave

export interface ProjectVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  label?: string; // e.g., "v1.0", "Release Candidate"
  isTagged: boolean; // Milestone/tag marker
  commitMessage: string;
  createdBy: string;
  createdByName?: string;
  snapshot: string; // JSON stringified ProjectData
  parentVersionId?: string;
  branchName?: string; // For future branching support
  createdAt: Date;
}

export interface VersionDiff {
  versionAId: string;
  versionBId: string;
  changes: {
    type: 'added' | 'modified' | 'deleted';
    elementType: 'instance' | 'connection' | 'template' | 'zone' | 'text' | 'comment' | 'page';
    elementId: string;
    elementName?: string;
    details?: string;
  }[];
  summary: {
    added: number;
    modified: number;
    deleted: number;
  };
}

export interface AutoSaveConfig {
  enabled: boolean;
  intervalMs: number; // Default: 60000 (1 minute)
  maxAutoSaves: number; // Keep last N auto-saves
  lastAutoSaveAt?: Date;
}

export type VersionHistoryFilter = 'all' | 'tagged' | 'manual' | 'autosave';
