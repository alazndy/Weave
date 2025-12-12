
import React, { useState } from 'react';
import { ProductInstance, ProductTemplate, Connection, Zone, TextNode, Comment, CONNECTOR_LABELS } from '../../types';
import { Layers, X, Trash2, CircuitBoard, Copy, ClipboardCopy, Type, Eye, EyeOff, Zap, ChevronRight, ChevronLeft, Lock, Unlock, Settings2, Box, MessageSquare } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'properties' | 'layers'>('properties');

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
    <div className={`relative h-full transition-all duration-300 ease-in-out flex flex-col shadow-2xl z-30 no-print ${isOpen ? 'w-96 bg-ink/90 backdrop-blur-xl border-l border-white/5' : 'w-0 border-none'}`}>
        
        {/* Toggle Button */}
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="absolute -left-8 top-24 bg-ink border border-zinc-700 border-r-0 text-zinc-400 hover:text-paprika p-1.5 rounded-l-lg shadow-lg cursor-pointer z-50 flex items-center justify-center h-10 w-8 transition-colors"
            title={isOpen ? "Paneli Gizle" : "Özellikleri Göster"}
        >
           {isOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* Content Wrapper */}
        <div className={`w-96 flex flex-col h-full overflow-hidden ${!isOpen && 'invisible'}`}>
            
            {/* Tabs */}
            <div className="flex border-b border-white/5 bg-black/20">
                <button 
                    onClick={() => setActiveTab('properties')} 
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${activeTab === 'properties' ? 'text-paprika border-b-2 border-paprika bg-white/5' : 'text-zinc-500 hover:text-alabaster hover:bg-white/5'}`}
                >
                    <Settings2 size={14}/> Özellikler
                </button>
                <button 
                    onClick={() => setActiveTab('layers')} 
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${activeTab === 'layers' ? 'text-paprika border-b-2 border-paprika bg-white/5' : 'text-zinc-500 hover:text-alabaster hover:bg-white/5'}`}
                >
                    <Layers size={14}/> Katmanlar
                </button>
            </div>

            {activeTab === 'properties' ? (
                // --- PROPERTIES TAB ---
                selectedIds.size > 1 ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="font-bold text-lg text-white flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-paprika" /> Çoklu Seçim
                                </h2>
                                <button onClick={() => setSelectedIds(new Set())} className="text-zinc-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1 rounded-md" title="Seçimi temizle" aria-label="Seçimi temizle"><X size={16}/></button>
                            </div>
                            <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 p-4 rounded-xl border border-white/5 mb-6 shadow-inner">
                                <p className="text-sm font-bold text-paprika">{selectedIds.size} Öğe Seçildi</p>
                                <p className="text-xs text-zinc-400 mt-1">Grup işlemi yapmak için komutları kullanın.</p>
                            </div>
                            
                            <button 
                                onClick={handleDeleteSelected}
                                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 py-3 rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
                            >
                                <Trash2 size={16} /> Seçilenleri Sil
                            </button>
                        </div>
                    </div>
                ) : selectedInstance && selectedTemplate ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="font-bold text-lg text-white flex items-center gap-2">
                                    <CircuitBoard className="w-5 h-5 text-paprika" /> Özellikler
                                </h2>
                                <button onClick={() => setSelectedIds(new Set())} className="text-zinc-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1 rounded-md" title="Seçimi temizle" aria-label="Seçimi temizle"><X size={16}/></button>
                            </div>
                            
                            <div className="bg-black/20 rounded-xl p-4 border border-white/5 mb-4">
                                <h3 className="text-base font-bold text-alabaster">{selectedTemplate.name}</h3>
                                <p className="text-xs text-apricot font-mono mt-1 font-medium bg-apricot/10 inline-block px-1.5 py-0.5 rounded">{selectedTemplate.modelNumber || 'Model No Yok'}</p>
                            </div>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleCopyInstance}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white py-2.5 rounded-lg text-xs font-bold flex justify-center items-center gap-2 border border-white/5 transition active:scale-95"
                                >
                                    <Copy size={14} /> Kopyala
                                </button>
                                <button 
                                    onClick={handleDuplicateInstance}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white py-2.5 rounded-lg text-xs font-bold flex justify-center items-center gap-2 border border-white/5 transition active:scale-95"
                                >
                                    <ClipboardCopy size={14} /> Çoğalt
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
                            {/* LABEL SETTINGS */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                        <Type size={12}/> Etiket
                                    </h4>
                                    <button 
                                        onClick={() => updateInstanceLabelConfig('visible', !selectedInstance.labelConfig?.visible)}
                                        className={`p-1.5 rounded-md transition-colors ${selectedInstance.labelConfig?.visible ? 'bg-paprika/20 text-paprika' : 'bg-zinc-800 text-zinc-500'}`}
                                        title={selectedInstance.labelConfig?.visible ? 'Gizle' : 'Göster'}
                                    >
                                        {selectedInstance.labelConfig?.visible ? <Eye size={14}/> : <EyeOff size={14}/>}
                                    </button>
                                </div>
                                
                                {selectedInstance.labelConfig?.visible !== false && (
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-4">
                                        <div className="grid grid-cols-3 gap-1 bg-zinc-900/50 p-1 rounded-lg border border-white/5">
                                            {['top', 'center', 'bottom'].map((pos) => (
                                                <button
                                                    key={pos}
                                                    onClick={() => updateInstanceLabelConfig('position', pos)}
                                                    className={`text-[10px] font-bold py-1.5 rounded-md uppercase transition-all ${selectedInstance.labelConfig?.position === pos ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                                >
                                                    {pos === 'top' ? 'Üst' : pos === 'bottom' ? 'Alt' : 'Orta'}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        <div>
                                            <div className="flex justify-between text-[10px] font-bold text-zinc-500 mb-1.5">
                                                <span>Boyut</span>
                                                <span>{selectedInstance.labelConfig?.fontSize || 14}px</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="8" max="48" 
                                                value={selectedInstance.labelConfig?.fontSize || 14}
                                                onChange={(e) => updateInstanceLabelConfig('fontSize', Number(e.target.value))}
                                                className="w-full accent-paprika h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                                                aria-label="Yazı tipi boyutu"
                                                title="Yazı tipi boyutu"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-zinc-500 block mb-1.5">Metin</label>
                                                <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-lg border border-white/5">
                                                    <input 
                                                        type="color" 
                                                        value={selectedInstance.labelConfig?.color || '#ffffff'}
                                                        onChange={(e) => updateInstanceLabelConfig('color', e.target.value)}
                                                        className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                                                        aria-label="Metin rengi"
                                                        title="Metin rengi"
                                                    />
                                                    <span className="text-[10px] font-mono text-zinc-400 uppercase">{selectedInstance.labelConfig?.color}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-zinc-500 block mb-1.5">Arka Plan</label>
                                                <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-lg border border-white/5">
                                                    <input 
                                                        type="color" 
                                                        value={selectedInstance.labelConfig?.backgroundColor || '#000000'}
                                                        onChange={(e) => updateInstanceLabelConfig('backgroundColor', e.target.value)}
                                                        className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                                                        aria-label="Arka plan rengi"
                                                        title="Arka plan rengi"
                                                    />
                                                    <span className="text-[10px] font-mono text-zinc-400 uppercase">{selectedInstance.labelConfig?.backgroundColor}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="h-px bg-white/5 my-2"></div>

                            <div>
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Bağlantı Noktaları</h4>
                                <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                                    <img src={selectedTemplate.imageUrl} alt={selectedTemplate.name} className="w-full h-32 object-contain bg-white/5 border-b border-white/5 p-4"/>
                                    
                                    <div className="divide-y divide-white/5">
                                        {selectedTemplate.ports.map(port => (
                                            <div key={port.id} className="p-3 flex justify-between items-center group hover:bg-white/5 transition-colors">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full shadow-sm ${port.type === 'input' ? 'bg-blue-500 shadow-blue-500/50' : port.type === 'output' ? 'bg-red-500 shadow-red-500/50' : 'bg-paprika shadow-paprika/50'}`}></div>
                                                        <span className="text-xs font-bold text-zinc-200 truncate" title={port.label}>{port.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 mt-1 pl-4">
                                                        {port.isPower && <Zap size={10} className="text-apricot fill-apricot"/>}
                                                        <span className="truncate">{CONNECTOR_LABELS[port.connectorType]}</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleRemovePortFromInstance(selectedTemplate.id, port.id)}
                                                    className="text-zinc-600 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Portu Kaldır"
                                                >
                                                    <Trash2 size={14}/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-zinc-600 bg-ink/50">
                        <div className="mb-4 opacity-10 bg-white w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl">
                            <CircuitBoard size={40}/>
                        </div>
                        <p className="font-bold text-zinc-500">Seçim Yapılmadı</p>
                        <p className="text-xs mt-2 text-center text-zinc-600 leading-relaxed">Düzenlemek veya detayları görmek için<br/>sahneden bir nesne seçin.</p>
                    </div>
                )
            ) : (
                // --- LAYERS TAB ---
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                    {/* INSTANCES */}
                    <div>
                        <div className="flex items-center justify-between mb-2 px-2">
                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Box size={12}/> Cihazlar ({instances.length})</h4>
                        </div>
                        <div className="space-y-1">
                            {instances.map(inst => {
                                const t = templates.find(temp => temp.id === inst.templateId);
                                return (
                                    <div key={inst.id} className={`flex items-center justify-between p-2 rounded-lg border ${selectedIds.has(inst.id) ? 'bg-paprika/10 border-paprika/30' : 'bg-zinc-800/30 border-white/5'} hover:bg-zinc-800 transition-colors group`}>
                                        <div className="flex items-center gap-2 truncate cursor-pointer flex-1" onClick={() => setSelectedIds(new Set([inst.id]))}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-paprika"></div>
                                            <span className={`text-xs font-medium truncate ${inst.hidden ? 'text-zinc-600' : 'text-zinc-300'}`}>{t?.name || 'Bilinmeyen'}</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100">
                                            <button onClick={() => toggleHide('instance', inst.id, inst.hidden || false)} className={`p-1 rounded hover:bg-white/10 ${inst.hidden ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                                {inst.hidden ? <EyeOff size={12}/> : <Eye size={12}/>}
                                            </button>
                                            <button onClick={() => toggleLock('instance', inst.id, inst.locked || false)} className={`p-1 rounded hover:bg-white/10 ${inst.locked ? 'text-apricot' : 'text-zinc-400'}`}>
                                                {inst.locked ? <Lock size={12}/> : <Unlock size={12}/>}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {instances.length === 0 && <p className="text-xs text-zinc-600 italic px-2">Cihaz yok</p>}
                        </div>
                    </div>

                    {/* CONNECTIONS */}
                    <div>
                        <div className="flex items-center justify-between mb-2 px-2">
                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><CircuitBoard size={12}/> Bağlantılar ({connections.length})</h4>
                        </div>
                        <div className="space-y-1">
                            {connections.map(conn => (
                                <div key={conn.id} className="flex items-center justify-between p-2 rounded-lg border bg-zinc-800/30 border-white/5 hover:bg-zinc-800 transition-colors group">
                                    <div className="flex items-center gap-2 truncate flex-1">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: conn.color || '#6366f1' }}></div>
                                        <span className={`text-xs font-medium truncate font-mono ${conn.hidden ? 'text-zinc-600' : 'text-zinc-400'}`}>{conn.label || conn.id.slice(0,8)}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100">
                                        <button onClick={() => toggleHide('connection', conn.id, conn.hidden || false)} className={`p-1 rounded hover:bg-white/10 ${conn.hidden ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                            {conn.hidden ? <EyeOff size={12}/> : <Eye size={12}/>}
                                        </button>
                                        <button onClick={() => toggleLock('connection', conn.id, conn.locked || false)} className={`p-1 rounded hover:bg-white/10 ${conn.locked ? 'text-apricot' : 'text-zinc-400'}`}>
                                            {conn.locked ? <Lock size={12}/> : <Unlock size={12}/>}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {connections.length === 0 && <p className="text-xs text-zinc-600 italic px-2">Bağlantı yok</p>}
                        </div>
                    </div>
                    
                    {/* ZONES & TEXTS & COMMENTS */}
                    <div>
                         <div className="flex items-center justify-between mb-2 px-2">
                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Type size={12}/> Metinler, Bölgeler & Notlar</h4>
                        </div>
                        <div className="space-y-1">
                            {zones.map(z => (
                                <div key={z.id} className="flex items-center justify-between p-2 rounded-lg border bg-zinc-800/30 border-white/5 hover:bg-zinc-800 transition-colors group">
                                    <div className="flex items-center gap-2 truncate flex-1 cursor-pointer" onClick={() => setSelectedIds(new Set([z.id]))}>
                                        <span className={`text-[10px] px-1 rounded bg-white/10 ${z.hidden ? 'text-zinc-600' : 'text-zinc-400'}`}>ZONE</span>
                                        <span className={`text-xs font-medium truncate ${z.hidden ? 'text-zinc-600' : 'text-zinc-300'}`}>{z.label}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100">
                                        <button onClick={() => toggleHide('zone', z.id, z.hidden || false)} className={`p-1 rounded hover:bg-white/10 ${z.hidden ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                            {z.hidden ? <EyeOff size={12}/> : <Eye size={12}/>}
                                        </button>
                                        <button onClick={() => toggleLock('zone', z.id, z.locked || false)} className={`p-1 rounded hover:bg-white/10 ${z.locked ? 'text-apricot' : 'text-zinc-400'}`}>
                                            {z.locked ? <Lock size={12}/> : <Unlock size={12}/>}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {textNodes.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg border bg-zinc-800/30 border-white/5 hover:bg-zinc-800 transition-colors group">
                                    <div className="flex items-center gap-2 truncate flex-1 cursor-pointer" onClick={() => setSelectedIds(new Set([t.id]))}>
                                        <span className={`text-[10px] px-1 rounded bg-white/10 ${t.hidden ? 'text-zinc-600' : 'text-zinc-400'}`}>TXT</span>
                                        <span className={`text-xs font-medium truncate ${t.hidden ? 'text-zinc-600' : 'text-zinc-300'}`}>{t.content}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100">
                                        <button onClick={() => toggleHide('text', t.id, t.hidden || false)} className={`p-1 rounded hover:bg-white/10 ${t.hidden ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                            {t.hidden ? <EyeOff size={12}/> : <Eye size={12}/>}
                                        </button>
                                        <button onClick={() => toggleLock('text', t.id, t.locked || false)} className={`p-1 rounded hover:bg-white/10 ${t.locked ? 'text-apricot' : 'text-zinc-400'}`}>
                                            {t.locked ? <Lock size={12}/> : <Unlock size={12}/>}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {comments.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-2 rounded-lg border bg-zinc-800/30 border-white/5 hover:bg-zinc-800 transition-colors group">
                                    <div className="flex items-center gap-2 truncate flex-1 cursor-pointer" onClick={() => setSelectedIds(new Set([c.id]))}>
                                        <MessageSquare size={12} className="text-yellow-500"/>
                                        <span className={`text-xs font-medium truncate ${c.hidden ? 'text-zinc-600' : 'text-zinc-300'}`}>{c.content || '(Boş Not)'}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100">
                                        <button onClick={() => toggleHide('comment', c.id, c.hidden || false)} className={`p-1 rounded hover:bg-white/10 ${c.hidden ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                            {c.hidden ? <EyeOff size={12}/> : <Eye size={12}/>}
                                        </button>
                                        <button onClick={() => toggleLock('comment', c.id, c.locked || false)} className={`p-1 rounded hover:bg-white/10 ${c.locked ? 'text-apricot' : 'text-zinc-400'}`}>
                                            {c.locked ? <Lock size={12}/> : <Unlock size={12}/>}
                                        </button>
                                    </div>
                                </div>
                            ))}
                             {zones.length === 0 && textNodes.length === 0 && comments.length === 0 && <p className="text-xs text-zinc-600 italic px-2">Ek açıklama yok</p>}
                        </div>
                    </div>

                </div>
            )}
        </div>
      </div>
  );
};
