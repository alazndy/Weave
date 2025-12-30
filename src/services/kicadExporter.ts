// KiCad Exporter for Weave

import type { ProjectData, ProductTemplate, ProductInstance, Connection } from '../types';
import type { KiCadProject, KiCadSchematic, KiCadComponent, KiCadWire, KiCadLabel } from '../types/integrations';

// KiCad schematic file constants
const KICAD_VERSION = '(version 20231120)';
const GENERATOR = '(generator "weave")';
const PAPER_A4 = '(paper "A4")';

// Generate KiCad symbol from Weave template
function templateToKiCadSymbol(template: ProductTemplate): string {
  const lines: string[] = [];
  
  lines.push(`(symbol "${template.name}"`);
  lines.push('  (in_bom yes)');
  lines.push('  (on_board yes)');
  
  // Add pins
  template.ports.forEach((port, index) => {
    const pinY = index * 2.54;
    const pinType = port.type === 'input' ? 'input' : 
                    port.type === 'output' ? 'output' : 'bidirectional';
    
    lines.push(`  (pin ${pinType} line`);
    lines.push(`    (at -7.62 ${pinY} 0)`);
    lines.push(`    (length 2.54)`);
    lines.push(`    (name "${port.label}" (effects (font (size 1.27 1.27))))`);
    lines.push(`    (number "${index + 1}" (effects (font (size 1.27 1.27))))`);
    lines.push('  )');
  });
  
  lines.push(')');
  
  return lines.join('\n');
}

// Convert Weave instance to KiCad component
function instanceToKiCadComponent(
  instance: ProductInstance,
  template: ProductTemplate,
  refIndex: number
): KiCadComponent {
  // Scale position (Weave uses pixels, KiCad uses mm)
  const scale = 0.254; // Approximate conversion
  
  return {
    reference: `U${refIndex}`,
    value: template.name,
    footprint: '', // Could be mapped from template
    library: 'weave_components',
    position: {
      x: instance.x * scale,
      y: instance.y * scale,
    },
    rotation: instance.rotation || 0,
    pins: template.ports.map((port, i) => ({
      name: port.label,
      number: String(i + 1),
      position: {
        x: (instance.x + (port.x / 100) * (instance.width || template.width)) * scale,
        y: (instance.y + (port.y / 100) * (instance.height || template.height)) * scale,
      },
    })),
  };
}

// Generate wire path between two points
function generateWirePath(fromX: number, fromY: number, toX: number, toY: number): KiCadWire[] {
  // Simple L-shaped routing
  if (Math.abs(fromX - toX) < 0.1) {
    // Vertical line
    return [{ startX: fromX, startY: fromY, endX: toX, endY: toY }];
  } else if (Math.abs(fromY - toY) < 0.1) {
    // Horizontal line
    return [{ startX: fromX, startY: fromY, endX: toX, endY: toY }];
  } else {
    // L-shaped: horizontal then vertical
    const midX = toX;
    return [
      { startX: fromX, startY: fromY, endX: midX, endY: fromY },
      { startX: midX, startY: fromY, endX: toX, endY: toY },
    ];
  }
}

