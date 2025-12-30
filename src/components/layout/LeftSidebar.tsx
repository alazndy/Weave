import React, { useState, useMemo, useRef } from "react";
import { useTranslation } from 'react-i18next';
import {
  ProductTemplate,
  ProjectMetadata,
  PaperSize,
  Orientation,
  LibraryMetadata,
} from "../../types";
import {
  Cable, Save, FolderOpen, Download, FileUp, Plus, Trash2, Edit2,
  Library, BookPlus, Settings2, ChevronDown, Box, Cpu, Settings, Package, Send,
  MoreVertical, FileText, Smartphone, Tablet, Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
      className="group relative bg-card border border-border rounded-xl p-2.5 cursor-grab active:cursor-grabbing hover:border-primary/50 hover:bg-accent/50 hover:shadow-lg transition-all duration-200 active:scale-95 overflow-hidden"
      title={template.name}
    >
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 z-20">
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 bg-background/80 hover:bg-background">
                    <MoreVertical className="h-3 w-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingTemplate(template); setIsEditorOpen(true); }}>
                    <Edit2 className="h-3.5 w-3.5 mr-2" /> {t('sidebar.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSingleExport?.(template); }}>
                    <Download className="h-3.5 w-3.5 mr-2" /> Tekli Export
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSendToEnv?.(template); }}>
                    <Send className="h-3.5 w-3.5 mr-2" /> ENV'e Gönder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                    className="text-red-500 focus:text-red-500"
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        if (confirm("Silmek istediğinize emin misiniz?")) handleDeleteTemplate(template.id); 
                    }}
                >
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> {t('sidebar.delete')}
                </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </div>

      <div className="aspect-square w-full bg-muted/20 rounded-lg mb-3 p-2 flex items-center justify-center overflow-hidden border border-dashed border-border/50 group-hover:border-primary/20 transition-colors">
        <img
          src={template.imageUrl}
          alt={template.name}
          className="w-full h-full object-contain filter drop-shadow-sm"
        />
      </div>
      <p className="text-xs text-center truncate font-semibold text-foreground/80 group-hover:text-foreground transition-colors px-1">
        {template.name}
      </p>

      {template.isBlock ? (
        <div className="absolute top-2 left-2">
          <span className="text-[9px] font-bold text-orange-500 bg-background/80 px-1.5 py-0.5 rounded border border-orange-500/20 flex items-center gap-1 shadow-sm backdrop-blur-sm">
            <Box size={8} /> {t('sidebar.block')}
          </span>
        </div>
      ) : (
        <div className="absolute top-2 left-2">
          <span className="text-[9px] font-bold text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border group-hover:border-primary/20 group-hover:text-primary transition-colors shadow-sm backdrop-blur-sm">
            {template.ports.length} P
          </span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Toggle Button (Outside when closed) */}
      {!isOpen && (
         <div className="absolute top-4 left-4 z-50">
             <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setIsOpen(true)}
                className="h-10 w-10 rounded-full shadow-lg bg-background/50 backdrop-blur-sm hover:bg-background"
             >
                 <Cable className="h-5 w-5 text-primary" />
             </Button>
         </div>
      )}

    <div
      className={cn(
        "relative h-full transition-all duration-300 ease-in-out flex flex-col z-30 no-print bg-background/95 backdrop-blur-xl border-r border-border shadow-2xl",
        isOpen ? "w-80 translate-x-0" : "w-0 -translate-x-full overflow-hidden opacity-0"
      )}
    >
        {/* Header Section */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-lg">
                <Cable className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                {t('sidebar.appName')}
            </h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
              <ChevronDown className="h-4 w-4 rotate-90" />
          </Button>
        </div>

        <Tabs defaultValue="library" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-2">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="library">Library</TabsTrigger>
                    <TabsTrigger value="project">Project</TabsTrigger>
                </TabsList>
            </div>

            {/* --- LIBRARY TAB --- */}
            <TabsContent value="library" className="flex-1 flex flex-col overflow-hidden mt-0">
                
                {/* Library Selector */}
                <div className="px-4 py-3 space-y-3 border-b border-border bg-muted/5">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                            Current Library
                        </Label>
                        <div className="flex gap-1">
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={startRename}>
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Rename Library</TooltipContent>
                             </Tooltip>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={createNew}>
                                        <BookPlus className="h-3 w-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>New Library</TooltipContent>
                             </Tooltip>
                        </div>
                    </div>

                    {isRenamingLib ? (
                        <div className="flex gap-2">
                            <Input 
                                value={tempLibName} 
                                onChange={(e) => setTempLibName(e.target.value)} 
                                className="h-8" 
                                autoFocus
                            />
                            <Button size="sm" onClick={saveRename}>Save</Button>
                        </div>
                    ) : (
                        <Select 
                            value={activeLibraryId} 
                            onValueChange={(val) => onSwitchLibrary?.(val)}
                        >
                            <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select library" />
                            </SelectTrigger>
                            <SelectContent>
                                {libraries.map((lib) => (
                                    <SelectItem key={lib.id} value={lib.id}>{lib.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Library Content */}
                <ScrollArea className="flex-1 px-4">
                     <div className="py-4 space-y-4">
                        <Accordion type="multiple" defaultValue={["components", "blocks"]} className="w-full">
                            
                            <AccordionItem value="components" className="border-b-0">
                                <AccordionTrigger className="py-2 hover:no-underline">
                                    <span className="flex items-center gap-2 text-sm font-semibold">
                                        <Cpu className="h-4 w-4 text-muted-foreground" />
                                        {t('sidebar.components')} 
                                        <span className="ml-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                            {components.length}
                                        </span>
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2">
                                     <div className="grid grid-cols-2 gap-2">
                                        {components.length === 0 ? (
                                            <div className="col-span-2 py-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                                                No components found
                                            </div>
                                        ) : (
                                            components.map(renderTemplateCard)
                                        )}
                                     </div>
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="blocks" className="border-b-0 mt-4">
                                <AccordionTrigger className="py-2 hover:no-underline">
                                    <span className="flex items-center gap-2 text-sm font-semibold">
                                        <Box className="h-4 w-4 text-orange-500" />
                                        {t('sidebar.blocksGroups')}
                                        <span className="ml-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                            {blocks.length}
                                        </span>
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        {blocks.length === 0 ? (
                                            <div className="col-span-2 py-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                                                No saved blocks
                                            </div>
                                        ) : (
                                            blocks.map(renderTemplateCard)
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>

                        </Accordion>
                     </div>
                </ScrollArea>
                
                {/* Library Actions Footer */}
                <div className="p-3 border-t border-border bg-muted/10 grid grid-cols-4 gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={handleExportLibrary} className="w-full h-8">
                                <Download className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Download Library</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => libraryInputRef.current?.click()} className="w-full h-8">
                                <FileUp className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Import Library</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={onOpenInventoryImport} className="w-full h-8 text-green-600 hover:text-green-700">
                                <Package className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Inventory Import</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="default" size="sm" onClick={() => { setIsEditorOpen(true); setEditingTemplate(null); }} className="w-full h-8">
                                <Plus className="h-3.5 w-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>New Component</TooltipContent>
                    </Tooltip>
                    
                    <input type="file" ref={libraryInputRef} onChange={handleImportLibrary} accept=".json" className="hidden" />
                </div>
            </TabsContent>

            {/* --- PROJECT TAB --- */}
            <TabsContent value="project" className="flex-1 flex flex-col overflow-hidden mt-0">
                <ScrollArea className="flex-1 px-4 py-4">
                    <div className="space-y-6">
                        
                        {/* File Actions */}
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground font-bold">Project File</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button onClick={handleSaveProject} variant="outline" className="h-9 justify-start" size="sm">
                                    <Save className="mr-2 h-3.5 w-3.5" /> Save
                                </Button>
                                <Button onClick={() => projectInputRef.current?.click()} variant="outline" className="h-9 justify-start" size="sm">
                                    <FolderOpen className="mr-2 h-3.5 w-3.5" /> Open
                                </Button>
                            </div>
                            <input type="file" ref={projectInputRef} onChange={handleLoadProject} accept=".weave,.json" className="hidden" />
                        </div>

                        <Separator />

                        {/* Paper Settings */}
                        <div className="space-y-3">
                            <Label className="text-xs uppercase text-muted-foreground font-bold">Canvas Settings</Label>
                            
                            <div className="space-y-2">
                                <Label className="text-xs">Paper Size</Label>
                                <Select 
                                    value={projectMetadata.paperSize} 
                                    onValueChange={(val: PaperSize) => setProjectMetadata({ ...projectMetadata, paperSize: val })}
                                >
                                    <SelectTrigger className="h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A3">A3</SelectItem>
                                        <SelectItem value="A4">A4</SelectItem>
                                        <SelectItem value="A6">A6</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs">Orientation</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button 
                                        variant={projectMetadata.orientation === 'landscape' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setProjectMetadata({ ...projectMetadata, orientation: 'landscape' })}
                                        className="h-8 text-xs"
                                    >
                                        <Monitor className="mr-2 h-3 w-3" /> Landscape
                                    </Button>
                                    <Button 
                                        variant={projectMetadata.orientation === 'portrait' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setProjectMetadata({ ...projectMetadata, orientation: 'portrait' })}
                                        className="h-8 text-xs"
                                    >
                                        <FileText className="mr-2 h-3 w-3" /> Portrait
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Export & Integrations */}
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-muted-foreground font-bold">Exports</Label>
                             {onOpenUPHExport && (
                                <Button onClick={onOpenUPHExport} variant="ghost" className="w-full justify-start h-8 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                                    <Send className="mr-2 h-3.5 w-3.5" /> Send to UPH
                                </Button>
                            )}
                            {onSaveToDrive && (
                                <Button onClick={onSaveToDrive} variant="ghost" className="w-full justify-start h-8 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30">
                                    <Download className="mr-2 h-3.5 w-3.5" /> Backup to Drive
                                </Button>
                            )}
                            {onExportBOM && (
                                <Button onClick={onExportBOM} variant="ghost" className="w-full justify-start h-8 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30">
                                    <FileUp className="mr-2 h-3.5 w-3.5" /> Export BOM
                                </Button>
                            )}
                        </div>

                    </div>
                </ScrollArea>
            </TabsContent>
        </Tabs>

        {/* Global Footer */}
        <div className="p-3 border-t border-border bg-background">
             <Button onClick={onOpenSettings} variant="secondary" className="w-full h-9">
                 <Settings className="mr-2 h-4 w-4" /> App Settings
             </Button>
        </div>
    </div>
    </>
  );
};
