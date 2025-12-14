
import React, { useRef, useMemo } from 'react';
import { ProductInstance, ProductTemplate, Point, Connection } from '../../types';
import { getPortPosition } from '../../utils/canvasHelpers';

interface MinimapProps {
    instances: ProductInstance[];
    templates: ProductTemplate[];
    connections: Connection[];
    canvasWidth: number;
    canvasHeight: number;
    pan: Point;
    scale: number;
    onPanChange: (p: Point) => void;
    theme: 'light' | 'dark';
    visible: boolean;
}

export const Minimap: React.FC<MinimapProps> = ({
    instances, templates, connections, canvasWidth, canvasHeight, pan, scale, onPanChange, theme, visible
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const containerWidth = 240;
    const mapScale = containerWidth / canvasWidth;
    const containerHeight = canvasHeight * mapScale;

    // Viewport calculation
    const viewportW = (window.innerWidth - 650) / scale; 
    const viewportH = (window.innerHeight - 100) / scale;

    const vpX = -pan.x / scale * mapScale;
    const vpY = -pan.y / scale * mapScale;
    const vpW = viewportW * mapScale;
    const vpH = viewportH * mapScale;

    const handleMapClick = (e: React.MouseEvent) => {
        if (!mapRef.current) return;
        const rect = mapRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const targetWorldX = x / mapScale;
        const targetWorldY = y / mapScale;
        
        const newPanX = (window.innerWidth - 650) / 2 - targetWorldX * scale;
        const newPanY = (window.innerHeight - 100) / 2 - targetWorldY * scale;

        onPanChange({ x: newPanX, y: newPanY });
    };

    // Generate connection paths for minimap
    const connectionPaths = useMemo(() => {
        return connections.map(conn => {
            const fromInst = instances.find(i => i.id === conn.fromInstanceId);
            const toInst = instances.find(i => i.id === conn.toInstanceId);
            const fromTemp = templates.find(t => t.id === fromInst?.templateId);
            const toTemp = templates.find(t => t.id === toInst?.templateId);

            if (!fromInst || !toInst || !fromTemp || !toTemp) return null;

            const start = getPortPosition(fromInst, fromTemp, conn.fromPortId);
            const end = getPortPosition(toInst, toTemp, conn.toPortId);

            if (!start || !end) return null;

            let d = `M ${start.x * mapScale} ${start.y * mapScale}`;
            
            if (conn.controlPoints && conn.controlPoints.length > 0) {
                conn.controlPoints.forEach(cp => {
                    d += ` L ${cp.x * mapScale} ${cp.y * mapScale}`;
                });
            }
            
            d += ` L ${end.x * mapScale} ${end.y * mapScale}`;
            return { id: conn.id, d, color: conn.color || '#6366f1' };
        }).filter(Boolean);
    }, [connections, instances, templates, mapScale]);

    if (!visible) return null;

    return (
        <div 
            className={`absolute bottom-20 left-6 z-40 border rounded-lg overflow-hidden shadow-2xl transition-all cursor-crosshair no-print ${theme === 'light' ? 'bg-zinc-100 border-zinc-400' : 'bg-zinc-900 border-zinc-600'}`}
            style={{ width: containerWidth, height: containerHeight }}
            onClick={handleMapClick}
            ref={mapRef}
        >
            {/* Connections Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50">
                {connectionPaths.map((path: any) => (
                    <path 
                        key={path.id} 
                        d={path.d} 
                        stroke={path.color} 
                        strokeWidth="1" 
                        fill="none" 
                    />
                ))}
            </svg>

            {/* Instances Layer */}
            {instances.map(inst => {
                const t = templates.find(temp => temp.id === inst.templateId);
                const w = (inst.width || t?.width || 100) * mapScale;
                const h = (inst.height || t?.height || 100) * mapScale;
                return (
                    <div 
                        key={inst.id}
                        className="absolute bg-teal-500/50 rounded-sm border border-teal-400/30"
                        style={{
                            left: inst.x * mapScale,
                            top: inst.y * mapScale,
                            width: w,
                            height: h
                        }}
                    />
                );
            })}
            
            {/* Viewport Indicator */}
            <div 
                className="absolute border-2 border-paprika shadow-[0_0_0_999px_rgba(0,0,0,0.4)] pointer-events-none transition-all duration-75"
                style={{
                    left: vpX,
                    top: vpY,
                    width: vpW,
                    height: vpH
                }}
            />
        </div>
    );
};
