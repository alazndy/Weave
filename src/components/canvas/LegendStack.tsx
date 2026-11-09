import React, { useLayoutEffect, useRef, useState } from 'react';

interface Props {
  /** Height of the paper in canvas px; the legend shrinks (never clips) to fit it. */
  paperHeight: number;
  children: React.ReactNode;
}

/** Bottom-right stack of BOM + title block. Grows with its content and scales down on small paper. */
export const LegendStack: React.FC<Props> = ({ paperHeight, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const natural = el.offsetHeight;                // unaffected by the transform
      const room = paperHeight - 40;
      setScale(natural > 0 && natural > room ? Math.max(0.2, room / natural) : 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [paperHeight]);

  return (
    <div
      ref={ref}
      data-testid="legend-stack"
      data-scale={scale.toFixed(3)}
      className="absolute right-[20px] bottom-[20px] z-10 flex flex-col items-end gap-2 pointer-events-none"
      style={{ width: 'min(100% - 40px, 1100px)', transform: scale < 1 ? `scale(${scale})` : undefined, transformOrigin: 'bottom right' }}
    >
      {children}
    </div>
  );
};
