import type { ProductInstance } from '../types';

/** Number shown on a component: the user's own number, or its automatic position in the page. */
export const instanceNumber = (inst: ProductInstance, index: number): string =>
  inst.number?.trim() || String(index + 1);

/** Display numbers for all instances of a page, by id. */
export const numberMap = (instances: ProductInstance[]): Map<string, string> =>
  new Map(instances.map((i, idx) => [i.id, instanceNumber(i, idx)]));

/**
 * Reading-order numbers: top to bottom in rows (items whose tops are within `rowTol` px share a row),
 * left to right inside a row. Returns id → "1", "2", … for the given subset (all when omitted).
 */
export function numberBySpace(instances: ProductInstance[], onlyIds?: Set<string>, start = 1, rowTol = 40): Map<string, string> {
  const items = instances.filter(i => !i.hidden && (!onlyIds || onlyIds.has(i.id))).sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: ProductInstance[][] = [];
  for (const it of items) {
    const row = rows.find(r => Math.abs(r[0].y - it.y) <= rowTol);
    if (row) row.push(it); else rows.push([it]);
  }
  const out = new Map<string, string>();
  let n = start;
  rows.sort((a, b) => a[0].y - b[0].y).forEach(r => r.sort((a, b) => a.x - b.x).forEach(it => out.set(it.id, String(n++))));
  return out;
}

/** Numbers that appear on more than one component (ignoring case) → the duplicated labels. */
export function duplicateNumbers(instances: ProductInstance[]): Set<string> {
  const seen = new Map<string, number>();
  instances.forEach((i, idx) => {
    if (i.hidden) return;
    const k = instanceNumber(i, idx).toLowerCase();
    seen.set(k, (seen.get(k) ?? 0) + 1);
  });
  return new Set([...seen].filter(([, c]) => c > 1).map(([k]) => k));
}
