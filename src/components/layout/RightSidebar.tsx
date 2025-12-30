import React, { useState } from 'react';
import { ProductInstance, ProductTemplate, Connection, Zone, TextNode, Comment, CONNECTOR_LABELS } from '../../types';
import { Layers, X, Trash2, CircuitBoard, Copy, ClipboardCopy, Type, Eye, EyeOff, Zap, ChevronRight, ChevronLeft, Lock, Unlock, Settings2, Box, MessageSquare, MoreVertical } from 'lucide-react';
import { cn } from "@/lib/utils";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RightSidebarProps {
  selectedIds: Set<string>;
  instances: ProductInstance[];
  templates: ProductTemplate[];
  handleDeleteSelected: () => void;
  setSelectedIds: (ids: Set<string>) => void;
  handleCopyInstance: () => void;
  handleDuplicateInstance: () => void;
  updateInstanceLabelConfig: (key: string, value: any) => void;
  handleRemovePortFromInstance: (templateId: string, portId: string) => void;

  connections?: Connection[];
  zones?: Zone[];
  textNodes?: TextNode[];
  comments?: Comment[];
  handleUpdateItem?: (type: 'instance' | 'connection' | 'zone' | 'text' | 'comment', id: string, updates: Partial<any>) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedIds,
  instances,
  templates,
  handleDeleteSelected,
  setSelectedIds,
  handleCopyInstance,
  handleDuplicateInstance,
  updateInstanceLabelConfig,
  handleRemovePortFromInstance,
  connections = [],
  zones = [],
  textNodes = [],
  comments = [],
  handleUpdateItem
}) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const selectedInstanceId = selectedIds.size === 1 ? Array.from(selectedIds)[0] : null;
  const selectedInstance = instances.find(i => i.id === selectedInstanceId);
  const selectedTemplate = selectedInstance ? templates.find(t => t.id === selectedInstance.templateId) : null;

  const toggleLock = (type: 'instance' | 'connection' | 'zone' | 'text' | 'comment', id: string, current: boolean) => {
      if(handleUpdateItem) handleUpdateItem(type, id, { locked: !current });
  };

  const toggleHide = (type: 'instance' | 'connection' | 'zone' | 'text' | 'comment', id: string, current: boolean) => {
      if(handleUpdateItem) handleUpdateItem(type, id, { hidden: !current });
  };

  return (
    <>
    {!isOpen && (
        <div className="absolute top-24 right-4 z-50">
             <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setIsOpen(true)}
                className="h-10 w-10 rounded-full shadow-lg bg-background/50 backdrop-blur-sm hover:bg-background"
             >
                 <Settings2 className="h-5 w-5 text-primary" />
             </Button>
        </div>
    )}

    <div className={cn(
        "relative h-full transition-all duration-300 ease-in-out flex flex-col z-30 no-print bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl",
        isOpen ? "w-96 translate-x-0" : "w-0 translate-x-full overflow-hidden opacity-0"
    )}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
             <div className="flex items-center gap-2 font-bold text-lg">
                <Settings2 className="h-5 w-5 text-primary" />
                Properties
             </div>
             <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                 <ChevronRight className="h-4 w-4" />
             </Button>
        </div>

        <Tabs defaultValue="properties" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-2">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="properties">Properties</TabsTrigger>
                    <TabsTrigger value="layers">Layers</TabsTrigger>
                </TabsList>
            </div>

            {/* --- PROPERTIES TAB --- */}
            <TabsContent value="properties" className="flex-1 flex flex-col overflow-hidden mt-0 p-0">
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                        
                        {selectedIds.size > 1 ? (
                            // MULTI SELECTION
                            <div className="space-y-4">
                                <Card className="bg-primary/5 border-primary/20">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-primary">{selectedIds.size} Items Selected</p>
                                            <p className="text-xs text-muted-foreground">Use actions below</p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                                <Button 
                                    variant="destructive" 
                                    className="w-full" 
                                    onClick={handleDeleteSelected}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
                                </Button>
                            </div>
                        ) : selectedInstance && selectedTemplate ? (
                            // SINGLE INSTANCE SELECTION
                            <div className="space-y-6">
                                <Card className="border-border">
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-base font-bold">{selectedTemplate.name}</CardTitle>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2" onClick={() => setSelectedIds(new Set())}>
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <div className="flex gap-2 mt-1">
                                             <Badge variant="outline" className="text-[10px] font-mono">{selectedTemplate.modelNumber || 'No Model #'}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0">
                                         <div className="grid grid-cols-2 gap-2 mt-4">
                                            <Button variant="outline" size="sm" onClick={handleCopyInstance}>
                                                <Copy className="mr-2 h-3.5 w-3.5" /> Copy
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={handleDuplicateInstance}>
                                                <ClipboardCopy className="mr-2 h-3.5 w-3.5" /> Duplicate
                                            </Button>
                                         </div>
                                    </CardContent>
                                </Card>

                                <Separator />

                                {/* LABEL SETTINGS */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="uppercase text-xs font-bold text-muted-foreground flex items-center gap-2">
                                            <Type className="h-3 w-3" /> Label Settings
                                        </Label>
                                         <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 px-2"
                                            onClick={() => updateInstanceLabelConfig('visible', !selectedInstance.labelConfig?.visible)}
                                        >
                                            {selectedInstance.labelConfig?.visible ? <Eye className="h-3.5 w-3.5 mr-1" /> : <EyeOff className="h-3.5 w-3.5 mr-1" />}
                                            {selectedInstance.labelConfig?.visible ? 'Visible' : 'Hidden'}
                                        </Button>
                                    </div>

                                    {selectedInstance.labelConfig?.visible !== false && (
                                        <div className="space-y-4 p-3 border rounded-lg bg-muted/20">
                                            
                                            <div className="space-y-2">
                                                <Label className="text-xs">Position</Label>
                                                <Tabs 
                                                    value={selectedInstance.labelConfig?.position || 'bottom'} 
                                                    onValueChange={(v) => updateInstanceLabelConfig('position', v)}
                                                    className="w-full"
                                                >
                                                    <TabsList className="grid w-full grid-cols-3 h-8">
                                                        <TabsTrigger value="top" className="text-xs">Top</TabsTrigger>
                                                        <TabsTrigger value="center" className="text-xs">Center</TabsTrigger>
                                                        <TabsTrigger value="bottom" className="text-xs">Bottom</TabsTrigger>
                                                    </TabsList>
                                                </Tabs>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <Label className="text-xs">Font Size</Label>
                                                    <span className="text-xs text-muted-foreground tabular-nums">{selectedInstance.labelConfig?.fontSize || 14}px</span>
                                                </div>
                                                <Slider 
                                                    value={[selectedInstance.labelConfig?.fontSize || 14]} 
                                                    min={8} max={48} step={1}
                                                    onValueChange={(vals) => updateInstanceLabelConfig('fontSize', vals[0])}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Text Color</Label>
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            type="color" 
                                                            value={selectedInstance.labelConfig?.color || '#ffffff'}
                                                            onChange={(e) => updateInstanceLabelConfig('color', e.target.value)}
                                                            className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                                                        />
                                                        <span className="text-xs font-mono text-muted-foreground uppercase">{selectedInstance.labelConfig?.color?.slice(0,7)}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Background</Label>
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            type="color" 
                                                            value={selectedInstance.labelConfig?.backgroundColor || '#000000'}
                                                            onChange={(e) => updateInstanceLabelConfig('backgroundColor', e.target.value)}
                                                            className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                                                        />
                                                        <span className="text-xs font-mono text-muted-foreground uppercase">{selectedInstance.labelConfig?.backgroundColor?.slice(0,7)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* PORTS */}
                                <div>
                                    <Label className="uppercase text-xs font-bold text-muted-foreground mb-3 block">Ports</Label>
                                    <div className="border rounded-lg overflow-hidden">
                                         <div className="p-4 bg-muted/30 border-b flex justify-center">
                                             <img src={selectedTemplate.imageUrl} alt={selectedTemplate.name} className="h-20 object-contain mix-blend-multiply dark:mix-blend-normal"/>
                                         </div>
                                         <div className="divide-y text-sm">
                                            {selectedTemplate.ports.map(port => (
                                                <div key={port.id} className="p-3 flex justify-between items-center hover:bg-muted/50 transition-colors group">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={cn(
                                                            "w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 ring-offset-background",
                                                            port.type === 'input' ? 'bg-blue-500 ring-blue-200' : 
                                                            port.type === 'output' ? 'bg-red-500 ring-red-200' : 'bg-orange-500 ring-orange-200'
                                                        )} />
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-medium truncate">{port.label}</span>
                                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                                {port.isPower && <Zap className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                                                                <span className="truncate">{CONNECTOR_LABELS[port.connectorType]}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleRemovePortFromInstance(selectedTemplate.id, port.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                         </div>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            // NO SELECTION STATE
                            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                                    <CircuitBoard className="h-8 w-8 opacity-50" />
                                </div>
                                <h3 className="font-semibold text-lg mb-1">No Selection</h3>
                                <p className="text-sm max-w-[200px]">Select an item from the canvas to edit its properties.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </TabsContent>

            {/* --- LAYERS TAB --- */}
            <TabsContent value="layers" className="flex-1 flex flex-col overflow-hidden mt-0 p-0">
                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                         <Accordion type="multiple" defaultValue={["instances", "connections", "others"]} className="w-full">
                            
                            {/* INSTANCES */}
                            <AccordionItem value="instances">
                                <AccordionTrigger className="hover:no-underline py-2">
                                    <span className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                                        <Box className="h-3.5 w-3.5" /> Devices ({instances.length})
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-1 pt-1">
                                    {instances.length === 0 && <div className="text-xs text-muted-foreground px-2 italic">No devices</div>}
                                    {instances.map(inst => {
                                        const t = templates.find(temp => temp.id === inst.templateId);
                                        const isSelected = selectedIds.has(inst.id);
                                        return (
                                            <div 
                                                key={inst.id} 
                                                className={cn(
                                                    "flex items-center justify-between p-2 rounded-md border text-sm transition-colors cursor-pointer",
                                                    isSelected ? "bg-accent border-primary/30 text-accent-foreground" : "bg-card border-transparent hover:bg-muted"
                                                )}
                                                onClick={() => setSelectedIds(new Set([inst.id]))}
                                            >
                                                <div className="flex items-center gap-2 truncate flex-1">
                                                    <div className={cn("w-2 h-2 rounded-full", isSelected ? "bg-primary" : "bg-muted-foreground/30")} />
                                                    <span className={cn("truncate font-medium", inst.hidden && "text-muted-foreground line-through decoration-muted-foreground/50 opacity-50")}>
                                                        {t?.name || 'Unknown Device'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-0.5">
                                                    <Button 
                                                        variant="ghost" size="icon" className="h-6 w-6" 
                                                        onClick={(e) => { e.stopPropagation(); toggleHide('instance', inst.id, !!inst.hidden); }}
                                                    >
                                                        {inst.hidden ? <EyeOff className="h-3 w-3 text-muted-foreground" /> : <Eye className="h-3 w-3 text-muted-foreground" />}
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" size="icon" className="h-6 w-6"
                                                        onClick={(e) => { e.stopPropagation(); toggleLock('instance', inst.id, !!inst.locked); }}
                                                    >
                                                        {inst.locked ? <Lock className="h-3 w-3 text-orange-500" /> : <Unlock className="h-3 w-3 text-muted-foreground" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </AccordionContent>
                            </AccordionItem>

                            {/* CONNECTIONS */}
                            <AccordionItem value="connections">
                                <AccordionTrigger className="hover:no-underline py-2">
                                     <span className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                                        <CircuitBoard className="h-3.5 w-3.5" /> Connections ({connections.length})
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-1 pt-1">
                                    {connections.length === 0 && <div className="text-xs text-muted-foreground px-2 italic">No connections</div>}
                                    {connections.map(conn => (
                                        <div 
                                            key={conn.id} 
                                            className="flex items-center justify-between p-2 rounded-md border border-transparent hover:bg-muted text-sm transition-colors group"
                                        >
                                            <div className="flex items-center gap-2 truncate flex-1">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: conn.color || '#6366f1' }}></div>
                                                <span className={cn("truncate font-mono text-xs", conn.hidden && "opacity-50")}>{conn.label || conn.id.slice(0,6)}</span>
                                            </div>
                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <Button 
                                                    variant="ghost" size="icon" className="h-6 w-6" 
                                                    onClick={() => toggleHide('connection', conn.id, !!conn.hidden)}
                                                >
                                                    {conn.hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                </Button>
                                                <Button 
                                                    variant="ghost" size="icon" className="h-6 w-6"
                                                    onClick={() => toggleLock('connection', conn.id, !!conn.locked)}
                                                >
                                                    {conn.locked ? <Lock className="h-3 w-3 text-orange-500" /> : <Unlock className="h-3 w-3" />}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </AccordionContent>
                            </AccordionItem>
                            
                             {/* OTHERS (Zones, Text, Comments) */}
                             <AccordionItem value="others">
                                <AccordionTrigger className="hover:no-underline py-2">
                                     <span className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                                        <Type className="h-3.5 w-3.5" /> Annotations ({zones.length + textNodes.length + comments.length})
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-1 pt-1">
                                    {[...zones, ...textNodes, ...comments].length === 0 && <div className="text-xs text-muted-foreground px-2 italic">No annotations</div>}
                                    
                                    {zones.map(z => (
                                        <div key={z.id} className="flex items-center justify-between p-2 rounded-md border border-transparent hover:bg-muted text-sm transition-colors cursor-pointer" onClick={() => setSelectedIds(new Set([z.id]))}>
                                            <div className="flex items-center gap-2 truncate">
                                                <Badge variant="secondary" className="text-[9px] px-1 h-4">ZONE</Badge>
                                                <span className={cn("truncate", z.hidden && "opacity-50")}>{z.label}</span>
                                            </div>
                                            <div className="flex items-center gap-0.5">
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {e.stopPropagation(); toggleHide('zone', z.id, !!z.hidden)}}>{z.hidden ? <EyeOff className="h-3 w-3"/>:<Eye className="h-3 w-3"/>}</Button>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {textNodes.map(t => (
                                        <div key={t.id} className="flex items-center justify-between p-2 rounded-md border border-transparent hover:bg-muted text-sm transition-colors cursor-pointer" onClick={() => setSelectedIds(new Set([t.id]))}>
                                            <div className="flex items-center gap-2 truncate">
                                                <Badge variant="secondary" className="text-[9px] px-1 h-4">TXT</Badge>
                                                <span className={cn("truncate", t.hidden && "opacity-50")}>{t.content}</span>
                                            </div>
                                            <div className="flex items-center gap-0.5">
                                                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {e.stopPropagation(); toggleHide('text', t.id, !!t.hidden)}}>{t.hidden ? <EyeOff className="h-3 w-3"/>:<Eye className="h-3 w-3"/>}</Button>
                                            </div>
                                        </div>
                                    ))}

                                    {comments.map(c => (
                                         <div key={c.id} className="flex items-center justify-between p-2 rounded-md border border-transparent hover:bg-muted text-sm transition-colors cursor-pointer" onClick={() => setSelectedIds(new Set([c.id]))}>
                                            <div className="flex items-center gap-2 truncate">
                                                <MessageSquare className="h-3 w-3 text-yellow-500" />
                                                <span className={cn("truncate text-muted-foreground", c.hidden && "opacity-50")}>{c.content || '(Empty)'}</span>
                                            </div>
                                            <div className="flex items-center gap-0.5">
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {e.stopPropagation(); toggleHide('comment', c.id, !!c.hidden)}}>{c.hidden ? <EyeOff className="h-3 w-3"/>:<Eye className="h-3 w-3"/>}</Button>
                                            </div>
                                        </div>
                                    ))}
                                </AccordionContent>
                             </AccordionItem>

                         </Accordion>
                    </div>
                </ScrollArea>
            </TabsContent>
        </Tabs>

    </div>
    </>
  );
};
