
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ProductInstance, 
  Connection, 
  AnalysisResult, 
  ProjectMetadata, 
  Zone, 
  TextNode, 
  ProductTemplate, 
  Comment,
  PaperSize,
  HistoryState, 
  Page, 
  AppSettings 
} from './types';
import { Canvas } from './components/Canvas';
import { analyzeSchematic } from './services/geminiService';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { RightSidebar } from './components/layout/RightSidebar';
import { Toolbar } from './components/layout/Toolbar';
import { PageBar } from './components/layout/PageBar';
import { PageGrid } from './components/canvas/PageGrid';
import { PALETTES } from './components/modals/AppSettingsModal';
import { ModalManager } from './components/managers/ModalManager';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WelcomeScreen } from './components/WelcomeScreen';
import { getPortPosition, getPortNormal, findSmartPath, getInstanceRect } from './utils/canvasHelpers';
import { useLibraryManager } from './hooks/useLibraryManager';
import { useHistory } from './hooks/useHistory';
import { useAppShortcuts } from './hooks/useAppShortcuts';
import { ActiveTool } from './components/canvas/CanvasToolbar';
import { exportBOM } from './utils/bom-exporter';
import { saveProject, loadProject, type RecentProject } from './services/projectStore';
import i18n from './i18n';
import html2canvas from 'html2canvas-pro';

// Lazy load keys just in case but ModalManager handles them mostly

const generateDocNo = (projectName: string = 'Weave Project', revision: string = 'R01') => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const acronym = projectName.trim().split(/\s+/).map(word => word[0]).join('').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6) || 'WP';
  const cleanRev = revision.replace(/[^a-zA-Z0-9]/g, '');
  return `${acronym}-${date}-${cleanRev}`;
};

const INITIAL_METADATA: ProjectMetadata = {
  projectName: 'Yeni Sistem Şeması',
  companyName: 'Şirket Adı',
  companyLogo: null,
  customerName: '',
  preparedBy: '',
  approvedBy: '',
  documentNo: generateDocNo('Yeni Sistem Şeması', 'R.01'),
  scale: '1:1',
  pixelScale: 10,
  paperSize: 'A4',
  orientation: 'landscape',
  revision: 'R.01',
  date: new Date().toLocaleDateString('tr-TR'),
  technicalNotes: '1. Tüm bağlantılar belirtilen tork değerinde sıkılmalıdır.\n2. Kablolama sırasında renk kodlarına dikkat ediniz.\n3. Montaj işlemi kalifiye personel tarafından yapılmalıdır.',
  customFields: [],
  externalParts: []
};

const createNewPage = (order: number): Page => ({
    id: crypto.randomUUID(),
    name: `Sayfa ${order}`,
    instances: [],
    connections: [],
    zones: [],
    textNodes: [],
    comments: [],
    order
});

const DEFAULT_SETTINGS: AppSettings = {
    theme: 'dark',
    language: 'tr',
    palette: 'weave',
    geminiApiKey: ''
};

const SETTINGS_KEY = 'weave_app_settings';
const AUTOSAVE_DELAY_MS = 1500;

const loadSettings = (): AppSettings => {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (!saved) return DEFAULT_SETTINGS;
        const { theme, language, palette, geminiApiKey } = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        return { theme, language, palette, geminiApiKey };
    } catch {
        return DEFAULT_SETTINGS;
    }
};

const PAPER_DIMENSIONS: Record<PaperSize, { w: number, h: number }> = {
  'A3': { w: 420, h: 297 },
  'A4': { w: 297, h: 210 },
  'A6': { w: 148, h: 105 },
};

