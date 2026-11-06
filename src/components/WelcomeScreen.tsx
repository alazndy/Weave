import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, Clock, ChevronRight, LayoutTemplate, FileText, Settings, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { listRecentProjects, deleteProject, type RecentProject } from '../services/projectStore';

interface WelcomeScreenProps {
    onNewProject: () => void;
    onOpenProject: (file: File) => void;
    onOpenRecent: (project: RecentProject) => void;
    onSettings?: () => void;
    onClose: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNewProject, onOpenProject, onOpenRecent, onSettings, onClose }) => {
    const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
    const [loadError, setLoadError] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        listRecentProjects()
            .then(setRecentProjects)
            .catch(err => { console.error('Recent projects unavailable', err); setLoadError(true); });
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onOpenProject(file);
        e.target.value = '';
    };

    const handleDelete = async (e: React.MouseEvent, project: RecentProject) => {
        e.stopPropagation();
        if (!confirm(`"${project.name}" yerel kayıtlardan silinsin mi?`)) return;
        await deleteProject(project.id);
        setRecentProjects(prev => prev.filter(p => p.id !== project.id));
    };

    return (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-5xl h-[600px] overflow-hidden grid grid-cols-12 border-border/40 shadow-2xl relative">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    aria-label="Kapat"
                    className="absolute top-4 right-4 z-50 rounded-full hover:bg-background/20"
                >
                    <X className="w-5 h-5 text-muted-foreground" />
                </Button>

                {/* Left Side: Hero & Actions */}
                <div className="col-span-12 md:col-span-5 bg-muted/30 p-10 flex flex-col justify-between border-r border-border/40 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

                    <div className="relative">
                        <div className="mb-10 space-y-2">
                            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                                <LayoutTemplate className="w-6 h-6 text-primary-foreground" />
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight text-foreground">Weave</h1>
                            <p className="text-muted-foreground font-medium text-lg">Sistem Kablolama Şemaları</p>
                        </div>

                        <div className="space-y-4">
                            <Button
                                onClick={onNewProject}
                                size="lg"
                                className="w-full h-14 justify-start pl-6 text-base font-medium shadow-md group"
                            >
                                <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform" />
                                Yeni Proje
                            </Button>

                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant="outline"
                                size="lg"
                                className="w-full h-14 justify-start pl-6 text-base font-medium bg-background/50 hover:bg-background"
                            >
                                <FolderOpen className="w-5 h-5 mr-3 text-blue-500" />
                                Dosyadan Aç (.weave)
                            </Button>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".weave,.json"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    {onSettings && (
                        <div className="relative pt-6 border-t border-border/10 flex gap-4">
                            <Button variant="ghost" size="sm" onClick={onSettings} className="gap-2 text-muted-foreground">
                                <Settings className="w-4 h-4" /> Ayarlar
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right Side: Recent Projects */}
                <div className="col-span-12 md:col-span-7 bg-background p-10 flex flex-col">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            Son Projeler
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1">Projeler bu cihazda otomatik kaydedilir.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2">
                        {recentProjects.length > 0 ? (
                            recentProjects.map(project => (
                                <div
                                    key={project.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onOpenRecent(project)}
                                    onKeyDown={e => { if (e.key === 'Enter') onOpenRecent(project); }}
                                    className="group p-4 rounded-xl border border-border/40 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex items-center gap-4"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium truncate group-hover:text-primary transition-colors">{project.name}</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Son düzenleme: {new Date(project.updatedAt).toLocaleString('tr-TR')}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Sil"
                                        onClick={e => handleDelete(e, project)}
                                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-4">
                                <div className="p-4 rounded-full bg-muted">
                                    <FolderOpen className="w-8 h-8 stroke-1" />
                                </div>
                                <p>{loadError ? 'Yerel kayıtlara erişilemedi' : 'Henüz kayıtlı proje yok'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};
