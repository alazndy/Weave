
import { Point, ProductInstance, ProductTemplate } from '../types';

export const SNAP_GRID_SIZE = 20;

export const snapToGrid = (val: number) => {
    return Math.round(val / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;
};

export const getPortPosition = (instance: ProductInstance, template: ProductTemplate, portId: string): Point => {
    const port = template.ports.find(p => p.id === portId);
    if (!port) return { x: instance.x, y: instance.y };
    
    const width = instance.width || template.width;
    const height = instance.height || template.height;
    const cx = instance.x + width / 2;
    const cy = instance.y + height / 2;
    
    let portX = width * (port.x / 100);
    let portY = height * (port.y / 100);
    
    if (instance.mirrored) {
        portX = width - portX;
    }
    
    const dx = portX - width / 2;
    const dy = portY - height / 2;
    
    const angleRad = (instance.rotation || 0) * (Math.PI / 180);
    const rotatedX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
    const rotatedY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
    
    return { x: cx + rotatedX, y: cy + rotatedY };
};

export const getPortNormal = (instance: ProductInstance, template: ProductTemplate, portId: string): Point => {
    const port = template.ports.find(p => p.id === portId);
    if (!port) return { x: 0, y: 1 };

    const rotationRad = (instance.rotation || 0) * (Math.PI / 180);
    let nx = 0, ny = 0;
    
    // Use explicit direction if available
    if (port.direction) {
        switch(port.direction) {
            case 'top': ny = -1; break;
            case 'bottom': ny = 1; break;
            case 'left': nx = -1; break;
            case 'right': nx = 1; break;
        }
        if (instance.mirrored) nx = -nx;
    } else {
        // Fallback logic
        let px = port.x;
        if (instance.mirrored) px = 100 - px;

        if (port.y < 10) ny = -1;
        else if (port.y > 90) ny = 1;
        else if (px < 10) nx = -1;
        else if (px > 90) nx = 1;
        else {
            if (port.y < 50) ny = -1; else ny = 1;
        }
    }
    
    const rnx = nx * Math.cos(rotationRad) - ny * Math.sin(rotationRad);
    const rny = nx * Math.sin(rotationRad) + ny * Math.cos(rotationRad);
    return { x: rnx, y: rny };
};

export const findIntersection = (p1: Point, p2: Point, p3: Point, p4: Point): Point | null => {
    const det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y);
    if (det === 0) return null; // Parallel

    const lambda = ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det;
    const gamma = ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / det;

    if (0 < lambda && lambda < 1 && 0 < gamma && gamma < 1) {
        return {
            x: p1.x + lambda * (p2.x - p1.x),
            y: p1.y + lambda * (p2.y - p1.y)
        };
    }
    return null;
};

export const getInstanceRect = (inst: ProductInstance, templates: ProductTemplate[]) => {
    const t = templates.find(temp => temp.id === inst.templateId);
    return {
        x: inst.x,
        y: inst.y,
        w: inst.width || t?.width || 100,
        h: inst.height || t?.height || 100
    };
};
