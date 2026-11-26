import { describe, it, expect } from 'vitest';
import type { Connection, ProductInstance, ProductTemplate } from '../types';
import { withJunctions, splitConnection, removeJunction, pruneJunctions, cablePairs, hasCable, JUNCTION_PORT as J } from './junctions';
import { getRouteEnds, normalizeInner, routePoints } from './connectionRoute';

const tpl: ProductTemplate = { id: 't', name: 'P', imageUrl: '', width: 100, height: 100, ports: [
  { id: 'r', label: 'R', x: 100, y: 50, type: 'output', connectorType: 'generic', direction: 'right' },
  { id: 'l', label: 'L', x: 0, y: 50, type: 'input', connectorType: 'generic', direction: 'left' },
] };
const parts: ProductInstance[] = [{ id: 'a', templateId: 't', x: 0, y: 0 }, { id: 'b', templateId: 't', x: 600, y: 200 }];
const conn = (id: string, from: string, fp: string, to: string, tp: string, extra: Partial<Connection> = {}): Connection =>
  ({ id, fromInstanceId: from, fromPortId: fp, toInstanceId: to, toPortId: tp, ...extra });
const points = (c: Connection, junctions: { id: string; x: number; y: number }[]) => {
  const v = withJunctions(parts, [tpl], junctions);
  const ends = getRouteEnds(c, v.instances, v.templates)!;
  return routePoints(ends, normalizeInner(c.shape || 'curved', ends, c.controlPoints));
};

describe('junctions', () => {
  it('puts a junction end exactly on the junction and leaves toward the other end', () => {
    const v = withJunctions(parts, [tpl], [{ id: 'j', x: 300, y: 50 }]);
    const e = getRouteEnds(conn('c', 'j', J, 'b', 'l', { shape: 'orthogonal' }), v.instances, v.templates)!;
    expect(e.start).toEqual({ x: 300, y: 50 });
    expect(e.sN.x).toBeCloseTo(1);
    expect(e.sLen).toBe(12);
  });

  it('leaves a junction straight toward the other end on curved cables, so there is no hook', () => {
    const v = withJunctions(parts, [tpl], [{ id: 'j', x: 300, y: 50 }]);
    const e = getRouteEnds(conn('c', 'j', J, 'b', 'l'), v.instances, v.templates)!;
    const d = Math.hypot(300, 200);
    expect(e.sN.x).toBeCloseTo(300 / d);
    expect(e.sN.y).toBeCloseTo(200 / d);
  });

  it('splits an orthogonal cable on a segment without changing the drawn route', () => {
    const c = conn('c', 'a', 'r', 'b', 'l', { shape: 'orthogonal', label: 'K1', color: '#f00', arrowHead: 'both' });
    const before = points(c, []);
    const v = withJunctions(parts, [tpl], []);
    const ends = getRouteEnds(c, v.instances, v.templates)!;
    const { junction, branches } = splitConnection(c, { x: 352, y: 150 }, ends, 'j', ['c1', 'c2']);
    expect(junction).toEqual({ id: 'j', x: 350, y: 150 });
    expect(branches[0]).toMatchObject({ id: 'c1', fromInstanceId: 'a', toInstanceId: 'j', toPortId: J, label: 'K1', color: '#f00', arrowHead: 'start' });
    expect(branches[1]).toMatchObject({ id: 'c2', fromInstanceId: 'j', fromPortId: J, toInstanceId: 'b', arrowHead: 'end' });
    expect(branches[1].label).toBeFalsy();
    const joined = [...points(branches[0], [junction]), ...points(branches[1], [junction])];
    // every drawn point lies on the original polyline
    for (const p of joined) {
      const on = before.slice(1).some((b, i) => {
        const a = before[i];
        return p.x >= Math.min(a.x, b.x) - 1 && p.x <= Math.max(a.x, b.x) + 1 && p.y >= Math.min(a.y, b.y) - 1 && p.y <= Math.max(a.y, b.y) + 1;
      });
      expect(on, JSON.stringify(p)).toBe(true);
    }
  });

  it('joins two branches in any orientation', () => {
    for (const flipA of [false, true]) for (const flipB of [false, true]) {
      const A = flipA ? conn('1', 'j', J, 'a', 'r', { label: 'K1', color: '#0f0', controlPoints: [{ x: 2, y: 2 }, { x: 1, y: 1 }] })
                      : conn('1', 'a', 'r', 'j', J, { label: 'K1', color: '#0f0', controlPoints: [{ x: 1, y: 1 }, { x: 2, y: 2 }] });
      const B = flipB ? conn('2', 'b', 'l', 'j', J, { controlPoints: [{ x: 4, y: 4 }] }) : conn('2', 'j', J, 'b', 'l', { controlPoints: [{ x: 4, y: 4 }] });
      const out = removeJunction('j', [A, B], { x: 3, y: 3 });
      expect(out).toHaveLength(1);
      expect(out[0]).toMatchObject({ id: '1', fromInstanceId: 'a', fromPortId: 'r', toInstanceId: 'b', toPortId: 'l', label: 'K1', color: '#0f0' });
      expect(out[0].controlPoints).toEqual([1, 2, 3, 4].map(n => ({ x: n, y: n })));
    }
  });

  it('drops branches for 1 or 3+ branches, self-loops and duplicates', () => {
    const three = [conn('1', 'a', 'r', 'j', J), conn('2', 'j', J, 'b', 'l'), conn('3', 'j', J, 'b', 'r'), conn('4', 'a', 'l', 'b', 'l')];
    expect(removeJunction('j', three).map(c => c.id)).toEqual(['4']);
    expect(removeJunction('j', [conn('1', 'a', 'r', 'j', J), conn('2', 'j', J, 'a', 'r')])).toEqual([]);
    const dup = [conn('1', 'a', 'r', 'j', J), conn('2', 'j', J, 'b', 'l'), conn('3', 'b', 'l', 'a', 'r')];
    expect(removeJunction('j', dup).map(c => c.id)).toEqual(['3']);
  });

  it('prunes junctions without branches and detects existing cables', () => {
    const js = [{ id: 'j', x: 0, y: 0 }, { id: 'k', x: 0, y: 0 }];
    expect(pruneJunctions(js, [conn('1', 'a', 'r', 'j', J)]).map(j => j.id)).toEqual(['j']);
    const cs = [conn('1', 'a', 'r', 'j', J)];
    expect(hasCable(cs, { instanceId: 'j', portId: J }, { instanceId: 'a', portId: 'r' })).toBe(true);
    expect(hasCable(cs, { instanceId: 'j', portId: J }, { instanceId: 'b', portId: 'l' })).toBe(false);
  });

  it('lists port pairs through chained junctions', () => {
    const cs = [conn('1', 'a', 'r', 'j', J, { label: 'K1' }), conn('2', 'j', J, 'k', J), conn('3', 'k', J, 'b', 'l'), conn('4', 'k', J, 'b', 'r'), conn('5', 'a', 'l', 'b', 'l', { label: 'D' })];
    const pairs = cablePairs(cs, new Set(['j', 'k']));
    expect(pairs.filter(p => !p.via).map(p => p.label)).toEqual(['D']);
    expect(pairs.filter(p => p.via).map(p => `${p.from.instanceId}.${p.from.portId}-${p.to.instanceId}.${p.to.portId}`).sort())
      .toEqual(['a.r-b.l', 'a.r-b.r', 'b.l-b.r']);
    expect(pairs.find(p => p.via)!.label).toBe('K1');
  });
});
