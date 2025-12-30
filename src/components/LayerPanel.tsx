/**
 * LayerPanel - Component for managing canvas layers in Weave
 */

import React, { useState } from 'react';
import { Layer, DEFAULT_LAYERS } from '../types/layer';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Trash2, 
  Plus,
  ChevronUp,
  ChevronDown,
  Layers,
  GripVertical
} from 'lucide-react';

interface LayerPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  activeLayerId: string | null;
  onLayerSelect: (layerId: string) => void;
  onLayerUpdate: (layerId: string, updates: Partial<Layer>) => void;
  onLayerAdd: (layer: Partial<Layer>) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerReorder: (fromIndex: number, toIndex: number) => void;
}

export function LayerPanel({
  layers,
  selectedLayerId,
  activeLayerId,
  onLayerSelect,
  onLayerUpdate,
  onLayerAdd,
  onLayerDelete,
  onLayerReorder,
}: LayerPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Sort layers by order (highest first for display)
  const sortedLayers = [...layers].sort((a, b) => b.order - a.order);

  const handleToggleVisibility = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      onLayerUpdate(layerId, { visible: !layer.visible });
    }
  };

  const handleToggleLock = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      onLayerUpdate(layerId, { locked: !layer.locked });
    }
  };

  const handleAddLayer = () => {
    const maxOrder = Math.max(...layers.map(l => l.order), 0);
    onLayerAdd({
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 100,
      order: maxOrder + 1,
      elementIds: [],
    });
  };

  const handleStartRename = (layer: Layer) => {
    setEditingId(layer.id);
    setEditName(layer.name);
  };

  const handleFinishRename = () => {
    if (editingId && editName.trim()) {
      onLayerUpdate(editingId, { name: editName.trim() });
    }
    setEditingId(null);
    setEditName('');
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      onLayerReorder(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < sortedLayers.length - 1) {
      onLayerReorder(index, index + 1);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Katmanlar</span>
        </div>
        <button
          onClick={handleAddLayer}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Yeni Katman"
        >
          <Plus className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto">
        {sortedLayers.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-400">
            Henüz katman yok
          </div>
        ) : (
          <div className="py-1">
            {sortedLayers.map((layer, index) => (
              <div
                key={layer.id}
                className={`
                  flex items-center gap-1 px-2 py-1.5 mx-1 rounded cursor-pointer
                  transition-colors
                  ${selectedLayerId === layer.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}
                  ${activeLayerId === layer.id ? 'border-l-2 border-l-blue-500' : ''}
                `}
                onClick={() => onLayerSelect(layer.id)}
              >
                {/* Drag handle */}
                <GripVertical className="h-3 w-3 text-gray-300 cursor-grab" />
                
                {/* Color indicator */}
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: layer.color || '#gray' }}
                />

                {/* Layer name */}
                {editingId === layer.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleFinishRename}
                    onKeyDown={(e) => e.key === 'Enter' && handleFinishRename()}
                    className="flex-1 text-sm px-1 border rounded focus:outline-none focus:border-blue-400"
                    autoFocus
                  />
                ) : (
                  <span 
                    className={`flex-1 text-sm truncate ${!layer.visible ? 'text-gray-400' : 'text-gray-700'}`}
                    onDoubleClick={() => handleStartRename(layer)}
                  >
                    {layer.name}
                  </span>
                )}

                {/* Element count */}
                <span className="text-xs text-gray-400">
                  {layer.elementIds.length}
                </span>

                {/* Visibility toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleVisibility(layer.id); }}
                  className="p-0.5 hover:bg-gray-200 rounded"
                  title={layer.visible ? 'Gizle' : 'Göster'}
                >
                  {layer.visible ? (
                    <Eye className="h-3.5 w-3.5 text-gray-500" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-gray-300" />
                  )}
                </button>

                {/* Lock toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleLock(layer.id); }}
                  className="p-0.5 hover:bg-gray-200 rounded"
                  title={layer.locked ? 'Kilidi Aç' : 'Kilitle'}
                >
                  {layer.locked ? (
                    <Lock className="h-3.5 w-3.5 text-amber-500" />
                  ) : (
                    <Unlock className="h-3.5 w-3.5 text-gray-300" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Selected layer actions */}
      {selectedLayerId && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-1">
            <button
              onClick={() => handleMoveUp(sortedLayers.findIndex(l => l.id === selectedLayerId))}
              className="p-1 hover:bg-gray-200 rounded"
              title="Yukarı Taşı"
            >
              <ChevronUp className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={() => handleMoveDown(sortedLayers.findIndex(l => l.id === selectedLayerId))}
              className="p-1 hover:bg-gray-200 rounded"
              title="Aşağı Taşı"
            >
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Saydamlık:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={layers.find(l => l.id === selectedLayerId)?.opacity || 100}
              onChange={(e) => onLayerUpdate(selectedLayerId, { opacity: Number(e.target.value) })}
              className="w-16 h-1"
            />
          </div>
          
          <button
            onClick={() => onLayerDelete(selectedLayerId)}
            className="p-1 hover:bg-red-100 rounded text-red-500"
            title="Katmanı Sil"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// Hook for layer management
export function useLayerState() {
  const [layers, setLayers] = useState<Layer[]>(() => {
    return DEFAULT_LAYERS.map((layer, index) => ({
      ...layer,
      id: `layer_${index}_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  });
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  const handleLayerUpdate = (layerId: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, ...updates, updatedAt: new Date() } 
        : layer
    ));
  };

  const handleLayerAdd = (layerData: Partial<Layer>) => {
    const newLayer: Layer = {
      id: `layer_${Date.now()}`,
      name: layerData.name || 'New Layer',
      visible: layerData.visible ?? true,
      locked: layerData.locked ?? false,
      opacity: layerData.opacity ?? 100,
      order: layerData.order ?? layers.length,
      elementIds: layerData.elementIds || [],
      color: layerData.color,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const handleLayerDelete = (layerId: string) => {
    setLayers(prev => prev.filter(l => l.id !== layerId));
    if (selectedLayerId === layerId) setSelectedLayerId(null);
    if (activeLayerId === layerId) setActiveLayerId(null);
  };

  const handleLayerReorder = (fromIndex: number, toIndex: number) => {
    setLayers(prev => {
      const sorted = [...prev].sort((a, b) => b.order - a.order);
      const [moved] = sorted.splice(fromIndex, 1);
      sorted.splice(toIndex, 0, moved);
      return sorted.map((layer, index) => ({
        ...layer,
        order: sorted.length - 1 - index,
      }));
    });
  };

  return {
    layers,
    selectedLayerId,
    activeLayerId,
    setSelectedLayerId,
    setActiveLayerId,
    handleLayerUpdate,
    handleLayerAdd,
    handleLayerDelete,
    handleLayerReorder,
  };
}
