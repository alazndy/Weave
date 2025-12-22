// Cloud Sync Modal for Weave
import React, { useState, useEffect } from 'react';
import { X, Cloud, CloudOff, RefreshCw, Upload, Download, Wifi, WifiOff, Settings, Trash2 } from 'lucide-react';
import type { CloudProject, SyncSettings } from '../../types/cloud-sync';
import * as cloudSyncService from '../../services/cloudSyncService';

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
      case 'synced':
        return <Cloud className="h-5 w-5 text-green-500" />;
      case 'syncing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'pending':
        return <Cloud className="h-5 w-5 text-yellow-500" />;
      case 'offline':
        return <CloudOff className="h-5 w-5 text-gray-400" />;
      case 'error':
        return <CloudOff className="h-5 w-5 text-red-500" />;
      default:
        return <Cloud className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (syncState.status) {
      case 'synced':
        return syncState.lastSyncedAt ? `Son senkronizasyon: ${formatDate(syncState.lastSyncedAt)}` : 'Senkronize';
      case 'syncing':
        return 'Senkronize ediliyor...';
      case 'pending':
        return `${syncState.pendingChanges} bekleyen değişiklik`;
      case 'offline':
        return settings.offlineMode ? 'Çevrimdışı mod' : 'Bağlantı yok';
      case 'error':
        return syncState.error || 'Senkronizasyon hatası';
      default:
        return 'Bilinmeyen durum';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Cloud className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold dark:text-white">Bulut Senkronizasyonu</h2>
          </div>
          <div className="flex items-center gap-3">
            {isOnline ? (
              <span className="flex items-center text-sm text-green-600">
                <Wifi className="h-4 w-4 mr-1" />
                Çevrimiçi
              </span>
            ) : (
              <span className="flex items-center text-sm text-gray-400">
                <WifiOff className="h-4 w-4 mr-1" />
                Çevrimdışı
              </span>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <X className="h-5 w-5 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <span className="text-sm dark:text-gray-300">{getStatusText()}</span>
          </div>
          <button
            onClick={handleForceSync}
            disabled={!isOnline || isSyncing}
            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Senkronize Ediliyor...' : 'Şimdi Senkronize Et'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700">
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              activeTab === 'projects'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <Cloud className="h-4 w-4 inline mr-2" />
            Bulut Projeleri
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              activeTab === 'settings'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Ayarlar
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'projects' ? (
            <div className="space-y-3">
              {cloudProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Cloud className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>Bulut projesi bulunamadı</p>
                  <p className="text-sm mt-1">Projelerinizi yükleyerek başlayın</p>
                </div>
              ) : (
                cloudProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium dark:text-white">{project.name}</h4>
                      <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span>v{project.version}</span>
                        <span>{formatSize(project.sizeBytes)}</span>
                        <span>Son güncelleme: {formatDate(project.lastModifiedAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onDownload(project.id)}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                        title="İndir"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Auto Sync */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium dark:text-white">Otomatik Senkronizasyon</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Değişiklikler otomatik olarak senkronize edilsin
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSync}
                    onChange={(e) => handleUpdateSettings({ autoSync: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Offline Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium dark:text-white">Çevrimdışı Mod</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Senkronizasyonu duraklat ve çevrimdışı çalış
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.offlineMode}
                    onChange={(e) => handleUpdateSettings({ offlineMode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Sync Interval */}
              <div>
                <h4 className="font-medium dark:text-white mb-2">Senkronizasyon Aralığı</h4>
                <select
                  value={settings.syncIntervalMs}
                  onChange={(e) => handleUpdateSettings({ syncIntervalMs: Number(e.target.value) })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value={15000}>15 saniye</option>
                  <option value={30000}>30 saniye</option>
                  <option value={60000}>1 dakika</option>
                  <option value={300000}>5 dakika</option>
                </select>
              </div>

              {/* Conflict Resolution */}
              <div>
                <h4 className="font-medium dark:text-white mb-2">Çakışma Çözümü</h4>
                <select
                  value={settings.conflictResolution}
                  onChange={(e) => handleUpdateSettings({ conflictResolution: e.target.value as SyncSettings['conflictResolution'] })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="ask">Her zaman sor</option>
                  <option value="prefer_local">Yerel değişiklikleri tercih et</option>
                  <option value="prefer_remote">Uzak değişiklikleri tercih et</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloudSyncModal;
