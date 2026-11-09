import { test, expect } from '@playwright/test';
import { openApp, trackErrors, nodes, placePair, freePoint } from './helpers';

const selected = (page: import('@playwright/test').Page) => page.getByTestId('group-bounds');

test.describe('Sürükleyerek seçme ve toplu ölçekleme', () => {
  test('boş alandan sürükleyerek (pencere) seçer; boşluğa tıklamak seçimi kaldırır', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    const a = (await camera.boundingBox())!, b = (await monitor.boundingBox())!;
    const x1 = a.x - 30, y1 = a.y - 40, x2 = b.x + b.width + 30, y2 = b.y + b.height + 40;
    await page.mouse.move(x1, y1);
    await page.mouse.down();
    await page.mouse.move(x2, y2, { steps: 8 });
    await page.mouse.up();
    await expect(selected(page)).toBeVisible();

    const fp = await freePoint(page, 0.5, 0.9);
    await page.mouse.click(fp.x, fp.y);
    await expect(selected(page)).toHaveCount(0);
    errors.expectNone();
  });

  test('pencere sadece tamamen içindekileri, sağdan sola (kesişim) dokunanları seçer', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    const a = (await camera.boundingBox())!, b = (await monitor.boundingBox())!;
    // yalnızca kamerayı kapsayan, monitöre yarım değen kutu: soldan sağa → 1 öğe → grup sınırı yok
    await page.mouse.move(a.x - 20, a.y - 30);
    await page.mouse.down();
    await page.mouse.move(b.x + 20, a.y + a.height + 30, { steps: 8 });
    await page.mouse.up();
    await expect(selected(page)).toHaveCount(0);
    // aynı kutu sağdan sola → kesişim: ikisi seçilir
    await page.mouse.move(b.x + 20, a.y + a.height + 30);
    await page.mouse.down();
    await page.mouse.move(a.x - 20, a.y - 30, { steps: 8 });
    await page.mouse.up();
    await expect(selected(page)).toBeVisible();
  });

  test('köşe tutamacı seçilenleri birlikte ölçekler, geri alınır', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    const a = (await camera.boundingBox())!, b = (await monitor.boundingBox())!;
    await page.mouse.move(a.x - 30, a.y - 40);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width + 30, b.y + b.height + 40, { steps: 8 });
    await page.mouse.up();
    const handle = page.getByTestId('group-scale-handle');
    await expect(handle).toBeVisible();

    const w0 = (await camera.boundingBox())!.width, gap0 = (await monitor.boundingBox())!.x - a.x;
    const h = (await handle.boundingBox())!;
    const hx = h.x + h.width / 2, hy = h.y + h.height / 2;
    await page.mouse.move(hx, hy);
    await page.mouse.down();
    await page.mouse.move(hx - 60, hy - 30, { steps: 8 });
    await page.mouse.up();
    const w1 = (await camera.boundingBox())!.width, gap1 = (await monitor.boundingBox())!.x - (await camera.boundingBox())!.x;
    expect(w1).toBeLessThan(w0 - 5);
    expect(gap1 / gap0).toBeCloseTo(w1 / w0, 1);          // aralık ve boyut aynı oranda değişti

    await page.getByRole('button', { name: 'Geri Al' }).click();
    expect(Math.abs((await camera.boundingBox())!.width - w0)).toBeLessThan(1);
  });

  test('tek tıklamayla seçilen tek parça grup tutamacı göstermez', async ({ page }) => {
    await openApp(page);
    const { camera } = await placePair(page);
    await camera.click();
    await expect(selected(page)).toHaveCount(0);
    await expect(nodes(page)).toHaveCount(2);
  });
});
