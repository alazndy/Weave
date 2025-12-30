
import React from 'react';
import { Zone } from '../../types';
import { Edit2, Trash2, Lock, ArrowDownRight } from 'lucide-react';

interface ZoneNodeProps {
  zone: Zone;
  isSelected: boolean;
  activeTool: string;
  theme: 'light' | 'dark';
  onSelectIds: ((ids: string[], multi: boolean) => void) | undefined;
  onUndoCheckpoint: () => void;
  setDraggedInstance: (id: string) => void;
  setEditingZoneId: (id: string) => void;
  removeZone: (id: string) => void;
  handleResizeMouseDown: (e: React.MouseEvent, id: string) => void;
}

export const ZoneNode: React.FC<ZoneNodeProps> = ({
  zone, isSelected, activeTool, theme, onSelectIds, onUndoCheckpoint,
  setDraggedInstance, setEditingZoneId, removeZone, handleResizeMouseDown
}) => {
    const isLight = theme === 'light';
    const isScaleTool = activeTool === 'scale';
    
    return (
        <div 
            style={{ 
                left: zone.x, 
                top: zone.y, 
                width: zone.width, 
                height: zone.height, 
                borderColor: zone.color, 
                backgroundColor: isLight ? `${zone.color}05` : `${zone.color}10`,
                opacity: zone.locked ? 0.7 : 1
            }} 
            className={`absolute border-2 border-dashed rounded flex items-start justify-start p-3 z-0 group pointer-events-auto ${isSelected ? 'ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : ''}`}
            onMouseDown={(e) => {
                if (activeTool === 'zone' || activeTool === 'select-box') return;

                if(zone.locked) {
                    onSelectIds ? onSelectIds([zone.id], e.ctrlKey || e.shiftKey) : null;
                    return;
                }
                e.stopPropagation();
                onSelectIds ? onSelectIds([zone.id], e.ctrlKey || e.shiftKey) : null;
                if (activeTool === 'move' || activeTool === 'cursor') {
                    onUndoCheckpoint();
                    setDraggedInstance(zone.id); 
                }
            }}
        >
            <span 
                style={{ 
                    color: isLight ? '#000' : zone.color,
                    backgroundColor: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.5)',
                    borderColor: isLight ? zone.color : 'transparent'
                }} 
                className={`font-bold uppercase text-base tracking-widest px-3 py-1 rounded shadow backdrop-blur-sm flex items-center gap-2 ${isLight ? 'border border-solid' : ''}`}
            >
                {zone.locked && <Lock size={12} />}
                {zone.label}
            </span>
            
            {!zone.locked && (
                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 flex gap-1 p-1 no-print">
                    <button onClick={() => setEditingZoneId(zone.id)} className="bg-zinc-800 p-1.5 rounded text-zinc-300 hover:text-white"><Edit2 size={16}/></button>
                    <button onClick={() => removeZone(zone.id)} className="bg-zinc-800 p-1.5 rounded text-zinc-300 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
            )}

            {!zone.locked && (isSelected || isScaleTool) && (
                <div 
                    className={`absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full cursor-nwse-resize z-50 flex items-center justify-center shadow-lg hover:scale-125 transition-transform no-print ${isScaleTool ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    onMouseDown={(e) => { e.stopPropagation(); handleResizeMouseDown(e, zone.id); }}
                    style={{ transform: 'translate(25%, 25%)' }}
                >
                     <ArrowDownRight size={14} className="text-white" strokeWidth={3} />
                </div>
            )}
        </div>
    );
};
