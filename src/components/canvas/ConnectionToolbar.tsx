import React from 'react';
import { Spline, Minus, CornerDownRight, RotateCcw, Trash2, Lock, Unlock, ArrowRight, ArrowLeft, ArrowLeftRight, Ban, Pencil, X } from 'lucide-react';
import type { Connection, ConnectionShape, LineStyle } from '../../types';

interface Props {
  conn: Connection;
  theme: 'light' | 'dark';
  onChange: (patch: Partial<Connection>) => void;
  onResetRoute: () => void;
  onDelete: () => void;
  onEditDetails: () => void;
  onClose: () => void;
}

const SHAPES: { v: ConnectionShape; label: string; Icon: React.ElementType }[] = [
  { v: 'orthogonal', label: 'Dik açılı', Icon: CornerDownRight },
  { v: 'straight', label: 'Düz', Icon: Minus },
  { v: 'curved', label: 'Eğri', Icon: Spline },
];
const STYLES: { v: LineStyle; label: string }[] = [{ v: 'solid', label: 'Düz çizgi' }, { v: 'dashed', label: 'Kesikli' }, { v: 'dotted', label: 'Noktalı' }];
const WIDTHS = [{ v: 'thin', label: 'İnce' }, { v: 'normal', label: 'Normal' }, { v: 'thick', label: 'Kalın' }] as const;
const ARROWS = [
  { v: 'none', label: 'Oksuz', Icon: Ban }, { v: 'end', label: 'Sona ok', Icon: ArrowRight },
  { v: 'start', label: 'Başa ok', Icon: ArrowLeft }, { v: 'both', label: 'İki uca ok', Icon: ArrowLeftRight },
] as const;

export const ConnectionToolbar: React.FC<Props> = ({ conn, theme, onChange, onResetRoute, onDelete, onEditDetails, onClose }) => {
  const shape = conn.shape || 'curved';
  const radius = conn.cornerRadius ?? 0;
  const locked = !!conn.locked;
  const box = theme === 'light' ? 'bg-white/95 border-zinc-300 text-zinc-800' : 'bg-zinc-900/95 border-zinc-700 text-zinc-100';
  const btn = (on: boolean) => `h-8 min-w-8 px-2 rounded-md flex items-center justify-center text-xs font-medium transition-colors disabled:opacity-40 ${on ? 'bg-amber-400 text-zinc-900' : theme === 'light' ? 'hover:bg-zinc-200' : 'hover:bg-zinc-800'}`;
  const sep = <span className={`w-px h-6 mx-1 ${theme === 'light' ? 'bg-zinc-300' : 'bg-zinc-700'}`} />;

  return (
    <div role="toolbar" aria-label="Bağlantı araçları" data-testid="connection-toolbar"
      onMouseDown={(e) => e.stopPropagation()}
      className={`absolute top-[92px] left-1/2 -translate-x-1/2 z-[60] flex max-w-[96%] flex-wrap items-center gap-0.5 rounded-xl border p-1.5 shadow-2xl backdrop-blur-md ${box}`}>
      {SHAPES.map(({ v, label, Icon }) => (
        <button key={v} type="button" title={label} aria-label={label} aria-pressed={shape === v} disabled={locked}
          onClick={() => onChange({ shape: v, controlPoints: undefined })} className={btn(shape === v)}><Icon size={16} /></button>
      ))}
      {sep}
      {STYLES.map(({ v, label }) => (
        <button key={v} type="button" title={label} aria-label={label} aria-pressed={(conn.lineStyle || 'solid') === v} disabled={locked}
          onClick={() => onChange({ lineStyle: v })} className={btn((conn.lineStyle || 'solid') === v)}>
          <svg width="22" height="8"><line x1="1" y1="4" x2="21" y2="4" stroke="currentColor" strokeWidth="2" strokeDasharray={v === 'dashed' ? '5 3' : v === 'dotted' ? '1 3' : undefined} /></svg>
        </button>
      ))}
      {sep}
      {WIDTHS.map(({ v, label }) => (
        <button key={v} type="button" title={`${label} kalınlık`} aria-label={`${label} kalınlık`} aria-pressed={(conn.strokeWidth || 'normal') === v} disabled={locked}
          onClick={() => onChange({ strokeWidth: v })} className={btn((conn.strokeWidth || 'normal') === v)}>
          <svg width="18" height="12"><line x1="1" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth={v === 'thin' ? 1.5 : v === 'normal' ? 3 : 5} /></svg>
        </button>
      ))}
      {sep}
      {ARROWS.map(({ v, label, Icon }) => (
        <button key={v} type="button" title={label} aria-label={label} aria-pressed={(conn.arrowHead || 'none') === v} disabled={locked}
          onClick={() => onChange({ arrowHead: v })} className={btn((conn.arrowHead || 'none') === v)}><Icon size={15} /></button>
      ))}
      {sep}
      <label className="flex items-center gap-1 px-1 text-xs" title="Renk (güç/toprak portlarında otomatik)">
        <input type="color" aria-label="Kablo rengi" disabled={locked} value={conn.color || '#6366f1'} onChange={(e) => onChange({ color: e.target.value })} className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0" />
      </label>
      {shape === 'orthogonal' && (
        <label className="flex items-center gap-1 px-1 text-xs" title="Köşe yuvarlama">
          <span aria-hidden>⌐</span>
          <input type="range" aria-label="Köşe yuvarlama" min={0} max={30} step={2} disabled={locked} value={radius} onChange={(e) => onChange({ cornerRadius: Number(e.target.value) })} className="w-16" />
        </label>
      )}
      {sep}
      <button type="button" title="Rotayı sıfırla (otomatik yol)" aria-label="Rotayı sıfırla" disabled={locked} onClick={onResetRoute} className={btn(false)}><RotateCcw size={15} /></button>
      <button type="button" title="Ayrıntılar (etiket, kablo)" aria-label="Ayrıntıları düzenle" disabled={locked} onClick={onEditDetails} className={btn(false)}><Pencil size={15} /></button>
      <button type="button" title={locked ? 'Kilidi aç' : 'Kilitle'} aria-label={locked ? 'Kilidi aç' : 'Kilitle'} aria-pressed={locked} onClick={() => onChange({ locked: !locked })} className={btn(locked)}>{locked ? <Lock size={15} /> : <Unlock size={15} />}</button>
      <button type="button" title="Bağlantıyı sil" aria-label="Bağlantıyı sil" disabled={locked} onClick={onDelete} className={`${btn(false)} text-red-500`}><Trash2 size={15} /></button>
      <button type="button" title="Kapat" aria-label="Araç çubuğunu kapat" onClick={onClose} className={btn(false)}><X size={15} /></button>
    </div>
  );
};
