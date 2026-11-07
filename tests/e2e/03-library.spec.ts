import { test, expect } from '@playwright/test';
import {
  openApp, trackErrors, autoDialogs, nodes, CAMERA, MONITOR, dropTemplate, leftTab,
} from './helpers';

const card = (page: import('@playwright/test').Page, name: string) => page.getByTitle(name);

test.describe('Sol panel – Kütüphane', () => {
  test('şablon kartları listelenir ve sayaç doğru', async ({ page }) => {
    await openApp(page);
    await expect(card(page, CAMERA.name)).toBeVisible();
    await expect(card(page, MONITOR.name)).toBeVisible();
    await expect(page.getByText('Bileşenler').locator('..').getByText('2')).toBeVisible();
  });

  test('kart tıklaması tuvale cihaz ekler', async ({ page }) => {
    await openApp(page);
    await card(page, CAMERA.name).click();
    await expect(nodes(page)).toHaveCount(1);
  });

  test('kartı tuvale sürükleyip bırakmak cihaz ekler', async ({ page }) => {
    await openApp(page);
    await dropTemplate(page, MONITOR.id, 500, 300);
    await expect(nodes(page)).toHaveCount(1);
    await expect(nodes(page).first()).toContainText(MONITOR.name);
  });

  test('yeni kütüphane oluşturulur ve seçilir', async ({ page }) => {
    autoDialogs(page, 'İkinci Kütüphane');
    await openApp(page);
    await page.getByRole('button', { name: 'Yeni kütüphane' }).click();
    await expect(page.getByRole('combobox')).toContainText('İkinci Kütüphane');
    await expect(page.getByText('No components found')).toBeVisible();
  });

  test('kütüphaneler arasında geçiş yapılır', async ({ page }) => {
    autoDialogs(page, 'Boş Kütüphane');
    await openApp(page);
    await page.getByRole('button', { name: 'Yeni kütüphane' }).click();
    await expect(page.getByText('No components found')).toBeVisible();
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Test' }).click();
    await expect(card(page, CAMERA.name)).toBeVisible();
  });

  test('kütüphane yeniden adlandırılır', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Kütüphaneyi yeniden adlandır' }).click();
    const input = page.getByRole('textbox').first();
    await input.fill('Yeni Ad');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('combobox')).toContainText('Yeni Ad');
  });

  test('kütüphane silinir; tek kütüphane kaldığında silme pasif', async ({ page }) => {
    autoDialogs(page, 'Silinecek');
    await openApp(page);
    const del = page.getByRole('button', { name: 'Kütüphaneyi sil' });
    await expect(del).toBeDisabled();
    await page.getByRole('button', { name: 'Yeni kütüphane' }).click();
    await expect(del).toBeEnabled();
    await del.click();
    await expect(page.getByRole('combobox')).toContainText('Test');
    await expect(del).toBeDisabled();
  });

  test('kart menüsü: düzenle ürün editörünü açar', async ({ page }) => {
    await openApp(page);
    await card(page, CAMERA.name).hover();
    await card(page, CAMERA.name).getByRole('button').click();
    await page.getByRole('menuitem', { name: 'Düzenle' }).click();
    await expect(page.getByText('Ürün Düzenle')).toBeVisible();
    await page.getByRole('button', { name: 'Kapat' }).click();
    await expect(page.getByText('Ürün Düzenle')).toBeHidden();
  });

  test('kart menüsü: tekli export JSON indirir', async ({ page }) => {
    await openApp(page);
    await card(page, CAMERA.name).hover();
    await card(page, CAMERA.name).getByRole('button').click();
    const download = page.waitForEvent('download');
    await page.getByRole('menuitem', { name: 'Tekli Export' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('Test_Kamera.json');
    const body = JSON.parse(Buffer.concat(await (await file.createReadStream()).toArray()).toString());
    expect(body.id).toBe(CAMERA.id);
  });

  test('kart menüsü: sil onayla şablonu ve cihazlarını kaldırır', async ({ page }) => {
    autoDialogs(page);
    await openApp(page);
    await card(page, CAMERA.name).click();
    await expect(nodes(page)).toHaveCount(1);
    await card(page, CAMERA.name).hover();
    await card(page, CAMERA.name).getByRole('button').click();
    await page.getByRole('menuitem', { name: 'Sil' }).click();
    await expect(card(page, CAMERA.name)).toBeHidden();
    await expect(nodes(page)).toHaveCount(0);
  });

  test('kütüphaneyi indir JSON dosyası verir', async ({ page }) => {
    await openApp(page);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Kütüphaneyi indir' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/^weave_library_\d{4}-\d{2}-\d{2}\.json$/);
    const body = JSON.parse(Buffer.concat(await (await file.createReadStream()).toArray()).toString());
    expect(body.map((t: { id: string }) => t.id)).toEqual([CAMERA.id, MONITOR.id]);
  });

  test('kütüphane içe aktar: birleştir ve tek şablon dosyası kabul edilir', async ({ page }) => {
    autoDialogs(page);
    await openApp(page, [CAMERA]);
    await expect(card(page, MONITOR.name)).toBeHidden();
    await page.locator('input[type=file][accept=".json"]').setInputFiles({
      name: 'single.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(MONITOR)),
    });
    await expect(card(page, MONITOR.name)).toBeVisible();
    await expect(card(page, CAMERA.name)).toBeVisible();
  });

  test('geçersiz kütüphane dosyası uyarı verir', async ({ page }) => {
    const dialogs = autoDialogs(page);
    await openApp(page);
    await page.locator('input[type=file][accept=".json"]').setInputFiles({
      name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"x":1}'),
    });
    await expect.poll(() => dialogs.map(d => d.message)).toContain('Geçersiz dosya formatı.');
  });

  test('kütüphane sayfa yenilenince korunur', async ({ page }) => {
    autoDialogs(page, 'Kalıcı');
    await openApp(page);
    await page.getByRole('button', { name: 'Yeni kütüphane' }).click();
    await page.reload();
    await page.getByRole('button', { name: 'Yeni Proje' }).click();
    await page.getByRole('combobox').click();
    await expect(page.getByRole('option', { name: 'Kalıcı' })).toBeVisible();
  });

  test('yeni bileşen butonu ürün editörünü açar', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Yeni bileşen' }).click();
    await expect(page.getByText('Görsel Yükleme')).toBeVisible();
  });

  test('uygulama ayarları butonu ayarları açar', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: /App Settings/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('sol panel gizlenir', async ({ page }) => {
    await openApp(page);
    await expect(card(page, CAMERA.name)).toBeInViewport();
    await page.locator('button:has(svg.lucide-chevron-down.rotate-90)').first().click();
    await expect(card(page, CAMERA.name)).not.toBeInViewport();
  });

  test('proje sekmesi açılır', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    await leftTab(page, 'Project');
    await expect(page.getByText('Canvas Settings')).toBeVisible();
    await leftTab(page, 'Library');
    await expect(card(page, CAMERA.name)).toBeVisible();
    errors.expectNone();
  });
});
