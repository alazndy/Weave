import { test, expect, type Page } from '@playwright/test';
import {
  openApp, trackErrors, nodes, zones, texts, comments, undoBtn, redoBtn, placePair, dropTemplate,
  CAMERA, canvas, tool, freePoint,
} from './helpers';

const ACTIVE = /bg-amber-500/;

async function dragOnCanvas(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 4 });
  await page.mouse.move(to.x, to.y, { steps: 4 });
  await page.mouse.up();
}

const scaleOf = async (page: Page) =>
  page.locator('#canvas-export-area').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a);

test.describe('Tuval araçları', () => {
  test('araç düğmeleri aktif aracı değiştirir', async ({ page }) => {
    await openApp(page);
    const titles = [/Taşı \(M\)/, /Ölçekle/, /Kutu Seçimi/, /Manuel Rota/, /Bölge Ekle/, /Metin Ekle/, /Not \/ Yorum/, /Seçim \(V\)/];
    for (const t of titles) {
      await tool(page, t).click();
      await expect(tool(page, t)).toHaveClass(ACTIVE);
    }
  });

  test('klavye kısayolları araç çubuğundaki ipuçlarıyla aynı aracı seçer', async ({ page }) => {
    await openApp(page);
    const map: Record<string, RegExp> = {
      m: /Taşı \(M\)/, s: /Ölçekle/, b: /Kutu Seçimi/, r: /Manuel Rota/, z: /Bölge Ekle/, t: /Metin Ekle/, c: /Not \/ Yorum/, v: /Seçim \(V\)/,
    };
    for (const [key, title] of Object.entries(map)) {
      await page.keyboard.press(key);
      await expect(tool(page, title), `kısayol "${key}"`).toHaveClass(ACTIVE);
    }
  });

  test('bölge aracı sürükleyerek bölge çizer; geri alınır; düzenlenir', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    await tool(page, /Bölge Ekle/).click();
    const a = await freePoint(page, 0.55, 0.05), b = await freePoint(page, 0.95, 0.35);
    await dragOnCanvas(page, a, b);
    await expect(zones(page)).toHaveCount(1);

    await undoBtn(page).click();
    await expect(zones(page)).toHaveCount(0);
    await redoBtn(page).click();
    await expect(zones(page)).toHaveCount(1);

    await tool(page, /Seçim \(V\)/).click();
    await zones(page).first().hover();
    await zones(page).first().locator('button:has(svg.lucide-edit-2, svg.lucide-pen)').click();
    await expect(page.getByText('Bölge Düzenle')).toBeVisible();
    const zoneModal = page.locator('div.fixed', { hasText: 'Bölge Düzenle' });
    await zoneModal.getByRole('textbox').first().fill('ARAÇ ÖN');
    await zoneModal.getByRole('button', { name: 'Kaydet' }).click();
    await expect(zones(page).first()).toContainText('ARAÇ ÖN');

    await zones(page).first().hover();
    await zones(page).first().locator('button:has(svg.lucide-trash-2)').click();
    await expect(zones(page)).toHaveCount(0);
    await undoBtn(page).click();
    await expect(zones(page)).toHaveCount(1);
    errors.expectNone();
  });

  test('çok küçük sürükleme bölge oluşturmaz', async ({ page }) => {
    await openApp(page);
    await tool(page, /Bölge Ekle/).click();
    await dragOnCanvas(page, { x: 480, y: 450 }, { x: 485, y: 455 });
    await expect(zones(page)).toHaveCount(0);
  });

  test('metin aracı metin ekler, araç imlece döner, düzenlenir ve silinir', async ({ page }) => {
    await openApp(page);
    await tool(page, /Metin Ekle/).click();
    const p = await freePoint(page);
    await page.mouse.click(p.x, p.y);
    await expect(texts(page)).toHaveCount(1);
    await expect(texts(page).first()).toContainText('Metin');
    await expect(tool(page, /Seçim \(V\)/)).toHaveClass(ACTIVE);

    await texts(page).first().dblclick();
    await expect(page.getByText('Metin Düzenle')).toBeVisible();
    const textModal = page.locator('div.fixed', { hasText: 'Metin Düzenle' });
    await textModal.locator('textarea').fill('Kablo 3 metre');
    await textModal.getByRole('button', { name: 'Kaydet' }).click();
    await expect(texts(page).first()).toContainText('Kablo 3 metre');

    await texts(page).first().hover();
    await texts(page).first().locator('button:has(svg.lucide-trash-2)').click();
    await expect(texts(page)).toHaveCount(0);
    await undoBtn(page).click();
    await expect(texts(page)).toHaveCount(1);
  });

  test('yorum aracı not ekler, içerik kaydedilir ve silinir', async ({ page }) => {
    await openApp(page);
    await tool(page, /Not \/ Yorum/).click();
    const p = await freePoint(page);
    await page.mouse.click(p.x, p.y);
    await expect(comments(page)).toHaveCount(1);

    await comments(page).first().locator('div.rounded-full').first().click();
    await page.getByPlaceholder('Notunuzu buraya yazın...').fill('Sigorta 5A olmalı');
    await page.getByRole('button', { name: 'Tamam' }).click();

    await comments(page).first().locator('div.rounded-full').first().click();
    await expect(page.getByPlaceholder('Notunuzu buraya yazın...')).toHaveValue('Sigorta 5A olmalı');
    await comments(page).first().locator('button:has(svg.lucide-trash-2)').click();
    await expect(comments(page)).toHaveCount(0);
    await undoBtn(page).click();
    await expect(comments(page)).toHaveCount(1);
  });

  test('kutu seçimi sürüklenen alandaki cihazları seçer', async ({ page }) => {
    await openApp(page);
    await placePair(page);
    await tool(page, /Kutu Seçimi/).click();
    await dragOnCanvas(page, { x: 330, y: 200 }, { x: 880, y: 420 });
    await expect(page.getByRole('button', { name: 'Grupla', exact: true })).toBeEnabled();
    await expect(tool(page, /Seçim \(V\)/)).toHaveClass(ACTIVE);
  });

  test('ızgaraya yapış düğmesi açılıp kapanır', async ({ page }) => {
    await openApp(page);
    const snap = tool(page, 'Izgaraya Yapış');
    const before = await snap.getAttribute('class');
    await snap.click();
    await expect(snap).not.toHaveAttribute('class', before!);
    await snap.click();
    await expect(snap).toHaveAttribute('class', before!);
  });

  test('yakınlaş / uzaklaş / ekrana sığdır ölçeği değiştirir', async ({ page }) => {
    await openApp(page);
    const initial = await scaleOf(page);
    await tool(page, 'Yakınlaş').click();
    await expect.poll(() => scaleOf(page)).toBeGreaterThan(initial);
    const zoomed = await scaleOf(page);
    await tool(page, 'Uzaklaş').click();
    await tool(page, 'Uzaklaş').click();
    await expect.poll(() => scaleOf(page)).toBeLessThan(zoomed);
    await tool(page, 'Ekrana Sığdır').click();
    await expect.poll(() => scaleOf(page)).not.toBe(zoomed);
  });

  test('fare tekeri ile yakınlaştırılır', async ({ page }) => {
    await openApp(page);
    const initial = await scaleOf(page);
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, -300);
    await expect.poll(() => scaleOf(page)).toBeGreaterThan(initial);
  });

  test('orta tuşla sürükleyerek kaydırılır', async ({ page }) => {
    await openApp(page);
    const before = await canvas(page).locator('#canvas-export-area').boundingBox();
    await page.mouse.move(600, 400);
    await page.mouse.down({ button: 'middle' });
    await page.mouse.move(700, 450, { steps: 5 });
    await page.mouse.up({ button: 'middle' });
    const after = await canvas(page).locator('#canvas-export-area').boundingBox();
    expect(Math.round(after!.x - before!.x)).toBeGreaterThan(50);
  });

  test('harita düğmesi mini haritayı gösterir/gizler', async ({ page }) => {
    await openApp(page);
    const map = page.getByTestId('minimap');
    const visible = (await map.count()) > 0;
    await tool(page, 'Harita').click();
    await expect(map).toHaveCount(visible ? 0 : 1);
    await tool(page, 'Harita').click();
    await expect(map).toHaveCount(visible ? 1 : 0);
  });

  test('cihaz sürüklenerek taşınır ve geri alınır', async ({ page }) => {
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 450, 300);
    const node = nodes(page).first();
    const before = await node.boundingBox();
    const cx = before!.x + before!.width / 2, cy = before!.y + before!.height / 2;
    await dragOnCanvas(page, { x: cx, y: cy }, { x: cx + 120, y: cy + 80 });
    const after = await node.boundingBox();
    expect(after!.x).toBeGreaterThan(before!.x + 60);
    expect(after!.y).toBeGreaterThan(before!.y + 40);
    await undoBtn(page).click();
    const reverted = await node.boundingBox();
    expect(Math.abs(reverted!.x - before!.x)).toBeLessThan(2);
  });
});

