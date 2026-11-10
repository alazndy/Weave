import React, { useRef, useState, useEffect } from 'react';
import { ProductInstance, ProductTemplate, Connection, Point, ProjectMetadata, Zone, TextNode, PaperSize, Comment } from '../types';
import { getPortPosition } from '../utils/canvasHelpers';
import { EditPortModal } from './modals/EditPortModal';
import { EditConnectionModal } from './modals/EditConnectionModal';
import { EditZoneModal } from './modals/EditZoneModal';
import { EditTextModal } from './modals/EditTextModal';
import { ContextMenu } from './canvas/ContextMenu';
import { ISOFrame } from './canvas/ISOFrame';
import { TitleBlock } from './canvas/TitleBlock';
import { BOMTable } from './canvas/BOMTable';
import { instanceNumber, duplicateNumbers } from '../utils/numbering';
import { LegendStack } from './canvas/LegendStack';
import { ConnectionLine } from './canvas/ConnectionLine';
import { ProductNode } from './canvas/ProductNode';
import { ZoneNode } from './canvas/ZoneNode';
import { TextLabelNode } from './canvas/TextLabelNode';
import { CommentMarker } from './canvas/CommentMarker';
import { Minimap } from './canvas/Minimap';
import { CanvasToolbar, ActiveTool } from './canvas/CanvasToolbar';
import { ToolSettingsBar } from './canvas/ToolSettingsBar';
import { ConnectionToolbar } from './canvas/ConnectionToolbar';
import { getRouteEnds, normalizeInner, moveWaypoint, moveSegment, insertWaypoint, removeWaypoint, type Handle } from '../utils/connectionRoute';
import { CanvasControls } from './canvas/CanvasControls';
import { useCanvasView } from '../hooks/useCanvasView';
import { useCanvasState } from './canvas/hooks/useCanvasState';
import { useCanvasInteraction } from './canvas/hooks/useCanvasInteraction';
import { snapToGrid, validatePortCompatibility } from '../utils/canvasHelpers';

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
  onMetadataChange?: (patch: Partial<ProjectMetadata>, opts?: { silent?: boolean }) => void;
  onRenameActivePage?: (name: string) => void;
  onUndoCheckpoint: () => void;
  onSelectInstance?: (id: string | null) => void;
  onCopyInstance?: (id: string) => void;
  onRemovePort?: (templateId: string, portId: string) => void; 
  isLegendCollapsed?: boolean;
  onToggleLegend?: (collapsed: boolean) => void;
  onEditTemplate?: (templateId: string) => void; 
  onGroupSelected?: () => void;
  onUngroupSelected?: () => void;
  onSaveBlock?: () => void;
  activePageName?: string;
  activePageDrawingNo?: string;
  activePageHideBom?: boolean;
  onPageHideBomChange?: (hide: boolean) => void;
  onPageDrawingNoChange?: (value: string) => void;
  activePageNumber?: number;
  totalPages?: number;
  activeTool: ActiveTool;
  onSetActiveTool: (tool: ActiveTool) => void;
  onAddInstance?: (templateId: string, position: { x: number, y: number }) => void;
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
  onTemplateChange, onEditMetadata, onMetadataChange, onRenameActivePage, onUndoCheckpoint, onSelectInstance, onCopyInstance, onRemovePort,
  isLegendCollapsed, onToggleLegend, onEditTemplate,
  onGroupSelected, onUngroupSelected, onSaveBlock,
  activePageName = 'Sayfa 1', activePageDrawingNo, onPageDrawingNoChange, activePageHideBom, onPageHideBomChange, activePageNumber = 1, totalPages = 1,
  activeTool, onSetActiveTool,
  onAddInstance
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dupNumbers = duplicateNumbers(instances);
  const canvasState = useCanvasState();
  const { scale, pan, setPan, handleWheel, handleFitScreen, handleZoomIn, handleZoomOut } = useCanvasView(window.innerWidth, window.innerHeight);

  const {
      handleMouseDown,
      trackPointerDown,
      startItemDrag,
      handleMouseMove,
      handleMouseUp,
      handleInstanceMouseDown,
      handleResizeStart,
      handleInstanceContextMenu,
      getMouseCoords
  } = useCanvasInteraction({
      instances, connections, templates, zones, textNodes, comments, projectMetadata, selectedIds,
      onInstancesChange, onConnectionsChange, onZonesChange, onTextNodesChange, onCommentsChange, onSelectIds, onUndoCheckpoint, onSetActiveTool,
      canvasState, activeTool, scale, setPan, containerRef
  });

  const {
      isGridSnapEnabled, setIsGridSnapEnabled,
      isMinimapVisible, setIsMinimapVisible,
      toolSettings, handleUpdateToolSettings,
      connectingStart, setConnectingStart,
      manualRoutePoints, setManualRoutePoints,
      hoveredConnectionId, setHoveredConnectionId,
      isMiddlePanning,
      draggedInstance,
      alignmentGuides,
      selectionBox,
      drawingZone,
      setRotatingInstance,
      editingConnectionId, setEditingConnectionId,
      editingPortData, setEditingPortData,
      editingZoneId, setEditingZoneId,
      editingTextId, setEditingTextId,
      contextMenu, setContextMenu
  } = canvasState;

  // Identify source port for validation highlighting
  const startPort = React.useMemo(() => {
      if (!connectingStart) return null;
      const inst = instances.find(i => i.id === connectingStart.instanceId);
      const temp = templates.find(t => t.id === inst?.templateId);
      return temp?.ports.find(p => p.id === connectingStart.portId) || null;
  }, [connectingStart, instances, templates]);

  // Helper for current mouse position (for drawing lines)
  const [currentMousePos, setCurrentMousePos] = React.useState<Point | null>(null);

  const handleMouseMoveWrapper = (e: React.MouseEvent) => {
      handleMouseMove(e);
      if (connectingStart) {
          const { x, y } = getMouseCoords(e);
          let pX = x;
          let pY = y;
          
          const paperW = projectMetadata ? PAPER_DIMENSIONS[projectMetadata.paperSize].w * projectMetadata.pixelScale : 2000;
          const paperH = projectMetadata ? PAPER_DIMENSIONS[projectMetadata.paperSize].h * projectMetadata.pixelScale : 1500;
          const finalW = projectMetadata?.orientation === 'portrait' ? paperH : paperW;
          const finalH = projectMetadata?.orientation === 'portrait' ? paperW : paperH;
          
          pX = Math.max(0, Math.min(pX, finalW));
          pY = Math.max(0, Math.min(pY, finalH));

          if (isGridSnapEnabled) {
              pX = snapToGrid(pX);
              pY = snapToGrid(pY);
          }
          setCurrentMousePos({ x: pX, y: pY });
      } else {
          setCurrentMousePos(null);
      }
  };

  const [connectionWarning, setConnectionWarning] = useState<string | null>(null);
  useEffect(() => {
      if (!connectionWarning) return;
      const timer = setTimeout(() => setConnectionWarning(null), 5000);
      return () => clearTimeout(timer);
  }, [connectionWarning]);

  // ---- Connection selection & manual route editing ----
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const connDragRef = useRef<{ id: string; handle: Handle; inner: Point[]; moved: boolean } | null>(null);
  const connSetterRef = useRef(onConnectionsChange);
  connSetterRef.current = onConnectionsChange;
  const connectionsRef = useRef(connections);
  connectionsRef.current = connections;
  const selectedConnection = connections.find(c => c.id === selectedConnectionId) || null;

  const patchConnection = (id: string, patch: Partial<Connection>, checkpoint = true) => {
      if (checkpoint) onUndoCheckpoint();
      onConnectionsChange(connectionsRef.current.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  const routeOf = (conn: Connection) => {
      const ends = getRouteEnds(conn, instances, templates);
      return ends ? { ends, inner: normalizeInner(conn.shape || 'curved', ends, conn.controlPoints) } : null;
  };

  const handleConnectionHandleDown = (e: React.MouseEvent, id: string, handle: Handle) => {
      if (e.button !== 0) return;
      e.stopPropagation(); e.preventDefault();
      const conn = connectionsRef.current.find(c => c.id === id);
      const r = conn && routeOf(conn);
      if (!conn || !r) return;
      let inner = r.inner;
      let h = handle;
      if (handle.kind === 'add') {
          inner = insertWaypoint(inner, handle.index, handle.at);
          h = { kind: 'point', index: handle.index + 1, at: handle.at };
      }
      onUndoCheckpoint();
      connDragRef.current = { id, handle: h, inner, moved: false };
      setSelectedConnectionId(id);
  };

  useEffect(() => {
      const move = (ev: MouseEvent) => {
          const d = connDragRef.current;
          if (!d) return;
          const conn = connectionsRef.current.find(c => c.id === d.id);
          const ends = conn && getRouteEnds(conn, instances, templates);
          if (!conn || !ends) return;
          let p = getMouseCoords(ev as unknown as React.MouseEvent);
          if (isGridSnapEnabled && !ev.altKey) p = { x: snapToGrid(p.x), y: snapToGrid(p.y) };
          const shape = conn.shape || 'curved';
          const next = d.handle.kind === 'segment'
              ? moveSegment(ends, d.inner, d.handle.index, p)
              : moveWaypoint(shape, ends, d.inner, d.handle.index, p);
          d.moved = true;
          d.inner = next;
          connSetterRef.current(connectionsRef.current.map(c => c.id === d.id ? { ...c, controlPoints: next } : c));
      };
      const up = () => { connDragRef.current = null; };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
      return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [instances, templates, isGridSnapEnabled, scale]);

  const handleHandleDoubleClick = (e: React.MouseEvent, id: string, handle: Handle) => {
      e.stopPropagation();
      const conn = connectionsRef.current.find(c => c.id === id);
      const r = conn && routeOf(conn);
      if (!conn || !r || handle.kind !== 'point') return;
      patchConnection(id, { controlPoints: removeWaypoint(conn.shape || 'curved', r.ends, r.inner, handle.index) });
  };

  useEffect(() => {
      if (selectedConnectionId && !selectedConnection) setSelectedConnectionId(null);
  }, [selectedConnectionId, selectedConnection]);
  useEffect(() => {
      const onKey = (ev: KeyboardEvent) => {
          if (!selectedConnectionId) return;
          const t = ev.target as HTMLElement;
          if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
          const conn = connectionsRef.current.find(c => c.id === selectedConnectionId);
          if (ev.key === 'Escape') setSelectedConnectionId(null);
          else if ((ev.key === 'Delete' || ev.key === 'Backspace') && conn && !conn.locked) {
              ev.preventDefault(); ev.stopImmediatePropagation();
              onUndoCheckpoint();
              onConnectionsChange(connectionsRef.current.filter(c => c.id !== selectedConnectionId));
              setSelectedConnectionId(null);
          }
      };
      window.addEventListener('keydown', onKey, true);
      return () => window.removeEventListener('keydown', onKey, true);
  }, [selectedConnectionId]);

  // ---- Group (bulk) scaling of the selection ----
  const instancesRef = useRef(instances); instancesRef.current = instances;
  const zonesRef = useRef(zones); zonesRef.current = zones;
  const textsRef = useRef(textNodes); textsRef.current = textNodes;
  // the drag effect outlives renders: always call the latest setters (they bind the active page)
  const settersRef = useRef({ onInstancesChange, onZonesChange, onTextNodesChange });
  settersRef.current = { onInstancesChange, onZonesChange, onTextNodesChange };
  const groupDragRef = useRef<{ bx: number; by: number; bw: number; bh: number; ids: Set<string>;
      inst: ProductInstance[]; zn: Zone[]; tx: TextNode[] } | null>(null);

  const textBox = (t: TextNode) => ({ w: Math.max(20, t.content.length * t.fontSize * 0.6), h: t.fontSize * 1.4 });
  const groupBounds = (() => {
      if (selectedIds.size < 2) return null;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, n = 0;
      const grow = (x: number, y: number, w: number, h: number) => {
          minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x + w); maxY = Math.max(maxY, y + h); n++;
      };
      instances.forEach(i => { if (selectedIds.has(i.id) && !i.locked && !i.hidden) {
          const t = templates.find(tp => tp.id === i.templateId);
          grow(i.x, i.y, i.width || t?.width || 100, i.height || t?.height || 100);
      } });
      zones.forEach(z => { if (selectedIds.has(z.id) && !z.locked && !z.hidden) grow(z.x, z.y, z.width, z.height); });
      textNodes.forEach(t => { if (selectedIds.has(t.id) && !t.locked && !t.hidden) { const b = textBox(t); grow(t.x, t.y, b.w, b.h); } });
      return n >= 2 ? { x: minX, y: minY, w: maxX - minX, h: maxY - minY } : null;
  })();

  const startGroupScale = (e: React.MouseEvent) => {
      if (e.button !== 0 || !groupBounds) return;
      e.stopPropagation(); e.preventDefault();
      onUndoCheckpoint();
      groupDragRef.current = {
          bx: groupBounds.x, by: groupBounds.y, bw: groupBounds.w, bh: groupBounds.h, ids: new Set(selectedIds),
          inst: instancesRef.current.map(i => ({ ...i })), zn: zonesRef.current.map(z => ({ ...z })), tx: textsRef.current.map(t => ({ ...t })),
      };
  };

  useEffect(() => {
      const move = (ev: MouseEvent) => {
          const d = groupDragRef.current;
          if (!d) return;
          if (ev.buttons === 0) { groupDragRef.current = null; return; }
          const m = getMouseCoords(ev as unknown as React.MouseEvent);
          // uniform factor from the pointer's projection on the box diagonal
          const raw = ((m.x - d.bx) * d.bw + (m.y - d.by) * d.bh) / (d.bw * d.bw + d.bh * d.bh);
          const f = Math.min(10, Math.max(0.1, raw));
          const fx = (v: number) => d.bx + (v - d.bx) * f;
          const fy = (v: number) => d.by + (v - d.by) * f;
          const mv = (id: string) => d.ids.has(id);
          const { onInstancesChange: setInst, onZonesChange: setZn, onTextNodesChange: setTxt } = settersRef.current;
          setInst(d.inst.map(i => {
              if (!mv(i.id) || i.locked || i.hidden) return i;
              const t = templates.find(tp => tp.id === i.templateId);
              return { ...i, x: fx(i.x), y: fy(i.y), width: (i.width || t?.width || 100) * f, height: (i.height || t?.height || 100) * f };
          }));
          if (setZn && d.zn.some(z => mv(z.id))) setZn(d.zn.map(z => !mv(z.id) || z.locked || z.hidden ? z
              : { ...z, x: fx(z.x), y: fy(z.y), width: z.width * f, height: z.height * f }));
          if (setTxt && d.tx.some(t => mv(t.id))) setTxt(d.tx.map(t => !mv(t.id) || t.locked || t.hidden ? t
              : { ...t, x: fx(t.x), y: fy(t.y), fontSize: Math.max(6, Math.round(t.fontSize * f)) }));
      };
      const up = () => { groupDragRef.current = null; };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
      return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [templates, scale]);

  const findPort = (instId: string, portId: string) => {
      const inst = instances.find(i => i.id === instId);
      return templates.find(t => t.id === inst?.templateId)?.ports.find(p => p.id === portId);
  };

  /** Returns true (and shows why) when the two ports must not be wired together. */
  const rejectIncompatible = (instId: string, portId: string) => {
      if (!connectingStart) return false;
      const from = findPort(connectingStart.instanceId, connectingStart.portId);
      const to = findPort(instId, portId);
      if (!from || !to) return false;
      const problems = validatePortCompatibility(from, to);
      if (problems.length === 0) return false;
      setConnectionWarning(`Bağlantı kurulamadı: ${problems.join(' • ')}`);
      return true;
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
              if (rejectIncompatible(instId, portId)) return;
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
              if (rejectIncompatible(instId, portId)) return;
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

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const templateId = e.dataTransfer.getData("application/weave-template");
      if (templateId && onAddInstance) {
          const { x, y } = getMouseCoords(e as unknown as React.MouseEvent);
          let dropX = x;
          let dropY = y;
          if (isGridSnapEnabled) {
              dropX = snapToGrid(dropX);
              dropY = snapToGrid(dropY);
          }
          onAddInstance(templateId, { x: dropX, y: dropY });
      }
  };

  const hiddenInstanceIds = new Set(instances.filter(i => i.hidden).map(i => i.id));

  const paperW = projectMetadata ? PAPER_DIMENSIONS[projectMetadata.paperSize].w * projectMetadata.pixelScale : 2000;
  const paperH = projectMetadata ? PAPER_DIMENSIONS[projectMetadata.paperSize].h * projectMetadata.pixelScale : 1500;
  const finalW = projectMetadata?.orientation === 'portrait' ? paperH : paperW;
  const finalH = projectMetadata?.orientation === 'portrait' ? paperW : paperH;

  const cursorClass = isMiddlePanning ? 'cursor-grabbing' :
                      activeTool === 'move' ? 'cursor-grab active:cursor-grabbing' : 
                      activeTool === 'zone' || activeTool === 'select-box' || activeTool === 'manual-route' ? 'cursor-crosshair' : 'cursor-default';

  return (
    <div 
      data-testid="canvas-viewport"
      className={`relative w-full h-full overflow-hidden bg-zinc-950 select-none print:overflow-visible print:bg-white ${cursorClass}`}
      onWheel={(e) => handleWheel(e, containerRef.current!.getBoundingClientRect())}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div 
        ref={containerRef}
        className="absolute w-full h-full origin-top-left print:transform-none"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
        onMouseDownCapture={trackPointerDown}
        onMouseDown={(e) => { if (!(e.target as HTMLElement).closest('[data-connection-id],[data-testid="connection-toolbar"]')) setSelectedConnectionId(null); handleMouseDown(e); }}
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
                
                <LegendStack paperHeight={finalH}>
                {!activePageHideBom && (
                <BOMTable 
                    instances={instances}
                    templates={templates}
                    externalParts={projectMetadata.externalParts || []}
                    theme={theme}
                    onHide={onPageHideBomChange ? () => onPageHideBomChange(true) : undefined}
                />
                )}

                <TitleBlock 
                    metadata={projectMetadata} 
                    theme={theme}
                    pageName={activePageName}
                    pageDrawingNo={activePageDrawingNo}
                    bomHidden={!!activePageHideBom}
                    onBomHiddenChange={onPageHideBomChange}
                    onPageDrawingNoChange={onPageDrawingNoChange}
                    pageNumber={activePageNumber}
                    totalPages={totalPages}
                    onEdit={onEditMetadata}
                    onMetadataChange={onMetadataChange}
                    onRenamePage={onRenameActivePage}
                />
                </LegendStack>
            </div>
        )}

        {/* Zones */}
        {zones.filter(z => !z.hidden).map(zone => (
            <ZoneNode 
                key={zone.id} 
                zone={zone} 
                isSelected={selectedIds.has(zone.id)} 
                activeTool={activeTool} 
                theme={theme}
                onSelectIds={onSelectIds}
                onUndoCheckpoint={onUndoCheckpoint}
                setDraggedInstance={(id) => startItemDrag(id)} 
                setEditingZoneId={setEditingZoneId}
                removeZone={(id) => { if (!onZonesChange) return; onUndoCheckpoint(); onZonesChange(zones.filter(z => z.id !== id)); }}
                handleResizeMouseDown={(e) => handleResizeStart(e, zone.id, 'zone')}
            />
        ))}

        {/* Instances */}
        {instances.map((inst, idx) => {
            const t = templates.find(temp => temp.id === inst.templateId);
            if (!t || inst.hidden) return null;
            return (
                <ProductNode 
                    key={inst.id}
                    inst={inst}
                    template={t}
                    itemIndex={instanceNumber(inst, idx)}
                    isDuplicateNumber={dupNumbers.has(instanceNumber(inst, idx).toLowerCase())}
                    onRenumber={(id, value) => { onUndoCheckpoint(); onInstancesChange(instances.map(i => i.id === id ? { ...i, number: value || undefined } : i)); }}
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
            {connections.filter(c => !c.hidden && !hiddenInstanceIds.has(c.fromInstanceId) && !hiddenInstanceIds.has(c.toInstanceId)).map(conn => (
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
                    selected={selectedConnectionId === conn.id}
                    onSelect={setSelectedConnectionId}
                    onHandleDown={handleConnectionHandleDown}
                    onHandleDoubleClick={handleHandleDoubleClick}
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
        {textNodes.filter(t => !t.hidden).map(text => (
            <TextLabelNode 
                key={text.id}
                text={text}
                theme={theme}
                isSelected={selectedIds.has(text.id)}
                handleTextMouseDown={(e, id) => { 
                    e.stopPropagation(); 
                    if(onSelectIds) onSelectIds([id], e.ctrlKey); 
                    if ((activeTool === 'cursor' || activeTool === 'move') && !text.locked) {
                        onUndoCheckpoint();
                        startItemDrag(id);
                    }
                }}
                setEditingTextId={setEditingTextId}
                removeText={(id) => { if (!onTextNodesChange) return; onUndoCheckpoint(); onTextNodesChange(textNodes.filter(t => t.id !== id)); }}
            />
        ))}

        {/* Comments */}
        {comments.filter(c => !c.hidden).map(comment => (
            <CommentMarker 
                key={comment.id}
                comment={comment}
                theme={theme}
                isSelected={selectedIds.has(comment.id)}
                onSelect={() => { 
                    if(onSelectIds) onSelectIds([comment.id], false); 
                    if ((activeTool === 'cursor' || activeTool === 'move') && !comment.locked) {
                        onUndoCheckpoint();
                        startItemDrag(comment.id);
                    }
                }}
                onUpdate={(id, content, color, isResolved) => { if (!onCommentsChange) return; onUndoCheckpoint(); onCommentsChange(comments.map(c => c.id === id ? { ...c, content, color, isResolved } : c)); }}
                onDelete={(id) => { if (!onCommentsChange) return; onUndoCheckpoint(); onCommentsChange(comments.filter(c => c.id !== id)); }}
                onToggleLock={(id) => { if (!onCommentsChange) return; onUndoCheckpoint(); onCommentsChange(comments.map(c => c.id === id ? { ...c, locked: !c.locked } : c)); }}
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

        {/* Group bounds + bulk scale handle */}
        {groupBounds && (
            <div data-testid="group-bounds" className="absolute z-[60] pointer-events-none border border-dashed border-sky-400"
                style={{ left: groupBounds.x - 4, top: groupBounds.y - 4, width: groupBounds.w + 8, height: groupBounds.h + 8 }}>
                <div data-group-scale data-testid="group-scale-handle" title="Seçilenleri birlikte ölçekle"
                    onMouseDown={startGroupScale}
                    className="pointer-events-auto absolute -right-6 -bottom-6 h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-white bg-sky-500 shadow" />
            </div>
        )}

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
      
      {selectedConnection && (
          <ConnectionToolbar
              conn={selectedConnection}
              theme={theme}
              onChange={(patch) => patchConnection(selectedConnection.id, patch)}
              onResetRoute={() => {
                  const r = routeOf({ ...selectedConnection, controlPoints: undefined });
                  patchConnection(selectedConnection.id, { controlPoints: r ? r.inner : undefined });
              }}
              onDelete={() => { onUndoCheckpoint(); onConnectionsChange(connections.filter(c => c.id !== selectedConnection.id)); setSelectedConnectionId(null); }}
              onEditDetails={() => setEditingConnectionId(selectedConnection.id)}
              onClose={() => setSelectedConnectionId(null)}
          />
      )}

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
          <div data-testid="minimap" className="contents">
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
          </div>
      )}

      {connectionWarning && (
          <div role="alert" className="absolute top-24 left-1/2 -translate-x-1/2 z-[120] max-w-[80%] rounded-lg bg-red-600/95 px-4 py-2 text-sm font-medium text-white shadow-xl no-print">
              {connectionWarning}
          </div>
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
              onCopy={() => { onSelectInstance?.(contextMenu.instanceId); onCopyInstance?.(contextMenu.instanceId); }}
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
