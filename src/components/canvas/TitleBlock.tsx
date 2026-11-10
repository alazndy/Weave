import React, { useEffect, useRef, useState } from 'react';
import { ProjectMetadata } from '../../types';
import { documentNoFor } from '../../utils/docNumbering';
import { Edit, ChevronLeft, ChevronRight, Trash2, Undo2 } from 'lucide-react';

interface TitleBlockProps {
    metadata: ProjectMetadata;
    theme: 'light' | 'dark';
    pageName: string;
    pageNumber: number;
    totalPages: number;
    onEdit?: () => void;
    /** When given, headings and values can be edited by clicking them and sections can be reordered. */
    onMetadataChange?: (patch: Partial<ProjectMetadata>, opts?: { silent?: boolean }) => void;
    onRenamePage?: (name: string) => void;
    /** Drawing number set for this page only (overrides the protocol number). */
    pageDrawingNo?: string;
    onPageDrawingNoChange?: (value: string) => void;
}

export const LABEL_DEFAULTS: Record<string, string> = {
    revCol: 'REV', dateCol: 'DATE', descCol: 'DESCRIPTION', byCol: 'BY', chkdCol: 'CHKD.', revisions: 'REVISIONS',
    drawingName: 'Drawing Name:', pageName: 'Page Name:',
    nameCol: 'NAME', signDateCol: 'DATE', signCol: 'SIGN', approved: 'APPROVED', checked: 'CHECKED', drawn: 'DRAWN',
    projectName: 'Project Name:', drawingNo: 'Drawing No:',
    scale: 'Scale', sheet: 'Sheet', norm: 'Norm', totalSheet: 'T. Sheet', revision: 'Revision',
    company: 'Firma', customer: 'Müşteri', notes: 'Teknik Notlar',
};
export const MAIN_SECTIONS = ['revisions', 'drawing', 'project'];

/** Returns `saved` restricted to `all` plus any ids missing from it (so new fields always show up). */
export function resolveOrder(saved: string[] | undefined, all: string[]): string[] {
    const keep = (saved || []).filter(k => all.includes(k));
    return [...keep, ...all.filter(k => !keep.includes(k))];
}
export function moveInOrder(order: string[], key: string, dir: -1 | 1): string[] {
    const i = order.indexOf(key), j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return order;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
}

/** Click-to-edit text. Enter / blur commits, Escape cancels. Renders plain text when not editable. */
const Ed: React.FC<{
    value: string; onCommit?: (v: string) => void; className?: string; style?: React.CSSProperties;
    multiline?: boolean; placeholder?: string; testid?: string; display?: string; label: string;
    onHide?: () => void;
}> = ({ value, onCommit, className = '', style, multiline, placeholder, testid, display, label, onHide }) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
    useEffect(() => { if (editing) { ref.current?.focus(); ref.current?.select(); } }, [editing]);
    const shown = display ?? value;
    if (!onCommit) return <span className={className} style={style} data-testid={testid}>{shown}</span>;
    if (editing) {
        const done = (save: boolean) => { setEditing(false); if (save && draft !== value) onCommit(draft); };
        const common = {
            ref, value: draft, 'aria-label': label,
            onChange: (e: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setDraft(e.target.value),
            onBlur: () => done(true),
            onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
            onKeyDown: (e: React.KeyboardEvent) => {
                e.stopPropagation();
                if (e.key === 'Escape') done(false);
                if (e.key === 'Enter' && (!multiline || e.ctrlKey)) { e.preventDefault(); done(true); }
            },
            className: 'bg-white text-black border border-blue-500 rounded px-1 outline-none w-full min-w-[40px] text-inherit font-[inherit] normal-case tracking-normal',
        };
        const field = multiline ? <textarea {...common} rows={4} /> : <input {...common} />;
        if (!onHide) return field;
        return (
            <span className="inline-flex items-center gap-0.5 w-full">
                {field}
                <button type="button" aria-label={`${label} başlığını sil`} title="Başlığı sil"
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onClick={(e) => { e.stopPropagation(); setEditing(false); onHide(); }}
                    className="shrink-0 p-0.5 rounded bg-red-600 text-white no-print"><Trash2 size={11} /></button>
            </span>
        );
    }
    return (
        <span
            className={`${className} cursor-text hover:bg-blue-500/15 rounded-sm`} style={style} data-testid={testid}
            title="Düzenlemek için tıkla"
            onClick={(e) => { e.stopPropagation(); setDraft(value); setEditing(true); }}
        >{shown || <span className="opacity-40">{placeholder || '—'}</span>}</span>
    );
};

