
import React, { useEffect } from 'react';
import { ProductInstance, TextNode, Zone, Comment } from '../types';

interface UseAppShortcutsProps {
    selectedIds: Set<string>;
    instances: ProductInstance[];
    setInstances: React.Dispatch<React.SetStateAction<ProductInstance[]>>;
    setTextNodes: React.Dispatch<React.SetStateAction<TextNode[]>>;
    setZones: React.Dispatch<React.SetStateAction<Zone[]>>;
    setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
    handleRedo: () => void;
    handleUndo: () => void;
    handleCopyInstance: () => void;
    handlePasteInstance: () => void;
    handleUngroupSelected: () => void;
    handleGroupSelected: () => void;
    handleDeleteSelected: () => void;
    handleSaveBlockAsTemplate: () => void;
    handleAutoRoute: () => void;
    handleSaveProject: () => void;
    performCheckpoint: () => void;
    selectedInstanceId: string | null;
    clipboardInstance: ProductInstance | null;
    onSetCanvasMode?: (mode: 'select' | 'move' | 'rotate' | 'scale' | 'zone' | 'text') => void;
}

export const useAppShortcuts = ({
    selectedIds,
    instances,
    setInstances,
    setTextNodes,
    setZones,
    setComments,
    handleRedo,
    handleUndo,
    handleCopyInstance,
    handlePasteInstance,
    handleUngroupSelected,
    handleGroupSelected,
    handleDeleteSelected,
    handleSaveBlockAsTemplate,
    handleAutoRoute,
    handleSaveProject,
    performCheckpoint,
    selectedInstanceId,
    clipboardInstance,
    onSetCanvasMode
}: UseAppShortcutsProps) => {

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            // Ignore shortcuts when typing in inputs
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
            
            const key = e.key.toLowerCase();

            // Ctrl/Cmd shortcuts
            if (e.metaKey || e.ctrlKey) {
                if (key === 'z') { 
                    e.preventDefault(); 
                    e.shiftKey ? handleRedo() : handleUndo(); 
                } 
                else if (key === 'y') { 
                    e.preventDefault(); 
                    handleRedo(); 
                }
                else if (key === 'c') { 
                    if (selectedInstanceId) {
                        e.preventDefault();
                        handleCopyInstance(); 
                    }
                }
                else if (key === 'v') { 
                    if (clipboardInstance) {
                        e.preventDefault();
                        handlePasteInstance(); 
                    }
                }
                else if (key === 'g') { 
                    e.preventDefault(); 
                    e.shiftKey ? handleUngroupSelected() : handleGroupSelected(); 
                }
                else if (key === 'b') {
                    e.preventDefault();
                    if (selectedIds.size > 0) {
                        handleSaveBlockAsTemplate();
                    }
                }
                else if (key === 's') {
                    e.preventDefault();
                    handleSaveProject();
                }
            } 
            // Single key shortcuts
            else {
                // Arrow keys for movement
                if (selectedIds.size > 0) {
                    const step = e.shiftKey ? 10 : 1;
                    let dx = 0, dy = 0, handled = false;
                    
                    if (key === 'arrowup') { dy = -step; handled = true; }
                    else if (key === 'arrowdown') { dy = step; handled = true; }
                    else if (key === 'arrowleft') { dx = -step; handled = true; }
                    else if (key === 'arrowright') { dx = step; handled = true; }

                    if (handled) {
                        e.preventDefault(); 
                        performCheckpoint();
                        setInstances(prev => prev.map(inst => selectedIds.has(inst.id) && !inst.locked ? { ...inst, x: inst.x + dx, y: inst.y + dy } : inst));
                        setTextNodes(prev => prev.map(txt => selectedIds.has(txt.id) && !txt.locked ? { ...txt, x: txt.x + dx, y: txt.y + dy } : txt));
                        setZones(prev => prev.map(z => selectedIds.has(z.id) && !z.locked ? { ...z, x: z.x + dx, y: z.y + dy } : z));
                        setComments(prev => prev.map(c => selectedIds.has(c.id) && !c.locked ? { ...c, x: c.x + dx, y: c.y + dy } : c));
                    }
                }
                
                // Delete/Backspace
                if (key === 'delete' || key === 'backspace') { 
                    if (selectedIds.size > 0) { 
                        e.preventDefault(); 
                        performCheckpoint(); 
                        handleDeleteSelected(); 
                    } 
                }
                
                // Mode shortcuts (only if onSetCanvasMode is provided)
                if (onSetCanvasMode) {
                    if (key === 'm') { 
                        e.preventDefault(); 
                        onSetCanvasMode('move'); 
                    }
                    else if (key === 'r') { 
                        e.preventDefault(); 
                        onSetCanvasMode('rotate'); 
                    }
                    else if (key === 's') { 
                        e.preventDefault(); 
                        onSetCanvasMode('scale'); 
                    }
                    else if (key === 'a') { 
                        e.preventDefault(); 
                        onSetCanvasMode('zone'); 
                    }
                }
                
                // Auto-route shortcut
                if (key === 'b') {
                    e.preventDefault();
                    handleAutoRoute();
                }
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        handleUndo, 
        handleRedo, 
        selectedIds, 
        instances, 
        clipboardInstance, 
        performCheckpoint, 
        selectedInstanceId,
        handleCopyInstance,
        handlePasteInstance,
        handleGroupSelected,
        handleUngroupSelected,
        handleDeleteSelected,
        handleSaveBlockAsTemplate,
        handleAutoRoute,
        handleSaveProject,
        onSetCanvasMode,
        setInstances,
        setTextNodes,
        setZones,
        setComments
    ]);
};
