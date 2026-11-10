import React, { useEffect, useRef } from 'react';
import { Map as MapIcon, ZoomOut, Maximize, ZoomIn, Hand, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface CanvasControlsProps {
    isMinimapVisible: boolean;
    setIsMinimapVisible: (v: boolean) => void;
    handleZoomOut: () => void;
    handleFitScreen: () => void;
    handleZoomIn: () => void;
    scale: number;
    /** Zoom to an absolute scale (1 = 100%) around the viewport centre. */
    onZoomTo?: (scale: number) => void;
    /** Move the sheet under the viewport by (dx, dy) screen px. */
    onPanBy?: (dx: number, dy: number) => void;
    isHandActive?: boolean;
    onToggleHand?: () => void;
}

const MIN = 0.1, MAX = 5;
// slider position (0..100) <-> scale on a log axis so 10%..500% feels even
const toSlider = (s: number) => Math.round((Math.log(s / MIN) / Math.log(MAX / MIN)) * 100);
const fromSlider = (v: number) => MIN * Math.pow(MAX / MIN, v / 100);

const btn = 'p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors';

/** Navigation bar: pan pad (hold to keep moving), hand tool, zoom slider, % reset, fit and minimap. */
export const CanvasControls: React.FC<CanvasControlsProps> = ({
    isMinimapVisible, setIsMinimapVisible, handleZoomOut, handleFitScreen, handleZoomIn, scale,
    onZoomTo, onPanBy, isHandActive, onToggleHand,
}) => {
    const timer = useRef<{ t?: ReturnType<typeof setTimeout>; i?: ReturnType<typeof setInterval> }>({});
    const stop = () => { clearTimeout(timer.current.t); clearInterval(timer.current.i); };
    useEffect(() => stop, []);

    // One step on press, then keeps moving while held.
    const holdPan = (dx: number, dy: number) => (e: React.PointerEvent) => {
        if (!onPanBy) return;
        e.preventDefault();
        stop();
        onPanBy(dx * 4, dy * 4);
        timer.current.t = setTimeout(() => { timer.current.i = setInterval(() => onPanBy(dx, dy), 30); }, 350);
    };
    const pad = (label: string, Icon: typeof ChevronUp, dx: number, dy: number) => (
        <button type="button" aria-label={label} title={label} className={btn}
            onPointerDown={holdPan(dx, dy)} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}>
            <Icon size={16} />
        </button>
    );
    const sep = <div className="w-px bg-white/10 mx-0.5 self-stretch" />;

    return (
        <div data-testid="navigation-bar" className="absolute bottom-16 left-6 z-40 flex items-center gap-0.5 bg-ink/90 backdrop-blur-md border border-white/10 rounded-full px-1.5 py-1 shadow-xl no-print">
            <button onClick={() => setIsMinimapVisible(!isMinimapVisible)} className={`p-1.5 rounded-full transition-colors ${isMinimapVisible ? 'text-paprika bg-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`} title="Mini Harita"><MapIcon size={18} /></button>
            {onToggleHand && (
                <button type="button" onClick={onToggleHand} aria-pressed={!!isHandActive} aria-label="Kaydırma modu" title="Kaydırma modu: sürükleyerek gez (H)"
                    className={`p-1.5 rounded-full transition-colors ${isHandActive ? 'bg-amber-500 text-zinc-900' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}><Hand size={18} /></button>
            )}
            {onPanBy && (<>
                {sep}
                {pad('Sola kaydır', ChevronLeft, 10, 0)}
                {pad('Yukarı kaydır', ChevronUp, 0, 10)}
                {pad('Aşağı kaydır', ChevronDown, 0, -10)}
                {pad('Sağa kaydır', ChevronRight, -10, 0)}
            </>)}
            {sep}
            <button onClick={handleZoomOut} className={btn} title="Uzaklaş"><ZoomOut size={18} /></button>
            {onZoomTo && (
                <input type="range" min={0} max={100} step={1} value={Math.min(100, Math.max(0, toSlider(scale)))}
                    aria-label="Zoom düzeyi" title="Zoom düzeyi" data-testid="zoom-slider"
                    onChange={(e) => onZoomTo(fromSlider(Number(e.target.value)))}
                    className="w-24 h-1 accent-amber-500 cursor-pointer" />
            )}
            <button onClick={handleZoomIn} className={btn} title="Yakınlaş" aria-label="Yakınlaş"><ZoomIn size={18} /></button>
            <button onClick={handleFitScreen} className={btn} title="Ekrana Sığdır"><Maximize size={18} /></button>
            {sep}
            <button type="button" onClick={() => onZoomTo?.(1)} title="%100'e dön" aria-label="Yakınlaştırmayı %100 yap"
                className="px-2 min-w-[3.25rem] text-xs font-mono font-bold text-zinc-400 hover:text-white select-none" data-testid="zoom-percent">
                {Math.round(scale * 100)}%
            </button>
        </div>
    );
};
