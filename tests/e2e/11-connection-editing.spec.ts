import { test, expect, type Page } from '@playwright/test';
import { freePoint, openApp, trackErrors, connections, placePair, wirePair, portOf, undoBtn, dropTemplate, CAMERA, MONITOR } from './helpers';

const toolbar = (page: Page) => page.getByTestId('connection-toolbar');
const wirePath = (page: Page) => connections(page).first().locator('path').nth(2);
const pathD = async (page: Page) => (await wirePath(page).getAttribute('d')) || '';
const nums = (d: string) => (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);

/** Selects the wire by clicking a point on its line (25 % along, away from the mid buttons). */
async function selectWire(page: Page) {
  const pt = await wirePath(page).evaluate((el: SVGPathElement) => {
    const p = el.getPointAtLength(el.getTotalLength() * 0.2);
    const m = el.getScreenCTM()!;
    return { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f };
  });
  await page.mouse.click(pt.x, pt.y);
}

async function setup(page: Page) {
  await openApp(page);
  const pair = await placePair(page, 300, 430, 760);
  await wirePair(page, pair.camera, pair.monitor);
  await page.mouse.move(5, 5);
  await selectWire(page);
  await expect(toolbar(page)).toBeVisible();
  return pair;
}

test.describe('Bağlantı düzenleme', () => {
  test('bağlantıya tıklayınca üst araç çubuğu açılır, Esc ve boşluğa tıklama kapatır', async ({ page }) => {
    const errors = trackErrors(page);
    await setup(page);
    await page.keyboard.press('Escape');
    await expect(toolbar(page)).toHaveCount(0);
    await selectWire(page);
    await expect(toolbar(page)).toBeVisible();
    const fp = await freePoint(page);
    await page.mouse.click(fp.x, fp.y);
    await expect(toolbar(page)).toHaveCount(0);
    errors.expectNone();
  });

  test('araç çubuğu: şekil, çizgi stili, kalınlık, ok ve renk bağlantıyı değiştirir', async ({ page }) => {
    await setup(page);
    const bar = toolbar(page);
    const dBefore = await pathD(page);
    await bar.getByRole('button', { name: 'Düz', exact: true }).click();
    expect(await pathD(page)).not.toBe(dBefore);
    await bar.getByRole('button', { name: 'Eğri' }).click();
    expect(await pathD(page)).toContain(' C ');
    await bar.getByRole('button', { name: 'Dik açılı' }).click();
    await bar.getByRole('button', { name: 'Kesikli' }).click();
    await expect(wirePath(page)).toHaveAttribute('stroke-dasharray', '8, 6');
    await bar.getByRole('button', { name: 'Kalın kalınlık' }).click();
    await expect(wirePath(page)).toHaveAttribute('stroke-width', '5');
    await bar.getByRole('button', { name: 'İki uca ok' }).click();
    await expect(wirePath(page)).toHaveAttribute('marker-end', /arrow-end/);
    await expect(wirePath(page)).toHaveAttribute('marker-start', /arrow-start/);
    await bar.getByLabel('Kablo rengi').fill('#00ff00');
    await expect(wirePath(page)).toHaveAttribute('stroke', '#00ff00');
  });

  test('kablo önce parçadan düz çıkar: ilk segment port normali boyunca yatay', async ({ page }) => {
    await setup(page);
    await toolbar(page).getByRole('button', { name: 'Düz', exact: true }).click();
    const n = nums(await pathD(page));
    // M sx sy L x1 y1 ...: kamera çıkışı sağda → ilk nokta aynı y'de, sağa ≥ 24px
    expect(n[3]).toBeCloseTo(n[1], 0);
    expect(n[2] - n[0]).toBeGreaterThanOrEqual(24);
  });

  test('dik açılı kablonun orta segmenti sürüklenerek kaydırılır, geri alınır', async ({ page }) => {
    await setup(page);
    await portOf(page.locator('[data-instance-id]').nth(1), 'mon-in').scrollIntoViewIfNeeded();
    // kamera ile monitör farklı yükseklikte olsun ki dikey orta segment oluşsun
    const mon = page.locator('[data-instance-id]').nth(1);
    const mb = await mon.boundingBox();
    await page.mouse.move(mb!.x + 40, mb!.y + 40);
    await page.mouse.down();
    await page.mouse.move(mb!.x + 40, mb!.y + 160, { steps: 6 });
    await page.mouse.up();
    await selectWire(page);
    await toolbar(page).getByRole('button', { name: 'Dik açılı' }).click();
    const seg = connections(page).first().locator('[data-handle="segment"]');
    await expect(seg).toHaveCount(1);
    const before = await seg.boundingBox();
    await page.mouse.move(before!.x + before!.width / 2, before!.y + before!.height / 2);
    await page.mouse.down();
    await page.mouse.move(before!.x - 50, before!.y + before!.height / 2, { steps: 6 });
    await page.mouse.up();
    const after = await seg.boundingBox();
    expect(after!.x).toBeLessThan(before!.x - 20);
    await undoBtn(page).click();
    const restored = await seg.boundingBox();
    expect(Math.abs(restored!.x - before!.x)).toBeLessThan(2);
  });

  test('düz kabloda kenar noktasından bükülme eklenir, çift tıkla silinir', async ({ page }) => {
    await setup(page);
    await toolbar(page).getByRole('button', { name: 'Düz', exact: true }).click();
    const add = connections(page).first().locator('[data-handle="add"]').first();
    const pts = connections(page).first().locator('[data-handle="point"]');
    const before = await pts.count();
    const b = await add.boundingBox();
    await page.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2);
    await page.mouse.down();
    await page.mouse.move(b!.x + 10, b!.y + 120, { steps: 6 });
    await page.mouse.up();
    await expect(pts).toHaveCount(before + 1);
    await pts.nth(1).dblclick();
    await expect(pts).toHaveCount(before);
  });

  test('Rotayı sıfırla, kilitle ve sil çalışır', async ({ page }) => {
    await setup(page);
    const bar = toolbar(page);
    await bar.getByRole('button', { name: 'Rotayı sıfırla' }).click();
    await bar.getByRole('button', { name: 'Kilitle' }).click();
    await expect(bar.getByRole('button', { name: 'Bağlantıyı sil' })).toBeDisabled();
    await bar.getByRole('button', { name: 'Kilidi aç' }).click();
    await bar.getByRole('button', { name: 'Bağlantıyı sil' }).click();
    await expect(connections(page)).toHaveCount(0);
    await undoBtn(page).click();
    await expect(connections(page)).toHaveCount(1);
  });

  test('Delete tuşu seçili bağlantıyı siler', async ({ page }) => {
    await setup(page);
    await page.keyboard.press('Delete');
    await expect(connections(page)).toHaveCount(0);
  });
});
void dropTemplate; void CAMERA; void MONITOR;
