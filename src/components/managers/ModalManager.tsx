import React, { Suspense } from 'react';
import { Loader2, Wand2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { 
  ProjectMetadata, 
  ProductTemplate, 
  Page, 
  AnalysisResult, 
  AppSettings,
  ProductInstance,
  Connection,
  ExternalPart,
  HistoryState,
  HistorySnapshot
} from '../../types';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { ShortcutsModal } from '../modals/ShortcutsModal';
import { PinoutModal } from '../modals/PinoutModal';
import { HistoryModal } from '../modals/HistoryModal';
import { AppSettingsModal } from '../modals/AppSettingsModal';

// Lazy load heavy components
const ProductEditor = React.lazy(() => import('../ProductEditor').then(module => ({ default: module.ProductEditor })));
const ProjectSettingsModal = React.lazy(() => import('../modals/ProjectSettingsModal').then(module => ({ default: module.ProjectSettingsModal })));

interface ModalManagerProps {
  // Application State
  projectMetadata: ProjectMetadata;
  setProjectMetadata: (data: ProjectMetadata) => void;
  appSettings: AppSettings;
  setAppSettings: (settings: AppSettings) => void;
  templates: ProductTemplate[];
  setTemplates: React.Dispatch<React.SetStateAction<ProductTemplate[]>>;
  pages: Page[];
  activePageId: string;
  
  // History
  pastStates: HistoryState[];
  snapshots: HistorySnapshot[];
  onRestoreHistoryState: (state: HistoryState) => void;
  onCreateSnapshot: (name: string) => void;

  // Editor State
  isEditorOpen: boolean;
  setIsEditorOpen: (open: boolean) => void;
  editingTemplate: ProductTemplate | null;
  setEditingTemplate: (template: ProductTemplate | null) => void;
  onSaveTemplate: (template: ProductTemplate) => void;
  onExtractParts: (parts: ExternalPart[]) => void;
  
  // Settings Modals State
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isAppSettingsOpen: boolean;
  setIsAppSettingsOpen: (open: boolean) => void;

  // Utility Modals State
  isClearModalOpen: boolean;
  setIsClearModalOpen: (open: boolean) => void;
  onClearConfirm: () => void;
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (open: boolean) => void;
  isPinoutOpen: boolean;
  setIsPinoutOpen: (open: boolean) => void;
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  
  // Analysis State
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (result: AnalysisResult | null) => void;

  // Connection/Instance Data needed for some modals
  connections: Connection[];
  instances: ProductInstance[];
  
  // Handlers
  onRescaleAll?: (newPixelScale: number) => void;
  performCheckpoint: () => void;
}

export const ModalManager: React.FC<ModalManagerProps> = ({
  projectMetadata,
  setProjectMetadata,
  appSettings,
  setAppSettings,
  templates,
  setTemplates,
  pages,
  activePageId,
  
  pastStates,
  snapshots,
  onRestoreHistoryState,
  onCreateSnapshot,

  isEditorOpen,
  setIsEditorOpen,
  editingTemplate,
  setEditingTemplate,
  onSaveTemplate,
  onExtractParts,
  
  isSettingsOpen,
  setIsSettingsOpen,
  isAppSettingsOpen,
  setIsAppSettingsOpen,

  isClearModalOpen,
  setIsClearModalOpen,
  onClearConfirm,
  isShortcutsOpen,
  setIsShortcutsOpen,
  isPinoutOpen,
  setIsPinoutOpen,
  isHistoryOpen,
  setIsHistoryOpen,

  analysisResult,
  setAnalysisResult,

  connections,
  instances,
  onRescaleAll,
  performCheckpoint
}) => {
  const activePage = pages.find(p => p.id === activePageId);

  return (
    <>
      <Suspense fallback={
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200]">
          <div className="bg-ink border border-zinc-700 p-8 rounded-xl flex flex-col items-center gap-4 shadow-2xl">
             <Loader2 className="w-8 h-8 text-paprika animate-spin" />
             <span className="text-vanilla font-medium">Yükleniyor...</span>
          </div>
        </div>
      }>
        {isEditorOpen && (
          <ProductEditor 
              initialTemplate={editingTemplate}
              onSave={onSaveTemplate}
              onExtractParts={onExtractParts}
              onCancel={() => { setIsEditorOpen(false); setEditingTemplate(null); }}
              pixelScale={projectMetadata.pixelScale}
              geminiApiKey={appSettings.geminiApiKey}
          />
        )}

        {isSettingsOpen && (
            <ProjectSettingsModal 
                metadata={projectMetadata}
                onSave={(data) => { performCheckpoint(); setProjectMetadata(data); setIsSettingsOpen(false); }}
                onRescaleInstances={onRescaleAll || (() => {})}
                onCancel={() => { setIsSettingsOpen(false); }}
            />
        )}

      </Suspense>

      <AppSettingsModal 
          isOpen={isAppSettingsOpen}
          onClose={() => setIsAppSettingsOpen(false)}
          settings={appSettings}
          onUpdateSettings={setAppSettings}
      />

      <ConfirmationModal 
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={onClearConfirm}
        title="Sayfayı Temizle"
        message="Bu sayfadaki tüm cihazlar ve bağlantılar silinecek. Diğer sayfalar etkilenmez."
      />
      
      <ShortcutsModal 
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
      
      <PinoutModal 
         isOpen={isPinoutOpen}
         onClose={() => setIsPinoutOpen(false)}
         connections={connections}
         instances={instances}
         templates={templates}
      />

      <HistoryModal 
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          pastStates={pastStates}
          snapshots={snapshots}
          currentState={{ pages, activePageId, templates }}
          onRestoreState={onRestoreHistoryState}
          onCreateSnapshot={onCreateSnapshot}
      />

      {analysisResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] no-print p-4">
            <div className="bg-ink/90 border border-alabaster/10 p-6 rounded-2xl w-full max-w-2xl shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold text-paprika mb-6 flex items-center gap-2">
                    <Wand2 className="w-6 h-6"/> AI Analiz Raporu ({activePage?.name})
                </h3>
                <div className="space-y-6 mb-8">
                    <div className="bg-black/40 p-5 rounded-xl border border-white/5">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Sistem Özeti</h4>
                        <p className="text-alabaster text-sm leading-relaxed">{analysisResult.summary}</p>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Tespitler & Uyarılar</h4>
                        {analysisResult.warnings.length > 0 ? (
                            <ul className="space-y-2">
                                {analysisResult.warnings.map((w, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-vanilla bg-paprika/20 p-3 rounded-lg border border-paprika/20">
                                        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-paprika"/>
                                        <span>{w}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex items-center gap-3 text-apricot bg-apricot/20 p-4 rounded-xl border border-apricot/20">
                                <CheckCircle2 size={24} />
                                <span className="text-sm font-bold">Harika! Herhangi bir bağlantı sorunu tespit edilmedi.</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end">
                    <button onClick={() => setAnalysisResult(null)} className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold text-sm transition-colors border border-white/10">Kapat</button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};
