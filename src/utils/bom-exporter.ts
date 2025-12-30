
import { Node } from "../types";

export const exportBOM = (nodes: Node[], projectName: string) => {
    // Filter for physical components (excluding groups/notes if any, depending on type)
    // For now assuming all nodes are relevant or filtering based on data.
    
    // Group by type/name to count quantities
    const bomMap = new Map<string, { name: string, description: string, quantity: number, manufacturer: string, stockCode: string }>();

    nodes.forEach(node => {
        const key = node.data.label; // Using label as key for now
        
        if (!bomMap.has(key)) {
            bomMap.set(key, {
                name: node.data.label,
                description: node.data.description || "",
                quantity: 0,
                manufacturer: node.data.manufacturer || "",
                stockCode: node.data.stockCode || ""
            });
        }
        
        const item = bomMap.get(key)!;
        item.quantity += 1;
    });

    const headers = ["Component Name", "Description", "Manufacturer", "Stock Code", "Quantity"];
    const rows = Array.from(bomMap.values()).map(item => [
        `"${item.name}"`,
        `"${item.description}"`,
        `"${item.manufacturer}"`,
        `"${item.stockCode}"`,
        item.quantity
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${projectName}_BOM_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
