/**
 * Minimal multi-page PDF writer: every page is one full-bleed JPEG image.
 * No dependencies; output is a valid PDF 1.4 file with an xref table.
 */
export interface PdfPageImage {
  jpeg: Uint8Array;
  /** JPEG pixel size */
  widthPx: number;
  heightPx: number;
  /** Physical page size */
  widthMm: number;
  heightMm: number;
}

const MM_TO_PT = 72 / 25.4;
const enc = new TextEncoder();

export function buildPdf(pages: PdfPageImage[], info: { title?: string; author?: string; creator?: string } = {}): Uint8Array {
  if (pages.length === 0) throw new Error('PDF needs at least one page');
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];       // byte offset of object n (index n-1)
  let pos = 0;
  const push = (b: Uint8Array | string) => { const u = typeof b === 'string' ? enc.encode(b) : b; chunks.push(u); pos += u.length; };
  const startObj = (n: number) => { offsets[n - 1] = pos; push(`${n} 0 obj\n`); };
  // PDF text string: plain (...) for ASCII, UTF-16BE hex with BOM otherwise (Turkish letters etc.)
  const esc = (s: string) => {
    if (/^[\x20-\x7e]*$/.test(s)) return `(${s.replace(/[\\()]/g, m => '\\' + m)})`;
    let hex = 'FEFF';
    for (let i = 0; i < s.length; i++) hex += s.charCodeAt(i).toString(16).padStart(4, '0').toUpperCase();
    return `<${hex}>`;
  };

  // object numbering: 1 catalog, 2 pages, 3 info, then per page: page, content, image
  const pageObj = (i: number) => 4 + i * 3;
  const total = 3 + pages.length * 3;

  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  startObj(1); push('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  startObj(2); push(`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, i) => `${pageObj(i)} 0 R`).join(' ')}] >>\nendobj\n`);
  startObj(3);
  push(`<< /Producer (Weave) ${info.creator ? `/Creator ${esc(info.creator)} ` : ''}${info.title ? `/Title ${esc(info.title)} ` : ''}${info.author ? `/Author ${esc(info.author)} ` : ''}>>\nendobj\n`);

  pages.forEach((p, i) => {
    const w = +(p.widthMm * MM_TO_PT).toFixed(2), h = +(p.heightMm * MM_TO_PT).toFixed(2);
    const pg = pageObj(i), content = pg + 1, img = pg + 2;
    startObj(pg);
    push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${img} 0 R >> /ProcSet [/PDF /ImageC] >> /Contents ${content} 0 R >>\nendobj\n`);
    const stream = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q`;
    startObj(content);
    push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`);
    startObj(img);
    push(`<< /Type /XObject /Subtype /Image /Width ${p.widthPx} /Height ${p.heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`);
    push(p.jpeg);
    push('\nendstream\nendobj\n');
  });

  const xrefAt = pos;
  push(`xref\n0 ${total + 1}\n0000000000 65535 f \n`);
  offsets.forEach(o => push(`${String(o).padStart(10, '0')} 00000 n \n`));
  push(`trailer\n<< /Size ${total + 1} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`);

  const out = new Uint8Array(pos);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.length; }
  return out;
}
