/**
 * ENV-I Stock Integration Service for Weave
 * Provides real-time stock data from ENV-I Firestore
 */

import { db } from '../lib/firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';

// Product stock info from ENV-I
export interface ProductStock {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  price: number;
  currency: string;
  warehouseId?: string;
  warehouseName?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastUpdated: Date;
}

// Stock status thresholds
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export const STOCK_STATUS_COLORS: Record<StockStatus, string> = {
  'in_stock': '#22c55e',    // green
  'low_stock': '#f59e0b',   // amber
  'out_of_stock': '#ef4444', // red
};

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  'in_stock': 'Stokta',
  'low_stock': 'Az Kaldı',
  'out_of_stock': 'Stok Yok',
};

class EnviStockService {
  private productsCache: Map<string, ProductStock> = new Map();
  private unsubscribe: Unsubscribe | null = null;

  /**
   * Calculate stock status based on current vs min stock
   */
  private calculateStatus(current: number, min: number): StockStatus {
    if (current <= 0) return 'out_of_stock';
    if (current <= min) return 'low_stock';
    return 'in_stock';
  }

  /**
   * Get all products with stock info
   */
  async getAllProducts(): Promise<ProductStock[]> {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const products = snapshot.docs.map(doc => {
        const data = doc.data();
        const currentStock = data.currentStock || data.quantity || 0;
        const minStock = data.minStock || data.minQuantity || 0;
        
        return {
          id: doc.id,
          name: data.name || data.productName || 'Unknown',
          sku: data.sku || data.partNumber || '',
          category: data.category || '',
          currentStock,
          minStock,
          maxStock: data.maxStock || data.maxQuantity || 0,
          unit: data.unit || 'adet',
          price: data.price || data.unitPrice || 0,
          currency: data.currency || 'TRY',
          warehouseId: data.warehouseId,
          warehouseName: data.warehouseName,
          status: this.calculateStatus(currentStock, minStock),
          lastUpdated: data.updatedAt?.toDate() || new Date(),
        };
      });

      // Update cache
      products.forEach(p => this.productsCache.set(p.id, p));
      
      return products;
    } catch (error) {
      console.error('Error fetching products from ENV-I:', error);
      return [];
    }
  }

  /**
   * Get single product stock info
   */
  async getProductStock(productId: string): Promise<ProductStock | null> {
    // Check cache first
    if (this.productsCache.has(productId)) {
      return this.productsCache.get(productId)!;
    }

    try {
      const docSnap = await getDoc(doc(db, 'products', productId));
      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      const currentStock = data.currentStock || data.quantity || 0;
      const minStock = data.minStock || data.minQuantity || 0;

      const product: ProductStock = {
        id: docSnap.id,
        name: data.name || data.productName || 'Unknown',
        sku: data.sku || data.partNumber || '',
        category: data.category || '',
        currentStock,
        minStock,
        maxStock: data.maxStock || data.maxQuantity || 0,
        unit: data.unit || 'adet',
        price: data.price || data.unitPrice || 0,
        currency: data.currency || 'TRY',
        warehouseId: data.warehouseId,
        warehouseName: data.warehouseName,
        status: this.calculateStatus(currentStock, minStock),
        lastUpdated: data.updatedAt?.toDate() || new Date(),
      };

      this.productsCache.set(productId, product);
      return product;
    } catch (error) {
      console.error('Error fetching product stock:', error);
      return null;
    }
  }

  /**
   * Search products by name or SKU
   */
  async searchProducts(searchTerm: string): Promise<ProductStock[]> {
    const allProducts = await this.getAllProducts();
    const term = searchTerm.toLowerCase();
    
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  }

  /**
   * Subscribe to real-time product updates
   */
  subscribeToProducts(
    onUpdate: (products: ProductStock[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const unsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const products = snapshot.docs.map(doc => {
          const data = doc.data();
          const currentStock = data.currentStock || data.quantity || 0;
          const minStock = data.minStock || data.minQuantity || 0;

          return {
            id: doc.id,
            name: data.name || data.productName || 'Unknown',
            sku: data.sku || data.partNumber || '',
            category: data.category || '',
            currentStock,
            minStock,
            maxStock: data.maxStock || data.maxQuantity || 0,
            unit: data.unit || 'adet',
            price: data.price || data.unitPrice || 0,
            currency: data.currency || 'TRY',
            warehouseId: data.warehouseId,
            warehouseName: data.warehouseName,
            status: this.calculateStatus(currentStock, minStock),
            lastUpdated: data.updatedAt?.toDate() || new Date(),
          };
        });

        // Update cache
        products.forEach(p => this.productsCache.set(p.id, p));
        
        onUpdate(products);
      },
      (error) => {
        console.error('Products subscription error:', error);
        onError?.(error);
      }
    );

    this.unsubscribe = unsubscribe;
    return unsubscribe;
  }

  /**
   * Get products with low stock
   */
  async getLowStockProducts(): Promise<ProductStock[]> {
    const allProducts = await this.getAllProducts();
    return allProducts.filter(p => p.status !== 'in_stock');
  }

  /**
   * Get stock status color for a product
   */
  getStatusColor(productId: string): string {
    const product = this.productsCache.get(productId);
    if (!product) return STOCK_STATUS_COLORS['in_stock'];
    return STOCK_STATUS_COLORS[product.status];
  }

  /**
   * Get cached product (for quick access without async)
   */
  getCachedProduct(productId: string): ProductStock | undefined {
    return this.productsCache.get(productId);
  }

  /**
   * Clear cache and unsubscribe
   */
  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.productsCache.clear();
  }
}

// Export singleton
export const enviStockService = new EnviStockService();
