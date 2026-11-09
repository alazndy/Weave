/**
 * Connection routing and manual editing.
 *
 * A connection is drawn as  start → [inner waypoints] → end.  The first and last inner
 * waypoints are the "exit stubs": they always lie on the port's outward normal and clear the
 * part's drawing, so every wire first leaves the device before it bends. The stored
 * `controlPoints` hold the inner waypoints; when none are stored a default route is derived
 * (and follows the devices when they move). Editing materialises the route into controlPoints.
 */
import type { Connection, ConnectionShape, Point, ProductInstance, ProductTemplate } from '../types';
import { getPortNormal, getPortPosition } from './geometry';

export interface Rect { x: number; y: number; w: number; h: number }
export interface RouteEnds {
  start: Point; end: Point;
  sN: Point; eN: Point;
  /** Length of the straight exit stub on each side (clears the part's bounds). */
  sLen: number; eLen: number;
}

export const STUB_MIN = 24;
export const STUB_CLEARANCE = 16;
/** Shortest stub the user can drag a stub handle down to. */
export const MIN_STUB_DRAG = 12;
const EPS = 0.5;

const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
const mul = (a: Point, k: number): Point => ({ x: a.x * k, y: a.y * k });
const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y;
const same = (a: Point, b: Point) => Math.abs(a.x - b.x) < EPS && Math.abs(a.y - b.y) < EPS;
const axisOf = (n: Point): 'h' | 'v' => (Math.abs(n.x) >= Math.abs(n.y) ? 'h' : 'v');

/** Axis-aligned bounds of an instance (rotation included). */
export function instanceBounds(inst: ProductInstance, tpl: ProductTemplate): Rect {
  const w = inst.width || tpl.width, h = inst.height || tpl.height;
  const cx = inst.x + w / 2, cy = inst.y + h / 2;
  const a = ((inst.rotation || 0) * Math.PI) / 180;
  const hw = (Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a))) / 2;
  const hh = (Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a))) / 2;
  return { x: cx - hw, y: cy - hh, w: hw * 2, h: hh * 2 };
}

/** Distance from `p` along unit direction `n` until the ray leaves `r`. */
export function exitDistance(p: Point, n: Point, r: Rect): number {
  let t = Infinity;
  if (n.x > 1e-6) t = Math.min(t, (r.x + r.w - p.x) / n.x);
  else if (n.x < -1e-6) t = Math.min(t, (r.x - p.x) / n.x);
  if (n.y > 1e-6) t = Math.min(t, (r.y + r.h - p.y) / n.y);
  else if (n.y < -1e-6) t = Math.min(t, (r.y - p.y) / n.y);
  return Number.isFinite(t) ? Math.max(0, t) : 0;
}

export const stubLength = (p: Point, n: Point, r: Rect) =>
  Math.max(STUB_MIN, Math.ceil(exitDistance(p, n, r) + STUB_CLEARANCE));

export function getRouteEnds(conn: Connection, instances: ProductInstance[], templates: ProductTemplate[]): RouteEnds | null {
  const fi = instances.find(i => i.id === conn.fromInstanceId);
  const ti = instances.find(i => i.id === conn.toInstanceId);
  const ft = templates.find(t => t.id === fi?.templateId);
  const tt = templates.find(t => t.id === ti?.templateId);
  if (!fi || !ti || !ft || !tt) return null;
  const start = getPortPosition(fi, ft, conn.fromPortId);
  const end = getPortPosition(ti, tt, conn.toPortId);
  const sN = getPortNormal(fi, ft, conn.fromPortId);
  const eN = getPortNormal(ti, tt, conn.toPortId);
  return {
    start, end, sN, eN,
    sLen: stubLength(start, sN, instanceBounds(fi, ft)),
    eLen: stubLength(end, eN, instanceBounds(ti, tt)),
  };
}

const stubPoints = (e: RouteEnds) => ({
  s1: add(e.start, mul(e.sN, e.sLen)),
  e1: add(e.end, mul(e.eN, e.eLen)),
});

/** Corner points that join two stub tips with axis-aligned segments (excludes the tips). */
function orthBetween(s1: Point, e1: Point, e: RouteEnds): Point[] {
  if (Math.abs(s1.x - e1.x) < EPS || Math.abs(s1.y - e1.y) < EPS) return [];
  const aS = axisOf(e.sN), aE = axisOf(e.eN);
  const sameDir = dot(e.sN, e.eN) > 0;
  if (aS === 'h' && aE === 'h') {
    const mx = sameDir
      ? (e.sN.x > 0 ? Math.max(s1.x, e1.x) + STUB_MIN : Math.min(s1.x, e1.x) - STUB_MIN)
      : Math.round((s1.x + e1.x) / 2);
    return [{ x: mx, y: s1.y }, { x: mx, y: e1.y }];
  }
  if (aS === 'v' && aE === 'v') {
    const my = sameDir
      ? (e.sN.y > 0 ? Math.max(s1.y, e1.y) + STUB_MIN : Math.min(s1.y, e1.y) - STUB_MIN)
      : Math.round((s1.y + e1.y) / 2);
    return [{ x: s1.x, y: my }, { x: e1.x, y: my }];
  }
  return aS === 'h' ? [{ x: e1.x, y: s1.y }] : [{ x: s1.x, y: e1.y }];
}

