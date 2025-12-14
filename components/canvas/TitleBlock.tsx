
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
    const borderColor = theme === 'light' ? '#000000' : '#52525b'; // Zinc-600 in dark mode
    const textColor = theme === 'light' ? '#000000' : '#e4e4e7'; // Zinc-200 in dark mode
    const labelColor = theme === 'light' ? '#555555' : '#a1a1aa'; // Zinc-400 in dark mode
    const logoBg = theme === 'light' ? 'transparent' : '#ffffff';

    const styles = {
        container: {
            borderColor: borderColor,
            color: textColor
        },
        label: {
            color: labelColor
        },
        cellBorder: {
            borderColor: borderColor
        }
    };

    return (
        <div 
            className="absolute bottom-[20px] right-[20px] bg-white dark:bg-zinc-900 border-2 z-10 print-title-block select-none overflow-hidden group/titleblock"
            style={{ 
                width: 'min(100% - 40px, 600px)', 
                height: '150px', // Fixed height to allow BOM positioning
                ...styles.container,
                backgroundColor: theme === 'light' ? '#ffffff' : '#18181b'
            }}
            id="legend-export-area"
        >
            {onEdit && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="absolute top-2 right-2 p-2 bg-blue-600 text-white rounded shadow-lg opacity-0 group-hover/titleblock:opacity-100 transition-opacity z-50 hover:bg-blue-500 no-print pointer-events-auto"
                    title="Anteti Düzenle"
                >
                    <Edit size={14} />
                </button>
            )}

            <div className="flex h-full flex-col">
                {/* Top Section */}
                <div className="flex border-b flex-1" style={styles.cellBorder}>
                    {/* Logo Area */}
                    <div className="w-32 flex items-center justify-center p-2 border-r relative overflow-hidden" style={{...styles.cellBorder, backgroundColor: logoBg}}>
                        {metadata.companyLogo ? (
                            <img src={metadata.companyLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <div className="text-xs text-center text-zinc-400 font-bold uppercase p-4">Logo Yok</div>
                        )}
                    </div>
                    
                    {/* Project Info */}
                    <div className="flex-1 flex flex-col">
                        <div className="flex-[2] p-2 border-b flex flex-col justify-center" style={styles.cellBorder}>
                            <span className="text-[9px] font-bold uppercase block" style={styles.label}>Proje Başlığı</span>
                            <span className="text-lg font-bold leading-tight line-clamp-2">{metadata.projectName || 'İsimsiz Proje'}</span>
                        </div>
                        <div className="flex-1 p-2 flex flex-col justify-center">
                            <span className="text-[9px] font-bold uppercase block" style={styles.label}>Müşteri / Firma</span>
                            <span className="text-sm font-medium">{metadata.companyName || 'Firma Adı'} {metadata.customerName ? `| ${metadata.customerName}` : ''}</span>
                        </div>
                    </div>
                </div>

                {/* Middle Grid Section */}
                <div className="grid grid-cols-4 border-b h-12" style={styles.cellBorder}>
                    <div className="p-1 border-r flex flex-col justify-center" style={styles.cellBorder}>
                        <span className="text-[8px] font-bold uppercase block" style={styles.label}>Hazırlayan</span>
                        <span className="text-[10px] font-medium truncate block">{metadata.preparedBy || '-'}</span>
                    </div>
                    <div className="p-1 border-r flex flex-col justify-center" style={styles.cellBorder}>
                        <span className="text-[8px] font-bold uppercase block" style={styles.label}>Onaylayan</span>
                        <span className="text-[10px] font-medium truncate block">{metadata.approvedBy || '-'}</span>
                    </div>
                    <div className="p-1 border-r flex flex-col justify-center" style={styles.cellBorder}>
                        <span className="text-[8px] font-bold uppercase block" style={styles.label}>Tarih</span>
                        <span className="text-[10px] font-medium truncate block">{metadata.date}</span>
                    </div>
                    <div className="p-1 flex flex-col justify-center">
                        <span className="text-[8px] font-bold uppercase block" style={styles.label}>Revizyon</span>
                        <span className="text-[10px] font-medium truncate block">{metadata.revision}</span>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="flex h-10">
                    <div className="flex-1 p-1 border-r flex flex-col justify-center" style={styles.cellBorder}>
                        <span className="text-[8px] font-bold uppercase block" style={styles.label}>Döküman No</span>
                        <span className="text-sm font-bold font-mono">{metadata.documentNo}</span>
                    </div>
                    <div className="w-24 p-1 border-r flex flex-col justify-center" style={styles.cellBorder}>
                         <span className="text-[8px] font-bold uppercase block" style={styles.label}>Sayfa Adı</span>
                         <span className="text-[10px] font-bold truncate block">{pageName}</span>
                    </div>
                    <div className="w-24 p-1 border-r flex flex-col justify-center" style={styles.cellBorder}>
                        <span className="text-[8px] font-bold uppercase block" style={styles.label}>Ölçek</span>
                        <span className="text-[10px] font-bold">{metadata.scale}</span>
                    </div>
                    <div className="w-16 p-1 flex items-center justify-center bg-black/5 dark:bg-white/5">
                        <span className="text-sm font-bold">{pageNumber} / {totalPages}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
