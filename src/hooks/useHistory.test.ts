import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistory } from './useHistory';
import type { HistoryState, Page } from '../types';

const page = (id: string, instanceCount: number): Page => ({
  id,
  name: id,
  order: 1,
  instances: Array.from({ length: instanceCount }, (_, i) => ({ id: `${id}-${i}`, templateId: 't', x: 0, y: 0 })),
  connections: [],
  zones: [],
  textNodes: [],
  comments: [],
});

const state = (n: number): HistoryState => ({ pages: [page('p1', n)], activePageId: 'p1', templates: [] });

describe('useHistory', () => {
  it('undoes and redoes checkpoints in order', () => {
    const { result } = renderHook(() => useHistory());
    expect(result.current.canUndo).toBe(false);

    act(() => result.current.saveCheckpoint(state(0)));
    act(() => result.current.saveCheckpoint(state(1)));
    expect(result.current.canUndo).toBe(true);

    let restored: HistoryState | null = null;
    act(() => { restored = result.current.undo(state(2)); });
    expect(restored!.pages[0].instances).toHaveLength(1);
    expect(result.current.canRedo).toBe(true);

    act(() => { restored = result.current.redo(state(1)); });
    expect(restored!.pages[0].instances).toHaveLength(2);
  });

  it('returns null when there is nothing to undo or redo', () => {
    const { result } = renderHook(() => useHistory());
    expect(result.current.undo(state(0))).toBeNull();
    expect(result.current.redo(state(0))).toBeNull();
  });

  it('clears the redo stack on a new checkpoint', () => {
    const { result } = renderHook(() => useHistory());
    act(() => result.current.saveCheckpoint(state(0)));
    act(() => { result.current.undo(state(1)); });
    expect(result.current.canRedo).toBe(true);
    act(() => result.current.saveCheckpoint(state(0)));
    expect(result.current.canRedo).toBe(false);
  });

  it('stores deep copies so later mutation does not corrupt history', () => {
    const { result } = renderHook(() => useHistory());
    const s = state(1);
    act(() => result.current.saveCheckpoint(s));
    s.pages[0].instances.push({ id: 'late', templateId: 't', x: 0, y: 0 });
    let restored: HistoryState | null = null;
    act(() => { restored = result.current.undo(state(5)); });
    expect(restored!.pages[0].instances).toHaveLength(1);
  });

  it('caps history length', () => {
    const { result } = renderHook(() => useHistory(3));
    act(() => { for (let i = 0; i < 10; i++) result.current.saveCheckpoint(state(i)); });
    expect(result.current.pastStates).toHaveLength(3);
    expect(result.current.pastStates[0].pages[0].instances).toHaveLength(7);
  });

  it('keeps named snapshots and clears everything on clearHistory', () => {
    const { result } = renderHook(() => useHistory());
    act(() => result.current.createSnapshot('v1', state(3)));
    act(() => result.current.saveCheckpoint(state(0)));
    expect(result.current.snapshots).toHaveLength(1);
    expect(result.current.snapshots[0].name).toBe('v1');
    act(() => result.current.clearHistory());
    expect(result.current.snapshots).toHaveLength(0);
    expect(result.current.canUndo).toBe(false);
  });
});
