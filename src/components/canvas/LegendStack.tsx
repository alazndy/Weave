import React, { useLayoutEffect, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';

interface Props {
  /** Paper size in canvas px; the legend shrinks (never clips) to fit it. */
  paperWidth?: number;
  paperHeight: number;
  /** User size factor (1 = default). Never exceeds what fits on the sheet. */
  userScale?: number;
  /** Drag the corner handle to resize; `silent` = no undo checkpoint (continuous drag updates). */
  onUserScaleChange?: (scale: number | undefined, opts?: { silent?: boolean; checkpoint?: boolean }) => void;
  children: React.ReactNode;
}

const MIN_SCALE = 0.3, MAX_SCALE = 3;

/** Bottom-right stack of BOM + title block. Grows with its content, scales to fit the paper, and can be resized. */
export const LegendStack: React.FC<Props> = ({ paperWidth, paperHeight, userScale, onUserScaleChange, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const user = userScale && userScale > 0 ? userScale : 1;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const natH = el.offsetHeight, natW = el.offsetWidth;      // unaffected by the transform
      let s = user;
      if (natH > 0) s = Math.min(s, (paperHeight - 40) / natH);
      if (natW > 0 && paperWidth) s = Math.min(s, (paperWidth - 40) / natW);
      setScale(Math.max(0.2, s));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [paperHeight, paperWidth, user]);

  const startResize = (e: React.PointerEvent) => {
    if (!onUserScaleChange) return;
    e.preventDefault(); e.stopPropagation();
    const el = ref.current!;
    const rect = el.getBoundingClientRect();
    const eff = scale;                                          // what the user currently sees
    const w0 = rect.width, h0 = rect.height;
    const x0 = e.clientX, y0 = e.clientY;
    onUserScaleChange(user, { checkpoint: true });             // one undo step for the whole drag
    const move = (ev: PointerEvent) => {
      const rw = (w0 - (ev.clientX - x0)) / w0;                 // dragging up/left grows (anchored bottom-right)
      const rh = (h0 - (ev.clientY - y0)) / h0;
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, eff * Math.max(rw, rh)));
      onUserScaleChange(Math.round(next * 100) / 100, { silent: true });
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  return (
    <div
      ref={ref}
      data-testid="legend-stack"
      data-scale={scale.toFixed(3)}
      className="absolute right-[20px] bottom-[20px] z-10 flex flex-col items-end gap-2 pointer-events-none"
      style={{ width: 'min(100% - 40px, 1100px)', transform: scale !== 1 ? `scale(${scale})` : undefined, transformOrigin: 'bottom right' }}
    >
      {children}
      {onUserScaleChange && (
        <button type="button" data-testid="legend-scale-handle" aria-label="Lejant boyutunu ayarla" title="Sürükleyerek lejantın boyunu ayarla (çift tık: sıfırla)"
          onPointerDown={startResize}
          onDoubleClick={(e) => { e.stopPropagation(); onUserScaleChange(undefined, { checkpoint: true }); onUserScaleChange(undefined, { silent: true }); }}
          className="absolute -top-3 -left-3 z-[70] p-1 rounded-full bg-blue-600 text-white shadow-lg cursor-nwse-resize opacity-40 hover:opacity-100 pointer-events-auto no-print">
          <Maximize2 size={12} style={{ transform: `scale(${1 / scale})` }} />
        </button>
      )}
    </div>
  );
};
