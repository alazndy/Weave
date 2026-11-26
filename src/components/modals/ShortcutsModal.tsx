import { Keyboard, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;
  
  const shortcuts = [
    { keys: ['Ctrl', 'Z'], desc: t('shortcutDesc.undo') },
    { keys: ['Ctrl', 'Y'], desc: t('shortcutDesc.redo') },
    { keys: ['Ctrl', 'C'], desc: t('shortcutDesc.copy') },
    { keys: ['Ctrl', 'V'], desc: t('shortcutDesc.paste') },
    { keys: ['Delete'], desc: t('shortcutDesc.deleteSelected') },
    { keys: [t('shortcutKeys.arrows')], desc: t('shortcutDesc.nudge') },
    { keys: ['Shift', t('shortcutKeys.arrow')], desc: t('shortcutDesc.fastMove') },
    { keys: ['Shift', t('shortcutKeys.drag')], desc: t('shortcutDesc.multiSelect') },
    { keys: ['V'], desc: t('shortcutDesc.selectTool') },
    { keys: ['M'], desc: t('shortcutDesc.moveTool') },
    { keys: ['S'], desc: t('shortcutDesc.scaleTool') },
    { keys: ['B'], desc: t('shortcutDesc.boxSelect') },
    { keys: ['R'], desc: t('shortcutDesc.manualRoute') },
    { keys: ['Z'], desc: t('shortcutDesc.addZone') },
    { keys: ['T'], desc: t('shortcutDesc.addText') },
    { keys: ['C'], desc: t('shortcutDesc.addComment') },
    { keys: ['Alt', 'R'], desc: t('shortcutDesc.autoRoute') },
    { keys: ['Ctrl', 'G'], desc: t('shortcutDesc.group') },
    { keys: ['Ctrl', 'S'], desc: t('shortcutDesc.saveFile') },
    { keys: [t('shortcutKeys.wheel')], desc: t('shortcutDesc.zoom') },
    { keys: [t('shortcutKeys.middle')], desc: t('shortcutDesc.pan') },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] no-print" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-[500px] max-w-[95vw] max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 p-2 rounded-lg border border-teal-500/20">
              <Keyboard className="text-teal-400 w-6 h-6" />
            </div>
            {t('shortcutDesc.title')}
          </h3>
          <button onClick={onClose} aria-label={t('common.close')} className="text-zinc-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between bg-zinc-950/50 p-3 rounded-lg border border-white/5">
              <span className="text-sm font-medium text-zinc-300">{s.desc}</span>
              <div className="flex gap-1">
                {s.keys.map((k, j) => (
                  <kbd key={j} className="px-2 py-1 bg-zinc-800 rounded border border-zinc-600 text-xs font-bold text-zinc-100 font-mono shadow-sm">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-zinc-500">{t('shortcutDesc.tip')}</p>
        </div>
      </div>
    </div>
  );
};