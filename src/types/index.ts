

export interface Point {
  x: number;
  y: number;
  row?: number; // For grid based pathfinding
  col?: number; // For grid based pathfinding
}

export type PortFlowType = 'input' | 'output' | 'bidirectional';

export type ConnectorType = 
  | 'generic'
  
  // 1. Ana Analog Kamera Arayüzleri (Proprietary)
  | 'brigade-vbv-4pin'         // Tip A: VBV (Select Series)
  | 'brigade-vbv-5pin-shutter' // Tip B: VBV Shutter
  | 'brigade-elite-4pin'       // Tip C: BE (Elite Series)
  | 'brigade-backeye-360'      // 360 Kamera

  // 2. Endüstriyel ve Network (Standartlar)
  | 'm12-d-coded-4pin'         // Tip D: Ethernet (Network/MDR)
  | 'm12-a-coded-5pin'         // Tip E: Power/Analog
  | 'm12-a-coded-8pin'         // Tip E: Power/Analog (8-Pin)
  | 'fakra-c-blue'             // Tip F: GPS
  | 'fakra-d-purple'           // Tip F: GSM
  | 'fakra-e-green'            // Tip F: Video

  // 3. Ağır Hizmet Tır/Dorse (Bulkhead)
  | 'sp7-heavy-duty'           // Tip G: 7-Pin Heavy Duty
  | 'mdr-15pin-heavy-duty'     // Tip H: 15-Pin (Omnivue/MDR)

  // 4. Legacy ve Genel AV
  | 'rca-connector'            // Tip I: RCA (Phono)
  | 'bnc-connector'            // Tip J: BNC

  // 5. Dahili ve Güç (Flying Leads)
  | 'flying-lead-power'        // Tip K: Power (Open Wire)
  | 'flying-lead-trigger'      // Tip K: Trigger (Open Wire)
  | 'terminal-block'           // Tip K: Sonlandırma
  | 'd-sub-db9'                // Tip L: DB9
  | 'd-sub-db15'               // Tip L: DB15
  | 'd-sub-db25'               // Tip L: DB25

  // 6. Sensör ve Radar (Detection)
  | 'ultrasonic-sensor-2pin'   // Tip M: Backscan/Sidescan (2-Pin)
  | 'ultrasonic-sensor-3pin'   // Tip M: Backscan/Sidescan (3-Pin)
  | 'deutsch-dt04-2pin'        // Tip N: Radar/Backsense (2-Pin)
  | 'deutsch-dt04-3pin'        // Tip N: Radar/Backsense (3-Pin)
  | 'deutsch-dt04-4pin'        // Tip N: Radar/Backsense (4-Pin)
  | 'deutsch-dt04-6pin'        // Tip N: Radar/Backsense (6-Pin)
  | 'amp-superseal-1.5'        // Tip O: ECU Connections

  // 7. Veri ve İletişim (Data/CAN)
  | 'can-bus-j1939'            // Tip P: CAN Bus
  | 'obd2-16pin'               // Tip Q: OBD-II
  | 'usb-type-a'               // Tip R: USB Type-A
  | 'usb-mini-b'               // Tip R: USB Mini-B

  // 8. RF ve Anten (Wireless/GPS)
  | 'sma-connector'            // Tip S: SMA (GPS/4G)
  | 'rp-sma-connector'         // Tip S: RP-SMA (Wi-Fi)
  | 'tnc-connector'            // Tip T: TNC (Kablosuz Video)

  // 9. Dahili ECU ve Panel
  | 'molex-minifit'            // Tip V: Molex Mini-Fit
  | 'molex-microfit'           // Tip V: Molex Micro-Fit
  | 'jst-xh'                   // Tip W: JST XH
  | 'jst-ph'                   // Tip W: JST PH

  // 10. Aksesuar ve Güç
  | 'fuse-holder-blade'        // Tip X: Sigorta Yuvası
  | 'relay-socket-5pin'        // Tip Y: Röle Soketi
  | 'ring-terminal';           // Tip Z: Şase Pabucu

export interface PortDefinition {
  id: string;
  label: string;
  x: number; // Percentage (0-100) relative to image width
  y: number; // Percentage (0-100) relative to image height
  type: PortFlowType;
  connectorType: ConnectorType;
  direction?: 'top' | 'bottom' | 'left' | 'right'; // New: Explicit exit direction
  isPower?: boolean; 
  isGround?: boolean; // New: Grounding flag
  powerType?: 'AC' | 'DC'; 
  voltage?: string;        
  amperage?: string;
  customColor?: string; // New: Custom color override
}

