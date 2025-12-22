import React, { useState, useRef } from 'react';
import { ProjectMetadata, CustomField, PaperSize, Orientation } from '../../types';
import { Settings, X, Upload, RefreshCw, LayoutTemplate, ArrowLeftRight, Plus, Trash2, Save, FileText, Briefcase, User, Calendar } from 'lucide-react';
import { PremiumModal } from '../ui/PremiumModal';

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
    <PremiumModal
      isOpen={true}
      onClose={onCancel}
      title="Proje Detayları"
      icon={<Settings className="text-teal-400 w-5 h-5" />}
      width="max-w-4xl"
      footer={
          <>
            <button onClick={onCancel} className="px-6 py-2.5 text-sm font-bold text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-xl">
                İptal
            </button>
            <button 
                onClick={() => onSave(formData)}
                className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all hover:scale-105 active:scale-95"
            >
                <Save className="w-4 h-4" /> Kaydet
            </button>
          </>
      }
    >
        <div className="p-2 space-y-8">
          
          {/* Logo Section */}
          <div className="flex items-center gap-6 p-6 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <div 
              className="w-24 h-24 bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer hover:border-teal-500/50 hover:bg-teal-500/5 transition-all relative group/logo shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.companyLogo ? (
                <img src={formData.companyLogo} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <Upload className="w-8 h-8 text-zinc-600 group-hover/logo:text-teal-500 transition-colors" />
              )}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity text-xs font-bold text-white backdrop-blur-[1px]">
                Değiştir
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-lg font-bold text-white mb-1">Şirket Logosu</label>
              <p className="text-sm text-zinc-500 font-medium">Teknik çizim antetinde yer alacak resmi marka logosu. PNG, JPG veya SVG formatları desteklenir.</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pb-6">
            <div className="col-span-2">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                   <Briefcase size={12}/> Şirket Adı
              </label>
              <input 
                type="text" 
                value={formData.companyName}
                onChange={e => setFormData({...formData, companyName: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-base font-bold text-white focus:border-teal-500/50 focus:bg-black/40 outline-none transition-colors"
                placeholder="Firma Adı"
              />
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  <User size={12}/> Müşteri
              </label>
              <input 
                type="text" 
                value={formData.customerName || ''}
                onChange={e => setFormData({...formData, customerName: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-base font-bold text-white focus:border-teal-500/50 focus:bg-black/40 outline-none transition-colors"
                placeholder="Müşteri Adı / Firma"
              />
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  <FileText size={12}/> Proje Başlığı
              </label>
              <input 
                type="text" 
                value={formData.projectName}
                onChange={e => setFormData({...formData, projectName: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-base font-bold text-white focus:border-teal-500/50 focus:bg-black/40 outline-none transition-colors"
                placeholder="Proje Adı"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Hazırlayan</label>
              <input 
                type="text" 
                value={formData.preparedBy}
                onChange={e => setFormData({...formData, preparedBy: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-teal-500/50 focus:bg-black/40 outline-none transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Onaylayan</label>
              <input 
                type="text" 
                value={formData.approvedBy}
                onChange={e => setFormData({...formData, approvedBy: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-teal-500/50 focus:bg-black/40 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Revizyon</label>
              <input 
                type="text" 
                value={formData.revision}
                onChange={e => setFormData({...formData, revision: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-teal-500/50 focus:bg-black/40 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Döküman No</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={formData.documentNo}
                  onChange={e => setFormData({...formData, documentNo: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono font-bold text-teal-400 focus:border-teal-500/50 focus:bg-black/40 outline-none transition-colors"
                />
                <button 
                  onClick={handleGenerateDocNo}
                  className="bg-white/5 hover:bg-teal-500/10 text-zinc-400 hover:text-teal-400 px-3 py-2 rounded-xl border border-white/5 transition-colors flex items-center gap-2 text-xs font-bold whitespace-nowrap"
                  title="Oto. Oluştur"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  <Calendar size={12}/> Tarih
              </label>
              <input 
                type="text" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-teal-500/50 focus:bg-black/40 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Görünür Ölçek</label>
              <input 
                type="text" 
                value={formData.scale}
                onChange={e => setFormData({...formData, scale: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-teal-500/50 focus:bg-black/40 outline-none transition-colors"
                placeholder="Örn: 1:10"
              />
            </div>

            <div className="col-span-2 bg-gradient-to-br from-blue-600/10 to-transparent p-6 rounded-2xl border border-blue-500/20 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
                <h4 className="text-sm font-bold text-blue-200 mb-6 flex items-center gap-2">
                    <LayoutTemplate size={18} className="text-blue-400"/> Sayfa Yapısı & Ölçek
                </h4>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-[10px] font-bold text-blue-300/50 uppercase mb-2">Kağıt Boyutu</label>
                        <select 
                            value={formData.paperSize}
                            onChange={e => setFormData({...formData, paperSize: e.target.value as PaperSize})}
                            className="w-full bg-black/30 border border-blue-500/20 rounded-xl px-4 py-3 text-sm font-bold text-blue-100 focus:border-blue-400/50 outline-none appearance-none"
                        >
                            <option value="A3">A3 (420 x 297 mm)</option>
                            <option value="A4">A4 (297 x 210 mm)</option>
                            <option value="A6">A6 (148 x 105 mm)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-blue-300/50 uppercase mb-2">Yönlendirme</label>
                        <select 
                            value={formData.orientation}
                            onChange={e => setFormData({...formData, orientation: e.target.value as Orientation})}
                            className="w-full bg-black/30 border border-blue-500/20 rounded-xl px-4 py-3 text-sm font-bold text-blue-100 focus:border-blue-400/50 outline-none appearance-none"
                        >
                            <option value="landscape">Yatay (Landscape)</option>
                            <option value="portrait">Dikey (Portrait)</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-end gap-6 pt-6 border-t border-blue-500/20">
                    <div className="flex-1">
                         <label className="block text-[10px] font-bold text-blue-300/50 uppercase mb-2">Piksel Ölçeği (px/mm)</label>
                         <div className="flex items-center gap-4">
                             <input 
                                type="number" 
                                value={formData.pixelScale}
                                onChange={e => setFormData({...formData, pixelScale: Number(e.target.value)})}
                                className="w-28 bg-black/30 border border-blue-500/20 rounded-xl px-4 py-2.5 text-base font-bold text-blue-100 focus:border-blue-400/50 outline-none"
                                step="0.1"
                                min="0.1"
                             />
                             <span className="text-xs font-medium text-blue-300/70 whitespace-nowrap bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/10">1 mm = {formData.pixelScale} px</span>
                         </div>
                    </div>
                    <button 
                        onClick={() => onRescaleInstances(formData.pixelScale)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all hover:translate-y-px active:translate-y-0"
                    >
                        <ArrowLeftRight size={16}/> Tümünü Yeniden Boyutlandır
                    </button>
                </div>
            </div>
          </div>

          {/* Custom Fields Section */}
          <div className="border-t border-white/5 pt-6">
            <div className="flex justify-between items-center mb-5">
               <label className="block text-sm font-bold text-zinc-200">Özel Alanlar</label>
               <button 
                 onClick={addCustomField}
                 className="text-xs font-bold bg-white/5 hover:bg-white/10 text-teal-400 border border-white/5 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors active:scale-95"
               >
                 <Plus size={14} /> Alan Ekle
               </button>
            </div>
            
            {formData.customFields.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                  <p className="text-xs text-zinc-500 font-medium">Ekstra bilgi alanı eklenmedi.</p>
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
                       className="w-1/3 bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 focus:border-teal-500/50 outline-none transition-colors"
                     />
                     <input 
                       type="text"
                       placeholder="Değer"
                       value={field.value}
                       onChange={e => updateCustomField(field.id, 'value', e.target.value)}
                       className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 focus:border-teal-500/50 outline-none transition-colors"
                     />
                     <button 
                        onClick={() => removeCustomField(field.id)}
                        className="text-zinc-500 hover:text-red-400 p-2.5 rounded-lg hover:bg-red-500/10 transition-colors"
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
              <div className="border-t border-white/5 pt-6">
                <label className="block text-sm font-bold text-zinc-200 mb-4">Harici Parçalar (PDF/AI Taraması)</label>
                <div className="max-h-56 overflow-y-auto bg-black/20 border border-white/10 rounded-xl custom-scrollbar">
                    <table className="w-full text-sm text-left text-zinc-400">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="px-4 py-3 font-bold text-[10px] uppercase text-zinc-500 tracking-wider">Parça</th>
                                <th className="px-4 py-3 w-24 text-center font-bold text-[10px] uppercase text-zinc-500 tracking-wider">Adet</th>
                                <th className="px-4 py-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.externalParts.map(p => (
                                <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-2.5 font-bold text-xs text-zinc-300">{p.name}</td>
                                    <td className="px-4 py-2.5 text-center font-bold text-white text-xs bg-white/5 rounded-lg mx-2">{p.count}</td>
                                    <td className="px-4 py-2.5 text-right">
                                        <button onClick={() => removeExternalPart(p.id)} className="text-zinc-600 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-white/5">
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
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-teal-500/50 outline-none resize-none transition-colors"
              placeholder="Örn: 1. Tüm ölçüler mm'dir..."
            />
          </div>
        </div>
    </PremiumModal>
  );
};