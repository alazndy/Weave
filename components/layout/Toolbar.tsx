
import React from 'react';
import { Undo2, Redo2, Loader2, Wand2, Route, Trash2, Printer, Sun, Moon, HelpCircle, TableProperties, History, Group, Ungroup, PackagePlus, Cloud } from 'lucide-react';
import { EcosystemSwitcher } from './EcosystemSwitcher';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { PremiumButton } from '../ui/PremiumButton';

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
  openCloudSync?: () => void;
  selectedCount?: number;
  handleGroup?: () => void;
  handleUngroup?: () => void;
  handleSaveBlock?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = (props) => {
  const {
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
  } = props;
  const { t } = useTranslation();

  return (
    <div className="glass-panel p-2 rounded-2xl flex gap-2 items-center no-print transition-all">
        <div className="flex gap-1">
            <PremiumButton 
                onClick={handleUndo}
                disabled={!canUndo}
                variant="ghost" 
                size="icon"
                title={t('undo')}
                className="text-zinc-600 dark:text-zinc-300"
            >
                <Undo2 className="w-4 h-4" />
            </PremiumButton>
            <PremiumButton 
                onClick={handleRedo}
                disabled={!canRedo}
                variant="ghost" 
                size="icon"
                title={t('redo')}
                className="text-zinc-600 dark:text-zinc-300"
            >
                <Redo2 className="w-4 h-4" />
            </PremiumButton>
        </div>
        
        <div className="w-px bg-zinc-300 dark:bg-zinc-700 h-6 mx-1 opacity-50"></div>
        
        <PremiumButton 
            onClick={openHistory}
            variant="ghost"
            size="icon"
            title={t('history')}
            className="text-zinc-600 dark:text-zinc-300 hover:text-orange-500"
        >
            <History className="w-4 h-4" />
        </PremiumButton>

        <div className="w-px bg-zinc-300 dark:bg-zinc-700 h-6 mx-1 opacity-50"></div>
        
        <PremiumButton 
            onClick={runAnalysis}
            disabled={isAnalyzing}
            isLoading={isAnalyzing}
            variant="premium"
            size="sm"
            className="text-xs font-bold gap-2 from-orange-400 to-amber-500 hover:shadow-orange-500/25"
        >
            {!isAnalyzing && <Wand2 className="w-3.5 h-3.5" />}
            {t('aiAnalysis')}
        </PremiumButton>

        <PremiumButton 
            onClick={handleAutoRoute}
            disabled={!hasConnections}
            variant="default"
            size="sm"
            className="text-xs font-bold gap-2 bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-700 dark:hover:bg-zinc-600 text-white"
            title={t('autoRoute')}
        >
            <Route className="w-3.5 h-3.5" /> {t('autoRoute')}
        </PremiumButton>

        <div className="w-px bg-zinc-300 dark:bg-zinc-700 h-6 mx-1 opacity-50"></div>

        <PremiumButton 
            onClick={handleGroup}
            disabled={selectedCount < 2}
            variant="ghost"
            size="icon"
            title={t('group')}
            className="text-zinc-600 dark:text-zinc-300 hover:text-teal-400"
        >
            <Group className="w-4 h-4" />
        </PremiumButton>

        <PremiumButton 
            onClick={handleUngroup}
            disabled={selectedCount === 0}
            variant="ghost"
            size="icon"
            title={t('ungroup')}
            className="text-zinc-600 dark:text-zinc-300 hover:text-red-400"
        >
            <Ungroup className="w-4 h-4" />
        </PremiumButton>

        <PremiumButton 
            onClick={handleSaveBlock}
            disabled={selectedCount === 0}
            variant="ghost"
            size="icon"
            title={t('saveBlock')}
            className="text-zinc-600 dark:text-zinc-300 hover:text-amber-400"
        >
            <PackagePlus className="w-4 h-4" />
        </PremiumButton>

        <div className="w-px bg-zinc-300 dark:bg-zinc-700 h-6 mx-1 opacity-50"></div>

        <PremiumButton 
            onClick={requestClear}
            variant="ghost"
            size="icon"
            title={t('clearScene')}
            className="text-zinc-600 dark:text-zinc-300 hover:text-red-500 hover:bg-red-500/10"
        >
            <Trash2 className="w-4 h-4" />
        </PremiumButton>
        
        <PremiumButton 
            onClick={handleExportImage}
            variant="outline"
            size="sm"
            title={t('exportImage')}
            className="text-xs font-bold gap-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200"
        >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('save')}</span>
        </PremiumButton>

        <div className="w-px bg-zinc-300 dark:bg-zinc-700 h-6 mx-1 opacity-50"></div>

        <PremiumButton 
            onClick={openPinout}
            variant="ghost"
            size="icon"
            title={t('pinMap')}
            className="text-zinc-600 dark:text-zinc-300 hover:text-paprika"
        >
            <TableProperties className="w-4 h-4" />
        </PremiumButton>
        
        <PremiumButton 
            onClick={openShortcuts}
            variant="ghost"
            size="icon"
            title={t('shortcuts')}
            className="text-zinc-600 dark:text-zinc-300 hover:text-white"
        >
            <HelpCircle className="w-4 h-4" />
        </PremiumButton>

        <PremiumButton 
            onClick={props.openCloudSync}
            variant="ghost"
            size="icon"
            title={t('cloudSync')}
            className="text-zinc-600 dark:text-zinc-300 hover:text-blue-400"
        >
            <Cloud className="w-4 h-4" />
        </PremiumButton>

        <div className="flex items-center gap-2 px-2 border-l border-zinc-300 dark:border-zinc-700 h-6 ml-1 opacity-50">
             <div className="flex items-center gap-1" title={t('inputPort')}><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] ring-1 ring-blue-400/50"></div></div>
             <div className="flex items-center gap-1" title={t('outputPort')}><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] ring-1 ring-red-400/50"></div></div>
             <div className="flex items-center gap-1" title={t('bidirectional')}><div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)] ring-1 ring-orange-400/50"></div></div>
        </div>
        
        <div className="w-px bg-zinc-300 dark:bg-zinc-700 h-6 mx-1 opacity-50"></div>
        
        <PremiumButton 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            variant="ghost"
            size="icon"
            className="text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-black/20"
        >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </PremiumButton>

        <div className="w-px bg-zinc-300 dark:bg-zinc-700 h-6 mx-1 opacity-50"></div>

        <EcosystemSwitcher />

        <LanguageSwitcher />
    </div>
  );
};
