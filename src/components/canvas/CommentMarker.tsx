
import React, { useState } from 'react';
import { Comment } from '../../types';
import { MessageSquare, X, Check, Trash2, Lock } from 'lucide-react';

interface CommentMarkerProps {
    comment: Comment;
    theme: 'light' | 'dark';
    onUpdate: (id: string, content: string, color: string, isResolved: boolean) => void;
    onDelete: (id: string) => void;
    onToggleLock: (id: string) => void;
    isSelected: boolean;
    onSelect: () => void;
}

export const CommentMarker: React.FC<CommentMarkerProps> = ({
    comment, theme, onUpdate, onDelete, onToggleLock, isSelected, onSelect
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [editColor, setEditColor] = useState(comment.color);

    const handleSave = () => {
        onUpdate(comment.id, editContent, editColor, comment.isResolved || false);
        setIsOpen(false);
    };

    const colors = [
        '#facc15', // Yellow
        '#f87171', // Red
        '#60a5fa', // Blue
        '#4ade80', // Green
        '#c084fc', // Purple
    ];

    return (
        <div
            className="absolute z-[80]"
            style={{ left: comment.x, top: comment.y }}
            onMouseDown={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            {/* Pin Icon */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-110 ${comment.isResolved ? 'opacity-50 grayscale' : ''} ${isSelected ? 'ring-2 ring-white scale-110' : ''}`}
                style={{ backgroundColor: comment.color }}
            >
                {comment.locked ? <Lock size={14} className="text-black/50" /> : <MessageSquare size={16} className="text-black/70 fill-black/20" />}
                {comment.isResolved && <div className="absolute inset-0 flex items-center justify-center text-black font-bold"><Check size={18}/></div>}
            </div>

            {/* Expanded Content */}
            {isOpen && (
                <div 
                    className={`absolute top-10 left-1/2 -translate-x-1/2 w-64 p-4 rounded-xl shadow-2xl border z-[90] animate-in fade-in zoom-in-95 duration-150 cursor-default ${theme === 'light' ? 'bg-white border-zinc-300' : 'bg-zinc-900 border-zinc-700'}`}
                    onMouseDown={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">{comment.timestamp}</span>
                        <div className="flex gap-1">
                            <button onClick={() => onToggleLock(comment.id)} className={`p-1 rounded hover:bg-black/10 ${comment.locked ? 'text-orange-500' : 'text-zinc-400'}`}>
                                <Lock size={14}/>
                            </button>
                            <button onClick={() => onDelete(comment.id)} className="p-1 rounded hover:bg-red-500/10 text-zinc-400 hover:text-red-500">
                                <Trash2 size={14}/>
                            </button>
                            <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-black/10 text-zinc-400 hover:text-zinc-200">
                                <X size={14}/>
                            </button>
                        </div>
                    </div>

                    <textarea 
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        placeholder="Notunuzu buraya yazın..."
                        className={`w-full h-24 text-sm p-2 rounded resize-none outline-none mb-3 font-medium ${theme === 'light' ? 'bg-zinc-100 text-zinc-800' : 'bg-zinc-950 text-zinc-200 border border-zinc-800'}`}
                        disabled={comment.locked}
                    />

                    <div className="flex justify-between items-center">
                        <div className="flex gap-1">
                            {colors.map(c => (
                                <button 
                                    key={c}
                                    onClick={() => setEditColor(c)}
                                    className={`w-4 h-4 rounded-full border transition-transform ${editColor === c ? 'scale-125 border-white shadow-sm' : 'border-transparent hover:scale-110'}`}
                                    style={{ backgroundColor: c }}
                                    disabled={comment.locked}
                                />
                            ))}
                        </div>
                        <button 
                            onClick={handleSave}
                            disabled={comment.locked}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors"
                        >
                            Tamam
                        </button>
                    </div>
                    
                    <div className="mt-3 pt-2 border-t border-zinc-800/50 flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id={`resolve-${comment.id}`}
                            checked={comment.isResolved} 
                            onChange={(e) => onUpdate(comment.id, editContent, editColor, e.target.checked)}
                            className="accent-green-500 cursor-pointer"
                            disabled={comment.locked}
                        />
                        <label htmlFor={`resolve-${comment.id}`} className="text-xs font-medium text-zinc-500 cursor-pointer select-none">
                            Çözüldü olarak işaretle
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
};
