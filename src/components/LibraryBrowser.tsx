// Library Browser Component for Weave
import React, { useState, useMemo } from 'react';
import { Search, Grid, List, Heart, Clock, Tag, Package, Plus, Star, ChevronRight, Filter } from 'lucide-react';
import type { LibraryComponent } from '../../types/library';
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
    <div className="flex h-full glass-panel overflow-hidden rounded-xl border border-white/20 shadow-2xl">
      {/* Sidebar - Categories */}
      <div className="w-56 border-r border-white/5 flex flex-col bg-white/5 backdrop-blur-sm">
        <div className="p-4 border-b border-white/5 bg-white/5">
          <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Filter size={14}/> Kategoriler
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full px-3 py-2.5 text-left text-sm font-medium flex items-center gap-3 rounded-lg transition-all ${
              !selectedCategory 
                ? 'bg-paprika/10 text-paprika shadow-sm' 
                : 'text-zinc-500 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Package className="h-4 w-4" />
            Tümü
            <span className={`ml-auto text-xs font-bold py-0.5 px-2 rounded-full ${!selectedCategory ? 'bg-paprika/20 text-paprika' : 'bg-white/5 text-zinc-500'}`}>{components.length}</span>
          </button>
          
          {DEFAULT_CATEGORIES.map((category) => {
            const count = components.filter((c) => c.categoryId === category.id).length;
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full px-3 py-2.5 text-left text-sm font-medium flex items-center gap-3 rounded-lg transition-all ${
                  isSelected
                    ? 'bg-paprika/10 text-paprika shadow-sm'
                    : 'text-zinc-500 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{category.icon || '📦'}</span>
                {category.name}
                {count > 0 && (
                  <span className={`ml-auto text-xs font-bold py-0.5 px-2 rounded-full ${isSelected ? 'bg-paprika/20 text-paprika' : 'bg-white/5 text-zinc-500'}`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Access */}
        <div className="border-t border-white/5 p-3 m-2 bg-black/20 rounded-xl">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`w-full px-3 py-2.5 text-left text-sm font-bold flex items-center gap-2 rounded-lg transition-all ${
              showFavoritesOnly
                ? 'bg-amber-500/10 text-amber-500 shadow-sm'
                : 'text-zinc-500 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Star className={`h-4 w-4 ${showFavoritesOnly ? 'fill-amber-500' : ''}`} />
            Favoriler
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-zinc-900/50 backdrop-blur-xl">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
          <div className="flex-1 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-paprika transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Bileşen ara..."
              className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:border-paprika/50 focus:ring-1 focus:ring-paprika/50 outline-none transition-all"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm text-zinc-300 focus:border-paprika outline-none cursor-pointer hover:bg-black/30 transition-colors"
          >
            <option value="name">Ada göre</option>
            <option value="usage">Kullanıma göre</option>
            <option value="recent">Son kullanılana göre</option>
          </select>

          <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {onCreateComponent && (
            <button
              onClick={onCreateComponent}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-transform active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Yeni
            </button>
          )}
        </div>

        {/* Quick Access Sections */}
        {!searchQuery && !selectedCategory && !showFavoritesOnly && (
          <div className="p-4 border-b border-white/5 bg-white/[0.01]">
            <div className="flex gap-6">
              {/* Recently Used */}
              {recentlyUsed.length > 0 && (
                <div className="flex-1">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Son Kullanılanlar
                  </h4>
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {recentlyUsed.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => onSelectComponent(c)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-lg text-xs font-medium text-zinc-300 hover:text-white whitespace-nowrap transition-all"
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
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Heart className="h-3 w-3 text-paprika" />
                    En Çok Kullanılan
                  </h4>
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {mostUsed.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => onSelectComponent(c)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-lg text-xs font-medium text-zinc-300 hover:text-white whitespace-nowrap transition-all"
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
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {filteredComponents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                 <Package className="h-10 w-10 opacity-50" />
              </div>
              <p className="text-sm font-medium">Bileşen bulunamadı</p>
              <p className="text-xs text-zinc-600 mt-1">Arama kriterlerinizi değiştirin.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredComponents.map((component) => (
                <div
                  key={component.id}
                  className="group relative bg-white/5 hover:bg-white/10 border border-white/5 hover:border-paprika/30 rounded-xl p-3 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1"
                  onDoubleClick={() => handleDoubleClick(component)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-black/20 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden group-hover:ring-1 ring-white/10 transition-all">
                    {component.thumbnailUrl ? (
                      <img
                        src={component.thumbnailUrl}
                        alt={component.name}
                        className="w-full h-full object-contain p-4 transition-transform group-hover:scale-110 duration-500"
                      />
                    ) : (
                      <Package className="h-8 w-8 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(component.id);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 transform"
                    >
                      <Star
                        className={`h-5 w-5 drop-shadow-md ${
                          component.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-zinc-500 hover:text-white'
                        }`}
                      />
                    </button>
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-paprika/0 group-hover:bg-paprika/5 pointer-events-none transition-colors duration-300"></div>
                  </div>

                  {/* Info */}
                  <h4 className="font-bold text-sm text-zinc-200 group-hover:text-white truncate mb-1 transition-colors">{component.name}</h4>
                  <p className="text-xs text-zinc-500 truncate group-hover:text-zinc-400 transition-colors">{getCategoryName(component.categoryId)}</p>
                  
                  {component.tags.length > 0 && (
                    <div className="flex gap-1 mt-3 flex-wrap">
                      {component.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-black/20 text-[10px] font-medium text-zinc-400 rounded border border-white/5"
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
                  className="group flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-paprika/30 rounded-xl cursor-pointer transition-all hover:shadow-lg"
                  onDoubleClick={() => handleDoubleClick(component)}
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 bg-black/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:border-white/10 transition-colors">
                    {component.thumbnailUrl ? (
                      <img
                        src={component.thumbnailUrl}
                        alt={component.name}
                        className="max-w-full max-h-full object-contain p-1"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-zinc-600" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-zinc-200 group-hover:text-white transition-colors">{component.name}</h4>
                    <p className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors flex items-center gap-2">
                      {getCategoryName(component.categoryId)}
                      {(component.manufacturer || component.partNumber) && <span className="w-1 h-1 rounded-full bg-zinc-600"></span>}
                      {component.manufacturer && <span className="font-mono text-zinc-400">{component.manufacturer}</span>}
                      {component.partNumber && <span className="font-mono text-zinc-400">{component.partNumber}</span>}
                    </p>
                  </div>

                  {/* Usage */}
                  <div className="text-xs text-zinc-500 flex items-center gap-1 group-hover:text-zinc-300 transition-colors">
                    <Clock className="h-3 w-3" />
                    {component.usageCount}x
                  </div>

                  {/* Favorite */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(component.id);
                    }}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        component.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-zinc-600 hover:text-white'
                      }`}
                    />
                  </button>

                  <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="px-4 py-3 border-t border-white/5 bg-black/20 text-xs text-zinc-500 font-medium flex items-center justify-between">
          <span>{filteredComponents.length} bileşen listelendi</span>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-paprika hover:text-apricot transition-colors hover:underline"
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