test.describe('Sürükleme kararlılığı', () => {
  test('bölge ve metin tutulan noktadan sürüklenir, imlecin köşesine fırlamaz', async ({ page }) => {
    await openApp(page);
    // metin
    await tool(page, /Metin Ekle/).click();
    const p = await freePoint(page, 0.3, 0.5);
    await page.mouse.click(p.x, p.y);
    const text = texts(page).first();
    const t0 = (await text.boundingBox())!;
    const gx = t0.x + t0.width - 6, gy = t0.y + t0.height - 4;       // sağ-alt köşeden tut
    await page.mouse.move(gx, gy);
    await page.mouse.down();
    await page.mouse.move(gx + 40, gy + 30, { steps: 6 });
    await page.mouse.up();
    const t1 = (await text.boundingBox())!;
    expect(Math.abs(t1.x - (t0.x + 40))).toBeLessThan(25);            // grid snap payı
    expect(Math.abs(t1.y - (t0.y + 30))).toBeLessThan(25);

    // bölge
    await tool(page, /Bölge Ekle/).click();
    const a = await freePoint(page, 0.55, 0.05), b = await freePoint(page, 0.95, 0.3);
    await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 6 }); await page.mouse.up();
    await tool(page, /Seçim \(V\)/).click();
    const zone = zones(page).first();
    const z0 = (await zone.boundingBox())!;
    const zx = z0.x + z0.width - 20, zy = z0.y + z0.height - 20;
    await page.mouse.move(zx, zy);
    await page.mouse.down();
    await page.mouse.move(zx - 30, zy + 25, { steps: 6 });
    await page.mouse.up();
    const z1 = (await zone.boundingBox())!;
    expect(Math.abs(z1.x - (z0.x - 30))).toBeLessThan(25);
    expect(Math.abs(z1.y - (z0.y + 25))).toBeLessThan(25);
  });

  test('tıklamak parçayı oynatmaz; düğmeyi tuval dışında bırakınca sürükleme biter', async ({ page }) => {
    await openApp(page);
    const { camera } = await placePair(page);
    const b0 = await camera.boundingBox();
    await page.mouse.click(b0!.x + 30, b0!.y + 30);
    const b1 = await camera.boundingBox();
    expect(Math.abs(b1!.x - b0!.x) + Math.abs(b1!.y - b0!.y)).toBeLessThan(1);

    await page.mouse.move(b1!.x + 30, b1!.y + 30);
    await page.mouse.down();
    await page.mouse.move(b1!.x + 90, b1!.y + 70, { steps: 5 });
    await page.mouse.move(100, 400, { steps: 5 });     // sol panelin üstü
    await page.mouse.up();                              // tuval dışında bırak
    const rel = await camera.boundingBox();
    await page.mouse.move(600, 500, { steps: 5 });      // tuvale dön, düğme basılı değil
    const after = await camera.boundingBox();
    expect(Math.abs(after!.x - rel!.x) + Math.abs(after!.y - rel!.y)).toBeLessThan(1);
  });
});
