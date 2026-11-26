import { withJunctions } from '../../utils/junctions';
import { useTranslation } from 'react-i18next';

import React from 'react';
import { Page, ProductTemplate } from '../../types';
import { FileText, Trash2, Copy, MousePointer2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPortPosition } from '../../utils/canvasHelpers';

interface PageGridProps {
    pages: Page[];
    templates: ProductTemplate[];
    activePageId: string;
    onSwitchPage: (id: string) => void;
    onRemovePage: (id: string) => void;
    onDuplicatePage: (id: string) => void;
    onMovePage?: (id: string, toIndex: number) => void;
    theme: 'light' | 'dark';
}

const MiniCanvasPreview = ({ page, templates }: { page: Page, templates: ProductTemplate[] }) => {
    const { t } = useTranslation();
    // Calculate bounds to fit content
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    if (page.instances.length === 0) {
        return <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px]">{t('pageGrid.empty')}</div>;
    }

    page.instances.forEach(inst => {
        const template = templates.find(temp => temp.id === inst.templateId);
        const w = inst.width || template?.width || 100;
        const h = inst.height || template?.height || 100;
        minX = Math.min(minX, inst.x);
        minY = Math.min(minY, inst.y);
        maxX = Math.max(maxX, inst.x + w);
        maxY = Math.max(maxY, inst.y + h);
    });

    const wiring = withJunctions(page.instances, templates, page.junctions);

    // Add padding
    const padding = 100;
    minX -= padding; minY -= padding; maxX += padding; maxY += padding;
    const width = Math.max(maxX - minX, 800);
    const height = Math.max(maxY - minY, 600);

    return (
        <svg viewBox={`${minX} ${minY} ${width} ${height}`} className="w-full h-full bg-zinc-900 pointer-events-none">
             {/* Connections */}
             {page.connections.map(conn => {
                 const fromInst = wiring.instances.find(i => i.id === conn.fromInstanceId);
                 const toInst = wiring.instances.find(i => i.id === conn.toInstanceId);
                 const fromTemp = wiring.templates.find(t => t.id === fromInst?.templateId);
                 const toTemp = wiring.templates.find(t => t.id === toInst?.templateId);
                 if(!fromInst || !toInst || !fromTemp || !toTemp) return null;
                 
                 const start = getPortPosition(fromInst, fromTemp, conn.fromPortId);
                 const end = getPortPosition(toInst, toTemp, conn.toPortId);
                 
                 return (
                     <line 
                        key={conn.id} 
                        x1={start.x} y1={start.y} 
                        x2={end.x} y2={end.y} 
                        stroke={conn.color || '#6366f1'} 
                        strokeWidth="5" 
                        opacity="0.6"
                     />
                 );
             })}

             {/* Instances */}
             {page.instances.map(inst => {
                 const template = templates.find(temp => temp.id === inst.templateId);
                 const w = inst.width || template?.width || 100;
                 const h = inst.height || template?.height || 100;
                 return (
                     <rect 
                        key={inst.id}
                        x={inst.x} 
                        y={inst.y} 
                        width={w} 
                        height={h}
                        fill="#27272a"
                        stroke="#52525b"
                        strokeWidth="2"
                        rx="4"
                     />
                 );
             })}
        </svg>
    );
};

export const PageGrid: React.FC<PageGridProps> = ({ 
    pages, templates, activePageId, onSwitchPage, onRemovePage, onDuplicatePage, onMovePage, theme 
}) => {
    const { t } = useTranslation();
    const [dragId, setDragId] = React.useState<string | null>(null);
    const [overId, setOverId] = React.useState<string | null>(null);
    return (
        <div className="w-full h-full overflow-y-auto p-10 bg-ink">
            <h2 className="text-2xl font-bold text-alabaster mb-8 flex items-center gap-3">
                <FileText className="text-paprika"/> {t('pageGrid.overview')}
            </h2>
            
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-8">
                {pages.map((page, index) => (
                    <div 
                        key={page.id}
                        data-testid="page-card"
                        data-page-id={page.id}
                        draggable={!!onMovePage}
                        onDragStart={(e) => { setDragId(page.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', page.id); }}
                        onDragOver={(e) => { if (dragId && dragId !== page.id) { e.preventDefault(); setOverId(page.id); } }}
                        onDragLeave={() => setOverId(o => (o === page.id ? null : o))}
                        onDrop={(e) => { e.preventDefault(); if (dragId && onMovePage) onMovePage(dragId, index); setDragId(null); setOverId(null); }}
                        onDragEnd={() => { setDragId(null); setOverId(null); }}
                        className={`${overId === page.id ? 'ring-4 ring-paprika ' : ''}${dragId === page.id ? 'opacity-40 ' : ''}group relative aspect-video bg-zinc-900 rounded-xl border-2 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl ${page.id === activePageId ? 'border-paprika ring-4 ring-paprika/20' : 'border-zinc-700 hover:border-zinc-500'}`}
                        onClick={() => onSwitchPage(page.id)}
                    >
                        {/* Header */}
                        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent z-30 pointer-events-none flex justify-between items-start">
                            <div>
                                <h3 className="text-sm font-bold text-white shadow-sm flex items-center gap-2">
                                    <span className="bg-zinc-800 w-6 h-6 flex items-center justify-center rounded-full text-xs">{index + 1}</span>
                                    {page.name}
                                </h3>
                                <p className="text-[10px] text-zinc-400 mt-0.5 ml-8">{t('pageGrid.counts', { devices: page.instances.length, links: page.connections.length })}</p>
                            </div>
                            {onMovePage && (
                                <div className="flex gap-1 pointer-events-auto">
                                    <button type="button" aria-label={t('pageGrid.earlierAria', { name: page.name })} title={t('pageGrid.earlier')} disabled={index === 0}
                                        onClick={(e) => { e.stopPropagation(); onMovePage(page.id, index - 1); }}
                                        className="p-1 rounded bg-black/50 text-white hover:bg-paprika disabled:opacity-30"><ChevronLeft size={14} /></button>
                                    <button type="button" aria-label={t('pageGrid.laterAria', { name: page.name })} title={t('pageGrid.later')} disabled={index === pages.length - 1}
                                        onClick={(e) => { e.stopPropagation(); onMovePage(page.id, index + 1); }}
                                        className="p-1 rounded bg-black/50 text-white hover:bg-paprika disabled:opacity-30"><ChevronRight size={14} /></button>
                                </div>
                            )}
                        </div>

                        {/* Preview */}
                        <div className="w-full h-full p-8">
                            <MiniCanvasPreview page={page} templates={templates} />
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm z-20">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onSwitchPage(page.id); }}
                                className="flex flex-col items-center gap-2 text-white hover:text-teal-400 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shadow-lg border border-white/10">
                                    <MousePointer2 size={20} />
                                </div>
                                <span className="text-xs font-bold">{t('common.edit')}</span>
                            </button>
                            
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDuplicatePage(page.id); }}
                                className="flex flex-col items-center gap-2 text-white hover:text-blue-400 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shadow-lg border border-white/10">
                                    <Copy size={20} />
                                </div>
                                <span className="text-xs font-bold">{t('pageGrid.duplicate')}</span>
                            </button>

                            {pages.length > 1 && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); if(confirm(t('pageGrid.confirmDelete'))) onRemovePage(page.id); }}
                                    className="flex flex-col items-center gap-2 text-white hover:text-red-400 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shadow-lg border border-white/10">
                                        <Trash2 size={20} />
                                    </div>
                                    <span className="text-xs font-bold">{t('common.delete')}</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
