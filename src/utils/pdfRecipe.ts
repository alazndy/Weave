/**
 * Non-destructive PDF editing.
 *
 * A PDF is never flattened into a fixed-size bitmap while the user edits it. Instead the
 * editor keeps a small "recipe" (rotation, crop rectangle, eraser strokes) in page units and
 * re-renders the vector page from it. Every crop therefore renders the PDF again at a
 * resolution matched to the cropped area (no blur), and erased areas are re-applied on top of
 * each fresh render (they survive crops, rotations and undo/redo).
 *
 * Coordinate frames (all in PDF points, i.e. scale 1):
 *  - base frame:  the page as stored (rotation 0). Strokes are kept here so they never move.
 *  - view frame:  the page after the recipe's rotation. The crop rectangle lives here.
 */
import type { PDFPageProxy } from 'pdfjs-dist';

export type Rot = 0 | 90 | 180 | 270;
export interface Point { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }
export interface Stroke { pts: Point[]; r: number }
export interface PdfRecipe { rot: Rot; crop: Rect | null; strokes: Stroke[] }
/** `w0`/`h0`: page size in points with the PDF's own /Rotate already applied. */
export interface PdfSource { page: PDFPageProxy; w0: number; h0: number }

/** Long side (px) of the working render shown in the editor, and of the final export. */
export const WORK_LONG_SIDE = 2400;
export const FINAL_LONG_SIDE = 4096;
export const MAX_WORK_SCALE = 8;
export const MAX_FINAL_SCALE = 12;

export const newRecipe = (): PdfRecipe => ({ rot: 0, crop: null, strokes: [] });

type Dims = Pick<PdfSource, 'w0' | 'h0'>;

export const frameSize = (s: Dims, rot: Rot) =>
  rot % 180 === 0 ? { w: s.w0, h: s.h0 } : { w: s.h0, h: s.w0 };

export const effectiveCrop = (s: Dims, rc: PdfRecipe): Rect =>
  rc.crop ?? { x: 0, y: 0, ...frameSize(s, rc.rot) };

export function baseToFrame(s: Dims, rot: Rot, p: Point): Point {
  switch (rot) {
    case 90: return { x: s.h0 - p.y, y: p.x };
    case 180: return { x: s.w0 - p.x, y: s.h0 - p.y };
    case 270: return { x: p.y, y: s.w0 - p.x };
    default: return { x: p.x, y: p.y };
  }
}

export function frameToBase(s: Dims, rot: Rot, p: Point): Point {
  switch (rot) {
    case 90: return { x: p.y, y: s.h0 - p.x };
    case 180: return { x: s.w0 - p.x, y: s.h0 - p.y };
    case 270: return { x: s.w0 - p.y, y: p.x };
    default: return { x: p.x, y: p.y };
  }
}

/** Rotates the view by ±90° (clockwise = +90), carrying the crop rectangle along. */
export function rotateRecipe(s: Dims, rc: PdfRecipe, deg: 90 | -90): PdfRecipe {
  const rot = ((rc.rot + deg + 360) % 360) as Rot;
  const { w: wr, h: hr } = frameSize(s, rc.rot);
  let crop: Rect | null = null;
  if (rc.crop) {
    const c = rc.crop;
    crop = deg === 90
      ? { x: hr - (c.y + c.h), y: c.x, w: c.h, h: c.w }
      : { x: c.y, y: wr - (c.x + c.w), w: c.h, h: c.w };
  }
  return { ...rc, rot, crop };
}

/** Crops to a rectangle given in pixels of the current working render. */
export function cropRecipe(s: Dims, rc: PdfRecipe, selPx: Rect, pxPerUnit: number): PdfRecipe {
  const cur = effectiveCrop(s, rc);
  const x = Math.max(cur.x, cur.x + selPx.x / pxPerUnit);
  const y = Math.max(cur.y, cur.y + selPx.y / pxPerUnit);
  const right = Math.min(cur.x + cur.w, cur.x + (selPx.x + selPx.w) / pxPerUnit);
  const bottom = Math.min(cur.y + cur.h, cur.y + (selPx.y + selPx.h) / pxPerUnit);
  return { ...rc, crop: { x, y, w: Math.max(1, right - x), h: Math.max(1, bottom - y) } };
}

/** Records an eraser stroke drawn on the working render (points/radius in pixels). */
export function addStroke(s: Dims, rc: PdfRecipe, ptsPx: Point[], radiusPx: number, pxPerUnit: number): PdfRecipe {
  if (ptsPx.length === 0) return rc;
  const cur = effectiveCrop(s, rc);
  const pts = ptsPx.map(p => frameToBase(s, rc.rot, { x: cur.x + p.x / pxPerUnit, y: cur.y + p.y / pxPerUnit }));
  return { ...rc, strokes: [...rc.strokes, { pts, r: radiusPx / pxPerUnit }] };
}

export const scaleFor = (s: Dims, rc: PdfRecipe, longSide: number, maxScale: number) => {
  const c = effectiveCrop(s, rc);
  return Math.min(longSide / Math.max(c.w, c.h), maxScale);
};

/** Renders the recipe from the vector page: crop first, then the eraser strokes on top. */
export async function renderPdfRecipe(
  src: PdfSource, rc: PdfRecipe, longSide: number, maxScale: number,
): Promise<string> {
  const crop = effectiveCrop(src, rc);
  const scale = scaleFor(src, rc, longSide, maxScale);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(crop.w * scale));
  canvas.height = Math.max(1, Math.round(crop.h * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const viewport = src.page.getViewport({
    scale,
    rotation: (src.page.rotate + rc.rot) % 360,
    offsetX: -crop.x * scale,
    offsetY: -crop.y * scale,
  });
  await src.page.render({ canvasContext: ctx, viewport } as never).promise;

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const st of rc.strokes) {
    const pts = st.pts.map(p => {
      const f = baseToFrame(src, rc.rot, p);
      return { x: (f.x - crop.x) * scale, y: (f.y - crop.y) * scale };
    });
    const r = st.r * scale;
    ctx.lineWidth = r * 2;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (const p of pts) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill(); }
  }
  return canvas.toDataURL('image/png');
}
