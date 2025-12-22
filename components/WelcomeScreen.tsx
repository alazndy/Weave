
import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, Clock, Users, LogIn, ChevronRight, LayoutTemplate, FileText, Settings, X } from 'lucide-react';
import { PremiumButton } from './ui/PremiumButton';
import { ProjectMetadata } from '../types';

interface RecentProject {
    id: string; // usually filename or unique ID if available
    name: string;
    date: string;
    path?: string; // for electron/local apps if applicable
}

interface WelcomeScreenProps {
    onNewProject: () => void;
    onOpenProject: (file: File) => void;
    onOpenRecent: (project: RecentProject) => void;
    onSettings?: () => void;
    onTeamManagement?: () => void;
    onClose: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNewProject, onOpenProject, onOpenRecent, onSettings, onTeamManagement, onClose }) => {
    const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Mock loading recent projects (in real app, load from localStorage or DB)
    useEffect(() => {
        const savedRecents = localStorage.getItem('weave_recent_projects');
        if (savedRecents) {
            setRecentProjects(JSON.parse(savedRecents));
        } else {
             // Mock data for demonstration if empty
             setRecentProjects([
                 { id: '1', name: 'Fabrika Otomasyon Rev.2', date: '2023-12-20' },
                 { id: '2', name: 'Pano Taslağı v4', date: '2023-12-18' },
                 { id: '3', name: 'Saha Dağıtım Kutusu', date: '2023-12-15' },
             ]);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onOpenProject(e.target.files[0]);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-zinc-950 flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>
                <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-emerald-500/10 rounded-full blur-[80px]"></div>
            </div>

            <div className="max-w-5xl w-full h-[600px] glass-panel border border-white/10 rounded-3xl shadow-2xl flex relative overflow-hidden animate-in zoom-in-95 duration-500">
                 {/* Close Button (for convenience if user wants to just see empty canvas) */}
                 <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors z-50 hover:bg-white/5 rounded-full"
                    title="Kapat"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Left Side: Hero & Actions */}
                <div className="w-[40%] bg-black/20 p-10 flex flex-col justify-between border-r border-white/5 relative">
                    <div>
                        {/* Brand */}
                        <div className="mb-10">
                            <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-500 mb-2">
                                Weave
                            </h1>
                            <p className="text-zinc-400 font-medium">Yeni Nesil Şematik Tasarım</p>
                        </div>

                        {/* Main Actions */}
                        <div className="space-y-4">
                            <PremiumButton 
                                onClick={onNewProject}
                                variant="premium" 
                                className="w-full text-lg h-14 justify-start pl-6 group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                <Plus className="w-6 h-6 mr-3 group-hover:rotate-90 transition-transform" />
                                Yeni Proje Oluştur
                            </PremiumButton>

                            <PremiumButton 
                                onClick={() => fileInputRef.current?.click()}
                                variant="glass" 
                                className="w-full text-lg h-14 justify-start pl-6 group hover:bg-white/10 text-zinc-200"
                            >
                                <FolderOpen className="w-6 h-6 mr-3 text-blue-400 group-hover:scale-110 transition-transform" />
                                Proje Aç (.weave)
                            </PremiumButton>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept=".weave,.json"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    {/* Bottom Links */}
                    <div className="flex gap-4 pt-6 border-t border-white/5">
                         <button onClick={onSettings} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium">
                            <Settings className="w-4 h-4" /> Ayarlar
                         </button>
                         <button onClick={onTeamManagement} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-medium">
                            <Users className="w-4 h-4" /> Takım Yönetimi
                         </button>
                    </div>
                </div>

                {/* Right Side: Recent Projects */}
                <div className="flex-1 bg-zinc-900/50 p-10 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-zinc-200 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-zinc-500" />
                            Son Çalışmalar
                        </h2>
                        <button className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                            Tümünü Gör
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4">
                        {recentProjects.length > 0 ? (
                            <div className="space-y-3">
                                {recentProjects.map((project, idx) => (
                                    <div 
                                        key={project.id || idx}
                                        onClick={() => onOpenRecent(project)}
                                        className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center gap-4 animate-in slide-in-from-right-4 duration-500"
                                        style={{ animationDelay: `${idx * 100}ms` }}
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <LayoutTemplate className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-zinc-200 text-base truncate group-hover:text-white transition-colors">
                                                {project.name}
                                            </h3>
                                            <p className="text-xs text-zinc-500 mt-0.5">Son Düzenleme: {project.date}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-60">
                                <FileText className="w-16 h-16 mb-4 stroke-1" />
                                <p>Henüz son kullanılan proje yok.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-emerald-500/20">
                                TR
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-zinc-300">Hoş Geldiniz, Turhan</span>
                                <span className="text-xs text-zinc-500">Pro Sürüm</span>
                            </div>
                         </div>
                         <button className="text-xs font-bold text-zinc-500 hover:text-white flex items-center gap-1 transition-colors">
                             <LogIn className="w-3 h-3" /> Çıkış Yap
                         </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
