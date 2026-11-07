import { ExternalPart, ProductInstance, ProductTemplate } from "../types";

export interface BomRow {
    name: string;
    modelNumber: string;
    description: string;
    quantity: number;
}

/** Groups placed devices by template and appends manually listed external parts. */
export const buildBOM = (
    instances: ProductInstance[],
    templates: ProductTemplate[],
    externalParts: ExternalPart[] = []
): BomRow[] => {
    const byTemplate = new Map<string, BomRow>();

    instances.forEach(inst => {
        const template = templates.find(t => t.id === inst.templateId);
        if (!template || template.isBlock) return; // blocks are visual groups, not purchasable parts
        const row = byTemplate.get(template.id) ?? {
            name: template.name,
            modelNumber: template.modelNumber || "",
            description: template.description || "",
            quantity: 0,
        };
        row.quantity += 1;
        byTemplate.set(template.id, row);
    });

    const rows = Array.from(byTemplate.values()).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    externalParts.forEach(part => rows.push({ name: part.name, modelNumber: "", description: "Harici parça", quantity: part.count }));
    return rows;
};

const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

export const bomToCSV = (rows: BomRow[]): string => {
    const headers = ["Ürün", "Model No", "Açıklama", "Adet"];
    return [headers, ...rows.map(r => [r.name, r.modelNumber, r.description, r.quantity])]
        .map(r => r.map(csvCell).join(","))
        .join("\r\n");
};

export const exportBOM = (
    instances: ProductInstance[],
    templates: ProductTemplate[],
    projectName: string,
    externalParts: ExternalPart[] = []
) => {
    const rows = buildBOM(instances, templates, externalParts);
    if (rows.length === 0) {
        alert("Bu sayfada malzeme listesine girecek ürün yok.");
        return;
    }
    // Leading BOM so Excel opens Turkish characters correctly.
    const blob = new Blob(["﻿" + bomToCSV(rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${projectName.replace(/[\\/:*?"<>|]/g, '_')}_BOM_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
