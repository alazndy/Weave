
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

    // Calculate grid columns for custom fields
    const customFields = metadata.customFields || [];
    const hasNotes = !!metadata.technicalNotes;
    
    // Dynamic height based on content
    const totalHeight = hasNotes ? '240px' : '180px';

    return (
        <div 
            className="absolute bottom-[20px] right-[20px] border-2 z-10 print-title-block select-none overflow-hidden group/titleblock shadow-2xl rounded-sm transition-all duration-300"
            style={{ 
                width: 'min(100% - 40px, 800px)', 
                height: totalHeight, 
                ...styles.container,
            }}
            id="legend-export-area"
        >
            {onEdit && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="absolute top-2 right-2 p-2 bg-blue-600 text-white rounded-lg shadow-lg opacity-0 group-hover/titleblock:opacity-100 transition-opacity z-50 hover:bg-blue-500 hover:scale-110 active:scale-95 no-print pointer-events-auto"
                    title="Anteti Düzenle"
                >
                    <Edit size={16} />
                </button>
            )}

            <div className="flex h-full flex-col">
                {/* Top Section: Logic & Project Info */}
                <div className="flex border-b flex-1" style={styles.cellBorder}>
                    {/* Logo Area */}
                    <div className="w-40 flex items-center justify-center p-2 border-r relative overflow-hidden bg-white/5" style={styles.cellBorder}>
                        {metadata.companyLogo ? (
                            <img src={metadata.companyLogo} alt="Logo" className="max-w-full max-h-full object-contain p-1" />
                        ) : (
                            <div className="text-xs text-center text-zinc-400 font-bold uppercase p-4 border border-dashed border-zinc-500/30 rounded">Logo Yok</div>
                        )}
                    </div>
                    
                    {/* Project Info */}
                    <div className="flex-1 flex flex-col">
                        <div className="flex-[2] p-3 border-b flex flex-col justify-center" style={styles.cellBorder}>
                            <span className="text-[10px] font-bold uppercase block tracking-widest mb-1 opacity-70" style={styles.label}>Proje Başlığı</span>
                            <span className="text-xl font-bold leading-tight">{metadata.projectName || 'İsimsiz Proje'}</span>
                        </div>
                        <div className="flex-1 flex" style={styles.cellBorder}>
                            <div className="flex-1 p-2 border-r flex flex-col justify-center" style={styles.cellBorder}>
                                <span className="text-[9px] font-bold uppercase block tracking-wider opacity-70" style={styles.label}>Müşteri</span>
                                <span className="text-sm font-bold truncate">{metadata.customerName || '-'}</span>
                            </div>
                            <div className="flex-1 p-2 flex flex-col justify-center">
                                <span className="text-[9px] font-bold uppercase block tracking-wider opacity-70" style={styles.label}>Firma</span>
                                <span className="text-sm font-bold truncate">{metadata.companyName || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technical Notes Section (Optional) */}
                {hasNotes && (
                    <div className="h-24 p-2 border-b overflow-hidden relative" style={styles.cellBorder}>
                        <span className="text-[9px] font-bold uppercase block tracking-wider opacity-70 mb-1" style={styles.label}>Teknik Notlar</span>
                        <p className="text-[10px] font-mono leading-tight whitespace-pre-wrap opacity-90 h-full overflow-y-auto no-scrollbar">
                            {metadata.technicalNotes}
                        </p>
                    </div>
                )}

                {/* Custom Fields & People Grid */}
                <div className="grid grid-cols-6 border-b h-14" style={styles.cellBorder}>
                    <div className="p-1 border-r flex flex-col justify-center col-span-1 bg-white/[0.02]" style={styles.cellBorder}>
                        <span className="text-[8px] font-bold uppercase block opacity-70" style={styles.label}>Hazırlayan</span>
                        <span className="text-[11px] font-bold truncate block">{metadata.preparedBy || '-'}</span>
                    </div>
                    <div className="p-1 border-r flex flex-col justify-center col-span-1 bg-white/[0.02]" style={styles.cellBorder}>
                        <span className="text-[8px] font-bold uppercase block opacity-70" style={styles.label}>Onaylayan</span>
                        <span className="text-[11px] font-bold truncate block">{metadata.approvedBy || '-'}</span>
                    </div>
                    
                    {/* Render up to 2 custom fields in the middle space */}
                    {customFields.slice(0, 2).map((field, idx) => (
                        <div key={field.id} className="p-1 border-r flex flex-col justify-center col-span-1" style={styles.cellBorder}>
                            <span className="text-[8px] font-bold uppercase block opacity-70 truncate" style={styles.label}>{field.label}</span>
                            <span className="text-[11px] font-medium truncate block">{field.value}</span>
                        </div>
                    ))}
                    {/* Fill empty spots if less than 2 custom fields */}
                    {Array.from({ length: Math.max(0, 2 - customFields.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="p-1 border-r col-span-1" style={styles.cellBorder}></div>
                    ))}

                    <div className="p-1 border-r flex flex-col justify-center col-span-1" style={styles.cellBorder}>
                        <span className="text-[8px] font-bold uppercase block opacity-70" style={styles.label}>Tarih</span>
                        <span className="text-[11px] font-mono font-medium truncate block">{metadata.date}</span>
                    </div>
                    <div className="p-1 flex flex-col justify-center col-span-1 bg-yellow-500/5">
                        <span className="text-[8px] font-bold uppercase block opacity-70" style={styles.label}>Revizyon</span>
                        <span className="text-lg font-bold truncate block text-center text-yellow-600 dark:text-yellow-400">{metadata.revision}</span>
                    </div>
                </div>

                {/* Bottom Section: Info Bar */}
                <div className="flex h-10 bg-black/5 dark:bg-white/5">
                    <div className="flex-[2] p-1 border-r flex flex-col justify-center pl-3" style={styles.cellBorder}>
                        <span className="text-[8px] font-bold uppercase block opacity-70" style={styles.label}>Döküman No</span>
                        <span className="text-sm font-bold font-mono tracking-wide">{metadata.documentNo}</span>
                    </div>
                    <div className="w-32 p-1 border-r flex flex-col justify-center text-center" style={styles.cellBorder}>
                         <span className="text-[8px] font-bold uppercase block opacity-70" style={styles.label}>Sayfa Adı</span>
                         <span className="text-[10px] font-bold truncate block">{pageName}</span>
                    </div>
                    <div className="w-24 p-1 border-r flex flex-col justify-center text-center" style={styles.cellBorder}>
                        <span className="text-[8px] font-bold uppercase block opacity-70" style={styles.label}>Ölçek</span>
                        <span className="text-[11px] font-bold">{metadata.scale}</span>
                    </div>
                    <div className="w-20 p-1 flex items-center justify-center font-black text-sm bg-black/10 dark:bg-white/10">
                        {pageNumber} / {totalPages}
                    </div>
                </div>
            </div>
        </div>
    );
};
