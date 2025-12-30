
import React, { useMemo } from 'react';
import { ProductInstance, ProductTemplate, ExternalPart } from '../../types';

interface BOMTableProps {
    instances: ProductInstance[];
    templates: ProductTemplate[];
    externalParts: ExternalPart[];
    theme: 'light' | 'dark';
}

export const BOMTable: React.FC<BOMTableProps> = ({ instances, templates, externalParts, theme }) => {
    // Aggregation Logic
    const bomData = useMemo(() => {
        const map = new Map<string, { name: string, model: string, count: number }>();

        // 1. Count Canvas Instances
        instances.forEach(inst => {
            const t = templates.find(temp => temp.id === inst.templateId);
            if (t) {
                const key = t.modelNumber ? `${t.name}-${t.modelNumber}` : t.name;
                const existing = map.get(key);
                if (existing) {
                    existing.count++;
                } else {
                    map.set(key, { name: t.name, model: t.modelNumber || '-', count: 1 });
                }
            }
        });

        // 2. Add External Parts
        externalParts.forEach(part => {
            const key = `EXT-${part.name}`;
            map.set(key, { name: part.name, model: '-', count: part.count });
        });

        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [instances, templates, externalParts]);

    if (bomData.length === 0) return null;

    // Styles
    const borderColor = theme === 'light' ? '#000000' : '#52525b';
    const textColor = theme === 'light' ? '#000000' : '#e4e4e7';
    const bgColor = theme === 'light' ? '#ffffff' : '#18181b';
    const headerBg = theme === 'light' ? '#f4f4f5' : '#27272a';

    return (
        <div 
            className="absolute right-[20px] bottom-[180px] z-10 print-bom select-none pointer-events-none overflow-hidden"
            style={{ 
                width: 'min(100% - 40px, 600px)',
                borderColor: borderColor,
                color: textColor,
                backgroundColor: bgColor,
                borderWidth: '2px',
                borderStyle: 'solid'
            }}
        >
            {/* Header */}
            <div className="flex border-b-2" style={{ borderColor: borderColor, backgroundColor: headerBg }}>
                <div className="w-12 p-1 border-r flex items-center justify-center font-bold text-[10px]" style={{ borderColor: borderColor }}>NO</div>
                <div className="flex-1 p-1 border-r flex items-center font-bold text-[10px]" style={{ borderColor: borderColor }}>PARÇA ADI / AÇIKLAMA</div>
                <div className="w-24 p-1 border-r flex items-center font-bold text-[10px]" style={{ borderColor: borderColor }}>MODEL</div>
                <div className="w-16 p-1 flex items-center justify-center font-bold text-[10px]">ADET</div>
            </div>

            {/* Rows */}
            <div className="flex flex-col">
                {bomData.map((item, index) => (
                    <div key={index} className="flex border-b last:border-b-0" style={{ borderColor: borderColor }}>
                        <div className="w-12 p-1 border-r flex items-center justify-center text-[10px] font-bold" style={{ borderColor: borderColor }}>{index + 1}</div>
                        <div className="flex-1 p-1 border-r flex items-center text-[10px] font-medium truncate" style={{ borderColor: borderColor }}>{item.name}</div>
                        <div className="w-24 p-1 border-r flex items-center text-[10px] font-mono truncate" style={{ borderColor: borderColor }}>{item.model}</div>
                        <div className="w-16 p-1 flex items-center justify-center text-[10px] font-bold">{item.count}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
