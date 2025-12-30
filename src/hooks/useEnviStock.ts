/**
 * useEnviStock - React hook for ENV-I stock integration in Weave
 * Provides real-time stock data and status for components on the canvas
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  enviStockService, 
  ProductStock, 
  StockStatus,
  STOCK_STATUS_COLORS,
  STOCK_STATUS_LABELS
} from '../services/enviStockService';

interface UseEnviStockResult {
  products: ProductStock[];
  loading: boolean;
  error: string | null;
  
  // Actions
  searchProducts: (term: string) => Promise<ProductStock[]>;
  getProductStock: (productId: string) => ProductStock | undefined;
  getStockStatus: (productId: string) => StockStatus | null;
  getStockColor: (productId: string) => string;
  getStockLabel: (productId: string) => string;
  getLowStockProducts: () => ProductStock[];
  refresh: () => Promise<void>;
}

export function useEnviStock(): UseEnviStockResult {
  const [products, setProducts] = useState<ProductStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load and subscribe
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = enviStockService.subscribeToProducts(
      (updatedProducts) => {
        setProducts(updatedProducts);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError('ENV-I stok verilerine erişilemedi');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Search products
  const searchProducts = useCallback(async (term: string): Promise<ProductStock[]> => {
    if (!term || term.length < 2) return products;
    return await enviStockService.searchProducts(term);
  }, [products]);

  // Get single product stock
  const getProductStock = useCallback((productId: string): ProductStock | undefined => {
    return products.find(p => p.id === productId) || 
           enviStockService.getCachedProduct(productId);
  }, [products]);

  // Get stock status for a product
  const getStockStatus = useCallback((productId: string): StockStatus | null => {
    const product = getProductStock(productId);
    return product?.status || null;
  }, [getProductStock]);

  // Get stock color for UI
  const getStockColor = useCallback((productId: string): string => {
    const status = getStockStatus(productId);
    return status ? STOCK_STATUS_COLORS[status] : STOCK_STATUS_COLORS['in_stock'];
  }, [getStockStatus]);

  // Get stock label
  const getStockLabel = useCallback((productId: string): string => {
    const status = getStockStatus(productId);
    return status ? STOCK_STATUS_LABELS[status] : '';
  }, [getStockStatus]);

  // Get low stock products
  const getLowStockProducts = useCallback((): ProductStock[] => {
    return products.filter(p => p.status !== 'in_stock');
  }, [products]);

  // Manual refresh
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const allProducts = await enviStockService.getAllProducts();
      setProducts(allProducts);
      setError(null);
    } catch {
      setError('Stok verileri yenilenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    products,
    loading,
    error,
    searchProducts,
    getProductStock,
    getStockStatus,
    getStockColor,
    getStockLabel,
    getLowStockProducts,
    refresh,
  };
}

// Simplified hook for single product
export function useProductStock(productId: string | undefined) {
  const [product, setProduct] = useState<ProductStock | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      return;
    }

    setLoading(true);
    enviStockService.getProductStock(productId)
      .then(setProduct)
      .finally(() => setLoading(false));
  }, [productId]);

  return { product, loading };
}