export interface ProductTemplate {
  id: string;
  name: string;
  modelNumber?: string;
  description?: string;
  imageUrl: string;
  width: number; // visual width in px
  height: number; // visual height in px
  physicalWidth?: number; // width in mm
  ports: PortDefinition[];
  isBlock?: boolean; // New: Marks if this template is a saved block/group
  // ENV-I Integration Fields
  envInventoryId?: string;    // Reference to ENV-I product ID
  externalId?: string;        // Shared ID across ecosystem
  isConfigured?: boolean;     // Whether ports are configured (false = basic template from ENV-I)
  stockCount?: number;        // Synced stock count from ENV-I (readonly)
  weaveFileUrl?: string;      // Link to the .weave file (if available)
}

export interface LibraryMetadata {
  id: string;
  name: string;
  createdAt: string;
}

export interface InstanceLabelConfig {
  visible: boolean;
  fontSize: number;
  color: string;
  backgroundColor: string;
  position: 'bottom' | 'top' | 'center';
}

export interface ProductInstance {
  id: string;
  templateId: string;
  x: number;
  y: number;
  width?: number; // New: optional override for width
  height?: number; // New: optional override for height
  rotation?: number; // Rotation in degrees
  mirrored?: boolean; // Horizontal flip
  labelConfig?: InstanceLabelConfig; // Custom label settings
  locked?: boolean;
  hidden?: boolean;
  groupId?: string;
}

export type ConnectionShape = 'curved' | 'straight' | 'orthogonal';
export type LineStyle = 'solid' | 'dashed' | 'dotted';

export interface Connection {
  id: string;
  fromInstanceId: string;
  fromPortId: string;
  toInstanceId: string;
  toPortId: string;
  label?: string;
  color?: string;
  shape?: ConnectionShape; 
  lineStyle?: LineStyle; // New: Dashed, dotted, solid
  cornerRadius?: number; // New: For orthogonal rounding
  controlPoints?: Point[]; 
  strokeWidth?: 'thin' | 'normal' | 'thick'; // New
  arrowHead?: 'none' | 'start' | 'end' | 'both'; // New
  locked?: boolean;
  hidden?: boolean;
}

