import { UpdateSettings } from '../UpdateBanner';
import React, { useState } from 'react';
import { AppSettings, ColorPalette } from '../../types';
import { Settings, Moon, Sun, Monitor, Check, Sparkles, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
}

export const PALETTES: { id: ColorPalette; name: string; colors: Record<'ink' | 'paprika' | 'apricot' | 'vanilla' | 'alabaster', string> }[] = [
  {
    id: 'weave',
    name: 'Weave (Default)',
    colors: { ink: '5 5 23', paprika: '207 92 54', apricot: '239 200 139', vanilla: '244 227 178', alabaster: '211 213 215' }
  },
  {
    id: 'ocean',
    name: 'Ocean Deep',
    colors: { ink: '15 23 42', paprika: '14 165 233', apricot: '56 189 248', vanilla: '186 230 253', alabaster: '203 213 225' }
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: { ink: '2 44 34', paprika: '16 185 129', apricot: '132 204 22', vanilla: '236 252 203', alabaster: '209 213 219' }
  },
  {
    id: 'royal',
    name: 'Cyber Purple',
    colors: { ink: '19 7 34', paprika: '168 85 247', apricot: '232 121 249', vanilla: '250 232 255', alabaster: '229 231 235' }
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    colors: { ink: '0 0 0', paprika: '113 113 122', apricot: '212 212 216', vanilla: '250 250 250', alabaster: '212 212 216' }
  }
];

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  const [showKey, setShowKey] = useState(false);

  const handlePaletteChange = (paletteId: ColorPalette) => {
      onUpdateSettings({ ...settings, palette: paletteId });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                    <Settings className="w-5 h-5 text-primary" /> 
                    Application Settings
                </DialogTitle>
                <DialogDescription>
                    Customize your workspace appearance and AI features.
                </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="appearance" className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="appearance"><Monitor className="w-4 h-4 mr-2"/> Appearance</TabsTrigger>
                    <TabsTrigger value="ai"><Sparkles className="w-4 h-4 mr-2"/> AI</TabsTrigger>
                </TabsList>

                {/* --- APPEARANCE TAB --- */}
                <TabsContent value="appearance" className="space-y-6 mt-4">
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Theme Mode</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <Card 
                                className={cn("cursor-pointer hover:bg-muted/50 transition-all border-2", settings.theme === 'dark' ? "border-primary bg-primary/5" : "border-border")}
                                onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                            >
                                <CardContent className="flex items-center gap-4 p-4">
                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", settings.theme === 'dark' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                        <Moon size={20} />
                                    </div>
                                    <div>
                                        <div className="font-semibold">Dark Mode</div>
                                        <div className="text-xs text-muted-foreground">Eye-friendly dark interface</div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card 
                                className={cn("cursor-pointer hover:bg-muted/50 transition-all border-2", settings.theme === 'light' ? "border-primary bg-primary/5" : "border-border")}
                                onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                            >
                                <CardContent className="flex items-center gap-4 p-4">
                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", settings.theme === 'light' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                        <Sun size={20} />
                                    </div>
                                    <div>
                                        <div className="font-semibold">Light Mode</div>
                                        <div className="text-xs text-muted-foreground">High contrast light interface</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="space-y-4">
                         <Label className="text-base font-semibold">Language</Label>
                         <Select 
                            value={settings.language} 
                            onValueChange={(val: 'tr' | 'en') => onUpdateSettings({ ...settings, language: val })}
                         >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tr">🇹🇷 Türkçe (Turkish)</SelectItem>
                                <SelectItem value="en">🇺🇸 English</SelectItem>
                            </SelectContent>
                         </Select>
                         <p className="text-[10px] text-muted-foreground">* Changes will apply to some parts of the interface.</p>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Color Palette</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {PALETTES.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handlePaletteChange(p.id)}
                                    className={cn(
                                        "relative p-3 rounded-xl border flex items-center gap-4 transition-all overflow-hidden group hover:bg-muted",
                                        settings.palette === p.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border"
                                    )}
                                >
                                    <div className="flex gap-0 shrink-0 shadow-sm rounded-full overflow-hidden border border-border">
                                        <div className="w-3 h-6" style={{ backgroundColor: `rgb(${p.colors.ink})` }}></div>
                                        <div className="w-3 h-6" style={{ backgroundColor: `rgb(${p.colors.paprika})` }}></div>
                                        <div className="w-3 h-6" style={{ backgroundColor: `rgb(${p.colors.apricot})` }}></div>
                                    </div>
                                    <span className={cn("font-medium text-sm", settings.palette === p.id ? "text-primary" : "text-muted-foreground")}>{p.name}</span>
                                    {settings.palette === p.id && <Check className="absolute right-3 text-primary" size={16}/>}
                                </button>
                            ))}
                        </div>
                    </div>
                    <UpdateSettings />
                </TabsContent>

                {/* --- AI TAB --- */}
                <TabsContent value="ai" className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="gemini-key" className="text-base font-semibold">Gemini API Key</Label>
                        <div className="flex gap-2">
                            <Input
                                id="gemini-key"
                                type={showKey ? 'text' : 'password'}
                                autoComplete="off"
                                spellCheck={false}
                                placeholder="AIza..."
                                value={settings.geminiApiKey || ''}
                                onChange={(e) => onUpdateSettings({ ...settings, geminiApiKey: e.target.value.trim() })}
                                className="flex-1 font-mono"
                            />
                            <Button variant="outline" size="icon" onClick={() => setShowKey(v => !v)} aria-label={showKey ? 'Gizle' : 'Göster'}>
                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Şema analizi ve görselden parça listesi çıkarma için kullanılır. Anahtar yalnızca bu cihazda saklanır
                            ve doğrudan Google'a gönderilir. Anahtar almak için: aistudio.google.com/apikey
                        </p>
                    </div>
                </TabsContent>
            </Tabs>

            <DialogFooter>
                <Button onClick={onClose}>Close</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
};
