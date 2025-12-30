
import React from 'react';
import { Map as MapIcon, ZoomOut, Maximize, ZoomIn } from 'lucide-react';

interface CanvasControlsProps {
    isMinimapVisible: boolean;
    setIsMinimapVisible: (v: boolean) => void;
    handleZoomOut: () => void;
    handleFitScreen: () => void;
    handleZoomIn: () => void;
    scale: number;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
    isMinimapVisible, setIsMinimapVisible, handleZoomOut, handleFitScreen, handleZoomIn, scale
}) => {
    return (
        <div className={`absolute bottom-6 left-6 z-40 flex gap-1 bg-ink/90 backdrop-blur-md border border-white/10 rounded-full p-1.5 shadow-xl no-print`}>
            <button onClick={() => setIsMinimapVisible(!isMinimapVisible)} className={`p-2 rounded-full transition-colors ${isMinimapVisible ? 'text-paprika bg-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`} title="Harita"><MapIcon size={18}/></button>
            <div className="w-px bg-white/10 mx-1"></div>
            <button onClick={handleZoomOut} className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Uzaklaş"><ZoomOut size={18}/></button>
            <button onClick={handleFitScreen} className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Ekrana Sığdır"><Maximize size={18}/></button>
            <button onClick={handleZoomIn} className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Yakınlaş"><ZoomIn size={18}/></button>
            <div className="w-px bg-white/10 mx-1"></div>
            <div className="px-2 flex items-center text-xs font-mono font-bold text-zinc-500 select-none">
                {Math.round(scale * 100)}%
            </div>
        </div>
    );
};
