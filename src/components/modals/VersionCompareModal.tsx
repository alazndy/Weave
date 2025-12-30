import React, { useState, useEffect } from 'react';
import { X, GitCompare, ArrowRight, Ban, Check, AlertTriangle } from 'lucide-react';
import type { ProjectVersion, VersionDiff } from '../../types/version';
import * as versionService from '../../services/versionService';

interface VersionCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  initialVersionAId?: string | null;
  initialVersionBId?: string | null;
}

export const VersionCompareModal: React.FC<VersionCompareModalProps> = ({
  isOpen,
  onClose,
  projectId,
  initialVersionAId = null,
  initialVersionBId = null,
}) => {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [versionAId, setVersionAId] = useState<string | null>(initialVersionAId);
  const [versionBId, setVersionBId] = useState<string | null>(initialVersionBId);
  const [diff, setDiff] = useState<VersionDiff | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    if (versionAId && versionBId) {
      const result = versionService.compareVersions(versionAId, versionBId);
      setDiff(result);
    } else {
      setDiff(null);
    }
  }, [versionAId, versionBId]);

  // Update effect to handle prop changes when modal is already open
  useEffect(() => {
    if (initialVersionAId) setVersionAId(initialVersionAId);
    if (initialVersionBId) setVersionBId(initialVersionBId);
  }, [initialVersionAId, initialVersionBId]);


  const loadVersions = () => {
    const history = versionService.getVersionHistory(projectId);
    setVersions(history);
    // If not set, default to latest 2 versions if available
    if (!initialVersionAId && !versionAId && history.length >= 2) {
      setVersionAId(history[1].id); // Previous
      setVersionBId(history[0].id); // Latest
    }
  };

  const getVersionLabel = (id: string | null) => {
    if (!id) return 'Seçiniz...';
    const v = versions.find(ver => ver.id === id);
    return v ? `v${v.versionNumber} - ${v.commitMessage}` : 'Bilinmeyen Versiyon';
  };

  if (!isOpen) return null;

  const groupedChanges = diff?.changes.reduce((acc, change) => {
    const type = change.elementType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(change);
    return acc;
  }, {} as Record<string, typeof diff.changes>);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <GitCompare className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold dark:text-white">Versiyon Karşılaştırma</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="h-5 w-5 dark:text-gray-300" />
          </button>
        </div>

        {/* Selection Area */}
        <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-700/30 border-b dark:border-gray-700">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Eski Versiyon (A)</label>
            <select
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              value={versionAId || ''}
              onChange={(e) => setVersionAId(e.target.value)}
            >
              <option value="">Seçiniz</option>
              {versions.map(v => (
                 <option key={v.id} value={v.id}>v{v.versionNumber} - {v.commitMessage}</option>
              ))}
            </select>
          </div>
          
          <div className="px-6 flex items-center justify-center">
            <ArrowRight className="h-6 w-6 text-gray-400" />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Yeni Versiyon (B)</label>
            <select
              className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              value={versionBId || ''}
              onChange={(e) => setVersionBId(e.target.value)}
            >
               <option value="">Seçiniz</option>
              {versions.map(v => (
                 <option key={v.id} value={v.id}>v{v.versionNumber} - {v.commitMessage}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Diff Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!diff ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <GitCompare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Karşılaştırmak için iki versiyon seçin.</p>
            </div>
          ) : (
            <div className="space-y-6">
               {/* Summary Stats */}
               <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center border border-green-100 dark:border-green-900/30">
                     <div className="text-2xl font-bold text-green-600 dark:text-green-400">+{diff.summary.added}</div>
                     <div className="text-sm text-green-700 dark:text-green-300">Eklendi</div>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center border border-yellow-100 dark:border-yellow-900/30">
                     <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">~{diff.summary.modified}</div>
                     <div className="text-sm text-yellow-700 dark:text-yellow-300">Değiştirildi</div>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center border border-red-100 dark:border-red-900/30">
                     <div className="text-2xl font-bold text-red-600 dark:text-red-400">-{diff.summary.deleted}</div>
                     <div className="text-sm text-red-700 dark:text-red-300">Silindi</div>
                  </div>
               </div>

               {diff.changes.length === 0 && (
                   <div className="text-center py-8 text-gray-500">
                       <Check className="h-10 w-10 mx-auto mb-2 text-green-500" />
                       <p>Bu iki versiyon arasında fark bulunmamaktadır.</p>
                   </div>
               )}

               {/* Detailed Changes */}
               {groupedChanges && Object.entries(groupedChanges).map(([type, changes]) => (
                 <div key={type} className="border dark:border-gray-700 rounded-lg overflow-hidden">
                   <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 border-b dark:border-gray-700 font-medium capitalize text-gray-700 dark:text-gray-200">
                     {type} ({changes.length})
                   </div>
                   <div className="divide-y dark:divide-gray-700">
                     {changes.map((change, idx) => (
                       <div key={idx} className="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                         {change.type === 'added' && <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600"><Check className="h-4 w-4" /></div>}
                         {change.type === 'deleted' && <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600"><Ban className="h-4 w-4" /></div>}
                         {change.type === 'modified' && <div className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600"><AlertTriangle className="h-4 w-4" /></div>}
                         
                         <div className="flex-1">
                           <div className="flex items-center gap-2">
                             <span className={`font-medium ${
                               change.type === 'added' ? 'text-green-700 dark:text-green-400' :
                               change.type === 'deleted' ? 'text-red-700 dark:text-red-400' :
                               'text-yellow-700 dark:text-yellow-400'
                             }`}>
                               {change.elementName || change.elementId}
                             </span>
                           </div>
                           {change.details && <p className="text-xs text-gray-500 mt-0.5">{change.details}</p>}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionCompareModal;
