// Integration Types for Weave

// Part Lookup (Digi-Key, Mouser, Octopart)
export interface PartSearchResult {
  source: 'digikey' | 'mouser' | 'octopart' | 'jlcpcb';
  partNumber: string;
  manufacturerPartNumber: string;
  manufacturer: string;
  description: string;
  category?: string;
  imageUrl?: string;
  datasheetUrl?: string;
  productUrl: string;
  pricing: PartPricing[];
  stock: PartStock;
  specifications?: Record<string, string>;
  lastUpdated: Date;
}

export interface PartPricing {
  quantity: number;
  unitPrice: number;
  currency: string;
  totalPrice: number;
}

export interface PartStock {
  inStock: boolean;
  quantity: number;
  leadTimeDays?: number;
  factory?: string;
}

export interface PartSearchParams {
  query: string;
  category?: string;
  manufacturer?: string;
  inStockOnly?: boolean;
  maxResults?: number;
  sortBy?: 'relevance' | 'price' | 'stock';
}

// PCB Ordering (JLCPCB, PCBWay)
export interface PCBOrderSpec {
  layers: number;
  width: number; // mm
  height: number; // mm
  quantity: number;
  thickness: number; // mm
  color: 'green' | 'red' | 'blue' | 'yellow' | 'black' | 'white';
  surfaceFinish: 'hasl' | 'enig' | 'osp';
  copperWeight: '1oz' | '2oz';
  castellated?: boolean;
  impedanceControl?: boolean;
}

export interface PCBQuote {
  provider: 'jlcpcb' | 'pcbway';
  spec: PCBOrderSpec;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  leadTimeDays: number;
  shippingOptions: {
    method: string;
    price: number;
    estimatedDays: number;
  }[];
  quoteUrl: string;
  validUntil: Date;
}

// BOM for JLCPCB Assembly
export interface JLCPCBPart {
  comment: string; // Component value
  designator: string; // Reference designator
  footprint: string;
  lcscPartNumber?: string; // LCSC part number
  manufacturer?: string;
  partNumber?: string;
  description?: string;
  quantity: number;
  unitPrice?: number;
  available?: boolean;
}

export interface JLCPCBBom {
  projectName: string;
  parts: JLCPCBPart[];
  totalParts: number;
  totalCost: number;
  currency: string;
  generatedAt: Date;
  warnings?: string[];
}

// KiCad Integration
export interface KiCadSchematic {
  version: string;
  generator: string;
  components: KiCadComponent[];
  connections: KiCadWire[];
  labels: KiCadLabel[];
}

export interface KiCadComponent {
  reference: string;
  value: string;
  footprint: string;
  library: string;
  position: { x: number; y: number };
  rotation: number;
  pins: { name: string; number: string; position: { x: number; y: number } }[];
}

export interface KiCadWire {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface KiCadLabel {
  text: string;
  position: { x: number; y: number };
  type: 'local' | 'global' | 'hierarchical';
}

// Altium Integration
export interface AltiumSchDoc {
  version: string;
  sheets: AltiumSheet[];
}

export interface AltiumSheet {
  name: string;
  components: any[]; // Altium component format
  wires: any[];
  netLabels: any[];
}
