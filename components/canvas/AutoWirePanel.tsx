import React, { useMemo } from 'react';
import { suggestConnections, WiringSuggestion } from '../../utils/autoWire';
import { ProductInstance, ProductTemplate, Connection } from '../../types';

interface AutoWirePanelProps {
  selectedInstanceId: string | null;
  instances: ProductInstance[];
  templates: ProductTemplate[];
  connections: Connection[];
  onApplySuggestion: (suggestion: WiringSuggestion) => void;
  onDismiss: () => void;
}

export const AutoWirePanel: React.FC<AutoWirePanelProps> = ({
  selectedInstanceId,
  instances,
  templates,
  connections,
  onApplySuggestion,
  onDismiss
}) => {
  const suggestions = useMemo(() => {
    if (!selectedInstanceId) return [];
    return suggestConnections(selectedInstanceId, instances, templates, connections);
  }, [selectedInstanceId, instances, templates, connections]);

  if (!selectedInstanceId || suggestions.length === 0) return null;

  const selectedInstance = instances.find(i => i.id === selectedInstanceId);
  const selectedTemplate = templates.find(t => t.id === selectedInstance?.templateId);

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[320px] z-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-bold text-white">Akıllı Kablolama Önerileri</h3>
        </div>
        <button 
          onClick={onDismiss}
          className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-white/60 mb-4">
        <strong>{selectedTemplate?.name}</strong> için potansiyel bağlantılar tespit edildi:
      </p>

      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {suggestions.slice(0, 5).map((suggestion, idx) => {
          const fromInst = instances.find(i => i.id === suggestion.fromInstanceId);
          const toInst = instances.find(i => i.id === suggestion.toInstanceId);
          const fromTemplate = templates.find(t => t.id === fromInst?.templateId);
          const toTemplate = templates.find(t => t.id === toInst?.templateId);
          const fromPort = fromTemplate?.ports.find(p => p.id === suggestion.fromPortId);
          const toPort = toTemplate?.ports.find(p => p.id === suggestion.toPortId);

          return (
            <div 
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-white font-medium truncate">{fromTemplate?.name}</span>
                  <span className="text-white/40">→</span>
                  <span className="text-white font-medium truncate">{toTemplate?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/50 mt-1">
                  <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded">{fromPort?.label}</span>
                  <span>↔</span>
                  <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded">{toPort?.label}</span>
                </div>
                <p className="text-[10px] text-white/40 mt-1">{suggestion.reason}</p>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <span className={`text-[10px] font-bold ${
                  suggestion.confidence >= 80 ? 'text-emerald-400' : 
                  suggestion.confidence >= 60 ? 'text-amber-400' : 'text-white/50'
                }`}>
                  %{suggestion.confidence}
                </span>
                <button 
                  onClick={() => onApplySuggestion(suggestion)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {suggestions.length > 5 && (
        <p className="text-[10px] text-white/40 text-center mt-3">
          +{suggestions.length - 5} daha fazla öneri mevcut
        </p>
      )}

      <div className="flex gap-2 mt-4">
        <button 
          onClick={() => suggestions.forEach(s => onApplySuggestion(s))}
          className="flex-1 py-2 px-4 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
        >
          Tümünü Bağla
        </button>
        <button 
          onClick={onDismiss}
          className="py-2 px-4 rounded-xl bg-white/5 text-white/60 text-xs font-medium hover:bg-white/10 transition-colors"
        >
          Atla
        </button>
      </div>
    </div>
  );
};
