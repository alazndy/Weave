

import { useState, useCallback } from 'react';
import { ProductInstance, Connection, Zone, TextNode, ProductTemplate, HistoryState, HistorySnapshot, Comment } from '../types';

export function useHistory() {
    const [pastStates, setPastStates] = useState<HistoryState[]>([]);
    const [futureStates, setFutureStates] = useState<HistoryState[]>([]);
    const [snapshots, setSnapshots] = useState<HistorySnapshot[]>([]);

    const saveCheckpoint = useCallback((currentState: HistoryState) => {
        setPastStates(prev => {
            // Optional: Limit history size (e.g., last 50 steps)
            const newHistory = [...prev, currentState];
            if (newHistory.length > 50) return newHistory.slice(newHistory.length - 50);
            return newHistory;
        });
        setFutureStates([]); 
    }, []);

    const undo = useCallback((currentState: HistoryState): HistoryState | null => {
        if (pastStates.length === 0) return null;
        
        const previous = pastStates.slice(0, -1);
        const prevState = pastStates[pastStates.length - 1];
        
        setFutureStates(prev => [currentState, ...prev]);
        setPastStates(previous);
        
        return prevState;
    }, [pastStates]);

    const redo = useCallback((currentState: HistoryState): HistoryState | null => {
        if (futureStates.length === 0) return null;
        
        const next = futureStates[0];
        const newFuture = futureStates.slice(1);
        
        setPastStates(prev => [...prev, currentState]);
        setFutureStates(newFuture);
        
        return next;
    }, [futureStates]);

    const createSnapshot = useCallback((name: string, currentState: HistoryState) => {
        const newSnapshot: HistorySnapshot = {
            id: crypto.randomUUID(),
            name,
            timestamp: new Date().toLocaleTimeString(),
            state: JSON.parse(JSON.stringify(currentState)) // Deep copy
        };
        setSnapshots(prev => [newSnapshot, ...prev]);
    }, []);

    const restoreSnapshot = useCallback((snapshotId: string): HistoryState | null => {
        const snapshot = snapshots.find(s => s.id === snapshotId);
        if (!snapshot) return null;
        return JSON.parse(JSON.stringify(snapshot.state)); // Return deep copy to avoid mutation
    }, [snapshots]);

    return {
        pastStates,
        futureStates,
        snapshots,
        saveCheckpoint,
        undo,
        redo,
        createSnapshot,
        restoreSnapshot,
        canUndo: pastStates.length > 0,
        canRedo: futureStates.length > 0
    };
}