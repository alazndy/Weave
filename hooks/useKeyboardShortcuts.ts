/**
 * useKeyboardShortcuts - Canvas keyboard shortcuts for Weave
 */

import { useEffect, useCallback } from 'react';

export type WeaveAction =
  | 'delete'
  | 'duplicate'
  | 'copy'
  | 'paste'
  | 'cut'
  | 'undo'
  | 'redo'
  | 'select-all'
  | 'deselect'
  | 'zoom-in'
  | 'zoom-out'
  | 'zoom-fit'
  | 'zoom-reset'
  | 'pan-mode'
  | 'save'
  | 'export';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: WeaveAction;
  description: string;
}

const SHORTCUTS: ShortcutConfig[] = [
  // Edit
  { key: 'Delete', action: 'delete', description: 'Seçimi Sil' },
  { key: 'Backspace', action: 'delete', description: 'Seçimi Sil' },
  { key: 'd', ctrl: true, action: 'duplicate', description: 'Kopyala' },
  { key: 'c', ctrl: true, action: 'copy', description: 'Kopyala' },
  { key: 'v', ctrl: true, action: 'paste', description: 'Yapıştır' },
  { key: 'x', ctrl: true, action: 'cut', description: 'Kes' },
  
  // History
  { key: 'z', ctrl: true, action: 'undo', description: 'Geri Al' },
  { key: 'z', ctrl: true, shift: true, action: 'redo', description: 'Yinele' },
  { key: 'y', ctrl: true, action: 'redo', description: 'Yinele' },
  
  // Selection
  { key: 'a', ctrl: true, action: 'select-all', description: 'Tümünü Seç' },
  { key: 'Escape', action: 'deselect', description: 'Seçimi Kaldır' },
  
  // Zoom
  { key: '=', ctrl: true, action: 'zoom-in', description: 'Yakınlaştır' },
  { key: '-', ctrl: true, action: 'zoom-out', description: 'Uzaklaştır' },
  { key: '0', ctrl: true, action: 'zoom-reset', description: 'Zoom Sıfırla' },
  { key: '1', ctrl: true, action: 'zoom-fit', description: 'Sığdır' },
  
  // Tools
  { key: ' ', action: 'pan-mode', description: 'Pan Modu (Space+Drag)' },
  
  // File
  { key: 's', ctrl: true, action: 'save', description: 'Kaydet' },
  { key: 'e', ctrl: true, shift: true, action: 'export', description: 'Dışa Aktar' },
];

interface UseKeyboardShortcutsOptions {
  onAction: (action: WeaveAction) => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const { onAction, enabled = true } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if typing in input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      if (event.key !== 'Escape') return;
    }

    // Find matching shortcut
    const shortcut = SHORTCUTS.find(s => {
      const keyMatch = s.key === event.key || s.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = !!s.ctrl === (event.ctrlKey || event.metaKey);
      const shiftMatch = !!s.shift === event.shiftKey;
      const altMatch = !!s.alt === event.altKey;
      return keyMatch && ctrlMatch && shiftMatch && altMatch;
    });

    if (!shortcut) return;

    event.preventDefault();
    onAction(shortcut.action);
  }, [onAction]);

  // Handle space for pan mode
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.key === ' ') {
      // End pan mode
      document.body.style.cursor = 'default';
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, handleKeyDown, handleKeyUp]);

  return {
    shortcuts: SHORTCUTS,
  };
}

// Clipboard state
let clipboard: unknown = null;

export function setClipboard(data: unknown) {
  clipboard = data;
}

export function getClipboard() {
  return clipboard;
}

// Export shortcut list for help modal
export function getShortcutGroups() {
  return [
    {
      title: 'Düzenleme',
      shortcuts: SHORTCUTS.filter(s => 
        ['delete', 'duplicate', 'copy', 'paste', 'cut'].includes(s.action)
      ),
    },
    {
      title: 'Geçmiş',
      shortcuts: SHORTCUTS.filter(s => 
        ['undo', 'redo'].includes(s.action)
      ),
    },
    {
      title: 'Seçim',
      shortcuts: SHORTCUTS.filter(s => 
        ['select-all', 'deselect'].includes(s.action)
      ),
    },
    {
      title: 'Görünüm',
      shortcuts: SHORTCUTS.filter(s => 
        ['zoom-in', 'zoom-out', 'zoom-fit', 'zoom-reset', 'pan-mode'].includes(s.action)
      ),
    },
    {
      title: 'Dosya',
      shortcuts: SHORTCUTS.filter(s => 
        ['save', 'export'].includes(s.action)
      ),
    },
  ];
}