// Export to KiCad schematic format (.kicad_sch)
export function exportToKiCadSchematic(projectData: ProjectData): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`(kicad_sch ${KICAD_VERSION}`);
  lines.push(`  ${GENERATOR}`);
  lines.push(`  (generator_version "1.0.0")`);
  lines.push('');
  lines.push('  (uuid "' + generateUUID() + '")');
  lines.push(`  ${PAPER_A4}`);
  lines.push('');
  lines.push('  (title_block');
  lines.push(`    (title "${projectData.metadata.projectName}")`);
  lines.push(`    (date "${projectData.metadata.date}")`);
  lines.push(`    (rev "${projectData.metadata.revision}")`);
  lines.push(`    (company "${projectData.metadata.companyName}")`);
  lines.push('  )');
  lines.push('');
  
  // Process first page (KiCad single schematic)
  const page = projectData.pages[0];
  if (!page) {
    lines.push(')');
    return lines.join('\n');
  }
  
  // Symbols (components)
  let refIndex = 1;
  const componentRefs = new Map<string, string>();
  
  for (const instance of page.instances) {
    const template = projectData.templates.find(t => t.id === instance.templateId);
    if (!template) continue;
    
    const ref = `U${refIndex}`;
    componentRefs.set(instance.id, ref);
    
    const scale = 0.254;
    const x = instance.x * scale;
    const y = instance.y * scale;
    
    lines.push('  (symbol');
    lines.push(`    (lib_id "weave:${template.name.replace(/\s+/g, '_')}")`);
    lines.push(`    (at ${x.toFixed(2)} ${y.toFixed(2)} ${instance.rotation || 0})`);
    lines.push(`    (uuid "${generateUUID()}")`);
    lines.push('    (property "Reference" "' + ref + '"');
    lines.push('      (at 0 -2.54 0)');
    lines.push('      (effects (font (size 1.27 1.27)))');
    lines.push('    )');
    lines.push('    (property "Value" "' + template.name + '"');
    lines.push('      (at 0 2.54 0)');
    lines.push('      (effects (font (size 1.27 1.27)))');
    lines.push('    )');
    lines.push('  )');
    lines.push('');
    
    refIndex++;
  }
  
  // Wires (connections)
  for (const conn of page.connections) {
    const fromInstance = page.instances.find(i => i.id === conn.fromInstanceId);
    const toInstance = page.instances.find(i => i.id === conn.toInstanceId);
    
    if (!fromInstance || !toInstance) continue;
    
    const fromTemplate = projectData.templates.find(t => t.id === fromInstance.templateId);
    const toTemplate = projectData.templates.find(t => t.id === toInstance.templateId);
    
    if (!fromTemplate || !toTemplate) continue;
    
    const fromPort = fromTemplate.ports.find(p => p.id === conn.fromPortId);
    const toPort = toTemplate.ports.find(p => p.id === conn.toPortId);
    
    if (!fromPort || !toPort) continue;
    
    const scale = 0.254;
    const fromX = (fromInstance.x + (fromPort.x / 100) * (fromInstance.width || fromTemplate.width)) * scale;
    const fromY = (fromInstance.y + (fromPort.y / 100) * (fromInstance.height || fromTemplate.height)) * scale;
    const toX = (toInstance.x + (toPort.x / 100) * (toInstance.width || toTemplate.width)) * scale;
    const toY = (toInstance.y + (toPort.y / 100) * (toInstance.height || toTemplate.height)) * scale;
    
    const wires = generateWirePath(fromX, fromY, toX, toY);
    
    for (const wire of wires) {
      lines.push('  (wire');
      lines.push(`    (pts (xy ${wire.startX.toFixed(2)} ${wire.startY.toFixed(2)}) (xy ${wire.endX.toFixed(2)} ${wire.endY.toFixed(2)}))`);
      lines.push(`    (uuid "${generateUUID()}")`);
      lines.push('  )');
    }
    
    // Add net label if connection has a label
    if (conn.label) {
      lines.push('  (label "' + conn.label + '"');
      lines.push(`    (at ${fromX.toFixed(2)} ${fromY.toFixed(2)} 0)`);
      lines.push(`    (uuid "${generateUUID()}")`);
      lines.push('    (effects (font (size 1.27 1.27)))');
      lines.push('  )');
    }
  }
  
  // Add text notes
  for (const text of page.textNodes) {
    const scale = 0.254;
    lines.push('  (text "' + text.content.replace(/"/g, '\\"') + '"');
    lines.push(`    (at ${(text.x * scale).toFixed(2)} ${(text.y * scale).toFixed(2)} 0)`);
    lines.push('    (effects (font (size 1.27 1.27)))');
    lines.push('  )');
  }
  
  lines.push(')');
  
  return lines.join('\n');
}

// Generate symbol library (.kicad_sym)
export function exportToKiCadSymbolLib(templates: ProductTemplate[]): string {
  const lines: string[] = [];
  
  lines.push(`(kicad_symbol_lib ${KICAD_VERSION}`);
  lines.push(`  ${GENERATOR}`);
  lines.push('');
  
  for (const template of templates) {
    lines.push(templateToKiCadSymbol(template));
    lines.push('');
  }
  
  lines.push(')');
  
  return lines.join('\n');
}

// Full KiCad project export
export function exportToKiCad(projectData: ProjectData): KiCadProject {
  return {
    schematic: exportToKiCadSchematic(projectData),
    symbolLibrary: exportToKiCadSymbolLib(projectData.templates),
  };
}

// Generate UUID for KiCad
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Parse KiCad schematic (basic)
export function parseKiCadSchematic(content: string): KiCadSchematic | null {
  try {
    // Basic S-expression parser for KiCad format
    // This is a simplified implementation
    const components: KiCadComponent[] = [];
    const wires: KiCadWire[] = [];
    const labels: KiCadLabel[] = [];
    
    // Extract version
    const versionMatch = content.match(/\(version\s+(\d+)\)/);
    const version = versionMatch ? versionMatch[1] : 'unknown';
    
    // Extract generator
    const generatorMatch = content.match(/\(generator\s+"([^"]+)"\)/);
    const generator = generatorMatch ? generatorMatch[1] : 'unknown';
    
    // Extract symbols (simplified)
    const symbolRegex = /\(symbol\s+\(lib_id\s+"([^"]+)"\)\s+\(at\s+([\d.-]+)\s+([\d.-]+)/g;
    let match;
    while ((match = symbolRegex.exec(content)) !== null) {
      components.push({
        reference: '',
        value: match[1].split(':').pop() || '',
        footprint: '',
        library: match[1].split(':')[0] || '',
        position: { x: parseFloat(match[2]), y: parseFloat(match[3]) },
        rotation: 0,
        pins: [],
      });
    }
    
    // Extract wires
    const wireRegex = /\(wire\s+\(pts\s+\(xy\s+([\d.-]+)\s+([\d.-]+)\)\s+\(xy\s+([\d.-]+)\s+([\d.-]+)\)/g;
    while ((match = wireRegex.exec(content)) !== null) {
      wires.push({
        startX: parseFloat(match[1]),
        startY: parseFloat(match[2]),
        endX: parseFloat(match[3]),
        endY: parseFloat(match[4]),
      });
    }
    
    // Extract labels
    const labelRegex = /\(label\s+"([^"]+)"\s+\(at\s+([\d.-]+)\s+([\d.-]+)/g;
    while ((match = labelRegex.exec(content)) !== null) {
      labels.push({
        text: match[1],
        position: { x: parseFloat(match[2]), y: parseFloat(match[3]) },
        type: 'local',
      });
    }
    
    return {
      version,
      generator,
      components,
      connections: wires,
      labels,
    };
  } catch (error) {
    console.error('KiCad parse error:', error);
    return null;
  }
}
