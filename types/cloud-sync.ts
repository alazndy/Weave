// Cloud Sync Types for Weave

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'conflict' | 'offline' | 'error';

export interface CloudProject {
  id: string;
  localId?: string; // Local project ID if linked
  name: string;
  thumbnailUrl?: string;
  ownerId: string;
  ownerName?: string;
  sharedWith: { userId: string; permission: 'view' | 'edit' }[];
  lastModifiedBy: string;
  lastModifiedAt: Date;
  version: number;
  sizeBytes: number;
  createdAt: Date;
}

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt?: Date;
  lastSyncedVersion?: number;
  pendingChanges: number;
  error?: string;
}

export interface SyncConflict {
  id: string;
  projectId: string;
  localVersion: number;
  remoteVersion: number;
  localSnapshot: string;
  remoteSnapshot: string;
  detectedAt: Date;
  resolvedAt?: Date;
  resolution?: 'local' | 'remote' | 'merge';
}

export interface OfflineAction {
  id: string;
  projectId: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  retryCount: number;
}

export interface SyncSettings {
  autoSync: boolean;
  syncIntervalMs: number; // Default: 30000 (30 seconds)
  offlineMode: boolean;
  maxOfflineActions: number; // Queue limit
  conflictResolution: 'ask' | 'prefer_local' | 'prefer_remote';
}
