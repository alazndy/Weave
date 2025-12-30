
import React from 'react';
import { MousePointer2, Move, BoxSelect, Square, Type, Magnet, MessageSquare, Scaling, Cable } from 'lucide-react';

export type ActiveTool = 'cursor' | 'move' | 'scale' | 'zone' | 'text' | 'select-box' | 'comment' | 'manual-route';

interface CanvasToolbarProps {
    activeTool: ActiveTool;
    setActiveTool: (t: ActiveTool) => void;
    isGridSnapEnabled: boolean;
    setIsGridSnapEnabled: (e: boolean) => void;
    theme: 'light' | 'dark';
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
    activeTool, setActiveTool, isGridSnapEnabled, setIsGridSnapEnabled, theme
}) => {
    const btnClass = (active: boolean) => `p-2 rounded-md transition-all ${active ? 'bg-gradient-to-r from-paprika to-apricot text-white shadow-lg' : 'text-zinc-400 hover:text-paprika hover:bg-white/5'}`;

    return (
        <div className={`absolute top-20 left-4 z-40 flex flex-col gap-1.5 border p-1 rounded-lg shadow-xl backdrop-blur-md no-print ${theme === 'light' ? 'bg-white/90 border-zinc-300' : 'bg-ink/90 border-white/5'}`}>
            <button onClick={() => setActiveTool('cursor')} className={btnClass(activeTool === 'cursor')} title="Seçim (V)"><MousePointer2 size={20} /></button>
            <button onClick={() => setActiveTool('move')} className={btnClass(activeTool === 'move')} title="Taşı (M)"><Move size={20} /></button>
            <button onClick={() => setActiveTool('scale')} className={btnClass(activeTool === 'scale')} title="Ölçekle / Boyutlandır (S)"><Scaling size={20} /></button>
            <button onClick={() => setActiveTool('select-box')} className={btnClass(activeTool === 'select-box')} title="Kutu Seçimi (B)"><BoxSelect size={20} /></button>
            <div className="h-px bg-zinc-700 my-0.5"></div>
            <button onClick={() => setActiveTool('manual-route')} className={btnClass(activeTool === 'manual-route')} title="Manuel Rota Çizimi (R)"><Cable size={20} /></button>
            <button onClick={() => setActiveTool('zone')} className={btnClass(activeTool === 'zone')} title="Bölge Ekle (Z)"><Square size={20} /></button>
            <button onClick={() => setActiveTool('text')} className={btnClass(activeTool === 'text')} title="Metin Ekle (T)"><Type size={20} /></button>
            <button onClick={() => setActiveTool('comment')} className={btnClass(activeTool === 'comment')} title="Not / Yorum Ekle (C)"><MessageSquare size={20} /></button>
            <div className="h-px bg-zinc-700 my-0.5"></div>
            <button onClick={() => setIsGridSnapEnabled(!isGridSnapEnabled)} className={btnClass(isGridSnapEnabled)} title="Izgaraya Yapış"><Magnet size={20} /></button>
        </div>
    );
};
