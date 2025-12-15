

import React from 'react';
import { Undo2, Redo2, Loader2, Wand2, Route, Trash2, Printer, Sun, Moon, HelpCircle, TableProperties, History, Group, Ungroup, PackagePlus } from 'lucide-react';
import { EcosystemSwitcher } from './EcosystemSwitcher';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useTranslation } from 'react-i18next';

interface ToolbarProps {
  handleUndo: () => void;
  handleRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isAnalyzing: boolean;
  runAnalysis: () => void;
  handleAutoRoute: () => void;
  hasConnections: boolean;
  requestClear: () => void;
  handleExportImage: () => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  openShortcuts: () => void;
  openPinout?: () => void;
  openHistory?: () => void;
  selectedCount?: number;
  handleGroup?: () => void;
  handleUngroup?: () => void;
  handleSaveBlock?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  handleUndo,
  handleRedo,
  canUndo,
  canRedo,
  isAnalyzing,
  runAnalysis,
  handleAutoRoute,
  hasConnections,
  requestClear,
  handleExportImage,
  theme,
  setTheme,
  openShortcuts,
  openPinout,
  openHistory,
  selectedCount = 0,
  handleGroup,
  handleUngroup,
  handleSaveBlock
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-ink/80 backdrop-blur-xl border border-white/10 p-1 rounded-full shadow-2xl flex gap-1 items-center no-print ring-1 ring-black/20 transition-all hover:bg-ink/95">
        <div className="flex gap-0.5 px-0.5">
            <button 
                onClick={handleUndo}
                disabled={!canUndo}
                className="text-zinc-400 hover:text-white hover:bg-white/10 w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                title={t('undo')}
            >
                <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button 
                onClick={handleRedo}
                disabled={!canRedo}
                className="text-zinc-400 hover:text-white hover:bg-white/10 w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                title={t('redo')}
            >
                <Redo2 className="w-3.5 h-3.5" />
            </button>
        </div>
        
        <div className="w-px bg-white/10 h-4 mx-0.5"></div>
        
        <button 
            onClick={openHistory}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all text-zinc-400 hover:text-orange-400 hover:bg-white/10"
            title={t('history')}
        >
            <History className="w-3.5 h-3.5" />
        </button>

        <div className="w-px bg-white/10 h-4 mx-0.5"></div>
        
        <button 
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="group bg-apricot/10 hover:bg-apricot/20 text-apricot hover:text-vanilla px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all border border-apricot/20 disabled:opacity-50 disabled:grayscale"
        >
            {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3 group-hover:rotate-12 transition-transform"/>} 
            {t('aiAnalysis')}
        </button>

        <button 
            onClick={handleAutoRoute}
            disabled={!hasConnections}
            className="bg-paprika/10 hover:bg-paprika/20 text-paprika hover:text-vanilla px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all border border-paprika/20 disabled:opacity-40 disabled:grayscale"
            title={t('autoRoute')}
        >
            <Route className="w-3 h-3" /> {t('autoRoute')}
        </button>

        <div className="w-px bg-white/10 h-4 mx-0.5"></div>

        <button 
            onClick={handleGroup}
            disabled={selectedCount < 2}
            className="text-zinc-400 hover:text-teal-400 hover:bg-teal-500/10 w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            title={t('group')}
        >
            <Group className="w-3.5 h-3.5" />
        </button>

        <button 
            onClick={handleUngroup}
            disabled={selectedCount === 0}
            className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            title={t('ungroup')}
        >
            <Ungroup className="w-3.5 h-3.5" />
        </button>

        <button 
            onClick={handleSaveBlock}
            disabled={selectedCount === 0}
            className="text-zinc-400 hover:text-apricot hover:bg-apricot/10 w-7 h-7 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-transparent"
            title={t('saveBlock')}
        >
            <PackagePlus className="w-3.5 h-3.5" />
        </button>

        <div className="w-px bg-white/10 h-4 mx-0.5"></div>

        <button 
            onClick={requestClear}
            className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 px-2 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all"
            title={t('clearScene')}
        >
            <Trash2 className="w-3.5 h-3.5" />
        </button>
        
        <button 
            onClick={handleExportImage}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all border border-white/5"
            title={t('exportImage')}
        >
            <Printer className="w-3 h-3" />
            <span className="hidden sm:inline">{t('save')}</span>
        </button>

        <div className="w-px bg-white/10 h-4 mx-0.5"></div>

        <button 
            onClick={openPinout}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all text-zinc-400 hover:text-paprika hover:bg-white/10"
            title={t('pinMap')}
        >
            <TableProperties className="w-3.5 h-3.5" />
        </button>
        
        <button 
            onClick={openShortcuts}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all text-zinc-400 hover:text-white hover:bg-white/10"
            title={t('shortcuts')}
        >
            <HelpCircle className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-2 px-2 border-l border-white/10 ml-0.5 pl-2">
             <div className="flex items-center gap-1" title={t('inputPort')}><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]"></div></div>
             <div className="flex items-center gap-1" title={t('outputPort')}><div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]"></div></div>
             <div className="flex items-center gap-1" title={t('bidirectional')}><div className="w-1.5 h-1.5 rounded-full bg-paprika shadow-[0_0_6px_rgba(207,92,54,0.6)]"></div></div>
        </div>
        
        <div className="w-px bg-white/10 h-4 mx-0.5"></div>
        
        <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all bg-black/40 text-zinc-400 hover:text-apricot hover:bg-black/60"
            title={theme === 'dark' ? t('switchToLight') : t('switchToDark')}
        >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        <div className="w-px bg-white/10 h-4 mx-0.5"></div>

        <EcosystemSwitcher />

        <LanguageSwitcher />
    </div>
  );
};