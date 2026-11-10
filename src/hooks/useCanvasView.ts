
import React, { useState, useCallback } from 'react';
import { Point } from '../types';

export const useCanvasView = (canvasWidth: number, canvasHeight: number) => {
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState<Point>({ x: 0, y: 0 });

    const handleWheel = useCallback((e: React.WheelEvent, containerRect: DOMRect) => {
        e.preventDefault();
        e.stopPropagation();

        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        
        // Calculate new scale
        // Fusion 360/CAD style: Zoom in/out based on cursor position
        const newScale = Math.min(Math.max(0.1, scale + (wheel * zoomIntensity * scale)), 5);
        
        // Mouse position relative to the container
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;

        // Calculate the offset to keep the point under the mouse stable
        const newPanX = mouseX - (mouseX - pan.x) * (newScale / scale);
        const newPanY = mouseY - (mouseY - pan.y) * (newScale / scale);
        
        setScale(newScale);
        setPan({ x: newPanX, y: newPanY });
    }, [scale, pan]);

    const handleFitScreen = useCallback((containerWidth: number, containerHeight: number) => {
        const padding = 50;
        const scaleX = (containerWidth - padding * 2) / canvasWidth;
        const scaleY = (containerHeight - padding * 2) / canvasHeight;
        const newScale = Math.min(scaleX, scaleY, 1); 
        
        const newPanX = (containerWidth - canvasWidth * newScale) / 2;
        const newPanY = (containerHeight - canvasHeight * newScale) / 2;
        
        setScale(newScale);
        setPan({ x: newPanX, y: newPanY });
    }, [canvasWidth, canvasHeight]);

    /** Zooms to `target` keeping the viewport point (cx, cy) fixed (default: use the given viewport centre). */
    const zoomAt = useCallback((target: number, cx: number, cy: number) => {
        const next = Math.min(Math.max(0.1, target), 5);
        setPan(p => ({ x: cx - (cx - p.x) * (next / scale), y: cy - (cy - p.y) * (next / scale) }));
        setScale(next);
    }, [scale]);
    const panBy = useCallback((dx: number, dy: number) => setPan(p => ({ x: p.x + dx, y: p.y + dy })), []);

    const handleZoomIn = useCallback(() => setScale(s => Math.min(s + 0.1, 5)), []);
    const handleZoomOut = useCallback(() => setScale(s => Math.max(s - 0.1, 0.1)), []);

    return {
        scale,
        pan,
        setPan,
        handleWheel,
        handleFitScreen,
        handleZoomIn,
        handleZoomOut,
        zoomAt,
        panBy
    };
};
