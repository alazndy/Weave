// Part Lookup Service for Weave
// Integrates with Digi-Key, Mouser, Octopart APIs

import type { PartSearchResult, PartSearchParams, PartPricing, PartStock } from '../types/integrations';

// API configuration (would be environment variables in production)
const API_CONFIG = {
  digikey: {
    baseUrl: 'https://api.digikey.com/Search/v3/Products',
    clientId: process.env.DIGIKEY_CLIENT_ID || '',
    clientSecret: process.env.DIGIKEY_CLIENT_SECRET || '',
  },
  mouser: {
    baseUrl: 'https://api.mouser.com/api/v1/search',
    apiKey: process.env.MOUSER_API_KEY || '',
  },
  octopart: {
    baseUrl: 'https://octopart.com/api/v4/rest/parts/search',
    apiKey: process.env.OCTOPART_API_KEY || '',
  },
};

// Mock data for development
const MOCK_PARTS: PartSearchResult[] = [
  {
    source: 'digikey',
    partNumber: 'CAM-001-ND',
    manufacturerPartNumber: 'BE-870C',
    manufacturer: 'Brigade Electronics',
    description: 'Rear View Camera with Night Vision',
    category: 'Cameras',
    imageUrl: 'https://via.placeholder.com/100',
    datasheetUrl: 'https://example.com/datasheet.pdf',
    productUrl: 'https://digikey.com/product/CAM-001-ND',
    pricing: [
      { quantity: 1, unitPrice: 125.50, currency: 'USD', totalPrice: 125.50 },
      { quantity: 10, unitPrice: 112.95, currency: 'USD', totalPrice: 1129.50 },
    ],
    stock: { inStock: true, quantity: 250, leadTimeDays: 3 },
    specifications: {
      'Resolution': '720p',
      'Viewing Angle': '130°',
      'IP Rating': 'IP69K',
      'Operating Temp': '-30°C to +60°C',
    },
    lastUpdated: new Date(),
  },
  {
    source: 'mouser',
    partNumber: 'MON-7IN-001',
    manufacturerPartNumber: 'BN-7MON',
    manufacturer: 'Brigade Electronics',
    description: '7" TFT Monitor with 4 Camera Inputs',
    category: 'Monitors',
    imageUrl: 'https://via.placeholder.com/100',
    productUrl: 'https://mouser.com/product/MON-7IN-001',
    pricing: [
      { quantity: 1, unitPrice: 289.00, currency: 'USD', totalPrice: 289.00 },
    ],
    stock: { inStock: true, quantity: 45, leadTimeDays: 5 },
    lastUpdated: new Date(),
  },
  {
    source: 'octopart',
    partNumber: 'RAD-BSD-001',
    manufacturerPartNumber: 'Backsense BS-4000',
    manufacturer: 'Brigade Electronics',
    description: 'Radar Obstacle Detection System',
    category: 'Sensors',
    productUrl: 'https://octopart.com/RAD-BSD-001',
    pricing: [
      { quantity: 1, unitPrice: 450.00, currency: 'USD', totalPrice: 450.00 },
    ],
    stock: { inStock: false, quantity: 0, leadTimeDays: 21 },
    lastUpdated: new Date(),
  },
];

// Search parts across all providers
export async function searchParts(params: PartSearchParams): Promise<PartSearchResult[]> {
  const { query, inStockOnly, maxResults = 20, sortBy = 'relevance' } = params;
  
  // In production, this would call actual APIs
  // For now, use mock data with filtering
  
  let results = [...MOCK_PARTS];
  
  // Filter by query
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(p => 
      p.partNumber.toLowerCase().includes(q) ||
      p.manufacturerPartNumber.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.manufacturer.toLowerCase().includes(q)
    );
  }
  
  // Filter by category
  if (params.category) {
    results = results.filter(p => 
      p.category?.toLowerCase() === params.category?.toLowerCase()
    );
  }
  
  // Filter by manufacturer
  if (params.manufacturer) {
    results = results.filter(p => 
      p.manufacturer.toLowerCase().includes(params.manufacturer!.toLowerCase())
    );
  }
  
  // Filter by stock
  if (inStockOnly) {
    results = results.filter(p => p.stock.inStock && p.stock.quantity > 0);
  }
  
  // Sort
  if (sortBy === 'price') {
    results.sort((a, b) => (a.pricing[0]?.unitPrice || 0) - (b.pricing[0]?.unitPrice || 0));
  } else if (sortBy === 'stock') {
    results.sort((a, b) => b.stock.quantity - a.stock.quantity);
  }
  
  return results.slice(0, maxResults);
}

// Get part details by part number
export async function getPartDetails(partNumber: string, source?: 'digikey' | 'mouser' | 'octopart'): Promise<PartSearchResult | null> {
  const results = await searchParts({ query: partNumber });
  
  if (source) {
    return results.find(p => p.source === source && p.partNumber === partNumber) || null;
  }
  
  return results.find(p => p.partNumber === partNumber) || null;
}

// Compare prices across providers
export async function comparePrices(manufacturerPartNumber: string): Promise<{
  partNumber: string;
  comparisons: { source: string; price: number; stock: number; leadTime?: number }[];
}> {
  const results = await searchParts({ query: manufacturerPartNumber });
  
  const comparisons = results.map(r => ({
    source: r.source,
    price: r.pricing[0]?.unitPrice || 0,
    stock: r.stock.quantity,
    leadTime: r.stock.leadTimeDays,
  }));
  
  return {
    partNumber: manufacturerPartNumber,
    comparisons: comparisons.sort((a, b) => a.price - b.price),
  };
}

// Check stock availability
export async function checkStock(partNumbers: string[]): Promise<Map<string, PartStock>> {
  const stockMap = new Map<string, PartStock>();
  
  for (const pn of partNumbers) {
    const part = await getPartDetails(pn);
    if (part) {
      stockMap.set(pn, part.stock);
    } else {
      stockMap.set(pn, { inStock: false, quantity: 0 });
    }
  }
  
  return stockMap;
}

// Format currency
export function formatPrice(price: number, currency: string = 'USD'): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    TRY: '₺',
  };
  
  return `${symbols[currency] || currency} ${price.toFixed(2)}`;
}

// Calculate total BOM cost
export function calculateBOMCost(
  parts: { partNumber: string; quantity: number; unitPrice?: number }[]
): { totalCost: number; currency: string; breakdown: { partNumber: string; quantity: number; unitCost: number; totalCost: number }[] } {
  const breakdown = parts.map(p => ({
    partNumber: p.partNumber,
    quantity: p.quantity,
    unitCost: p.unitPrice || 0,
    totalCost: p.quantity * (p.unitPrice || 0),
  }));
  
  return {
    totalCost: breakdown.reduce((sum, b) => sum + b.totalCost, 0),
    currency: 'USD',
    breakdown,
  };
}

// Digi-Key specific search (mock)
export async function searchDigiKey(query: string, maxResults: number = 10): Promise<PartSearchResult[]> {
  const allResults = await searchParts({ query, maxResults });
  return allResults.filter(r => r.source === 'digikey');
}

// Mouser specific search (mock)
export async function searchMouser(query: string, maxResults: number = 10): Promise<PartSearchResult[]> {
  const allResults = await searchParts({ query, maxResults });
  return allResults.filter(r => r.source === 'mouser');
}

// Octopart specific search (mock)
export async function searchOctopart(query: string, maxResults: number = 10): Promise<PartSearchResult[]> {
  const allResults = await searchParts({ query, maxResults });
  return allResults.filter(r => r.source === 'octopart');
}
