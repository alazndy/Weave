// Library Browser Component for Weave
import React, { useState, useMemo, useCallback } from 'react';
import { Search, Grid, List, Heart, Clock, Tag, Package, Plus, Star, ChevronRight, Filter } from 'lucide-react';
import type { LibraryComponent, LibraryCategory, LibrarySearchParams } from '../../types/library';
import { DEFAULT_CATEGORIES } from '../../types/library';

interface LibraryBrowserProps {
  components: LibraryComponent[];
  onSelectComponent: (component: LibraryComponent) => void;
  onToggleFavorite: (componentId: string) => void;
  onCreateComponent?: () => void;
}

type ViewMode = 'grid' | 'list';

export const LibraryBrowser: React.FC<LibraryBrowserProps> = ({
  components,
  onSelectComponent,
  onToggleFavorite,
  onCreateComponent,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'recent'>('name');

  // Filter and sort components
  const filteredComponents = useMemo(() => {
    let filtered = [...components];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)) ||
          c.manufacturer?.toLowerCase().includes(q) ||
          c.partNumber?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((c) => c.categoryId === selectedCategory);
    }

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter((c) => c.isFavorite);
    }

    // Sort
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'usage':
        filtered.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'recent':
        filtered.sort((a, b) => {
          const dateA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
          const dateB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }

    return filtered;
  }, [components, searchQuery, selectedCategory, showFavoritesOnly, sortBy]);

  // Get recently used components
  const recentlyUsed = useMemo(() => {
    return [...components]
      .filter((c) => c.lastUsedAt)
      .sort((a, b) => {
        const dateA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
        const dateB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [components]);

  // Get most used components
  const mostUsed = useMemo(() => {
    return [...components].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);
  }, [components]);

  const getCategoryName = (categoryId: string) => {
    const cat = DEFAULT_CATEGORIES.find((c) => c.id === categoryId);
    return cat?.name || categoryId;
  };

  const handleDoubleClick = (component: LibraryComponent) => {
    onSelectComponent(component);
  };

  return (
    <div className="flex h-full bg-white dark:bg-gray-800">
      {/* Sidebar - Categories */}
      <div className="w-48 border-r dark:border-gray-700 flex flex-col">
        <div className="p-3 border-b dark:border-gray-700">
          <h3 className="font-semibold text-sm dark:text-white">Kategoriler</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
              !selectedCategory ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'dark:text-gray-300'
            }`}
          >
            <Package className="h-4 w-4" />
            Tümü
            <span className="ml-auto text-xs text-gray-400">{components.length}</span>
          </button>
          
          {DEFAULT_CATEGORIES.map((category) => {
            const count = components.filter((c) => c.categoryId === category.id).length;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  selectedCategory === category.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                    : 'dark:text-gray-300'
                }`}
              >
                <span>{category.icon || '📦'}</span>
                {category.name}
                {count > 0 && (
                  <span className="ml-auto text-xs text-gray-400">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Access */}
        <div className="border-t dark:border-gray-700 p-3">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 rounded-lg ${
              showFavoritesOnly
                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'
            }`}
          >
            <Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-yellow-500' : ''}`} />
            Favoriler
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="p-3 border-b dark:border-gray-700 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Bileşen ara..."
              className="w-full pl-10 pr-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="name">Ada göre</option>
            <option value="usage">Kullanıma göre</option>
            <option value="recent">Son kullanılana göre</option>
          </select>

          <div className="flex border dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-300'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-300'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {onCreateComponent && (
            <button
              onClick={onCreateComponent}
              className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Yeni
            </button>
          )}
        </div>

        {/* Quick Access Sections */}
        {!searchQuery && !selectedCategory && !showFavoritesOnly && (
          <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex gap-6">
              {/* Recently Used */}
              {recentlyUsed.length > 0 && (
                <div className="flex-1">
                  <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Son Kullanılanlar
                  </h4>
                  <div className="flex gap-2 overflow-x-auto">
                    {recentlyUsed.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => onSelectComponent(c)}
                        className="px-3 py-1.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg text-xs whitespace-nowrap hover:border-blue-500"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Most Used */}
              {mostUsed.length > 0 && (
                <div className="flex-1">
                  <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    En Çok Kullanılan
                  </h4>
                  <div className="flex gap-2 overflow-x-auto">
                    {mostUsed.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => onSelectComponent(c)}
                        className="px-3 py-1.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg text-xs whitespace-nowrap hover:border-blue-500"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Component Grid/List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredComponents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Package className="h-12 w-12 mb-2 opacity-30" />
              <p className="text-sm">Bileşen bulunamadı</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-3 gap-4">
              {filteredComponents.map((component) => (
                <div
                  key={component.id}
                  className="border dark:border-gray-700 rounded-lg p-3 hover:border-blue-500 cursor-pointer transition group"
                  onDoubleClick={() => handleDoubleClick(component)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center relative">
                    {component.thumbnailUrl ? (
                      <img
                        src={component.thumbnailUrl}
                        alt={component.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-gray-300" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(component.id);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          component.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Info */}
                  <h4 className="font-medium text-sm dark:text-white truncate">{component.name}</h4>
                  <p className="text-xs text-gray-500 truncate">{getCategoryName(component.categoryId)}</p>
                  
                  {component.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {component.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredComponents.map((component) => (
                <div
                  key={component.id}
                  className="flex items-center gap-4 p-3 border dark:border-gray-700 rounded-lg hover:border-blue-500 cursor-pointer transition"
                  onDoubleClick={() => handleDoubleClick(component)}
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    {component.thumbnailUrl ? (
                      <img
                        src={component.thumbnailUrl}
                        alt={component.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-gray-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm dark:text-white">{component.name}</h4>
                    <p className="text-xs text-gray-500">
                      {getCategoryName(component.categoryId)}
                      {component.manufacturer && ` • ${component.manufacturer}`}
                      {component.partNumber && ` • ${component.partNumber}`}
                    </p>
                  </div>

                  {/* Usage */}
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {component.usageCount}x
                  </div>

                  {/* Favorite */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(component.id);
                    }}
                  >
                    <Star
                      className={`h-5 w-5 ${
                        component.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  </button>

                  <ChevronRight className="h-5 w-5 text-gray-300" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="px-4 py-2 border-t dark:border-gray-700 text-xs text-gray-500 flex items-center justify-between">
          <span>{filteredComponents.length} bileşen</span>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-blue-500 hover:underline"
            >
              Filtreyi temizle
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryBrowser;
