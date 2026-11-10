import { describe, it, expect } from 'vitest';
import {
  exitDistance, stubLength, defaultInner, normalizeInner, routePoints, getHandles, moveWaypoint, moveSegment,
  insertWaypoint, removeWaypoint, instanceBounds, STUB_MIN, MIN_STUB_DRAG, type RouteEnds,
} from './connectionRoute';
import type { ProductInstance, ProductTemplate } from '../types';

// camera (right port) at left, monitor (left port) at right: ports face each other
const ends: RouteEnds = { start: { x: 200, y: 100 }, end: { x: 500, y: 200 }, sN: { x: 1, y: 0 }, eN: { x: -1, y: 0 }, sLen: 40, eLen: 40 };
const axisAligned = (pts: { x: number; y: number }[]) =>
  pts.every((p, i) => i === 0 || Math.abs(p.x - pts[i - 1].x) < 0.6 || Math.abs(p.y - pts[i - 1].y) < 0.6);

describe('stubs: wires leave the part first', () => {
  it('exitDistance measures how far to walk until the part is left', () => {
    const rect = { x: 100, y: 50, w: 100, h: 100 };
    expect(exitDistance({ x: 150, y: 100 }, { x: 1, y: 0 }, rect)).toBe(50);   // port in the middle
    expect(exitDistance({ x: 200, y: 100 }, { x: 1, y: 0 }, rect)).toBe(0);    // port on the edge
    expect(exitDistance({ x: 150, y: 60 }, { x: 0, y: -1 }, rect)).toBe(10);
  });

  it('stub length clears the part by at least the minimum', () => {
    const rect = { x: 100, y: 50, w: 100, h: 100 };
    expect(stubLength({ x: 200, y: 100 }, { x: 1, y: 0 }, rect)).toBe(STUB_MIN);
    expect(stubLength({ x: 150, y: 100 }, { x: 1, y: 0 }, rect)).toBe(66);     // 50 inside + clearance 16
  });

  it('every shape starts and ends with a stub along the port normals', () => {
    for (const shape of ['straight', 'curved', 'orthogonal'] as const) {
      const pts = routePoints(ends, defaultInner(shape, ends));
      expect(pts[1]).toEqual({ x: 240, y: 100 });
      expect(pts[pts.length - 2]).toEqual({ x: 460, y: 200 });
    }
  });

  it('bounds account for rotation', () => {
    const tpl = { id: 't', name: 't', imageUrl: '', width: 100, height: 40, ports: [] } as ProductTemplate;
    const inst = { id: 'i', templateId: 't', x: 0, y: 0, rotation: 90 } as ProductInstance;
    const b = instanceBounds(inst, tpl);
    expect(Math.round(b.w)).toBe(40); expect(Math.round(b.h)).toBe(100);
  });
});

describe('default orthogonal routes', () => {
  it('facing ports: Z shape with axis-aligned segments', () => {
    const pts = routePoints(ends, defaultInner('orthogonal', ends));
    expect(axisAligned(pts)).toBe(true);
    expect(pts).toEqual([{ x: 200, y: 100 }, { x: 240, y: 100 }, { x: 350, y: 100 }, { x: 350, y: 200 }, { x: 460, y: 200 }, { x: 500, y: 200 }]);
  });

  it('same-direction ports route around instead of through the part', () => {
    const e = { ...ends, eN: { x: 1, y: 0 }, end: { x: 300, y: 200 } };
    const inner = defaultInner('orthogonal', e);
    expect(axisAligned(routePoints(e, inner))).toBe(true);
    const xs = inner.map(p => p.x);
    expect(Math.max(...xs)).toBeGreaterThan(Math.max(240, 340)); // goes out beyond both stubs
  });

  it('perpendicular ports need a single elbow', () => {
    const e: RouteEnds = { ...ends, end: { x: 400, y: 300 }, eN: { x: 0, y: -1 } };
    const pts = routePoints(e, defaultInner('orthogonal', e));
    expect(axisAligned(pts)).toBe(true);
  });
});

