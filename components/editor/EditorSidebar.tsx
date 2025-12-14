import React, { useRef } from 'react';
import { Wand2, Ruler, Upload, Undo2, Redo2, RotateCcw, RotateCw, Move, Eraser, Scan, Scissors, Check, CheckCircle2, Loader2 } from 'lucide-react';
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
        <div className="w-96 p-6 border-r border-zinc-800 overflow-y-auto flex flex-col gap-6 bg-zinc-900/50 shrink-0 custom-scrollbar">
            <div>
              <label className="block text-base font-semibold text-zinc-300 mb-2">Ürün Adı</label>
              <input 
                type="text" 
                value={props.name}
                onChange={(e) => props.setName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-3 text-base text-white focus:border-emerald-500 focus:outline-none font-medium"
                placeholder="Örn: Motor Sürücü"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-zinc-300 mb-2">Açıklama</label>
              <textarea 
                value={props.description}
                onChange={(e) => props.setDescription(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-3 text-sm text-white focus:border-emerald-500 focus:outline-none resize-none h-20 font-medium"
                placeholder="Kısa ürün tanımı..."
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-zinc-300 mb-2">Model Numarası</label>
              <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={props.modelNumber}
                    onChange={(e) => props.setModelNumber(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-3 text-white focus:border-emerald-500 focus:outline-none font-mono text-base font-bold"
                    placeholder="Örn: MTR-001"
                  />
                  <button 
                    onClick={props.handleAutoGenerateModel}
                    title="Otomatik Oluştur"
                    className="bg-zinc-700 hover:bg-emerald-600 text-white px-4 rounded transition-colors font-bold"
                  >
                    <Wand2 size={20} />
                  </button>
              </div>
            </div>
            
            {props.mode === 'ports' && (
                <div className="bg-zinc-800/50 p-4 rounded border border-zinc-700 shadow-md">
                     <h3 className="text-base font-bold text-zinc-200 mb-3 flex items-center gap-2">
                         <Ruler size={18} className="text-blue-400"/> Fiziksel Boyutlar
                     </h3>
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="text-xs font-bold text-zinc-400 block mb-1.5">Gerçek (mm)</label>
                             <input 
                                type="number" 
                                value={props.physicalWidth} 
                                onChange={e => props.handlePhysicalWidthChange(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-600 rounded px-3 py-2 text-base font-bold text-white focus:border-blue-500 outline-none"
                             />
                         </div>
                         <div>
                             <label className="text-xs font-bold text-zinc-400 block mb-1.5">Ekran (px)</label>
                             <input 
                                type="number" 
                                value={props.visualWidth} 
                                onChange={e => props.handleVisualWidthChange(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-600 rounded px-3 py-2 text-base font-bold text-white focus:border-blue-500 outline-none"
                             />
                         </div>
                     </div>
                     <p className="text-xs font-medium text-zinc-500 mt-3 italic">
                         Ölçek: 1mm = {props.pixelScale}px
                     </p>
                </div>
            )}

            {props.mode === 'upload' && (
                <div className="mt-4">
                    <label className="block text-base font-semibold text-zinc-300 mb-3">Dosya Yükle (Resim veya PDF)</label>
                    <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-zinc-700 rounded-xl hover:border-emerald-500 cursor-pointer bg-zinc-800/30 hover:bg-zinc-800/50 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-12 h-12 text-zinc-500 mb-4" />
                            <p className="text-base font-medium text-zinc-300">Tıkla veya sürükle</p>
                            <p className="text-sm text-zinc-500 mt-2">PDF, PNG, JPG</p>
                        </div>
                        <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={props.handleFileChange} />
                    </label>
                </div>
            )}

            {props.mode === 'preprocess' && (
                <div className="space-y-4">
                    <div className="p-4 bg-zinc-800 rounded border border-zinc-700 space-y-4 shadow-md">
                         <div className="flex justify-between items-center mb-2">
                            <h3 className="text-base font-bold text-zinc-200">Düzenleme Araçları</h3>
                            <div className="flex gap-1">
                                <button onClick={props.handleUndo} disabled={props.historyStep <= 0} className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded disabled:opacity-50" title="Geri Al (Ctrl+Z)"><Undo2 size={16}/></button>
                                <button onClick={props.handleRedo} disabled={props.historyStep >= props.editHistoryLength - 1} className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded disabled:opacity-50" title="İleri Al (Ctrl+Y)"><Redo2 size={16}/></button>
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-3">
                             <button onClick={() => props.rotateImage(-90)} className="flex flex-col items-center justify-center p-3 bg-zinc-700 hover:bg-zinc-600 rounded text-sm font-medium gap-1.5 text-zinc-200">
                                 <RotateCcw size={20} /> Sola Çevir
                             </button>
                             <button onClick={() => props.rotateImage(90)} className="flex flex-col items-center justify-center p-3 bg-zinc-700 hover:bg-zinc-600 rounded text-sm font-medium gap-1.5 text-zinc-200">
                                 <RotateCw size={20} /> Sağa Çevir
                             </button>
                         </div>
                         
                         <div className="border-t border-zinc-700 my-2 pt-2"></div>

                         <div className="grid grid-cols-4 gap-3">
                             <button onClick={() => props.setTool('select')} className={`flex flex-col items-center justify-center p-3 rounded text-sm gap-1 transition-colors ${props.tool === 'select' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}>
                                 <Move size={20} />
                             </button>
                             <button onClick={() => props.setTool('eraser')} className={`flex flex-col items-center justify-center p-3 rounded text-sm gap-1 transition-colors ${props.tool === 'eraser' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}>
                                 <Eraser size={20} />
                             </button>
                             <button onClick={() => props.setTool('measure')} className={`flex flex-col items-center justify-center p-3 rounded text-sm gap-1 transition-colors ${props.tool === 'measure' ? 'bg-orange-600 text-white shadow-lg' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}>
                                 <Ruler size={20} />
                             </button>
                             <button onClick={() => props.setTool('scan')} className={`flex flex-col items-center justify-center p-3 rounded text-sm gap-1 transition-colors ${props.tool === 'scan' ? 'bg-purple-600 text-white shadow-lg' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}>
                                 <Scan size={20} />
                             </button>
                         </div>
                         
                         {props.tool === 'eraser' && (
                            <div className="mt-2 bg-zinc-900 p-2 rounded border border-zinc-600 animate-in fade-in">
                                <label className="text-xs font-bold text-zinc-400 block mb-1">Silgi Boyutu: {props.eraserSize}px</label>
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="100" 
                                    value={props.eraserSize} 
                                    onChange={e => props.setEraserSize(Number(e.target.value))}
                                    className="w-full accent-emerald-500 cursor-pointer"
                                />
                            </div>
                         )}
                         
                         {props.tool === 'measure' && (
                             <p className="text-xs font-medium text-zinc-400 italic">Resim üzerinde referans bir uzunluk (örn. ürün eni) boyunca çizgi çekin.</p>
                         )}
                         
                         {props.tool === 'measure' && props.showMeasureInput && (
                            <div className="mt-2 bg-zinc-900 p-2 rounded border border-zinc-600 animate-in fade-in">
                                <label className="text-xs font-bold text-zinc-400 block mb-1">Çizilen Uzunluk (mm)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        value={props.measuredLengthMm} 
                                        onChange={e => props.setMeasuredLengthMm(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm font-bold text-white focus:border-orange-500 outline-none"
                                        placeholder="500"
                                        autoFocus
                                    />
                                    <button onClick={props.applyCalibration} className="bg-orange-600 hover:bg-orange-500 text-white px-2 rounded font-bold text-xs">OK</button>
                                </div>
                            </div>
                         )}

                         {props.tool === 'select' && props.selection && props.selection.w > 10 && (
                             <button onClick={props.applyCrop} className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded text-base font-bold flex items-center justify-center gap-2 mt-2 animate-pulse shadow-lg">
                                 <Scissors size={18} /> Seçili Alanı Kırp
                             </button>
                         )}
                         
                         {props.tool === 'scan' && props.selection && props.selection.w > 10 && (
                             <div className="space-y-2">
                                 <button onClick={props.performScan} disabled={props.isScanning} className="w-full bg-purple-600 hover:bg-purple-500 text-white p-3 rounded text-base font-bold flex items-center justify-center gap-2 mt-2 shadow-lg">
                                     {props.isScanning ? <Loader2 className="animate-spin" size={18}/> : <Scan size={18} />}
                                     {props.isScanning ? 'Taranıyor...' : 'Alanı Tara (AI)'}
                                 </button>
                                 {props.scannedParts && (
                                     <div className="bg-zinc-950 p-2 rounded border border-zinc-700 max-h-32 overflow-y-auto">
                                         <p className="text-xs text-zinc-400 mb-1 font-bold">{props.scannedParts.length} Parça Bulundu:</p>
                                         <ul className="text-xs text-zinc-300 space-y-1">
                                             {props.scannedParts.map((p, i) => (
                                                 <li key={i}>• {p.count}x {p.name}</li>
                                             ))}
                                         </ul>
                                         <button onClick={props.confirmScannedParts} className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white py-1 rounded text-xs font-bold">Listeye Ekle</button>
                                     </div>
                                 )}
                             </div>
                         )}
                    </div>

                    <button onClick={props.finishPreprocessing} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-lg text-base font-extrabold flex items-center justify-center gap-2 mt-auto shadow-xl hover:translate-y-[-2px] transition-transform">
                        <Check size={22} /> Tamamla ve İlerle
                    </button>
                    
                    <button onClick={() => { props.setMode('upload'); props.setRawImage(null); }} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded font-bold text-sm flex items-center justify-center gap-2 shadow-md">
                        <Undo2 size={16} /> Dosya Değiştir
                    </button>
                </div>
            )}
        </div>
    );
};