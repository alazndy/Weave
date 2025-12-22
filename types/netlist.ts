// Netlist Export Types for Weave

export type NetlistFormat = 'spice' | 'kicad' | 'ltspice' | 'altium' | 'orcad' | 'generic';

export interface NetlistNode {
  id: string;
  name: string;
  type: 'component' | 'net' | 'port' | 'power' | 'ground';
  value?: string;
  attributes: Record<string, string>;
}

export interface NetlistConnection {
  netName: string;
  nodes: {
    componentId: string;
    componentName: string;
    pinId: string;
    pinName: string;
  }[];
}

export interface NetlistComponent {
  id: string;
  refDesignator: string; // e.g., "U1", "R1", "CAM1"
  partNumber?: string;
  value?: string;
  footprint?: string;
  library?: string;
  pins: {
    id: string;
    name: string;
    number: string;
    netName?: string;
  }[];
  attributes: Record<string, string>;
}

export interface Netlist {
  projectName: string;
  generatedAt: Date;
  format: NetlistFormat;
  components: NetlistComponent[];
  connections: NetlistConnection[];
  powerNets: string[];
  groundNets: string[];
  totalNets: number;
  totalComponents: number;
}

export interface ExportOptions {
  format: NetlistFormat;
  includeComments: boolean;
  includeMetadata: boolean;
  includeUnconnectedPins: boolean;
  groupByPage: boolean;
  useCustomRefDesignators: boolean;
  refDesignatorPrefix?: string;
}

// KiCad Specific Types
export interface KiCadSymbol {
  name: string;
  library: string;
  pins: { name: string; number: string; type: 'input' | 'output' | 'bidirectional' | 'power' }[];
}

export interface KiCadProject {
  schematic: string; // .kicad_sch content
  symbolLibrary?: string; // .kicad_sym content
  netlist?: string; // .net content
}

// SPICE Specific Types
export interface SpiceModel {
  name: string;
  type: 'subckt' | 'model';
  definition: string;
}

export interface SpiceNetlist {
  title: string;
  components: string[];
  subcircuits: SpiceModel[];
  analyses: string[];
}
