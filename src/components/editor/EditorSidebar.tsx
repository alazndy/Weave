import React from 'react';
import { Wand2, Ruler, Upload, Undo2, Redo2, RotateCcw, RotateCw, Move, Eraser, Scan, Scissors, Check, CheckCircle2, Loader2, FileUp, MousePointer2 } from 'lucide-react';
import { ExternalPart } from '../../types';

interface EditorSidebarProps {
    mode: 'upload' | 'preprocess' | 'ports';
    name: string;
    setName: (s: string) => void;
    description: string;
    setDescription: (s: string) => void;
    modelNumber: string;
    setModelNumber: (s: string) => void;
    handleAutoGenerateModel: () => void;
    visualWidth: number;
    handleVisualWidthChange: (s: string) => void;
    physicalWidth: number;
    handlePhysicalWidthChange: (s: string) => void;
    pixelScale: number;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleUndo: () => void;
    handleRedo: () => void;
    historyStep: number;
    editHistoryLength: number;
    rotateImage: (deg: number) => void;
    tool: 'select' | 'eraser' | 'scan' | 'measure';
    setTool: (t: 'select' | 'eraser' | 'scan' | 'measure') => void;
    eraserSize: number;
    setEraserSize: (n: number) => void;
    showMeasureInput: boolean;
    measuredLengthMm: string;
    setMeasuredLengthMm: (s: string) => void;
    applyCalibration: () => void;
    selection: { x: number, y: number, w: number, h: number } | null;
    applyCrop: () => void;
    isScanning: boolean;
    performScan: () => void;
    scannedParts: ExternalPart[] | null;
    confirmScannedParts: () => void;
    finishPreprocessing: () => void;
    setMode: (m: 'upload' | 'preprocess' | 'ports') => void;
    setRawImage: (s: string | null) => void;
    initialTemplate: any;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = (props) => {
    return (
        <div className="w-96 p-6 border-r border-white/10 overflow-y-auto flex flex-col gap-6 bg-zinc-900/50 backdrop-blur-md shrink-0 custom-scrollbar h-full">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Ürün Adı</label>
              <input 
                type="text" 
                value={props.name}
                onChange={(e) => props.setName(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-base text-white focus:border-paprika/50 focus:ring-1 focus:ring-paprika/50 outline-none font-medium transition-all"
                placeholder="Örn: Motor Sürücü"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Açıklama</label>
              <textarea 
                value={props.description}
                onChange={(e) => props.setDescription(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-paprika/50 focus:ring-1 focus:ring-paprika/50 outline-none resize-none h-24 font-medium transition-all"
                placeholder="Kısa ürün tanımı..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Model Numarası</label>
              <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={props.modelNumber}
                    onChange={(e) => props.setModelNumber(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-paprika/50 focus:ring-1 focus:ring-paprika/50 outline-none font-mono text-base font-bold transition-all"
                    placeholder="Örn: MTR-001"
                  />
                  <button 
                    onClick={props.handleAutoGenerateModel}
                    title="Otomatik Oluştur"
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white px-4 rounded-xl transition-all font-bold active:scale-95"
                  >
                    <Wand2 size={20} />
                  </button>
              </div>
            </div>
            
            {props.mode === 'ports' && (
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden group">
                     <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                         <Ruler size={16} className="text-blue-400"/> Fiziksel Boyutlar
                     </h3>
                     <div className="grid grid-cols-2 gap-4 relative z-10">
                         <div>
                             <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Gerçek (mm)</label>
                             <input 
                                type="number" 
                                value={props.physicalWidth} 
                                onChange={e => props.handlePhysicalWidthChange(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-base font-bold text-white focus:border-blue-500 outline-none transition-colors"
                             />
                         </div>
                         <div>
                             <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Ekran (px)</label>
                             <input 
                                type="number" 
                                value={props.visualWidth} 
                                onChange={e => props.handleVisualWidthChange(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-base font-bold text-white focus:border-blue-500 outline-none transition-colors"
                             />
                         </div>
                     </div>
                     <p className="text-[10px] font-medium text-zinc-500 mt-3 italic relative z-10">
                         Ölçek: 1mm = {props.pixelScale}px
                     </p>
                </div>
            )}

            {props.mode === 'upload' && (
                <div className="mt-4">
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Dosya Yükle (Resim veya PDF)</label>
                    <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-white/10 rounded-2xl hover:border-paprika/50 cursor-pointer bg-white/5 hover:bg-white/10 transition-all group relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-paprika/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10">
                            <div className="p-4 bg-white/5 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                                <FileUp className="w-8 h-8 text-zinc-400 group-hover:text-white transition-colors" />
                            </div>
                            <p className="text-base font-bold text-zinc-300 group-hover:text-white transition-colors">Yüklemek için tıklayın</p>
                            <p className="text-xs text-zinc-500 mt-2">veya sürükleyip bırakın (PDF, PNG, JPG)</p>
                        </div>
                        <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={props.handleFileChange} />
                    </label>
                </div>
            )}

            {props.mode === 'preprocess' && (
                <div className="space-y-4">
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-5 shadow-lg relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-3xl pointer-events-none"></div>
                         
                         <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-bold text-white">Düzenleme Araçları</h3>
                            <div className="flex gap-1">
                                <button onClick={props.handleUndo} disabled={props.historyStep <= 0} className="p-2 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg disabled:opacity-30 transition-colors" title="Geri Al (Ctrl+Z)"><Undo2 size={18}/></button>
                                <button onClick={props.handleRedo} disabled={props.historyStep >= props.editHistoryLength - 1} className="p-2 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg disabled:opacity-30 transition-colors" title="İleri Al (Ctrl+Y)"><Redo2 size={18}/></button>
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                             <button onClick={() => props.rotateImage(-90)} className="flex flex-col items-center justify-center p-3 bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/10 rounded-xl text-xs font-bold gap-2 text-zinc-300 transition-all hover:text-white">
                                 <RotateCcw size={18} /> Sola Çevir
                             </button>
                             <button onClick={() => props.rotateImage(90)} className="flex flex-col items-center justify-center p-3 bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/10 rounded-xl text-xs font-bold gap-2 text-zinc-300 transition-all hover:text-white">
                                 <RotateCw size={18} /> Sağa Çevir
                             </button>
                         </div>
                         
                         <div className="border-t border-white/10 my-2"></div>

                         <div className="grid grid-cols-4 gap-2">
                             {[
                                 { id: 'select', icon: MousePointer2, color: 'bg-emerald-600', label: 'Seç' },
                                 { id: 'eraser', icon: Eraser, color: 'bg-emerald-600', label: 'Sil' },
                                 { id: 'measure', icon: Ruler, color: 'bg-orange-600', label: 'Öl' },
                                 { id: 'scan', icon: Scan, color: 'bg-purple-600', label: 'Tara' },
                             ].map((t: any) => (
                                 <button 
                                    key={t.id}
                                    onClick={() => props.setTool(t.id)} 
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl gap-2 transition-all duration-300 ${props.tool === t.id 
                                        ? `${t.color} text-white shadow-lg scale-105` 
                                        : 'bg-black/20 hover:bg-black/40 text-zinc-400 hover:text-white border border-white/5 hover:border-white/10'}`}
                                    title={t.label}
                                 >
                                     <t.icon size={18} />
                                 </button>
                             ))}
                         </div>
                         
                         {props.tool === 'eraser' && (
                            <div className="mt-3 bg-black/20 p-3 rounded-xl border border-white/10 animate-in fade-in zoom-in-95">
                                <label className="text-[10px] font-bold text-zinc-400 block mb-2 uppercase tracking-wide">Silgi Boyutu: {props.eraserSize}px</label>
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="100" 
                                    value={props.eraserSize} 
                                    onChange={e => props.setEraserSize(Number(e.target.value))}
                                    className="w-full height-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                            </div>
                         )}
                         
                         {props.tool === 'measure' && (
                             <p className="text-xs font-medium text-zinc-400 bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl">
                                <span className="text-orange-400 font-bold block mb-1">Mesafe Ölçümü</span>
                                Resim üzerinde referans bir uzunluk (örn. ürün eni) boyunca çizgi çekin.
                             </p>
                         )}
                         
                         {props.tool === 'measure' && props.showMeasureInput && (
                            <div className="mt-3 bg-black/20 p-3 rounded-xl border border-white/10 animate-in fade-in zoom-in-95">
                                <label className="text-[10px] font-bold text-zinc-400 block mb-2 uppercase tracking-wide">Çizilen Uzunluk (mm)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        value={props.measuredLengthMm} 
                                        onChange={e => props.setMeasuredLengthMm(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white focus:border-orange-500 outline-none"
                                        placeholder="500"
                                        autoFocus
                                    />
                                    <button onClick={props.applyCalibration} className="bg-orange-600 hover:bg-orange-500 text-white px-3 rounded-lg font-bold text-xs uppercase tracking-wide shadow-lg shadow-orange-500/20 transition-all active:scale-95">OK</button>
                                </div>
                            </div>
                         )}

                         {props.tool === 'select' && props.selection && props.selection.w > 10 && (
                             <button onClick={props.applyCrop} className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mt-2 animate-pulse shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5">
                                 <Scissors size={18} /> Seçili Alanı Kırp
                             </button>
                         )}
                         
                         {props.tool === 'scan' && props.selection && props.selection.w > 10 && (
                             <div className="space-y-3">
                                 <button onClick={props.performScan} disabled={props.isScanning} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white p-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mt-2 shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5">
                                     {props.isScanning ? <Loader2 className="animate-spin" size={18}/> : <Scan size={18} />}
                                     {props.isScanning ? 'Taranıyor...' : 'Alanı Tara (AI)'}
                                 </button>
                                 {props.scannedParts && (
                                     <div className="bg-black/30 p-3 rounded-xl border border-white/10 max-h-40 overflow-y-auto custom-scrollbar">
                                         <p className="text-xs text-purple-400 mb-2 font-bold uppercase tracking-wider">{props.scannedParts.length} Parça Bulundu:</p>
                                         <ul className="text-xs text-zinc-300 space-y-1.5 mb-3">
                                             {props.scannedParts.map((p, i) => (
                                                 <li key={i} className="flex items-center gap-2">
                                                     <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[9px] font-bold">{p.count}</span>
                                                     {p.name}
                                                 </li>
                                             ))}
                                         </ul>
                                         <button onClick={props.confirmScannedParts} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold transition-colors">Listeye Ekle</button>
                                     </div>
                                 )}
                             </div>
                         )}
                    </div>

                    <button onClick={props.finishPreprocessing} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-4 rounded-xl text-base font-extrabold flex items-center justify-center gap-2 mt-auto shadow-xl shadow-emerald-500/20 hover:-translate-y-px transition-all border border-white/10">
                        <Check size={20} /> Tamamla ve İlerle
                    </button>
                    
                    <button onClick={() => { props.setMode('upload'); props.setRawImage(null); }} className="w-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-white/5">
                        <Undo2 size={16} /> Dosya Değiştir
                    </button>
                </div>
            )}
        </div>
    );
};