export interface AnalysisResult {
  summary: string;
  warnings: string[];
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface ExternalPart {
  id: string;
  name: string;
  count: number;
}

export interface Zone {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  locked?: boolean;
  hidden?: boolean;
  groupId?: string;
}

export interface TextNode {
  id: string;
  content: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  locked?: boolean;
  hidden?: boolean;
  groupId?: string;
}

export interface Comment {
  id: string;
  x: number;
  y: number;
  content: string;
  color: string;
  timestamp: string;
  isResolved?: boolean;
  locked?: boolean;
  hidden?: boolean;
  groupId?: string;
}

// --- NEW PAGE INTERFACE ---
export interface Page {
    id: string;
    name: string;
    instances: ProductInstance[];
    connections: Connection[];
    zones: Zone[];
    textNodes: TextNode[];
    comments: Comment[];
    order: number;
}

export interface HistoryState {
  pages: Page[];
  activePageId: string;
  templates: ProductTemplate[];
}

export interface HistorySnapshot {
  id: string;
  name: string;
  timestamp: string;
  state: HistoryState;
}

export type PaperSize = 'A3' | 'A4' | 'A6';
export type Orientation = 'landscape' | 'portrait';

export interface ProjectMetadata {
  projectName: string;
  companyName: string;
  companyLogo: string | null;
  customerName?: string; // New: Customer Name
  preparedBy: string;
  approvedBy: string;
  documentNo: string;
  scale: string; // Display string like "1:100"
  pixelScale: number; // Pixels per mm
  paperSize: PaperSize; // New: A4, A3, A6
  orientation: Orientation; // New: landscape, portrait
  revision: string;
  date: string;
  technicalNotes?: string;
  customFields: CustomField[];
  externalParts: ExternalPart[];
}


export type ColorPalette = 'weave' | 'ocean' | 'forest' | 'royal' | 'monochrome';

export type UserRole = 'admin' | 'manager' | 'viewer';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AppSettings {
    theme: 'light' | 'dark';
    language: 'tr' | 'en';
    palette: ColorPalette; // ID of the color palette
    enableUPHIntegration?: boolean;
    enableGoogleDrive?: boolean;
    teamMembers?: TeamMember[];
}

// Complete Project Data Structure for Export/Save
export interface ProjectData {
  metadata: ProjectMetadata;
  pages: Page[];
  templates: ProductTemplate[];
  version: string; // e.g., "1.0.0"
}

// Visual Guide Lines for Smart Alignment
export interface AlignmentGuide {
  type: 'horizontal' | 'vertical';
  pos: number; // The x or y coordinate
  start: number; // Start of the line (e.g., top y for a vertical line)
  end: number;   // End of the line
}

export const CONNECTOR_LABELS: Record<ConnectorType, string> = {
  'generic': 'Genel / Belirsiz',

  // 1. Ana Analog (Proprietary)
  'brigade-vbv-4pin': 'VBV 4-Pin (Select Series)',
  'brigade-vbv-5pin-shutter': 'VBV 5-Pin (Shutter)',
  'brigade-elite-4pin': 'BE 4-Pin (Elite Series Waterproof)',
  'brigade-backeye-360': 'Brigade 360 BN360 Port',

  // 2. Endüstriyel (Standartlar)
  'm12-d-coded-4pin': 'M12 Ethernet (D-Coded 4-Pin)',
  'm12-a-coded-5pin': 'M12 Power/Analog (A-Coded 5-Pin)',
  'm12-a-coded-8pin': 'M12 Power/Analog (A-Coded 8-Pin)',
  'fakra-c-blue': 'FAKRA C (Mavi - GPS)',
  'fakra-d-purple': 'FAKRA D (Mor - GSM)',
  'fakra-e-green': 'FAKRA E (Yeşil - Video)',

  // 3. Ağır Hizmet
  'sp7-heavy-duty': 'SP-7 Heavy Duty (7-Pin)',
  'mdr-15pin-heavy-duty': 'MDR/Omnivue Heavy Duty (15-Pin)',

  // 4. Legacy / AV
  'rca-connector': 'RCA (Phono)',
  'bnc-connector': 'BNC (Bayonet)',

  // 5. Dahili / Güç (Flying Leads)
  'flying-lead-power': 'Açık Uç (Power +/-)',
  'flying-lead-trigger': 'Açık Uç (Trigger/Sinyal)',
  'terminal-block': 'Terminal/Klemens Bağlantısı',
  'd-sub-db9': 'D-Sub DB9 (Serial/MDR)',
  'd-sub-db15': 'D-Sub DB15 (VGA/MDR)',
  'd-sub-db25': 'D-Sub DB25 (Parallel/Expansion)',

  // 6. Sensör (Detection)
  'ultrasonic-sensor-2pin': 'Ultrasonik Sensör (2-Pin Waterproof)',
  'ultrasonic-sensor-3pin': 'Ultrasonik Sensör (3-Pin Waterproof)',
  'deutsch-dt04-2pin': 'Deutsch DT04 (2-Pin)',
  'deutsch-dt04-3pin': 'Deutsch DT04 (3-Pin)',
  'deutsch-dt04-4pin': 'Deutsch DT04 (4-Pin)',
  'deutsch-dt04-6pin': 'Deutsch DT04 (6-Pin)',
  'amp-superseal-1.5': 'AMP Superseal 1.5 Series',

  // 7. Veri / CAN
  'can-bus-j1939': 'CAN Bus (J1939)',
  'obd2-16pin': 'OBD-II (16-Pin Diag)',
  'usb-type-a': 'USB Type-A',
  'usb-mini-b': 'USB Mini-B',

  // 8. RF / Anten
  'sma-connector': 'SMA (GPS/4G)',
  'rp-sma-connector': 'RP-SMA (Wi-Fi)',
  'tnc-connector': 'TNC (Kablosuz Video)',

  // 9. Dahili ECU
  'molex-minifit': 'Molex Mini-Fit',
  'molex-microfit': 'Molex Micro-Fit',
  'jst-xh': 'JST XH Series',
  'jst-ph': 'JST PH Series',

  // 10. Aksesuar
  'fuse-holder-blade': 'Sigorta Yuvası (Blade)',
  'relay-socket-5pin': 'Röle Soketi (Automotive)',
  'ring-terminal': 'Şase Pabucu (Ring Terminal)'
};