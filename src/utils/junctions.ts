/** Pure wiring edits for junctions. */
import type { Connection, Junction, Point, ProductInstance, ProductTemplate } from '../types';
import { JUNCTION_PORT, MIN_STUB_DRAG, normalizeInner, routePoints, type RouteEnds } from './connectionRoute';

export { JUNCTION_PORT };

export interface CableEnd { instanceId: string; portId: string }
export interface CablePair { id: string; from: CableEnd; to: CableEnd; label: string; via: boolean }

const TEMPLATE_PREFIX = '__junction__';

/** Presents junctions as zero-size one-port parts, so all cable code can resolve their ends. */
export function withJunctions(instances: ProductInstance[], templates: ProductTemplate[], junctions: Junction[] = []) {
    if (!junctions.length) return { instances, templates };
    const template: ProductTemplate = {
        id: TEMPLATE_PREFIX, name: 'junction', imageUrl: '', width: 0, height: 0,
        ports: [{ id: JUNCTION_PORT, label: 'junction', x: 0, y: 0, type: 'bidirectional', connectorType: 'generic' }],
    };
    return {
        instances: [...instances, ...junctions.map(j => ({ id: j.id, templateId: TEMPLATE_PREFIX, x: j.x, y: j.y }))],
        templates: [...templates, template],
    };
}

const endsOf = (c: Connection): [CableEnd, CableEnd] => [
    { instanceId: c.fromInstanceId, portId: c.fromPortId },
    { instanceId: c.toInstanceId, portId: c.toPortId },
];
const key = (e: CableEnd) => `${e.instanceId}\n${e.portId}`;

export const hasCable = (connections: Connection[], a: CableEnd, b: CableEnd) => connections.some(c => {
    const [x, y] = endsOf(c).map(key);
    return (x === key(a) && y === key(b)) || (x === key(b) && y === key(a));
});

const nearestOnSegment = (p: Point, a: Point, b: Point): Point => {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = dx * dx + dy * dy;
    const t = len ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len)) : 0;
    return { x: a.x + dx * t, y: a.y + dy * t };
};
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

const arrows = (head: Connection['arrowHead']) => ({
    start: head === 'start' || head === 'both',
    end: head === 'end' || head === 'both',
});
const arrowHead = (start: boolean, end: boolean): Connection['arrowHead'] =>
    start && end ? 'both' : start ? 'start' : end ? 'end' : 'none';

/** Splits `conn` at the point of its drawn route nearest to `at`. The label stays on the first branch. */
export function splitConnection(conn: Connection, at: Point, ends: RouteEnds, junctionId: string, ids: [string, string]) {
    const inner = normalizeInner(conn.shape || 'curved', ends, conn.controlPoints);
    const route = routePoints(ends, inner);
    let best = { point: route[0], segment: 0, d: Infinity };
    for (let i = 0; i < route.length - 1; i++) {
        const point = nearestOnSegment(at, route[i], route[i + 1]);
        const d = distance(point, at);
        if (d < best.d) best = { point, segment: i, d };
    }
    const junction: Junction = { id: junctionId, x: Math.round(best.point.x), y: Math.round(best.point.y) };
    // waypoints right at the junction would only produce a tiny kink
    const clear = (p: Point) => distance(p, junction) >= MIN_STUB_DRAG;
    const before = route.slice(1, best.segment + 1).filter(clear);
    const after = route.slice(best.segment + 1, -1).filter(clear);
    const head = arrows(conn.arrowHead);
    const first: Connection = {
        ...conn, id: ids[0], toInstanceId: junctionId, toPortId: JUNCTION_PORT,
        controlPoints: before.length ? before : undefined,
        arrowHead: conn.arrowHead && arrowHead(head.start, false),
    };
    const second: Connection = {
        ...conn, id: ids[1], fromInstanceId: junctionId, fromPortId: JUNCTION_PORT, label: '',
        controlPoints: after.length ? after : undefined,
        arrowHead: conn.arrowHead && arrowHead(false, head.end),
    };
    return { junction, branches: [first, second] as [Connection, Connection] };
}

