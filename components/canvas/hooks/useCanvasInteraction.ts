import React, { useCallback } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import { 
  ProjectMetadata, ProductInstance, Connection, ProductTemplate, Zone, TextNode, Comment 
} from '../../../types';
import { snapToGrid, calculateSnapGuides } from '../../../utils/canvasHelpers';
import { ActiveTool } from '../CanvasToolbar';
import { CanvasState } from './useCanvasState';

interface UseCanvasInteractionProps {
  // Data State
  instances: ProductInstance[];
  connections: Connection[];
  templates: ProductTemplate[];
  zones: Zone[];
  textNodes: TextNode[];
  comments: Comment[];
  projectMetadata?: ProjectMetadata;
  selectedIds: Set<string>;

  // Callbacks
  onInstancesChange: (instances: ProductInstance[]) => void;
  onConnectionsChange: (connections: Connection[]) => void;
  onZonesChange?: (zones: Zone[]) => void;
  onTextNodesChange?: (textNodes: TextNode[]) => void;
  onCommentsChange?: (comments: Comment[]) => void;
  onSelectIds?: (ids: string[], multi: boolean) => void;
  onUndoCheckpoint: () => void;
  onSetActiveTool: (tool: ActiveTool) => void;
  
  // UI State
  canvasState: CanvasState;
  activeTool: ActiveTool;
  scale: number;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function useCanvasInteraction({
  instances, connections, templates, zones, textNodes, comments, projectMetadata, selectedIds,
  onInstancesChange, onConnectionsChange, onZonesChange, onTextNodesChange, onCommentsChange, onSelectIds, onUndoCheckpoint, onSetActiveTool,
  canvasState, activeTool, scale, setPan, containerRef
}: UseCanvasInteractionProps) {

  const {
      isGridSnapEnabled, toolSettings,
      connectingStart, setConnectingStart,
      setManualRoutePoints,
      setIsMiddlePanning, isMiddlePanning,
      draggedInstance, setDraggedInstance,
      dragOffset, setDragOffset,
      setAlignmentGuides,
      selectionBox, setSelectionBox,
      drawingZone, setDrawingZone,
      rotatingInstance, setRotatingInstance,
      resizingTarget, setResizingTarget,
      setContextMenu
  } = canvasState;

  // Coordinate Helpers
  const getMouseCoords = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };
  }, [scale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle Mouse Button PAN Logic
    if (e.button === 1) {
        e.preventDefault();
        setIsMiddlePanning(true);
        return;
    }

    // Context Menu Check
    if (e.button === 2) {
        if (activeTool === 'manual-route') {
            setConnectingStart(null);
            setManualRoutePoints([]);
            return;
        }
        return; 
    }

    const { x, y } = getMouseCoords(e);

    switch (activeTool) {
        case 'manual-route':
             if (connectingStart) {
                 // Add waypoint
                 let pX = x;
                 let pY = y;
                 if (isGridSnapEnabled) {
                     pX = snapToGrid(pX);
                     pY = snapToGrid(pY);
                 }
                 setManualRoutePoints(prev => [...prev, { x: pX, y: pY }]);
             }
             break;

        case 'select-box':
            setSelectionBox({ startX: x, startY: y, currentX: x, currentY: y });
            break;

        case 'zone':
            setDrawingZone({ startX: x, startY: y, currentX: x, currentY: y });
            break;

        case 'text':
            if (onTextNodesChange) {
                onUndoCheckpoint();
                const newText: TextNode = {
                    id: crypto.randomUUID(),
                    content: 'Metin',
                    x, y, 
                    fontSize: toolSettings.text.fontSize, 
                    color: toolSettings.text.color
                };
                onTextNodesChange([...textNodes, newText]);
                onSetActiveTool('cursor');
            }
            break;

        case 'comment':
            if (onCommentsChange) {
                onUndoCheckpoint();
                const newComment: Comment = {
                    id: crypto.randomUUID(),
                    x, y, content: '', color: '#facc15', timestamp: new Date().toLocaleTimeString()
                };
                onCommentsChange([...comments, newComment]);
                onSetActiveTool('cursor');
            }
            break;

        case 'cursor':
        case 'scale':
        case 'move':
            if (e.target === e.currentTarget && onSelectIds) {
                onSelectIds([], false);
            }
            break;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
     if (isMiddlePanning) {
         setPan(prev => ({
             x: prev.x + e.movementX,
             y: prev.y + e.movementY
         }));
         return;
     }

     const { x, y } = getMouseCoords(e);

     // --- RESIZING LOGIC ---
     if (resizingTarget) {
         e.preventDefault();
         const dx = x - resizingTarget.startX;
         const dy = y - resizingTarget.startY;

         if (resizingTarget.type === 'instance') {
             // Use maintainAspectRatio setting for 'scale' tool if active, or default for drag resize
             const lockAspect = activeTool === 'scale' ? toolSettings.scale.maintainAspectRatio : true;
             
             const newW = Math.max(50, resizingTarget.startW + dx);
             let newH = resizingTarget.startH + dy;
             
             if (lockAspect) {
                 const aspectRatio = resizingTarget.startW / resizingTarget.startH;
                 newH = newW / aspectRatio;
             }
             newH = Math.max(50, newH);

             onInstancesChange(instances.map(i => i.id === resizingTarget.id ? { ...i, width: newW, height: newH } : i));
         } else if (resizingTarget.type === 'zone' && onZonesChange) {
             const newW = Math.max(50, resizingTarget.startW + dx);
             const newH = Math.max(50, resizingTarget.startH + dy);
             onZonesChange(zones.map(z => z.id === resizingTarget.id ? { ...z, width: newW, height: newH } : z));
         }
         return;
     }

     // --- ROTATING LOGIC ---
     if (rotatingInstance) {
         const inst = instances.find(i => i.id === rotatingInstance);
         if (inst) {
             const cx = inst.x + (inst.width || 100)/2;
             const cy = inst.y + (inst.height || 100)/2;
             const angle = Math.atan2(y - cy, x - cx) * (180 / Math.PI);
             const snappedAngle = Math.round(angle / 15) * 15;
             onInstancesChange(instances.map(i => i.id === rotatingInstance ? { ...i, rotation: snappedAngle + 90 } : i));
         }
         return;
     }

     // --- DRAGGING LOGIC ---
     if (draggedInstance) {
         let newX = x - dragOffset.x;
         let newY = y - dragOffset.y;

         if (isGridSnapEnabled) {
             newX = snapToGrid(newX);
             newY = snapToGrid(newY);
         } else {
             const inst = instances.find(i => i.id === draggedInstance);
             if (inst) {
                const t = templates.find(temp => temp.id === inst.templateId);
                const w = inst.width || t?.width || 100;
                const h = inst.height || t?.height || 100;
                const snapResult = calculateSnapGuides(draggedInstance, newX, newY, w, h, instances, templates);
                newX = snapResult.x;
                newY = snapResult.y;
                setAlignmentGuides(snapResult.guides);
             }
         }

         const moveItem = (id: string, dx: number, dy: number) => {
             const isSelected = selectedIds.has(id);
             const itemsToMove = isSelected ? selectedIds : new Set([id]);
             
             onInstancesChange(instances.map(i => itemsToMove.has(i.id) ? { ...i, x: i.x + dx, y: i.y + dy } : i));
             if (onZonesChange) onZonesChange(zones.map(z => itemsToMove.has(z.id) ? { ...z, x: z.x + dx, y: z.y + dy } : z));
             if (onTextNodesChange) onTextNodesChange(textNodes.map(t => itemsToMove.has(t.id) ? { ...t, x: t.x + dx, y: t.y + dy } : t));
             if (onCommentsChange) onCommentsChange(comments.map(c => itemsToMove.has(c.id) ? { ...c, x: c.x + dx, y: c.y + dy } : c));
         };

         const currentObj = 
            instances.find(i => i.id === draggedInstance) || 
            zones.find(z => z.id === draggedInstance) ||
            textNodes.find(t => t.id === draggedInstance) ||
            comments.find(c => c.id === draggedInstance);
            
         if (currentObj) {
             const dx = newX - currentObj.x;
             const dy = newY - currentObj.y;
             if (dx !== 0 || dy !== 0) {
                 moveItem(draggedInstance, dx, dy);
             }
         }
     }

     // --- SELECTION BOX ---
     if (selectionBox) {
         setSelectionBox({ ...selectionBox, currentX: x, currentY: y });
     }

     // --- ZONE DRAWING ---
     if (drawingZone) {
         setDrawingZone({ ...drawingZone, currentX: x, currentY: y });
     }
  };

  const handleMouseUp = () => {
      setIsMiddlePanning(false);
      setDraggedInstance(null);
      setRotatingInstance(null);
      setResizingTarget(null); // Clear resize
      setAlignmentGuides([]);
      
      if (selectionBox && onSelectIds) {
          const x1 = Math.min(selectionBox.startX, selectionBox.currentX);
          const y1 = Math.min(selectionBox.startY, selectionBox.currentY);
          const x2 = Math.max(selectionBox.startX, selectionBox.currentX);
          const y2 = Math.max(selectionBox.startY, selectionBox.currentY);
          
          const newSelectedIds: string[] = [];
          instances.forEach(i => {
              const t = templates.find(temp => temp.id === i.templateId);
              const w = i.width || t?.width || 0;
              const h = i.height || t?.height || 0;
              if (i.x >= x1 && i.x + w <= x2 && i.y >= y1 && i.y + h <= y2) {
                  newSelectedIds.push(i.id);
              }
          });
          zones.forEach(z => {
              if (z.x >= x1 && z.x + z.width <= x2 && z.y >= y1 && z.y + z.height <= y2) {
                  newSelectedIds.push(z.id);
              }
          });
          
          onSelectIds(newSelectedIds, false);
          setSelectionBox(null);
          onSetActiveTool('cursor');
      }

      if (drawingZone && onZonesChange) {
          const x = Math.min(drawingZone.startX, drawingZone.currentX);
          const y = Math.min(drawingZone.startY, drawingZone.currentY);
          const width = Math.abs(drawingZone.currentX - drawingZone.startX);
          const height = Math.abs(drawingZone.currentY - drawingZone.startY);

          if (width > 10 && height > 10) {
              onUndoCheckpoint();
              const newZone: Zone = {
                  id: crypto.randomUUID(),
                  label: toolSettings.zone.labelPrefix,
                  x, y, width, height,
                  color: toolSettings.zone.color
              };
              onZonesChange([...zones, newZone]);
          }
          setDrawingZone(null);
      }
  };

  const handleInstanceMouseDown = (e: React.MouseEvent, id: string) => {
      if (activeTool === 'zone' || activeTool === 'select-box' || activeTool === 'manual-route') return;
      if (e.button === 1) return; // Ignore middle click

      e.stopPropagation();
      const isMulti = e.ctrlKey || e.shiftKey;
      
      if (onSelectIds) {
          if (isMulti) {
              onSelectIds([id], true);
          } else {
             if (!selectedIds.has(id)) {
                 onSelectIds([id], false);
             }
          }
      }
      
      if (activeTool === 'cursor' || activeTool === 'move' || activeTool === 'scale') {
          const { x, y } = getMouseCoords(e);
          const inst = instances.find(i => i.id === id);
          if (inst) {
              setDragOffset({ x: x - inst.x, y: y - inst.y });
              setDraggedInstance(id);
              onUndoCheckpoint();
          }
      }
  };

  const handleResizeStart = (e: React.MouseEvent, id: string, type: 'instance' | 'zone') => {
      if (e.button === 1) return;
      e.stopPropagation();
      onUndoCheckpoint();
      const { x, y } = getMouseCoords(e);
      
      let startW = 0, startH = 0;
      if (type === 'instance') {
          const inst = instances.find(i => i.id === id);
          const t = templates.find(temp => temp.id === inst?.templateId);
          if (inst && t) {
              startW = inst.width || t.width;
              startH = inst.height || t.height;
          }
      } else {
          const z = zones.find(zn => zn.id === id);
          if (z) {
              startW = z.width;
              startH = z.height;
          }
      }
      
      setResizingTarget({ id, type, startX: x, startY: y, startW, startH });
  };

  const handleInstanceContextMenu = (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      if (onSelectIds) onSelectIds([id], false);
      setContextMenu({ x: e.clientX, y: e.clientY, instanceId: id });
  };

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleInstanceMouseDown,
    handleResizeStart,
    handleInstanceContextMenu,
    getMouseCoords
  };
}
