import React from 'react';
import { 
  Undo2, Redo2, Sparkles, Route, Trash2, Printer, 
  Moon, Sun, HelpCircle, TableProperties, History, 
  Group, Ungroup, PackagePlus, Cloud, Keyboard 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { EcosystemSwitcher } from './EcosystemSwitcher';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

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
    handleUndo, handleRedo, canUndo, canRedo,
    isAnalyzing, runAnalysis,
    handleAutoRoute, hasConnections,
    requestClear, handleExportImage,
    theme, setTheme,
    openShortcuts, openPinout, openHistory, openCloudSync,
    selectedCount = 0, handleGroup, handleUngroup, handleSaveBlock
  } = props;
  const { t } = useTranslation();

  const ToolbarBtn = ({ onClick, disabled, icon: Icon, label, className, variant = "ghost", size="icon" }: any) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button
                variant={variant}
                size={size}
                onClick={onClick}
                disabled={disabled}
                className={cn(
                    "transition-all duration-200", 
                    className,
                    variant === 'ghost' && "hover:bg-accent hover:text-accent-foreground"
                )}
            >
                {Icon && <Icon className="w-4 h-4" />}
                {/* Support for children/text inside button if needed, but simplified here for icons */}
            </Button>
        </TooltipTrigger>
        <TooltipContent>
            <p>{label}</p>
        </TooltipContent>
    </Tooltip>
  );

  return (
    <div className="glass-panel p-2 rounded-2xl flex gap-1 items-center no-print transition-all border shadow-sm">
        <div className="flex gap-1">
            <ToolbarBtn onClick={handleUndo} disabled={!canUndo} icon={Undo2} label={t('undo')} />
            <ToolbarBtn onClick={handleRedo} disabled={!canRedo} icon={Redo2} label={t('redo')} />
        </div>
        
        <Separator orientation="vertical" className="h-6 mx-1 bg-border/50" />
        
        {openHistory && (
             <ToolbarBtn onClick={openHistory} icon={History} label={t('history')} className="hover:text-orange-500" />
        )}

        <Separator orientation="vertical" className="h-6 mx-1 bg-border/50" />
        
        <Tooltip>
            <TooltipTrigger asChild>
                <Button 
                    onClick={runAnalysis}
                    disabled={isAnalyzing}
                    variant="default" // Using default for primary action look
                    size="sm"
                    className={cn(
                        "text-xs font-bold gap-2 bg-gradient-to-r from-orange-400 to-amber-500 hover:shadow-orange-500/25 text-white border-0",
                        isAnalyzing && "animate-pulse"
                    )}
                >
                    {!isAnalyzing && <Sparkles className="w-3.5 h-3.5 mr-1" />}
                    {t('aiAnalysis')}
                </Button>
            </TooltipTrigger>
            <TooltipContent><p>{t('aiAnalysis')}</p></TooltipContent>
        </Tooltip>

        <Tooltip>
            <TooltipTrigger asChild>
                <Button 
                    onClick={handleAutoRoute}
                    disabled={!hasConnections}
                    variant="secondary"
                    size="sm"
                    className="text-xs font-bold gap-2"
                >
                    <Route className="w-3.5 h-3.5 mr-1" /> {t('autoRoute')}
                </Button>
            </TooltipTrigger>
             <TooltipContent><p>{t('autoRoute')}</p></TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1 bg-border/50" />

        <ToolbarBtn 
            onClick={handleGroup} 
            disabled={selectedCount < 2} 
            icon={Group} 
            label={t('group')} 
            className="hover:text-teal-400"
        />
        <ToolbarBtn 
            onClick={handleUngroup} 
            disabled={selectedCount === 0} 
            icon={Ungroup} 
            label={t('ungroup')} 
            className="hover:text-red-400"
        />
        <ToolbarBtn 
            onClick={handleSaveBlock} 
            disabled={selectedCount === 0} 
            icon={PackagePlus} 
            label={t('saveBlock')} 
            className="hover:text-amber-400"
        />

        <Separator orientation="vertical" className="h-6 mx-1 bg-border/50" />

        <ToolbarBtn 
            onClick={requestClear} 
            icon={Trash2} 
            label={t('clearScene')} 
            className="hover:text-red-500 hover:bg-red-500/10"
        />
        
        <Tooltip>
             <TooltipTrigger asChild>
                <Button 
                    onClick={handleExportImage}
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold gap-2"
                >
                    <Printer className="w-3.5 h-3.5 mr-1" />
                    <span className="hidden sm:inline">{t('save')}</span>
                </Button>
             </TooltipTrigger>
             <TooltipContent><p>{t('exportImage')}</p></TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-6 mx-1 bg-border/50" />

        {openPinout && (
             <ToolbarBtn onClick={openPinout} icon={TableProperties} label={t('pinMap')} className="hover:text-paprika" />
        )}
        <ToolbarBtn onClick={openShortcuts} icon={HelpCircle} label={t('shortcuts')} />
        {openCloudSync && (
             <ToolbarBtn onClick={openCloudSync} icon={Cloud} label={t('cloudSync')} className="hover:text-blue-400" />
        )}

        <div className="flex items-center gap-2 px-2 border-l border-border h-6 ml-1 opacity-50">
             <div className="flex items-center gap-1" title={t('inputPort')}><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] ring-1 ring-blue-400/50"></div></div>
             <div className="flex items-center gap-1" title={t('outputPort')}><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] ring-1 ring-red-400/50"></div></div>
             <div className="flex items-center gap-1" title={t('bidirectional')}><div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)] ring-1 ring-orange-400/50"></div></div>
        </div>
        
        <Separator orientation="vertical" className="h-6 mx-1 bg-border/50" />
        
        <ToolbarBtn 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            icon={theme === 'dark' ? Sun : Moon}
            label={theme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}
        />

        <Separator orientation="vertical" className="h-6 mx-1 bg-border/50" />

        <EcosystemSwitcher />
        <LanguageSwitcher />
    </div>
  );
};
