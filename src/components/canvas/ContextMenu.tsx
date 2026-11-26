

import { Edit2, Copy, RotateCw, FlipHorizontal, Trash2, Group, Ungroup, PackagePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ContextMenu = ({ 
    x, y, instanceId, onClose, onEdit, onCopy, onMirror, onRotate, onDelete,
    onGroup, onUngroup, onSaveBlock, isGrouped, isMultiSelect
}: { 
    x: number, y: number, instanceId: string, 
    onClose: () => void, 
    onEdit: () => void, 
    onCopy: () => void, 
    onMirror: () => void, 
    onRotate: () => void, 
    onDelete: () => void,
    onGroup?: () => void,
    onUngroup?: () => void,
    onSaveBlock?: () => void,
    isGrouped?: boolean,
    isMultiSelect?: boolean
}) => {
    const { t } = useTranslation();
    return (
        <>
            <div className="fixed inset-0 z-[90]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}></div>
            <div 
                className="fixed z-[100] bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl py-1 w-52 flex flex-col animate-in fade-in zoom-in-95 duration-100"
                style={{ top: y, left: x }}
            >
                <button onClick={() => { onEdit(); onClose(); }} className="px-4 py-2 text-sm text-left text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center gap-2 font-medium">
                    <Edit2 size={14}/> {t('contextMenu.editProduct')}
                </button>
                <button onClick={() => { onCopy(); onClose(); }} className="px-4 py-2 text-sm text-left text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center gap-2 font-medium">
                    <Copy size={14}/> {t('contextMenu.copy')}
                </button>
                <button onClick={() => { onRotate(); onClose(); }} className="px-4 py-2 text-sm text-left text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center gap-2 font-medium">
                    <RotateCw size={14}/> {t('contextMenu.rotate')}
                </button>
                <button onClick={() => { onMirror(); onClose(); }} className="px-4 py-2 text-sm text-left text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center gap-2 font-medium">
                    <FlipHorizontal size={14}/> {t('contextMenu.mirror')}
                </button>
                
                <div className="h-px bg-zinc-700 my-1"></div>
                
                {isMultiSelect && !isGrouped && onGroup && (
                    <button onClick={() => { onGroup(); onClose(); }} className="px-4 py-2 text-sm text-left text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center gap-2 font-medium">
                        <Group size={14}/> {t('contextMenu.group')}
                    </button>
                )}
                
                {isGrouped && onUngroup && (
                    <button onClick={() => { onUngroup(); onClose(); }} className="px-4 py-2 text-sm text-left text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center gap-2 font-medium">
                        <Ungroup size={14}/> {t('contextMenu.ungroup')}
                    </button>
                )}

                {isMultiSelect && onSaveBlock && (
                    <button onClick={() => { onSaveBlock(); onClose(); }} className="px-4 py-2 text-sm text-left text-zinc-200 hover:bg-zinc-800 hover:text-white flex items-center gap-2 font-medium">
                        <PackagePlus size={14}/> {t('contextMenu.saveBlock')}
                    </button>
                )}

                <div className="h-px bg-zinc-700 my-1"></div>
                
                <button onClick={() => { onDelete(); onClose(); }} className="px-4 py-2 text-sm text-left text-red-400 hover:bg-red-900/30 hover:text-red-300 flex items-center gap-2 font-bold">
                    <Trash2 size={14}/> {t('contextMenu.delete')}
                </button>
            </div>
        </>
    );
};