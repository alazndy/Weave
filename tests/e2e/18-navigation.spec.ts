import { test, expect, type Page } from '@playwright/test';
import { openApp, trackErrors, placePair, nodes } from './helpers';

const tr = async (page: Page) =>
  page.locator('#canvas-export-area').evaluate(el => { const m = new DOMMatrix(getComputedStyle(el).transform); return { s: m.a, x: m.e, y: m.f }; });

test.describe('Navigasyon çubuğu', () => {
  test('ok düğmeleri tuvali kaydırır; basılı tutunca devam eder', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    const t0 = await tr(page);
    await page.getByRole('button', { name: 'Sağa kaydır' }).click();      // sağa kaydır = içerik sola gider
    const t1 = await tr(page);
    expect(t1.x).toBeLessThan(t0.x);
    expect(t1.y).toBeCloseTo(t0.y, 1);
    await page.getByRole('button', { name: 'Aşağı kaydır' }).click();
    expect((await tr(page)).y).toBeLessThan(t1.y);
    // basılı tut → tek tıklamadan çok daha fazla
    const before = (await tr(page)).x;
    const b = (await page.getByRole('button', { name: 'Sola kaydır' }).boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1600);
    await page.mouse.up();
    expect((await tr(page)).x - before).toBeGreaterThan(120);
    errors.expectNone();
  });

  test('kaydırma modu: tuvalde ve parça üzerinde sürükleyince gezinir, parçayı oynatmaz', async ({ page }) => {
    await openApp(page);
    await placePair(page);
    await page.getByRole('button', { name: 'Kaydırma modu' }).click();
    await expect(page.getByRole('button', { name: 'Kaydırma modu' })).toHaveAttribute('aria-pressed', 'true');
    const node = nodes(page).first();
    const nb0 = (await node.boundingBox())!;
    const t0 = await tr(page);
    const x = nb0.x + nb0.width / 2, y = nb0.y + nb0.height / 2;      // parçanın üstünden tut
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 90, y + 50, { steps: 6 });
    await page.mouse.up();
    await expect.poll(async () => (await tr(page)).x - t0.x).toBeGreaterThan(60);
    const t1 = await tr(page);
    expect(t1.y - t0.y).toBeGreaterThan(30);
    // parça tuval içinde yerinde: ekranda tuvalle birlikte kaydı
    const nb1 = (await node.boundingBox())!;
    expect(Math.abs((nb1.x - nb0.x) - (t1.x - t0.x))).toBeLessThan(3);
    // H kısayolu ve tekrar tıklama modu kapatır
    await page.getByRole('button', { name: 'Kaydırma modu' }).click();
    await expect(page.getByRole('button', { name: 'Kaydırma modu' })).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('h');
    await expect(page.getByRole('button', { name: 'Kaydırma modu' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('yakınlaştırma kaydırıcısı, görünür alanın ortasını sabit tutar; yüzdeye tıklayınca %100', async ({ page }) => {
    await openApp(page);
    const vp = (await page.getByTestId('canvas-viewport').boundingBox())!;
    const cx = vp.x + vp.width / 2, cy = vp.y + vp.height / 2;
    // ortadaki noktanın tuval koordinatı
    const worldAtCenter = async () => { const t = await tr(page); return { x: (cx - vp.x - t.x) / t.s, y: (cy - vp.y - t.y) / t.s }; };
    const w0 = await worldAtCenter();
    const slider = page.getByTestId('zoom-slider');
    await slider.fill('80');
    const t1 = await tr(page);
    expect(t1.s).toBeGreaterThan(1.5);
    const w1 = await worldAtCenter();
    expect(Math.abs(w1.x - w0.x)).toBeLessThan(3);
    expect(Math.abs(w1.y - w0.y)).toBeLessThan(3);
    await page.getByRole('button', { name: 'Yakınlaştırmayı %100 yap' }).click();
    expect((await tr(page)).s).toBeCloseTo(1, 2);
    await expect(page.getByTestId('zoom-percent')).toHaveText('100%');
    // + / − düğmeleri de ortayı korur
    await page.getByRole('button', { name: 'Yakınlaş', exact: true }).click();
    const w2 = await worldAtCenter();
    expect(Math.abs(w2.x - w0.x)).toBeLessThan(3);
  });
});
