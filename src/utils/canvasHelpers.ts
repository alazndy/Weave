
import { ProductInstance, ProductTemplate, Point, ConnectionShape, ConnectorType, Connection, CONNECTOR_LABELS, AlignmentGuide, PortDefinition } from '../types';

// Re-export specific logic from new modules
export { SNAP_GRID_SIZE, snapToGrid, getPortPosition, getPortNormal, findIntersection, getInstanceRect } from './geometry';
export { findSmartPath } from './pathfinding';

// Local utility functions (Routing, Validation, Styles)
export const calculateSnapGuides = (
    currentId: string,
    currentX: number,
    currentY: number,
    width: number,
    height: number,
    instances: ProductInstance[],
    templates: ProductTemplate[],
    threshold = 5
): { x: number, y: number, guides: AlignmentGuide[] } => {
    let newX = currentX;
    let newY = currentY;
    const guides: AlignmentGuide[] = [];

    const cx = currentX + width / 2;
    const cy = currentY + height / 2;
    const right = currentX + width;
    const bottom = currentY + height;

    let snappedX = false;
    let snappedY = false;

    // Check against all other instances
    for (const inst of instances) {
        if (inst.id === currentId) continue;
        
        const t = templates.find(temp => temp.id === inst.templateId);
        const w = inst.width || t?.width || 100;
        const h = inst.height || t?.height || 100;

        const otherLeft = inst.x;
        const otherRight = inst.x + w;
        const otherTop = inst.y;
        const otherBottom = inst.y + h;
        const otherCx = inst.x + w / 2;
        const otherCy = inst.y + h / 2;

        // --- X ALIGNMENT ---
        if (!snappedX) {
            // Left to Left
            if (Math.abs(currentX - otherLeft) < threshold) {
                newX = otherLeft;
                guides.push({ type: 'vertical', pos: otherLeft, start: Math.min(currentY, otherTop), end: Math.max(bottom, otherBottom) });
                snappedX = true;
            }
            // Center to Center
            else if (Math.abs(cx - otherCx) < threshold) {
                newX = otherCx - width / 2;
                guides.push({ type: 'vertical', pos: otherCx, start: Math.min(currentY, otherTop), end: Math.max(bottom, otherBottom) });
                snappedX = true;
            }
            // Right to Right
            else if (Math.abs(right - otherRight) < threshold) {
                newX = otherRight - width;
                guides.push({ type: 'vertical', pos: otherRight, start: Math.min(currentY, otherTop), end: Math.max(bottom, otherBottom) });
                snappedX = true;
            }
            // Left to Right / Right to Left
            else if (Math.abs(currentX - otherRight) < threshold) {
                 newX = otherRight;
                 guides.push({ type: 'vertical', pos: otherRight, start: Math.min(currentY, otherTop), end: Math.max(bottom, otherBottom) });
                 snappedX = true;
            }
            else if (Math.abs(right - otherLeft) < threshold) {
                 newX = otherLeft - width;
                 guides.push({ type: 'vertical', pos: otherLeft, start: Math.min(currentY, otherTop), end: Math.max(bottom, otherBottom) });
                 snappedX = true;
            }
        }

        // --- Y ALIGNMENT ---
        if (!snappedY) {
            // Top to Top
            if (Math.abs(currentY - otherTop) < threshold) {
                newY = otherTop;
                guides.push({ type: 'horizontal', pos: otherTop, start: Math.min(currentX, otherLeft), end: Math.max(right, otherRight) });
                snappedY = true;
            }
            // Center to Center
            else if (Math.abs(cy - otherCy) < threshold) {
                newY = otherCy - height / 2;
                guides.push({ type: 'horizontal', pos: otherCy, start: Math.min(currentX, otherLeft), end: Math.max(right, otherRight) });
                snappedY = true;
            }
            // Bottom to Bottom
            else if (Math.abs(bottom - otherBottom) < threshold) {
                newY = otherBottom - height;
                guides.push({ type: 'horizontal', pos: otherBottom, start: Math.min(currentX, otherLeft), end: Math.max(right, otherRight) });
                snappedY = true;
            }
             // Top to Bottom / Bottom to Top
             else if (Math.abs(currentY - otherBottom) < threshold) {
                newY = otherBottom;
                guides.push({ type: 'horizontal', pos: otherBottom, start: Math.min(currentX, otherLeft), end: Math.max(right, otherRight) });
                snappedY = true;
            }
            else if (Math.abs(bottom - otherTop) < threshold) {
                 newY = otherTop - height;
                 guides.push({ type: 'horizontal', pos: otherTop, start: Math.min(currentX, otherLeft), end: Math.max(right, otherRight) });
                 snappedY = true;
            }
        }
    }

    return { x: newX, y: newY, guides };
};

