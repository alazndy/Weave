import React, { useState, useMemo, useLayoutEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
import {
  ProductTemplate,
  ProjectMetadata,
  PaperSize,
  Orientation,
  LibraryMetadata,
} from "../../types";
import {
  Cable,
  Save,
  FolderOpen,
  Download,
  FileUp,
  Plus,
  Trash2,
  Edit2,
  Library,
  BookPlus,
  Settings2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Box,
  Cpu,
  Settings,
  Package,
  Send,
} from "lucide-react";

interface LeftSidebarProps {
  projectMetadata: ProjectMetadata;
  setProjectMetadata: (m: ProjectMetadata) => void;
  templates: ProductTemplate[];
  handleSaveProject: () => void;
  handleLoadProject: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExportLibrary: () => void;
  handleImportLibrary: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setIsEditorOpen: (open: boolean) => void;
  setEditingTemplate: (t: ProductTemplate | null) => void;
  addToCanvas: (id: string) => void;
  handleDeleteTemplate: (id: string) => void;
  projectInputRef: React.RefObject<HTMLInputElement | null>;
  libraryInputRef: React.RefObject<HTMLInputElement | null>;

  // Library Management
  libraries?: LibraryMetadata[];
  activeLibraryId?: string;
  onSwitchLibrary?: (id: string) => void;
  onCreateLibrary?: (name: string) => void;
  onDeleteLibrary?: (id: string) => void;
  onRenameLibrary?: (id: string, name: string) => void;

  // New
  onOpenSettings?: () => void;
  onOpenInventoryImport?: () => void;
  onOpenUPHExport?: () => void;
  onSaveToDrive?: () => void;
  onExportBOM?: () => void;
  onSingleExport?: (template: ProductTemplate) => void;
  onSendToEnv?: (template: ProductTemplate) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  projectMetadata,
  setProjectMetadata,
  templates,
  handleSaveProject,
  handleLoadProject,
  handleExportLibrary,
  handleImportLibrary,
  setIsEditorOpen,
  setEditingTemplate,
  addToCanvas,
  handleDeleteTemplate,
  projectInputRef,
  libraryInputRef,
  libraries = [],
  activeLibraryId,
  onSwitchLibrary,
  onCreateLibrary,
  onDeleteLibrary,
  onRenameLibrary,
  onOpenSettings,
  onOpenInventoryImport,
  onOpenUPHExport,
  onSaveToDrive,
  onExportBOM,
  onSingleExport,
  onSendToEnv,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const [isRenamingLib, setIsRenamingLib] = useState(false);
  const [tempLibName, setTempLibName] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; template: ProductTemplate } | null>(null);

  // Independent open states for sections
  const [openSections, setOpenSections] = useState({
    components: true,
    blocks: true,
  });

  const activeLib = libraries.find((l) => l.id === activeLibraryId);

  const startRename = () => {
    if (activeLib) {
      setTempLibName(activeLib.name);
      setIsRenamingLib(true);
    }
  };

  const saveRename = () => {
    if (activeLib && tempLibName && onRenameLibrary) {
      onRenameLibrary(activeLib.id, tempLibName);
      setIsRenamingLib(false);
    }
  };

  const createNew = () => {
    const name = prompt(t('sidebar.newLibraryName'));
    if (name && onCreateLibrary) onCreateLibrary(name);
  };

  const toggleSection = (section: "components" | "blocks") => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Explicitly filter templates with memoization to ensure freshness
  const { components, blocks } = useMemo(() => {
    return {
      components: templates.filter((t) => !t.isBlock),
      blocks: templates.filter((t) => !!t.isBlock),
    };
  }, [templates]);

  const renderTemplateCard = (template: ProductTemplate) => (
    <div
      key={template.id}
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData("application/weave-template", template.id);
        e.dataTransfer.effectAllowed = "copy";
      }}
      onClick={() => addToCanvas(template.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, template });
      }}
      className="group relative bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-xl p-2.5 cursor-grab active:cursor-grabbing hover:border-paprika/40 hover:bg-white/60 dark:hover:bg-white/10 hover:shadow-lg hover:shadow-paprika/5 transition-all duration-200 active:scale-95 overflow-hidden backdrop-blur-sm"
      title={template.name}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-paprika/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditingTemplate(template);
            setIsEditorOpen(true);
          }}
          className="bg-black/80 text-zinc-300 p-1.5 rounded-lg shadow-lg hover:bg-apricot hover:text-black border border-white/10 backdrop-blur-md"
          title={t('sidebar.edit')}
          aria-label={t('sidebar.edit')}
        >
          <Edit2 size={12} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Silmek istediğinize emin misiniz?")) { 
              handleDeleteTemplate(template.id);
            }
          }}
          className="bg-black/80 text-zinc-300 p-1.5 rounded-lg shadow-lg hover:bg-red-600 hover:text-white border border-white/10 backdrop-blur-md"
          title={t('sidebar.delete')}
          aria-label={t('sidebar.delete')}
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="aspect-square w-full bg-white/10 dark:bg-black/20 rounded-lg mb-3 p-2 flex items-center justify-center overflow-hidden border border-black/5 dark:border-white/5 border-dashed group-hover:border-paprika/20 transition-colors">
        <img
          src={template.imageUrl}
          alt={template.name}
          className="w-full h-full object-contain filter drop-shadow-md"
        />
      </div>
      <p className="text-xs text-center truncate text-zinc-600 dark:text-zinc-300 font-semibold group-hover:text-zinc-900 dark:group-hover:text-white transition-colors px-1">
        {template.name}
      </p>

      {template.isBlock ? (
        <div className="absolute top-2 left-2">
          <span className="text-[9px] font-bold text-apricot bg-black/60 px-1.5 py-0.5 rounded border border-apricot/20 flex items-center gap-1 shadow-sm backdrop-blur-sm">
            <Box size={8} /> {t('sidebar.block')}
          </span>
        </div>
      ) : (
        <div className="absolute top-2 left-2">
          <span className="text-[9px] font-bold text-zinc-500 bg-white/80 dark:bg-black/60 px-1.5 py-0.5 rounded border border-black/5 dark:border-white/5 group-hover:border-paprika/20 group-hover:text-paprika transition-colors shadow-sm backdrop-blur-sm">
            {template.ports.length} P
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`relative h-full transition-all duration-300 ease-in-out flex flex-col z-30 no-print ${
        isOpen
          ? "w-80 glass-panel border-r border-white/20"
          : "w-0 border-none"
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-8 top-6 glass-panel border-l-0 text-zinc-500 dark:text-zinc-400 hover:text-paprika p-1.5 rounded-r-lg shadow-lg cursor-pointer z-50 flex items-center justify-center h-10 w-8 transition-colors"
        title={isOpen ? t('sidebar.hideMenu') : t('sidebar.showMenu')}
      >
        {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      {/* Content Container - Fixed Width to prevent squashing during transition */}
      <div
        className={`w-80 flex flex-col h-full overflow-hidden ${
          !isOpen && "invisible"
        }`}
      >
        {/* Header Section */}
        <div className="p-6 border-b border-zinc-200/50 dark:border-white/5">
          <h1 className="font-bold text-2xl premium-gradient-text flex items-center gap-3 mb-6 tracking-tight">
            <Cable className="w-7 h-7 text-paprika drop-shadow-lg" /> {t('sidebar.appName')}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleSaveProject}
              className="flex-1 bg-white/40 dark:bg-white/5 hover:bg-paprika/10 text-zinc-700 dark:text-alabaster hover:text-paprika py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-2 border border-white/10 transition-all active:scale-95 shadow-sm"
            >
              <Save size={14} /> {t('sidebar.save')}
            </button>
            <button
              onClick={() => projectInputRef.current?.click()}
              className="flex-1 bg-white/40 dark:bg-white/5 hover:bg-apricot/10 text-zinc-700 dark:text-alabaster hover:text-apricot py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-2 border border-white/10 transition-all active:scale-95 shadow-sm"
            >
              <FolderOpen size={14} /> {t('sidebar.open')}
            </button>
            <input
              type="file"
              ref={projectInputRef}
              onChange={handleLoadProject}
              accept=".weave,.json"
              className="hidden"
              aria-label="Proje dosyası seç"
              title="Proje dosyası seç"
            />
          </div>
          <div className="mt-2 space-y-2">
            {onOpenUPHExport && (
                <button
                onClick={onOpenUPHExport}
                className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:text-blue-500 py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-2 border border-blue-500/20 transition-all active:scale-95 shadow-sm"
                >
                <Send size={14} /> {t('sidebar.sendToUPH')}
                </button>
            )}
            {onSaveToDrive && (
                <button
                onClick={onSaveToDrive}
                className="w-full bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 hover:text-green-500 py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-2 border border-green-500/20 transition-all active:scale-95 shadow-sm"
                >
                <Download size={14} /> {t('sidebar.saveToDrive')}
                </button>
            )}
            {onExportBOM && (
                <button
                onClick={onExportBOM}
                className="w-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 hover:text-orange-500 py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-2 border border-orange-500/20 transition-all active:scale-95 shadow-sm"
                >
                <FileUp size={14} /> {t('sidebar.exportBOM')}
                </button>
            )}
          </div>
        </div>

        {/* Library Selector */}
        <div className="p-4 bg-white/5 border-b border-zinc-200/50 dark:border-white/5">
          <div className="flex justify-between items-center mb-2 px-1">
            <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Library size={12} /> {t('sidebar.library')}
            </h2>
            <button
              onClick={createNew}
              className="text-zinc-500 hover:text-vanilla transition-colors"
              title={t('sidebar.newLibrary')}
            >
              <BookPlus size={14} />
            </button>
          </div>

          {isRenamingLib ? (
            <div className="flex gap-2">
              <input
                value={tempLibName}
                onChange={(e) => setTempLibName(e.target.value)}
                className="flex-1 bg-black/40 border border-paprika/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                autoFocus
                placeholder={t('sidebar.libraryName')}
                aria-label={t('sidebar.libraryName')}
              />
              <button
                onClick={saveRename}
                className="text-paprika font-bold text-xs hover:text-apricot"
              >
                OK
              </button>
            </div>
          ) : (
            <div className="flex gap-2 group">
              <div className="relative flex-1">
                <select
                  value={activeLibraryId}
                  onChange={(e) =>
                    onSwitchLibrary && onSwitchLibrary(e.target.value)
                  }
                  className="w-full appearance-none bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm font-semibold text-zinc-800 dark:text-alabaster focus:border-paprika/50 outline-none transition-colors cursor-pointer"
                  title={t('sidebar.selectLibrary')}
                  aria-label={t('sidebar.selectLibrary')}
                >
                  {libraries.map((lib) => (
                    <option key={lib.id} value={lib.id} className="bg-white dark:bg-zinc-900">
                      {lib.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                  <Settings2 size={14} />
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={startRename}
                  className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-white/10 rounded-md"
                  title={t('sidebar.rename')}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() =>
                    activeLib &&
                    onDeleteLibrary &&
                    onDeleteLibrary(activeLib.id)
                  }
                  disabled={libraries.length <= 1}
                  className={`p-2 rounded-md transition ${
                    libraries.length <= 1
                      ? "text-zinc-800 cursor-not-allowed"
                      : "text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                  }`}
                  title={
                    libraries.length <= 1
                      ? t('sidebar.keepOneLibrary')
                      : t('sidebar.deleteLibrary')
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Page Settings */}
        <div className="px-5 py-4 border-b border-zinc-200/50 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
          <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
            {t('sidebar.canvasSettings')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <select
                value={projectMetadata.paperSize}
                onChange={(e) =>
                  setProjectMetadata({
                    ...projectMetadata,
                    paperSize: e.target.value as PaperSize,
                  })
                }
                className="w-full appearance-none bg-white/50 dark:bg-ink border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-zinc-800 dark:text-alabaster focus:border-paprika/50 outline-none hover:bg-white/80 dark:hover:bg-black/40 transition-colors"
                title={t('sidebar.paperSize')}
                aria-label={t('sidebar.paperSize')}
              >
                <option value="A3">A3</option>
                <option value="A4">A4</option>
                <option value="A6">A6</option>
              </select>
            </div>
            <div className="relative">
              <select
                value={projectMetadata.orientation}
                onChange={(e) =>
                  setProjectMetadata({
                    ...projectMetadata,
                    orientation: e.target.value as Orientation,
                  })
                }
                className="w-full appearance-none bg-white/50 dark:bg-ink border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-zinc-800 dark:text-alabaster focus:border-paprika/50 outline-none hover:bg-white/80 dark:hover:bg-black/40 transition-colors"
                title={t('sidebar.orientation')}
                aria-label={t('sidebar.orientation')}
              >
                <option value="landscape">{t('sidebar.landscape')}</option>
                <option value="portrait">{t('sidebar.portrait')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-gradient-to-b from-transparent to-zinc-50 dark:to-black/20">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              {t('sidebar.libraryContent')}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={handleExportLibrary}
                className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-white/10 p-1.5 rounded-md transition"
                title={t('sidebar.download')}
              >
                <Download size={14} />
              </button>
              <button
                onClick={() => libraryInputRef.current?.click()}
                className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-white/10 p-1.5 rounded-md transition"
                title={t('sidebar.upload')}
              >
                <FileUp size={14} />
              </button>
              <input
                type="file"
                ref={libraryInputRef}
                onChange={handleImportLibrary}
                accept=".json"
                className="hidden"
                aria-label="Kütüphane dosyası seç"
                title="Kütüphane dosyası seç"
              />
              <button
                onClick={onOpenInventoryImport}
                className="text-green-600 dark:text-green-500 hover:text-green-500 hover:bg-green-500/10 p-1.5 rounded-md transition"
                title={t('sidebar.addFromInventory')}
              >
                <Package size={16} />
              </button>
              <button
                onClick={() => {
                  setIsEditorOpen(true);
                  setEditingTemplate(null);
                }}
                className="text-paprika hover:text-apricot hover:bg-paprika/10 p-1.5 rounded-md transition ml-1"
                title={t('sidebar.add')}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-600 border border-dashed border-zinc-200 dark:border-white/10 rounded-2xl bg-white/5">
              <BookPlus size={32} className="mb-3 opacity-50" />
              <span className="text-xs font-medium">{t('sidebar.emptyLibrary')}</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Components Section */}
              <div>
                <button
                  onClick={() => toggleSection("components")}
                  className="flex items-center gap-2 w-full text-left text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors mb-3"
                >
                  {openSections.components ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                  <Cpu size={12} className="text-zinc-400" /> {t('sidebar.components')} (
                  {components.length})
                </button>

                {openSections.components && (
                  <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
                    {components.length === 0 ? (
                      <div className="col-span-2 text-center py-4 text-xs text-zinc-600 italic bg-white/5 rounded-lg border border-white/5">
                        {t('sidebar.noComponents')}
                      </div>
                    ) : (
                      components.map((t) => renderTemplateCard(t))
                    )}
                  </div>
                )}
              </div>

              {/* Blocks Section */}
              <div className="pt-2 border-t border-zinc-200 dark:border-white/5">
                <button
                  onClick={() => toggleSection("blocks")}
                  className="flex items-center gap-2 w-full text-left text-[10px] font-bold text-apricot/80 uppercase tracking-widest hover:text-apricot transition-colors mb-3"
                >
                  {openSections.blocks ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                  <Box size={12} className="text-apricot/60" /> {t('sidebar.blocksGroups')} ({blocks.length})
                </button>

                {openSections.blocks && (
                  <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
                    {blocks.length === 0 ? (
                      <div className="col-span-2 text-center py-4 border border-dashed border-zinc-200 dark:border-white/5 rounded-lg text-xs text-zinc-600 bg-black/5 dark:bg-black/20">
                        {t('sidebar.noBlocks')}
                        <br />
                        <span className="text-[9px] opacity-70">
                          {t('sidebar.blockHint')}
                        </span>
                      </div>
                    ) : (
                      blocks.map((t) => renderTemplateCard(t))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-200 dark:border-white/5 bg-zinc-50/80 dark:bg-black/20 p-2 backdrop-blur-sm">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors text-xs font-bold"
          >
            <Settings size={14} /> {t('sidebar.appSettings')}
          </button>
        </div>

        <div className="p-2 bg-zinc-100 dark:bg-black/40 text-[9px] font-medium text-zinc-500 dark:text-zinc-700 text-center">
          {t('sidebar.footer')}
        </div>
      </div>
      
      {/* Context Menu */}
      {contextMenu && (
        <div 
          ref={(node) => {
            if (node) {
              node.style.top = `${contextMenu.y}px`;
              node.style.left = `${contextMenu.x}px`;
            }
          }}
          className="fixed z-[100] glass-panel rounded-xl shadow-2xl py-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-150"
        >
          <button
            className="w-full px-4 py-2 text-left text-sm text-zinc-600 dark:text-zinc-300 hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2"
            onClick={(e) => { e.stopPropagation(); setContextMenu(null); setEditingTemplate(contextMenu.template); setIsEditorOpen(true); }}
          >
            <Edit2 size={14} /> Düzenle
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm text-zinc-600 dark:text-zinc-300 hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2"
            onClick={(e) => { e.stopPropagation(); setContextMenu(null); onSingleExport?.(contextMenu.template); }}
          >
            <Download size={14} /> Tekli Export
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm text-green-600 dark:text-green-400 hover:bg-green-500/10 hover:text-green-500 flex items-center gap-2"
            onClick={(e) => { e.stopPropagation(); setContextMenu(null); onSendToEnv?.(contextMenu.template); }}
          >
            <Send size={14} /> ENV'e Gönder
          </button>
          <div className="border-t border-zinc-200 dark:border-white/10 my-1"></div>
          <button
            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:text-red-500 flex items-center gap-2"
            onClick={(e) => { e.stopPropagation(); setContextMenu(null); if (confirm("Silmek istediğinize emin misiniz?")) handleDeleteTemplate(contextMenu.template.id); }}
          >
            <Trash2 size={14} /> Sil
          </button>
        </div>
      )}
      
      {/* Click outside to close context menu */}
      {contextMenu && (
        <div 
          className="fixed inset-0 z-[99]" 
          onClick={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
