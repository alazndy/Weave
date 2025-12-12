
import React from 'react';
import { ProductInstance, ProductTemplate, CONNECTOR_LABELS, PortDefinition } from '../../types';
import { getConnectorShapeClass, validatePortCompatibility } from '../../utils/canvasHelpers';
import { FlipHorizontal, RotateCw, Trash2, ArrowDownRight, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowDownToLine, Zap, Lock, AlertTriangle } from 'lucide-react';

interface ProductNodeProps {
  inst: ProductInstance;
  template: ProductTemplate;
  itemIndex: number | string;
  isSelected: boolean;
  isDragged: boolean;
  isScaleToolActive: boolean;
  theme: 'light' | 'dark';
  connectingStart: { instanceId: string; portId: string } | null;
  startPort: PortDefinition | null;
  handleInstanceMouseDown: (e: React.MouseEvent, id: string) => void;
  handleInstanceContextMenu: (e: React.MouseEvent, id: string) => void;
  toggleMirrorInstance: (id: string) => void;
  setRotatingInstance: (id: string) => void;
  removeInstance: (id: string) => void;
  handleResizeMouseDown: (e: React.MouseEvent, id: string) => void;
  handlePortClick: (e: React.MouseEvent, instId: string, portId: string) => void;
  handlePortDoubleClick: (e: React.MouseEvent, tempId: string, portId: string) => void;
  onUndoCheckpoint: () => void;
}

const getDirectionIcon = (dir?: string) => {
    switch(dir) {
        case 'top': return <ChevronUp size={12} className="text-white drop-shadow-md" />;
        case 'bottom': return <ChevronDown size={12} className="text-white drop-shadow-md" />;
        case 'left': return <ChevronLeft size={12} className="text-white drop-shadow-md" />;
        case 'right': return <ChevronRight size={12} className="text-white drop-shadow-md" />;
        default: return null;
    }
};

