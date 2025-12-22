// Version History Modal for Weave
import React, { useState, useEffect } from 'react';
import { X, Clock, Tag, Trash2, RotateCcw, GitCompare, Download, ChevronDown, ChevronRight } from 'lucide-react';
import type { ProjectVersion, VersionDiff } from '../../types/version';
import type { ProjectData } from '../../types';
import * as versionService from '../../services/versionService';
import { VersionCompareModal } from './VersionCompareModal';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  userId: string;
  onRestore: (projectData: ProjectData) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  projectId,
  userId,
  onRestore,
}) => {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [filter, setFilter] = useState<'all' | 'tagged' | 'manual' | 'autosave'>('all');
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, projectId, filter]);

  const loadVersions = () => {
    const history = versionService.getVersionHistory(projectId, filter);
    setVersions(history);
  };

  const handleRestore = (versionId: string) => {
    const data = versionService.restoreVersion(versionId);
    if (data) {
      if (confirm('Bu versiyona geri dönmek istediğinize emin misiniz?')) {
        onRestore(data);
        onClose();
      }
    }
  };

  const handleDelete = (versionId: string) => {
    if (confirm('Bu versiyonu silmek istediğinize emin misiniz?')) {
      versionService.deleteVersion(versionId);
      loadVersions();
    }
  };

  const handleToggleTag = (versionId: string) => {
    const label = prompt('Versiyon etiketi girin (boş bırakabilirsiniz):');
    versionService.toggleVersionTag(versionId, label || undefined);
    loadVersions();
  };

  const handleExport = () => {
    const data = versionService.exportVersions(projectId);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `versions_${projectId}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedVersions);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedVersions(newSet);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-semibold dark:text-white">Versiyon Geçmişi</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCompareModalOpen(true)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition"
              >
                <GitCompare className="h-4 w-4 inline mr-1" />
                Karşılaştır
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
              >
                <Download className="h-4 w-4 inline mr-1" />
                Dışa Aktar
              </button>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="h-5 w-5 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 p-4 border-b dark:border-gray-700">
            {(['all', 'tagged', 'manual', 'autosave'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filter === f
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {f === 'all' && 'Tümü'}
                {f === 'tagged' && 'Etiketli'}
                {f === 'manual' && 'Manuel'}
                {f === 'autosave' && 'Otomatik'}
              </button>
            ))}
          </div>

          {/* Version List */}
          <div className="flex-1 overflow-y-auto p-4">
            {versions.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Versiyon geçmişi bulunamadı</p>
              </div>
            ) : (
              <div className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="border dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => toggleExpand(version.id)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedVersions.has(version.id) ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                              v{version.versionNumber}
                            </span>
                            {version.isTagged && (
                              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded-full flex items-center">
                                <Tag className="h-3 w-3 mr-1" />
                                {version.label || 'Tagged'}
                              </span>
                            )}
                            {version.commitMessage.startsWith('[Auto-save]') && (
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                                Auto
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
                            {version.commitMessage}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(version.createdAt)}</span>
                    </div>

                    {expandedVersions.has(version.id) && (
                      <div className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleToggleTag(version.id)}
                            className="px-3 py-1.5 text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200"
                          >
                            <Tag className="h-4 w-4 inline mr-1" />
                            {version.isTagged ? 'Etiketi Kaldır' : 'Etiketle'}
                          </button>
                          <button
                            onClick={() => handleRestore(version.id)}
                            className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200"
                          >
                            <RotateCcw className="h-4 w-4 inline mr-1" />
                            Geri Yükle
                          </button>
                          {!version.isTagged && (
                            <button
                              onClick={() => handleDelete(version.id)}
                              className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200"
                            >
                              <Trash2 className="h-4 w-4 inline mr-1" />
                              Sil
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <VersionCompareModal 
        isOpen={compareModalOpen} 
        onClose={() => setCompareModalOpen(false)}
        projectId={projectId}
      />
    </>
  );
};

export default VersionHistoryModal;
