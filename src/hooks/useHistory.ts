/**
 * useHistory - Undo/Redo hook for Weave canvas
 * Implements command pattern for state history
 */

import { useState, useCallback, useRef } from 'react';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseHistoryOptions<T> {
  initialState: T;
  maxHistory?: number;
}

interface UseHistoryReturn<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
  reset: (newState: T) => void;
  history: HistoryState<T>;
}

export function useHistory<T>(options?: UseHistoryOptions<T>): UseHistoryReturn<T> {
  const { initialState = {} as T, maxHistory = 50 } = options || {};
  
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    setHistory(prev => {
      const resolvedState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(prev.present)
        : newState;
      
      // Don't record if same state
      if (JSON.stringify(resolvedState) === JSON.stringify(prev.present)) {
        return prev;
      }
      
      const newPast = [...prev.past, prev.present];
      // Limit history size
      if (newPast.length > maxHistory) {
        newPast.shift();
      }
      
      return {
        past: newPast,
        present: resolvedState,
        future: [], // Clear future on new action
      };
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      
      const newPast = [...prev.past];
      const previousState = newPast.pop()!;
      
      return {
        past: newPast,
        present: previousState,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      
      const newFuture = [...prev.future];
      const nextState = newFuture.shift()!;
      
      return {
        past: [...prev.past, prev.present],
        present: nextState,
        future: newFuture,
      };
    });
  }, []);

  const clear = useCallback(() => {
    setHistory(prev => ({
      past: [],
      present: prev.present,
      future: [],
    }));
  }, []);

  const reset = useCallback((newState: T) => {
    setHistory({
      past: [],
      present: newState,
      future: [],
    });
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    clear,
    reset,
    history,
  };
}

// Command interface for more complex undo/redo
export interface Command<T> {
  execute: () => T;
  undo: () => T;
  description: string;
}

interface UseCommandHistoryReturn<T> {
  state: T;
  execute: (command: Command<T>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoDescription: string | null;
  redoDescription: string | null;
}

export function useCommandHistory<T>(initialState: T): UseCommandHistoryReturn<T> {
  const [state, setState] = useState(initialState);
  const undoStack = useRef<Command<T>[]>([]);
  const redoStack = useRef<Command<T>[]>([]);
  const [, forceUpdate] = useState({});

  const execute = useCallback((command: Command<T>) => {
    const newState = command.execute();
    setState(newState);
    undoStack.current.push(command);
    redoStack.current = [];
    forceUpdate({});
  }, []);

  const undo = useCallback(() => {
    const command = undoStack.current.pop();
    if (command) {
      const newState = command.undo();
      setState(newState);
      redoStack.current.push(command);
      forceUpdate({});
    }
  }, []);

  const redo = useCallback(() => {
    const command = redoStack.current.pop();
    if (command) {
      const newState = command.execute();
      setState(newState);
      undoStack.current.push(command);
      forceUpdate({});
    }
  }, []);

  return {
    state,
    execute,
    undo,
    redo,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
    undoDescription: undoStack.current.length > 0 
      ? undoStack.current[undoStack.current.length - 1].description 
      : null,
    redoDescription: redoStack.current.length > 0 
      ? redoStack.current[redoStack.current.length - 1].description 
      : null,
  };
}

// Pre-built commands for canvas operations
export function createAddCommand<T extends { id: string }>(
  item: T,
  getState: () => T[],
  setState: (items: T[]) => T[]
): Command<T[]> {
  return {
    execute: () => setState([...getState(), item]),
    undo: () => setState(getState().filter(i => i.id !== item.id)),
    description: `Öğe eklendi`,
  };
}

export function createRemoveCommand<T extends { id: string }>(
  itemId: string,
  getState: () => T[],
  setState: (items: T[]) => T[]
): Command<T[]> {
  let removed: T | undefined;
  return {
    execute: () => {
      const items = getState();
      removed = items.find(i => i.id === itemId);
      return setState(items.filter(i => i.id !== itemId));
    },
    undo: () => {
      if (removed) {
        return setState([...getState(), removed]);
      }
      return getState();
    },
    description: `Öğe silindi`,
  };
}

export function createMoveCommand<T extends { id: string; x: number; y: number }>(
  itemId: string,
  oldPos: { x: number; y: number },
  newPos: { x: number; y: number },
  getState: () => T[],
  setState: (items: T[]) => T[]
): Command<T[]> {
  return {
    execute: () => setState(
      getState().map(i => i.id === itemId ? { ...i, ...newPos } : i)
    ),
    undo: () => setState(
      getState().map(i => i.id === itemId ? { ...i, ...oldPos } : i)
    ),
    description: `Öğe taşındı`,
  };
}