
import React, { useMemo } from 'react';
import { Connection, ProductInstance, ProductTemplate, CONNECTOR_LABELS, Point } from '../../types';
import { getPortPosition, getPortNormal, getRoutePath, validateConnection, getOrthogonalSegments, findIntersection } from '../../utils/canvasHelpers';
import { getRouteEnds, normalizeInner, getHandles, curvedPathThrough, type Handle } from '../../utils/connectionRoute';
import { Activity, ArrowDownToLine, Zap, Network, Video, ArrowRight, Cable, Edit2, Trash2, AlertTriangle, Lock } from 'lucide-react';

interface ConnectionLineProps {
  conn: Connection;
  connections?: Connection[]; // New: knowledge of other connections
  instances: ProductInstance[];
  templates: ProductTemplate[];
  theme: 'light' | 'dark';
  hoveredConnectionId: string | null;
  setHoveredConnectionId: (id: string | null) => void;
  editingConnectionId: string | null;
  setEditingConnectionId: (id: string | null) => void;
  handleConnectionDoubleClick: (e: React.MouseEvent, id: string) => void;
  handleControlPointMouseDown: (e: React.MouseEvent, id: string, idx: number) => void;
  handleControlPointDoubleClick: (e: React.MouseEvent, id: string, idx: number) => void;
  removeConnection: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onHandleDown?: (e: React.MouseEvent, id: string, handle: Handle) => void;
  onHandleDoubleClick?: (e: React.MouseEvent, id: string, handle: Handle) => void;
}