export default function App() {
  // --- CUSTOM HOOKS ---
  const { 
    libraries, 
    activeLibraryId, 
    templates, 
    setTemplates, 
    handleCreateLibrary, 
    handleDeleteLibrary, 
    handleRenameLibrary, 
    handleSwitchLibrary,
    libraryError
  } = useLibraryManager();

  const {
      saveCheckpoint: saveHistoryCheckpoint,
      undo, redo, canUndo, canRedo,
      createSnapshot, clearHistory,
      pastStates, snapshots
  } = useHistory();

  // --- STATE ---
  const [pages, setPages] = useState<Page[]>(() => [createNewPage(1)]);
  const [activePageId, setActivePageId] = useState<string>(() => pages[0].id);
  const [projectId, setProjectId] = useState<string>(() => crypto.randomUUID());
  const [isGridView, setIsGridView] = useState(false); 
  const [activeTool, setActiveTool] = useState<ActiveTool>('cursor'); 

  const [projectMetadata, setProjectMetadata] = useState<ProjectMetadata>(INITIAL_METADATA);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [clipboardInstance, setClipboardInstance] = useState<ProductInstance | null>(null);
  
  // App Settings
  const [appSettings, setAppSettings] = useState<AppSettings>(loadSettings);

  const [editingPortInfo, setEditingPortInfo] = useState<{templateId: string, portId: string} | null>(null);
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProductTemplate | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAppSettingsOpen, setIsAppSettingsOpen] = useState(false);
  
  // Theme Toggle Effect
  useEffect(() => {
    if (appSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [appSettings.theme]);

  const [showWelcome, setShowWelcome] = useState(true);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isPinoutOpen, setIsPinoutOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  

  
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  // Apply App Settings (Theme & Palette)
  useEffect(() => {
      // 1. Save to local storage
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings)); } catch { /* storage unavailable */ }
      if (i18n.language !== appSettings.language) i18n.changeLanguage(appSettings.language);

      // 2. Apply Theme Class
      /* Note: We handle theme prop explicitly in components, but for global bg/text
         we can rely on the palette CSS variables and manual class switching if needed.
         Since 'ink' color changes based on palette, the background changes automatically.
      */

      // 3. Apply Color Palette Variables
      const root = document.documentElement;
      const palette = PALETTES.find(p => p.id === appSettings.palette) || PALETTES[0];
      
      root.style.setProperty('--color-ink', palette.colors.ink);
      root.style.setProperty('--color-paprika', palette.colors.paprika);
      root.style.setProperty('--color-apricot', palette.colors.apricot);
      root.style.setProperty('--color-vanilla', palette.colors.vanilla);
      root.style.setProperty('--color-alabaster', palette.colors.alabaster);

  }, [appSettings]);

  // Keep settings in sync when the toolbar language switcher changes i18n directly.
  useEffect(() => {
      const onChange = (lng: string) => {
          const lang = lng.startsWith('en') ? 'en' : 'tr';
          setAppSettings(prev => prev.language === lang ? prev : { ...prev, language: lang });
      };
      i18n.on('languageChanged', onChange);
      return () => i18n.off('languageChanged', onChange);
  }, []);

  // --- DERIVED STATE (Shortcuts to active page data) ---
  const activePage = pages.find(p => p.id === activePageId) || pages[0];
  const instances = activePage.instances;
  const connections = activePage.connections;
  const zones = activePage.zones;
  const textNodes = activePage.textNodes;
  const comments = activePage.comments;

  const selectedInstanceId = selectedIds.size === 1 ? Array.from(selectedIds)[0] : null;

  // --- ACTIONS HELPERS ---
  const updateActivePage = useCallback((updates: Partial<Page>) => {
      setPages(prev => prev.map(p => p.id === activePageId ? { ...p, ...updates } : p));
  }, [activePageId]);

  // Wrapped Setters for Child Components (Canvas etc) that expect direct setters
  const setInstances = (val: ProductInstance[] | ((prev: ProductInstance[]) => ProductInstance[])) => {
      const newInstances = typeof val === 'function' ? val(instances) : val;
      updateActivePage({ instances: newInstances });
  };
  const setConnections = (val: Connection[] | ((prev: Connection[]) => Connection[])) => {
      const newConnections = typeof val === 'function' ? val(connections) : val;
      updateActivePage({ connections: newConnections });
  };
  const setZones = (val: Zone[] | ((prev: Zone[]) => Zone[])) => {
      const newZones = typeof val === 'function' ? val(zones) : val;
      updateActivePage({ zones: newZones });
  };
  const setTextNodes = (val: TextNode[] | ((prev: TextNode[]) => TextNode[])) => {
      const newTextNodes = typeof val === 'function' ? val(textNodes) : val;
      updateActivePage({ textNodes: newTextNodes });
  };
  const setComments = (val: Comment[] | ((prev: Comment[]) => Comment[])) => {
      const newComments = typeof val === 'function' ? val(comments) : val;
      updateActivePage({ comments: newComments });
  };


  const performCheckpoint = useCallback(() => {
    saveHistoryCheckpoint({
      pages, activePageId, templates, metadata: projectMetadata
    });
  }, [saveHistoryCheckpoint, pages, activePageId, templates, projectMetadata]);

  const handleUndo = useCallback(() => {
    const currentState = { pages, activePageId, templates, metadata: projectMetadata };
    const restoredState = undo(currentState);
    if (restoredState) {
        setPages(restoredState.pages);
        setActivePageId(restoredState.activePageId);
        setTemplates(restoredState.templates);
        if (restoredState.metadata) setProjectMetadata(restoredState.metadata);
    }
  }, [undo, pages, activePageId, templates, projectMetadata, setTemplates]);

  const handleRedo = useCallback(() => {
    const currentState = { pages, activePageId, templates, metadata: projectMetadata };
    const restoredState = redo(currentState);
    if (restoredState) {
        setPages(restoredState.pages);
        setActivePageId(restoredState.activePageId);
        setTemplates(restoredState.templates);
        if (restoredState.metadata) setProjectMetadata(restoredState.metadata);
    }
  }, [redo, pages, activePageId, templates, projectMetadata, setTemplates]);

  const handleRestoreHistoryState = (state: HistoryState) => {
      performCheckpoint();
      setPages(state.pages);
      setActivePageId(state.activePageId);
      setTemplates(state.templates);
      if (state.metadata) setProjectMetadata(state.metadata);
  };

  const handleCreateSnapshot = (name: string) => {
      const currentState = { pages, activePageId, templates, metadata: projectMetadata };
      createSnapshot(name, currentState);
  };

  // --- AUTOSAVE (IndexedDB) ---
  // Skipped until the user leaves the welcome screen so an untouched blank
  // project never shows up in the recent list.
  const [autosaveError, setAutosaveError] = useState(false);
  useEffect(() => {
      if (showWelcome) return;
      const timer = setTimeout(() => {
          saveProject(projectId, { version: '2.0', metadata: projectMetadata, templates, pages, activePageId })
              .then(() => setAutosaveError(false))
              .catch(err => { console.error('Autosave failed', err); setAutosaveError(true); });
      }, AUTOSAVE_DELAY_MS);
      return () => clearTimeout(timer);
  }, [showWelcome, projectId, projectMetadata, templates, pages, activePageId]);

  const handleSelectIds = (ids: string[], multi: boolean) => {
      if (multi) {
          setSelectedIds(prev => {
              const next = new Set(prev);
              ids.forEach(id => next.has(id) ? next.delete(id) : next.add(id));
              return next;
          });
      } else {
          setSelectedIds(new Set(ids));
      }
  };

  const handleUpdateItem = (type: 'instance' | 'connection' | 'zone' | 'text' | 'comment', id: string, updates: Partial<any>) => {
      performCheckpoint();
      if (type === 'instance') {
          setInstances(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      } else if (type === 'connection') {
          setConnections(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      } else if (type === 'zone') {
          setZones(prev => prev.map(z => z.id === id ? { ...z, ...updates } : z));
      } else if (type === 'text') {
          setTextNodes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      } else if (type === 'comment') {
          setComments(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      }
  };

  const handleGroupSelected = () => {
      if (selectedIds.size < 2) return;
      performCheckpoint();
      const newGroupId = crypto.randomUUID();
      
      setInstances(prev => prev.map(i => selectedIds.has(i.id) ? { ...i, groupId: newGroupId } : i));
      setZones(prev => prev.map(z => selectedIds.has(z.id) ? { ...z, groupId: newGroupId } : z));
      setTextNodes(prev => prev.map(t => selectedIds.has(t.id) ? { ...t, groupId: newGroupId } : t));
      setComments(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, groupId: newGroupId } : c));
  };

  const handleUngroupSelected = () => {
      performCheckpoint();
      setInstances(prev => prev.map(i => selectedIds.has(i.id) ? { ...i, groupId: undefined } : i));
      setZones(prev => prev.map(z => selectedIds.has(z.id) ? { ...z, groupId: undefined } : z));
      setTextNodes(prev => prev.map(t => selectedIds.has(t.id) ? { ...t, groupId: undefined } : t));
      setComments(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, groupId: undefined } : c));
  };

  const handleSaveBlockAsTemplate = async () => {
      if (selectedIds.size === 0) return;
      
      // 1. Calculate Bounding Box of Selection
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      instances.forEach(i => { if(selectedIds.has(i.id)) { 
          const t = templates.find(temp => temp.id === i.templateId);
          const w = i.width || t?.width || 100;
          const h = i.height || t?.height || 100;
          minX = Math.min(minX, i.x); minY = Math.min(minY, i.y);
          maxX = Math.max(maxX, i.x + w); maxY = Math.max(maxY, i.y + h);
      }});
      
      textNodes.forEach(t => { if(selectedIds.has(t.id)) {
          const w = t.content.length * (t.fontSize / 1.5);
          const h = t.fontSize;
          minX = Math.min(minX, t.x); minY = Math.min(minY, t.y);
          maxX = Math.max(maxX, t.x + w); maxY = Math.max(maxY, t.y + h);
      }});

      zones.forEach(z => { if(selectedIds.has(z.id)) {
          minX = Math.min(minX, z.x); minY = Math.min(minY, z.y);
          maxX = Math.max(maxX, z.x + z.width); maxY = Math.max(maxY, z.y + z.height);
      }});

      // Include connections in bounds
      connections.forEach(conn => {
          if (selectedIds.has(conn.fromInstanceId) && selectedIds.has(conn.toInstanceId)) {
              const fromInst = instances.find(i => i.id === conn.fromInstanceId);
              const toInst = instances.find(i => i.id === conn.toInstanceId);
              const fromTemp = templates.find(t => t.id === fromInst?.templateId);
              const toTemp = templates.find(t => t.id === toInst?.templateId);

              if (fromInst && toInst && fromTemp && toTemp) {
                  const p1 = getPortPosition(fromInst, fromTemp, conn.fromPortId);
                  const p2 = getPortPosition(toInst, toTemp, conn.toPortId);

                  minX = Math.min(minX, p1.x, p2.x);
                  minY = Math.min(minY, p1.y, p2.y);
                  maxX = Math.max(maxX, p1.x, p2.x);
                  maxY = Math.max(maxY, p1.y, p2.y);

                  if (conn.controlPoints) {
                      conn.controlPoints.forEach(cp => {
                          minX = Math.min(minX, cp.x);
                          minY = Math.min(minY, cp.y);
                          maxX = Math.max(maxX, cp.x);
                          maxY = Math.max(maxY, cp.y);
                      });
                  }
              }
          }
      });
      
      if (minX === Infinity) return;
      
      // Add padding
      const padding = 20;
      minX -= padding; minY -= padding; maxX += padding; maxY += padding;
      const width = maxX - minX;
      const height = maxY - minY;

      // 2. Capture Canvas
      const element = document.getElementById('canvas-export-area');
      if (!element) {
          alert("Canvas alanı bulunamadı.");
          return;
      }

      try {
          const canvas = await html2canvas(element as HTMLElement, {
              x: minX,
              y: minY, 
              width: width, 
              height: height,
              scale: 2, 
              backgroundColor: null, 
              useCORS: true,
              ignoreElements: (el: Element) => el.classList.contains('no-print')
          });
          
          const imageUrl = canvas.toDataURL('image/png');
          const name = prompt("Yeni Blok Şablonu Adı:", "Yeni Blok");
          if (!name) return;

          const newTemplate: ProductTemplate = {
              id: crypto.randomUUID(),
              name: name,
              imageUrl: imageUrl,
              width: width,
              height: height,
              physicalWidth: width / projectMetadata.pixelScale,
              ports: [], 
              isBlock: true 
          };
          
          setTemplates(prev => [...prev, newTemplate]);
          alert("Blok kütüphaneye eklendi.");

      } catch (e) {
          console.error("Block save failed", e);
          alert("Hata oluştu.");
      }
  };

  const handleAutoRoute = () => {
      performCheckpoint();
      const obstacles = instances.map(inst => getInstanceRect(inst, templates));

      const newConnections = connections.map(conn => {
          const fromInst = instances.find(i => i.id === conn.fromInstanceId);
          const toInst = instances.find(i => i.id === conn.toInstanceId);
          const fromTemp = templates.find(t => t.id === fromInst?.templateId);
          const toTemp = templates.find(t => t.id === toInst?.templateId);

          if (!fromInst || !toInst || !fromTemp || !toTemp) return conn;

          const start = getPortPosition(fromInst, fromTemp, conn.fromPortId);
          const end = getPortPosition(toInst, toTemp, conn.toPortId);
          const startNormal = getPortNormal(fromInst, fromTemp, conn.fromPortId);
          const endNormal = getPortNormal(toInst, toTemp, conn.toPortId);

          const points = findSmartPath(start, end, startNormal, endNormal, obstacles);

          return { 
              ...conn, 
              shape: 'orthogonal' as const,
              controlPoints: points,
              cornerRadius: 10
          };
      });
      setConnections(newConnections);
  };

  const handleDeleteSelected = () => {
      if (selectedIds.size === 0) return;
      performCheckpoint();
      setInstances(prev => prev.filter(i => !selectedIds.has(i.id)));
      setTextNodes(prev => prev.filter(t => !selectedIds.has(t.id)));
      setZones(prev => prev.filter(z => !selectedIds.has(z.id)));
      setComments(prev => prev.filter(c => !selectedIds.has(c.id)));
      setConnections(prev => prev.filter(c => !selectedIds.has(c.fromInstanceId) && !selectedIds.has(c.toInstanceId)));
      setSelectedIds(new Set());
  };

  const handleCopyInstance = () => { if (selectedInstanceId) { const inst = instances.find(i => i.id === selectedInstanceId); if (inst) setClipboardInstance(inst); } };
  const handlePasteInstance = () => { if (clipboardInstance) { performCheckpoint(); const newId = crypto.randomUUID(); const offset = 30; const newInst = { ...clipboardInstance, id: newId, x: clipboardInstance.x + offset, y: clipboardInstance.y + offset }; setInstances(prev => [...prev, newInst]); setSelectedIds(new Set([newId])); } };



  const handleDeleteTemplate = (templateId: string) => {
      performCheckpoint();
      setPages(prevPages => prevPages.map(page => {
           const instancesToRemove = page.instances.filter(i => i.templateId === templateId).map(i => i.id);
           const instancesToRemoveSet = new Set(instancesToRemove);
           return {
               ...page,
               instances: page.instances.filter(i => i.templateId !== templateId),
               connections: page.connections.filter(c => !instancesToRemoveSet.has(c.fromInstanceId) && !instancesToRemoveSet.has(c.toInstanceId))
           }
      }));
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setSelectedIds(new Set()); 
  };

  const handleSaveTemplate = (template: ProductTemplate) => {
    performCheckpoint();
    if (editingTemplate) {
        setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
        setPages(prevPages => prevPages.map(page => ({
            ...page,
            instances: page.instances.map(inst => inst.templateId === template.id ? { ...inst, width: template.width, height: template.height } : inst)
        })));
    } else {
        setTemplates(prev => [...prev, template]);
    }
    setIsEditorOpen(false);
    setEditingTemplate(null);
  };
  
  const handleEditTemplate = (templateId: string) => {
      const template = templates.find(t => t.id === templateId);
      if (template) { setEditingTemplate(template); setIsEditorOpen(true); }
  };
  
  const handleExportLibrary = () => {
      const blob = new Blob([JSON.stringify(templates)], { type: 'application/json' });
      downloadBlob(blob, `weave_library_${new Date().toISOString().slice(0,10)}.json`);
  };
  
  const handleImportLibrary = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const parsed = JSON.parse(evt.target?.result as string);
              // Accept a full library (array) or a single exported template (object)
              const imported = Array.isArray(parsed) ? parsed : (parsed && parsed.id && Array.isArray(parsed.ports) ? [parsed] : null);
              if (imported) {
                  if (confirm("Mevcut kütüphane ile birleştirilsin mi?")) {
                      const newTemplates = [...templates];
                      imported.forEach((imp: ProductTemplate) => { if (!newTemplates.find(t => t.id === imp.id)) newTemplates.push(imp); });
                      setTemplates(newTemplates);
                  } else {
                      setTemplates(imported);
                  }
                  alert("Kütüphane başarıyla yüklendi.");
              } else { alert("Geçersiz dosya formatı."); }
          } catch (err) { console.error("Import Error", err); alert("Dosya okunamadı."); }
      };
      reader.readAsText(file);
      if (libraryInputRef.current) libraryInputRef.current.value = '';
  };
  
  const handleExtractParts = (parts: any[]) => {
      setProjectMetadata(prev => ({ ...prev, externalParts: [...(prev.externalParts || []), ...parts] }));
  };

  const handleTemplateUpdate = (updatedTemplate: ProductTemplate) => {
    setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
  };

  const addToCanvas = (templateId: string, position?: { x: number, y: number }) => {
    performCheckpoint();
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const newInstance: ProductInstance = {
        id: crypto.randomUUID(),
        templateId,
        x: position ? position.x : 100 + (instances.length * 50),
        y: position ? position.y : 100 + (instances.length * 50),
        width: template.width,
        height: template.height,
        labelConfig: { visible: true, fontSize: 14, color: '#ffffff', backgroundColor: '#000000', position: 'bottom' }
      };
      setInstances([...instances, newInstance]);
    }
  };

  const handleRemovePortFromInstance = (templateId: string, portId: string) => {
      performCheckpoint();
      setTemplates(prev => prev.map(t => { if (t.id === templateId) return { ...t, ports: t.ports.filter(p => p.id !== portId) }; return t; }));
      setConnections(prev => prev.filter(c => c.fromPortId !== portId && c.toPortId !== portId));
  };
  
  const handleDuplicateInstance = () => { if (selectedInstanceId) { const inst = instances.find(i => i.id === selectedInstanceId); if (inst) { performCheckpoint(); const newId = crypto.randomUUID(); const offset = 30; const newInst = { ...inst, id: newId, x: inst.x + offset, y: inst.y + offset }; setInstances(prev => [...prev, newInst]); setSelectedIds(new Set([newId])); } } }
  
  const updateInstanceLabelConfig = (key: string, value: any) => {
      if (!selectedInstanceId) return;
      performCheckpoint();
      setInstances((prev) => prev.map(inst => {
        if (inst.id === selectedInstanceId) {
             const oldConfig = inst.labelConfig || { visible: true, fontSize: 14, color: '#FFFFFF', backgroundColor: '#000000', position: 'bottom' };
             return { ...inst, labelConfig: { ...oldConfig, [key]: value } as any }; 
        }
        return inst;
      }));
  };

  const handleRescaleAll = (newPixelScale: number) => {
      performCheckpoint();
      setPages(prevPages => prevPages.map(page => ({
          ...page,
          instances: page.instances.map(inst => {
            const temp = templates.find(t => t.id === inst.templateId);
            if (temp && temp.physicalWidth && temp.physicalWidth > 0) {
                const newWidth = temp.physicalWidth * newPixelScale;
                const aspectRatio = temp.width / temp.height;
                const newHeight = newWidth / aspectRatio;
                return { ...inst, width: newWidth, height: newHeight };
            } return inst;
          })
      })));
      
      const updatedTemplates = templates.map(temp => {
          if (temp.physicalWidth && temp.physicalWidth > 0) {
               const newWidth = temp.physicalWidth * newPixelScale;
               const aspectRatio = temp.width / temp.height;
               const newHeight = newWidth / aspectRatio;
               return { ...temp, width: newWidth, height: newHeight };
          } return temp;
      });
      setTemplates(updatedTemplates);
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      setAnalysisResult(await analyzeSchematic(appSettings.geminiApiKey, instances, connections, templates));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const requestClear = () => setIsClearModalOpen(true);

  const handleClearConfirm = () => {
      performCheckpoint();
      updateActivePage({ instances: [], connections: [], zones: [], textNodes: [], comments: [] });
      setSelectedIds(new Set()); setAnalysisResult(null); setIsClearModalOpen(false);
  }

  const downloadBlob = (blob: Blob | null, filename: string) => {
      if(!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const handleExportImage = async () => {
      const prevTheme = appSettings.theme;
      const prevSelection = new Set(selectedIds);
      const prevLegendCollapsed = isLegendCollapsed;
      
      // Temporarily force light theme for export if needed, or keep current
      setAppSettings(prev => ({...prev, theme: 'light'})); 
      setSelectedIds(new Set()); setIsLegendCollapsed(false); 
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const element = document.getElementById('canvas-export-area');
      
      if (element) {
          try {
              // Determine full paper size dimensions
              // Note: We need to ensure we capture the full paper area, not just the visible viewport
              // The element 'canvas-export-area' is transformed (scaled/panned), so we might need to temporarily reset transform
              // But html2canvas onclone allows us to modify the clone.
              
              // Calculate expected dimensions based on metadata
              const paperW = projectMetadata ? PAPER_DIMENSIONS[projectMetadata.paperSize].w * projectMetadata.pixelScale : 2000;
              const paperH = projectMetadata ? PAPER_DIMENSIONS[projectMetadata.paperSize].h * projectMetadata.pixelScale : 1500;
              const finalW = projectMetadata?.orientation === 'portrait' ? paperH : paperW;
              const finalH = projectMetadata?.orientation === 'portrait' ? paperW : paperH;

              const canvas = await html2canvas(element as HTMLElement, {
                  scale: 2, // High resolution
                  useCORS: true, 
                  allowTaint: true, 
                  backgroundColor: '#ffffff', 
                  width: finalW,
                  height: finalH,
                  x: 0,
                  y: 0,
                  windowWidth: finalW,
                  windowHeight: finalH,
                  ignoreElements: (el: Element) => el.classList.contains('no-print'),
                  onclone: (clonedDoc: Document) => { 
                      const clonedEl = clonedDoc.getElementById('canvas-export-area');
                      if (clonedEl) {
                          // Reset transform to ensure full capture at 0,0
                          (clonedEl as HTMLElement).style.transform = 'none'; 
                          (clonedEl as HTMLElement).style.width = `${finalW}px`;
                          (clonedEl as HTMLElement).style.height = `${finalH}px`;
                      }
                  }
              });
              const now = new Date();
              const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); 
              const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, ''); 
              const filenameBase = `${projectMetadata.documentNo || 'Weave'}_${dateStr}_${timeStr}_${activePage.name.replace(/\s/g, '_')}`;
              canvas.toBlob((blob: Blob | null) => downloadBlob(blob, `${filenameBase}.png`));
          } catch (err) { console.error("Export failed", err); alert("Görüntü oluşturulurken bir hata meydana geldi."); }
      } else { alert("Dışa aktarılacak alan bulunamadı."); }
      
      setAppSettings(prev => ({...prev, theme: prevTheme})); 
      setSelectedIds(prevSelection); setIsLegendCollapsed(prevLegendCollapsed);
  };

  const handleSaveProject = () => {
      const projectData = { version: '2.0', timestamp: new Date().toISOString(), metadata: projectMetadata, templates, pages, activePageId };
      // Blob instead of a data: URI — embedded product images easily exceed URL length limits.
      const blob = new Blob([JSON.stringify(projectData)], { type: 'application/json' });
      downloadBlob(blob, `${projectMetadata.documentNo || 'Project'}.weave`);
  };

  useAppShortcuts({
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
      performCheckpoint,
      selectedInstanceId: selectedInstanceId as string | null,
      clipboardInstance,
      handleSaveBlockAsTemplate,
      handleAutoRoute,
      handleSaveProject,
      onSetCanvasMode: setActiveTool
  });

  /** Replaces the open document. Returns false if `data` is not a Weave project. */
  const applyProjectData = (data: any, id: string = crypto.randomUUID()): boolean => {
      if (!data || !Array.isArray(data.templates)) return false;
      let nextPages: Page[];
      if (Array.isArray(data.pages) && data.pages.length > 0) {
          nextPages = data.pages;
      } else {
          // Legacy single-page format (or empty project)
          const legacyPage = createNewPage(1);
          legacyPage.instances = data.instances || [];
          legacyPage.connections = data.connections || [];
          legacyPage.zones = data.zones || [];
          legacyPage.textNodes = data.textNodes || [];
          legacyPage.comments = data.comments || [];
          nextPages = [legacyPage];
      }
      const nextActive = nextPages.some(p => p.id === data.activePageId) ? data.activePageId : nextPages[0].id;
      setPages(nextPages);
      setActivePageId(nextActive);
      // `templates` is also the active library (persisted by useLibraryManager):
      // merge the project's templates in instead of replacing the library.
      const incoming: ProductTemplate[] = data.templates;
      if (incoming.length > 0) {
          setTemplates(prev => {
              const byId = new Map(prev.map(t => [t.id, t]));
              incoming.forEach(t => byId.set(t.id, t));
              return Array.from(byId.values());
          });
      }
      setProjectMetadata({ ...INITIAL_METADATA, ...(data.metadata || {}) });
      setProjectId(id);
      setSelectedIds(new Set());
      setAnalysisResult(null);
      clearHistory();
      return true;
  };

  const readProjectFile = (file: File) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const data = JSON.parse(evt.target?.result as string);
              if (!applyProjectData(data)) { alert("Geçersiz proje dosyası."); return; }
              setShowWelcome(false);
          } catch (err) { console.error("Load Error", err); alert("Dosya okunamadı."); }
      };
      reader.onerror = () => alert("Dosya okunamadı.");
      reader.readAsText(file);
  };

  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (e.target) e.target.value = '';
      if (!file) return;
      if (!confirm("Mevcut proje kapatılacak (otomatik kaydedildi). Devam etmek istiyor musunuz?")) return;
      readProjectFile(file);
  };

  const handleCreateNewProject = () => {
      applyProjectData({ templates: [], metadata: INITIAL_METADATA });
      setShowWelcome(false);
  };

  const handleOpenRecent = async (project: RecentProject) => {
      try {
          const stored = await loadProject(project.id);
          if (!stored || !applyProjectData(stored.data, stored.id)) {
              alert("Proje yerel kayıtlarda bulunamadı.");
              return;
          }
          setShowWelcome(false);
      } catch (err) {
          console.error("Recent load failed", err);
          alert("Proje açılamadı.");
      }
  };
  
  const handleAddPage = () => {
      performCheckpoint();
      const newPage = createNewPage(pages.length + 1);
      setPages([...pages, newPage]);
      setActivePageId(newPage.id);
  };

  const handleDuplicatePage = (id: string) => {
      const page = pages.find(p => p.id === id);
      if(!page) return;
      performCheckpoint();
      const newPage = {
          ...JSON.parse(JSON.stringify(page)), 
          id: crypto.randomUUID(),
          name: `${page.name} (Kopya)`,
          order: pages.length + 1
      };
      setPages([...pages, newPage]);
      setActivePageId(newPage.id);
  };

  const handleRemovePage = (id: string) => {
      if(pages.length <= 1) return;
      performCheckpoint();
      let newActiveId = activePageId;
      if (activePageId === id) {
          const index = pages.findIndex(p => p.id === id);
          if (index > 0) {
              newActiveId = pages[index - 1].id;
          } else {
              newActiveId = pages[index + 1].id;
          }
      }
      const newPages = pages.filter(p => p.id !== id);
      setPages(newPages);
      setActivePageId(newActiveId);
  };
  
  const handleRenamePage = (id: string, newName: string) => {
      setPages(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  return (
    <TooltipProvider>
    <div className="flex h-screen w-full bg-ink text-alabaster overflow-hidden font-sans select-none transition-colors duration-300 relative">
         {showWelcome && (
             <WelcomeScreen
                onNewProject={handleCreateNewProject}
                onOpenProject={readProjectFile}
                onOpenRecent={handleOpenRecent}
                onSettings={() => setIsAppSettingsOpen(true)}
                onClose={() => setShowWelcome(false)}
             />
         )}
         {autosaveError && (
             <div role="alert" className="fixed bottom-16 right-4 z-[300] rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg no-print">
                 Otomatik kayıt başarısız — projeyi dosyaya kaydedin (Ctrl+S).
             </div>
         )}
         {libraryError && (
             <div role="alert" className="fixed bottom-28 right-4 z-[300] rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg no-print">
                 Kütüphane kaydedilemedi — tarayıcı depolaması dolu veya kapalı olabilir. Kütüphaneyi dışa aktarın.
             </div>
         )}
         <div className="flex-1 flex overflow-hidden relative">
            <LeftSidebar
                projectMetadata={projectMetadata}
                setProjectMetadata={(m) => { performCheckpoint(); setProjectMetadata(m); }}
                templates={templates}
                handleSaveProject={handleSaveProject}
                handleLoadProject={handleLoadProject}
                handleExportLibrary={handleExportLibrary}
                handleImportLibrary={handleImportLibrary}
                setIsEditorOpen={setIsEditorOpen}
                setEditingTemplate={setEditingTemplate}
                addToCanvas={addToCanvas}
                handleDeleteTemplate={handleDeleteTemplate}
                projectInputRef={projectInputRef}
                libraryInputRef={libraryInputRef}
                libraries={libraries}
                activeLibraryId={activeLibraryId}
                onSwitchLibrary={handleSwitchLibrary}
                onCreateLibrary={handleCreateLibrary}
                onDeleteLibrary={handleDeleteLibrary}
                onRenameLibrary={handleRenameLibrary}
                onOpenSettings={() => setIsAppSettingsOpen(true)}
                onExportBOM={() => exportBOM(activePage.instances, templates, projectMetadata.projectName, projectMetadata.externalParts)}
                onSingleExport={(template) => {
                    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
                    downloadBlob(blob, `${template.name.replace(/\s/g, '_')}.json`);
                }}
            />
            

      <div className="flex-1 relative h-full w-full overflow-hidden print:block print:h-auto print:w-auto print:overflow-visible">
          <div className="absolute inset-0 z-0">
               {isGridView ? (
                   <PageGrid 
                        pages={pages}
                        templates={templates}
                        activePageId={activePageId}
                        onSwitchPage={(id) => { setActivePageId(id); setIsGridView(false); }}
                        onRemovePage={handleRemovePage}
                        onDuplicatePage={handleDuplicatePage}
                        theme={appSettings.theme}
                   />
               ) : (
                   <Canvas 
                        instances={instances}
                        connections={connections}
                        templates={templates}
                        projectMetadata={projectMetadata}
                        zones={zones}
                        textNodes={textNodes}
                        comments={comments}
                        selectedInstanceId={selectedInstanceId}
                        selectedIds={selectedIds} 
                        onSelectIds={handleSelectIds}
                        theme={appSettings.theme}
                        editingPortInfo={editingPortInfo}
                        onSetEditingPortInfo={setEditingPortInfo}
                        onInstancesChange={setInstances}
                        onConnectionsChange={setConnections}
                        onZonesChange={setZones}
                        onTextNodesChange={setTextNodes}
                        onCommentsChange={setComments}
                        onTemplateChange={handleTemplateUpdate}
                        onEditMetadata={() => setIsSettingsOpen(true)}
                        onUndoCheckpoint={performCheckpoint}
                        onSelectInstance={(id) => handleSelectIds(id ? [id] : [], false)}
                        onCopyInstance={(id) => { const inst = instances.find(i => i.id === id); if (inst) setClipboardInstance(inst); }}
                        onRemovePort={handleRemovePortFromInstance}
                        isLegendCollapsed={isLegendCollapsed}
                        onToggleLegend={setIsLegendCollapsed}
                        onEditTemplate={handleEditTemplate}
                        
                        onGroupSelected={handleGroupSelected}
                        onUngroupSelected={handleUngroupSelected}
                        onSaveBlock={handleSaveBlockAsTemplate}
                        
                        activePageName={activePage.name}
                        activePageNumber={pages.findIndex(p => p.id === activePageId) + 1}
                        totalPages={pages.length}
                        activeTool={activeTool}
                        onSetActiveTool={setActiveTool}
                        onAddInstance={addToCanvas}
                    />
               )}
          </div>
          
          {!isGridView && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] w-max max-w-[calc(100%-1.5rem)] overflow-x-auto rounded-2xl">
                <Toolbar 
                    handleUndo={handleUndo} handleRedo={handleRedo}
                    canUndo={canUndo} canRedo={canRedo}
                    isAnalyzing={isAnalyzing} runAnalysis={runAnalysis}
                    handleAutoRoute={handleAutoRoute} hasConnections={connections.length > 0}
                    requestClear={requestClear} handleExportImage={handleExportImage}
                    theme={appSettings.theme} setTheme={(t) => setAppSettings({...appSettings, theme: t})}
                    openShortcuts={() => setIsShortcutsOpen(true)}
                    openPinout={() => setIsPinoutOpen(true)}
                    openHistory={() => setIsHistoryOpen(true)}

                    selectedCount={selectedIds.size}
                    handleGroup={handleGroupSelected}
                    handleUngroup={handleUngroupSelected}
                    handleSaveBlock={handleSaveBlockAsTemplate}
                />
              </div>
          )}

          <PageBar 
              pages={pages}
              activePageId={activePageId}
              onSwitchPage={setActivePageId}
              onAddPage={handleAddPage}
              onDuplicatePage={handleDuplicatePage}
              onRemovePage={handleRemovePage}
              onRenamePage={handleRenamePage}
              onToggleGridView={() => setIsGridView(!isGridView)}
              isGridView={isGridView}
              theme={appSettings.theme}
          />
      </div>

      <RightSidebar 
          selectedIds={selectedIds}
          instances={instances}
          templates={templates}
          handleDeleteSelected={handleDeleteSelected}
          setSelectedIds={setSelectedIds}
          handleCopyInstance={handleCopyInstance}
          handleDuplicateInstance={handleDuplicateInstance}
          updateInstanceLabelConfig={updateInstanceLabelConfig}
          handleRemovePortFromInstance={handleRemovePortFromInstance}
          connections={connections}
          zones={zones}
          textNodes={textNodes}
          comments={comments}
          handleUpdateItem={handleUpdateItem}
      />

      <ModalManager
        projectMetadata={projectMetadata}
        setProjectMetadata={setProjectMetadata}
        appSettings={appSettings}
        setAppSettings={setAppSettings}
        templates={templates}
        setTemplates={setTemplates}
        pages={pages}
        activePageId={activePageId}
        pastStates={pastStates}
        snapshots={snapshots}
        onRestoreHistoryState={handleRestoreHistoryState}
        onCreateSnapshot={handleCreateSnapshot}
        isEditorOpen={isEditorOpen}
        setIsEditorOpen={setIsEditorOpen}
        editingTemplate={editingTemplate}
        setEditingTemplate={setEditingTemplate}
        onSaveTemplate={handleSaveTemplate}
        onExtractParts={handleExtractParts}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        isAppSettingsOpen={isAppSettingsOpen}
        setIsAppSettingsOpen={setIsAppSettingsOpen}
        isClearModalOpen={isClearModalOpen}
        setIsClearModalOpen={setIsClearModalOpen}
        onClearConfirm={handleClearConfirm}
        isShortcutsOpen={isShortcutsOpen}
        setIsShortcutsOpen={setIsShortcutsOpen}
        isPinoutOpen={isPinoutOpen}
        setIsPinoutOpen={setIsPinoutOpen}
        isHistoryOpen={isHistoryOpen}
        setIsHistoryOpen={setIsHistoryOpen}
        analysisResult={analysisResult}
        setAnalysisResult={setAnalysisResult}
        connections={connections}
        instances={instances}
        onRescaleAll={handleRescaleAll}
        performCheckpoint={performCheckpoint}
      />
      </div>
    </div>
    </TooltipProvider>
  );
}