import React, { useState } from 'react';
import { Page } from '../../types';
import { Plus, X, Copy, FileText, ChevronUp, ChevronDown, LayoutGrid } from 'lucide-react';

interface PageBarProps {
    pages: Page[];
    activePageId: string;
    onSwitchPage: (id: string) => void;
    onAddPage: () => void;
    onDuplicatePage: (id: string) => void;
    onRemovePage: (id: string) => void;
    onRenamePage: (id: string, newName: string) => void;
    onToggleGridView: () => void;
    isGridView: boolean;
    theme: 'light' | 'dark';
}

export const PageBar: React.FC<PageBarProps> = ({ 
    pages, activePageId, onSwitchPage, onAddPage, onDuplicatePage, onRemovePage, onRenamePage, onToggleGridView, isGridView, theme 
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleDoubleClick = (page: Page) => {
        setEditingId(page.id);
        setEditName(page.name);
    };

    const handleRenameSubmit = (id: string) => {
        if (editName.trim()) {
            onRenamePage(id, editName.trim());
        }
        setEditingId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
        if (e.key === 'Enter') handleRenameSubmit(id);
        if (e.key === 'Escape') setEditingId(null);
    };

    if (isCollapsed) {
        return (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
                 <button 
                    onClick={() => setIsCollapsed(false)}
                    className="h-7 px-4 rounded-t-xl text-xs font-bold flex items-center justify-center gap-2 border-t border-x border-white/20 shadow-lg backdrop-blur-xl glass-panel text-zinc-500 hover:text-paprika transition-all"
                >
                    <ChevronUp size={14}/> Sayfalar ({pages.length})
                </button>
            </div>
        )
    }

    return (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center max-w-[90vw] no-print">
            <button 
                onClick={() => setIsCollapsed(true)}
                className="h-5 w-16 rounded-t-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-all bg-black/20 text-white/50 hover:bg-black/40 hover:text-white backdrop-blur-sm"
                title="Sayfa çubuğunu daralt"
                aria-label="Sayfa çubuğunu daralt"
            >
                <ChevronDown size={14}/>
            </button>
            <div className="flex items-end gap-1 px-2 pt-2 pb-0 rounded-t-2xl border-t border-x border-white/10 shadow-[0_-5px_30px_rgba(0,0,0,0.3)] glass-panel overflow-x-auto custom-scrollbar">
                
                {/* Grid View Toggle */}
                <button
                    onClick={onToggleGridView}
                    className={`h-9 w-9 mb-1 rounded-xl flex items-center justify-center transition-all mr-2 ${isGridView ? 'bg-paprika text-white shadow-lg shadow-paprika/20' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-white/10'}`}
                    title="Sayfa Izgarası"
                >
                    <LayoutGrid size={18} />
                </button>

                {pages.map((page, index) => (
                    <div 
                        key={page.id}
                        className={`group relative flex items-center h-10 min-w-[140px] max-w-[200px] px-3 rounded-t-xl border-t border-x border-b-0 cursor-pointer select-none transition-all duration-200 ${
                            page.id === activePageId && !isGridView
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-zinc-200 dark:border-white/10 shadow-lg z-10' 
                            : 'bg-zinc-100/50 dark:bg-white/5 text-zinc-500 border-transparent hover:bg-zinc-200/50 dark:hover:bg-white/10 hover:text-zinc-800 dark:hover:text-zinc-300'
                        }`}
                        onClick={() => {
                             if(isGridView) onToggleGridView();
                             onSwitchPage(page.id);
                        }}
                        onDoubleClick={() => handleDoubleClick(page)}
                        title={page.name}
                    >
                        <FileText size={14} className={`shrink-0 mr-2 transition-colors ${page.id === activePageId ? 'text-paprika' : 'opacity-50 group-hover:opacity-100'}`} />
                        
                        {editingId === page.id ? (
                            <input 
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onBlur={() => handleRenameSubmit(page.id)}
                                onKeyDown={e => handleKeyDown(e, page.id)}
                                autoFocus
                                className="w-full bg-transparent border-none outline-none text-xs font-bold text-zinc-900 dark:text-white"
                                placeholder="Sayfa adı"
                                aria-label="Sayfa adı"
                            />
                        ) : (
                            <span className="text-xs font-bold truncate flex-1">{page.name}</span>
                        )}

                        <div className={`flex items-center gap-1 ml-2 ${page.id === activePageId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDuplicatePage(page.id); }}
                                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-blue-500 transition-colors"
                                title="Sayfayı Çoğalt"
                            >
                                <Copy size={12}/>
                            </button>
                            {pages.length > 1 && (
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if(confirm(`"${page.name}" sayfasını silmek istediğinize emin misiniz?`)) onRemovePage(page.id); 
                                    }}
                                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-red-500 transition-colors"
                                    title="Sayfayı Sil"
                                >
                                    <X size={12}/>
                                </button>
                            )}
                        </div>
                        
                        {/* Active Indicator Line */}
                        {page.id === activePageId && !isGridView && (
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-paprika to-apricot rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
                        )}
                    </div>
                ))}

                <button 
                    onClick={onAddPage}
                    className="ml-1 h-9 w-9 mb-1 rounded-xl flex items-center justify-center transition-all text-zinc-500 hover:text-apricot hover:bg-apricot/10"
                    title="Yeni Sayfa Ekle"
                >
                    <Plus size={18} />
                </button>
            </div>
        </div>
    );
};
