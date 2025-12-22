// Part Lookup Panel for Weave
import React, { useState, useCallback } from 'react';
import { Search, Package, DollarSign, Truck, ExternalLink, X, ShoppingCart, RefreshCw } from 'lucide-react';
import type { PartSearchResult, PartSearchParams } from '../../types/integrations';
import * as partLookupService from '../../services/partLookupService';

interface PartLookupPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPart?: (part: PartSearchResult) => void;
}

export const PartLookupPanel: React.FC<PartLookupPanelProps> = ({
  isOpen,
  onClose,
  onSelectPart,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PartSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState<PartSearchResult | null>(null);
  const [filters, setFilters] = useState<Partial<PartSearchParams>>({
    inStockOnly: false,
    sortBy: 'relevance',
  });

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const searchResults = await partLookupService.searchParts({
        query,
        ...filters,
        maxResults: 20,
      });
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getSourceLogo = (source: string) => {
    switch (source) {
      case 'digikey':
        return '🟠';
      case 'mouser':
        return '🔵';
      case 'octopart':
        return '🟢';
      case 'jlcpcb':
        return '🟣';
      default:
        return '⚪';
    }
  };

  const getSourceName = (source: string) => {
    switch (source) {
      case 'digikey':
        return 'Digi-Key';
      case 'mouser':
        return 'Mouser';
      case 'octopart':
        return 'Octopart';
      case 'jlcpcb':
        return 'JLCPCB';
      default:
        return source;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold dark:text-white">Parça Arama</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <X className="h-5 w-5 dark:text-gray-300" />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Parça numarası veya açıklama..."
              className="w-full pl-10 pr-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mt-3">
          <label className="flex items-center text-sm dark:text-gray-300">
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={(e) => setFilters({ ...filters, inStockOnly: e.target.checked })}
              className="mr-2"
            />
            Sadece stokta
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
            className="px-2 py-1 text-sm border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
          >
            <option value="relevance">Alakalı</option>
            <option value="price">Fiyat</option>
            <option value="stock">Stok</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Package className="h-12 w-12 mb-2 opacity-30" />
            <p className="text-sm">Parça aramak için yukarıdaki alanı kullanın</p>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {results.map((part) => (
              <div
                key={`${part.source}-${part.partNumber}`}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition ${
                  selectedPart?.partNumber === part.partNumber ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => setSelectedPart(part)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getSourceLogo(part.source)}</span>
                      <span className="font-mono font-medium text-sm dark:text-white">
                        {part.partNumber}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {part.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{part.manufacturer}</p>
                  </div>
                  <div className="text-right ml-3">
                    {part.pricing[0] && (
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        {partLookupService.formatPrice(part.pricing[0].unitPrice, part.pricing[0].currency)}
                      </p>
                    )}
                    <p className={`text-xs mt-1 ${part.stock.inStock ? 'text-green-500' : 'text-red-500'}`}>
                      {part.stock.inStock ? `${part.stock.quantity} adet` : 'Stokta yok'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Part Details */}
      {selectedPart && (
        <div className="border-t dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium dark:text-white">{selectedPart.partNumber}</h4>
            <button
              onClick={() => setSelectedPart(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Specs */}
          {selectedPart.specifications && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-gray-500 mb-1">Özellikler</h5>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {Object.entries(selectedPart.specifications).slice(0, 6).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-500">{key}:</span>
                    <span className="dark:text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Tiers */}
          <div className="mb-3">
            <h5 className="text-xs font-medium text-gray-500 mb-1">Fiyatlandırma</h5>
            <div className="flex gap-2 flex-wrap">
              {selectedPart.pricing.map((tier, i) => (
                <span key={i} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  {tier.quantity}+: {partLookupService.formatPrice(tier.unitPrice, tier.currency)}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {selectedPart.datasheetUrl && (
              <a
                href={selectedPart.datasheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-3 py-2 text-sm border dark:border-gray-600 rounded-lg text-center hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
              >
                Datasheet
              </a>
            )}
            <a
              href={selectedPart.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-2 text-sm border dark:border-gray-600 rounded-lg text-center hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white flex items-center justify-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              {getSourceName(selectedPart.source)}
            </a>
            {onSelectPart && (
              <button
                onClick={() => onSelectPart(selectedPart)}
                className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-1"
              >
                <ShoppingCart className="h-3 w-3" />
                Ekle
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PartLookupPanel;
