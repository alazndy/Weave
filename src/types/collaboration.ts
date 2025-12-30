// Collaboration Types for Weave

export interface CollaboratorPresence {
  odatatype?: string;
  odataid?: string;
  userId: string;
  userName: string;
  userColor: string; // Assigned color for cursor/selection
  avatarUrl?: string;
  cursorPosition?: { x: number; y: number; pageId: string };
  selectedElements?: string[]; // IDs of selected elements
  lastActiveAt: Date;
  isOnline: boolean;
}

export interface CollaborationSession {
  id: string;
  projectId: string;
  hostUserId: string;
  participants: CollaboratorPresence[];
  isActive: boolean;
  startedAt: Date;
  endedAt?: Date;
}

export interface CollaborativeEdit {
  id: string;
  sessionId: string;
  userId: string;
  operationType: 'add' | 'update' | 'delete' | 'move' | 'connect';
  elementType: 'instance' | 'connection' | 'template' | 'zone' | 'text' | 'comment' | 'page';
  elementId: string;
  pageId: string;
  data: any; // The actual change data
  timestamp: Date;
  isLocal?: boolean; // Local change not yet synced
}

export interface ConflictResolution {
  id: string;
  conflictingEdits: CollaborativeEdit[];
  resolvedBy: string;
  resolution: 'accept_local' | 'accept_remote' | 'merge' | 'discard';
  resolvedAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  content: string;
  replyToId?: string;
  mentions?: string[]; // User IDs
  attachmentUrl?: string;
  createdAt: Date;
  isRead: boolean;
}

export const COLLABORATOR_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#EC4899', // Pink
];
