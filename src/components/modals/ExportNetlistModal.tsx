// Export Netlist Modal for Weave
import React, { useState, useMemo } from 'react';
import { X, FileDown, FileCode, AlertCircle, CheckCircle2, Copy, Download } from 'lucide-react';
import type { ProjectData } from '../../types';
import type { ExportOptions, NetlistFormat } from '../../types/netlist';
import { exportNetlist, getNetlistSummary } from '../../services/spiceExporter';
import { exportToKiCad } from '../../services/kicadExporter';

interface ExportNetlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: ProjectData;
}

const FORMAT_INFO: Record<NetlistFormat, { name: string; extensions: string; description: string }> = {
  spice: { name: 'SPICE', extensions: '.cir, .sp', description: 'Simülasyon için standart SPICE netlist' },
  ltspice: { name: 'LTSpice', extensions: '.asc', description: 'LTSpice uyumlu netlist' },
  kicad: { name: 'KiCad', extensions: '.kicad_sch', description: 'KiCad şematik dosyası' },
  altium: { name: 'Altium', extensions: '.SchDoc', description: 'Altium Designer formatı' },
  orcad: { name: 'OrCAD', extensions: '.net', description: 'OrCAD netlist formatı' },
  generic: { name: 'Genel', extensions: '.txt', description: 'Basit metin formatında netlist' },
};

export const ExportNetlistModal: React.FC<ExportNetlistModalProps> = ({
  isOpen,
  onClose,
  projectData,
}) => {
  const [format, setFormat] = useState<NetlistFormat>('generic');
  const [options, setOptions] = useState<Omit<ExportOptions, 'format'>>({
    includeComments: true,
    includeMetadata: true,
    includeUnconnectedPins: false,
    groupByPage: false,
    useCustomRefDesignators: false,
    refDesignatorPrefix: 'U',
  });
  const [preview, setPreview] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const summary = useMemo(() => getNetlistSummary(projectData), [projectData]);

  const handleGeneratePreview = () => {
    try {
      if (format === 'kicad') {
        const result = exportToKiCad(projectData);
        setPreview(result.schematic);
      } else {
        const result = exportNetlist(projectData, { format, ...options });
        setPreview(result);
      }
    } catch (error: any) {
      setPreview(`// Hata: ${error.message}`);
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    
    try {
      let content: string;
      let extension: string;
      
      if (format === 'kicad') {
        const result = exportToKiCad(projectData);
        content = result.schematic;
        extension = '.kicad_sch';
      } else {
        content = exportNetlist(projectData, { format, ...options });
        extension = format === 'spice' ? '.cir' : format === 'ltspice' ? '.asc' : '.txt';
      }
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectData.metadata.projectName.replace(/\s+/g, '_')}_netlist${extension}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    if (preview) {
      await navigator.clipboard.writeText(preview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FileCode className="h-6 w-6 text-green-500" />
            <h2 className="text-xl font-semibold dark:text-white">Netlist Dışa Aktar</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="h-5 w-5 dark:text-gray-300" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Options */}
          <div className="w-80 border-r dark:border-gray-700 p-4 overflow-y-auto">
            {/* Project Summary */}
            <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">Proje Özeti</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Bileşenler:</span>
                  <span className="font-medium dark:text-white">{summary.componentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Bağlantılar:</span>
                  <span className="font-medium dark:text-white">{summary.connectionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Sayfalar:</span>
                  <span className="font-medium dark:text-white">{summary.pageCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Bağlı olmayan portlar:</span>
                  <span className={`font-medium ${summary.unconnectedPorts > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {summary.unconnectedPorts}
                  </span>
                </div>
              </div>
            </div>

            {/* Format Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Çıktı Formatı
              </label>
              <div className="space-y-2">
                {(Object.keys(FORMAT_INFO) as NetlistFormat[]).map((f) => (
                  <label
                    key={f}
                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition ${
                      format === f
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={f}
                      checked={format === f}
                      onChange={() => setFormat(f)}
                      className="mt-0.5 mr-3"
                    />
                    <div>
                      <span className="font-medium text-sm dark:text-white">{FORMAT_INFO[f].name}</span>
                      <span className="text-xs text-gray-500 ml-2">{FORMAT_INFO[f].extensions}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {FORMAT_INFO[f].description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Export Options */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seçenekler
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.includeComments}
                    onChange={(e) => setOptions({ ...options, includeComments: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm dark:text-gray-300">Yorumları dahil et</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.includeMetadata}
                    onChange={(e) => setOptions({ ...options, includeMetadata: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm dark:text-gray-300">Metadata dahil et</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.includeUnconnectedPins}
                    onChange={(e) => setOptions({ ...options, includeUnconnectedPins: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm dark:text-gray-300">Bağlı olmayan pinleri dahil et</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={options.groupByPage}
                    onChange={(e) => setOptions({ ...options, groupByPage: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm dark:text-gray-300">Sayfaya göre grupla</span>
                </label>
              </div>
            </div>

            {/* Custom Ref Designator */}
            <div className="mb-6">
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={options.useCustomRefDesignators}
                  onChange={(e) => setOptions({ ...options, useCustomRefDesignators: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium dark:text-gray-300">Özel referans belirteç</span>
              </label>
              {options.useCustomRefDesignators && (
                <input
                  type="text"
                  value={options.refDesignatorPrefix}
                  onChange={(e) => setOptions({ ...options, refDesignatorPrefix: e.target.value })}
                  placeholder="Ön ek (örn: U, R, C)"
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              )}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-medium dark:text-white">Önizleme</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleGeneratePreview}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200"
                >
                  Önizleme Oluştur
                </button>
                {preview && (
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 flex items-center"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                        Kopyalandı
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Kopyala
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
              {preview ? (
                <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {preview}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <FileCode className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Önizleme oluşturmak için butona tıklayın</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            {summary.unconnectedPorts > 0 && (
              <span className="flex items-center text-yellow-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {summary.unconnectedPorts} bağlı olmayan port var
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              İptal
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Dışa Aktarılıyor...' : 'Dışa Aktar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportNetlistModal;
