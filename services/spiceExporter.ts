// SPICE Netlist Exporter for Weave

import type { ProjectData, ProductInstance, Connection, ProductTemplate } from '../types';
import type { Netlist, NetlistComponent, NetlistConnection, SpiceNetlist, ExportOptions } from '../types/netlist';

// Generate reference designator based on component type
function generateRefDesignator(template: ProductTemplate, index: number): string {
  const name = template.name.toLowerCase();
  
  if (name.includes('camera') || name.includes('kamera')) return `CAM${index}`;
  if (name.includes('monitor')) return `MON${index}`;
  if (name.includes('sensor')) return `S${index}`;
  if (name.includes('radar')) return `RAD${index}`;
  if (name.includes('mdr') || name.includes('recorder')) return `REC${index}`;
  if (name.includes('relay') || name.includes('röle')) return `K${index}`;
  if (name.includes('fuse') || name.includes('sigorta')) return `F${index}`;
  if (name.includes('connector') || name.includes('konnektör')) return `J${index}`;
  if (name.includes('cable') || name.includes('kablo')) return `W${index}`;
  if (name.includes('power') || name.includes('güç')) return `PWR${index}`;
  
  return `U${index}`;
}

// Convert Weave project to netlist format
export function projectToNetlist(projectData: ProjectData, options: ExportOptions): Netlist {
  const components: NetlistComponent[] = [];
  const connections: NetlistConnection[] = [];
  const netMap = new Map<string, NetlistConnection>();
  const powerNets: string[] = [];
  const groundNets: string[] = [];
  
  let componentIndex = 1;
  
  // Process all pages
  for (const page of projectData.pages) {
    // Create components from instances
    for (const instance of page.instances) {
      const template = projectData.templates.find(t => t.id === instance.templateId);
      if (!template) continue;
      
      const refDes = options.useCustomRefDesignators && options.refDesignatorPrefix
        ? `${options.refDesignatorPrefix}${componentIndex}`
        : generateRefDesignator(template, componentIndex);
      
      const component: NetlistComponent = {
        id: instance.id,
        refDesignator: refDes,
        partNumber: template.modelNumber,
        value: template.name,
        pins: template.ports.map((port, i) => ({
          id: port.id,
          name: port.label,
          number: String(i + 1),
        })),
        attributes: {
          templateId: template.id,
          page: options.groupByPage ? page.name : 'main',
        },
      };
      
      if (template.description) {
        component.attributes.description = template.description;
      }
      
      components.push(component);
      componentIndex++;
    }
    
    // Build nets from connections
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
      
      // Create or update net
      const netName = conn.label || `NET_${conn.id.substring(0, 8)}`;
      
      // Check for power/ground
      if (fromPort.isPower || toPort.isPower) {
        if (!powerNets.includes(netName)) powerNets.push(netName);
      }
      if (fromPort.isGround || toPort.isGround) {
        if (!groundNets.includes(netName)) groundNets.push(netName);
      }
      
      let net = netMap.get(netName);
      if (!net) {
        net = { netName, nodes: [] };
        netMap.set(netName, net);
      }
      
      const fromRef = components.find(c => c.id === fromInstance.id)?.refDesignator || fromInstance.id;
      const toRef = components.find(c => c.id === toInstance.id)?.refDesignator || toInstance.id;
      
      net.nodes.push({
        componentId: fromInstance.id,
        componentName: fromRef,
        pinId: conn.fromPortId,
        pinName: fromPort.label,
      });
      
      net.nodes.push({
        componentId: toInstance.id,
        componentName: toRef,
        pinId: conn.toPortId,
        pinName: toPort.label,
      });
    }
  }
  
  // Add unconnected pins if requested
  if (options.includeUnconnectedPins) {
    for (const component of components) {
      for (const pin of component.pins) {
        const isConnected = Array.from(netMap.values()).some(net =>
          net.nodes.some(n => n.componentId === component.id && n.pinId === pin.id)
        );
        
        if (!isConnected) {
          const netName = `NC_${component.refDesignator}_${pin.number}`;
          netMap.set(netName, {
            netName,
            nodes: [{
              componentId: component.id,
              componentName: component.refDesignator,
              pinId: pin.id,
              pinName: pin.name,
            }],
          });
        }
      }
    }
  }
  
  connections.push(...netMap.values());
  
  return {
    projectName: projectData.metadata.projectName,
    generatedAt: new Date(),
    format: options.format,
    components,
    connections,
    powerNets,
    groundNets,
    totalNets: connections.length,
    totalComponents: components.length,
  };
}

