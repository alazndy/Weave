
import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
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
import { GoogleDriveService } from './services/google-drive-service';
import * as html2canvas from 'html2canvas';

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
    enableUPHIntegration: true,
    enableGoogleDrive: false
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
    handleSwitchLibrary 
  } = useLibraryManager();

  const { 
      saveCheckpoint: saveHistoryCheckpoint, 
      undo, redo, canUndo, canRedo,
      createSnapshot, restoreSnapshot,
      pastStates, snapshots 
  } = useHistory();

  // --- STATE ---
  const [pages, setPages] = useState<Page[]>([createNewPage(1)]);
  const [activePageId, setActivePageId] = useState<string>(pages[0].id);
  const [isGridView, setIsGridView] = useState(false); 
  const [activeTool, setActiveTool] = useState<ActiveTool>('cursor'); 

  const [projectMetadata, setProjectMetadata] = useState<ProjectMetadata>(INITIAL_METADATA);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [clipboardInstance, setClipboardInstance] = useState<ProductInstance | null>(null);
  
  // App Settings
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
      const saved = localStorage.getItem('weave_app_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

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
  const [isInventoryImportOpen, setIsInventoryImportOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isPinoutOpen, setIsPinoutOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSendToEnvModalOpen, setIsSendToEnvModalOpen] = useState(false);
  const [templateToSend, setTemplateToSend] = useState<ProductTemplate | null>(null);
  const [isUPHExportOpen, setIsUPHExportOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  // Apply App Settings (Theme & Palette)
  useEffect(() => {
      // 1. Save to local storage
      localStorage.setItem('weave_app_settings', JSON.stringify(appSettings));

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
      pages, activePageId, templates
    });
  }, [saveHistoryCheckpoint, pages, activePageId, templates]);

  const handleUndo = useCallback(() => {
    const currentState = { pages, activePageId, templates };
    const restoredState = undo(currentState);
    if (restoredState) {
        setPages(restoredState.pages);
        setActivePageId(restoredState.activePageId);
        setTemplates(restoredState.templates);
    }
  }, [undo, pages, activePageId, templates, setTemplates]);

  const handleRedo = useCallback(() => {
    const currentState = { pages, activePageId, templates };
    const restoredState = redo(currentState);
    if (restoredState) {
        setPages(restoredState.pages);
        setActivePageId(restoredState.activePageId);
        setTemplates(restoredState.templates);
    }
  }, [redo, pages, activePageId, templates, setTemplates]);

  const handleRestoreHistoryState = (state: HistoryState) => {
      performCheckpoint();
      setPages(state.pages);
      setActivePageId(state.activePageId);
      setTemplates(state.templates);
  };

  const handleCreateSnapshot = (name: string) => {
      const currentState = { pages, activePageId, templates };
      createSnapshot(name, currentState);
  };

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
          const canvas = await html2canvas.default(element as HTMLElement, {
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
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(templates));
      const link = document.createElement('a');
      link.setAttribute("href", dataStr);
      link.setAttribute("download", `techschematic_library_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
  };
  
  const handleImportLibrary = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const imported = JSON.parse(evt.target?.result as string);
              if (Array.isArray(imported)) {
                  if (confirm("Mevcut kütüphane ile birleştirilsin mi?")) {
                      const newTemplates = [...templates];
                      imported.forEach(imp => { if (!newTemplates.find(t => t.id === imp.id)) newTemplates.push(imp); });
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
    const result = await analyzeSchematic(instances, connections, templates);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const requestClear = () => setIsClearModalOpen(true);

  const handleClearConfirm = () => {
      performCheckpoint();
      updateActivePage({ instances: [], connections: [], zones: [], textNodes: [], comments: [] });
      setSelectedIds(new Set()); setAnalysisResult(null); setIsClearModalOpen(false);
  }

  const downloadBlob = (blob: Blob | null, filename: string) => {
      if(!blob) return;
      const link = document.createElement('a');
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

              const canvas = await html2canvas.default(element as HTMLElement, {
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
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectData));
      const link = document.createElement('a');
      link.setAttribute("href", dataStr);
      link.setAttribute("download", `${projectMetadata.documentNo || 'Project'}.weave`);
      document.body.appendChild(link);
      link.click();
      link.remove();
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
      onSetCanvasMode: (mode) => setActiveTool(mode as ActiveTool)
  });

  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const data = JSON.parse(evt.target?.result as string);
              if (!data.templates) { alert("Geçersiz proje dosyası."); return; }
              if (confirm("Mevcut çalışmanızın üzerine yazılacak. Devam etmek istiyor musunuz?")) {
                  performCheckpoint();
                  if (!data.pages && data.instances) {
                      const legacyPage = createNewPage(1);
                      legacyPage.instances = data.instances || [];
                      legacyPage.connections = data.connections || [];
                      legacyPage.zones = data.zones || [];
                      legacyPage.textNodes = data.textNodes || [];
                      legacyPage.comments = data.comments || [];
                      setPages([legacyPage]);
                      setActivePageId(legacyPage.id);
                  } else {
                      setPages(data.pages || [createNewPage(1)]);
                      setActivePageId(data.activePageId || data.pages[0]?.id);
                  }
                  
                  setTemplates(data.templates || []);
                  if (data.metadata) setProjectMetadata(data.metadata);
                  alert("Proje başarıyla yüklendi.");
              }
          } catch (err) { console.error("Load Error", err); alert("Dosya okunamadı."); }
      };
      reader.readAsText(file);
      if (e.target) e.target.value = '';
  };

  const handleCreateNewProject = () => {
      // Logic for new project (reset everything)
      if (confirm("Mevcut çalışmanız silinecek. Yeni proje oluşturmak istediğinize emin misiniz?")) {
          setProjectMetadata(INITIAL_METADATA);
          setPages([createNewPage(1)]);
          setActivePageId(pages[0].id); // This will point to old page, but it's fine since we reset
          setTemplates([]);
          setShowWelcome(false);
      }
  };

  const handleOpenRecent = (project: any) => {
      // Mock loading logic
      console.log("Loading recent:", project);
      alert(`"${project.name}" yükleniyor... (Demo)`);
      setShowWelcome(false);
  };

  const handleWelcomeLoad = (file: File) => {
      // Wrap existing load handler
      const dummyEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleLoadProject(dummyEvent);
      setShowWelcome(false);
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
                onNewProject={() => { setShowWelcome(false); /* Start fresh implicitly */ }}
                onOpenProject={(file) => handleWelcomeLoad(file)}
                onOpenRecent={handleOpenRecent}
                onClose={() => setShowWelcome(false)}
             />
         )}
         <div className="flex-1 flex overflow-hidden relative">
            <LeftSidebar
                projectMetadata={projectMetadata}
                setProjectMetadata={setProjectMetadata}
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
                onOpenInventoryImport={() => setIsInventoryImportOpen(true)}
                onOpenUPHExport={appSettings.enableUPHIntegration ? () => setIsUPHExportOpen(true) : undefined}
                onSaveToDrive={appSettings.enableGoogleDrive ? async () => {
                    const confirmSave = confirm("Projeyi Google Drive'a yedeklemek istiyor musunuz?");
                    if (!confirmSave) return;

                    // Mock Connect if not auth
                    if (!GoogleDriveService.isAuthenticated) {
                        const res = await GoogleDriveService.connect();
                        if (!res.success) {
                            alert("Google Drive bağlantısı başarısız.");
                            return;
                        }
                    }

                    // Prepare data
                    const projectData: any = { // Using any temporarily or need to import ProjectData if available
                         metadata: projectMetadata,
                         pages: pages, 
                         templates: templates, // library was undefined, using templates
                         version: "1.0.0"
                    };
                    const json = JSON.stringify(projectData, null, 2);
                    
                    try {
                        await GoogleDriveService.uploadFile(`Weave_Project_${projectMetadata.projectName}.json`, json);
                        alert("Proje başarıyla Google Drive'a yedeklendi!");
                    } catch (e) {
                         alert("Yedekleme sırasında bir hata oluştu.");
                         console.error(e);
                    }
                } : undefined}
                onExportBOM={() => exportBOM(activePage.instances, projectMetadata.projectName)}
                onSingleExport={(template) => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
                    const link = document.createElement('a');
                    link.setAttribute("href", dataStr);
                    link.setAttribute("download", `${template.name.replace(/\s/g, '_')}.weave`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                }}
                onSendToEnv={(template) => {
                    // Always open modal to select/confirm target product
                    setTemplateToSend(template);
                    setIsSendToEnvModalOpen(true);
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
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] w-max max-w-[90vw]">
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
                    openCloudSync={() => setIsCloudSyncOpen(true)}
                    
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
        isProjectSettingsOpen={false} // Assuming consolidated or controlled internally by isSettingsOpen logic if needed, but passing for now
        setIsProjectSettingsOpen={() => {}} // No-op if consolidate
        isInventoryImportOpen={isInventoryImportOpen}
        setIsInventoryImportOpen={setIsInventoryImportOpen}
        isUPHExportOpen={isUPHExportOpen}
        setIsUPHExportOpen={setIsUPHExportOpen}
        isSendToEnvModalOpen={isSendToEnvModalOpen}
        setIsSendToEnvModalOpen={setIsSendToEnvModalOpen}
        templateToSend={templateToSend}
        setTemplateToSend={setTemplateToSend}
        isCloudSyncOpen={isCloudSyncOpen}
        setIsCloudSyncOpen={setIsCloudSyncOpen}
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