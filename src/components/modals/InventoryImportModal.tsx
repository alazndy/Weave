import React, { useState, useEffect } from 'react';
import { X, Package, Search, Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useInventorySync, InventoryProduct } from '../../hooks/useInventorySync';
import { ProductTemplate } from '../../types';

interface InventoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: ProductTemplate[];
  setTemplates: (templates: ProductTemplate[]) => void;
  onImportComplete?: (template: ProductTemplate) => void;
}

export const InventoryImportModal: React.FC<InventoryImportModalProps> = ({
  isOpen,
  onClose,
  templates,
  setTemplates,
  onImportComplete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const {
    products,
    isLoading,
    error,
    lastSyncTime,
    fetchProducts,
    importProductAsTemplate,
    getUnimportedProducts,
  } = useInventorySync({ templates, setTemplates });

  // Fetch products when modal opens
  useEffect(() => {
    if (isOpen && products.length === 0) {
      fetchProducts();
    }
  }, [isOpen, products.length, fetchProducts]);

  if (!isOpen) return null;

  const unimportedProducts = getUnimportedProducts();
  
  const filteredProducts = unimportedProducts.filter(product => {
    const term = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(term) ||
      product.modelNumber?.toLowerCase().includes(term) ||
      product.manufacturer?.toLowerCase().includes(term) ||
      product.barcode?.toLowerCase().includes(term)
    );
  });

  const toggleSelect = (productId: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleImportSelected = () => {
    selectedProducts.forEach(productId => {
      const product = products.find(p => p.id === productId);
      if (product) {
        const template = importProductAsTemplate(product);
        if (template && onImportComplete) {
          onImportComplete(template);
        }
      }
    });
    setSelectedProducts(new Set());
    onClose();
  };

  const handleImportSingle = (product: InventoryProduct) => {
    // If product has a weave file or is already configured in Weave (via template), import directly
    if (product.weaveFileUrl || product.weaveTemplateId) {
        const template = importProductAsTemplate(product);
        if (template && onImportComplete) {
            onImportComplete(template);
        }
    } else {
        // No visual/file - Redirect to Editor to create/assign one
        // Create a basic template from the product and open editor
        const template = importProductAsTemplate(product); // This creates it in "unconfigured" state
        if (template && onImportComplete) {
            // Special flag or straight to onImportComplete which might handle "unconfigured" ?
            // The requirement is "go to product add screen [ProductEditor], ask for visual"
            // So we really want to pass this template to the Editor.
            // If onImportComplete puts it on the canvas, that's one way.
            // But we might want to open the MODAL editor.
            onImportComplete(template); 
            // NOTE: The parent component (App.tsx) needs to detect if this template is "incomplete" (mode='upload') and open the editor.
            // However, the user request says "go to product add screen".
            // Let's assume onImportComplete will eventually set it as the "active" template for the editor in App.tsx if we pass a flag.
        }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-ink border border-white/10 rounded-2xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-paprika/10 to-transparent">
          <div className="flex items-center gap-3">
            <Package className="text-paprika" size={24} />
            <div>
              <h2 className="text-lg font-bold text-white">Envanterden Ekle</h2>
              <p className="text-xs text-zinc-500">
                ENV-I envanterinden ürün seç ve Weave'e aktar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-2 hover:bg-white/10 rounded-lg transition"
            title="Kapat"
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Actions */}
        <div className="p-4 border-b border-white/5 flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ürün adı, model veya barkod ile ara..."
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-paprika/50 outline-none"
            />
          </div>
          <button
            onClick={fetchProducts}
            disabled={isLoading}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg flex items-center gap-2 text-sm font-medium transition disabled:opacity-50"
            title="Yenile"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Yenile
          </button>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 mb-4">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <RefreshCw size={32} className="animate-spin mb-3" />
              <span className="text-sm">Envanter yükleniyor...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
              <Package size={32} className="mb-3 opacity-50" />
              <span className="text-sm font-medium">
                {searchTerm ? 'Arama sonucu bulunamadı' : 'Tüm ürünler zaten içe aktarılmış'}
              </span>
              {products.length === 0 && !searchTerm && (
                <span className="text-xs mt-1 opacity-70">
                  Firebase bağlantısını kontrol edin
                </span>
              )}
            </div>
          ) : (
            <div className="grid gap-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => toggleSelect(product.id)}
                  className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${
                    selectedProducts.has(product.id)
                      ? 'bg-paprika/20 border-paprika/50'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  } border`}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                    selectedProducts.has(product.id)
                      ? 'bg-paprika border-paprika'
                      : 'border-zinc-600'
                  }`}>
                    {selectedProducts.has(product.id) && (
                      <CheckCircle size={14} className="text-white" />
                    )}
                  </div>

                  {/* Product Image or Placeholder */}
                  <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                    ) : (
                      <Package size={20} className="text-zinc-600" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{product.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      {product.modelNumber && <span>{product.modelNumber}</span>}
                      {product.manufacturer && (
                        <>
                          <span className="text-zinc-700">•</span>
                          <span>{product.manufacturer}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stock Badge */}
                  <div className={`px-2 py-1 rounded-md text-xs font-bold ${
                    product.stock > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {product.stock} adet
                  </div>

                  {/* Quick Import */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImportSingle(product);
                    }}
                    className="px-3 py-1.5 bg-paprika/20 hover:bg-paprika text-paprika hover:text-white rounded-lg text-xs font-bold transition"
                    title="Hemen içe aktar"
                  >
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
          <div className="text-xs text-zinc-600">
            {lastSyncTime && (
              <span>Son güncelleme: {lastSyncTime.toLocaleTimeString()}</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white text-sm font-medium transition"
            >
              İptal
            </button>
            <button
              onClick={handleImportSelected}
              disabled={selectedProducts.size === 0}
              className="px-4 py-2 bg-paprika hover:bg-paprika/80 text-white rounded-lg text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Download size={16} />
              Seçilenleri Aktar ({selectedProducts.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