// Export to SPICE format
export function exportToSpice(netlist: Netlist, options?: { includeModels?: boolean }): string {
  const lines: string[] = [];
  
  // Title
  lines.push(`* ${netlist.projectName}`);
  lines.push(`* Generated by Weave at ${netlist.generatedAt.toISOString()}`);
  lines.push('');
  
  // Components
  lines.push('* Components');
  for (const comp of netlist.components) {
    const pinNets = comp.pins.map(pin => {
      const net = netlist.connections.find(c =>
        c.nodes.some(n => n.componentId === comp.id && n.pinId === pin.id)
      );
      return net?.netName || '0'; // 0 for unconnected (ground)
    });
    
    // SPICE format: X<ref> <net1> <net2> ... <subckt_name>
    lines.push(`X${comp.refDesignator} ${pinNets.join(' ')} ${comp.value || 'SUBCKT'}`);
  }
  lines.push('');
  
  // Subcircuit definitions (placeholders)
  if (options?.includeModels) {
    lines.push('* Subcircuit Definitions');
    const uniqueComponents = new Set(netlist.components.map(c => c.value));
    for (const compType of uniqueComponents) {
      if (compType) {
        lines.push(`.SUBCKT ${compType} 1 2`);
        lines.push(`* Placeholder for ${compType}`);
        lines.push('.ENDS');
        lines.push('');
      }
    }
  }
  
  lines.push('.END');
  
  return lines.join('\n');
}

// Export to generic netlist format
export function exportToGeneric(netlist: Netlist): string {
  const lines: string[] = [];
  
  lines.push(`# Weave Netlist Export`);
  lines.push(`# Project: ${netlist.projectName}`);
  lines.push(`# Generated: ${netlist.generatedAt.toISOString()}`);
  lines.push(`# Components: ${netlist.totalComponents}`);
  lines.push(`# Nets: ${netlist.totalNets}`);
  lines.push('');
  lines.push('# COMPONENTS');
  lines.push('#-----------');
  
  for (const comp of netlist.components) {
    lines.push(`${comp.refDesignator}\t${comp.value || 'Unknown'}\t${comp.partNumber || '-'}`);
  }
  
  lines.push('');
  lines.push('# NETS');
  lines.push('#-----');
  
  for (const net of netlist.connections) {
    const nodes = net.nodes.map(n => `${n.componentName}.${n.pinName}`).join(', ');
    lines.push(`${net.netName}: ${nodes}`);
  }
  
  return lines.join('\n');
}

// Main export function
export function exportNetlist(projectData: ProjectData, options: ExportOptions): string {
  const netlist = projectToNetlist(projectData, options);
  
  switch (options.format) {
    case 'spice':
    case 'ltspice':
      return exportToSpice(netlist, { includeModels: true });
    case 'generic':
    default:
      return exportToGeneric(netlist);
  }
}

// Get netlist summary
export function getNetlistSummary(projectData: ProjectData): {
  componentCount: number;
  connectionCount: number;
  pageCount: number;
  unconnectedPorts: number;
} {
  let componentCount = 0;
  let connectionCount = 0;
  let unconnectedPorts = 0;
  
  const pageCount = projectData.pages.length;
  
  for (const page of projectData.pages) {
    componentCount += page.instances.length;
    connectionCount += page.connections.length;
    
    // Count unconnected ports
    for (const instance of page.instances) {
      const template = projectData.templates.find(t => t.id === instance.templateId);
      if (!template) continue;
      
      for (const port of template.ports) {
        const isConnected = page.connections.some(
          c => (c.fromInstanceId === instance.id && c.fromPortId === port.id) ||
               (c.toInstanceId === instance.id && c.toPortId === port.id)
        );
        if (!isConnected) unconnectedPorts++;
      }
    }
  }
  
  return { componentCount, connectionCount, pageCount, unconnectedPorts };
}
