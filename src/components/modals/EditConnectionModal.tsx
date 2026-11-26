
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Connection, ConnectionShape, LineStyle } from '../../types';
import { Spline, Minus, CornerDownRight, Slash, GripHorizontal, MoreHorizontal } from 'lucide-react';

export const EditConnectionModal = ({ connection, onSave, onCancel }: {
  connection: Connection;
  onSave: (c: Connection) => void;
  onCancel: () => void;
}) => {
  const { t } = useTranslation();
  const [label, setLabel] = useState(connection.label || '');
  const [color, setColor] = useState(connection.color || '#6366f1');
  const [shape, setShape] = useState<ConnectionShape>(connection.shape || 'curved');
  const [lineStyle, setLineStyle] = useState<LineStyle>(connection.lineStyle || 'solid');
  const [cornerRadius, setCornerRadius] = useState<number>(connection.cornerRadius || 0);
  const [strokeWidth, setStrokeWidth] = useState<'thin'|'normal'|'thick'>(connection.strokeWidth || 'normal');
  const [arrowHead, setArrowHead] = useState<'none'|'start'|'end'|'both'>(connection.arrowHead || 'none');

  const PRESET_COLORS = [
      { name: t('colors.black'), value: '#000000' },
      { name: t('colors.red'), value: '#ff0000' },
      { name: t('colors.blue'), value: '#3b82f6' },
      { name: t('colors.yellow'), value: '#eab308' },
      { name: t('colors.green'), value: '#22c55e' },
      { name: t('colors.white'), value: '#ffffff' },
      { name: t('colors.gray'), value: '#71717a' },
      { name: t('colors.orange'), value: '#f97316' },
      { name: t('colors.purple'), value: '#a855f7' },
      { name: t('colors.default'), value: '#6366f1' }
  ];

  return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm no-print" onClick={onCancel}>
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl w-[400px] shadow-2xl transform transition-all max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-indigo-400 mb-5">{t('connectionDialog.title')}</h3>
              
              <div className="space-y-5">
                  <div>
                      <label className="text-sm text-zinc-400 block mb-2 font-bold">{t('connectionDialog.labelField')}</label>
                      <input 
                          value={label} 
                          onChange={e => setLabel(e.target.value)} 
                          placeholder={t('connectionDialog.labelPlaceholder')}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-md px-4 py-2.5 text-base font-medium text-white focus:border-indigo-500 outline-none"
                      />
                  </div>
                  
                  <div>
                      <label className="text-sm text-zinc-400 block mb-2 font-bold">{t('connectionDialog.lineShape')}</label>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                           <button onClick={() => setShape('curved')} className={`p-2 rounded border flex flex-col items-center gap-1 ${shape === 'curved' ? 'bg-indigo-900/50 border-indigo-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}><Spline size={18}/><span className="text-[9px]">{t('line.curved')}</span></button>
                           <button onClick={() => setShape('straight')} className={`p-2 rounded border flex flex-col items-center gap-1 ${shape === 'straight' ? 'bg-indigo-900/50 border-indigo-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}><Slash size={18} className="-rotate-45"/><span className="text-[9px]">{t('line.straight')}</span></button>
                           <button onClick={() => setShape('orthogonal')} className={`p-2 rounded border flex flex-col items-center gap-1 ${shape === 'orthogonal' ? 'bg-indigo-900/50 border-indigo-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}><CornerDownRight size={18}/><span className="text-[9px]">{t('line.orthogonal')}</span></button>
                      </div>

                      {shape === 'orthogonal' && (
                        <div className="bg-zinc-950 p-2 rounded border border-zinc-800 mb-3 animate-in fade-in">
                             <div className="flex justify-between mb-1">
                                <label className="text-[10px] text-zinc-400 font-bold">{t('connectionDialog.cornerRadius')}</label>
                                <span className="text-[10px] text-zinc-500">{cornerRadius}px</span>
                             </div>
                             <input 
                                type="range" 
                                min="0" max="50" step="5"
                                value={cornerRadius}
                                onChange={e => setCornerRadius(Number(e.target.value))}
                                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                             />
                        </div>
                      )}
                      
                      <label className="text-sm text-zinc-400 block mb-2 font-bold mt-2">{t('connectionDialog.lineType')}</label>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                          <button onClick={() => setLineStyle('solid')} className={`p-2 rounded border flex flex-col items-center gap-1 ${lineStyle === 'solid' ? 'bg-indigo-900/50 border-indigo-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}><Minus size={18}/><span className="text-[9px]">{t('line.solid')}</span></button>
                          <button onClick={() => setLineStyle('dashed')} className={`p-2 rounded border flex flex-col items-center gap-1 ${lineStyle === 'dashed' ? 'bg-indigo-900/50 border-indigo-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}><GripHorizontal size={18}/><span className="text-[9px]">{t('line.dashed')}</span></button>
                          <button onClick={() => setLineStyle('dotted')} className={`p-2 rounded border flex flex-col items-center gap-1 ${lineStyle === 'dotted' ? 'bg-indigo-900/50 border-indigo-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'}`}><MoreHorizontal size={18}/><span className="text-[9px]">{t('line.dotted')}</span></button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                          <div>
                               <label className="text-[10px] text-zinc-500 block mb-1 font-bold">{t('line.thickness')}</label>
                               <select value={strokeWidth} onChange={e => setStrokeWidth(e.target.value as any)} className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white">
                                   <option value="thin">{t('line.thin')}</option>
                                   <option value="normal">{t('line.normal')}</option>
                                   <option value="thick">{t('line.thick')}</option>
                               </select>
                          </div>
                          <div>
                               <label className="text-[10px] text-zinc-500 block mb-1 font-bold">{t('connectionDialog.arrow')}</label>
                               <select value={arrowHead} onChange={e => setArrowHead(e.target.value as any)} className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white">
                                   <option value="none">{t('common.none')}</option>
                                   <option value="start">{t('connectionDialog.arrowStart')}</option>
                                   <option value="end">{t('connectionDialog.arrowEnd')}</option>
                                   <option value="both">{t('connectionDialog.arrowBoth')}</option>
                               </select>
                          </div>
                      </div>
                  </div>

                  <div>
                      <label className="text-sm text-zinc-400 block mb-2 font-bold">{t('connectionDialog.cableColor')}</label>
                      <div className="grid grid-cols-5 gap-3 mb-3">
                          {PRESET_COLORS.map(c => (
                              <button
                                  key={c.value}
                                  onClick={() => setColor(c.value)}
                                  className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${color === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                                  style={{ backgroundColor: c.value }}
                                  title={t(c.name)}
                              />
                          ))}
                      </div>
                      <input 
                        type="color" 
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-zinc-800">
                      <button onClick={onCancel} className="px-4 py-2.5 text-sm font-bold text-zinc-400 hover:text-white transition-colors">{t('common.cancel')}</button>
                      <button 
                          onClick={() => onSave({ ...connection, label, color, shape, lineStyle, cornerRadius, strokeWidth, arrowHead })} 
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-bold shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
                      >
                          {t('common.save')}
                      </button>
                  </div>
              </div>
          </div>
      </div>
  )
};
