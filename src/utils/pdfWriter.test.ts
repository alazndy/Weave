import { describe, it, expect } from 'vitest';
import { buildPdf } from './pdfWriter';

const fakeJpeg = (n: number) => { const b = new Uint8Array(n); b[0] = 0xff; b[1] = 0xd8; b[n - 2] = 0xff; b[n - 1] = 0xd9; return b; };
const text = (u: Uint8Array) => new TextDecoder('latin1').decode(u);

describe('buildPdf', () => {
  const pdf = buildPdf([
    { jpeg: fakeJpeg(300), widthPx: 4200, heightPx: 2970, widthMm: 420, heightMm: 297 },
    { jpeg: fakeJpeg(200), widthPx: 2970, heightPx: 4200, widthMm: 297, heightMm: 420 },
  ], { title: 'Test (1)', author: 'Şirket' });
  const s = text(pdf);

  it('is a PDF with header, trailer and the right page count', () => {
    expect(s.startsWith('%PDF-1.4')).toBe(true);
    expect(s.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(s).toContain('/Count 2');
    expect((s.match(/\/Type \/Page /g) || []).length).toBe(2);
  });

  it('uses real paper size in points (A3 landscape then portrait)', () => {
    expect(s).toContain('/MediaBox [0 0 1190.55 841.89]');
    expect(s).toContain('/MediaBox [0 0 841.89 1190.55]');
  });

  it('xref offsets point exactly at their objects', () => {
    const start = Number(/startxref\n(\d+)/.exec(s)![1]);
    expect(s.slice(start, start + 4)).toBe('xref');
    const entries = [...s.slice(start).matchAll(/(\d{10}) 00000 n /g)].map(m => Number(m[1]));
    expect(entries.length).toBe(3 + 2 * 3);
    entries.forEach((off, i) => expect(s.slice(off, off + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`));
  });

  it('encodes non-ASCII metadata as UTF-16 hex', () => {
    expect(s).toContain('/Author <FEFF015E0069007200');   // "Şir…"
  });

  it('embeds the JPEG bytes untouched and escapes the title', () => {
    expect(s).toContain('/Filter /DCTDecode /Length 300');
    expect(s).toContain('/Title (Test \\(1\\))');
    const i = s.indexOf('stream\nÿØ');
    expect(i).toBeGreaterThan(0);
  });

  it('rejects an empty document', () => {
    expect(() => buildPdf([])).toThrow();
  });
});
