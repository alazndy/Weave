import React, { useState } from 'react';
import { AppSettings } from '../../types';
import { Settings, Moon, Sun, Monitor, Globe, Palette, Check, Users, Plus, Trash2, Sliders, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
}

export const PALETTES = [
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
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'viewer' as 'viewer' | 'manager' | 'admin' });

  const handlePaletteChange = (paletteId: string) => {
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
                    Customize your workspace appearance and manage team settings.
                </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="appearance" className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="appearance"><Monitor className="w-4 h-4 mr-2"/> Appearance</TabsTrigger>
                    <TabsTrigger value="integrations"><Share2 className="w-4 h-4 mr-2"/> Integrations</TabsTrigger>
                    <TabsTrigger value="team"><Users className="w-4 h-4 mr-2"/> Team</TabsTrigger>
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
                </TabsContent>

                {/* --- INTEGRATIONS TAB --- */}
                <TabsContent value="integrations" className="space-y-6 mt-4">
                    <div className="border rounded-xl p-4 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">UPH Integration</Label>
                            <p className="text-sm text-muted-foreground">Sync projects directly to Unified Project Hub</p>
                        </div>
                        <Switch 
                            checked={settings.enableUPHIntegration}
                            onCheckedChange={(checked) => onUpdateSettings({ ...settings, enableUPHIntegration: checked })}
                        />
                    </div>

                    <div className="border rounded-xl p-4 flex items-center justify-between">
                         <div className="space-y-0.5">
                            <Label className="text-base">Google Drive</Label>
                            <p className="text-sm text-muted-foreground">Backup projects to your Drive automatically</p>
                        </div>
                        <Switch 
                            checked={settings.enableGoogleDrive}
                            onCheckedChange={(checked) => onUpdateSettings({ ...settings, enableGoogleDrive: checked })}
                        />
                    </div>
                </TabsContent>

                {/* --- TEAM TAB --- */}
                <TabsContent value="team" className="space-y-6 mt-4">
                    <div className="space-y-4">
                        <Label className="text-base">Add Team Member</Label>
                        <div className="flex gap-2 items-start">
                            <Input 
                                placeholder="Name Surname" 
                                value={newMember.name}
                                onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                                className="flex-1"
                            />
                            <Input 
                                placeholder="Email" 
                                type="email"
                                value={newMember.email}
                                onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                                className="flex-1"
                            />
                            <Select 
                                value={newMember.role} 
                                onValueChange={(val: 'viewer'|'manager'|'admin') => setNewMember({...newMember, role: val})}
                            >
                                 <SelectTrigger className="w-[110px]">
                                    <SelectValue placeholder="Role" />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                 </SelectContent>
                            </Select>
                            <Button 
                                size="icon"
                                onClick={() => {
                                    if (newMember.name && newMember.email) {
                                        const member = {
                                            id: crypto.randomUUID(),
                                            name: newMember.name,
                                            email: newMember.email,
                                            role: newMember.role
                                        };
                                        onUpdateSettings({ 
                                            ...settings, 
                                            teamMembers: [...(settings.teamMembers || []), member] 
                                        });
                                        setNewMember({ name: '', email: '', role: 'viewer' });
                                    }
                                }}
                                disabled={!newMember.name || !newMember.email}
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Team Members</Label>
                        {settings.teamMembers?.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground">
                                <div>
                                    <div className="font-medium">{member.name}</div>
                                    <div className="text-xs text-muted-foreground">{member.email} • <span className="uppercase text-primary font-bold">{member.role}</span></div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={() => onUpdateSettings({
                                        ...settings,
                                        teamMembers: settings.teamMembers?.filter(m => m.id !== member.id)
                                    })}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        {(!settings.teamMembers || settings.teamMembers.length === 0) && (
                            <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg bg-muted/20">
                                No team members added yet.
                            </div>
                        )}
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
