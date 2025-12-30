import { ProductInstance, ProductTemplate, PortDefinition, Connection } from '../types';

export interface WiringSuggestion {
  fromInstanceId: string;
  fromPortId: string;
  toInstanceId: string;
  toPortId: string;
  confidence: number; // 0-100
  reason: string;
}

// Common pin name patterns for matching
const PIN_GROUPS: Record<string, string[]> = {
  // I2C
  'SDA': ['SDA', 'I2C_SDA', 'DATA'],
  'SCL': ['SCL', 'I2C_SCL', 'CLOCK', 'CLK'],
  
  // SPI
  'MOSI': ['MOSI', 'SDI', 'DI', 'SPI_MOSI'],
  'MISO': ['MISO', 'SDO', 'DO', 'SPI_MISO'],
  'SCLK': ['SCLK', 'SCK', 'SPI_CLK', 'SPI_SCLK'],
  'CS': ['CS', 'SS', 'NSS', 'SPI_CS', 'CHIP_SELECT'],
  
  // UART
  'TX': ['TX', 'TXD', 'UART_TX'],
  'RX': ['RX', 'RXD', 'UART_RX'],
  
  // Power
  'VCC': ['VCC', 'VDD', '3V3', '3.3V', '5V', '12V', 'V+', 'POWER', 'PWR', '+'],
  'GND': ['GND', 'VSS', 'GROUND', 'V-', '0V', '-'],
  
  // CAN Bus
  'CANH': ['CANH', 'CAN_H', 'CAN_HIGH'],
  'CANL': ['CANL', 'CAN_L', 'CAN_LOW'],
  
  // Video
  'VIDEO_IN': ['VIDEO_IN', 'VIN', 'AV_IN', 'CAM_IN'],
  'VIDEO_OUT': ['VIDEO_OUT', 'VOUT', 'AV_OUT', 'DISPLAY']
};

/**
 * Normalize a pin label for matching
 */
const normalizePinName = (name: string): string => {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, '');
};

/**
 * Find the group a pin belongs to
 */
const findPinGroup = (pinLabel: string): string | null => {
  const normalized = normalizePinName(pinLabel);
  
  for (const [group, aliases] of Object.entries(PIN_GROUPS)) {
    if (aliases.some(a => normalizePinName(a) === normalized || normalized.includes(normalizePinName(a)))) {
      return group;
    }
  }
  return null;
};

/**
 * Check if two ports are compatible for auto-wiring
 */
const arePortsCompatible = (portA: PortDefinition, portB: PortDefinition): boolean => {
  // Same connector type (or one is generic)
  if (portA.connectorType !== 'generic' && portB.connectorType !== 'generic') {
    if (portA.connectorType !== portB.connectorType) return false;
  }

  // Direction compatibility (input↔output or bidirectional)
  if (portA.type === portB.type && portA.type !== 'bidirectional') {
    return false;
  }

  return true;
};

/**
 * Suggest auto-wiring connections for a newly placed instance
 */
export const suggestConnections = (
  newInstanceId: string,
  instances: ProductInstance[],
  templates: ProductTemplate[],
  existingConnections: Connection[]
): WiringSuggestion[] => {
  const suggestions: WiringSuggestion[] = [];
  
  const newInstance = instances.find(i => i.id === newInstanceId);
  if (!newInstance) return [];

  const newTemplate = templates.find(t => t.id === newInstance.templateId);
  if (!newTemplate) return [];

  // Get already connected ports
  const connectedPorts = new Set<string>();
  existingConnections.forEach(c => {
    if (c.fromInstanceId === newInstanceId) connectedPorts.add(c.fromPortId);
    if (c.toInstanceId === newInstanceId) connectedPorts.add(c.toPortId);
  });

  // Check each port of the new instance
  newTemplate.ports.forEach(newPort => {
    if (connectedPorts.has(newPort.id)) return;

    const newPinGroup = findPinGroup(newPort.label);
    if (!newPinGroup) return;

    // Find matching ports in other instances
    instances.forEach(otherInstance => {
      if (otherInstance.id === newInstanceId) return;

      const otherTemplate = templates.find(t => t.id === otherInstance.templateId);
      if (!otherTemplate) return;

      otherTemplate.ports.forEach(otherPort => {
        // Check if already connected
        const isOtherConnected = existingConnections.some(c => 
          (c.fromInstanceId === otherInstance.id && c.fromPortId === otherPort.id) ||
          (c.toInstanceId === otherInstance.id && c.toPortId === otherPort.id)
        );
        if (isOtherConnected) return;

        const otherPinGroup = findPinGroup(otherPort.label);
        if (!otherPinGroup) return;

        // Same group = potential match
        if (newPinGroup === otherPinGroup && arePortsCompatible(newPort, otherPort)) {
          // Determine direction (output → input)
          let fromId = newInstanceId, fromPort = newPort.id;
          let toId = otherInstance.id, toPort = otherPort.id;

          if (newPort.type === 'input' && otherPort.type === 'output') {
            fromId = otherInstance.id; fromPort = otherPort.id;
            toId = newInstanceId; toPort = newPort.id;
          }

          suggestions.push({
            fromInstanceId: fromId,
            fromPortId: fromPort,
            toInstanceId: toId,
            toPortId: toPort,
            confidence: 85,
            reason: `${newPinGroup} eşleşmesi: ${newPort.label} ↔ ${otherPort.label}`
          });
        }
      });
    });
  });

  // Sort by confidence
  return suggestions.sort((a, b) => b.confidence - a.confidence);
};

/**
 * Get quick-connect suggestions for power and ground
 */
export const suggestPowerConnections = (
  instances: ProductInstance[],
  templates: ProductTemplate[],
  existingConnections: Connection[]
): WiringSuggestion[] => {
  const suggestions: WiringSuggestion[] = [];
  
  // Find power sources (PSU, batteries, etc.)
  const powerSources: { instanceId: string; port: PortDefinition }[] = [];
  const powerConsumers: { instanceId: string; port: PortDefinition }[] = [];

  instances.forEach(inst => {
    const template = templates.find(t => t.id === inst.templateId);
    if (!template) return;

    template.ports.forEach(port => {
      if (port.isPower) {
        if (port.type === 'output') {
          powerSources.push({ instanceId: inst.id, port });
        } else if (port.type === 'input') {
          powerConsumers.push({ instanceId: inst.id, port });
        }
      }
    });
  });

  // Match power sources to consumers with same voltage
  powerConsumers.forEach(consumer => {
    const isConnected = existingConnections.some(c =>
      (c.toInstanceId === consumer.instanceId && c.toPortId === consumer.port.id)
    );
    if (isConnected) return;

    powerSources.forEach(source => {
      // Voltage match
      if (source.port.voltage === consumer.port.voltage) {
        suggestions.push({
          fromInstanceId: source.instanceId,
          fromPortId: source.port.id,
          toInstanceId: consumer.instanceId,
          toPortId: consumer.port.id,
          confidence: 90,
          reason: `Güç bağlantısı: ${source.port.voltage} kaynaktan ${consumer.port.label} portuna`
        });
      }
    });
  });

  return suggestions;
};
