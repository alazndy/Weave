
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
                    className={`h-6 px-4 rounded-t-lg text-xs font-bold flex items-center justify-center gap-1 border-t border-x shadow-lg backdrop-blur-md transition-all ${theme === 'light' ? 'bg-white/90 border-zinc-300 text-zinc-600' : 'bg-ink/90 border-white/10 text-zinc-400 hover:text-white'}`}
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
                className={`h-5 w-12 rounded-t-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity ${theme === 'light' ? 'bg-zinc-200 text-zinc-600' : 'bg-zinc-800 text-zinc-400'}`}
                title="Sayfa çubuğunu daralt"
                aria-label="Sayfa çubuğunu daralt"
            >
                <ChevronDown size={14}/>
            </button>
            <div className={`flex items-end gap-1 px-2 pt-2 pb-0 rounded-t-xl border-t border-x shadow-[0_-5px_20px_rgba(0,0,0,0.2)] backdrop-blur-md overflow-x-auto custom-scrollbar ${theme === 'light' ? 'bg-zinc-100/95 border-zinc-300' : 'bg-ink/95 border-white/10'}`}>
                
                {/* Grid View Toggle */}
                <button
                    onClick={onToggleGridView}
                    className={`h-9 w-9 mb-0.5 rounded-lg flex items-center justify-center transition-all mr-2 ${isGridView ? 'bg-paprika text-white shadow-md' : (theme === 'light' ? 'hover:bg-zinc-200 text-zinc-500' : 'hover:bg-white/10 text-zinc-400 hover:text-white')}`}
                    title="Sayfa Izgarası"
                >
                    <LayoutGrid size={18} />
                </button>

                {pages.map((page, index) => (
                    <div 
                        key={page.id}
                        className={`group relative flex items-center h-10 min-w-[140px] max-w-[200px] px-3 rounded-t-lg border-t border-x border-b-0 cursor-pointer select-none transition-all ${
                            page.id === activePageId && !isGridView
                            ? (theme === 'light' ? 'bg-white text-zinc-800 border-zinc-300 shadow-sm z-10' : 'bg-zinc-800 text-white border-white/10 z-10 shadow-lg') 
                            : (theme === 'light' ? 'bg-zinc-200/50 text-zinc-500 border-transparent hover:bg-zinc-200' : 'bg-zinc-900/50 text-zinc-500 border-transparent hover:bg-zinc-800 hover:text-zinc-300')
                        }`}
                        onClick={() => {
                             if(isGridView) onToggleGridView();
                             onSwitchPage(page.id);
                        }}
                        onDoubleClick={() => handleDoubleClick(page)}
                        title={page.name}
                    >
                        <FileText size={14} className={`shrink-0 mr-2 ${page.id === activePageId ? 'text-paprika' : 'opacity-50'}`} />
                        
                        {editingId === page.id ? (
                            <input 
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onBlur={() => handleRenameSubmit(page.id)}
                                onKeyDown={e => handleKeyDown(e, page.id)}
                                autoFocus
                                className="w-full bg-transparent border-none outline-none text-xs font-bold"
                                placeholder="Sayfa adı"
                                aria-label="Sayfa adı"
                            />
                        ) : (
                            <span className="text-xs font-bold truncate flex-1">{page.name}</span>
                        )}

                        <div className={`flex items-center gap-1 ml-2 ${page.id === activePageId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDuplicatePage(page.id); }}
                                className="p-1 rounded hover:bg-black/10 text-zinc-400 hover:text-blue-400"
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
                                    className="p-1 rounded hover:bg-black/10 text-zinc-400 hover:text-red-400"
                                    title="Sayfayı Sil"
                                >
                                    <X size={12}/>
                                </button>
                            )}
                        </div>
                        
                        {/* Active Indicator Line */}
                        {page.id === activePageId && !isGridView && (
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-paprika rounded-t-full"></div>
                        )}
                    </div>
                ))}

                <button 
                    onClick={onAddPage}
                    className={`ml-1 h-9 w-9 mb-0.5 rounded-lg flex items-center justify-center transition-all ${theme === 'light' ? 'hover:bg-zinc-200 text-zinc-500' : 'hover:bg-white/10 text-zinc-400 hover:text-white'}`}
                    title="Yeni Sayfa Ekle"
                >
                    <Plus size={18} />
                </button>
            </div>
        </div>
    );
};
