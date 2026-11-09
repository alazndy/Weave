
import React from 'react';
import { ProjectMetadata } from '../../types';
import { documentNoFor } from '../../utils/docNumbering';
import { Edit } from 'lucide-react';

interface TitleBlockProps {
    metadata: ProjectMetadata;
    theme: 'light' | 'dark';
    pageName: string;
    pageNumber: number;
    totalPages: number;
    onEdit?: () => void;
}

export const TitleBlock: React.FC<TitleBlockProps> = ({ metadata, theme, pageName, pageNumber, totalPages, onEdit }) => {
    const isDark = theme === 'dark';
    const line = isDark ? 'rgba(255, 255, 255, 0.35)' : '#000000';
    const textColor = isDark ? '#e4e4e7' : '#000000';
    const labelColor = isDark ? '#a1a1aa' : '#444444';
    const accent = isDark ? '#f87171' : '#c1121f';
    const cellBg = isDark ? '#1b1b1f' : '#ffffff';

    const customFields = metadata.customFields || [];
    const hasNotes = !!metadata.technicalNotes?.trim();
    const docNo = documentNoFor(metadata, pageNumber);
    const revisions = [...(metadata.revisions || [])].reverse();          // newest first, like the paper form
    const blankRows = Math.max(0, 2 - revisions.length);
    const rev = metadata.revision || '';

    const L: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
        <span className={`text-[10px] font-bold uppercase tracking-wide leading-none ${className}`} style={{ color: labelColor }}>{children}</span>
    );
    const bd = { borderColor: line } as React.CSSProperties;

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

            {/* Main strip: revisions | drawing + signatures | project */}
            <div className="flex flex-wrap">
                {/* REVISIONS */}
                <div className="flex flex-col min-w-[300px] flex-[1.1] border-r" style={bd} data-testid="legend-revisions">
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
                        <div className="w-16 shrink-0 p-1 text-center border-r" style={bd}>REV</div>
                        <div className="w-20 shrink-0 p-1 text-center border-r" style={bd}>DATE</div>
                        <div className="flex-1 p-1 text-center border-r" style={bd}>DESCRIPTION</div>
                        <div className="w-10 shrink-0 p-1 text-center border-r" style={bd}>BY</div>
                        <div className="w-12 shrink-0 p-1 text-center">CHKD.</div>
                    </div>
                    <div className="p-1 text-center text-[10px] font-bold tracking-[0.5em]">REVISIONS</div>
                </div>

                {/* DRAWING / PAGE NAME + SIGN TABLE */}
                <div className="flex min-w-[340px] flex-[1.2] border-r" style={bd}>
                    <div className="flex-1 min-w-0 flex flex-col border-r" style={bd}>
                        <div className="flex-1 p-1.5 border-b" style={bd} data-testid="legend-drawing-name">
                            <L>Drawing Name:</L>
                            <div className="text-sm font-bold break-words mt-1" style={{ color: accent }}>{metadata.drawingName || '-'}</div>
                        </div>
                        <div className="flex-1 p-1.5" data-testid="legend-page-name">
                            <L>Page Name:</L>
                            <div className="text-sm font-bold break-words mt-1" style={{ color: accent }}>{pageName || '-'}</div>
                        </div>
                    </div>
                    <div className="w-[230px] shrink-0 flex flex-col text-[10px]" data-testid="legend-signatures">
                        <div className="flex border-b font-bold" style={bd}>
                            <div className="w-[70px] shrink-0 border-r relative h-5" style={bd}>
                                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 10 10"><line x1="0" y1="0" x2="10" y2="10" stroke={line} strokeWidth="0.4" vectorEffect="non-scaling-stroke" /></svg>
                            </div>
                            {['NAME', 'DATE', 'SIGN'].map((h, i) => <div key={h} className={`flex-1 p-1 text-center ${i < 2 ? 'border-r' : ''}`} style={bd}>{h}</div>)}
                        </div>
                        {([['APPROVED', metadata.approvedBy, metadata.approvedDate], ['CHECKED', metadata.checkedBy, metadata.checkedDate], ['DRAWN', metadata.preparedBy, metadata.drawnDate || metadata.date]] as const).map(([role, name, date], i) => (
                            <div key={role} className={`flex flex-1 min-h-[1.75rem] ${i < 2 ? 'border-b' : ''}`} style={bd}>
                                <div className="w-[70px] shrink-0 border-r p-1 font-bold flex items-center" style={bd}>{role}</div>
                                <div className="flex-1 min-w-0 border-r p-1 font-semibold break-words flex items-center justify-center text-center" style={bd}>{name || ''}</div>
                                <div className="flex-1 border-r p-1 font-mono flex items-center justify-center" style={bd}>{date || ''}</div>
                                <div className="flex-1" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* PROJECT */}
                <div className="flex flex-col min-w-[280px] flex-1" data-testid="legend-project">
                    <div className="flex border-b" style={bd}>
                        <div className="w-[88px] shrink-0 border-r p-1.5 flex items-center" style={bd}><L>Project Name:</L></div>
                        <div className="flex-1 min-w-0 p-1.5 pr-8 text-sm font-bold break-words flex items-center justify-center text-center uppercase" style={{ color: accent }}>{metadata.projectName || 'İsimsiz Proje'}</div>
                    </div>
                    <div className="flex border-b" style={bd}>
                        <div className="w-[88px] shrink-0 border-r p-1.5 flex items-center" style={bd}><L>Drawing No:</L></div>
                        <div className="flex-1 min-w-0 p-1.5 text-[11px] font-mono font-bold break-all text-center flex items-center justify-center" data-testid="legend-docno">{docNo || '-'}</div>
                    </div>
                    <div className="flex flex-1">
                        <div className="flex-1 grid grid-cols-[auto_1fr_auto_1fr] text-[10px]">
                            {([['Scale', metadata.scale || 'N.A.', 'Sheet', String(pageNumber)], ['Norm', metadata.paperSize, 'T. Sheet', String(totalPages)]] as const).map((row, ri) => (
                                <React.Fragment key={ri}>
                                    {row.map((c, ci) => (
                                        <div key={ci} className={`p-1 flex items-center ${ci % 2 === 0 ? 'font-bold' : 'justify-center font-semibold'} ${ci < 3 ? 'border-r' : ''} ${ri === 0 ? 'border-b' : ''}`} style={bd}>{c}</div>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="w-[84px] shrink-0 border-l flex flex-col items-center justify-center p-1" style={bd} data-testid="legend-rev-symbol">
                            <L className="mb-0.5">Revision</L>
                            <svg width="46" height="40" viewBox="0 0 34 30" aria-label={`Revizyon ${rev}`}>
                                <polygon points="17,2 32,28 2,28" fill="none" stroke={accent} strokeWidth="1.8" />
                                <text x="17" y="24" textAnchor="middle" fontSize={rev.length > 3 ? 7 : rev.length > 1 ? 9.5 : 12} fontWeight="700" fill={accent}>{rev}</text>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Extra info: logo, company, customer, notes, custom fields (all wrap, nothing is cut) */}
            <div className="flex flex-wrap border-t" style={bd} data-testid="legend-extra">
                <div className="w-28 shrink-0 flex items-center justify-center p-1.5 border-r" style={bd}>
                    {metadata.companyLogo
                        ? <img src={metadata.companyLogo} alt="Logo" className="max-w-full max-h-14 object-contain" />
                        : <div className="text-[10px] text-center text-zinc-400 font-bold uppercase p-1 border border-dashed border-zinc-500/30 rounded">Logo Yok</div>}
                </div>
                {[['Firma', metadata.companyName], ['Müşteri', metadata.customerName]].map(([l, v]) => (
                    <div key={l} className="flex-[1_1_140px] min-w-0 p-1.5 border-r flex flex-col justify-center" style={bd}>
                        <L>{l}</L><span className="text-[11px] font-bold break-words mt-0.5">{v || '-'}</span>
                    </div>
                ))}
                {customFields.map(f => (
                    <div key={f.id} className="flex-[1_1_140px] min-w-0 p-1.5 border-r flex flex-col justify-center" style={bd}>
                        <L>{f.label || 'Alan'}</L><span className="text-[11px] font-bold break-words mt-0.5">{f.value || '-'}</span>
                    </div>
                ))}
            </div>
            {hasNotes && (
                <div className="p-1.5 border-t" style={bd} data-testid="legend-notes">
                    <L>Teknik Notlar</L>
                    <p className="text-[11px] font-mono leading-snug whitespace-pre-wrap break-words mt-0.5 opacity-90">{metadata.technicalNotes}</p>
                </div>
            )}
        </div>
    );
};
