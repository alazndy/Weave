import { describe, it, expect } from 'vitest';
import {
  baseToFrame, frameToBase, rotateRecipe, cropRecipe, addStroke, effectiveCrop, newRecipe, scaleFor,
  type PdfRecipe, type Rot,
} from './pdfRecipe';

const dims = { w0: 600, h0: 400 };
const ROTS: Rot[] = [0, 90, 180, 270];
const inside = (p: { x: number; y: number }, r: { x: number; y: number; w: number; h: number }) =>
  p.x >= r.x - 1e-9 && p.x <= r.x + r.w + 1e-9 && p.y >= r.y - 1e-9 && p.y <= r.y + r.h + 1e-9;

describe('pdf recipe geometry', () => {
  it('frameToBase inverts baseToFrame for every rotation', () => {
    for (const rot of ROTS) {
      const p = { x: 123, y: 45 };
      const back = frameToBase(dims, rot, baseToFrame(dims, rot, p));
      expect(back.x).toBeCloseTo(p.x); expect(back.y).toBeCloseTo(p.y);
    }
  });

  it('rotating four times returns the same crop', () => {
    let rc: PdfRecipe = { ...newRecipe(), crop: { x: 50, y: 20, w: 100, h: 60 } };
    for (let i = 0; i < 4; i++) rc = rotateRecipe(dims, rc, 90);
    expect(rc.rot).toBe(0);
    expect(rc.crop).toEqual({ x: 50, y: 20, w: 100, h: 60 });
  });

  it('rotation keeps the same page region cropped (both directions)', () => {
    const base: PdfRecipe = { ...newRecipe(), crop: { x: 50, y: 20, w: 100, h: 60 } };
    const inner = { x: 100, y: 50 };  // inside the crop (view frame, rot 0 => base frame)
    const outer = { x: 300, y: 300 };
    for (const deg of [90, -90] as const) {
      const rc = rotateRecipe(dims, base, deg);
      expect(inside(baseToFrame(dims, rc.rot, inner), rc.crop!)).toBe(true);
      expect(inside(baseToFrame(dims, rc.rot, outer), rc.crop!)).toBe(false);
    }
  });

  it('crop converts working-render pixels to page units and clamps to the page', () => {
    const rc = cropRecipe(dims, newRecipe(), { x: 100, y: 50, w: 200, h: 100 }, 2);
    expect(rc.crop).toEqual({ x: 50, y: 25, w: 100, h: 50 });
    const tooBig = cropRecipe(dims, newRecipe(), { x: -50, y: 0, w: 5000, h: 5000 }, 2);
    expect(tooBig.crop).toEqual({ x: 0, y: 0, w: 600, h: 400 });
  });

  it('cropping twice is relative to the previous crop', () => {
    const a = cropRecipe(dims, newRecipe(), { x: 100, y: 100, w: 400, h: 400 }, 1);
    const b = cropRecipe(dims, a, { x: 10, y: 10, w: 100, h: 100 }, 2);
    expect(b.crop).toEqual({ x: 105, y: 105, w: 50, h: 50 });
  });

  it('erase strokes are stored in the base frame and survive crop and rotation', () => {
    let rc = addStroke(dims, newRecipe(), [{ x: 100, y: 100 }], 10, 2);
    expect(rc.strokes[0]).toEqual({ pts: [{ x: 50, y: 50 }], r: 5 });
    rc = cropRecipe(dims, rc, { x: 0, y: 0, w: 200, h: 200 }, 2);
    rc = rotateRecipe(dims, rc, 90);
    expect(rc.strokes[0].pts[0]).toEqual({ x: 50, y: 50 });
    // a stroke drawn after rotating still lands on the same base point
    const after = addStroke(dims, { ...newRecipe(), rot: 90 }, [{ x: 20, y: 40 }], 4, 2);
    const view = baseToFrame(dims, 90, after.strokes[0].pts[0]);
    expect(view.x).toBeCloseTo(10); expect(view.y).toBeCloseTo(20);
  });

  it('smaller crops render at a higher scale (up to the cap)', () => {
    const full = scaleFor(dims, newRecipe(), 2400, 8);
    const small = scaleFor(dims, { ...newRecipe(), crop: { x: 0, y: 0, w: 100, h: 100 } }, 2400, 8);
    expect(small).toBeGreaterThan(full);
    expect(small).toBe(8);
    expect(effectiveCrop(dims, newRecipe())).toEqual({ x: 0, y: 0, w: 600, h: 400 });
  });
});