describe('normalizing stored waypoints', () => {
  it('adds missing stubs in front of manually clicked waypoints', () => {
    const inner = normalizeInner('straight', ends, [{ x: 300, y: 300 }]);
    expect(inner[0]).toEqual({ x: 240, y: 100 });
    expect(inner[inner.length - 1]).toEqual({ x: 460, y: 200 });
    expect(inner).toHaveLength(3);
  });

  it('keeps an existing stub and snaps it onto the port ray', () => {
    const inner = normalizeInner('straight', ends, [{ x: 260, y: 104 }, { x: 440, y: 197 }]);
    expect(inner[0]).toEqual({ x: 260, y: 100 });
    expect(inner[1]).toEqual({ x: 440, y: 200 });
  });

  it('orthogonal: inserts corners so the wire stays axis-aligned', () => {
    const inner = normalizeInner('orthogonal', ends, [{ x: 300, y: 300 }]);
    expect(axisAligned(routePoints(ends, inner))).toBe(true);
  });

  it('falls back to the default route when nothing is stored', () => {
    expect(normalizeInner('straight', ends, undefined)).toEqual(defaultInner('straight', ends));
    expect(normalizeInner('straight', ends, [])).toEqual(defaultInner('straight', ends));
  });
});

describe('editing', () => {
  const inner = defaultInner('orthogonal', ends);   // s1(240,100) (350,100) (350,200) e1(460,200)

  it('orthogonal: only stubs get point handles, sideways-movable segments get segment handles', () => {
    const h = getHandles('orthogonal', ends, inner);
    expect(h.filter(x => x.kind === 'point').map(x => x.index)).toEqual([0, 3]);
    const seg = h.filter(x => x.kind === 'segment');
    expect(seg).toHaveLength(1);                                    // only the vertical middle one
    expect(seg[0]).toMatchObject({ index: 1, axis: 'v', at: { x: 350, y: 150 } });
  });

  it('dragging the vertical segment moves it sideways and keeps the wire orthogonal', () => {
    const next = moveSegment(ends, inner, 1, { x: 300, y: 999 });
    expect(next[1].x).toBe(300); expect(next[2].x).toBe(300);
    expect(axisAligned(routePoints(ends, next))).toBe(true);
  });

  it('a segment that runs along a stub cannot be pulled off the port ray', () => {
    expect(moveSegment(ends, inner, 0, { x: 999, y: 500 })).toBe(inner);
  });

  it('stub points slide along the port normal only and never shorter than the minimum', () => {
    const slid = moveWaypoint('straight', ends, [{ x: 240, y: 100 }, { x: 460, y: 200 }], 0, { x: 330, y: 400 });
    expect(slid[0]).toEqual({ x: 330, y: 100 });
    const tooShort = moveWaypoint('straight', ends, [{ x: 240, y: 100 }, { x: 460, y: 200 }], 0, { x: 150, y: 100 });
    expect(tooShort[0].x).toBe(200 + MIN_STUB_DRAG);
  });

  it('orthogonal: sliding a stub drags the perpendicular neighbour along', () => {
    const slid = moveWaypoint('orthogonal', ends, inner, 0, { x: 300, y: 100 });
    expect(slid[0].x).toBe(300);
    expect(axisAligned(routePoints(ends, slid))).toBe(true);
  });

  it('straight/curved: free waypoints move anywhere; bends can be inserted and removed', () => {
    const base = defaultInner('straight', ends);
    expect(getHandles('straight', ends, base).filter(h => h.kind === 'add')).toHaveLength(1);
    const withBend = insertWaypoint(base, 0, { x: 350, y: 300 });
    expect(withBend).toHaveLength(3);
    const moved = moveWaypoint('straight', ends, withBend, 1, { x: 360, y: 320 });
    expect(moved[1]).toEqual({ x: 360, y: 320 });
    expect(removeWaypoint('straight', ends, moved, 1)).toHaveLength(2);
    expect(removeWaypoint('straight', ends, moved, 0)).toBe(moved);   // stubs are not removable
  });
});
