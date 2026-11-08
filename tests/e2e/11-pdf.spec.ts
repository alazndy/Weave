import { test, expect, type Page } from '@playwright/test';
import { openApp, trackErrors } from './helpers';

/** One-page 600x400 PDF with a filled 200x200 black square at (100,100) in top-left coordinates. */
function makePdf(): Buffer {
  const content = '0 0 0 rg 100 100 200 200 re f';
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 400] /Contents 4 0 R /Resources << >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objs.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach(o => { out += `${String(o).padStart(10, '0')} 00000 n \n`; });
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, 'latin1');
}

const work = (page: Page) => page.locator('canvas').first();
const overlay = (page: Page) => page.locator('canvas').nth(1);
const size = (page: Page) => work(page).evaluate((c: HTMLCanvasElement) => ({ w: c.width, h: c.height }));
const luma = (page: Page, x: number, y: number) =>
  work(page).evaluate((c: HTMLCanvasElement, [px, py]) => {
    const d = c.getContext('2d')!.getImageData(px, py, 1, 1).data;
    return Math.round((d[0] + d[1] + d[2]) / 3);
  }, [x, y]);

/** Drag on the overlay using coordinates of the working render. */
async function drag(page: Page, from: [number, number], to: [number, number]) {
  const box = (await overlay(page).boundingBox())!;
  const { w, h } = await size(page);
  const at = ([x, y]: [number, number]) => ({ x: box.x + (x * box.width) / w, y: box.y + (y * box.height) / h });
  const a = at(from), b = at(to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 4 });
  await page.mouse.move(b.x, b.y, { steps: 4 });
  await page.mouse.up();
}

const openPdf = async (page: Page) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Yeni bileşen' }).click();
  await page.locator('input[type=file][accept*=".pdf"]').setInputFiles({ name: 'part.pdf', mimeType: 'application/pdf', buffer: makePdf() });
  await expect(page.getByRole('heading', { name: /Ön İşleme/ })).toBeVisible();
  await expect.poll(async () => (await size(page)).w).toBeGreaterThan(1000);
};

test.describe('PDF yükleme (çözünürlükten bağımsız)', () => {
  test.describe.configure({ timeout: 90000 }); // vector re-renders are CPU heavy when suites run in parallel
  test('PDF vektörden yüksek çözünürlükte çizilir', async ({ page }) => {
    const errors = trackErrors(page);
    await openPdf(page);
    expect(await size(page)).toEqual({ w: 2400, h: 1600 });
    expect(await luma(page, 800, 800)).toBeLessThan(40);   // square is black
    expect(await luma(page, 100, 100)).toBeGreaterThan(240); // page is white
    errors.expectNone();
  });

  test('kırpınca PDF yeniden çizilir: görüntü bulanıklaşmaz, çözünürlük artar', async ({ page }) => {
    await openPdf(page);
    await drag(page, [400, 400], [800, 800]);              // 400px = 100 pt at scale 4
    await page.getByRole('button', { name: /Kırp/ }).click();
    // 100pt wide area renders at the 8x cap => 800px (a bitmap crop would stay at 400px)
    await expect.poll(async () => Math.abs((await size(page)).w - 800)).toBeLessThan(12);
    expect(await luma(page, 400, 400)).toBeLessThan(40);
  });

  test('silinen alanlar kırpmadan sonra da silik kalır', async ({ page }) => {
    await openPdf(page);
    await page.getByTitle('Sil', { exact: true }).click();
    await drag(page, [700, 800], [900, 800]);              // erase through the middle of the square
    expect(await luma(page, 800, 800)).toBeGreaterThan(240);

    await page.getByTitle('Seç', { exact: true }).click();
    await drag(page, [350, 350], [1250, 1250]);
    await page.getByRole('button', { name: /Kırp/ }).click();
    await expect.poll(async () => Math.abs((await size(page)).w - 1800)).toBeLessThan(25); // 225pt at 8x
    expect(await luma(page, 900, 900)).toBeGreaterThan(240);  // erased spot stays white
    expect(await luma(page, 150, 150)).toBeLessThan(40);      // untouched part stays black
  });

  test('silinen alanlar döndürmeden sonra da yerinde kalır', async ({ page }) => {
    await openPdf(page);
    await page.getByTitle('Sil', { exact: true }).click();
    await drag(page, [700, 800], [900, 800]);
    await page.getByRole('button', { name: 'Sağa Çevir' }).click();
    await expect.poll(async () => (await size(page)).h).toBeGreaterThan((await size(page)).w - 1);
    const { w, h } = await size(page);
    expect(h).toBeGreaterThan(w);
    // page centre (300,200 pt) is inside the erased stripe, wherever it ends up after rotating
    expect(await luma(page, Math.round(w / 2), Math.round(h / 2))).toBeGreaterThan(240);
  });

  test('geri al ve yinele kırpma ve silmeyi birlikte yönetir', async ({ page }) => {
    await openPdf(page);
    await page.getByTitle('Sil', { exact: true }).click();
    await drag(page, [700, 800], [900, 800]);
    await page.getByTitle('Seç', { exact: true }).click();
    await drag(page, [350, 350], [1250, 1250]);
    await page.getByRole('button', { name: /Kırp/ }).click();
    await expect.poll(async () => Math.abs((await size(page)).w - 1800)).toBeLessThan(25);

    await page.locator('button[title*="Geri"]').first().click();      // undo crop
    await expect.poll(async () => (await size(page)).w).toBe(2400);
    expect(await luma(page, 800, 800)).toBeGreaterThan(240);          // erasure still there
    await page.locator('button[title*="Geri"]').first().click();      // undo erase
    await expect.poll(async () => luma(page, 800, 800)).toBeLessThan(40);
    await page.locator('button[title*="İleri"]').first().click();     // redo erase
    await expect.poll(async () => luma(page, 800, 800)).toBeGreaterThan(240);
  });

  test('Tamamla: ürün görseli yüksek çözünürlükte vektörden üretilir', async ({ page }) => {
    await openPdf(page);
    await page.getByTitle('Sil', { exact: true }).click();
    await drag(page, [700, 800], [900, 800]);
    await page.getByRole('button', { name: /Tamamla ve İlerle/ }).click();
    const img = page.getByAltText('Work area');
    await expect(img).toBeVisible();
    const natural = await img.evaluate((i: HTMLImageElement) => ({ w: i.naturalWidth, h: i.naturalHeight }));
    expect(natural.w).toBe(4096);                              // far above the 2400px working size
    expect(natural.h).toBeGreaterThan(2700);
  });
});