const reversed = (c: Connection): Connection => {
    const head = arrows(c.arrowHead);
    return {
        ...c,
        fromInstanceId: c.toInstanceId, fromPortId: c.toPortId,
        toInstanceId: c.fromInstanceId, toPortId: c.fromPortId,
        controlPoints: c.controlPoints && [...c.controlPoints].reverse(),
        arrowHead: c.arrowHead && arrowHead(head.end, head.start),
    };
};

/**
 * Deletes a junction. With exactly two branches they become one cable (first branch's style),
 * routed through `at`; otherwise the branches go with it. A join that would make a self-loop or
 * a duplicate cable also just removes them.
 */
export function removeJunction(id: string, connections: Connection[], at?: Point): Connection[] {
    const branches = connections.filter(c => c.fromInstanceId === id || c.toInstanceId === id);
    const rest = connections.filter(c => !branches.includes(c));
    if (branches.length !== 2) return rest;
    const a = branches[0].toInstanceId === id ? branches[0] : reversed(branches[0]);
    const b = branches[1].fromInstanceId === id ? branches[1] : reversed(branches[1]);
    const from = endsOf(a)[0], to = endsOf(b)[1];
    if (a.fromInstanceId === id || b.toInstanceId === id || key(from) === key(to) || hasCable(rest, from, to)) return rest;
    const route = [...(a.controlPoints ?? []), ...(at ? [at] : []), ...(b.controlPoints ?? [])];
    const joined: Connection = {
        ...a, id: branches[0].id, toInstanceId: b.toInstanceId, toPortId: b.toPortId,
        label: branches[0].label || branches[1].label,
        controlPoints: route.length ? route : undefined,
        arrowHead: (a.arrowHead || b.arrowHead) && arrowHead(arrows(a.arrowHead).start, arrows(b.arrowHead).end),
    };
    return connections.flatMap(c => c === branches[0] ? [joined] : c === branches[1] ? [] : [c]);
}

export const pruneJunctions = (junctions: Junction[], connections: Connection[]) =>
    junctions.filter(j => connections.some(c => c.fromInstanceId === j.id || c.toInstanceId === j.id));

/** Port-to-port relations: direct cables, plus every pair of ports on the same junction network. */
export function cablePairs(connections: Connection[], junctionIds: Set<string>): CablePair[] {
    const direct: CablePair[] = [];
    const parent = new Map<string, string>();
    const root = (id: string): string => {
        const p = parent.get(id) ?? id;
        return p === id ? id : root(p);
    };
    for (const c of connections) {
        const [a, b] = [c.fromInstanceId, c.toInstanceId];
        if (junctionIds.has(a) && junctionIds.has(b) && root(a) !== root(b)) parent.set(root(a), root(b));
    }
    const nets = new Map<string, { ports: Map<string, CableEnd>; labels: Set<string> }>();
    for (const c of connections) {
        const [from, to] = endsOf(c);
        const junction = [from, to].find(e => junctionIds.has(e.instanceId));
        if (!junction) {
            direct.push({ id: c.id, from, to, label: c.label ?? '', via: false });
            continue;
        }
        const id = root(junction.instanceId);
        const net = nets.get(id) ?? { ports: new Map(), labels: new Set<string>() };
        for (const e of [from, to]) if (!junctionIds.has(e.instanceId)) net.ports.set(key(e), e);
        if (c.label) net.labels.add(c.label);
        nets.set(id, net);
    }
    const through = [...nets].flatMap(([id, net]) => {
        const ports = [...net.ports.values()];
        return ports.flatMap((from, i) => ports.slice(i + 1).map((to, j): CablePair =>
            ({ id: `${id}:${i}:${i + 1 + j}`, from, to, label: [...net.labels].join(', '), via: true })));
    });
    return [...direct, ...through];
}
