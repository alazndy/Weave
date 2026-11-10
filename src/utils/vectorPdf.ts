import { PDFDocument } from 'pdf-lib';

interface ElectronPdfBridge {
  printToPDF?: (o: { widthMm: number; heightMm: number }) => Promise<Uint8Array>;
}
const bridge = (): ElectronPdfBridge | undefined =>
  typeof window !== 'undefined' ? (window as unknown as { electron?: ElectronPdfBridge }).electron : undefined;

/** True in the desktop app, where Chromium's print engine can produce true vector PDFs. */
export const canPrintVectorPdf = () => typeof bridge()?.printToPDF === 'function';

const PX_PER_MM = 96 / 25.4;

export interface SheetSpec {
  widthMm: number;
  heightMm: number;
  /** Sheet pixels (canvas units) per mm — the export area is `widthMm * pixelScale` px wide. */
  pixelScale: number;
}

/**
 * Prints one sheet to a single-page vector PDF: a clone of the export area is laid out in a
 * print-only overlay at exact paper size (text stays text, SVG stays paths), then Chromium prints it.
 */
export async function printSheetToPdf(source: HTMLElement, sheet: SheetSpec): Promise<Uint8Array> {
  const print = bridge()?.printToPDF;
  if (!print) throw new Error('Vector PDF is not available in this environment');
  const { widthMm, heightMm, pixelScale } = sheet;
  const k = PX_PER_MM / pixelScale;

  const root = document.createElement('div');
  root.id = 'pdf-print-root';
  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.querySelectorAll('.no-print').forEach(n => n.remove());
  Object.assign(clone.style, {
    position: 'absolute', left: '0', top: '0', margin: '0',
    width: `${widthMm * pixelScale}px`, height: `${heightMm * pixelScale}px`,
    transform: `scale(${k})`, transformOrigin: '0 0', translate: 'none', overflow: 'hidden',
  });
  root.appendChild(clone);

  const style = document.createElement('style');
  style.id = 'pdf-print-style';
  style.textContent = `
    #pdf-print-root{position:fixed;left:-200000px;top:0;width:${widthMm}mm;height:${heightMm}mm;overflow:hidden;background:#fff}
    #pdf-print-root *{box-shadow:none!important;text-shadow:none!important;filter:none!important;backdrop-filter:none!important}
    @page{size:${widthMm}mm ${heightMm}mm;margin:0}
    @media print{
      html,body{margin:0!important;padding:0!important;background:#fff!important;overflow:visible!important;height:auto!important}
      html::before,html::after,body::before,body::after{display:none!important;content:none!important;background:none!important}
      body>*:not(#pdf-print-root){display:none!important}
      #pdf-print-root{position:absolute!important;left:0!important;top:0!important}
    }`;
  document.head.appendChild(style);
  document.body.appendChild(root);
  document.documentElement.classList.add('pdf-printing');   // disables the legacy window.print() rules
  try {
    await document.fonts?.ready;
    await Promise.all([...root.querySelectorAll('img')].map(img => (img.complete ? Promise.resolve() : img.decode().catch(() => undefined))));
    await new Promise(r => requestAnimationFrame(() => r(null)));
    return await print({ widthMm, heightMm });
  } finally {
    root.remove();
    style.remove();
    document.documentElement.classList.remove('pdf-printing');
  }
}

/** Merges single-page PDFs (first page of each) into one document. */
export async function mergePdfs(parts: Uint8Array[], meta: { title?: string; author?: string } = {}): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const bytes of parts) {
    const src = await PDFDocument.load(bytes);
    const [page] = await out.copyPages(src, [0]);
    out.addPage(page);
  }
  if (meta.title) out.setTitle(meta.title);
  if (meta.author) out.setAuthor(meta.author);
  out.setCreator('Weave');
  out.setProducer('Weave');
  return out.save();
}
