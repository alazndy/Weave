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
  Zone,
  TextNode,
  Comment
} from '../../types';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { ShortcutsModal } from '../modals/ShortcutsModal';
import { PinoutModal } from '../modals/PinoutModal';
import { HistoryModal } from '../modals/HistoryModal';
import { AppSettingsModal } from '../modals/AppSettingsModal';

// Lazy load heavy components
const ProductEditor = React.lazy(() => import('../ProductEditor').then(module => ({ default: module.ProductEditor })));
const ProjectSettingsModal = React.lazy(() => import('../modals/ProjectSettingsModal').then(module => ({ default: module.ProjectSettingsModal })));
const InventoryImportModal = React.lazy(() => import('../modals/InventoryImportModal').then(module => ({ default: module.InventoryImportModal })));
const UPHExportModal = React.lazy(() => import('../modals/UPHExportModal').then(module => ({ default: module.UPHExportModal })));
const SendToEnvModal = React.lazy(() => import('../modals/SendToEnvModal').then(module => ({ default: module.SendToEnvModal })));
const CloudSyncModal = React.lazy(() => import('../modals/CloudSyncModal').then(module => ({ default: module.CloudSyncModal })));

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
  pastStates: any[]; // HistoryState[]
  snapshots: any[]; // HistoryState[]
  onRestoreHistoryState: (state: any) => void;
  onCreateSnapshot: (name: string) => void;

  // Editor State
  isEditorOpen: boolean;
  setIsEditorOpen: (open: boolean) => void;
  editingTemplate: ProductTemplate | null;
  setEditingTemplate: (template: ProductTemplate | null) => void;
  onSaveTemplate: (template: ProductTemplate) => void;
  onExtractParts: (parts: any[]) => void;
  
  // Settings Modals State
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isAppSettingsOpen: boolean;
  setIsAppSettingsOpen: (open: boolean) => void;
  isProjectSettingsOpen: boolean; // Note: usually redundant with isSettingsOpen, checking usage
  setIsProjectSettingsOpen: (open: boolean) => void;

  // Integration Modals State
  isInventoryImportOpen: boolean;
  setIsInventoryImportOpen: (open: boolean) => void;
  isUPHExportOpen: boolean;
  setIsUPHExportOpen: (open: boolean) => void;
  isSendToEnvModalOpen: boolean;
  setIsSendToEnvModalOpen: (open: boolean) => void;
  templateToSend: ProductTemplate | null;
  setTemplateToSend: (t: ProductTemplate | null) => void;
  isCloudSyncOpen: boolean;
  setIsCloudSyncOpen: (open: boolean) => void;

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
  isProjectSettingsOpen,
  setIsProjectSettingsOpen,

  isInventoryImportOpen,
  setIsInventoryImportOpen,
  isUPHExportOpen,
  setIsUPHExportOpen,
  isSendToEnvModalOpen,
  setIsSendToEnvModalOpen,
  templateToSend,
  setTemplateToSend,
  isCloudSyncOpen,
  setIsCloudSyncOpen,

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
          />
        )}

        {/* Project Settings can be triggered by two states currently, consolidating usually better but keeping for safety */}
        {(isSettingsOpen || isProjectSettingsOpen) && (
            <ProjectSettingsModal 
                metadata={projectMetadata}
                onSave={(data) => { performCheckpoint(); setProjectMetadata(data); setIsSettingsOpen(false); setIsProjectSettingsOpen(false); }}
                onRescaleInstances={onRescaleAll || (() => {})}
                onCancel={() => { setIsSettingsOpen(false); setIsProjectSettingsOpen(false); }}
            />
        )}

        {isInventoryImportOpen && (
            <InventoryImportModal
              isOpen={isInventoryImportOpen}
              onClose={() => setIsInventoryImportOpen(false)}
              templates={templates}
              setTemplates={setTemplates}
              onImportComplete={(template) => {
                  if (!template.imageUrl && !template.weaveFileUrl) {
                      setEditingTemplate(template);
                      setIsEditorOpen(true);
                      setIsInventoryImportOpen(false);
                  } else {
                      setIsInventoryImportOpen(false);
                      setTimeout(() => alert(`${template.name} kütüphaneye eklendi.`), 100);
                  }
              }}
            />
        )}

        <UPHExportModal
            isOpen={isUPHExportOpen}
            onClose={() => setIsUPHExportOpen(false)}
            projectData={{
                metadata: projectMetadata,
                pages,
                templates,
                version: "1.0.0"
            }}
            projectName={projectMetadata.projectName || "Sistem Şeması"}
        />

        <SendToEnvModal
            isOpen={isSendToEnvModalOpen}
            onClose={() => {
                setIsSendToEnvModalOpen(false);
                setTemplateToSend(null);
            }}
            template={templateToSend}
            templates={templates}
            setTemplates={setTemplates}
            onLinkComplete={async (template, targetProduct) => {
                const updatedTemplate = {
                    ...template,
                    envInventoryId: targetProduct.id,
                    externalId: targetProduct.externalId || targetProduct.id
                };
                
                setTemplates(prev => prev.map(t => t.id === template.id ? updatedTemplate : t));
                
                try {
                    const { syncTemplateToEnv } = await import('../../hooks/useInventorySync');
                    const result = await syncTemplateToEnv(updatedTemplate);
                    
                    if (result.success) {
                         setTimeout(() => alert(`✅ Başarılı!\n\n"${template.name}" ürünü "${targetProduct.name}" ile eşleştirildi ve ENV-I'a gönderildi.`), 100);
                    } else {
                         setTimeout(() => alert(`❌ Hata!\n\n${result.error}`), 100);
                    }
                } catch (e) {
                    console.error("Link & Send failed", e);
                    setTimeout(() => alert("❌ ENV-I'a gönderilirken bir hata oluştu."), 100);
                }
            }}
        />

        {isCloudSyncOpen && <CloudSyncModal
            isOpen={isCloudSyncOpen}
            onClose={() => setIsCloudSyncOpen(false)}
            projectId="current-project"
            userId="user-1"
            onDownload={() => {}}
        />}

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
