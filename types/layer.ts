/**
 * Layer Types for Weave
 * Manages z-index ordering, visibility, and grouping of canvas elements
 */

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0-100
  color?: string; // Layer highlight color
  parentId?: string; // For layer groups
  order: number; // Z-order (higher = on top)
  collapsed?: boolean; // For groups
  
  // Associated element IDs
  elementIds: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface LayerGroup extends Layer {
  isGroup: true;
  children: Layer[];
}

export interface LayerState {
  layers: Layer[];
  selectedLayerId: string | null;
  activeLayerId: string | null; // Layer where new elements are added
}

// Default layers
export const DEFAULT_LAYERS: Omit<Layer, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Background',
    visible: true,
    locked: false,
    opacity: 100,
    color: '#64748b',
    order: 0,
    elementIds: [],
  },
  {
    name: 'Components',
    visible: true,
    locked: false,
    opacity: 100,
    color: '#3b82f6',
    order: 1,
    elementIds: [],
  },
  {
    name: 'Connections',
    visible: true,
    locked: false,
    opacity: 100,
    color: '#22c55e',
    order: 2,
    elementIds: [],
  },
  {
    name: 'Annotations',
    visible: true,
    locked: false,
    opacity: 100,
    color: '#f59e0b',
    order: 3,
    elementIds: [],
  },
];

// Layer actions
export type LayerAction = 
  | { type: 'ADD_LAYER'; payload: Partial<Layer> }
  | { type: 'REMOVE_LAYER'; payload: string }
  | { type: 'UPDATE_LAYER'; payload: { id: string; updates: Partial<Layer> } }
  | { type: 'REORDER_LAYERS'; payload: string[] }
  | { type: 'SELECT_LAYER'; payload: string | null }
  | { type: 'SET_ACTIVE_LAYER'; payload: string }
  | { type: 'TOGGLE_VISIBILITY'; payload: string }
  | { type: 'TOGGLE_LOCK'; payload: string }
  | { type: 'ADD_ELEMENT_TO_LAYER'; payload: { layerId: string; elementId: string } }
  | { type: 'REMOVE_ELEMENT_FROM_LAYER'; payload: { layerId: string; elementId: string } }
  | { type: 'MOVE_ELEMENT_TO_LAYER'; payload: { fromLayerId: string; toLayerId: string; elementId: string } };
