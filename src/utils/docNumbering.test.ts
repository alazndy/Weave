import { describe, it, expect } from 'vitest';
import { composeDocumentNo, normalizeNumbering, missingParts, documentNoFor, DEFAULT_DOC_NUMBERING } from './docNumbering';
import { DOCUMENT_TYPES, DOCUMENT_DISCIPLINES, LOCATION_CODES, PROJECT_PHASES } from '../data/documentCodes';
import type { DocNumbering, ProjectMetadata } from '../types';

const base: DocNumbering = { ...DEFAULT_DOC_NUMBERING, enabled: true, originator: 'anc', sequence: '7', phase: 'p3', revision: '1' };

describe('document numbering AAA-BBB-CCC-DDD-XXX-YY Rev-PP-R', () => {
  it('composes the full number with the sheet', () => {
    expect(composeDocumentNo(base, 2)).toBe('ANC-DWD-ELE-GEN-007-02 Rev-P3-1');
  });
  it('omits the optional sheet part when not derived from the page', () => {
    expect(composeDocumentNo({ ...base, sheetFromPage: false }, 2)).toBe('ANC-DWD-ELE-GEN-007 Rev-P3-1');
  });
  it('shows placeholders for missing parts', () => {
    expect(composeDocumentNo({ ...base, originator: '', type: '', phase: '', revision: '' })).toBe('AAA-BBB-ELE-GEN-007 Rev-PP-R');
  });
  it('normalises case, characters and lengths', () => {
    const n = normalizeNumbering({ ...base, originator: 'a-n.cx', sequence: '12345', revision: 'a-1' });
    expect([n.originator, n.sequence, n.revision]).toEqual(['ANC', '123', 'A1']);
  });
  it('reports missing parts', () => {
    expect(missingParts(base)).toEqual([]);
    expect(missingParts({ ...base, originator: 'AB', phase: 'X' })).toEqual(['Originator (3 harf)', 'Proje fazı (P0–P9)']);
  });
  it('uses the generated number only when enabled', () => {
    const m = { documentNo: 'MANUEL-1', docNumbering: base } as ProjectMetadata;
    expect(documentNoFor(m, 1)).toBe('ANC-DWD-ELE-GEN-007-01 Rev-P3-1');
    expect(documentNoFor({ ...m, docNumbering: { ...base, enabled: false } }, 1)).toBe('MANUEL-1');
  });
});

describe('code lists from the spreadsheet', () => {
  it('contain the codes the protocol relies on', () => {
    const has = (l: { code: string }[], c: string) => l.some(x => x.code === c);
    expect(has(DOCUMENT_TYPES, 'DWD') && has(DOCUMENT_TYPES, 'PTC') && has(DOCUMENT_TYPES, 'DSC')).toBe(true);
    expect(has(DOCUMENT_DISCIPLINES, 'ELE') && has(DOCUMENT_DISCIPLINES, 'GEN')).toBe(true);
    expect(has(LOCATION_CODES, 'GEN')).toBe(true);
    expect(PROJECT_PHASES.map(p => p.code)).toEqual(['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9']);
  });
  it('have unique codes and 3-letter shape', () => {
    for (const l of [DOCUMENT_TYPES, LOCATION_CODES]) expect(new Set(l.map(x => x.code)).size).toBe(l.length);
    DOCUMENT_TYPES.forEach(t => expect(t.code).toMatch(/^[A-Z]{3}$/));
  });
});
