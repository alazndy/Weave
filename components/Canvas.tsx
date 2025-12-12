
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { ProductInstance, ProductTemplate, Connection, Point, PortDefinition, ProjectMetadata, Zone, TextNode, PaperSize, AlignmentGuide, Comment } from '../types';
import { snapToGrid, calculateSnapGuides, getInstanceRect, getPortPosition } from '../utils/canvasHelpers';
import { EditPortModal } from './modals/EditPortModal';
import { EditConnectionModal } from './modals/EditConnectionModal';
import { EditZoneModal } from './modals/EditZoneModal';
import { EditTextModal } from './modals/EditTextModal';
import { ContextMenu } from './canvas/ContextMenu';
import { ISOFrame } from './canvas/ISOFrame';
import { TitleBlock } from './canvas/TitleBlock';
import { BOMTable } from './canvas/BOMTable';
import { ConnectionLine } from './canvas/ConnectionLine';
import { ProductNode } from './canvas/ProductNode';
import { ZoneNode } from './canvas/ZoneNode';
import { TextLabelNode } from './canvas/TextLabelNode';
import { CommentMarker } from './canvas/CommentMarker';
import { Minimap } from './canvas/Minimap';
import { CanvasToolbar, ActiveTool } from './canvas/CanvasToolbar';
import { ToolSettingsBar, ToolSettings } from './canvas/ToolSettingsBar';
import { CanvasControls } from './canvas/CanvasControls';
import { useCanvasView } from '../hooks/useCanvasView';

interface CanvasProps {
  instances: ProductInstance[];
  connections: Connection[];
  templates: ProductTemplate[];
  projectMetadata?: ProjectMetadata;
  zones?: Zone[];
  textNodes?: TextNode[];
  comments?: Comment[];
  selectedInstanceId?: string | null;
  selectedIds?: Set<string>;
  onSelectIds?: (ids: string[], multi: boolean) => void;
  theme?: 'light' | 'dark'; 
  editingPortInfo?: {templateId: string, portId: string} | null;
  onSetEditingPortInfo?: (info: {templateId: string, portId: string} | null) => void;
  onInstancesChange: (instances: ProductInstance[]) => void;
  onConnectionsChange: (connections: Connection[]) => void;
  onZonesChange?: (zones: Zone[]) => void;
  onTextNodesChange?: (textNodes: TextNode[]) => void;
  onCommentsChange?: (comments: Comment[]) => void;
  onTemplateChange: (template: ProductTemplate) => void;
  onEditMetadata?: () => void;
  onUndoCheckpoint: () => void;
  onSelectInstance?: (id: string | null) => void;
  onRemovePort?: (templateId: string, portId: string) => void; 
  isLegendCollapsed?: boolean;
  onToggleLegend?: (collapsed: boolean) => void;
  onEditTemplate?: (templateId: string) => void; 
  onGroupSelected?: () => void;
  onUngroupSelected?: () => void;
  onSaveBlock?: () => void;
  activePageName?: string;
  activePageNumber?: number;
  totalPages?: number;
  activeTool: ActiveTool;
  onSetActiveTool: (tool: ActiveTool) => void;
}

const PAPER_DIMENSIONS: Record<PaperSize, { w: number, h: number }> = {
  'A3': { w: 420, h: 297 },
  'A4': { w: 297, h: 210 },
  'A6': { w: 148, h: 105 },
};