const ConnectionLineComponent: React.FC<ConnectionLineProps> = ({
  conn, connections = [], instances, templates, theme,
  hoveredConnectionId, setHoveredConnectionId,
  editingConnectionId, setEditingConnectionId,
  handleConnectionDoubleClick, handleControlPointMouseDown,
  handleControlPointDoubleClick, removeConnection,
  selected = false, onSelect, onHandleDown, onHandleDoubleClick
}) => {
    const fromInst = instances.find(i => i.id === conn.fromInstanceId);
    const toInst = instances.find(i => i.id === conn.toInstanceId);
    const fromTemp = templates.find(t => t.id === fromInst?.templateId);
    const toTemp = templates.find(t => t.id === toInst?.templateId);
    
    const fromPort = fromTemp?.ports.find(p => p.id === conn.fromPortId);
    const toPort = toTemp?.ports.find(p => p.id === conn.toPortId);

    const shape = conn.shape || 'curved';
    const ends = useMemo(() => getRouteEnds(conn, instances, templates), [conn, instances, templates]);
    const inner = useMemo(() => (ends ? normalizeInner(shape, ends, conn.controlPoints) : []), [ends, shape, conn.controlPoints]);

    // Calculate Jumps with Bounding Box Optimization
    const jumps = useMemo(() => {
        if (conn.shape !== 'orthogonal' || connections.length < 2) return [];
        
        const myStart = getPortPosition(fromInst!, fromTemp!, conn.fromPortId);
        const myEnd = getPortPosition(toInst!, toTemp!, conn.toPortId);
        
        if (!myStart || !myEnd) return [];

        // Calculate Bounding Box of current line
        const myMinX = Math.min(myStart.x, myEnd.x, ...inner.map(p => p.x));
        const myMaxX = Math.max(myStart.x, myEnd.x, ...inner.map(p => p.x));
        const myMinY = Math.min(myStart.y, myEnd.y, ...inner.map(p => p.y));
        const myMaxY = Math.max(myStart.y, myEnd.y, ...inner.map(p => p.y));

        const mySegments = getOrthogonalSegments(myStart, myEnd, inner);
        const detectedJumps: Point[] = [];

        const getConnPoints = (c: Connection) => {
            const fi = instances.find(i => i.id === c.fromInstanceId);
            const ti = instances.find(i => i.id === c.toInstanceId);
            const ft = templates.find(t => t.id === fi?.templateId);
            const tt = templates.find(t => t.id === ti?.templateId);
            if (!fi || !ti || !ft || !tt) return null;
            const oe = getRouteEnds(c, instances, templates);
            return {
                start: getPortPosition(fi, ft, c.fromPortId),
                end: getPortPosition(ti, tt, c.toPortId),
                controlPoints: oe ? normalizeInner(c.shape || 'curved', oe, c.controlPoints) : c.controlPoints
            };
        };

        connections.forEach(other => {
            if (other.id === conn.id) return;
            if (other.shape !== 'orthogonal') return;

            // Optimization: Bounding Box Check
            // We need to check if this 'other' connection is even near us.
            const otherData = getConnPoints(other);
            if (!otherData) return;

            const otherMinX = Math.min(otherData.start.x, otherData.end.x, ...otherData.controlPoints?.map(p => p.x) || []);
            const otherMaxX = Math.max(otherData.start.x, otherData.end.x, ...otherData.controlPoints?.map(p => p.x) || []);
            const otherMinY = Math.min(otherData.start.y, otherData.end.y, ...otherData.controlPoints?.map(p => p.y) || []);
            const otherMaxY = Math.max(otherData.start.y, otherData.end.y, ...otherData.controlPoints?.map(p => p.y) || []);

            // If boxes don't overlap, skip
            if (myMaxX < otherMinX || myMinX > otherMaxX || myMaxY < otherMinY || myMinY > otherMaxY) return;

            const otherSegments = getOrthogonalSegments(otherData.start, otherData.end, otherData.controlPoints);

            for (const mySeg of mySegments) {
                if (!mySeg.isVertical) continue;

                for (const otherSeg of otherSegments) {
                    if (otherSeg.isVertical) continue; 
                    
                    const intersection = findIntersection(mySeg.p1, mySeg.p2, otherSeg.p1, otherSeg.p2);
                    if (intersection) {
                        const isEndpoint = 
                            (intersection.x === mySeg.p1.x && intersection.y === mySeg.p1.y) ||
                            (intersection.x === mySeg.p2.x && intersection.y === mySeg.p2.y) ||
                            (intersection.x === otherSeg.p1.x && intersection.y === otherSeg.p1.y) ||
                            (intersection.x === otherSeg.p2.x && intersection.y === otherSeg.p2.y);
                            
                        if (!isEndpoint) {
                            detectedJumps.push(intersection);
                        }
                    }
                }
            }
        });
        
        return detectedJumps;
    }, [conn, connections, instances, templates, inner]);


    if (!fromInst || !toInst || !fromTemp || !toTemp || !fromPort || !toPort) return null;

    const start = getPortPosition(fromInst, fromTemp, conn.fromPortId);
    const end = getPortPosition(toInst, toTemp, conn.toPortId);
    
    const startNormal = getPortNormal(fromInst, fromTemp, conn.fromPortId);
    const endNormal = getPortNormal(toInst, toTemp, conn.toPortId);
    
    const path = shape === 'curved'
      ? curvedPathThrough([start, ...inner, end])
      : getRoutePath(start, end, shape, inner, startNormal, endNormal, conn.cornerRadius || 0, jumps);
    const handles = ends && !conn.locked && (selected || editingConnectionId === conn.id) ? getHandles(shape, ends, inner) : [];
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    const warnings = validateConnection(conn, instances, templates);

    const isGnd = fromPort.isGround || toPort.isGround;
    const isPower = fromPort.isPower || toPort.isPower;
    const connType = fromPort.connectorType || 'generic';
    
    let strokeColor;
    if (isGnd) {
       strokeColor = theme === 'light' ? '#000000' : '#71717a';
    } else if (isPower) {
       strokeColor = '#ff0000'; 
    } else {
       strokeColor = conn.color || '#6366f1';
    }

    const haloColor = theme === 'light' ? '#ffffff' : '#09090b';
    const thickness = conn.strokeWidth === 'thick' ? 5 : conn.strokeWidth === 'thin' ? 1.5 : 3;
    const haloThickness = thickness + 6;
    const markerEnd = (conn.arrowHead === 'end' || conn.arrowHead === 'both') ? 'url(#arrow-end)' : undefined;
    const markerStart = (conn.arrowHead === 'start' || conn.arrowHead === 'both') ? 'url(#arrow-start)' : undefined;

    let strokeDasharray = "none";
    if (conn.lineStyle === 'dashed') strokeDasharray = "8, 6";
    else if (conn.lineStyle === 'dotted') strokeDasharray = "2, 4";
    
    let TypeIcon = Activity;
    let iconColorClass = 'text-zinc-500';
    if (isGnd) {
        TypeIcon = ArrowDownToLine;
        iconColorClass = 'text-zinc-400';
    } else if (isPower) {
        TypeIcon = Zap;
        iconColorClass = 'text-yellow-500 fill-yellow-500';
    } else if (connType.includes('network') || connType.includes('rj45') || connType.includes('ethernet')) {
        TypeIcon = Network;
        iconColorClass = 'text-blue-500';
    } else if (connType.includes('video') || connType.includes('camera') || connType.includes('monitor') || connType.includes('360') || connType.includes('mdr')) {
        TypeIcon = Video;
        iconColorClass = 'text-purple-500';
    }

    return (
        <g 
          data-connection-id={conn.id}
          className={`group pointer-events-auto ${conn.locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          onClick={(e) => { e.stopPropagation(); onSelect?.(conn.id); }}
          onDoubleClick={(e) => !conn.locked && handleConnectionDoubleClick(e, conn.id)}
          onMouseEnter={() => setHoveredConnectionId(conn.id)}
          onMouseLeave={() => setHoveredConnectionId(null)}
          style={{ opacity: conn.locked ? 0.7 : 1 }}
        >
          <path d={path} stroke={haloColor} strokeWidth={haloThickness} fill="none" />
          <path d={path} stroke="transparent" strokeWidth={thickness + 15} fill="none" />
          <path 
            d={path} 
            stroke={warnings.length > 0 ? '#f59e0b' : strokeColor} 
            strokeWidth={thickness} 
            strokeDasharray={strokeDasharray}
            fill="none"
            markerEnd={markerEnd}
            markerStart={markerStart}
            className="group-hover:stroke-current transition-all group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"
          />
          
          {warnings.length > 0 ? (
               <foreignObject x={midX + 10} y={midY - 25} width="24" height="24" className="pointer-events-none overflow-visible z-[9999]">
                  <div className="bg-amber-500 text-black rounded-full p-1 shadow-lg animate-pulse ring-2 ring-black" title={warnings.join('\n')}>
                      <AlertTriangle size={16} fill="currentColor" />
                  </div>
               </foreignObject>
          ) : (
              <foreignObject x={midX - 8} y={midY - 8} width="16" height="16" className="pointer-events-none overflow-visible">
                 <div className={`w-4 h-4 rounded-full border shadow-sm flex items-center justify-center ${theme === 'light' ? 'bg-white border-zinc-300' : 'bg-zinc-900 border-zinc-700'}`}>
                    {conn.locked ? <Lock size={10} className="text-zinc-500"/> : <TypeIcon size={10} className={iconColorClass} />}
                 </div>
              </foreignObject>
          )}

          {selected && <path d={path} stroke="#38bdf8" strokeWidth={thickness + 8} strokeOpacity={0.25} fill="none" className="pointer-events-none" />}
          {conn.label && (
              <foreignObject x={midX - 60} y={midY - 30} width="120" height="24" className="pointer-events-none overflow-visible">
                  <div className="flex justify-center">
                     <span 
                        className={`px-2 py-0.5 text-[10px] font-bold rounded border shadow-sm font-mono truncate max-w-[120px] ${theme === 'light' ? 'bg-white text-black border-black shadow-md' : 'bg-black/80 text-white border-zinc-700'}`}
                        title={conn.label}
                     >
                         {conn.label}
                     </span>
                  </div>
              </foreignObject>
          )}
          {!conn.locked && (
              <foreignObject x={midX - 30} y={midY - 12} width="60" height="24" className="opacity-0 group-hover:opacity-100 transition-opacity no-print">
                <div className="flex gap-1 justify-center">
                    <button onClick={() => setEditingConnectionId(conn.id)} className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-full shadow-lg transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => removeConnection(conn.id)} className="bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-full shadow-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </foreignObject>
          )}
          {hoveredConnectionId === conn.id && (
              <foreignObject x={midX + 20} y={midY + 20} width="280" height="140" className="pointer-events-none overflow-visible z-[100] no-print animate-in fade-in zoom-in-95 duration-150">
                  <div className={`border-2 p-4 rounded-xl shadow-2xl text-xs backdrop-blur-md relative overflow-hidden ${theme === 'light' ? 'bg-white/95 border-zinc-300 text-zinc-800' : 'bg-zinc-950/95 border-zinc-600 text-zinc-100'}`}>
                       <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: warnings.length > 0 ? '#f59e0b' : strokeColor }}></div>
                       
                       {warnings.length > 0 && (
                           <div className="mb-2 bg-amber-500/20 text-amber-500 p-2 rounded border border-amber-500/20 font-bold flex items-start gap-2">
                               <AlertTriangle size={14} className="shrink-0 mt-0.5"/>
                               <div>
                                   {warnings.map((w, i) => <div key={i}>{w}</div>)}
                               </div>
                           </div>
                       )}

                       <div className="flex justify-between items-start mb-3 pl-2">
                           <div>
                               <span className={`block font-extrabold text-sm mb-0.5 ${theme === 'light' ? 'text-black' : 'text-zinc-200'}`}>{conn.label || 'Bağlantı'}</span>
                               <span className="text-[10px] text-zinc-500 font-mono">{conn.id.slice(0,8)}</span>
                           </div>
                           <div className="w-4 h-4 rounded-full border border-zinc-600 shadow-inner" style={{ backgroundColor: strokeColor }}></div>
                       </div>
                       <div className="space-y-2 pl-2">
                           <div className={`flex items-center gap-2 ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                               <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center text-blue-400"><ArrowRight size={12} className="rotate-180"/></div>
                               <div className="flex flex-col">
                                   <span className="text-[10px] text-zinc-500 font-bold uppercase">ÇIKIŞ / KAYNAK</span>
                                   <span className="font-bold">{fromTemp.name} <span className="text-zinc-500">•</span> {fromPort.label}</span>
                               </div>
                           </div>
                           <div className={`flex items-center gap-2 ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                               <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center text-green-400"><ArrowRight size={12}/></div>
                               <div className="flex flex-col">
                                   <span className="text-[10px] text-zinc-500 font-bold uppercase">GİRİŞ / HEDEF</span>
                                   <span className="font-bold">{toTemp.name} <span className="text-zinc-500">•</span> {toPort.label}</span>
                               </div>
                           </div>
                       </div>
                       <div className={`mt-3 pt-2 border-t flex items-center gap-2 pl-2 ${theme === 'light' ? 'border-zinc-200' : 'border-zinc-800'}`}>
                           <Cable size={12} className="text-zinc-500"/>
                           <span className="text-[10px] font-mono text-zinc-400">{CONNECTOR_LABELS[fromPort.connectorType]} ↔ {CONNECTOR_LABELS[toPort.connectorType]}</span>
                       </div>
                  </div>
              </foreignObject>
          )}
          {handles.map(h => {
              const key = `${h.kind}-${h.index}`;
              const common = { 'data-handle': h.kind, 'data-handle-index': h.index } as Record<string, unknown>;
              if (h.kind === 'point') return (
                  <circle key={key} {...common} cx={h.at.x} cy={h.at.y} r={h.stub ? 6 : 7} fill={h.stub ? '#f59e0b' : '#38bdf8'} stroke="#fff" strokeWidth="2"
                      className="cursor-move" onMouseDown={(e) => onHandleDown?.(e, conn.id, h)} onDoubleClick={(e) => onHandleDoubleClick?.(e, conn.id, h)} />
              );
              if (h.kind === 'segment') return (
                  <rect key={key} {...common} x={h.at.x - (h.axis === 'h' ? 9 : 4)} y={h.at.y - (h.axis === 'h' ? 4 : 9)} width={h.axis === 'h' ? 18 : 8} height={h.axis === 'h' ? 8 : 18} rx="3"
                      fill="#38bdf8" stroke="#fff" strokeWidth="1.5" className={h.axis === 'h' ? 'cursor-ns-resize' : 'cursor-ew-resize'} onMouseDown={(e) => onHandleDown?.(e, conn.id, h)} />
              );
              return (
                  <circle key={key} {...common} cx={h.at.x} cy={h.at.y} r="5" fill="#fff" stroke="#38bdf8" strokeWidth="2" fillOpacity="0.9"
                      className="cursor-copy" onMouseDown={(e) => onHandleDown?.(e, conn.id, h)} />
              );
          })}
        </g>
    );
};

export const ConnectionLine = React.memo(ConnectionLineComponent);