/** Default inner waypoints (stub tips + elbows) for a shape. */
export function defaultInner(shape: ConnectionShape, e: RouteEnds): Point[] {
  const { s1, e1 } = stubPoints(e);
  if (shape === 'orthogonal') return tidy(shape, e, [s1, ...orthBetween(s1, e1, e), e1]);
  return [s1, e1];
}

/** Inserts corners so consecutive waypoints are axis-aligned (orthogonal wires only). */
function orthogonalize(points: Point[], firstAxis: 'h' | 'v'): Point[] {
  if (points.length < 2) return points;
  const out: Point[] = [points[0]];
  let prev: 'h' | 'v' = firstAxis;
  for (let i = 1; i < points.length; i++) {
    const a = out[out.length - 1], b = points[i];
    const alignedX = Math.abs(a.x - b.x) < EPS, alignedY = Math.abs(a.y - b.y) < EPS;
    if (!alignedX && !alignedY) {
      // move perpendicular to the previous direction first
      out.push(prev === 'h' ? { x: a.x, y: b.y } : { x: b.x, y: a.y });
      prev = prev === 'h' ? 'h' : 'v';
    } else {
      prev = alignedY ? 'h' : 'v';
    }
    out.push(b);
  }
  return out;
}

/** Removes duplicate points and (for orthogonal wires) redundant collinear corners. Keeps both stubs. */
function tidy(shape: ConnectionShape, e: RouteEnds, pts: Point[]): Point[] {
  let out = pts.filter((p, i) => i === 0 || !same(p, pts[i - 1]));
  if (shape === 'orthogonal') {
    out = out.filter((p, i) => {
      if (i === 0 || i === out.length - 1) return true;
      const a = out[i - 1], b = out[i + 1];
      const collinear = (Math.abs(a.x - p.x) < EPS && Math.abs(p.x - b.x) < EPS)
        || (Math.abs(a.y - p.y) < EPS && Math.abs(p.y - b.y) < EPS);
      return !collinear;
    });
  }
  void e;
  return out;
}

/** Stored waypoints with the exit stubs guaranteed (or the default route when none are stored). */
export function normalizeInner(shape: ConnectionShape, e: RouteEnds, stored?: Point[]): Point[] {
  if (!stored || stored.length === 0) return defaultInner(shape, e);
  const { s1, e1 } = stubPoints(e);
  let inner = stored.map(p => ({ ...p }));

  const onRay = (p: Point, origin: Point, n: Point) => {
    const v = sub(p, origin);
    const along = dot(v, n);
    const lateral = Math.abs(v.x * n.y - v.y * n.x);
    return along >= MIN_STUB_DRAG && lateral <= 12;
  };
  if (onRay(inner[0], e.start, e.sN)) {
    const along = dot(sub(inner[0], e.start), e.sN);
    inner[0] = add(e.start, mul(e.sN, along)); // snap exactly onto the ray
  } else {
    inner.unshift(s1);
  }
  const last = inner.length - 1;
  if (onRay(inner[last], e.end, e.eN)) {
    const along = dot(sub(inner[last], e.end), e.eN);
    inner[last] = add(e.end, mul(e.eN, along));
  } else {
    inner.push(e1);
  }
  if (shape === 'orthogonal') inner = orthogonalize(inner, axisOf(e.sN));
  return tidy(shape, e, inner);
}

export const routePoints = (e: RouteEnds, inner: Point[]): Point[] => {
  const all = [e.start, ...inner, e.end];
  return all.filter((p, i) => i === 0 || !same(p, all[i - 1]));
};

export interface Handle {
  /** `point`: draggable waypoint, `add`: drag to create a bend, `segment`: drag an orthogonal segment */
  kind: 'point' | 'add' | 'segment';
  /** waypoint index for `point`; first-point index of the segment for `add`/`segment` */
  index: number;
  at: Point;
  /** `point` only: first/last waypoint (exit stub, slides along the port normal) */
  stub?: boolean;
  axis?: 'h' | 'v';
}

const segAxis = (a: Point, b: Point): 'h' | 'v' | null =>
  Math.abs(a.y - b.y) < EPS ? 'h' : Math.abs(a.x - b.x) < EPS ? 'v' : null;

