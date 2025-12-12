
import { Point } from '../types';

interface GridNode {
    x: number;
    y: number;
    g: number; // cost from start
    h: number; // heuristic cost to end
    f: number; // total cost
    parent: GridNode | null;
}

interface Obstacle {
    x: number;
    y: number;
    w: number;
    h: number;
}

export const findSmartPath = (
    start: Point, 
    end: Point, 
    startNormal: Point, 
    endNormal: Point,
    obstacles: Obstacle[]
): Point[] => {
    const GRID_SIZE = 20;
    const BOUNDS_PADDING = 1000; // Allow routing outside current view
    
    // Determine bounds based on start/end and obstacles
    let minX = Math.min(start.x, end.x);
    let maxX = Math.max(start.x, end.x);
    let minY = Math.min(start.y, end.y);
    let maxY = Math.max(start.y, end.y);
    
    obstacles.forEach(obs => {
        minX = Math.min(minX, obs.x);
        maxX = Math.max(maxX, obs.x + obs.w);
        minY = Math.min(minY, obs.y);
        maxY = Math.max(maxY, obs.y + obs.h);
    });
    
    minX -= BOUNDS_PADDING;
    minY -= BOUNDS_PADDING;
    maxX += BOUNDS_PADDING;
    maxY += BOUNDS_PADDING;

    // Helper to snap to our internal grid
    const toGrid = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;
    
    // Project start and end points slightly out to ensure they clear the port
    const START_BUFFER = 40;
    const pStart = { 
        x: toGrid(start.x + startNormal.x * START_BUFFER), 
        y: toGrid(start.y + startNormal.y * START_BUFFER) 
    };
    const pEnd = { 
        x: toGrid(end.x + endNormal.x * START_BUFFER), 
        y: toGrid(end.y + endNormal.y * START_BUFFER) 
    };

    const openList: GridNode[] = [];
    const closedList: Set<string> = new Set();
    
    const startNode: GridNode = {
        x: pStart.x,
        y: pStart.y,
        g: 0,
        h: Math.abs(pEnd.x - pStart.x) + Math.abs(pEnd.y - pStart.y),
        f: 0,
        parent: null
    };
    startNode.f = startNode.g + startNode.h;
    openList.push(startNode);
    
    const getNodeKey = (x: number, y: number) => `${x},${y}`;

    // Optimization: Pre-process obstacles with padding
    const paddedObstacles = obstacles.map(obs => ({
        x: obs.x - 20, // Padding
        y: obs.y - 20,
        w: obs.w + 40,
        h: obs.h + 40
    }));

    const isWalkable = (x: number, y: number) => {
        // Check bounds
        if (x < minX || x > maxX || y < minY || y > maxY) return false;
        
        // Check collision with obstacles
        // Treat point as a small rect
        for (const obs of paddedObstacles) {
            if (x >= obs.x && x <= obs.x + obs.w && y >= obs.y && y <= obs.y + obs.h) {
                // Allow start and end points to be inside/near obstacles (exceptions)
                if ((x === pStart.x && y === pStart.y) || (x === pEnd.x && y === pEnd.y)) return true;
                return false;
            }
        }
        return true;
    };

    let iterations = 0;
    const MAX_ITERATIONS = 5000; // Prevent infinite loops
    let closestNode = startNode;

    while (openList.length > 0 && iterations < MAX_ITERATIONS) {
        iterations++;
        
        // Get node with lowest f score
        openList.sort((a, b) => a.f - b.f);
        const current = openList.shift()!;
        
        // Track closest node in case we fail to find exact path
        if (current.h < closestNode.h) closestNode = current;

        // Found target? (Within small distance)
        if (Math.abs(current.x - pEnd.x) < 5 && Math.abs(current.y - pEnd.y) < 5) {
            return reconstructPath(current, start, end);
        }

        closedList.add(getNodeKey(current.x, current.y));

        // Generate neighbors (Up, Down, Left, Right)
        const neighbors = [
            { x: current.x + 20, y: current.y },
            { x: current.x - 20, y: current.y },
            { x: current.x, y: current.y + 20 },
            { x: current.x, y: current.y - 20 }
        ];

        for (const neighborPos of neighbors) {
            if (closedList.has(getNodeKey(neighborPos.x, neighborPos.y))) continue;
            if (!isWalkable(neighborPos.x, neighborPos.y)) continue;

            const gScore = current.g + 20;
            
            // Turn penalty: If changing direction, add cost
            let turnPenalty = 0;
            if (current.parent) {
                const prevDx = current.x - current.parent.x;
                const prevDy = current.y - current.parent.y;
                const currDx = neighborPos.x - current.x;
                const currDy = neighborPos.y - current.y;
                if (prevDx !== currDx || prevDy !== currDy) {
                    turnPenalty = 15; // Cost of turning
                }
            }

            const totalG = gScore + turnPenalty;

            const existingNode = openList.find(n => n.x === neighborPos.x && n.y === neighborPos.y);
            if (existingNode) {
                if (totalG < existingNode.g) {
                    existingNode.g = totalG;
                    existingNode.f = existingNode.g + existingNode.h;
                    existingNode.parent = current;
                }
            } else {
                const hScore = Math.abs(pEnd.x - neighborPos.x) + Math.abs(pEnd.y - neighborPos.y);
                openList.push({
                    x: neighborPos.x,
                    y: neighborPos.y,
                    g: totalG,
                    h: hScore,
                    f: totalG + hScore,
                    parent: current
                });
            }
        }
    }

    // Fallback if path not found: Go to closest node
    if (iterations >= MAX_ITERATIONS) console.warn("A* Pathfinding timeout");
    return reconstructPath(closestNode, start, end);
};

const reconstructPath = (node: GridNode, start: Point, end: Point): Point[] => {
    const path: Point[] = [];
    let curr: GridNode | null = node;
    
    // Backtrack from end node
    while (curr) {
        path.unshift({ x: curr.x, y: curr.y });
        curr = curr.parent;
    }
    
    // Simplify path: Remove collinear points
    if (path.length < 3) return path;

    const simplified: Point[] = [];
    simplified.push(path[0]); // Start buffer point
    
    for (let i = 1; i < path.length - 1; i++) {
        const prev = simplified[simplified.length - 1];
        const curr = path[i];
        const next = path[i + 1];
        
        // Check if curr is on the same line as prev and next
        // (x1 == x2 == x3) OR (y1 == y2 == y3)
        const isCollinearX = (prev.x === curr.x && curr.x === next.x);
        const isCollinearY = (prev.y === curr.y && curr.y === next.y);
        
        if (!isCollinearX && !isCollinearY) {
            simplified.push(curr);
        }
    }
    simplified.push(path[path.length - 1]); // End buffer point
    
    return simplified;
};
