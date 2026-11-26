import { test, expect, type Locator, type Page } from '@playwright/test';
import { openApp, placePair, canvas, undoBtn } from './helpers';

const body = (node: Locator) => node.locator(':scope > div').first();
const box = async (l: Locator) => (await l.boundingBox())!;
const view = (page: Page) => page.locator('#canvas-export-area').evaluate(el => {
  const m = new DOMMatrix(getComputedStyle(el).transform);
  return { x: m.e, y: m.f, scale: m.a };
});

async function drag(page: Page, from: { x: number; y: number }, dx: number, dy: number, button: 'left' | 'middle' = 'left') {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down({ button });
  await page.mouse.move(from.x + dx, from.y + dy, { steps: 8 });
  await page.mouse.up({ button });
}

/** Grab point away from the ports and the number badge. */
const grab = async (node: Locator) => { const b = await box(body(node)); return { x: b.x + b.width / 2, y: b.y + b.height / 4 }; };

async function expectMovedBy(node: Locator, dx: number, dy: number, action: () => Promise<void>) {
  const before = await box(body(node));
  await action();
  // 20px grid snap, scaled
  await expect.poll(async () => Math.abs((await box(body(node))).x - before.x - dx)).toBeLessThan(25);
  await expect.poll(async () => Math.abs((await box(body(node))).y - before.y - dy)).toBeLessThan(25);
}

/** A point left of the (zoomed out, shifted) sheet and outside the transformed layer. */
async function outsideLayer(page: Page) {
  for (let i = 0; i < 9; i++) await page.getByTitle('Uzaklaş').click();
  await expect.poll(async () => (await view(page)).scale).toBeLessThan(0.25);
  // a spot where only the bare viewport is under the pointer: neither sheet layer, paper nor an overlay
  const p = await canvas(page).evaluate(el => {
    const r = el.getBoundingClientRect();
    for (let y = r.bottom - 150; y > r.top + 100; y -= 20)
      for (let x = r.right - 100; x > r.left + 150; x -= 20)
        if (document.elementFromPoint(x, y) === el && document.elementFromPoint(x - 90, y + 60) === el) return { x, y };
    return null;
  });
  expect(p, 'no point outside the sheet').not.toBeNull();
  return p!;
}

test.describe('Taşıma ve kaydırma', () => {
  test('yakınlaştırdıktan sonra taşınan parça imleci takip eder', async ({ page }) => {
    await openApp(page);
    const { camera } = await placePair(page);
    const v = await box(canvas(page));
    await page.mouse.move(v.x + v.width / 2, v.y + v.height / 2);
    for (let i = 0; i < 3; i++) await page.mouse.wheel(0, 100);
    await expect.poll(async () => (await view(page)).scale).toBeLessThan(0.8);
    const from = await grab(camera);
    await expectMovedBy(camera, 120, 80, () => drag(page, from, 120, 80));
  });

  test('geri al yalnızca son taşımayı geri alır', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    const m = await grab(monitor);
    await expectMovedBy(monitor, 0, 160, () => drag(page, m, 0, 160));
    const monitorMoved = await box(body(monitor));
    const c = await grab(camera);
    const cameraStart = await box(body(camera));
    await expectMovedBy(camera, 0, -100, () => drag(page, c, 0, -100));
    await undoBtn(page).click();
    await expect.poll(async () => (await box(body(camera))).y).toBeCloseTo(cameraStart.y, 0);
    expect((await box(body(monitor))).y).toBeCloseTo(monitorMoved.y, 0);
  });

  test('tekerlek, imlecin altındaki noktayı sabit tutar (görünüm kaydırılmışken)', async ({ page }) => {
    await openApp(page);
    const { camera } = await placePair(page);
    const v = await box(canvas(page));
    await drag(page, { x: v.x + v.width / 2, y: v.y + v.height / 2 }, 200, 100, 'middle');
    const b = await box(body(camera));
    await page.mouse.move(b.x, b.y);
    await page.mouse.wheel(0, -100);
    await expect.poll(async () => (await view(page)).scale).toBeGreaterThan(1);
    await expect.poll(async () => Math.abs((await box(body(camera))).x - b.x)).toBeLessThan(2);
    await expect.poll(async () => Math.abs((await box(body(camera))).y - b.y)).toBeLessThan(2);
  });

  for (const [name, button, hand] of [['orta tuş', 'middle', false], ['el aracı', 'left', true], ['sol tuş (seçim aracı)', 'left', false]] as const) {
    test(`çizim alanının dışından kaydırma: ${name}`, async ({ page }) => {
      await openApp(page);
      const p = await outsideLayer(page);
      if (hand) await page.keyboard.press('h');
      const before = await view(page);
      await drag(page, p, -90, 60, button);
      await expect.poll(async () => Math.round((await view(page)).x - before.x)).toBe(-90);
      await expect.poll(async () => Math.round((await view(page)).y - before.y)).toBe(60);
    });
  }
});
