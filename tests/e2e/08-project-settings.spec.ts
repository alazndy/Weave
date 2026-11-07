import { test, expect, type Page } from '@playwright/test';
import {
  openApp, trackErrors, autoDialogs, nodes, leftTab, dropTemplate, placePair, CAMERA, canvas, undoBtn, redoBtn,
} from './helpers';

const readDownload = async (file: import('@playwright/test').Download) =>
  Buffer.concat(await (await file.createReadStream()).toArray()).toString('utf8');
const paperSize = (page: Page) =>
  page.locator('#canvas-export-area').evaluate(el => {
    const r = el.firstElementChild as HTMLElement;
    return { w: parseInt(r.style.width), h: parseInt(r.style.height) };
  });
const openTitleBlockEditor = async (page: Page) => {
  const block = page.locator('#legend-export-area');
  await block.hover();
  await page.getByTitle('Anteti Düzenle').click();
  return page.locator('div.fixed', { hasText: 'Proje Detayları' });
};

test.describe('Proje sekmesi', () => {
  test('kağıt boyutu A3/A4/A6 tuval boyutunu değiştirir', async ({ page }) => {
    await openApp(page);
    await leftTab(page, 'Project');
    const a4 = await paperSize(page);
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'A3' }).click();
    await expect.poll(async () => (await paperSize(page)).w).toBeGreaterThan(a4.w);
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'A6' }).click();
    await expect.poll(async () => (await paperSize(page)).w).toBeLessThan(a4.w);
  });

  test('dikey/yatay yön tuval boyutlarını çevirir', async ({ page }) => {
    await openApp(page);
    await leftTab(page, 'Project');
    const land = await paperSize(page);
    expect(land.w).toBeGreaterThan(land.h);
    await page.getByRole('button', { name: 'Portrait' }).click();
    await expect.poll(async () => (await paperSize(page)).w).toBeLessThan(land.w);
    await page.getByRole('button', { name: 'Landscape' }).click();
    await expect.poll(async () => (await paperSize(page)).w).toBe(land.w);
  });

  test('Save .weave dosyası indirir; içerik proje verisini taşır', async ({ page }) => {
    await openApp(page);
    await placePair(page);
    await leftTab(page, 'Project');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Save' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/\.weave$/);
    const project = JSON.parse(await readDownload(file));
    expect(project.version).toBe('2.0');
    expect(project.pages[0].instances).toHaveLength(2);
    expect(project.templates.map((t: { id: string }) => t.id)).toContain(CAMERA.id);
  });

  test('Ctrl+S kısayolu proje dosyası indirir', async ({ page }) => {
    await openApp(page);
    const download = page.waitForEvent('download');
    await page.keyboard.press('Control+s');
    expect((await download).suggestedFilename()).toMatch(/\.weave$/);
  });

  test('kaydedilen .weave dosyası geri yüklenince aynı proje gelir', async ({ page }) => {
    autoDialogs(page);
    await openApp(page);
    await placePair(page);
    await leftTab(page, 'Project');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Save' }).click();
    const saved = await readDownload(await download);

    await page.getByRole('button', { name: 'Sahneyi Temizle' }).click();
    await page.getByRole('button', { name: /Onayla|Sil|Evet|Temizle/ }).last().click();
    await expect(nodes(page)).toHaveCount(0);

    await page.locator('input[type=file][accept=".weave,.json"]').setInputFiles({
      name: 'saved.weave', mimeType: 'application/json', buffer: Buffer.from(saved),
    });
    await expect(nodes(page)).toHaveCount(2);
  });

  test('Export BOM adetleri doğru CSV olarak indirir', async ({ page }) => {
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 430, 300);
    await dropTemplate(page, CAMERA.id, 700, 300);
    await leftTab(page, 'Project');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export BOM' }).click();
    const csv = await readDownload(await download);
    expect(csv).toContain('"Test Kamera","CAM-1","","2"');
  });

  test('boş sayfada Export BOM uyarı verir', async ({ page }) => {
    const dialogs = autoDialogs(page);
    await openApp(page);
    await leftTab(page, 'Project');
    await page.getByRole('button', { name: 'Export BOM' }).click();
    await expect.poll(() => dialogs.map(d => d.message)).toContain('Bu sayfada malzeme listesine girecek ürün yok.');
  });
});

