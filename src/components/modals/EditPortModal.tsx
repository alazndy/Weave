import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { PortDetailDialog } from './PortDetailDialog';
import { cleanDetail } from '../../utils/portDetail';
import { PortDefinition, PortFlowType, ConnectorType, CONNECTOR_LABELS, connectorLabel } from '../../types';
import { Zap, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export const EditPortModal = ({ port, onSave, onCancel, onDelete, onShowCard }: {
  port: PortDefinition;
  onSave: (p: PortDefinition) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  /** Saves the port and puts its detail card on the sheet. */
  onShowCard?: (p: PortDefinition) => void;
}) => {
  const { t } = useTranslation();
  const [detail, setDetail] = useState(port.detail);
  const [detailOpen, setDetailOpen] = useState(false);
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

  const edited = (): PortDefinition => ({
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
      customColor: customColor || undefined,
      detail,
  });

  // portal: keeps the dialog above the toolbar and page bar, which live in other stacking contexts
  return createPortal(
      <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm no-print" onClick={onCancel} onWheel={e => e.stopPropagation()}>
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl w-96 max-h-[calc(100vh-2rem)] overflow-y-auto shadow-2xl transform transition-all" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-teal-400 mb-5">{t('portDialog.title')}</h3>
              
              <div className="space-y-5">
                  <div>
                      <label className="text-sm text-zinc-400 block mb-2 font-bold">{t('port.label')}</label>
                      <input 
                          value={label} 
                          onChange={e => setLabel(e.target.value)} 
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-4 py-2.5 text-base font-medium text-white focus:border-teal-500 outline-none focus:ring-1 focus:ring-teal-500/50"
                      />
                  </div>
                  
                  <div>
                      <label className="text-sm text-zinc-400 block mb-2 font-bold">{t('portDialog.flow')}</label>
                      <select 
                          value={type}
                          onChange={e => setType(e.target.value as PortFlowType)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-4 py-2.5 text-base font-medium text-white focus:border-teal-500 outline-none"
                      >
                          <option value="input">{t('port.input')}</option>
                          <option value="output">{t('port.output')}</option>
                          <option value="bidirectional">{t('port.bidirectional')}</option>
                      </select>
                  </div>

                  <div>
                      <label className="text-sm text-zinc-400 block mb-2 font-bold">{t('portDialog.connectorType')}</label>
                      <select 
                          value={connectorType}
                          onChange={e => setConnectorType(e.target.value as ConnectorType)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-4 py-2.5 text-base font-medium text-white focus:border-teal-500 outline-none"
                      >
                           {(Object.keys(CONNECTOR_LABELS) as ConnectorType[]).map(k => (
                               <option key={k} value={k}>{connectorLabel(k, t)}</option>
                           ))}
                      </select>
                  </div>

                  <div>
                      <label className="text-sm text-zinc-400 block mb-2 font-bold">{t('portDialog.exit')}</label>
                      <div className="flex gap-2 justify-center bg-zinc-950 p-2 rounded border border-zinc-800">
                          {['top', 'bottom', 'left', 'right'].map((dir) => (
                              <button
                                  key={dir}
                                  onClick={() => setDirection(dir as any)}
                                  className={`p-1.5 rounded border transition-colors ${direction === dir ? 'bg-teal-600 border-teal-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                                  title={dir === 'top' ? t('side.top') : dir === 'bottom' ? t('side.bottom') : dir === 'left' ? t('side.left') : t('side.right')}
                              >
                                  {dir === 'top' ? <ChevronUp size={16}/> : dir === 'bottom' ? <ChevronDown size={16}/> : dir === 'left' ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
                              </button>
                          ))}
                      </div>
                  </div>
                  
                  <div>
                      <label className="text-sm text-zinc-400 block mb-2 font-bold">{t('portDialog.customColor')}</label>
                      <div className="flex gap-2 items-center">
                          <input 
                              type="color" 
                              value={customColor || '#ffffff'} 
                              onChange={e => setCustomColor(e.target.value)} 
                              className="w-8 h-8 rounded cursor-pointer border-none"
                          />
                          <button onClick={() => setCustomColor('')} className="text-xs text-zinc-500 hover:text-red-400 underline">{t('colors.default')}</button>
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
                                  {t('port.power')}
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
                                  <span className="text-sm font-bold text-zinc-300">{t('portDialog.gnd')}</span>
                              </label>
                          )}
                      </div>

                      {isPower && (
                          <div className={`grid grid-cols-3 gap-3 animate-in fade-in ${isGround ? 'opacity-50 pointer-events-none' : ''}`}>
                               <div className="col-span-1">
                                   <label className="text-xs font-bold text-zinc-500 mb-1 block">{t('portDialog.powerKind')}</label>
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
                                   <label className="text-xs font-bold text-zinc-500 mb-1 block">{t('portDialog.volt')}</label>
                                   <input 
                                       value={voltage}
                                       onChange={e => setVoltage(e.target.value)}
                                       className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-2 text-sm font-bold text-white"
                                       placeholder="24"
                                   />
                               </div>
                               <div className="col-span-1">
                                   <label className="text-xs font-bold text-zinc-500 mb-1 block">{t('portDialog.amp')}</label>
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

                  <div className="flex gap-2">
                      <button type="button" onClick={() => setDetailOpen(true)} className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-bold text-zinc-200 hover:bg-zinc-700">
                          {t('portDetail.open')}
                      </button>
                      {onShowCard && (
                          <button type="button" disabled={!(detail && cleanDetail(detail))} onClick={() => onShowCard(edited())}
                              className="flex-1 rounded-md bg-teal-700 px-3 py-2 text-sm font-bold text-white hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-40">
                              {t('portDialog.showOnSheet')}
                          </button>
                      )}
                  </div>

                  <div className="flex justify-between pt-4 mt-2 border-t border-zinc-800 items-center">
                      {onDelete && (
                        <button 
                          onClick={() => onDelete(port.id)} 
                          className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-md text-sm font-bold shadow-lg transition-all active:scale-95"
                        >
                          {t('portDialog.delete')}
                        </button>
                      )}
                      <div className="flex gap-3 ml-auto">
                        <button onClick={onCancel} className="px-4 py-2.5 text-sm font-bold text-zinc-400 hover:text-white transition-colors">{t('common.cancel')}</button>
                        <button 
                            onClick={() => onSave(edited())} 
                            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-md text-sm font-bold shadow-lg shadow-teal-900/20 transition-all active:scale-95"
                        >
                            {t('common.save')}
                        </button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
      {detailOpen && (
          <div onWheel={e => e.stopPropagation()}><PortDetailDialog title={label} connectorType={connectorType} detail={detail}
              onSave={d => { setDetail(d); setDetailOpen(false); }} onCancel={() => setDetailOpen(false)} /></div>
      )}
      </>,
      document.body
  );
};
