import { test, expect, type Page } from '@playwright/test';
import { openApp, trackErrors, placePair, undoBtn, redoBtn } from './helpers';

test.describe.configure({ timeout: 120000 });

const tabs = (page: Page) => page.getByTestId('page-tab');
const names = async (page: Page) => (await tabs(page).allInnerTexts()).map(t => t.split('\n')[0].trim());

async function threePages(page: Page) {
  await openApp(page);
  await page.getByTitle('Yeni Sayfa Ekle').click();
  await page.getByTitle('Yeni Sayfa Ekle').click();
  await expect(tabs(page)).toHaveCount(3);
  expect(await names(page)).toEqual(['Sayfa 1', 'Sayfa 2', 'Sayfa 3']);
}

test.describe('Sayfa sıralama', () => {
  test('ok düğmeleriyle sola/sağa taşınır; kenarlarda pasif; geri alınır', async ({ page }) => {
    const errors = trackErrors(page);
    await threePages(page);
    await page.getByRole('button', { name: 'Sayfa 3 sayfasını sola taşı' }).click();
    expect(await names(page)).toEqual(['Sayfa 1', 'Sayfa 3', 'Sayfa 2']);
    await page.getByRole('button', { name: 'Sayfa 3 sayfasını sola taşı' }).click();
    expect(await names(page)).toEqual(['Sayfa 3', 'Sayfa 1', 'Sayfa 2']);
    await expect(page.getByRole('button', { name: 'Sayfa 3 sayfasını sola taşı' })).toBeDisabled();
    await undoBtn(page).click();
    expect(await names(page)).toEqual(['Sayfa 1', 'Sayfa 3', 'Sayfa 2']);
    await redoBtn(page).click();
    expect(await names(page)).toEqual(['Sayfa 3', 'Sayfa 1', 'Sayfa 2']);
    errors.expectNone();
  });

  test('sekmeyi sürükleyip bırakarak sıralanır', async ({ page }) => {
    await threePages(page);
    await tabs(page).nth(0).dragTo(tabs(page).nth(2));
    expect(await names(page)).toEqual(['Sayfa 2', 'Sayfa 3', 'Sayfa 1']);
  });

  test('sıra değişince sayfa numaraları (Sheet) ve döküman numarası izler', async ({ page }) => {
    await threePages(page);
    // protokolü aç
    await page.locator('#legend-export-area').hover();
    await page.getByTitle('Anteti Düzenle').click();
    const modal = page.locator('div.fixed', { hasText: 'Proje Detayları' });
    await modal.getByTestId('doc-numbering-section').getByText('Protokolü kullan').click();
    await modal.getByRole('button', { name: 'Kaydet' }).click();
    // aktif sayfa = Sayfa 3 (yeni eklenen) → 03
    await expect(page.getByTestId('legend-docno')).toContainText('-03 ');
    await page.getByRole('button', { name: 'Sayfa 3 sayfasını sola taşı' }).click();
    await page.getByRole('button', { name: 'Sayfa 3 sayfasını sola taşı' }).click();
    await expect(page.getByTestId('legend-docno')).toContainText('-01 ');
  });

  test('sayfa ızgarasında da ok düğmeleri ve sürükleme çalışır', async ({ page }) => {
    await threePages(page);
    await page.getByTitle('Sayfa Izgarası').click();
    const cards = page.getByTestId('page-card');
    await expect(cards).toHaveCount(3);
    await page.getByRole('button', { name: 'Sayfa 1 sayfasını arkaya al' }).click();
    await expect(cards.nth(1)).toContainText('Sayfa 1');
    await cards.nth(1).dragTo(cards.nth(0));                 // ikisi de görünür alanda
    await expect(cards.nth(0)).toContainText('Sayfa 1');
    await expect(cards.nth(1)).toContainText('Sayfa 2');
  });
});

test.describe('PDF dışa aktarma', () => {
  const exportPdf = async (page: Page) => {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 100000 }), page.getByRole('button', { name: 'PDF olarak dışa aktar' }).click()]);
    const buf = Buffer.concat(await (await dl.createReadStream()).toArray());
    return { name: dl.suggestedFilename(), text: buf.toString('latin1'), size: buf.length };
  };
  const imageSizes = (t: string) => [...t.matchAll(/\/Filter \/DCTDecode \/Length (\d+)/g)].map(m => Number(m[1]));

  test('tüm sayfalar tek PDF olur, sayfa boyutu kağıt boyutudur, sıra PDF\'e yansır, uygulama durumu geri gelir', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    await placePair(page);                                       // sayfa 1: dolu
    await page.getByTitle('Yeni Sayfa Ekle').click();            // sayfa 2: boş
    await expect(tabs(page)).toHaveCount(2);
    await page.getByText('Sayfa 1', { exact: true }).first().click();

    const a = await exportPdf(page);
    expect(a.text.startsWith('%PDF-1.4')).toBe(true);
    expect(a.name).toMatch(/\.pdf$/);
    expect(a.text).toContain('/Count 2');
    expect(a.text).toContain('/MediaBox [0 0 841.89 595.28]');     // A4 yatay
    const [first, second] = imageSizes(a.text);
    expect(first).toBeGreaterThan(second);                          // dolu sayfa önce

    // sayfa sırası değişince PDF'teki sıra da değişir
    await page.getByRole('button', { name: 'Sayfa 1 sayfasını sağa taşı' }).click();
    const b = await exportPdf(page);
    const [first2, second2] = imageSizes(b.text);
    expect(first2).toBeLessThan(second2);

    // dışa aktarma sonrası durum geri yüklendi: aktif sayfa, tema, düğme
    await expect(page.getByRole('button', { name: 'PDF olarak dışa aktar' })).toBeEnabled();
    await expect(page.locator('html')).toHaveClass(/dark/);
    expect(await page.locator('[data-instance-id]').count()).toBe(2);
    errors.expectNone();
  });
});
