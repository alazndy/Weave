import React, { useState } from 'react';
import { PortDefinition, PortFlowType, ConnectorType, CONNECTOR_LABELS } from '../../types';
import { Zap, ArrowDownToLine, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export const EditPortModal = ({ port, onSave, onCancel, onDelete }: {
  port: PortDefinition;
  onSave: (p: PortDefinition) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}) => {
  const [label, setLabel] = useState(port.label);
  const [type, setType] = useState<PortFlowType>(port.type);
  const [connectorType, setConnectorType] = useState<ConnectorType>(port.connectorType);
  const [direction, setDirection] = useState<'top'|'bottom'|'left'|'right'>(port.direction || 'bottom'); 
  const [isPower, setIsPower] = useState(port.isPower || false);
  const [isGround, setIsGround] = useState(port.isGround || false);
  const [powerType, setPowerType] = useState<'AC' | 'DC'>(port.powerType || 'DC');
  const [voltage, setVoltage] = useState(port.voltage || '');
  const [amperage, setAmperage] = useState(port.amperage || '');
  const [customColor, setCustomColor] = useState(port.customColor || '');

  return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm no-print" onClick={onCancel}>
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl w-96 shadow-2xl transform transition-all" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-teal-400 mb-5">Port Düzenle</h3>
              
              <div className="space-y-5">
                  <div>
                      <label className="text-sm text-zinc-400 block mb-2 font-bold">Etiket</label>
                      <input 
                          value={label} 
                          onChange={e => setLabel(e.target.value)} 
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-4 py-2.5 text-base font-medium text-white focus:border-teal-500 outline-none focus:ring-1 focus:ring-teal-500/50"
                      />
                  </div>
                  
                  <div>
                      <label className="text-sm text-zinc-400 block mb-2 font-bold">Akış Yönü</label>
                      <select 
                          value={type}
                          onChange={e => setType(e.target.value as PortFlowType)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-4 py-2.5 text-base font-medium text-white focus:border-teal-500 outline-none"
                      >
                          <option value="input">Giriş (Input)</option>
                          <option value="output">Çıkış (Output)</option>
                          <option value="bidirectional">Çift Yönlü</option>
                      </select>
                  </div>

                  <div>
                      <label className="text-sm text-zinc-400 block mb-2 font-bold">Konnektör Tipi</label>
                      <select 
                          value={connectorType}
                          onChange={e => setConnectorType(e.target.value as ConnectorType)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-4 py-2.5 text-base font-medium text-white focus:border-teal-500 outline-none"
                      >
                           {Object.entries(CONNECTOR_LABELS).map(([k, v]) => (
                               <option key={k} value={k}>{v}</option>
                           ))}
                      </select>
                  </div>

                  <div>
                      <label className="text-sm text-zinc-400 block mb-2 font-bold">Çıkış Yönü (Kablo)</label>
                      <div className="flex gap-2 justify-center bg-zinc-950 p-2 rounded border border-zinc-800">
                          {['top', 'bottom', 'left', 'right'].map((dir) => (
                              <button
                                  key={dir}
                                  onClick={() => setDirection(dir as any)}
                                  className={`p-1.5 rounded border transition-colors ${direction === dir ? 'bg-teal-600 border-teal-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                                  title={dir === 'top' ? 'Üst' : dir === 'bottom' ? 'Alt' : dir === 'left' ? 'Sol' : 'Sağ'}
                              >
                                  {dir === 'top' ? <ChevronUp size={16}/> : dir === 'bottom' ? <ChevronDown size={16}/> : dir === 'left' ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
                              </button>
                          ))}
                      </div>
                  </div>
                  
                  <div>
                      <label className="text-sm text-zinc-400 block mb-2 font-bold">Özel Renk</label>
                      <div className="flex gap-2 items-center">
                          <input 
                              type="color" 
                              value={customColor || '#ffffff'} 
                              onChange={e => setCustomColor(e.target.value)} 
                              className="w-8 h-8 rounded cursor-pointer border-none"
                          />
                          <button onClick={() => setCustomColor('')} className="text-xs text-zinc-500 hover:text-red-400 underline">Varsayılan</button>
                      </div>
                  </div>
                  
                  <div className="bg-zinc-950 p-4 rounded border border-zinc-800">
                      <div className="flex justify-between">
                          <label className="flex items-center gap-3 cursor-pointer mb-3">
                              <input 
                                  type="checkbox" 
                                  checked={isPower} 
                                  onChange={e => { setIsPower(e.target.checked); if(!e.target.checked) setIsGround(false); }}
                                  className="w-5 h-5 accent-teal-500"
                              />
                              <span className="text-base font-bold text-zinc-300 flex items-center gap-2">
                                  <Zap size={18} className={isPower ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-500'} />
                                  Güç
                              </span>
                          </label>

                          {isPower && (
                             <label className="flex items-center gap-2 cursor-pointer mb-3">
                                  <input 
                                      type="checkbox" 
                                      checked={isGround} 
                                      onChange={e => setIsGround(e.target.checked)}
                                      className="w-4 h-4 accent-zinc-500"
                                  />
                                  <span className="text-sm font-bold text-zinc-300">GND (Toprak)</span>
                              </label>
                          )}
                      </div>

                      {isPower && (
                          <div className={`grid grid-cols-3 gap-3 animate-in fade-in ${isGround ? 'opacity-50 pointer-events-none' : ''}`}>
                               <div className="col-span-1">
                                   <label className="text-xs font-bold text-zinc-500 mb-1 block">Tip</label>
                                   <select 
                                       value={powerType}
                                       onChange={e => setPowerType(e.target.value as 'AC'|'DC')}
                                       className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-2 text-sm font-bold text-white"
                                   >
                                       <option value="DC">DC</option>
                                       <option value="AC">AC</option>
                                   </select>
                               </div>
                               <div className="col-span-1">
                                   <label className="text-xs font-bold text-zinc-500 mb-1 block">Volt</label>
                                   <input 
                                       value={voltage}
                                       onChange={e => setVoltage(e.target.value)}
                                       className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-2 text-sm font-bold text-white"
                                       placeholder="24"
                                   />
                               </div>
                               <div className="col-span-1">
                                   <label className="text-xs font-bold text-zinc-500 mb-1 block">Amper</label>
                                   <input 
                                       value={amperage}
                                       onChange={e => setAmperage(e.target.value)}
                                       className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-2 text-sm font-bold text-white"
                                       placeholder="-"
                                   />
                               </div>
                          </div>
                      )}
                  </div>

                  <div className="flex justify-between pt-4 mt-2 border-t border-zinc-800 items-center">
                      {onDelete && (
                        <button 
                          onClick={() => onDelete(port.id)} 
                          className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm font-bold shadow-lg transition-all active:scale-95"
                        >
                          Portu Sil
                        </button>
                      )}
                      <div className="flex gap-3 ml-auto">
                        <button onClick={onCancel} className="px-4 py-2.5 text-sm font-bold text-zinc-400 hover:text-white transition-colors">İptal</button>
                        <button 
                            onClick={() => onSave({ 
                                ...port, 
                                label, 
                                type, 
                                connectorType, 
                                direction,
                                isPower,
                                isGround,
                                powerType: isPower ? powerType : undefined,
                                voltage: isPower ? voltage : undefined,
                                amperage: isPower ? amperage : undefined,
                                customColor: customColor || undefined
                            })} 
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-md text-sm font-bold shadow-lg shadow-teal-900/20 transition-all active:scale-95"
                        >
                            Kaydet
                        </button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  )
};