/** Can this orthogonal segment be slid sideways without pulling a stub off its port ray? */
function segmentMovable(e: RouteEnds, inner: Point[], i: number): boolean {
  const ax = segAxis(inner[i], inner[i + 1]);
  if (!ax) return false;
  if (i === 0 && axisOf(e.sN) === (ax === 'h' ? 'h' : 'v')) return false;  // runs along the stub
  if (i + 1 === inner.length - 1 && axisOf(e.eN) === (ax === 'h' ? 'h' : 'v')) return false;
  return true;
}

export function getHandles(shape: ConnectionShape, e: RouteEnds, inner: Point[]): Handle[] {
  const out: Handle[] = [];
  inner.forEach((p, i) => {
    const stub = i === 0 || i === inner.length - 1;
    if (shape !== 'orthogonal' || stub) out.push({ kind: 'point', index: i, at: p, stub });
  });
  for (let i = 0; i < inner.length - 1; i++) {
    const a = inner[i], b = inner[i + 1];
    const at = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    if (shape === 'orthogonal') {
      if (segmentMovable(e, inner, i)) out.push({ kind: 'segment', index: i, at, axis: segAxis(a, b)! });
    } else {
      out.push({ kind: 'add', index: i, at });
    }
  }
  return out;
}

/** Drags waypoint `idx` to `target`. Stub points only slide along their port's normal. */
export function moveWaypoint(shape: ConnectionShape, e: RouteEnds, inner: Point[], idx: number, target: Point): Point[] {
  const out = inner.map(p => ({ ...p }));
  const lastIdx = out.length - 1;
  const isFirst = idx === 0, isLast = idx === lastIdx;
  if (!isFirst && !isLast) {
    if (shape === 'orthogonal') return inner;           // corners move via their segments
    out[idx] = { ...target };
    return tidy(shape, e, out);
  }
  const origin = isFirst ? e.start : e.end;
  const n = isFirst ? e.sN : e.eN;
  const t = Math.max(MIN_STUB_DRAG, dot(sub(target, origin), n));
  const moved = add(origin, mul(n, t));
  const delta = sub(moved, out[idx]);
  out[idx] = moved;
  if (shape === 'orthogonal') {
    const nb = isFirst ? 1 : lastIdx - 1;
    if (nb >= 0 && nb !== idx && out[nb]) {
      // neighbour joined by a segment perpendicular to the stub shifts along with it
      const perpendicular = Math.abs(dot(sub(inner[nb], inner[idx]), n)) < EPS;
      if (perpendicular) out[nb] = add(out[nb], delta);
    }
  }
  return tidy(shape, e, out);
}

/** Slides orthogonal segment `i` (inner[i]→inner[i+1]) sideways to `target`. */
export function moveSegment(e: RouteEnds, inner: Point[], i: number, target: Point): Point[] {
  if (!segmentMovable(e, inner, i)) return inner;
  const out = inner.map(p => ({ ...p }));
  const ax = segAxis(inner[i], inner[i + 1])!;
  let v = ax === 'h' ? target.y : target.x;
  // keep a stub from collapsing into / through its part
  const clamp = (idx: number, origin: Point, n: Point) => {
    if (idx !== i && idx !== i + 1) return;
    const probe = ax === 'h' ? { x: out[idx].x, y: v } : { x: v, y: out[idx].y };
    const t = dot(sub(probe, origin), n);
    if (t < MIN_STUB_DRAG) v += (MIN_STUB_DRAG - t) * (ax === 'h' ? n.y : n.x);
  };
  clamp(0, e.start, e.sN);
  clamp(out.length - 1, e.end, e.eN);
  for (const idx of [i, i + 1]) out[idx] = ax === 'h' ? { ...out[idx], y: v } : { ...out[idx], x: v };
  return tidy('orthogonal', e, out);
}

export function insertWaypoint(inner: Point[], afterIdx: number, at: Point): Point[] {
  const out = inner.map(p => ({ ...p }));
  out.splice(afterIdx + 1, 0, { ...at });
  return out;
}

/** Removes a free waypoint (never a stub). */
export function removeWaypoint(shape: ConnectionShape, e: RouteEnds, inner: Point[], idx: number): Point[] {
  if (idx <= 0 || idx >= inner.length - 1) return inner;
  const out = inner.filter((_, i) => i !== idx);
  return tidy(shape, e, shape === 'orthogonal' ? orthogonalize(out, axisOf(e.sN)) : out);
}

/** SVG path for a polyline route: round-cornered for straight/orthogonal, smooth for curved. */
export function curvedPathThrough(points: Point[]): string {
  if (points.length < 2) return '';
  const p = (i: number) => points[Math.min(Math.max(i, 0), points.length - 1)];
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
  }
  return d;
}
