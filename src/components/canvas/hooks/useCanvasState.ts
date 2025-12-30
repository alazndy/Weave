import { useState } from 'react';
import { Point, ToolSettings, AlignmentGuide, PortDefinition } from '../../../types';

export interface CanvasState {
  // Grid & Display
  isGridSnapEnabled: boolean;
  setIsGridSnapEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  isMinimapVisible: boolean;
  setIsMinimapVisible: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Tool Settings
  toolSettings: ToolSettings;
  setToolSettings: React.Dispatch<React.SetStateAction<ToolSettings>>;
  handleUpdateToolSettings: (category: keyof ToolSettings, key: string, value: any) => void;

  // Interaction: Connection
  connectingStart: { instanceId: string; portId: string } | null;
  setConnectingStart: React.Dispatch<React.SetStateAction<{ instanceId: string; portId: string } | null>>;
  manualRoutePoints: Point[];
  setManualRoutePoints: React.Dispatch<React.SetStateAction<Point[]>>;
  hoveredConnectionId: string | null;
  setHoveredConnectionId: React.Dispatch<React.SetStateAction<string | null>>;

  // Interaction: Drag/Pan
  isMiddlePanning: boolean;
  setIsMiddlePanning: React.Dispatch<React.SetStateAction<boolean>>;
  draggedInstance: string | null;
  setDraggedInstance: React.Dispatch<React.SetStateAction<string | null>>;
  dragOffset: { x: number; y: number };
  setDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  alignmentGuides: AlignmentGuide[];
  setAlignmentGuides: React.Dispatch<React.SetStateAction<AlignmentGuide[]>>;

  // Interaction: Tools
  selectionBox: { startX: number; startY: number; currentX: number; currentY: number } | null;
  setSelectionBox: React.Dispatch<React.SetStateAction<{ startX: number; startY: number; currentX: number; currentY: number } | null>>;
  drawingZone: { startX: number; startY: number; currentX: number; currentY: number } | null;
  setDrawingZone: React.Dispatch<React.SetStateAction<{ startX: number; startY: number; currentX: number; currentY: number } | null>>;
  
  // Interaction: Transform
  rotatingInstance: string | null;
  setRotatingInstance: React.Dispatch<React.SetStateAction<string | null>>;
  resizingTarget: { id: string; type: 'instance' | 'zone'; startW: number; startH: number; startX: number; startY: number } | null;
  setResizingTarget: React.Dispatch<React.SetStateAction<{ id: string; type: 'instance' | 'zone'; startW: number; startH: number; startX: number; startY: number } | null>>;

  // Interaction: Edit Modals & Menus
  editingConnectionId: string | null;
  setEditingConnectionId: React.Dispatch<React.SetStateAction<string | null>>;
  editingPortData: { port: PortDefinition; templateId: string } | null;
  setEditingPortData: React.Dispatch<React.SetStateAction<{ port: PortDefinition; templateId: string } | null>>;
  editingZoneId: string | null;
  setEditingZoneId: React.Dispatch<React.SetStateAction<string | null>>;
  editingTextId: string | null;
  setEditingTextId: React.Dispatch<React.SetStateAction<string | null>>;
  contextMenu: { x: number; y: number; instanceId: string } | null;
  setContextMenu: React.Dispatch<React.SetStateAction<{ x: number; y: number; instanceId: string } | null>>;
}

export function useCanvasState(): CanvasState {
  const [isGridSnapEnabled, setIsGridSnapEnabled] = useState(true);
  const [isMinimapVisible, setIsMinimapVisible] = useState(true);
  
  const [toolSettings, setToolSettings] = useState<ToolSettings>({
      route: { color: '#6366f1', lineStyle: 'solid', strokeWidth: 'normal', cornerRadius: 10 },
      text: { fontSize: 16, color: '#ffffff' },
      zone: { color: '#10b981', labelPrefix: 'BÖLGE' },
      scale: { maintainAspectRatio: true }
  });

  const handleUpdateToolSettings = (category: keyof ToolSettings, key: string, value: any) => {
      setToolSettings(prev => ({
          ...prev,
          [category]: {
              ...prev[category],
              [key]: value
          }
      }));
  };

  const [connectingStart, setConnectingStart] = useState<{ instanceId: string; portId: string } | null>(null);
  const [manualRoutePoints, setManualRoutePoints] = useState<Point[]>([]);
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  
  const [isMiddlePanning, setIsMiddlePanning] = useState(false);
  const [draggedInstance, setDraggedInstance] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);
  
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [drawingZone, setDrawingZone] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);

  const [rotatingInstance, setRotatingInstance] = useState<string | null>(null);
  const [resizingTarget, setResizingTarget] = useState<{ id: string; type: 'instance' | 'zone'; startW: number; startH: number; startX: number; startY: number } | null>(null);

  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [editingPortData, setEditingPortData] = useState<{ port: PortDefinition; templateId: string } | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; instanceId: string } | null>(null);

  return {
    isGridSnapEnabled, setIsGridSnapEnabled,
    isMinimapVisible, setIsMinimapVisible,
    toolSettings, setToolSettings, handleUpdateToolSettings,
    connectingStart, setConnectingStart,
    manualRoutePoints, setManualRoutePoints,
    hoveredConnectionId, setHoveredConnectionId,
    isMiddlePanning, setIsMiddlePanning,
    draggedInstance, setDraggedInstance,
    dragOffset, setDragOffset,
    alignmentGuides, setAlignmentGuides,
    selectionBox, setSelectionBox,
    drawingZone, setDrawingZone,
    rotatingInstance, setRotatingInstance,
    resizingTarget, setResizingTarget,
    editingConnectionId, setEditingConnectionId,
    editingPortData, setEditingPortData,
    editingZoneId, setEditingZoneId,
    editingTextId, setEditingTextId,
    contextMenu, setContextMenu
  };
}
