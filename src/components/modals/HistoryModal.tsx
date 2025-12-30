import React, { useState } from 'react';
import { HistoryState, HistorySnapshot } from '../../types';
import { History, X, RotateCcw, Save, Clock, ArrowRight } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  pastStates: HistoryState[];
  snapshots: HistorySnapshot[];
  currentState: HistoryState;
  onRestoreState: (state: HistoryState) => void;
  onCreateSnapshot: (name: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ 
    isOpen, onClose, pastStates, snapshots, currentState, onRestoreState, onCreateSnapshot 
}) => {
  const [snapshotName, setSnapshotName] = useState('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'snapshots'>('snapshots');

  if (!isOpen) return null;

  const handleCreateSnapshot = () => {
      if(!snapshotName.trim()) return;
      onCreateSnapshot(snapshotName);
      setSnapshotName('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[150] no-print" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-[600px] max-h-[80vh] shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-700 flex justify-between items-center bg-zinc-950/50 rounded-t-2xl">
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-2 rounded-lg border border-orange-500/20">
              <History className="text-orange-400 w-6 h-6" />
            </div>
            Versiyon Geçmişi (Time Travel)
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-700">
            <button 
                onClick={() => setActiveTab('snapshots')} 
                className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'snapshots' ? 'text-orange-400 border-b-2 border-orange-400 bg-white/5' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                Kayıtlı Versiyonlar ({snapshots.length})
            </button>
            <button 
                onClick={() => setActiveTab('timeline')} 
                className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'timeline' ? 'text-orange-400 border-b-2 border-orange-400 bg-white/5' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
                İşlem Geçmişi ({pastStates.length})
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-zinc-950/30">
            {activeTab === 'snapshots' ? (
                <div className="space-y-6">
                    <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                        <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase">Mevcut Durumu Kaydet</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={snapshotName}
                                onChange={e => setSnapshotName(e.target.value)}
                                placeholder="Versiyon Adı (Örn: Müşteri Onayı Öncesi)"
                                className="flex-1 bg-zinc-950 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white focus:border-orange-500 outline-none"
                            />
                            <button 
                                onClick={handleCreateSnapshot}
                                disabled={!snapshotName.trim()}
                                className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                            >
                                <Save size={16} /> Oluştur
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {snapshots.length === 0 ? (
                            <div className="text-center text-zinc-500 py-8 italic">Henüz kayıtlı versiyon yok.</div>
                        ) : (
                            snapshots.map((snap) => (
                                <div key={snap.id} className="bg-zinc-800/30 border border-zinc-700 rounded-xl p-4 flex justify-between items-center hover:bg-zinc-800/50 transition-colors group">
                                    <div>
                                        <h4 className="font-bold text-zinc-200">{snap.name}</h4>
                                        <span className="text-xs text-zinc-500 font-mono flex items-center gap-1 mt-1">
                                            <Clock size={12} /> {snap.timestamp}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if(confirm(`"${snap.name}" versiyonuna geri dönmek istediğinize emin misiniz? Mevcut, kaydedilmemiş değişiklikler kaybolabilir.`)) {
                                                onRestoreState(snap.state);
                                                onClose();
                                            }
                                        }}
                                        className="bg-zinc-700 hover:bg-orange-600 text-zinc-300 hover:text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <RotateCcw size={14} /> Geri Yükle
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-2 relative">
                    <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-zinc-800"></div>
                    {[...pastStates].reverse().map((state, index) => {
                        // Calculate total counts across all pages
                        const instanceCount = state.pages?.reduce((acc, p) => acc + (p.instances?.length || 0), 0) || 0;
                        const connectionCount = state.pages?.reduce((acc, p) => acc + (p.connections?.length || 0), 0) || 0;
                        
                        return (
                        <div key={index} className="relative flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center z-10 shrink-0 group-hover:border-orange-500 transition-colors">
                                <span className="text-xs font-mono font-bold text-zinc-500 group-hover:text-orange-400">
                                    {pastStates.length - index}
                                </span>
                            </div>
                            <div className="flex-1 bg-zinc-800/30 border border-zinc-700 rounded-lg p-3 flex justify-between items-center hover:bg-zinc-800 transition-colors">
                                <div>
                                    <span className="text-sm font-medium text-zinc-300 block">Geçmiş Durum</span>
                                    <span className="text-[10px] text-zinc-500">{instanceCount} Cihaz, {connectionCount} Bağlantı ({state.pages?.length || 0} Sayfa)</span>
                                </div>
                                <button 
                                    onClick={() => {
                                        onRestoreState(state);
                                        onClose();
                                    }}
                                    className="text-zinc-500 hover:text-orange-400 p-2"
                                    title="Bu duruma dön"
                                >
                                    <RotateCcw size={16} />
                                </button>
                            </div>
                        </div>
                    )})}
                    {pastStates.length === 0 && <div className="text-center text-zinc-500 py-8 italic">İşlem geçmişi boş.</div>}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};