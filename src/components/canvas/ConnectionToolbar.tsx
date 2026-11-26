import React from 'react';
import { useTranslation } from 'react-i18next';
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
  { v: 'orthogonal', label: 'cableBar.angled', Icon: CornerDownRight },
  { v: 'straight', label: 'cableBar.straight', Icon: Minus },
  { v: 'curved', label: 'cableBar.curved', Icon: Spline },
];
const STYLES: { v: LineStyle; label: string }[] = [{ v: 'solid', label: 'cableBar.solidLine' }, { v: 'dashed', label: 'cableBar.dashed' }, { v: 'dotted', label: 'cableBar.dotted' }];
const WIDTHS = [{ v: 'thin', label: 'cableBar.thin' }, { v: 'normal', label: 'cableBar.normal' }, { v: 'thick', label: 'cableBar.thick' }] as const;
const ARROWS = [
  { v: 'none', label: 'cableBar.noArrow', Icon: Ban }, { v: 'end', label: 'cableBar.arrowEnd', Icon: ArrowRight },
  { v: 'start', label: 'cableBar.arrowStart', Icon: ArrowLeft }, { v: 'both', label: 'cableBar.arrowBoth', Icon: ArrowLeftRight },
] as const;

export const ConnectionToolbar: React.FC<Props> = ({ conn, theme, onChange, onResetRoute, onDelete, onEditDetails, onClose }) => {
  const { t } = useTranslation();
  const shape = conn.shape || 'curved';
  const radius = conn.cornerRadius ?? 0;
  const locked = !!conn.locked;
  const box = theme === 'light' ? 'bg-white/95 border-zinc-300 text-zinc-800' : 'bg-zinc-900/95 border-zinc-700 text-zinc-100';
  const btn = (on: boolean) => `h-8 min-w-8 px-2 rounded-md flex items-center justify-center text-xs font-medium transition-colors disabled:opacity-40 ${on ? 'bg-amber-400 text-zinc-900' : theme === 'light' ? 'hover:bg-zinc-200' : 'hover:bg-zinc-800'}`;
  const sep = <span className={`w-px h-6 mx-1 ${theme === 'light' ? 'bg-zinc-300' : 'bg-zinc-700'}`} />;

  return (
    <div role="toolbar" aria-label={t('cableBar.toolbar')} data-testid="connection-toolbar"
      onMouseDown={(e) => e.stopPropagation()}
      className={`absolute top-[92px] left-1/2 -translate-x-1/2 z-[60] flex max-w-[96%] flex-wrap items-center gap-0.5 rounded-xl border p-1.5 shadow-2xl backdrop-blur-md ${box}`}>
      {SHAPES.map(({ v, label, Icon }) => (
        <button key={v} type="button" title={t(label)} aria-label={t(label)} aria-pressed={shape === v} disabled={locked}
          onClick={() => onChange({ shape: v, controlPoints: undefined })} className={btn(shape === v)}><Icon size={16} /></button>
      ))}
      {sep}
      {STYLES.map(({ v, label }) => (
        <button key={v} type="button" title={t(label)} aria-label={t(label)} aria-pressed={(conn.lineStyle || 'solid') === v} disabled={locked}
          onClick={() => onChange({ lineStyle: v })} className={btn((conn.lineStyle || 'solid') === v)}>
          <svg width="22" height="8"><line x1="1" y1="4" x2="21" y2="4" stroke="currentColor" strokeWidth="2" strokeDasharray={v === 'dashed' ? '5 3' : v === 'dotted' ? '1 3' : undefined} /></svg>
        </button>
      ))}
      {sep}
      {WIDTHS.map(({ v, label }) => (
        <button key={v} type="button" title={t('cableBar.width', { name: t(label) })} aria-label={t('cableBar.width', { name: t(label) })} aria-pressed={(conn.strokeWidth || 'normal') === v} disabled={locked}
          onClick={() => onChange({ strokeWidth: v })} className={btn((conn.strokeWidth || 'normal') === v)}>
          <svg width="18" height="12"><line x1="1" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth={v === 'thin' ? 1.5 : v === 'normal' ? 3 : 5} /></svg>
        </button>
      ))}
      {sep}
      {ARROWS.map(({ v, label, Icon }) => (
        <button key={v} type="button" title={t(label)} aria-label={t(label)} aria-pressed={(conn.arrowHead || 'none') === v} disabled={locked}
          onClick={() => onChange({ arrowHead: v })} className={btn((conn.arrowHead || 'none') === v)}><Icon size={15} /></button>
      ))}
      {sep}
      <label className="flex items-center gap-1 px-1 text-xs" title={t('cableBar.colorHint')}>
        <input type="color" aria-label={t('cableBar.color')} disabled={locked} value={conn.color || '#6366f1'} onChange={(e) => onChange({ color: e.target.value })} className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0" />
      </label>
      {shape === 'orthogonal' && (
        <label className="flex items-center gap-1 px-1 text-xs" title={t('cableBar.corner')}>
          <span aria-hidden>⌐</span>
          <input type="range" aria-label={t('cableBar.corner')} min={0} max={30} step={2} disabled={locked} value={radius} onChange={(e) => onChange({ cornerRadius: Number(e.target.value) })} className="w-16" />
        </label>
      )}
      {sep}
      <button type="button" title={t('cableBar.resetHint')} aria-label={t('cableBar.reset')} disabled={locked} onClick={onResetRoute} className={btn(false)}><RotateCcw size={15} /></button>
      <button type="button" title={t('cableBar.detailsHint')} aria-label={t('cableBar.details')} disabled={locked} onClick={onEditDetails} className={btn(false)}><Pencil size={15} /></button>
      <button type="button" title={locked ? t('cableBar.unlock') : t('cableBar.lock')} aria-label={locked ? t('cableBar.unlock') : t('cableBar.lock')} aria-pressed={locked} onClick={() => onChange({ locked: !locked })} className={btn(locked)}>{locked ? <Lock size={15} /> : <Unlock size={15} />}</button>
      <button type="button" title={t('cableBar.delete')} aria-label={t('cableBar.delete')} disabled={locked} onClick={onDelete} className={`${btn(false)} text-red-500`}><Trash2 size={15} /></button>
      <button type="button" title={t('common.close')} aria-label={t('cableBar.closeBar')} onClick={onClose} className={btn(false)}><X size={15} /></button>
    </div>
  );
};
