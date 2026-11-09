
import React from 'react';
import { ProjectMetadata } from '../../types';
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
    // Colors for print and display compatibility
    // In "premium" mode (screen), we want glassmorphism. In print, we want stark borders.
    const isDark = theme === 'dark';
    const borderColor = isDark ? 'rgba(255, 255, 255, 0.2)' : '#000000'; 
    const textColor = isDark ? '#e4e4e7' : '#000000'; 
    const labelColor = isDark ? '#a1a1aa' : '#555555'; 
    const bgColor = isDark ? 'rgba(24, 24, 27, 0.6)' : '#ffffff';

    const styles = {
        container: {
            borderColor: borderColor,
            color: textColor,
            backgroundColor: bgColor,
            backdropFilter: isDark ? 'blur(8px)' : 'none',
        },
        label: {
            color: labelColor
        },
        cellBorder: {
            borderColor: borderColor
        }
    };

    const customFields = metadata.customFields || [];
    const hasNotes = !!metadata.technicalNotes?.trim();
    const cellBg = isDark ? '#1b1b1f' : '#ffffff';
    const tint = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

    // Every field is a cell of one wrapping grid: nothing is cut off, added fields simply add cells.
    const Cell: React.FC<{ label: string; children: React.ReactNode; mono?: boolean; accent?: boolean }> = ({ label, children, mono, accent }) => (
        <div className="p-1.5 flex flex-col justify-center min-h-[2.75rem] min-w-0 flex-[1_1_120px]" style={{ backgroundColor: cellBg, backgroundImage: accent ? undefined : `linear-gradient(${tint}, ${tint})`, boxShadow: `inset -1px -1px 0 ${borderColor}` }}>
            <span className="text-[10px] font-bold uppercase tracking-wide opacity-80 break-words" style={styles.label}>{label}</span>
            <span className={`text-[11px] font-bold break-words ${mono ? 'font-mono' : ''}`}>{children || '-'}</span>
        </div>
    );

    return (
        <div 
            className="relative pointer-events-auto border-2 z-10 print-title-block select-none group/titleblock shadow-2xl rounded-sm"
            style={{ width: '100%', ...styles.container }}
            id="legend-export-area"
        >
            {onEdit && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="absolute top-2 right-2 p-2 bg-blue-600 text-white rounded-lg shadow-lg opacity-0 group-hover/titleblock:opacity-100 transition-opacity z-50 hover:bg-blue-500 no-print"
                    title="Anteti Düzenle"
                >
                    <Edit size={16} />
                </button>
            )}

            <div className="flex flex-col">
                {/* Logo + project info */}
                <div className="flex border-b" style={styles.cellBorder}>
                    <div className="w-36 shrink-0 flex items-center justify-center p-2 border-r relative bg-white/5" style={styles.cellBorder}>
                        {metadata.companyLogo ? (
                            <img src={metadata.companyLogo} alt="Logo" className="max-w-full max-h-24 object-contain p-1" />
                        ) : (
                            <div className="text-xs text-center text-zinc-400 font-bold uppercase p-3 border border-dashed border-zinc-500/30 rounded">Logo Yok</div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                        <div className="p-3 border-b flex flex-col justify-center flex-1" style={styles.cellBorder}>
                            <span className="text-[10px] font-bold uppercase block tracking-widest mb-1 opacity-70" style={styles.label}>Proje Başlığı</span>
                            <span className="text-xl font-bold leading-tight break-words">{metadata.projectName || 'İsimsiz Proje'}</span>
                        </div>
                        <div className="flex">
                            <div className="flex-1 min-w-0 p-2 border-r flex flex-col justify-center" style={styles.cellBorder}>
                                <span className="text-[10px] font-bold uppercase block tracking-wider opacity-70" style={styles.label}>Müşteri</span>
                                <span className="text-sm font-bold break-words">{metadata.customerName || '-'}</span>
                            </div>
                            <div className="flex-1 min-w-0 p-2 flex flex-col justify-center">
                                <span className="text-[10px] font-bold uppercase block tracking-wider opacity-70" style={styles.label}>Firma</span>
                                <span className="text-sm font-bold break-words">{metadata.companyName || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technical notes: grows with its content */}
                {hasNotes && (
                    <div className="p-2 border-b" style={styles.cellBorder} data-testid="legend-notes">
                        <span className="text-[10px] font-bold uppercase block tracking-wider opacity-70 mb-1" style={styles.label}>Teknik Notlar</span>
                        <p className="text-[11px] font-mono leading-snug whitespace-pre-wrap break-words opacity-90">{metadata.technicalNotes}</p>
                    </div>
                )}

                {/* People, custom fields, date, revision */}
                <div className="flex flex-wrap border-b" data-testid="legend-fields" style={{ backgroundColor: cellBg, ...styles.cellBorder }}>
                    <Cell label="Hazırlayan">{metadata.preparedBy}</Cell>
                    <Cell label="Onaylayan">{metadata.approvedBy}</Cell>
                    {customFields.map(f => <Cell key={f.id} label={f.label || 'Alan'}>{f.value}</Cell>)}
                    <Cell label="Tarih" mono>{metadata.date}</Cell>
                    <Cell label="Revizyon">{metadata.revision}</Cell>
                </div>

                {/* Document bar */}
                <div className="flex flex-wrap" style={{ backgroundColor: cellBg }}>
                    <Cell label="Döküman No" mono>{metadata.documentNo}</Cell>
                    <Cell label="Sayfa Adı">{pageName}</Cell>
                    <Cell label="Ölçek">{metadata.scale}</Cell>
                    <Cell label="Sayfa">{`${pageNumber} / ${totalPages}`}</Cell>
                </div>
            </div>
        </div>
    );
};
