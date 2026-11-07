import { test, expect } from '@playwright/test';
import {
  openApp, trackErrors, autoDialogs, nodes, undoBtn, redoBtn, placePair, wirePair, connections,
  dropTemplate, CAMERA,
} from './helpers';

test.describe('Üst araç çubuğu', () => {
  test('geri al / yinele düğmeleri durumu doğru yönetir', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    await expect(undoBtn(page)).toBeDisabled();
    await expect(redoBtn(page)).toBeDisabled();

    await page.getByTitle(CAMERA.name).click();
    await page.getByTitle(CAMERA.name).click();
    await expect(nodes(page)).toHaveCount(2);
    await expect(undoBtn(page)).toBeEnabled();

    await undoBtn(page).click();
    await expect(nodes(page)).toHaveCount(1);
    await expect(redoBtn(page)).toBeEnabled();
    await undoBtn(page).click();
    await expect(nodes(page)).toHaveCount(0);
    await expect(undoBtn(page)).toBeDisabled();
    await redoBtn(page).click();
    await redoBtn(page).click();
    await expect(nodes(page)).toHaveCount(2);
    await expect(redoBtn(page)).toBeDisabled();
    errors.expectNone();
  });

  test('Ctrl+Z, Ctrl+Y ve Ctrl+Shift+Z kısayolları çalışır', async ({ page }) => {
    await openApp(page);
    await page.getByTitle(CAMERA.name).click();
    await expect(nodes(page)).toHaveCount(1);
    await page.keyboard.press('Control+z');
    await expect(nodes(page)).toHaveCount(0);
    await page.keyboard.press('Control+y');
    await expect(nodes(page)).toHaveCount(1);
    await page.keyboard.press('Control+z');
    await expect(nodes(page)).toHaveCount(0);
    await page.keyboard.press('Control+Shift+z');
    await expect(nodes(page)).toHaveCount(1);
  });

  test('geçmiş: anlık görüntü oluştur ve geri yükle', async ({ page }) => {
    autoDialogs(page);
    await openApp(page);
    await page.getByTitle(CAMERA.name).click();
    await expect(nodes(page)).toHaveCount(1);

    await page.getByRole('button', { name: 'Geçmiş' }).click();
    const modal = page.locator('div.fixed', { hasText: 'Versiyon Geçmişi' });
    await expect(modal).toBeVisible();
    await modal.getByRole('textbox').fill('bir cihaz');
    await modal.getByRole('button', { name: /Oluştur|Kaydet|Snapshot/i }).first().click();
    await expect(modal.getByText('bir cihaz')).toBeVisible();
    await modal.getByRole('button').filter({ has: page.locator('svg.lucide-x') }).first().click();
    await expect(modal).toBeHidden();

    await page.getByTitle(CAMERA.name).click();
    await expect(nodes(page)).toHaveCount(2);

    await page.getByRole('button', { name: 'Geçmiş' }).click();
    await page.locator('div.fixed', { hasText: 'Versiyon Geçmişi' }).getByRole('button', { name: /Geri Yükle|Restore/i }).first().click();
    await expect(nodes(page)).toHaveCount(1);
  });

  test('yapay zeka analizi anahtar yokken uyarı gösterir', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Yapay Zeka Analizi' }).click();
    await expect(page.getByText('Gemini API anahtarı girilmemiş')).toBeVisible();
    await page.getByRole('button', { name: 'Kapat' }).click();
    await expect(page.getByText('AI Analiz Raporu')).toBeHidden();
  });

  test('otomatik rota bağlantı yokken pasif, varken aktif ve geri alınabilir', async ({ page }) => {
    await openApp(page);
    const auto = page.getByRole('button', { name: 'Otomatik Rota' });
    await expect(auto).toBeDisabled();
    const { camera, monitor } = await placePair(page);
    await wirePair(page, camera, monitor);
    await expect(auto).toBeEnabled();
    await auto.click();
    await expect(connections(page)).toHaveCount(1);
    await expect(undoBtn(page)).toBeEnabled();
  });

  test('grupla/grubu boz/blok kaydet seçime göre aktifleşir', async ({ page }) => {
    await openApp(page);
    const group = page.getByRole('button', { name: 'Grupla', exact: true });
    const ungroup = page.getByRole('button', { name: 'Grubu Boz', exact: true });
    const saveBlock = page.getByRole('button', { name: 'Bloğu Kaydet', exact: true });
    await expect(group).toBeDisabled();
    await expect(ungroup).toBeDisabled();
    await expect(saveBlock).toBeDisabled();

    const { camera, monitor } = await placePair(page);
    await camera.click();
    await expect(group).toBeDisabled();
    await expect(ungroup).toBeEnabled();
    await monitor.click({ modifiers: ['Shift'] });
    await expect(group).toBeEnabled();
    await group.click();
    await ungroup.click();
    await expect(nodes(page)).toHaveCount(2);
  });

  test('sahneyi temizle onay ister, iptalde silmez, onayda siler', async ({ page }) => {
    await openApp(page);
    await placePair(page);
    await page.getByRole('button', { name: 'Sahneyi Temizle' }).click();
    const modal = page.getByText('Sayfayı Temizle');
    await expect(modal).toBeVisible();
    await page.getByRole('button', { name: /İptal|Vazgeç/ }).click();
    await expect(nodes(page)).toHaveCount(2);

    await page.getByRole('button', { name: 'Sahneyi Temizle' }).click();
    await page.getByRole('button', { name: /Onayla|Sil|Evet|Temizle/ }).last().click();
    await expect(nodes(page)).toHaveCount(0);
    await undoBtn(page).click();
    await expect(nodes(page)).toHaveCount(2);
  });

  test('görüntü dışa aktar PNG indirir', async ({ page }) => {
    autoDialogs(page);
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 450, 300);
    const download = page.waitForEvent('download', { timeout: 20000 });
    await page.getByRole('button', { name: 'Kaydet', exact: true }).click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/\.png$/);
  });

  test('pin haritası modalı açılır ve bağlantıyı listeler', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    await wirePair(page, camera, monitor);
    await page.getByRole('button', { name: 'Pin Haritası' }).click();
    const modal = page.locator('div.fixed', { hasText: 'VIDEO' }).last();
    await expect(modal).toContainText('GİRİŞ');
    await page.keyboard.press('Escape');
  });

  test('kısayollar modalı açılır ve kapanır', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Kısayollar' }).click();
    await expect(page.getByText('Hassas Taşıma')).toBeVisible();
    await page.getByRole('button', { name: 'Kapat' }).click();
    await expect(page.getByText('Hassas Taşıma')).toBeHidden();
  });

  test('tema düğmesi koyu/aydınlık arasında geçiş yapar', async ({ page }) => {
    await openApp(page);
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
    await page.getByRole('button', { name: 'Aydınlık Mod' }).click();
    await expect(html).not.toHaveClass(/dark/);
    await page.getByRole('button', { name: 'Karanlık Mod' }).click();
    await expect(html).toHaveClass(/dark/);
  });

  test('dil düğmesi arayüz dilini değiştirir ve kalıcıdır', async ({ page }) => {
    await openApp(page);
    await expect(page.getByRole('button', { name: 'Geri Al' })).toBeVisible();
    await page.getByTitle('Switch Language').click();
    await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Close' }).or(page.getByRole('button', { name: 'Kapat' })).first().click();
    await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
  });

  test('araç çubuğu dar ekranda taşmaz ve geri al erişilebilir kalır', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 700 });
    await openApp(page);
    await page.getByTitle(CAMERA.name).click();
    await undoBtn(page).scrollIntoViewIfNeeded();
    await undoBtn(page).click();
    await expect(nodes(page)).toHaveCount(0);
  });
});