export const TitleBlock: React.FC<TitleBlockProps> = ({ metadata, theme, pageName, pageNumber, totalPages, onEdit, onMetadataChange, onRenamePage, pageDrawingNo, onPageDrawingNoChange }) => {
    const isDark = theme === 'dark';
    const line = isDark ? 'rgba(255, 255, 255, 0.35)' : '#000000';
    const textColor = isDark ? '#e4e4e7' : '#000000';
    const labelColor = isDark ? '#a1a1aa' : '#444444';
    const accent = isDark ? '#f87171' : '#c1121f';
    const cellBg = isDark ? '#1b1b1f' : '#ffffff';

    const customFields = metadata.customFields || [];
    const hasNotes = !!metadata.technicalNotes?.trim();
    const computedDocNo = documentNoFor(metadata, pageNumber);
    const docNo = pageDrawingNo?.trim() || computedDocNo;
    const revisions = [...(metadata.revisions || [])].reverse();          // newest first, like the paper form
    const blankRows = Math.max(0, 2 - revisions.length);
    const rev = metadata.revision || '';
    const edit = !!onMetadataChange;
    const set = (patch: Partial<ProjectMetadata>, opts?: { silent?: boolean }) => onMetadataChange?.(patch, opts);
    const bd = { borderColor: line } as React.CSSProperties;

    const labels = metadata.legendLabels || {};
    const lbl = (k: string) => labels[k] || LABEL_DEFAULTS[k];
    /** Editable heading. Clearing it restores the default. */
    const hidden = metadata.legendHidden || [];
    const hide = (id: string) => set({ legendHidden: [...hidden.filter(x => x !== id), id] });
    const sizes = metadata.legendSizes || {};
    const H = (k: string, className = '', style?: React.CSSProperties) => hidden.includes(k) ? null : (
        <Ed key={k} onHide={edit ? () => hide(k) : undefined} label={`Başlık: ${LABEL_DEFAULTS[k]}`} value={lbl(k)} testid={`lbl-${k}`}
            onCommit={edit ? (v) => {
                const next = { ...labels };
                if (v.trim() && v.trim() !== LABEL_DEFAULTS[k]) next[k] = v.trim(); else delete next[k];
                set({ legendLabels: next });
            } : undefined}
            className={className} style={style} />
    );
    const L = (k: string, className = '') => H(k, `text-[10px] font-bold uppercase tracking-wide leading-none ${className}`, { color: labelColor });
    const V = (label: string, value: string, field: keyof ProjectMetadata, className = '', style?: React.CSSProperties, fallback = '-', testid?: string) => (
        <Ed label={label} value={value} display={value || fallback} className={className} style={style} testid={testid}
            onCommit={edit ? (v) => set({ [field]: v } as Partial<ProjectMetadata>) : undefined} />
    );

    /** Inline size for a section/cell (overrides its flexible default). */
    const wStyle = (id: string): React.CSSProperties => sizes[id] ? { flex: `0 0 ${sizes[id]}px`, width: sizes[id], minWidth: 0 } : {};
    /** Drag handle on the right edge (axis x) or bottom edge (axis y) of its parent; double-click resets. */
    const Resizer = (id: string, axis: 'x' | 'y') => !edit ? null : (
        <div key={`rs-${id}`} data-testid={`resize-${id}`} title={axis === 'x' ? 'Genişliği ayarla (çift tık: sıfırla)' : 'Yüksekliği ayarla (çift tık: sıfırla)'}
            className={`absolute z-40 hidden bg-blue-500/70 hover:bg-blue-500 no-print ${axis === 'x' ? 'group-hover/sec:block top-0 bottom-0 -right-[3px] w-[6px] cursor-col-resize' : 'group-hover/strip:block left-0 right-0 -bottom-[3px] h-[6px] cursor-row-resize'}`}
            onDoubleClick={(e) => { e.stopPropagation(); const n = { ...sizes }; delete n[id]; set({ legendSizes: n }); }}
            onPointerDown={(e) => {
                e.preventDefault(); e.stopPropagation();
                const el = e.currentTarget.parentElement as HTMLElement;
                const rect = el.getBoundingClientRect();
                const ratio = (axis === 'x' ? rect.width / el.offsetWidth : rect.height / el.offsetHeight) || 1;
                const start = axis === 'x' ? el.offsetWidth : el.offsetHeight;
                const from = axis === 'x' ? e.clientX : e.clientY;
                const base = { ...sizes };
                set({});                                            // one undo checkpoint for the whole drag
                const move = (ev: PointerEvent) => {
                    const d = ((axis === 'x' ? ev.clientX : ev.clientY) - from) / ratio;
                    set({ legendSizes: { ...base, [id]: Math.max(axis === 'x' ? 60 : 24, Math.round(start + d)) } }, { silent: true });
                };
                const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
                window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
            }}
        />
    );

    const mainOrder = resolveOrder(metadata.legendOrder, MAIN_SECTIONS);
    const extraIds = ['logo', 'company', 'customer', ...customFields.map(f => `cf:${f.id}`)];
    const extraOrder = resolveOrder(metadata.legendExtraOrder, extraIds);

    /** Hover arrows that move a section left/right (not exported). */
    const Mover = (id: string, order: string[], field: 'legendOrder' | 'legendExtraOrder') => !edit ? null : (
        <div className="absolute top-0 right-0 z-40 hidden group-hover/sec:flex gap-0.5 p-0.5 no-print" data-testid={`mover-${id}`}>
            <button type="button" aria-label={`${id} bölümünü sola taşı`} disabled={order.indexOf(id) === 0}
                onClick={(e) => { e.stopPropagation(); set({ [field]: moveInOrder(order, id, -1) }); }}
                className="p-0.5 rounded bg-blue-600 text-white disabled:opacity-30"><ChevronLeft size={12} /></button>
            <button type="button" aria-label={`${id} bölümünü sağa taşı`} disabled={order.indexOf(id) === order.length - 1}
                onClick={(e) => { e.stopPropagation(); set({ [field]: moveInOrder(order, id, 1) }); }}
                className="p-0.5 rounded bg-blue-600 text-white disabled:opacity-30"><ChevronRight size={12} /></button>
        </div>
    );

    const sections: Record<string, React.ReactNode> = {
        revisions: (
            <div key="revisions" className="relative group/sec flex flex-col min-w-[300px] flex-[1.1] border-r" style={{ ...bd, ...wStyle('revisions') }} data-testid="legend-revisions">
                {Mover('revisions', mainOrder, 'legendOrder')}{Resizer('revisions', 'x')}
                <div className="flex-1 flex flex-col justify-end">
                    {revisions.map(r => (
                        <div key={r.id} className="flex border-b text-[10px] font-semibold" style={bd}>
                            <div className="w-16 shrink-0 p-1 text-center break-words" style={{ color: accent }}>{r.rev}</div>
                            <div className="w-20 shrink-0 p-1 text-center font-mono">{r.date}</div>
                            <div className="flex-1 min-w-0 p-1 break-words">{r.description}</div>
                            <div className="w-10 shrink-0 p-1 text-center">{r.by}</div>
                            <div className="w-12 shrink-0 p-1 text-center">{r.chkd}</div>
                        </div>
                    ))}
                    {Array.from({ length: blankRows }).map((_, i) => <div key={i} className="h-5 border-b" style={bd} />)}
                </div>
                <div className="flex border-b text-[10px] font-bold" style={bd}>
                    <div className="w-16 shrink-0 p-1 text-center border-r" style={bd}>{H('revCol')}</div>
                    <div className="w-20 shrink-0 p-1 text-center border-r" style={bd}>{H('dateCol')}</div>
                    <div className="flex-1 p-1 text-center border-r" style={bd}>{H('descCol')}</div>
                    <div className="w-10 shrink-0 p-1 text-center border-r" style={bd}>{H('byCol')}</div>
                    <div className="w-12 shrink-0 p-1 text-center">{H('chkdCol')}</div>
                </div>
                <div className="p-1 text-center text-[10px] font-bold tracking-[0.5em]">{H('revisions')}</div>
            </div>
        ),
        drawing: (
            <div key="drawing" className="relative group/sec flex min-w-[340px] flex-[1.2] border-r" style={{ ...bd, ...wStyle('drawing') }}>
                {Mover('drawing', mainOrder, 'legendOrder')}{Resizer('drawing', 'x')}
                <div className="flex-1 min-w-0 flex flex-col border-r" style={bd}>
                    <div className="flex-1 p-1.5 border-b" style={bd} data-testid="legend-drawing-name">
                        {L('drawingName')}
                        <div className="text-sm font-bold break-words mt-1" style={{ color: accent }}>{V('Drawing Name', metadata.drawingName || '', 'drawingName')}</div>
                    </div>
                    <div className="flex-1 p-1.5" data-testid="legend-page-name">
                        {L('pageName')}
                        <div className="text-sm font-bold break-words mt-1" style={{ color: accent }}>
                            <Ed label="Sayfa adı" value={pageName} display={pageName || '-'} onCommit={onRenamePage && edit ? onRenamePage : undefined} />
                        </div>
                    </div>
                </div>
                <div className="w-[230px] shrink-0 flex flex-col text-[10px]" data-testid="legend-signatures">
                    <div className="flex border-b font-bold" style={bd}>
                        <div className="w-[70px] shrink-0 border-r relative h-5" style={bd}>
                            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 10 10"><line x1="0" y1="0" x2="10" y2="10" stroke={line} strokeWidth="0.4" vectorEffect="non-scaling-stroke" /></svg>
                        </div>
                        {(['nameCol', 'signDateCol', 'signCol'] as const).map((k, i) => <div key={k} className={`flex-1 p-1 text-center ${i < 2 ? 'border-r' : ''}`} style={bd}>{H(k)}</div>)}
                    </div>
                    {([
                        ['approved', 'approvedBy', metadata.approvedBy, 'approvedDate', metadata.approvedDate],
                        ['checked', 'checkedBy', metadata.checkedBy, 'checkedDate', metadata.checkedDate],
                        ['drawn', 'preparedBy', metadata.preparedBy, 'drawnDate', metadata.drawnDate || metadata.date],
                    ] as const).map(([role, nameField, name, dateField, date], i) => (
                        <div key={role} className={`flex flex-1 min-h-[1.75rem] ${i < 2 ? 'border-b' : ''}`} style={bd}>
                            <div className="w-[70px] shrink-0 border-r p-1 font-bold flex items-center" style={bd}>{H(role)}</div>
                            <div className="flex-1 min-w-0 border-r p-1 font-semibold break-words flex items-center justify-center text-center" style={bd}>{V(`${role} isim`, name || '', nameField, '', undefined, '')}</div>
                            <div className="flex-1 border-r p-1 font-mono flex items-center justify-center" style={bd}>{V(`${role} tarih`, date || '', dateField, '', undefined, '')}</div>
                            <div className="flex-1" />
                        </div>
                    ))}
                </div>
            </div>
        ),
        project: (
            <div key="project" className="relative group/sec flex flex-col min-w-[280px] flex-1" style={wStyle('project')} data-testid="legend-project">
                {Mover('project', mainOrder, 'legendOrder')}{Resizer('project', 'x')}
                <div className="flex border-b" style={bd}>
                    <div className="w-[88px] shrink-0 border-r p-1.5 flex items-center" style={bd}>{L('projectName')}</div>
                    <div className="flex-1 min-w-0 p-1.5 pr-8 text-sm font-bold break-words flex items-center justify-center text-center uppercase" style={{ color: accent }}>{V('Proje adı', metadata.projectName || '', 'projectName', '', undefined, 'İsimsiz Proje')}</div>
                </div>
                <div className="flex border-b" style={bd}>
                    <div className="w-[88px] shrink-0 border-r p-1.5 flex items-center" style={bd}>{L('drawingNo')}</div>
                    <div className="flex-1 min-w-0 p-1.5 text-[11px] font-mono font-bold break-all text-center flex items-center justify-center" data-testid="legend-docno">
                        <Ed label="Çizim numarası (bu sayfa)" value={docNo} display={docNo || '-'}
                            onCommit={edit && onPageDrawingNoChange ? (v) => onPageDrawingNoChange(v.trim() === computedDocNo ? '' : v) : undefined} />
                    </div>
                </div>
                <div className="flex flex-1">
                    <div className="flex-1 grid grid-cols-[auto_1fr_auto_1fr] text-[10px]">
                        {([
                            [H('scale'), V('Ölçek', metadata.scale || '', 'scale', '', undefined, 'N.A.'), H('sheet'), String(pageNumber)],
                            [H('norm'), metadata.paperSize, H('totalSheet'), String(totalPages)],
                        ]).map((row, ri) => (
                            <React.Fragment key={ri}>
                                {row.map((c, ci) => (
                                    <div key={ci} className={`p-1 flex items-center ${ci % 2 === 0 ? 'font-bold' : 'justify-center font-semibold'} ${ci < 3 ? 'border-r' : ''} ${ri === 0 ? 'border-b' : ''}`} style={bd}>{c}</div>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="w-[84px] shrink-0 border-l flex flex-col items-center justify-center p-1" style={bd} data-testid="legend-rev-symbol">
                        {L('revision', 'mb-0.5')}
                        <svg width="46" height="40" viewBox="0 0 34 30" aria-label={`Revizyon ${rev}`}>
                            <polygon points="17,2 32,28 2,28" fill="none" stroke={accent} strokeWidth="1.8" />
                            <text x="17" y="24" textAnchor="middle" fontSize={rev.length > 3 ? 7 : rev.length > 1 ? 9.5 : 12} fontWeight="700" fill={accent}>{rev}</text>
                        </svg>
                    </div>
                </div>
            </div>
        ),
    };

    const cell = 'relative group/sec flex-[1_1_140px] min-w-0 p-1.5 border-r flex flex-col justify-center';
    const extras: Record<string, React.ReactNode> = {
        logo: (
            <div key="logo" className="relative group/sec w-28 shrink-0 flex items-center justify-center p-1.5 border-r" style={{ ...bd, ...wStyle('logo') }}>
                {Mover('logo', extraOrder, 'legendExtraOrder')}{Resizer('logo', 'x')}
                {metadata.companyLogo
                    ? <img src={metadata.companyLogo} alt="Logo" className="max-w-full max-h-14 object-contain" />
                    : <div className="text-[10px] text-center text-zinc-400 font-bold uppercase p-1 border border-dashed border-zinc-500/30 rounded">Logo Yok</div>}
            </div>
        ),
        company: (
            <div key="company" className={cell} style={{ ...bd, ...wStyle('company') }}>
                {Mover('company', extraOrder, 'legendExtraOrder')}{Resizer('company', 'x')}
                {L('company')}<span className="text-[11px] font-bold break-words mt-0.5">{V('Firma', metadata.companyName || '', 'companyName')}</span>
            </div>
        ),
        customer: (
            <div key="customer" className={cell} style={{ ...bd, ...wStyle('customer') }}>
                {Mover('customer', extraOrder, 'legendExtraOrder')}{Resizer('customer', 'x')}
                {L('customer')}<span className="text-[11px] font-bold break-words mt-0.5">{V('Müşteri', metadata.customerName || '', 'customerName')}</span>
            </div>
        ),
    };
    customFields.forEach(f => {
        const upd = (patch: Partial<typeof f>) => set({ customFields: customFields.map(x => x.id === f.id ? { ...x, ...patch } : x) });
        extras[`cf:${f.id}`] = (
            <div key={f.id} className={cell} style={{ ...bd, ...wStyle(`cf:${f.id}`) }} data-testid="legend-custom-field">
                {Mover(`cf:${f.id}`, extraOrder, 'legendExtraOrder')}{Resizer(`cf:${f.id}`, 'x')}
                {!hidden.includes(`cf:${f.id}`) && <Ed label={`Alan başlığı: ${f.label}`} value={f.label} display={f.label || 'Alan'} onCommit={edit ? (v) => upd({ label: v }) : undefined}
                    onHide={edit ? () => hide(`cf:${f.id}`) : undefined}
                    className="text-[10px] font-bold uppercase tracking-wide leading-none" style={{ color: labelColor }} />}
                <span className="text-[11px] font-bold break-words mt-0.5">
                    <Ed label={`${f.label} değeri`} value={f.value} display={f.value || '-'} onCommit={edit ? (v) => upd({ value: v }) : undefined} />
                </span>
            </div>
        );
    });

    return (
        <div
            className="relative pointer-events-auto border-2 z-10 print-title-block select-none group/titleblock shadow-2xl"
            style={{ width: '100%', borderColor: line, color: textColor, backgroundColor: cellBg }}
            id="legend-export-area"
            data-testid="title-block"
        >
            {onEdit && (
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="absolute top-1 left-1 p-1.5 bg-blue-600 text-white rounded-md shadow-lg opacity-0 group-hover/titleblock:opacity-100 transition-opacity z-50 hover:bg-blue-500 no-print"
                    title="Anteti Düzenle"
                >
                    <Edit size={14} />
                </button>
            )}

            {edit && hidden.length > 0 && (
                <button type="button" aria-label="Silinen başlıkları geri getir" title="Silinen başlıkları geri getir"
                    onClick={(e) => { e.stopPropagation(); set({ legendHidden: [] }); }}
                    className="absolute top-1 left-10 z-50 flex items-center gap-1 px-1.5 py-1 text-[10px] font-bold bg-amber-500 text-black rounded-md shadow-lg no-print">
                    <Undo2 size={12} /> {hidden.length} gizli başlık
                </button>
            )}

            {/* Main strip: sections in user-chosen order */}
            <div className="relative group/strip flex flex-wrap" style={sizes.mainH ? { minHeight: sizes.mainH } : undefined} data-testid="legend-main-strip">{mainOrder.map(k => sections[k])}{Resizer('mainH', 'y')}</div>

            {/* Extra info: logo, company, customer, custom fields (all wrap, nothing is cut) */}
            <div className="relative group/strip flex flex-wrap border-t" style={{ ...bd, ...(sizes.extraH ? { minHeight: sizes.extraH } : {}) }} data-testid="legend-extra">
                {extraOrder.map(k => extras[k])}{Resizer('extraH', 'y')}
            </div>
            {(hasNotes || edit) && (
                <div className="p-1.5 border-t" style={bd} data-testid="legend-notes">
                    {L('notes')}
                    <p className="text-[11px] font-mono leading-snug whitespace-pre-wrap break-words mt-0.5 opacity-90">
                        <Ed label="Teknik notlar" multiline value={metadata.technicalNotes || ''} placeholder="Not eklemek için tıkla"
                            onCommit={edit ? (v) => set({ technicalNotes: v }) : undefined} />
                    </p>
                </div>
            )}
        </div>
    );
};
