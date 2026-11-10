import { describe, it, expect } from 'vitest';
import { instanceNumber, numberBySpace, duplicateNumbers, numberMap } from './numbering';
import type { ProductInstance } from '../types';

const mk = (id: string, x: number, y: number, number?: string): ProductInstance => ({ id, templateId: 't', x, y, number } as ProductInstance);

describe('component numbering', () => {
  it('uses the custom number, falls back to the position', () => {
    expect(instanceNumber(mk('a', 0, 0), 4)).toBe('5');
    expect(instanceNumber(mk('a', 0, 0, ' A7 '), 4)).toBe('A7');
    expect(instanceNumber(mk('a', 0, 0, '  '), 0)).toBe('1');
  });

  it('numberMap mixes custom and automatic numbers', () => {
    const m = numberMap([mk('a', 0, 0), mk('b', 0, 0, 'X'), mk('c', 0, 0)]);
    expect([m.get('a'), m.get('b'), m.get('c')]).toEqual(['1', 'X', '3']);
  });

  it('numberBySpace reads rows top→bottom, left→right', () => {
    const m = numberBySpace([mk('d', 300, 210), mk('b', 300, 100), mk('a', 100, 110), mk('c', 100, 200)]);
    expect(['a', 'b', 'c', 'd'].map(k => m.get(k))).toEqual(['1', '2', '3', '4']);
  });

  it('numberBySpace can number only a selection from a start value', () => {
    const m = numberBySpace([mk('a', 0, 0), mk('b', 100, 0), mk('c', 200, 0)], new Set(['b', 'c']), 10);
    expect(m.has('a')).toBe(false);
    expect([m.get('b'), m.get('c')]).toEqual(['10', '11']);
  });

  it('finds duplicated numbers', () => {
    const d = duplicateNumbers([mk('a', 0, 0, '2'), mk('b', 0, 0), mk('c', 0, 0, 'a1'), mk('d', 0, 0, 'A1')]);
    expect([...d].sort()).toEqual(['2', 'a1']);   // b is auto "2"
  });
});