export const getOrthogonalSegments = (start: Point, end: Point, controlPoints: Point[] = []) => {
    const points = [start, ...controlPoints, end];
    const segments = [];
    for(let i=0; i<points.length-1; i++){
        segments.push({
            p1: points[i],
            p2: points[i+1],
            isVertical: Math.abs(points[i].x - points[i+1].x) < 0.1
        });
    }
    return segments;
};

// Helper function to create rounded orthogonal paths with JUMPS
const roundPolyline = (points: Point[], radius: number, jumps: Point[] = []): string => {
    if (points.length < 2) return "";
    
    let path = `M ${points[0].x} ${points[0].y}`;
    const jumpRadius = 6;
    
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        
        // Vector from prev to curr
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const len = Math.sqrt(dx*dx + dy*dy);
        const ux = dx/len;
        const uy = dy/len;

        // Check for jumps on this segment
        const segmentJumps = jumps.filter(j => {
            const dist = Math.abs((curr.x - prev.x)*(prev.y - j.y) - (prev.x - j.x)*(curr.y - prev.y)); // cross product for collinearity
            if (dist > 1) return false; // not on line
            
            // Check if between
            const dot = (j.x - prev.x) * dx + (j.y - prev.y) * dy;
            return dot > 0 && dot < (len*len);
        }).sort((a,b) => {
            const da = (a.x - prev.x)**2 + (a.y - prev.y)**2;
            const db = (b.x - prev.x)**2 + (b.y - prev.y)**2;
            return da - db;
        });

        // We need to stop before the corner to do rounding
        const isLast = i === points.length - 1;
        const cornerR = isLast ? 0 : Math.min(radius, len/2);
        
        let cursorX = prev.x;
        let cursorY = prev.y;

        // Draw segments with jumps
        for (const jump of segmentJumps) {
            // Line to jump start
            const jStartDist = Math.sqrt((jump.x - cursorX)**2 + (jump.y - cursorY)**2) - jumpRadius;
            
            if (jStartDist > 0) {
                 path += ` L ${cursorX + ux * jStartDist} ${cursorY + uy * jStartDist}`;
            }
            
            // Arc over
            const jEndX = jump.x + ux * jumpRadius;
            const jEndY = jump.y + uy * jumpRadius;
            path += ` A ${jumpRadius} ${jumpRadius} 0 0 1 ${jEndX} ${jEndY}`;
            
            cursorX = jEndX;
            cursorY = jEndY;
        }

        // Draw remaining line to corner start
        const remainingLen = Math.sqrt((curr.x - cursorX)**2 + (curr.y - cursorY)**2);
        const drawLen = remainingLen - cornerR;
        
        if (drawLen > 0) {
             path += ` L ${cursorX + ux * drawLen} ${cursorY + uy * drawLen}`;
        }

        // Corner rounding
        if (!isLast && cornerR > 0) {
            const next = points[i+1];
            // End of curve point (on next segment)
            const ndx = next.x - curr.x;
            const ndy = next.y - curr.y;
            const nlen = Math.sqrt(ndx*ndx + ndy*ndy);
            // Actual radius for next segment might be smaller
            const nextR = Math.min(radius, nlen/2); 
            // We use the min of both compatible radii
            const r = Math.min(cornerR, nextR);
            
            const ex = curr.x + (ndx/nlen) * r;
            const ey = curr.y + (ndy/nlen) * r;
            
            path += ` Q ${curr.x} ${curr.y} ${ex} ${ey}`;
        }
    }
    
    return path;
};

