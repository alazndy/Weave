import type { DocNumbering, ProjectMetadata } from '../types';

export const DEFAULT_DOC_NUMBERING: DocNumbering = {
  enabled: false,
  originator: '',
  type: 'DWD',        // Drawing - Wiring Diagram
  discipline: 'ELE',  // Electrical
  location: 'GEN',    // General
  sequence: '001',
  sheetFromPage: true,
  phase: 'P1',
  revision: '0',
};

const clean = (v: string, len: number) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, len);
const pad = (v: string, len: number) => { const d = v.replace(/\D/g, '').slice(0, len); return d ? d.padStart(len, '0') : ''; };

/** Normalises user input to the code shapes of the numbering system. */
export const normalizeNumbering = (n: DocNumbering): DocNumbering => ({
  ...n,
  originator: clean(n.originator, 3),
  type: clean(n.type, 3),
  discipline: clean(n.discipline, 3),
  location: clean(n.location, 3),
  sequence: pad(n.sequence, 3),
  phase: clean(n.phase, 2),
  revision: clean(n.revision, 3),
});

/**
 * Document number for one sheet: `AAA-BBB-CCC-DDD-XXX[-YY] Rev-PP-R`.
 * Empty parts show as their placeholder (AAA, BBB …) so an unfinished number is visibly incomplete.
 */
export function composeDocumentNo(n: DocNumbering, sheet?: number): string {
  const v = normalizeNumbering(n);
  const parts = [v.originator || 'AAA', v.type || 'BBB', v.discipline || 'CCC', v.location || 'DDD', v.sequence || 'XXX'];
  if (v.sheetFromPage && sheet !== undefined) parts.push(String(sheet).padStart(2, '0').slice(-2));
  return `${parts.join('-')} Rev-${v.phase || 'PP'}-${v.revision || 'R'}`;
}

/** The number to print on a sheet: generated when numbering is enabled, otherwise the typed one. */
export const documentNoFor = (m: ProjectMetadata, sheet: number): string =>
  m.docNumbering?.enabled ? composeDocumentNo(m.docNumbering, sheet) : m.documentNo;

/** Missing parts of an enabled numbering (for the settings warning). */
export function missingParts(n: DocNumbering): string[] {
  const v = normalizeNumbering(n);
  const out: string[] = [];
  if (v.originator.length !== 3) out.push('Originator (3 harf)');
  if (v.type.length !== 3) out.push('Döküman tipi');
  if (v.discipline.length !== 3) out.push('Disiplin');
  if (v.location.length !== 3) out.push('Lokasyon');
  if (v.sequence.length !== 3) out.push('Sıra no (3 hane)');
  if (!/^P\d$/.test(v.phase)) out.push('Proje fazı (P0–P9)');
  if (!v.revision) out.push('Revizyon');
  return out;
}