export const Canvas: React.FC<CanvasProps> = ({
  instances, connections, templates, projectMetadata, zones = [], textNodes = [], comments = [],
  selectedInstanceId, selectedIds = new Set(), onSelectIds, theme = 'dark',
  editingPortInfo, onSetEditingPortInfo,
  onInstancesChange, onConnectionsChange, onZonesChange, onTextNodesChange, onCommentsChange,
  onTemplateChange, onEditMetadata, onUndoCheckpoint, onSelectInstance, onRemovePort,
  isLegendCollapsed, onToggleLegend, onEditTemplate,
  onGroupSelected, onUngroupSelected, onSaveBlock,
  activePageName = 'Sayfa 1', activePageNumber = 1, totalPages = 1,
  activeTool, onSetActiveTool
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Tools & UI State
  // activeTool state lifted to parent
  const [isGridSnapEnabled, setIsGridSnapEnabled] = useState(true);
  const [isMinimapVisible, setIsMinimapVisible] = useState(true);
  
  // Tool Settings State
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
  
  // Interaction State
  const [connectingStart, setConnectingStart] = useState<{ instanceId: string; portId: string } | null>(null);
  const [manualRoutePoints, setManualRoutePoints] = useState<Point[]>([]);
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  
  // Dragging & Panning State
  const [isMiddlePanning, setIsMiddlePanning] = useState(false);
  const [draggedInstance, setDraggedInstance] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);
  
  // Tool Specific States
  const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, currentX: number, currentY: number } | null>(null);
  const [drawingZone, setDrawingZone] = useState<{ startX: number, startY: number, currentX: number, currentY: number } | null>(null);

  // Transformation States
  const [rotatingInstance, setRotatingInstance] = useState<string | null>(null);
  const [resizingTarget, setResizingTarget] = useState<{ id: string, type: 'instance' | 'zone', startW: number, startH: number, startX: number, startY: number } | null>(null);

  // Edit Modals
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [editingPortData, setEditingPortData] = useState<{ port: PortDefinition, templateId: string } | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, instanceId: string } | null>(null);

  // Canvas View Hook
  const { scale, pan, setPan, handleWheel, handleFitScreen, handleZoomIn, handleZoomOut } = useCanvasView(window.innerWidth, window.innerHeight);

  // Coordinate Helpers
  const getMouseCoords = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / scale,
      y: (e.clientY - rect.top - pan.y) / scale
    };
  }, [pan, scale]);

  // Identify source port for validation highlighting
  const startPort = useMemo(() => {
      if (!connectingStart) return null;
      const inst = instances.find(i => i.id === connectingStart.instanceId);
      const temp = templates.find(t => t.id === inst?.templateId);
      return temp?.ports.find(p => p.id === connectingStart.portId) || null;
  }, [connectingStart, instances, templates]);

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

  const handlePortClick = (e: React.MouseEvent, instId: string, portId: string) => {
      e.stopPropagation();
      if (e.button === 1) return;

      if (activeTool === 'manual-route') {
          if (connectingStart) {
              if (connectingStart.instanceId === instId && connectingStart.portId === portId) {
                  setConnectingStart(null);
                  setManualRoutePoints([]);
                  return;
              }
              onUndoCheckpoint();
              const newConn: Connection = {
                  id: crypto.randomUUID(),
                  fromInstanceId: connectingStart.instanceId,
                  fromPortId: connectingStart.portId,
                  toInstanceId: instId,
                  toPortId: portId,
                  label: '',
                  color: toolSettings.route.color,
                  shape: 'orthogonal',
                  lineStyle: toolSettings.route.lineStyle,
                  strokeWidth: toolSettings.route.strokeWidth,
                  cornerRadius: toolSettings.route.cornerRadius,
                  controlPoints: [...manualRoutePoints]
              };
              onConnectionsChange([...connections, newConn]);
              setConnectingStart(null);
              setManualRoutePoints([]);
          } else {
              setConnectingStart({ instanceId: instId, portId });
              setManualRoutePoints([]);
          }
          return;
      }

      if (activeTool === 'cursor') {
          if (connectingStart) {
              if (connectingStart.instanceId === instId && connectingStart.portId === portId) {
                  setConnectingStart(null);
                  return;
              }
              onUndoCheckpoint();
              const newConn: Connection = {
                  id: crypto.randomUUID(),
                  fromInstanceId: connectingStart.instanceId,
                  fromPortId: connectingStart.portId,
                  toInstanceId: instId,
                  toPortId: portId,
                  label: '',
                  color: '#6366f1' // Default for cursor tool connection
              };
              onConnectionsChange([...connections, newConn]);
              setConnectingStart(null);
          } else {
              setConnectingStart({ instanceId: instId, portId });
          }
      }
  };
  
  const [currentMousePos, setCurrentMousePos] = useState<Point | null>(null);

  const handleMouseMoveWrapper = (e: React.MouseEvent) => {
      handleMouseMove(e);
      if (connectingStart) {
          const { x, y } = getMouseCoords(e);
          let pX = x;
          let pY = y;
          if (isGridSnapEnabled) {
              pX = snapToGrid(pX);
              pY = snapToGrid(pY);
          }
          setCurrentMousePos({ x: pX, y: pY });
      } else {
          setCurrentMousePos(null);
      }
  };

  const paperW = projectMetadata ? PAPER_DIMENSIONS[projectMetadata.paperSize].w * projectMetadata.pixelScale : 2000;
  const paperH = projectMetadata ? PAPER_DIMENSIONS[projectMetadata.paperSize].h * projectMetadata.pixelScale : 1500;
  const finalW = projectMetadata?.orientation === 'portrait' ? paperH : paperW;
  const finalH = projectMetadata?.orientation === 'portrait' ? paperW : paperH;

  const cursorClass = isMiddlePanning ? 'cursor-grabbing' :
                      activeTool === 'move' ? 'cursor-grab active:cursor-grabbing' : 
                      activeTool === 'zone' || activeTool === 'select-box' || activeTool === 'manual-route' ? 'cursor-crosshair' : 'cursor-default';

  return (
    <div 
      className={`relative w-full h-full overflow-hidden bg-zinc-950 select-none print:overflow-visible print:bg-white ${cursorClass}`}
      onWheel={(e) => handleWheel(e, containerRef.current!.getBoundingClientRect())}
    >
      <div 
        ref={containerRef}
        className="absolute w-full h-full origin-top-left print:transform-none"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveWrapper}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        id="canvas-export-area"
      >
        {/* Paper Frame */}
        {projectMetadata && (
            <div className="absolute top-0 left-0 bg-zinc-900 border border-zinc-800 shadow-2xl transition-colors duration-500 print:border-none print:shadow-none"
                style={{ width: finalW, height: finalH, backgroundColor: theme === 'light' ? '#ffffff' : '#18181b' }}
            >
                <ISOFrame width={finalW} height={finalH} theme={theme} />
                
                <BOMTable 
                    instances={instances}
                    templates={templates}
                    externalParts={projectMetadata.externalParts || []}
                    theme={theme}
                />

                <TitleBlock 
                    metadata={projectMetadata} 
                    theme={theme}
                    pageName={activePageName}
                    pageNumber={activePageNumber}
                    totalPages={totalPages}
                    onEdit={onEditMetadata}
                />
            </div>
        )}

        {/* Zones */}
        {zones.map(zone => (
            <ZoneNode 
                key={zone.id} 
                zone={zone} 
                isSelected={selectedIds.has(zone.id)} 
                activeTool={activeTool} 
                theme={theme}
                onSelectIds={onSelectIds}
                onUndoCheckpoint={onUndoCheckpoint}
                setDraggedInstance={(id) => { setDraggedInstance(id); setDragOffset({ x: 0, y: 0 }); }} 
                setEditingZoneId={setEditingZoneId}
                removeZone={(id) => onZonesChange && onZonesChange(zones.filter(z => z.id !== id))}
                handleResizeMouseDown={(e) => handleResizeStart(e, zone.id, 'zone')}
            />
        ))}

        {/* Instances */}
        {instances.map((inst, idx) => {
            const t = templates.find(temp => temp.id === inst.templateId);
            if (!t) return null;
            return (
                <ProductNode 
                    key={inst.id}
                    inst={inst}
                    template={t}
                    itemIndex={idx + 1}
                    isSelected={selectedIds.has(inst.id)}
                    isDragged={draggedInstance === inst.id}
                    isScaleToolActive={activeTool === 'scale'}
                    theme={theme}
                    connectingStart={connectingStart}
                    startPort={startPort}
                    handleInstanceMouseDown={handleInstanceMouseDown}
                    handleInstanceContextMenu={handleInstanceContextMenu}
                    toggleMirrorInstance={(id) => { onUndoCheckpoint(); onInstancesChange(instances.map(i => i.id === id ? { ...i, mirrored: !i.mirrored } : i)); }}
                    setRotatingInstance={setRotatingInstance}
                    removeInstance={(id) => { onUndoCheckpoint(); onInstancesChange(instances.filter(i => i.id !== id)); onConnectionsChange(connections.filter(c => c.fromInstanceId !== id && c.toInstanceId !== id)); }}
                    handleResizeMouseDown={(e) => handleResizeStart(e, inst.id, 'instance')}
                    handlePortClick={handlePortClick}
                    handlePortDoubleClick={(e, tId, pId) => { e.stopPropagation(); setEditingPortData({ port: templates.find(t=>t.id===tId)!.ports.find(p=>p.id===pId)!, templateId: tId }); }}
                    onUndoCheckpoint={onUndoCheckpoint}
                />
            );
        })}

        {/* Connections */}
        <svg className="absolute top-0 left-0 overflow-visible pointer-events-none z-40" style={{ width: finalW, height: finalH }}>
            <defs>
                <marker id="arrow-end" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
                </marker>
                <marker id="arrow-start" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 10 0 L 0 5 L 10 10 z" fill="currentColor" />
                </marker>
            </defs>
            {connections.map(conn => (
                <ConnectionLine 
                    key={conn.id} 
                    conn={conn}
                    connections={connections}
                    instances={instances}
                    templates={templates}
                    theme={theme}
                    hoveredConnectionId={hoveredConnectionId}
                    setHoveredConnectionId={setHoveredConnectionId}
                    editingConnectionId={editingConnectionId}
                    setEditingConnectionId={setEditingConnectionId}
                    handleConnectionDoubleClick={(e, id) => setEditingConnectionId(id)}
                    handleControlPointMouseDown={() => {}} 
                    handleControlPointDoubleClick={() => {}} 
                    removeConnection={(id) => { onUndoCheckpoint(); onConnectionsChange(connections.filter(c => c.id !== id)); }}
                />
            ))}
            
            {/* Live Connection Drawing */}
            {connectingStart && (
                <>
                {(() => {
                    const i = instances.find(inst => inst.id === connectingStart.instanceId);
                    const t = templates.find(temp => temp.id === i?.templateId);
                    if (!i || !t) return null;
                    const startPos = getPortPosition(i, t, connectingStart.portId);
                    
                    if (activeTool === 'manual-route' && currentMousePos) {
                         let d = `M ${startPos.x} ${startPos.y}`;
                         manualRoutePoints.forEach(p => { d += ` L ${p.x} ${p.y}`; });
                         d += ` L ${currentMousePos.x} ${currentMousePos.y}`;
                         return (
                              <path
                                 d={d}
                                 stroke={toolSettings.route.color}
                                 strokeWidth="3"
                                 fill="none"
                                 strokeDasharray={toolSettings.route.lineStyle === 'dashed' ? '5,5' : toolSettings.route.lineStyle === 'dotted' ? '2,4' : 'none'}
                                 className="pointer-events-none drop-shadow-md"
                              />
                         );
                     } else {
                         const endX = currentMousePos ? currentMousePos.x : startPos.x;
                         const endY = currentMousePos ? currentMousePos.y : startPos.y;
 
                         return (
                             <line 
                                 x1={startPos.x}
                                 y1={startPos.y}
                                 x2={endX} 
                                 y2={endY} 
                                 stroke="#14b8a6" 
                                 strokeWidth="2" 
                                 strokeDasharray="5,5" 
                                 className="animate-pulse pointer-events-none"
                             />
                         );
                     }
                })()}
                {activeTool === 'manual-route' && manualRoutePoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3" fill="#f59e0b" />
                ))}
                </>
            )}
        </svg>

        {/* Text Nodes */}
        {textNodes.map(text => (
            <TextLabelNode 
                key={text.id}
                text={text}
                theme={theme}
                isSelected={selectedIds.has(text.id)}
                handleTextMouseDown={(e, id) => { 
                    e.stopPropagation(); 
                    if(onSelectIds) onSelectIds([id], e.ctrlKey); 
                    if (activeTool === 'cursor' || activeTool === 'move') {
                        setDraggedInstance(id); 
                        setDragOffset({ x: 0, y: 0 }); 
                    }
                }}
                setEditingTextId={setEditingTextId}
                removeText={(id) => onTextNodesChange && onTextNodesChange(textNodes.filter(t => t.id !== id))}
            />
        ))}

        {/* Comments */}
        {comments.map(comment => (
            <CommentMarker 
                key={comment.id}
                comment={comment}
                theme={theme}
                isSelected={selectedIds.has(comment.id)}
                onSelect={() => { 
                    if(onSelectIds) onSelectIds([comment.id], false); 
                    if (activeTool === 'cursor' || activeTool === 'move') {
                        setDraggedInstance(comment.id); 
                        setDragOffset({ x: 0, y: 0 }); 
                    }
                }}
                onUpdate={(id, content, color, isResolved) => onCommentsChange && onCommentsChange(comments.map(c => c.id === id ? { ...c, content, color, isResolved } : c))}
                onDelete={(id) => onCommentsChange && onCommentsChange(comments.filter(c => c.id !== id))}
                onToggleLock={(id) => onCommentsChange && onCommentsChange(comments.map(c => c.id === id ? { ...c, locked: !c.locked } : c))}
            />
        ))}
        
        {/* Alignment Guides */}
        {alignmentGuides.map((g, i) => (
            <div 
                key={i}
                className="absolute bg-orange-500 pointer-events-none z-50"
                style={{
                    left: g.type === 'vertical' ? g.pos : g.start,
                    top: g.type === 'horizontal' ? g.pos : g.start,
                    width: g.type === 'vertical' ? 1 : g.end - g.start,
                    height: g.type === 'horizontal' ? 1 : g.end - g.start
                }}
            />
        ))}

        {/* Selection Box */}
        {selectionBox && (
            <div 
                className="absolute border border-blue-500 bg-blue-500/10 pointer-events-none z-50"
                style={{
                    left: Math.min(selectionBox.startX, selectionBox.currentX),
                    top: Math.min(selectionBox.startY, selectionBox.currentY),
                    width: Math.abs(selectionBox.currentX - selectionBox.startX),
                    height: Math.abs(selectionBox.currentY - selectionBox.startY)
                }}
            />
        )}

        {/* Drawing Zone Box */}
        {drawingZone && (
            <div 
                className="absolute border-2 border-dashed border-emerald-500 bg-emerald-500/10 pointer-events-none z-50"
                style={{
                    left: Math.min(drawingZone.startX, drawingZone.currentX),
                    top: Math.min(drawingZone.startY, drawingZone.currentY),
                    width: Math.abs(drawingZone.currentX - drawingZone.startX),
                    height: Math.abs(drawingZone.currentY - drawingZone.startY)
                }}
            />
        )}
      </div>

      <CanvasToolbar 
          activeTool={activeTool} 
          setActiveTool={onSetActiveTool} 
          isGridSnapEnabled={isGridSnapEnabled} 
          setIsGridSnapEnabled={setIsGridSnapEnabled} 
          theme={theme}
      />
      
      <ToolSettingsBar 
         activeTool={activeTool}
         settings={toolSettings}
         onUpdateSettings={handleUpdateToolSettings}
         theme={theme}
      />

      <CanvasControls 
          isMinimapVisible={isMinimapVisible} 
          setIsMinimapVisible={setIsMinimapVisible} 
          handleZoomOut={handleZoomOut} 
          handleFitScreen={() => handleFitScreen(finalW, finalH)} 
          handleZoomIn={handleZoomIn} 
          scale={scale} 
      />

      {isMinimapVisible && (
          <Minimap 
              instances={instances} 
              templates={templates} 
              connections={connections} 
              canvasWidth={finalW} 
              canvasHeight={finalH} 
              pan={pan} 
              scale={scale} 
              onPanChange={setPan} 
              theme={theme}
              visible={isMinimapVisible}
          />
      )}

      {/* Modals */}
      {editingConnectionId && (
          <EditConnectionModal 
              connection={connections.find(c => c.id === editingConnectionId)!}
              onSave={(updated) => { onUndoCheckpoint(); onConnectionsChange(connections.map(c => c.id === updated.id ? updated : c)); setEditingConnectionId(null); }}
              onCancel={() => setEditingConnectionId(null)}
          />
      )}
      
      {editingPortData && (
          <EditPortModal 
              port={editingPortData.port}
              onSave={(updated) => { 
                  onUndoCheckpoint(); 
                  onTemplateChange({ 
                      ...templates.find(t => t.id === editingPortData.templateId)!, 
                      ports: templates.find(t => t.id === editingPortData.templateId)!.ports.map(p => p.id === updated.id ? updated : p) 
                  });
                  setEditingPortData(null); 
              }}
              onCancel={() => setEditingPortData(null)}
              onDelete={(id) => onRemovePort && onRemovePort(editingPortData.templateId, id)}
          />
      )}
      
      {editingZoneId && onZonesChange && (
          <EditZoneModal 
              zone={zones.find(z => z.id === editingZoneId)!}
              onSave={(updated) => { onUndoCheckpoint(); onZonesChange(zones.map(z => z.id === updated.id ? updated : z)); setEditingZoneId(null); }}
              onCancel={() => setEditingZoneId(null)}
          />
      )}

      {editingTextId && onTextNodesChange && (
          <EditTextModal 
              node={textNodes.find(t => t.id === editingTextId)!}
              onSave={(updated) => { onUndoCheckpoint(); onTextNodesChange(textNodes.map(t => t.id === updated.id ? updated : t)); setEditingTextId(null); }}
              onCancel={() => setEditingTextId(null)}
          />
      )}

      {contextMenu && (
          <ContextMenu 
              x={contextMenu.x} 
              y={contextMenu.y} 
              instanceId={contextMenu.instanceId} 
              onClose={() => setContextMenu(null)}
              onEdit={() => { 
                  const inst = instances.find(i => i.id === contextMenu.instanceId);
                  if (inst && onEditTemplate) onEditTemplate(inst.templateId);
              }}
              onCopy={() => { if(onSelectInstance) onSelectInstance(contextMenu.instanceId); }}
              onMirror={() => { onUndoCheckpoint(); onInstancesChange(instances.map(i => i.id === contextMenu.instanceId ? { ...i, mirrored: !i.mirrored } : i)); }}
              onRotate={() => { onUndoCheckpoint(); onInstancesChange(instances.map(i => i.id === contextMenu.instanceId ? { ...i, rotation: (i.rotation || 0) + 90 } : i)); }}
              onDelete={() => { 
                  onUndoCheckpoint(); 
                  onInstancesChange(instances.filter(i => i.id !== contextMenu.instanceId));
                  onConnectionsChange(connections.filter(c => c.fromInstanceId !== contextMenu.instanceId && c.toInstanceId !== contextMenu.instanceId));
              }}
              onGroup={onGroupSelected}
              onUngroup={onUngroupSelected}
              onSaveBlock={onSaveBlock}
              isGrouped={!!instances.find(i => i.id === contextMenu.instanceId)?.groupId}
              isMultiSelect={selectedIds.size > 1}
          />
      )}
    </div>
  );
};
