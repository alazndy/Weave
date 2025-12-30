import React, { useState, useEffect } from 'react';
import { Plus, FolderOpen, Clock, Users, LogIn, ChevronRight, LayoutTemplate, FileText, Settings, X, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
            
            <Card className="w-full max-w-5xl h-[600px] overflow-hidden grid grid-cols-12 border-border/40 shadow-2xl relative">
                 {/* Close Button */}
                 <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={onClose}
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
                            <h1 className="text-4xl font-bold tracking-tight text-foreground">
                                Weave
                            </h1>
                            <p className="text-muted-foreground font-medium text-lg">Modern Schematic Design</p>
                        </div>

                        <div className="space-y-4">
                            <Button 
                                onClick={onNewProject}
                                size="lg"
                                className="w-full h-14 justify-start pl-6 text-base font-medium shadow-md group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform" />
                                Create New Project
                            </Button>

                            <Button 
                                onClick={() => fileInputRef.current?.click()}
                                variant="outline"
                                size="lg"
                                className="w-full h-14 justify-start pl-6 text-base font-medium bg-background/50 hover:bg-background"
                            >
                                <FolderOpen className="w-5 h-5 mr-3 text-blue-500" />
                                Open Project
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

                    <div className="relative pt-6 border-t border-border/10 flex gap-4">
                         <Button variant="ghost" size="sm" onClick={onSettings} className="gap-2 text-muted-foreground">
                            <Settings className="w-4 h-4" /> Settings
                         </Button>
                         <Button variant="ghost" size="sm" onClick={onTeamManagement} className="gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" /> Team
                         </Button>
                    </div>
                </div>

                {/* Right Side: Recent Projects */}
                <div className="col-span-12 md:col-span-7 bg-background p-10 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            Recent Projects
                        </h2>
                        <Button variant="link" className="text-xs">View All</Button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2">
                        {recentProjects.length > 0 ? (
                            recentProjects.map((project, idx) => (
                                <div 
                                    key={project.id || idx}
                                    onClick={() => onOpenRecent(project)}
                                    className="group p-4 rounded-xl border border-border/40 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex items-center gap-4"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                                            {project.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">Edited: {project.date}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-4">
                                <div className="p-4 rounded-full bg-muted">
                                    <FolderOpen className="w-8 h-8 stroke-1" />
                                </div>
                                <p>No recent projects found</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t flex justify-between items-center">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                                TU
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">Turhan</span>
                                <span className="text-[10px] text-muted-foreground">Pro Plan</span>
                            </div>
                         </div>
                         <Button variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground hover:text-destructive">
                             <LogIn className="w-3 h-3" /> Sign Out
                         </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
