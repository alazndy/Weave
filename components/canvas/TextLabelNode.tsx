


import React from 'react';
import { TextNode } from '../../types';
import { Edit2, Trash2, Lock } from 'lucide-react';

interface TextLabelNodeProps {
  text: TextNode;
  theme: 'light' | 'dark';
  isSelected: boolean;
  handleTextMouseDown: (e: React.MouseEvent, id: string) => void;
  setEditingTextId: (id: string) => void;
  removeText: (id: string) => void;
}

export const TextLabelNode: React.FC<TextLabelNodeProps> = ({
  text, theme, isSelected, handleTextMouseDown, setEditingTextId, removeText
}) => {
    return (
        <div 
            style={{ 
                left: text.x, 
                top: text.y, 
                color: theme === 'light' && text.color === '#ffffff' ? '#000000' : text.color, 
                fontSize: `${text.fontSize}px`,
                opacity: text.locked ? 0.7 : 1
            }} 
            className={`absolute z-40 whitespace-pre-wrap ${text.locked ? 'cursor-default' : 'cursor-move'} group font-bold leading-tight drop-shadow-md ${isSelected ? 'ring-1 ring-emerald-500 bg-emerald-500/10 rounded p-1' : ''}`} 
            onMouseDown={(e) => handleTextMouseDown(e, text.id)} 
            onDoubleClick={(e) => { 
                if(!text.locked) {
                    e.stopPropagation(); 
                    setEditingTextId(text.id); 
                }
            }}
        >
            {text.locked && <div className="absolute -left-5 top-0 text-zinc-500"><Lock size={14}/></div>}
            {text.content}
            {!text.locked && (
                <div className="absolute -top-6 right-0 opacity-0 group-hover:opacity-100 flex gap-1 bg-zinc-900/80 p-1 rounded no-print">
                    <button onClick={() => setEditingTextId(text.id)} className="text-zinc-400 hover:text-white"><Edit2 size={16}/></button>
                    <button onClick={() => removeText(text.id)} className="text-zinc-400 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
            )}
        </div>
    );
};