test.describe('Antet / proje detayları', () => {
  test('antet düzenleme modalı açılır, alanlar kaydedilir ve antete yansır', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    const modal = await openTitleBlockEditor(page);
    await expect(modal).toBeVisible();
    await modal.getByPlaceholder('Firma Adı').fill('Brigade Türkiye');
    await modal.getByPlaceholder('Müşteri Adı / Firma').fill('Ankara Belediyesi');
    await modal.getByPlaceholder('Proje Adı').fill('Otobüs 360 Kamera');
    await modal.getByRole('button', { name: 'Kaydet' }).click();
    await expect(modal).toBeHidden();
    const block = page.locator('#legend-export-area');
    await expect(block).toContainText('Brigade Türkiye');
    await expect(block).toContainText('Ankara Belediyesi');
    await expect(block).toContainText('Otobüs 360 Kamera');
    errors.expectNone();
  });

  test('İptal değişiklikleri atar', async ({ page }) => {
    await openApp(page);
    const modal = await openTitleBlockEditor(page);
    await modal.getByPlaceholder('Firma Adı').fill('Atılacak');
    await modal.getByRole('button', { name: 'İptal' }).click();
    await expect(page.locator('#legend-export-area')).not.toContainText('Atılacak');
  });

  test('döküman no otomatik üret düğmesi numarayı günceller', async ({ page }) => {
    await openApp(page);
    const modal = await openTitleBlockEditor(page);
    await modal.getByPlaceholder('Proje Adı').fill('Otobüs Kamera Sistemi');
    await modal.getByTitle('Oto. Oluştur').click();
    await expect(modal.getByTitle('Oto. Oluştur').locator('xpath=preceding-sibling::input')).toHaveValue(/^OKS-\d{8}-R\d+/);
  });

  test('özel alan eklenir, düzenlenir ve silinir', async ({ page }) => {
    await openApp(page);
    const modal = await openTitleBlockEditor(page);
    await modal.getByRole('button', { name: /Ekle|Alan/ }).first().click();
    const label = modal.getByPlaceholder('Başlık (Örn: Kontrol Eden)');
    await expect(label).toHaveCount(1);
    await label.fill('Kontrol Eden');
    await modal.getByPlaceholder('Değer').fill('A. Yılmaz');
    await modal.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.locator('#legend-export-area')).toContainText('A. Yılmaz');

    const m2 = await openTitleBlockEditor(page);
    await m2.locator('button:has(svg.lucide-trash-2)').first().click();
    await m2.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.locator('#legend-export-area')).not.toContainText('A. Yılmaz');
  });

  test('firma logosu yüklenir ve antette görünür', async ({ page }) => {
    await openApp(page);
    const modal = await openTitleBlockEditor(page);
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await modal.locator('input[type=file]').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: png });
    await modal.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.locator('#legend-export-area img')).toBeVisible();
  });

  test('teknik notlar düzenlenir', async ({ page }) => {
    await openApp(page);
    const modal = await openTitleBlockEditor(page);
    await modal.locator('textarea').fill('1. Tüm kablolar etiketlenecek.');
    await modal.getByRole('button', { name: 'Kaydet' }).click();
    await expect(canvas(page)).toContainText('Tüm kablolar etiketlenecek');
    await undoBtn(page).click();
    await expect(page.locator('#legend-export-area')).not.toContainText('Tüm kablolar etiketlenecek');
    await redoBtn(page).click();
    await expect(page.locator('#legend-export-area')).toContainText('Tüm kablolar etiketlenecek');
  });
});

test.describe('Uygulama ayarları', () => {
  const open = async (page: Page) => {
    await page.getByRole('button', { name: /App Settings/ }).click();
    return page.getByRole('dialog');
  };

  test('tema kartları temayı değiştirir', async ({ page }) => {
    await openApp(page);
    const dlg = await open(page);
    await dlg.getByText('Light Mode').click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await dlg.getByText('Dark Mode').click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('renk paleti CSS değişkenlerini değiştirir ve kalıcıdır', async ({ page }) => {
    await openApp(page);
    const dlg = await open(page);
    const before = await page.evaluate(() => document.documentElement.style.getPropertyValue('--color-paprika'));
    await dlg.getByRole('button', { name: /Ocean Deep/ }).click();
    const after = await page.evaluate(() => document.documentElement.style.getPropertyValue('--color-paprika'));
    expect(after).not.toBe(before);
    await page.reload();
    await page.getByRole('button', { name: 'Kapat' }).click();
    expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--color-paprika'))).toBe(after);
  });

  test('dil seçimi arayüz dilini değiştirir', async ({ page }) => {
    await openApp(page);
    const dlg = await open(page);
    await dlg.getByRole('combobox').click();
    await page.getByRole('option', { name: /English/ }).click();
    await dlg.getByRole('button', { name: 'Close' }).first().click();
    await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
  });

  test('Gemini anahtarı AI sekmesinde saklanır, göster/gizle çalışır', async ({ page }) => {
    await openApp(page);
    const dlg = await open(page);
    await dlg.getByRole('tab', { name: /AI/ }).click();
    const key = dlg.getByLabel('Gemini API Key');
    await expect(key).toHaveAttribute('type', 'password');
    await key.fill('AIza-test-key');
    await dlg.getByRole('button', { name: 'Göster' }).click();
    await expect(key).toHaveAttribute('type', 'text');
    await page.reload();
    await page.getByRole('button', { name: 'Kapat' }).click();
    const dlg2 = await open(page);
    await dlg2.getByRole('tab', { name: /AI/ }).click();
    await expect(dlg2.getByLabel('Gemini API Key')).toHaveValue('AIza-test-key');
  });

  test('Close düğmesi ayarları kapatır', async ({ page }) => {
    await openApp(page);
    const dlg = await open(page);
    await dlg.getByRole('button', { name: 'Close' }).first().click();
    await expect(dlg).toBeHidden();
  });
});