const ProductNodeComponent: React.FC<ProductNodeProps> = ({
  inst, template, itemIndex, isSelected, isDragged, isScaleToolActive, theme, connectingStart, startPort,
  handleInstanceMouseDown, handleInstanceContextMenu, toggleMirrorInstance,
  setRotatingInstance, removeInstance, handleResizeMouseDown,
  handlePortClick, handlePortDoubleClick, onUndoCheckpoint
}) => {
    const currentWidth = inst.width || template.width;
    const currentHeight = inst.height || template.height;
    
    const labelConfig = inst.labelConfig || { visible: true, fontSize: 14, color: '#ffffff', backgroundColor: '#000000', position: 'bottom' };
    const labelVisible = labelConfig.visible !== false; 
    const labelPos = labelConfig.position || 'bottom';

    const r = inst.rotation || 0;
    const rad = r * Math.PI / 180;
    const bboxH = currentWidth * Math.abs(Math.sin(rad)) + currentHeight * Math.abs(Math.cos(rad));
    
    const isLight = theme === 'light';
    const effectiveLabelBg = isLight && labelConfig.backgroundColor === '#000000' ? '#ffffff' : labelConfig.backgroundColor;
    const effectiveLabelColor = isLight && labelConfig.color === '#ffffff' ? '#000000' : labelConfig.color;
    const labelBorder = isLight ? '1px solid #ccc' : `1px solid ${labelConfig.backgroundColor === '#000000' ? 'rgba(255,255,255,0.1)' : 'transparent'}`;

    return (
        <div
          style={{ left: inst.x, top: inst.y, width: currentWidth, height: currentHeight }}
          className="absolute z-30 flex items-center justify-center pointer-events-none" 
        >
          <div
              className={`relative w-full h-full pointer-events-auto group border-2 rounded transition-all cursor-default ${isSelected ? 'border-solid border-teal-400 shadow-[0_0_30px_rgba(45,212,191,0.3)] ring-2 ring-teal-500/50' : isDragged ? 'border-solid border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)]' : theme === 'light' ? 'border-dashed border-zinc-400 hover:border-solid hover:border-zinc-600' : 'border-dashed border-zinc-600/50 hover:border-solid hover:border-zinc-400'} ${theme === 'light' ? 'bg-white shadow-sm' : 'bg-zinc-800'}`}
              style={{ 
                  transform: `rotate(${r}deg)`,
                  transition: 'transform 0.1s ease-out',
                  opacity: inst.locked ? 0.8 : 1
              }}
              onMouseDown={(e) => handleInstanceMouseDown(e, inst.id)}
              onContextMenu={(e) => handleInstanceContextMenu(e, inst.id)}
          >
                <div className="absolute -top-3 -left-3 w-9 h-9 bg-yellow-400 text-black font-extrabold rounded-full border border-black flex items-center justify-center text-base z-50 shadow-md pointer-events-none" style={{ transform: `rotate(${-r}deg)` }}>{itemIndex}</div>
                
                {inst.locked && (
                     <div className="absolute -top-3 left-8 w-7 h-7 bg-zinc-800 text-zinc-400 rounded-full border border-zinc-600 flex items-center justify-center z-50 shadow-md pointer-events-none" style={{ transform: `rotate(${-r}deg)` }}>
                        <Lock size={14}/>
                     </div>
                )}
                
                {!inst.locked && isSelected && !isScaleToolActive && (
                    <div className="absolute -top-4 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition z-50 no-print" style={{ transform: `rotate(${-r}deg)` }}>
                        <button 
                            className="bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-500 shadow"
                            onClick={(e) => { e.stopPropagation(); toggleMirrorInstance(inst.id); }}
                            onMouseDown={e => e.stopPropagation()}
                            title="Aynala / Çevir"
                        >
                            <FlipHorizontal size={14} />
                        </button>
                        <button 
                            className="bg-indigo-600 text-white p-1.5 rounded-full hover:bg-indigo-500 shadow cursor-grab active:cursor-grabbing"
                            onMouseDown={(e) => { setRotatingInstance(inst.id); onUndoCheckpoint && onUndoCheckpoint(); e.stopPropagation(); }}
                            title="Döndür (Sürükle)"
                        >
                            <RotateCw size={14} />
                        </button>
                        <button 
                            className="bg-red-600 text-white p-1.5 rounded-full hover:bg-red-500 shadow" 
                            onClick={(e) => removeInstance(inst.id)} 
                            onMouseDown={e => e.stopPropagation()}
                            title="Sil"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                )}

                <img 
                    src={template.imageUrl} 
                    alt={template.name} 
                    className="w-full h-full object-contain pointer-events-none p-1" 
                    style={{ 
                        transform: `scaleX(${inst.mirrored ? -1 : 1})`,
                    }}
                />
                
                {!inst.locked && (isScaleToolActive || isSelected) && (
                    <div 
                        className={`absolute bottom-0 right-0 w-6 h-6 bg-teal-500 border-2 border-white rounded-full cursor-nwse-resize z-50 flex items-center justify-center shadow-lg hover:scale-125 transition-transform no-print ${isScaleToolActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        onMouseDown={(e) => handleResizeMouseDown(e, inst.id)} 
                        style={{ transform: `rotate(${-r}deg) translate(25%, 25%)` }}
                    >
                        <ArrowDownRight size={14} className="text-white" strokeWidth={3} />
                    </div>
                )}
                
                {template.ports.map(port => {
                    let portX = port.x;
                    if (inst.mirrored) portX = 100 - portX;
                    const shapeClass = getConnectorShapeClass(port.connectorType);
                    
                    let compatibility: string[] = [];
                    let isCompatible = true;
                    
                    if (startPort) {
                        if (inst.id === connectingStart?.instanceId && port.id === startPort.id) {
                             // Self
                        } else {
                             compatibility = validatePortCompatibility(startPort, port);
                             isCompatible = compatibility.length === 0;
                        }
                    }

                    const portStyleClass = startPort
                        ? (inst.id === connectingStart?.instanceId && port.id === startPort.id
                            ? 'bg-teal-400 ring-2 ring-teal-200 z-[60]' // Origin
                            : isCompatible 
                                ? 'ring-4 ring-emerald-400/50 bg-emerald-500 scale-125 z-[60] animate-pulse' // Valid Target
                                : 'opacity-30 grayscale cursor-not-allowed scale-75') // Invalid Target
                        : connectingStart?.portId === port.id ? 'bg-teal-400 ring-2 ring-teal-200' : '';

                    return (
                    <div
                        key={port.id}
                        className={`absolute w-5 h-5 -ml-2.5 -mt-2.5 border border-zinc-900 cursor-crosshair z-50 transition-all flex items-center justify-center group/port ${shapeClass} ${portStyleClass} ${!startPort ? 'hover:scale-125' : ''}`}
                        style={{ 
                            left: `${portX}%`, 
                            top: `${port.y}%`,
                            backgroundColor: startPort && isCompatible && inst.id !== connectingStart?.instanceId ? undefined : (port.customColor ? port.customColor : (port.isGround ? '#52525b' : (port.type === 'input' ? '#3b82f6' : port.type === 'output' ? '#ef4444' : '#14b8a6')))
                        }}
                        onClick={(e) => handlePortClick(e, inst.id, port.id)}
                        onDoubleClick={(e) => handlePortDoubleClick(e, inst.templateId, port.id)}
                        onMouseDown={e => e.stopPropagation()} 
                    >
                        <div className="w-1.5 h-1.5 bg-black/50 rounded-full"></div>
                        <div className="absolute pointer-events-none opacity-80 z-40">
                            {getDirectionIcon(port.direction)}
                        </div>
                        {port.isPower && (
                            <div className={`absolute -top-3 -right-3 rounded-full p-0.5 shadow-sm pointer-events-none ${port.isGround ? 'bg-zinc-700 text-white' : 'bg-yellow-500 text-black'}`}>
                                {port.isGround ? <ArrowDownToLine size={10}/> : <Zap size={10} fill="currentColor" />}
                            </div>
                        )}
                        <div className={`absolute left-1/2 -translate-x-1/2 -top-12 bg-black/95 border border-zinc-600 px-3 py-1.5 rounded text-xs text-white whitespace-nowrap hidden group-hover/port:flex flex-col items-center z-[60] pointer-events-none shadow-xl min-w-[120px]`} style={{ transform: `rotate(${-r}deg)` }}>
                            {startPort && !isCompatible ? (
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-1 text-red-400 font-bold mb-1">
                                        <AlertTriangle size={12} /> Bağlantı Uyumsuz
                                    </div>
                                    {compatibility.map((c, i) => <span key={i} className="text-[9px] text-zinc-400">{c}</span>)}
                                </div>
                            ) : (
                                <>
                                    <span className="font-extrabold mb-0.5">{port.label}</span>
                                    <span className="text-zinc-300 font-medium text-[10px]">{CONNECTOR_LABELS[port.connectorType]}</span>
                                    {port.isPower && (
                                        <span className={`text-[10px] font-mono font-bold mt-1 pt-1 border-t border-zinc-600 ${port.isGround ? 'text-zinc-400' : 'text-yellow-400'}`}>
                                            {port.isGround ? 'GND / EARTH' : `${port.voltage}V ${port.powerType} ${port.amperage ? `/ ${port.amperage}A` : ''}`}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    );
                })}
          </div>
          
          {labelVisible && (
              <div 
                className={`absolute font-bold text-center py-1.5 px-4 rounded backdrop-blur-sm pointer-events-none whitespace-nowrap shadow-sm z-40`}
                style={{
                    color: effectiveLabelColor,
                    backgroundColor: effectiveLabelBg,
                    border: labelBorder,
                    fontSize: `${labelConfig.fontSize}px`,
                    top: labelPos === 'top' ? `calc(50% - ${bboxH/2}px - 20px)` : labelPos === 'center' ? '50%' : `calc(50% + ${bboxH/2}px + 10px)`,
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                }}
              >
                  {template.name}
              </div>
          )}
        </div>
    );
};

export const ProductNode = React.memo(ProductNodeComponent, (prev, next) => {
    return (
        prev.inst === next.inst &&
        prev.isSelected === next.isSelected &&
        prev.isDragged === next.isDragged &&
        prev.isScaleToolActive === next.isScaleToolActive && 
        prev.theme === next.theme &&
        prev.itemIndex === next.itemIndex &&
        prev.connectingStart === next.connectingStart &&
        prev.startPort === next.startPort // Added
    );
});
