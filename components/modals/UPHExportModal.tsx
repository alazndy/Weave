import React, { useEffect, useState } from 'react';
import { useUPHSync, UPHProject } from '../../hooks/useUPHSync';
import { ProjectData } from '../../types';
import html2canvas from 'html2canvas';
import { Loader2, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface UPHExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: ProjectData;
  projectName: string;
}

export function UPHExportModal({ isOpen, onClose, projectData, projectName }: UPHExportModalProps) {
  const { projects, loading, uploading, fetchProjects, uploadDesign } = useUPHSync();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      setSuccess(false);
      setError(null);
      setSelectedProjectId('');
    }
  }, [isOpen, fetchProjects]);

  const handleUpload = async () => {
    if (!selectedProjectId) return;
    try {
      setError(null);
      
      // Capture Thumbnail
      let thumbnailDataUrl: string | undefined = undefined;
      const element = document.getElementById('canvas-export-area');
      if (element) {
          try {
             // Temporarily reset transform for capture if needed, or just capture view
             const canvas = await html2canvas(element as HTMLElement, {
                 scale: 0.5, // Smaller scale for thumbnail
                 useCORS: true,
                 allowTaint: true,
                 backgroundColor: '#ffffff',
                 ignoreElements: (el) => el.classList.contains('no-print')
             });
             thumbnailDataUrl = canvas.toDataURL('image/png', 0.8);
          } catch(e) {
              console.warn("Thumbnail generation failed:", e);
          }
      }

      await uploadDesign(selectedProjectId, projectData, projectName, thumbnailDataUrl);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to upload design. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] w-[500px] border border-[#333] rounded-lg shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-400" />
            Send to UPH Project
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p>Loading projects...</p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center py-8 text-green-400">
              <CheckCircle2 className="w-12 h-12 mb-2" />
              <p className="font-medium">Design sent successfully!</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Select Target Project</label>
                <div className="max-h-[300px] overflow-y-auto border border-[#333] rounded-md bg-[#111]">
                  {projects.length === 0 ? (
                     <div className="p-4 text-center text-gray-500 text-sm">No UPH projects found.</div>
                  ) : (
                    projects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => setSelectedProjectId(project.id)}
                        className={`w-full text-left px-4 py-3 border-b last:border-0 border-[#222] hover:bg-[#252525] transition-colors flex flex-col ${
                          selectedProjectId === project.id ? 'bg-[#2a2d3e] border-l-2 border-l-blue-500' : ''
                        }`}
                      >
                        <span className="text-gray-200 font-medium">{project.name}</span>
                        {project.description && (
                          <span className="text-gray-500 text-xs truncate mt-1">{project.description}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-900/20 border border-red-900/50 rounded flex items-center gap-2 text-red-200 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && !loading && (
          <div className="px-6 py-4 bg-[#181818] border-t border-[#333] flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded text-gray-300 hover:text-white hover:bg-[#333] transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedProjectId || uploading}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Design
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
