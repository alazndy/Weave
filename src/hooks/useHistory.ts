/**
 * useHistory - checkpoint based undo/redo for the Weave document.
 *
 * Callers invoke `saveCheckpoint(currentState)` *before* mutating the document.
 * `undo(currentState)` / `redo(currentState)` return the state to restore (or null).
 * Named snapshots are kept separately and survive undo/redo.
 */

import { useState, useCallback, useRef } from 'react';
import type { HistoryState, HistorySnapshot } from '../types';

const MAX_HISTORY = 50;

const clone = (state: HistoryState): HistoryState => structuredClone(state);

export interface UseHistoryReturn {
  saveCheckpoint: (state: HistoryState) => void;
  undo: (current: HistoryState) => HistoryState | null;
  redo: (current: HistoryState) => HistoryState | null;
  canUndo: boolean;
  canRedo: boolean;
  pastStates: HistoryState[];
  snapshots: HistorySnapshot[];
  createSnapshot: (name: string, state: HistoryState) => void;
  clearHistory: () => void;
}

export function useHistory(maxHistory: number = MAX_HISTORY): UseHistoryReturn {
  // Refs hold the source of truth so undo/redo can return synchronously;
  // the version counter re-renders consumers when the stacks change.
  const past = useRef<HistoryState[]>([]);
  const future = useRef<HistoryState[]>([]);
  const [, setVersion] = useState(0);
  const [snapshots, setSnapshots] = useState<HistorySnapshot[]>([]);
  const bump = () => setVersion(v => v + 1);

  const saveCheckpoint = useCallback((state: HistoryState) => {
    past.current = [...past.current, clone(state)].slice(-maxHistory);
    future.current = [];
    bump();
  }, [maxHistory]);

  const undo = useCallback((current: HistoryState) => {
    const previous = past.current.at(-1);
    if (!previous) return null;
    past.current = past.current.slice(0, -1);
    future.current = [clone(current), ...future.current];
    bump();
    return previous;
  }, []);

  const redo = useCallback((current: HistoryState) => {
    const next = future.current[0];
    if (!next) return null;
    future.current = future.current.slice(1);
    past.current = [...past.current, clone(current)].slice(-maxHistory);
    bump();
    return next;
  }, [maxHistory]);

  const createSnapshot = useCallback((name: string, state: HistoryState) => {
    setSnapshots(prev => [
      ...prev,
      { id: crypto.randomUUID(), name, timestamp: new Date().toISOString(), state: clone(state) },
    ]);
  }, []);

  const clearHistory = useCallback(() => {
    past.current = [];
    future.current = [];
    setSnapshots([]);
    bump();
  }, []);

  return {
    saveCheckpoint,
    undo,
    redo,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    pastStates: past.current,
    snapshots,
    createSnapshot,
    clearHistory,
  };
}
