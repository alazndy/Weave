import { Connection, ProductInstance, ProductTemplate, PortDefinition, CONNECTOR_LABELS } from '../types';

export interface DRCWarning {
  id: string;
  connectionId: string;
  type: 'voltage_mismatch' | 'connector_mismatch' | 'direction_conflict' | 'power_type_mismatch';
  severity: 'error' | 'warning';
  message: string;
  fromPort: PortDefinition;
  toPort: PortDefinition;
}

export interface DRCResult {
  isValid: boolean;
  warnings: DRCWarning[];
  errors: DRCWarning[];
}

/**
 * Perform Design Rule Check on all connections
 */
export const runDRC = (
  connections: Connection[],
  instances: ProductInstance[],
  templates: ProductTemplate[]
): DRCResult => {
  const warnings: DRCWarning[] = [];
  const errors: DRCWarning[] = [];

  connections.forEach(conn => {
    const fromInst = instances.find(i => i.id === conn.fromInstanceId);
    const toInst = instances.find(i => i.id === conn.toInstanceId);
    
    if (!fromInst || !toInst) return;

    const fromTemplate = templates.find(t => t.id === fromInst.templateId);
    const toTemplate = templates.find(t => t.id === toInst.templateId);

    if (!fromTemplate || !toTemplate) return;

    const fromPort = fromTemplate.ports.find(p => p.id === conn.fromPortId);
    const toPort = toTemplate.ports.find(p => p.id === conn.toPortId);

    if (!fromPort || !toPort) return;

    // Rule 1: Connector Type Mismatch
    if (fromPort.connectorType !== 'generic' && toPort.connectorType !== 'generic') {
      if (fromPort.connectorType !== toPort.connectorType) {
        errors.push({
          id: `drc-${conn.id}-connector`,
          connectionId: conn.id,
          type: 'connector_mismatch',
          severity: 'error',
          message: `Konnektör uyumsuzluğu: ${CONNECTOR_LABELS[fromPort.connectorType]} ↔ ${CONNECTOR_LABELS[toPort.connectorType]}`,
          fromPort,
          toPort
        });
      }
    }

    // Rule 2: Voltage Mismatch (Power ports only)
    if (fromPort.isPower && toPort.isPower && fromPort.voltage && toPort.voltage) {
      const fromV = parseVoltage(fromPort.voltage);
      const toV = parseVoltage(toPort.voltage);
      
      if (fromV !== null && toV !== null && fromV !== toV) {
        // Allow tolerance for common conversions (e.g., 5V to 3.3V with regulator)
        if (Math.abs(fromV - toV) > 0.5) {
          errors.push({
            id: `drc-${conn.id}-voltage`,
            connectionId: conn.id,
            type: 'voltage_mismatch',
            severity: 'error',
            message: `Voltaj uyumsuzluğu: ${fromPort.voltage} → ${toPort.voltage}. Bu bağlantı cihaza zarar verebilir!`,
            fromPort,
            toPort
          });
        }
      }
    }

    // Rule 3: Power Type Mismatch (AC vs DC)
    if (fromPort.isPower && toPort.isPower && fromPort.powerType && toPort.powerType) {
      if (fromPort.powerType !== toPort.powerType) {
        errors.push({
          id: `drc-${conn.id}-powertype`,
          connectionId: conn.id,
          type: 'power_type_mismatch',
          severity: 'error',
          message: `Güç tipi uyumsuzluğu: ${fromPort.powerType} kaynağa ${toPort.powerType} cihaz bağlanmış!`,
          fromPort,
          toPort
        });
      }
    }

    // Rule 4: Direction Conflict (input-to-input, output-to-output)
    if (fromPort.type === toPort.type && fromPort.type !== 'bidirectional') {
      warnings.push({
        id: `drc-${conn.id}-direction`,
        connectionId: conn.id,
        type: 'direction_conflict',
        severity: 'warning',
        message: `Yön uyarısı: Her iki port da "${fromPort.type}" olarak tanımlı. Sinyal akışını kontrol edin.`,
        fromPort,
        toPort
      });
    }
  });

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
};

/**
 * Check a single potential connection before it's made
 */
export const checkConnectionValidity = (
  fromPort: PortDefinition,
  toPort: PortDefinition
): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];

  // Connector check
  if (fromPort.connectorType !== 'generic' && toPort.connectorType !== 'generic') {
    if (fromPort.connectorType !== toPort.connectorType) {
      issues.push(`Konnektör tipi uyuşmuyor: ${CONNECTOR_LABELS[fromPort.connectorType]} ↔ ${CONNECTOR_LABELS[toPort.connectorType]}`);
    }
  }

  // Voltage check
  if (fromPort.isPower && toPort.isPower && fromPort.voltage && toPort.voltage) {
    const fromV = parseVoltage(fromPort.voltage);
    const toV = parseVoltage(toPort.voltage);
    if (fromV !== null && toV !== null && Math.abs(fromV - toV) > 0.5) {
      issues.push(`Voltaj farkı tehlikeli: ${fromPort.voltage} → ${toPort.voltage}`);
    }
  }

  // Power type check
  if (fromPort.isPower && toPort.isPower && fromPort.powerType && toPort.powerType) {
    if (fromPort.powerType !== toPort.powerType) {
      issues.push(`AC/DC uyumsuzluğu: ${fromPort.powerType} → ${toPort.powerType}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
};

/**
 * Parse voltage string to number (e.g., "12V" -> 12, "3.3V" -> 3.3)
 */
const parseVoltage = (voltageStr: string): number | null => {
  const match = voltageStr.match(/([\d.]+)\s*V/i);
  return match ? parseFloat(match[1]) : null;
};
