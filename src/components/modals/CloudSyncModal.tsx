// Cloud Sync Modal for Weave
import React, { useState, useEffect } from 'react';
import { X, Cloud, CloudOff, RefreshCw, Upload, Download, Wifi, WifiOff, Settings, Trash2, CheckCircle2, AlertTriangle, CloudRain, Zap } from 'lucide-react';
import type { CloudProject, SyncSettings } from '../../types/cloud-sync';
import * as cloudSyncService from '../../services/cloudSyncService';
import { PremiumModal } from '../ui/PremiumModal';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  userId: string;
  onDownload: (cloudProjectId: string) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  projectId,
  userId,
  onDownload,
}) => {
  const [cloudProjects, setCloudProjects] = useState<CloudProject[]>([]);
  const [syncState, setSyncState] = useState(() => cloudSyncService.getSyncState(projectId));
  const [settings, setSettings] = useState<SyncSettings>(() => cloudSyncService.getSyncSettings());
  const [isOnline, setIsOnline] = useState(() => cloudSyncService.isOnline());
  const [activeTab, setActiveTab] = useState<'projects' | 'settings'>('projects');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCloudProjects(cloudSyncService.getCloudProjects());
      setSyncState(cloudSyncService.getSyncState(projectId));
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    const cleanup = cloudSyncService.setupConnectivityListener(
      () => setIsOnline(true),
      () => setIsOnline(false)
    );
    return cleanup;
  }, []);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await cloudSyncService.processOfflineQueue(projectId, userId);
      setSyncState(cloudSyncService.getSyncState(projectId));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateSettings = (updates: Partial<SyncSettings>) => {
    const updated = cloudSyncService.updateSyncSettings(updates);
    setSettings(updated);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getStatusIcon = () => {
    switch (syncState.status) {
      case 'synced': return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      case 'syncing': return <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />;
      case 'pending': return <Cloud className="h-5 w-5 text-amber-400" />;
      case 'offline': return <CloudOff className="h-5 w-5 text-zinc-500" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-400" />;
      default: return <Cloud className="h-5 w-5 text-zinc-500" />;
    }
  };

  const getStatusText = () => {
    switch (syncState.status) {
      case 'synced': return syncState.lastSyncedAt ? `Son senkronizasyon: ${formatDate(syncState.lastSyncedAt)}` : 'Senkronize';
      case 'syncing': return 'Senkronize ediliyor...';
      case 'pending': return `${syncState.pendingChanges} bekleyen değişiklik`;
      case 'offline': return settings.offlineMode ? 'Çevrimdışı mod' : 'Bağlantı yok';
      case 'error': return syncState.error || 'Senkronizasyon hatası';
      default: return 'Bilinmeyen durum';
    }
  };

  // Custom Header Content for PremiumModal
  const headerContent = (
      <div className="flex items-center gap-3">
          {isOnline ? (
              <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
                  <Wifi className="h-3 w-3 mr-1" /> Çevrimiçi
              </span>
          ) : (
              <span className="flex items-center text-xs font-bold text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-full border border-zinc-700">
                  <WifiOff className="h-3 w-3 mr-1" /> Çevrimdışı
              </span>
          )}
      </div>
  );

  return (
    <PremiumModal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulut Senkronizasyonu"
      icon={<Cloud className="text-blue-400 w-5 h-5" />}
      headerAction={headerContent}
      width="max-w-3xl"
    >
        <div className="flex flex-col h-[500px]">
            {/* Status Bar */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/10 to-transparent rounded-xl border border-blue-500/10 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-black/20 rounded-full border border-white/5">
                        {getStatusIcon()}
                    </div>
                    <span className="text-sm font-medium text-zinc-300">{getStatusText()}</span>
                </div>
                <button
                    onClick={handleForceSync}
                    disabled={!isOnline || isSyncing}
                    className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                >
                    <RefreshCw className={`h-3 w-3 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Senkronize Ediliyor...' : 'Şimdi Senkronize Et'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-white/5 pb-1">
                <button
                    onClick={() => setActiveTab('projects')}
                    className={`pb-3 text-sm font-bold transition-all relative ${
                        activeTab === 'projects'
                            ? 'text-blue-400'
                            : 'text-zinc-500 hover:text-white'
                    }`}
                >
                    <div className="flex items-center gap-2">
                         <Cloud className="h-4 w-4" /> Bulut Projeleri
                    </div>
                    {activeTab === 'projects' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`pb-3 text-sm font-bold transition-all relative ${
                        activeTab === 'settings'
                            ? 'text-blue-400'
                            : 'text-zinc-500 hover:text-white'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" /> Ayarlar
                    </div>
                    {activeTab === 'settings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {activeTab === 'projects' ? (
                    <div className="space-y-3">
                        {cloudProjects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-zinc-500 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                                <div className="p-4 bg-white/5 rounded-full mb-4">
                                     <CloudRain className="h-8 w-8 opacity-50" />
                                </div>
                                <p className="font-medium">Bulut projesi bulunamadı</p>
                                <p className="text-xs mt-1 text-zinc-600">Projelerinizi güvenle yedeklemek için senkronizasyonu başlatın.</p>
                            </div>
                        ) : (
                            cloudProjects.map((project) => (
                                <div
                                    key={project.id}
                                    className="group flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/10 transition-all cursor-default"
                                >
                                    <div className="flex-1">
                                        <h4 className="font-bold text-zinc-200 group-hover:text-white transition-colors flex items-center gap-2">
                                            {project.name}
                                            {project.id === projectId && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20">Aktif</span>}
                                        </h4>
                                        <div className="flex gap-4 text-xs text-zinc-500 mt-1.5 font-medium">
                                            <span className="flex items-center gap-1"><Zap size={10}/> v{project.version}</span>
                                            <span>{formatSize(project.sizeBytes)}</span>
                                            <span>{formatDate(project.lastModifiedAt)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onDownload(project.id)}
                                            className="p-2 hover:bg-blue-500 hover:text-white text-zinc-400 rounded-lg transition-colors border border-transparent hover:border-blue-400/30"
                                            title="İndir"
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>
                                        <button
                                            className="p-2 hover:bg-red-500 hover:text-white text-zinc-400 rounded-lg transition-colors border border-transparent hover:border-red-400/30"
                                            title="Sil"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                             <h3 className="text-sm font-bold text-white mb-4">Senkronizasyon Tercihleri</h3>
                             
                             <div className="space-y-4">
                                <label className="flex items-center justify-between p-3 bg-black/20 rounded-xl cursor-pointer hover:bg-black/30 transition-colors group">
                                    <div>
                                        <span className="block text-sm font-bold text-zinc-300 group-hover:text-white">Otomatik Senkronizasyon</span>
                                        <span className="text-xs text-zinc-500">Değişiklikleri anında buluta gönder</span>
                                    </div>
                                    <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${settings.autoSync ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${settings.autoSync ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.autoSync}
                                        onChange={(e) => handleUpdateSettings({ autoSync: e.target.checked })}
                                        className="hidden"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 bg-black/20 rounded-xl cursor-pointer hover:bg-black/30 transition-colors group">
                                    <div>
                                        <span className="block text-sm font-bold text-zinc-300 group-hover:text-white">Çevrimdışı Mod</span>
                                        <span className="text-xs text-zinc-500">İnternet bağlantısını yoksay ve yerel çalış</span>
                                    </div>
                                    <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 ${settings.offlineMode ? 'bg-amber-500' : 'bg-zinc-700'}`}>
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${settings.offlineMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.offlineMode}
                                        onChange={(e) => handleUpdateSettings({ offlineMode: e.target.checked })}
                                        className="hidden"
                                    />
                                </label>

                                <label className="flex items-center justify-between p-3 bg-black/20 rounded-xl cursor-pointer hover:bg-black/30 transition-colors group">
                                    <div>
                                        <span className="block text-sm font-bold text-zinc-300 group-hover:text-white">Çakışma Çözümü</span>
                                        <span className="text-xs text-zinc-500">Versiyon çakışmalarında öncelik</span>
                                    </div>
                                    <select
                                        value={settings.conflictResolution}
                                        onChange={(e) => handleUpdateSettings({ conflictResolution: e.target.value as any })}
                                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 font-bold"
                                    >
                                        <option value="manual">Bana Sor</option>
                                        <option value="client-wins">Yerel Kazansın</option>
                                        <option value="server-wins">Bulut Kazansın</option>
                                    </select>
                                </label>
                             </div>
                        </div>

                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                            <h4 className="text-xs font-bold text-blue-300 mb-2 flex items-center gap-2"><Upload className="h-3 w-3"/> Depolama Durumu</h4>
                            <div className="w-full bg-black/40 rounded-full h-2 mb-2 overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full" style={{ width: '15%' }}></div>
                            </div>
                            <div className="flex justify-between text-[10px] font-medium text-zinc-500">
                                <span>Kullanılan: 156 MB</span>
                                <span>Toplam: 1 GB</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </PremiumModal>
  );
};
