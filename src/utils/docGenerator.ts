import { 
  ProductInstance, 
  ProductTemplate, 
  Connection, 
  ProjectMetadata,
  CONNECTOR_LABELS 
} from '../types';

export interface GeneratedDoc {
  markdown: string;
  filename: string;
}

/**
 * Generate comprehensive project documentation in Markdown format
 */
export const generateProjectDoc = (
  metadata: ProjectMetadata,
  instances: ProductInstance[],
  connections: Connection[],
  templates: ProductTemplate[]
): GeneratedDoc => {
  const lines: string[] = [];

  // Header & Project Info
  lines.push(`# ${metadata.projectName}`);
  lines.push('');
  lines.push(`**Firma:** ${metadata.companyName}`);
  if (metadata.customerName) lines.push(`**Müşteri:** ${metadata.customerName}`);
  lines.push(`**Hazırlayan:** ${metadata.preparedBy || 'Belirtilmemiş'}`);
  lines.push(`**Onaylayan:** ${metadata.approvedBy || 'Belirtilmemiş'}`);
  lines.push(`**Doküman No:** ${metadata.documentNo}`);
  lines.push(`**Revizyon:** ${metadata.revision}`);
  lines.push(`**Tarih:** ${metadata.date}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Device List (BOM)
  lines.push('## Malzeme Listesi (BOM)');
  lines.push('');
  lines.push('| No | Cihaz Adı | Model | Adet |');
  lines.push('|----|-----------|-------|------|');

  const deviceCounts: Record<string, { template: ProductTemplate; count: number }> = {};
  instances.forEach(inst => {
    const t = templates.find(t => t.id === inst.templateId);
    if (t) {
      if (!deviceCounts[t.id]) {
        deviceCounts[t.id] = { template: t, count: 0 };
      }
      deviceCounts[t.id].count++;
    }
  });

  Object.values(deviceCounts).forEach((item, idx) => {
    lines.push(`| ${idx + 1} | ${item.template.name} | ${item.template.modelNumber || '-'} | ${item.count} |`);
  });

  lines.push('');

  // Connection Matrix
  lines.push('## Bağlantı Matrisi');
  lines.push('');
  lines.push('| Kaynak Cihaz | Kaynak Port | Hedef Cihaz | Hedef Port | Kablo Etiketi |');
  lines.push('|--------------|-------------|-------------|------------|---------------|');

  connections.forEach(conn => {
    const fromInst = instances.find(i => i.id === conn.fromInstanceId);
    const toInst = instances.find(i => i.id === conn.toInstanceId);
    const fromTemplate = templates.find(t => t.id === fromInst?.templateId);
    const toTemplate = templates.find(t => t.id === toInst?.templateId);
    const fromPort = fromTemplate?.ports.find(p => p.id === conn.fromPortId);
    const toPort = toTemplate?.ports.find(p => p.id === conn.toPortId);

    lines.push(`| ${fromTemplate?.name || '-'} | ${fromPort?.label || '-'} | ${toTemplate?.name || '-'} | ${toPort?.label || '-'} | ${conn.label || '-'} |`);
  });

  lines.push('');

  // Connector Types Used
  lines.push('## Kullanılan Konnektör Tipleri');
  lines.push('');

  const connectorTypes = new Set<string>();
  templates.forEach(t => {
    t.ports.forEach(p => {
      if (p.connectorType !== 'generic') {
        connectorTypes.add(CONNECTOR_LABELS[p.connectorType]);
      }
    });
  });

  Array.from(connectorTypes).forEach(ct => {
    lines.push(`- ${ct}`);
  });

  lines.push('');

  // Technical Notes
  if (metadata.technicalNotes) {
    lines.push('## Teknik Notlar');
    lines.push('');
    lines.push(metadata.technicalNotes);
    lines.push('');
  }

  // Custom Fields
  if (metadata.customFields.length > 0) {
    lines.push('## Ek Bilgiler');
    lines.push('');
    metadata.customFields.forEach(cf => {
      lines.push(`**${cf.label}:** ${cf.value}`);
    });
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push('*Bu doküman T-Weave tarafından otomatik olarak oluşturulmuştur.*');

  const filename = `${metadata.documentNo.replace(/[^a-zA-Z0-9]/g, '_')}_${metadata.revision}.md`;

  return {
    markdown: lines.join('\n'),
    filename
  };
};

/**
 * Export documentation as downloadable file
 */
export const downloadDocAsMarkdown = (doc: GeneratedDoc): void => {
  const blob = new Blob([doc.markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = doc.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
