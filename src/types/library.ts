// Component Library Types for Weave

export interface LibraryCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  parentId?: string; // For nested categories
  order: number;
}

export interface LibraryComponent {
  id: string;
  templateId: string;
  categoryId: string;
  name: string;
  description?: string;
  tags: string[];
  manufacturer?: string;
  partNumber?: string;
  thumbnailUrl?: string;
  isFavorite: boolean;
  usageCount: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LibrarySearchParams {
  query?: string;
  categoryId?: string;
  tags?: string[];
  favoritesOnly?: boolean;
  manufacturer?: string;
  sortBy?: 'name' | 'usage' | 'recent' | 'created';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface RecentlyUsedConfig {
  maxItems: number;
  showInSidebar: boolean;
}

export interface FavoriteGroup {
  id: string;
  name: string;
  color?: string;
  componentIds: string[];
  order: number;
}

export interface LibraryStats {
  totalComponents: number;
  totalCategories: number;
  totalFavorites: number;
  mostUsed: { componentId: string; name: string; count: number }[];
  recentlyAdded: LibraryComponent[];
}

// Default component categories
export const DEFAULT_CATEGORIES: LibraryCategory[] = [
  { id: 'cameras', name: 'Kameralar', icon: 'Camera', order: 1 },
  { id: 'monitors', name: 'Monitörler', icon: 'Monitor', order: 2 },
  { id: 'sensors', name: 'Sensörler', icon: 'Radio', order: 3 },
  { id: 'recorders', name: 'Kayıt Cihazları', icon: 'HardDrive', order: 4 },
  { id: 'cables', name: 'Kablolar', icon: 'Cable', order: 5 },
  { id: 'connectors', name: 'Konnektörler', icon: 'Plug', order: 6 },
  { id: 'power', name: 'Güç Kaynakları', icon: 'Zap', order: 7 },
  { id: 'accessories', name: 'Aksesuarlar', icon: 'Package', order: 8 },
  { id: 'radars', name: 'Radar Sistemleri', icon: 'Radar', order: 9 },
  { id: 'alarms', name: 'Alarm Sistemleri', icon: 'Bell', order: 10 },
  { id: 'custom', name: 'Özel Bileşenler', icon: 'Puzzle', order: 99 },
];
