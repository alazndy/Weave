
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MousePointer2, Hand, Move, BoxSelect, Square, Type, Magnet, MessageSquare, Scaling, Cable } from 'lucide-react';

export type ActiveTool = 'cursor' | 'pan' | 'move' | 'scale' | 'zone' | 'text' | 'select-box' | 'comment' | 'manual-route';

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
    const { t } = useTranslation();
    const btnClass = (active: boolean) => `p-2 rounded-md transition-all ${active ? 'bg-amber-500 text-zinc-900 shadow-lg' : theme === 'light' ? 'text-zinc-600 hover:text-zinc-900 hover:bg-black/5' : 'text-zinc-400 hover:text-amber-400 hover:bg-white/10'}`;

    return (
        <div className={`absolute top-20 left-4 z-40 flex flex-col gap-1.5 border p-1 rounded-lg shadow-xl backdrop-blur-md no-print ${theme === 'light' ? 'bg-white/90 border-zinc-300' : 'bg-ink/90 border-white/5'}`}>
            <button onClick={() => setActiveTool('cursor')} className={btnClass(activeTool === 'cursor')} title={t('tools.select')}><MousePointer2 size={20} /></button>
            <button onClick={() => setActiveTool('pan')} className={btnClass(activeTool === 'pan')} title={t('tools.panHint')} aria-label={t('tools.pan')}><Hand size={20} /></button>
            <button onClick={() => setActiveTool('move')} className={btnClass(activeTool === 'move')} title={t('tools.move')}><Move size={20} /></button>
            <button onClick={() => setActiveTool('scale')} className={btnClass(activeTool === 'scale')} title={t('tools.scale')}><Scaling size={20} /></button>
            <button onClick={() => setActiveTool('select-box')} className={btnClass(activeTool === 'select-box')} title={t('tools.boxSelect')}><BoxSelect size={20} /></button>
            <div className={`h-px my-0.5 ${theme === 'light' ? 'bg-zinc-300' : 'bg-zinc-700'}`}></div>
            <button onClick={() => setActiveTool('manual-route')} className={btnClass(activeTool === 'manual-route')} title={t('tools.manualRoute')}><Cable size={20} /></button>
            <button onClick={() => setActiveTool('zone')} className={btnClass(activeTool === 'zone')} title={t('tools.zone')}><Square size={20} /></button>
            <button onClick={() => setActiveTool('text')} className={btnClass(activeTool === 'text')} title={t('tools.text')}><Type size={20} /></button>
            <button onClick={() => setActiveTool('comment')} className={btnClass(activeTool === 'comment')} title={t('tools.comment')}><MessageSquare size={20} /></button>
            <div className={`h-px my-0.5 ${theme === 'light' ? 'bg-zinc-300' : 'bg-zinc-700'}`}></div>
            <button onClick={() => setIsGridSnapEnabled(!isGridSnapEnabled)} className={btnClass(isGridSnapEnabled)} title={t('tools.gridSnap')}><Magnet size={20} /></button>
        </div>
    );
};
