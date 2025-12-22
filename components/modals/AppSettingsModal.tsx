import React from 'react';
import { AppSettings } from '../../types';
import { Settings, Moon, Sun, Monitor, Globe, Palette, Check, Users, Plus, Trash2 } from 'lucide-react';
import { PremiumModal } from '../ui/PremiumModal';

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
  const handlePaletteChange = (paletteId: string) => {
      onUpdateSettings({ ...settings, palette: paletteId });
  };

  return (
    <PremiumModal
      isOpen={isOpen}
      onClose={onClose}
      title="Uygulama Ayarları"
      icon={<Settings className="text-paprika w-5 h-5" />}
      width="max-w-2xl"
      footer={
         <button onClick={onClose} className="px-6 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-900 dark:text-white rounded-xl font-bold text-sm transition-colors">
            Kapat
         </button>
      }
    >
        <div className="space-y-8">
            
            {/* Theme Section */}
            <section>
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Monitor size={14}/> Görünüm Modu
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                        className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${settings.theme === 'dark' ? 'border-paprika bg-paprika/5 ring-1 ring-paprika/50' : 'border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10'}`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${settings.theme === 'dark' ? 'bg-paprika text-white shadow-lg shadow-paprika/30' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                            <Moon size={20} />
                        </div>
                        <div className="text-left">
                            <span className={`block font-bold text-sm ${settings.theme === 'dark' ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-300'}`}>Karanlık Mod</span>
                            <span className="text-xs text-zinc-500">Göz yormayan koyu arayüz</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                        className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${settings.theme === 'light' ? 'border-paprika bg-paprika/5 ring-1 ring-paprika/50' : 'border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10'}`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${settings.theme === 'light' ? 'bg-paprika text-white shadow-lg shadow-paprika/30' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                            <Sun size={20} />
                        </div>
                        <div className="text-left">
                            <span className={`block font-bold text-sm ${settings.theme === 'light' ? 'text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-300'}`}>Aydınlık Mod</span>
                            <span className="text-xs text-zinc-500">Yüksek kontrastlı açık arayüz</span>
                        </div>
                    </button>
                </div>
            </section>

            {/* Language Section */}
            <section>
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Globe size={14}/> Dil Tercihi
                </h4>
                <div className="flex gap-3">
                    <button 
                        onClick={() => onUpdateSettings({ ...settings, language: 'tr' })}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-bold transition-all flex items-center gap-2 ${settings.language === 'tr' ? 'border-paprika bg-paprika text-white shadow-md shadow-paprika/20' : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                    >
                        🇹🇷 Türkçe
                    </button>
                    <button 
                        onClick={() => onUpdateSettings({ ...settings, language: 'en' })}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-bold transition-all flex items-center gap-2 ${settings.language === 'en' ? 'border-paprika bg-paprika text-white shadow-md shadow-paprika/20' : 'border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                    >
                        🇺🇸 English
                    </button>
                </div>
                <p className="text-[10px] text-zinc-400 mt-2 italic">* Dil değişikliği arayüzün bazı kısımlarında geçerli olacaktır.</p>
            </section>

            {/* Color Palette Section */}
            <section>
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Palette size={14}/> Renk Teması
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PALETTES.map(p => (
                        <button
                            key={p.id}
                            onClick={() => handlePaletteChange(p.id)}
                            className={`relative p-3 rounded-xl border flex items-center gap-4 transition-all overflow-hidden group ${settings.palette === p.id ? 'border-paprika bg-paprika/5 ring-1 ring-paprika/50' : 'border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5'}`}
                        >
                            <div className="flex gap-0 shrink-0 shadow-lg rounded-full overflow-hidden border border-white/20 ring-1 ring-black/5">
                                <div className="w-4 h-8" style={{ backgroundColor: `rgb(${p.colors.ink})` }}></div>
                                <div className="w-4 h-8" style={{ backgroundColor: `rgb(${p.colors.paprika})` }}></div>
                                <div className="w-4 h-8" style={{ backgroundColor: `rgb(${p.colors.apricot})` }}></div>
                            </div>
                            <span className={`font-bold text-sm ${settings.palette === p.id ? 'text-paprika' : 'text-zinc-600 dark:text-zinc-300'}`}>{p.name}</span>
                            {settings.palette === p.id && <Check className="absolute right-3 text-paprika" size={18}/>}
                        </button>
                    ))}
                </div>
            </section>

            {/* Integrations Section */}
            <section>
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Globe size={14}/> Entegrasyonlar
                </h4>
                 <div className="grid grid-cols-1 gap-4">
                    <button 
                        onClick={() => onUpdateSettings({ ...settings, enableUPHIntegration: !settings.enableUPHIntegration })}
                        className={`p-4 rounded-xl border flex items-center justify-between transition-all ${settings.enableUPHIntegration ? 'border-paprika bg-paprika/5 ring-1 ring-paprika/50' : 'border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10'}`}
                    >
                        <div className="text-left">
                            <span className={`block font-bold text-sm ${settings.theme === 'dark' ? 'text-white' : 'text-zinc-800'}`}>UPH Entegrasyonu</span>
                            <span className="text-xs text-zinc-500">Projeleri doğrudan Unified Project Hub'a gönder</span>
                        </div>
                         <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${settings.enableUPHIntegration ? 'bg-paprika' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${settings.enableUPHIntegration ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                    </button>

                    <button 
                        onClick={() => onUpdateSettings({ ...settings, enableGoogleDrive: !settings.enableGoogleDrive })}
                        className={`p-4 rounded-xl border flex items-center justify-between transition-all ${settings.enableGoogleDrive ? 'border-paprika bg-paprika/5 ring-1 ring-paprika/50' : 'border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10'}`}
                    >
                        <div className="text-left">
                            <span className={`block font-bold text-sm ${settings.theme === 'dark' ? 'text-white' : 'text-zinc-800'}`}>Google Drive</span>
                            <span className="text-xs text-zinc-500">Projeleri Google Drive'a yedekle</span>
                        </div>
                         <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${settings.enableGoogleDrive ? 'bg-paprika' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${settings.enableGoogleDrive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                    </button>
                </div>
            </section>
            
            {/* Team Section (Local) */}
            <section>
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Users size={14}/> Yerel Ekip (İmza/Onay)
                </h4>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Ad Soyad"
                            id="new-member-name"
                            className="flex-1 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white focus:border-paprika outline-none transition-colors"
                        />
                         <input 
                            type="email" 
                            placeholder="E-posta"
                            id="new-member-email"
                            className="flex-1 bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white focus:border-paprika outline-none transition-colors"
                        />
                         <select 
                             id="new-member-role"
                             className="bg-white/50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white focus:border-paprika outline-none transition-colors"
                         >
                             <option value="viewer">Viewer</option>
                             <option value="manager">Manager</option>
                             <option value="admin">Admin</option>
                         </select>
                        <button 
                            onClick={() => {
                                const nameInput = document.getElementById('new-member-name') as HTMLInputElement;
                                const emailInput = document.getElementById('new-member-email') as HTMLInputElement;
                                const roleInput = document.getElementById('new-member-role') as HTMLSelectElement;
                                
                                if (nameInput.value && emailInput.value) {
                                    const newMember = {
                                        id: crypto.randomUUID(),
                                        name: nameInput.value,
                                        email: emailInput.value,
                                        role: roleInput.value as any
                                    };
                                    onUpdateSettings({ 
                                        ...settings, 
                                        teamMembers: [...(settings.teamMembers || []), newMember] 
                                    });
                                    nameInput.value = '';
                                    emailInput.value = '';
                                }
                            }}
                            className="bg-paprika text-white p-2 rounded-xl hover:bg-paprika/80 transition-colors shadow-lg shadow-paprika/20"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {settings.teamMembers?.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                                <div>
                                    <div className="font-bold text-sm text-zinc-900 dark:text-white">{member.name}</div>
                                    <div className="text-xs text-zinc-500">{member.email} • <span className="uppercase text-paprika font-bold">{member.role}</span></div>
                                </div>
                                <button 
                                    onClick={() => onUpdateSettings({
                                        ...settings,
                                        teamMembers: settings.teamMembers?.filter(m => m.id !== member.id)
                                    })}
                                    className="text-zinc-400 hover:text-red-500 p-2 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {(!settings.teamMembers || settings.teamMembers.length === 0) && (
                            <div className="text-center py-6 text-zinc-400 text-sm border border-dashed border-zinc-200 dark:border-white/10 rounded-xl bg-white/20 dark:bg-white/5">
                                Henüz ekip üyesi eklenmemiş.
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    </PremiumModal>
  );
};