export const getRoutePath = (start: Point, end: Point, shape: ConnectionShape = 'curved', controlPoints?: Point[], startNormal?: Point, endNormal?: Point, radius: number = 0, jumps: Point[] = []) => {
    if (controlPoints && controlPoints.length > 0) {
        if (shape === 'orthogonal') {
            const points = [start, ...controlPoints, end];
            return roundPolyline(points, radius, jumps);
        } else {
            let d = `M ${start.x} ${start.y}`;
            controlPoints.forEach(p => { d += ` L ${p.x} ${p.y}`; });
            d += ` L ${end.x} ${end.y}`;
            return d;
        }
    }
    
    if (shape === 'straight') {
        return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
    } else if (shape === 'orthogonal') {
        // Fallback simple orthogonal if no control points (but auto-route should provide them)
        const buffer = 40;
        const sNx = startNormal ? startNormal.x : 0;
        const sNy = startNormal ? startNormal.y : 1;
        
        const p1 = { x: start.x + sNx * buffer, y: start.y + sNy * buffer };
        const midX = (p1.x + end.x) / 2;
        
        const points = [
            start,
            p1,
            { x: midX, y: p1.y },
            { x: midX, y: end.y },
            end
        ];
        return roundPolyline(points, radius, jumps);

    } else {
        const dx = Math.abs(end.x - start.x);
        const dy = Math.abs(end.y - start.y);
        const dist = Math.sqrt(dx*dx + dy*dy);
        const buffer = Math.max(dist * 0.4, 50);
        const sNx = startNormal ? startNormal.x : 0;
        const sNy = startNormal ? startNormal.y : 0;
        const eNx = endNormal ? endNormal.x : 0;
        const eNy = endNormal ? endNormal.y : 0;
        const cp1 = { x: start.x + sNx * buffer, y: start.y + sNy * buffer };
        const cp2 = { x: end.x + eNx * buffer, y: end.y + eNy * buffer };
        return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
    }
};

export const getConnectorShapeClass = (type: ConnectorType) => {
    // Round shapes (Aviation, M12, RCA, BNC, SMA)
    if (
        type.includes('vbv') || 
        type.includes('m12') || 
        type.includes('rca') || 
        type.includes('bnc') || 
        type.includes('sma') || 
        type.includes('tnc') || 
        type.includes('ring') ||
        type.includes('360')
    ) {
        return 'rounded-full';
    }

    // Square/Rectangular shapes (Data, Heavy Duty, ECU)
    if (
        type.includes('usb') || 
        type.includes('d-sub') || 
        type.includes('sp7') || 
        type.includes('mdr') || 
        type.includes('molex') || 
        type.includes('jst') ||
        type.includes('superseal') ||
        type.includes('fakra')
    ) {
        return 'rounded-sm';
    }

    // Slightly rounded (Sensors, Deutsch)
    if (
        type.includes('sensor') || 
        type.includes('deutsch') || 
        type.includes('obd') ||
        type.includes('elite')
    ) {
        return 'rounded-md';
    }

    // Special shapes (Flying leads - can be diamond to indicate termination)
    if (type.includes('flying') || type.includes('terminal')) {
        return 'rounded-sm rotate-45';
    }

    return 'rounded-full';
};

export const validatePortCompatibility = (
    fromPort: PortDefinition, 
    toPort: PortDefinition
): string[] => {
    const warnings: string[] = [];

    // 1. Flow Direction
    if (fromPort.type === 'input' && toPort.type === 'input') {
        warnings.push('Giriş portuna giriş bağlanamaz');
    }
    if (fromPort.type === 'output' && toPort.type === 'output') {
        warnings.push('Çıkış portuna çıkış bağlanamaz');
    }

    // 2. Connector Type
    if (fromPort.connectorType !== 'generic' && toPort.connectorType !== 'generic') {
        if (fromPort.connectorType !== toPort.connectorType) {
            warnings.push(`Konnektör uyumsuz (${CONNECTOR_LABELS[fromPort.connectorType]} -> ${CONNECTOR_LABELS[toPort.connectorType]})`);
        }
    }

    // 3. Power/Voltage
    if (fromPort.isPower && toPort.isPower) {
        // GND Check
        if (!!fromPort.isGround !== !!toPort.isGround) {
             warnings.push('Güç ve Toprak (GND) karıştırılamaz');
        }

        // Type (AC/DC)
        if (fromPort.powerType && toPort.powerType && fromPort.powerType !== toPort.powerType) {
            warnings.push(`Güç Tipi Uyumsuz (${fromPort.powerType} vs ${toPort.powerType})`);
        }
        
        // Voltage
        if (fromPort.voltage && toPort.voltage && fromPort.voltage !== toPort.voltage) {
             warnings.push(`Voltaj Uyumsuz (${fromPort.voltage}V vs ${toPort.voltage}V)`);
        }
    }

    return warnings;
};

export const validateConnection = (
    conn: Connection, 
    instances: ProductInstance[], 
    templates: ProductTemplate[]
): string[] => {
    const fromInst = instances.find(i => i.id === conn.fromInstanceId);
    const toInst = instances.find(i => i.id === conn.toInstanceId);
    const fromTemp = templates.find(t => t.id === fromInst?.templateId);
    const toTemp = templates.find(t => t.id === toInst?.templateId);
    
    const fromPort = fromTemp?.ports.find(p => p.id === conn.fromPortId);
    const toPort = toTemp?.ports.find(p => p.id === conn.toPortId);

    if (!fromPort || !toPort) return [];

    return validatePortCompatibility(fromPort, toPort);
};
