
import React from 'react';
import { AppSettings } from '../../types';
import { Settings, X, Moon, Sun, Monitor, Globe, Palette, Check } from 'lucide-react';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
}

export const PALETTES = [
  {
    id: 'weave',
    name: 'Weave (Varsayılan)',
    colors: { ink: '5 5 23', paprika: '207 92 54', apricot: '239 200 139', vanilla: '244 227 178', alabaster: '211 213 215' }
  },
  {
    id: 'ocean',
    name: 'Okyanus Derinliği',
    colors: { ink: '15 23 42', paprika: '14 165 233', apricot: '56 189 248', vanilla: '186 230 253', alabaster: '203 213 225' }
  },
  {
    id: 'forest',
    name: 'Orman',
    colors: { ink: '2 44 34', paprika: '16 185 129', apricot: '132 204 22', vanilla: '236 252 203', alabaster: '209 213 219' }
  },
  {
    id: 'royal',
    name: 'Siber Mor',
    colors: { ink: '19 7 34', paprika: '168 85 247', apricot: '232 121 249', vanilla: '250 232 255', alabaster: '229 231 235' }
  },
  {
    id: 'monochrome',
    name: 'Gri Tonlama',
    colors: { ink: '0 0 0', paprika: '113 113 122', apricot: '212 212 216', vanilla: '250 250 250', alabaster: '212 212 216' }
  }
];

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  if (!isOpen) return null;

  const handlePaletteChange = (paletteId: string) => {
      onUpdateSettings({ ...settings, palette: paletteId });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] no-print" onClick={onClose}>
      <div className="bg-ink border border-zinc-700 w-[600px] max-w-[90vw] rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-700 flex justify-between items-center bg-zinc-950/30">
          <h3 className="text-xl font-bold text-alabaster flex items-center gap-3">
            <div className="bg-gradient-to-br from-paprika/20 to-apricot/20 p-2 rounded-lg border border-paprika/20">
              <Settings className="text-paprika w-6 h-6" />
            </div>
            Uygulama Ayarları
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 max-h-[70vh]">
            
            {/* Theme Section */}
            <section>
                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Monitor size={16}/> Görünüm Modu
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                        className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${settings.theme === 'dark' ? 'border-paprika bg-paprika/10' : 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800'}`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${settings.theme === 'dark' ? 'bg-paprika text-white' : 'bg-zinc-700 text-zinc-400'}`}>
                            <Moon size={20} />
                        </div>
                        <div className="text-left">
                            <span className={`block font-bold ${settings.theme === 'dark' ? 'text-white' : 'text-zinc-300'}`}>Karanlık Mod</span>
                            <span className="text-xs text-zinc-500">Göz yormayan koyu arayüz</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                        className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${settings.theme === 'light' ? 'border-paprika bg-paprika/10' : 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800'}`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${settings.theme === 'light' ? 'bg-paprika text-white' : 'bg-zinc-700 text-zinc-400'}`}>
                            <Sun size={20} />
                        </div>
                        <div className="text-left">
                            <span className={`block font-bold ${settings.theme === 'light' ? 'text-white' : 'text-zinc-300'}`}>Aydınlık Mod</span>
                            <span className="text-xs text-zinc-500">Yüksek kontrastlı açık arayüz</span>
                        </div>
                    </button>
                </div>
            </section>

            {/* Language Section */}
            <section>
                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Globe size={16}/> Dil Tercihi
                </h4>
                <div className="flex gap-4">
                    <button 
                        onClick={() => onUpdateSettings({ ...settings, language: 'tr' })}
                        className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all flex items-center gap-2 ${settings.language === 'tr' ? 'border-paprika bg-paprika text-white' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                    >
                        🇹🇷 Türkçe
                    </button>
                    <button 
                        onClick={() => onUpdateSettings({ ...settings, language: 'en' })}
                        className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all flex items-center gap-2 ${settings.language === 'en' ? 'border-paprika bg-paprika text-white' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                    >
                        🇺🇸 English
                    </button>
                </div>
                <p className="text-xs text-zinc-500 mt-2 italic">* Dil değişikliği arayüzün bazı kısımlarında geçerli olacaktır.</p>
            </section>

            {/* Color Palette Section */}
            <section>
                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Palette size={16}/> Renk Teması
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PALETTES.map(p => (
                        <button
                            key={p.id}
                            onClick={() => handlePaletteChange(p.id)}
                            className={`relative p-3 rounded-xl border-2 flex items-center gap-4 transition-all overflow-hidden group ${settings.palette === p.id ? 'border-paprika bg-white/5' : 'border-zinc-700 hover:bg-white/5'}`}
                        >
                            <div className="flex gap-0 shrink-0 shadow-lg rounded-full overflow-hidden border border-white/20">
                                <div className="w-4 h-8" style={{ backgroundColor: `rgb(${p.colors.ink})` }}></div>
                                <div className="w-4 h-8" style={{ backgroundColor: `rgb(${p.colors.paprika})` }}></div>
                                <div className="w-4 h-8" style={{ backgroundColor: `rgb(${p.colors.apricot})` }}></div>
                            </div>
                            <span className={`font-bold ${settings.palette === p.id ? 'text-paprika' : 'text-zinc-300'}`}>{p.name}</span>
                            {settings.palette === p.id && <Check className="absolute right-3 text-paprika" size={20}/>}
                        </button>
                    ))}
                </div>
            </section>
        </div>

        <div className="p-4 border-t border-zinc-700 bg-zinc-950/30 flex justify-end">
             <button onClick={onClose} className="px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-lg font-bold text-sm transition-colors">
                Kapat
             </button>
        </div>
      </div>
    </div>
  );
};
