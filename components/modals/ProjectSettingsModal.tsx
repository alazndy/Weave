import React, { useState, useRef } from 'react';
import { ProjectMetadata, CustomField, PaperSize, Orientation } from '../../types';
import { Settings, X, Upload, RefreshCw, LayoutTemplate, ArrowLeftRight, Plus, Trash2, Save } from 'lucide-react';

interface ProjectSettingsModalProps {
  metadata: ProjectMetadata;
  onSave: (data: ProjectMetadata) => void;
  onRescaleInstances: (newPixelScale: number) => void;
  onCancel: () => void;
}

const generateDocNo = (projectName: string, revision: string) => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const acronym = projectName
    .trim()
    .split(/\s+/)
    .map(word => word[0])
    .join('')
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6) || 'TSP';
  const cleanRev = revision.replace(/[^a-zA-Z0-9]/g, '');
  return `${acronym}-${date}-${cleanRev}`;
};

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({ metadata, onSave, onRescaleInstances, onCancel }) => {
  const [formData, setFormData] = useState<ProjectMetadata>(metadata);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, companyLogo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateDocNo = () => {
    const newNo = generateDocNo(formData.projectName, formData.revision);
    setFormData(prev => ({ ...prev, documentNo: newNo }));
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: crypto.randomUUID(),
      label: 'Yeni Alan',
      value: ''
    };
    setFormData(prev => ({ ...prev, customFields: [...prev.customFields, newField] }));
  };

  const removeCustomField = (id: string) => {
    setFormData(prev => ({ ...prev, customFields: prev.customFields.filter(f => f.id !== id) }));
  };

  const updateCustomField = (id: string, key: 'label' | 'value', val: string) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.map(f => f.id === id ? { ...f, [key]: val } : f)
    }));
  };
  
  const removeExternalPart = (id: string) => {
      setFormData(prev => ({
          ...prev,
          externalParts: prev.externalParts.filter(p => p.id !== id)
      }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[80] no-print p-4">
      <div className="bg-zinc-900/95 border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
          <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 flex items-center gap-3">
            <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 p-2 rounded-lg border border-teal-500/20">
                <Settings className="w-5 h-5 text-teal-400" /> 
            </div>
            Proje Detayları
          </h3>
          <button onClick={onCancel} className="text-zinc-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Logo Section */}
          <div className="flex items-center gap-6">
            <div 
              className="w-24 h-24 bg-black/40 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:border-teal-500/50 hover:bg-teal-500/5 transition-all relative group shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.companyLogo ? (
                <img src={formData.companyLogo} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <Upload className="w-8 h-8 text-zinc-600 group-hover:text-teal-500 transition-colors" />
              )}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-white">
                Değiştir
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-base font-bold text-zinc-200 mb-1">Şirket Logosu</label>
              <p className="text-sm text-zinc-500">Teknik çizim antetinde görünecek logo. PNG veya SVG önerilir.</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 border-b border-white/5 pb-8">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Şirket Adı</label>
              <input 
                type="text" 
                value={formData.companyName}
                onChange={e => setFormData({...formData, companyName: e.target.value})}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-base font-medium text-white focus:border-teal-500/50 focus:bg-zinc-950 outline-none transition-colors"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Müşteri</label>
              <input 
                type="text" 
                value={formData.customerName || ''}
                onChange={e => setFormData({...formData, customerName: e.target.value})}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-base font-medium text-white focus:border-teal-500/50 focus:bg-zinc-950 outline-none transition-colors"
                placeholder="Müşteri Adı / Firma"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Proje Başlığı</label>
              <input 
                type="text" 
                value={formData.projectName}
                onChange={e => setFormData({...formData, projectName: e.target.value})}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-base font-medium text-white focus:border-teal-500/50 focus:bg-zinc-950 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Hazırlayan</label>
              <input 
                type="text" 
                value={formData.preparedBy}
                onChange={e => setFormData({...formData, preparedBy: e.target.value})}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-sm font-medium text-white focus:border-teal-500/50 focus:bg-zinc-950 outline-none transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Onaylayan</label>
              <input 
                type="text" 
                value={formData.approvedBy}
                onChange={e => setFormData({...formData, approvedBy: e.target.value})}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-sm font-medium text-white focus:border-teal-500/50 focus:bg-zinc-950 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Revizyon</label>
              <input 
                type="text" 
                value={formData.revision}
                onChange={e => setFormData({...formData, revision: e.target.value})}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-sm font-medium text-white focus:border-teal-500/50 focus:bg-zinc-950 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Döküman No</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={formData.documentNo}
                  onChange={e => setFormData({...formData, documentNo: e.target.value})}
                  className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-sm font-medium text-white focus:border-teal-500/50 focus:bg-zinc-950 outline-none transition-colors font-mono"
                />
                <button 
                  onClick={handleGenerateDocNo}
                  className="bg-white/5 hover:bg-teal-500/10 text-zinc-400 hover:text-teal-400 px-3 py-2 rounded-lg border border-white/5 transition-colors flex items-center gap-2 text-xs font-bold whitespace-nowrap"
                  title="Oto. Oluştur"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Tarih</label>
              <input 
                type="text" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-sm font-medium text-white focus:border-teal-500/50 focus:bg-zinc-950 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Görünür Ölçek</label>
              <input 
                type="text" 
                value={formData.scale}
                onChange={e => setFormData({...formData, scale: e.target.value})}
                className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-sm font-medium text-white focus:border-teal-500/50 focus:bg-zinc-950 outline-none transition-colors"
                placeholder="Örn: 1:10"
              />
            </div>

            <div className="col-span-2 bg-gradient-to-br from-blue-900/10 to-transparent p-6 rounded-xl border border-blue-500/20">
                <h4 className="text-sm font-bold text-blue-200 mb-5 flex items-center gap-2">
                    <LayoutTemplate size={18} className="text-blue-400"/> Sayfa Yapısı & Ölçek
                </h4>
                
                <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                        <label className="block text-xs font-bold text-blue-200/50 uppercase mb-2">Kağıt Boyutu</label>
                        <select 
                            value={formData.paperSize}
                            onChange={e => setFormData({...formData, paperSize: e.target.value as PaperSize})}
                            className="w-full bg-black/40 border border-blue-500/20 rounded-lg px-3 py-2.5 text-sm font-bold text-blue-100 focus:border-blue-400/50 outline-none appearance-none"
                        >
                            <option value="A3">A3 (420 x 297 mm)</option>
                            <option value="A4">A4 (297 x 210 mm)</option>
                            <option value="A6">A6 (148 x 105 mm)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-blue-200/50 uppercase mb-2">Yönlendirme</label>
                        <select 
                            value={formData.orientation}
                            onChange={e => setFormData({...formData, orientation: e.target.value as Orientation})}
                            className="w-full bg-black/40 border border-blue-500/20 rounded-lg px-3 py-2.5 text-sm font-bold text-blue-100 focus:border-blue-400/50 outline-none appearance-none"
                        >
                            <option value="landscape">Yatay (Landscape)</option>
                            <option value="portrait">Dikey (Portrait)</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-end gap-4 pt-4 border-t border-blue-500/20">
                    <div className="flex-1">
                         <label className="block text-xs font-bold text-blue-200/50 uppercase mb-2">Piksel Ölçeği (px/mm)</label>
                         <div className="flex items-center gap-3">
                             <input 
                                type="number" 
                                value={formData.pixelScale}
                                onChange={e => setFormData({...formData, pixelScale: Number(e.target.value)})}
                                className="w-24 bg-black/40 border border-blue-500/20 rounded-lg px-3 py-2 text-sm font-bold text-blue-100 focus:border-blue-400/50 outline-none"
                                step="0.1"
                                min="0.1"
                             />
                             <span className="text-xs font-medium text-blue-300/70 whitespace-nowrap">1 mm = {formData.pixelScale} px</span>
                         </div>
                    </div>
                    <button 
                        onClick={() => onRescaleInstances(formData.pixelScale)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-900/30 transition-all hover:scale-105"
                    >
                        <ArrowLeftRight size={16}/> Tümünü Yeniden Boyutlandır
                    </button>
                </div>
            </div>
          </div>

          {/* Custom Fields Section */}
          <div className="border-b border-white/5 pb-8">
            <div className="flex justify-between items-center mb-5">
               <label className="block text-sm font-bold text-zinc-200">Özel Alanlar</label>
               <button 
                 onClick={addCustomField}
                 className="text-xs font-bold bg-white/5 hover:bg-white/10 text-teal-400 border border-white/5 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
               >
                 <Plus size={14} /> Alan Ekle
               </button>
            </div>
            
            {formData.customFields.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-white/5">
                  <p className="text-xs text-zinc-500">Ekstra bilgi alanı eklenmedi.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.customFields.map((field) => (
                  <div key={field.id} className="flex gap-3 items-center animate-in fade-in slide-in-from-bottom-2">
                     <input 
                       type="text"
                       placeholder="Başlık (Örn: Kontrol Eden)"
                       value={field.label}
                       onChange={e => updateCustomField(field.id, 'label', e.target.value)}
                       className="w-1/3 bg-zinc-950/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 focus:border-teal-500/50 outline-none transition-colors"
                     />
                     <input 
                       type="text"
                       placeholder="Değer"
                       value={field.value}
                       onChange={e => updateCustomField(field.id, 'value', e.target.value)}
                       className="flex-1 bg-zinc-950/50 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 focus:border-teal-500/50 outline-none transition-colors"
                     />
                     <button 
                        onClick={() => removeCustomField(field.id)}
                        className="text-zinc-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                     >
                       <Trash2 size={16} />
                     </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* External Parts Management */}
          {formData.externalParts && formData.externalParts.length > 0 && (
              <div className="border-b border-white/5 pb-8">
                <label className="block text-sm font-bold text-zinc-200 mb-4">Harici Parçalar (PDF/AI Taraması)</label>
                <div className="max-h-48 overflow-y-auto bg-black/20 border border-white/10 rounded-xl custom-scrollbar">
                    <table className="w-full text-sm text-left text-zinc-400">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="px-4 py-2 font-bold text-xs uppercase text-zinc-500">Parça</th>
                                <th className="px-4 py-2 w-20 text-center font-bold text-xs uppercase text-zinc-500">Adet</th>
                                <th className="px-4 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.externalParts.map(p => (
                                <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-2 font-medium text-zinc-300">{p.name}</td>
                                    <td className="px-4 py-2 text-center font-bold text-white">{p.count}</td>
                                    <td className="px-4 py-2 text-right">
                                        <button onClick={() => removeExternalPart(p.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Teknik Notlar</label>
            <textarea 
              rows={5}
              value={formData.technicalNotes || ''}
              onChange={e => setFormData({...formData, technicalNotes: e.target.value})}
              className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-3 text-sm font-medium text-white focus:border-teal-500/50 outline-none resize-none transition-colors"
              placeholder="Örn: 1. Tüm ölçüler mm'dir..."
            />
          </div>
        </div>

        <div className="p-5 border-t border-white/10 flex justify-end gap-3 bg-white/[0.02] shrink-0">
          <button onClick={onCancel} className="px-6 py-2.5 text-sm font-bold text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg">
            İptal
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-teal-900/20 transition-all hover:scale-105 active:scale-95"
          >
            <Save className="w-4 h-4" /> Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};