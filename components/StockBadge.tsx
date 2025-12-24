/**
 * StockBadge - Component to display ENV-I stock status on Weave canvas
 */

import React from 'react';
import { useProductStock } from '../hooks/useEnviStock';
import { STOCK_STATUS_COLORS, STOCK_STATUS_LABELS, StockStatus } from '../services/enviStockService';

interface StockBadgeProps {
  productId?: string;
  productName?: string;
  showQuantity?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StockBadge({
  productId,
  productName,
  showQuantity = false,
  size = 'sm',
  className = '',
}: StockBadgeProps) {
  const { product, loading } = useProductStock(productId);

  if (!productId) return null;

  if (loading) {
    return (
      <div 
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 animate-pulse ${className}`}
        style={{ fontSize: size === 'sm' ? '10px' : size === 'md' ? '12px' : '14px' }}
      >
        <span className="w-2 h-2 rounded-full bg-gray-400" />
        <span>...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div 
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 ${className}`}
        style={{ fontSize: size === 'sm' ? '10px' : size === 'md' ? '12px' : '14px' }}
      >
        <span className="w-2 h-2 rounded-full bg-gray-300" />
        <span>Bilinmiyor</span>
      </div>
    );
  }

  const color = STOCK_STATUS_COLORS[product.status];
  const label = STOCK_STATUS_LABELS[product.status];

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${className}`}
      style={{
        fontSize: size === 'sm' ? '10px' : size === 'md' ? '12px' : '14px',
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
      title={`${product.name}: ${product.currentStock} ${product.unit}`}
    >
      <span 
        className="w-2 h-2 rounded-full" 
        style={{ backgroundColor: color }}
      />
      <span className="font-medium">{label}</span>
      {showQuantity && (
        <span className="opacity-75">
          ({product.currentStock} {product.unit})
        </span>
      )}
    </div>
  );
}

// Compact indicator for canvas components
interface StockIndicatorProps {
  productId?: string;
  size?: number;
}

export function StockIndicator({ productId, size = 8 }: StockIndicatorProps) {
  const { product, loading } = useProductStock(productId);

  if (!productId || loading) return null;

  const color = product 
    ? STOCK_STATUS_COLORS[product.status] 
    : '#9ca3af';

  return (
    <div
      className="absolute top-1 right-1 rounded-full shadow-sm"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        border: '1px solid white',
      }}
      title={product 
        ? `${product.name}: ${product.currentStock} ${product.unit}` 
        : 'Stok bilgisi yok'
      }
    />
  );
}

// Stock status panel for sidebar
interface StockPanelProps {
  productIds: string[];
  onProductClick?: (productId: string) => void;
}

export function StockPanel({ productIds, onProductClick }: StockPanelProps) {
  return (
    <div className="space-y-2 p-3 bg-white rounded-lg shadow-sm border">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        ENV-I Stok Durumu
      </h4>
      {productIds.length === 0 ? (
        <p className="text-xs text-gray-400">
          Tasarımda ürün yok
        </p>
      ) : (
        <div className="space-y-1">
          {productIds.map(id => (
            <StockPanelItem 
              key={id} 
              productId={id} 
              onClick={() => onProductClick?.(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StockPanelItem({ 
  productId, 
  onClick 
}: { 
  productId: string; 
  onClick?: () => void;
}) {
  const { product, loading } = useProductStock(productId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-2 rounded bg-gray-50 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-gray-300" />
        <span className="text-xs text-gray-400">Yükleniyor...</span>
      </div>
    );
  }

  if (!product) return null;

  const color = STOCK_STATUS_COLORS[product.status];

  return (
    <div 
      className="flex items-center justify-between gap-2 p-2 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span 
          className="w-2 h-2 rounded-full flex-shrink-0" 
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-medium truncate">{product.name}</span>
      </div>
      <span className="text-xs text-gray-500 flex-shrink-0">
        {product.currentStock} {product.unit}
      </span>
    </div>
  );
}
