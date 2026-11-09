import React, { useState, useRef } from 'react';
import { ProjectMetadata, CustomField, PaperSize, Orientation, RevisionEntry, DocNumbering } from '../../types';
import { DOCUMENT_TYPES, DOCUMENT_DISCIPLINES, LOCATION_CODES, PROJECT_PHASES, type CodeEntry } from '../../data/documentCodes';
import { DEFAULT_DOC_NUMBERING, composeDocumentNo, missingParts } from '../../utils/docNumbering';
import { Settings, Upload, RefreshCw, LayoutTemplate, ArrowLeftRight, Plus, Trash2, Save, FileText, Briefcase, User, Calendar } from 'lucide-react';
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

  const numbering: DocNumbering = formData.docNumbering ?? DEFAULT_DOC_NUMBERING;
  const setNumbering = (patch: Partial<DocNumbering>) =>
    setFormData(prev => ({ ...prev, docNumbering: { ...(prev.docNumbering ?? DEFAULT_DOC_NUMBERING), ...patch } }));

  const revisions = formData.revisions ?? [];
  const addRevision = () => {
    const next: RevisionEntry = { id: crypto.randomUUID(), rev: `Rev-${revisions.length}`, date: new Date().toLocaleDateString('tr-TR'), description: '', by: '', chkd: '' };
    setFormData(prev => ({ ...prev, revisions: [...(prev.revisions ?? []), next] }));
  };
  const updateRevision = (id: string, key: keyof Omit<RevisionEntry, 'id'>, val: string) =>
    setFormData(prev => ({ ...prev, revisions: (prev.revisions ?? []).map(r => r.id === id ? { ...r, [key]: val } : r) }));
  const removeRevision = (id: string) =>
    setFormData(prev => ({ ...prev, revisions: (prev.revisions ?? []).filter(r => r.id !== id) }));

  const inp = "w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm font-medium text-white focus:border-teal-500/50 outline-none";
  const lbl = "block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5";
  const CodePicker: React.FC<{ label: string; list: CodeEntry[]; value: string; onChange: (v: string) => void; id: string; hint: string }> = ({ label, list, value, onChange, id, hint }) => {
    const found = list.find(c => c.code === value.toUpperCase());
    return (
      <div>
        <label className={lbl} htmlFor={id}>{label}</label>
        <input id={id} list={`${id}-list`} value={value} maxLength={3} onChange={e => onChange(e.target.value.toUpperCase())} className={`${inp} font-mono`} placeholder={hint} />
        <datalist id={`${id}-list`}>{list.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</datalist>
        <p className="text-[10px] mt-1 min-h-[14px] text-zinc-500">{found ? found.name : value ? 'Listede yok — özel kod olarak kullanılır' : ''}</p>
      </div>
    );
  };
  const missing = numbering.enabled ? missingParts(numbering) : [];

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

          {/* Drawing info: names, signatures */}
          <div className="border-t border-white/5 pt-6" data-testid="drawing-info-section">
            <label className="block text-sm font-bold text-zinc-200 mb-4">Çizim / İmza Bilgileri (Antet)</label>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3">
                <label className={lbl} htmlFor="drawing-name">Çizim Adı (Drawing Name)</label>
                <input id="drawing-name" className={inp} value={formData.drawingName || ''} onChange={e => setFormData({ ...formData, drawingName: e.target.value })} placeholder="Örn: CAS General Configuration" />
              </div>
              <div>
                <label className={lbl} htmlFor="checked-by">Kontrol Eden (Checked)</label>
                <input id="checked-by" className={inp} value={formData.checkedBy || ''} onChange={e => setFormData({ ...formData, checkedBy: e.target.value })} />
              </div>
              <div>
                <label className={lbl} htmlFor="drawn-date">Çizim Tarihi (Drawn)</label>
                <input id="drawn-date" className={inp} value={formData.drawnDate || ''} onChange={e => setFormData({ ...formData, drawnDate: e.target.value })} placeholder={formData.date} />
              </div>
              <div>
                <label className={lbl} htmlFor="checked-date">Kontrol Tarihi</label>
                <input id="checked-date" className={inp} value={formData.checkedDate || ''} onChange={e => setFormData({ ...formData, checkedDate: e.target.value })} />
              </div>
              <div>
                <label className={lbl} htmlFor="approved-date">Onay Tarihi</label>
                <input id="approved-date" className={inp} value={formData.approvedDate || ''} onChange={e => setFormData({ ...formData, approvedDate: e.target.value })} />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 mt-2">Hazırlayan = DRAWN, Onaylayan = APPROVED. Sayfa adı antette PAGE NAME olarak görünür.</p>
          </div>

          {/* Revision history */}
          <div className="border-t border-white/5 pt-6" data-testid="revisions-section">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-bold text-zinc-200">Revizyon Geçmişi</label>
              <button onClick={addRevision} className="text-xs font-bold bg-white/5 hover:bg-white/10 text-teal-400 border border-white/5 px-3 py-2 rounded-lg flex items-center gap-2">
                <Plus size={14} /> Revizyon Ekle
              </button>
            </div>
            {revisions.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]"><p className="text-xs text-zinc-500">Henüz revizyon yok.</p></div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[90px_100px_1fr_60px_60px_36px] gap-2 text-[10px] font-bold text-zinc-500 uppercase"><span>Rev</span><span>Tarih</span><span>Açıklama</span><span>By</span><span>Chkd.</span><span /></div>
                {revisions.map((r, i) => (
                  <div key={r.id} className="grid grid-cols-[90px_100px_1fr_60px_60px_36px] gap-2 items-center">
                    <input aria-label={`Revizyon ${i + 1} no`} className={inp} value={r.rev} onChange={e => updateRevision(r.id, 'rev', e.target.value)} />
                    <input aria-label={`Revizyon ${i + 1} tarih`} className={inp} value={r.date} onChange={e => updateRevision(r.id, 'date', e.target.value)} />
                    <input aria-label={`Revizyon ${i + 1} açıklama`} className={inp} value={r.description} onChange={e => updateRevision(r.id, 'description', e.target.value)} />
                    <input aria-label={`Revizyon ${i + 1} by`} className={inp} value={r.by} onChange={e => updateRevision(r.id, 'by', e.target.value)} />
                    <input aria-label={`Revizyon ${i + 1} chkd`} className={inp} value={r.chkd} onChange={e => updateRevision(r.id, 'chkd', e.target.value)} />
                    <button aria-label={`Revizyon ${i + 1} sil`} onClick={() => removeRevision(r.id)} className="text-zinc-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Document numbering protocol */}
          <div className="border-t border-white/5 pt-6" data-testid="doc-numbering-section">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-zinc-200">Döküman Numaralandırma (Protokol)</label>
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-300 cursor-pointer">
                <input type="checkbox" checked={numbering.enabled} onChange={e => setNumbering({ enabled: e.target.checked })} /> Protokolü kullan
              </label>
            </div>
            <p className="text-[10px] text-zinc-500 mb-4 font-mono">AAA-BBB-CCC-DDD-XXX-YY Rev-PP-R · originator · tip · disiplin · lokasyon · sıra no · sheet · revizyon-faz-no</p>
            <div className={`grid grid-cols-3 gap-4 ${numbering.enabled ? '' : 'opacity-50'}`}>
              <div>
                <label className={lbl} htmlFor="dn-originator">Originator (AAA)</label>
                <input id="dn-originator" value={numbering.originator} maxLength={3} onChange={e => setNumbering({ originator: e.target.value.toUpperCase() })} className={`${inp} font-mono`} placeholder="Örn: ANC" />
                <p className="text-[10px] mt-1 text-zinc-500">Dökümanı hazırlayan kuruluş kodu (3 harf)</p>
              </div>
              <CodePicker id="dn-type" label="Döküman Tipi (BBB)" list={DOCUMENT_TYPES} value={numbering.type} onChange={v => setNumbering({ type: v })} hint="DWD" />
              <CodePicker id="dn-discipline" label="Disiplin (CCC)" list={DOCUMENT_DISCIPLINES} value={numbering.discipline} onChange={v => setNumbering({ discipline: v })} hint="ELE" />
              <CodePicker id="dn-location" label="Lokasyon / Alan (DDD)" list={LOCATION_CODES} value={numbering.location} onChange={v => setNumbering({ location: v })} hint="GEN" />
              <div>
                <label className={lbl} htmlFor="dn-sequence">Sıra No (XXX)</label>
                <input id="dn-sequence" value={numbering.sequence} maxLength={3} inputMode="numeric" onChange={e => setNumbering({ sequence: e.target.value.replace(/\D/g, '') })} className={`${inp} font-mono`} placeholder="001" />
              </div>
              <div>
                <label className={lbl} htmlFor="dn-phase">Proje Fazı (PP)</label>
                <select id="dn-phase" value={numbering.phase} onChange={e => setNumbering({ phase: e.target.value })} className={inp}>
                  {PROJECT_PHASES.map(p => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl} htmlFor="dn-revision">Revizyon No (R)</label>
                <input id="dn-revision" value={numbering.revision} maxLength={3} onChange={e => setNumbering({ revision: e.target.value.toUpperCase() })} className={`${inp} font-mono`} placeholder="0" />
              </div>
              <label className="col-span-2 flex items-center gap-2 text-xs text-zinc-300 cursor-pointer self-end pb-2">
                <input type="checkbox" checked={numbering.sheetFromPage} onChange={e => setNumbering({ sheetFromPage: e.target.checked })} />
                Sayfa numarasını Sheet (YY) olarak ekle — her sayfa kendi numarasını alır
              </label>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-black/30 border border-white/10">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Önizleme (Sayfa 1)</span>
              <div className="font-mono text-base font-bold text-teal-400 break-all" data-testid="doc-number-preview">{composeDocumentNo(numbering, 1)}</div>
              {missing.length > 0 && <p className="text-[11px] text-amber-400 mt-1">Eksik: {missing.join(', ')}</p>}
              {!numbering.enabled && <p className="text-[11px] text-zinc-500 mt-1">Kapalı: antette yukarıdaki "Döküman No" alanı kullanılır.</p>}
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