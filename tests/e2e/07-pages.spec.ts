import { test, expect } from '@playwright/test';
import { openApp, trackErrors, autoDialogs, nodes, dropTemplate, CAMERA, MONITOR, undoBtn } from './helpers';

const tabs = (page: import('@playwright/test').Page) => page.locator('div.group.relative.flex.items-center.h-10');

test.describe('Sayfalar', () => {
  test('varsayılan olarak tek sayfa vardır', async ({ page }) => {
    await openApp(page);
    await expect(tabs(page)).toHaveCount(1);
    await expect(tabs(page).first()).toContainText('Sayfa 1');
    await expect(page.getByTitle('Sayfayı Sil')).toHaveCount(0); // son sayfa silinemez
  });

  test('yeni sayfa eklenir ve etkinleşir; cihazlar sayfaya özeldir', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 450, 300);
    await expect(nodes(page)).toHaveCount(1);

    await page.getByTitle('Yeni Sayfa Ekle').click();
    await expect(tabs(page)).toHaveCount(2);
    await expect(nodes(page)).toHaveCount(0);
    await dropTemplate(page, MONITOR.id, 450, 300);
    await expect(nodes(page)).toHaveCount(1);

    await tabs(page).first().click();
    await expect(nodes(page)).toHaveCount(1);
    await expect(nodes(page).first()).toContainText(CAMERA.name);
    errors.expectNone();
  });

  test('sayfa çoğaltılır (içerik kopyalanır)', async ({ page }) => {
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 450, 300);
    await tabs(page).first().getByTitle('Sayfayı Çoğalt').click();
    await expect(tabs(page)).toHaveCount(2);
    await expect(tabs(page).nth(1)).toContainText('(Kopya)');
    await expect(nodes(page)).toHaveCount(1);
  });

  test('sayfa çift tıklayınca yeniden adlandırılır (Enter ile)', async ({ page }) => {
    await openApp(page);
    await tabs(page).first().dblclick();
    const input = page.getByLabel('Sayfa adı');
    await input.fill('Güç Dağıtımı');
    await input.press('Enter');
    await expect(tabs(page).first()).toContainText('Güç Dağıtımı');
  });

  test('sayfa silinir (onayla), silme geri alınır', async ({ page }) => {
    autoDialogs(page);
    await openApp(page);
    await page.getByTitle('Yeni Sayfa Ekle').click();
    await expect(tabs(page)).toHaveCount(2);
    await tabs(page).nth(1).getByTitle('Sayfayı Sil').click();
    await expect(tabs(page)).toHaveCount(1);
    await undoBtn(page).click();
    await expect(tabs(page)).toHaveCount(2);
  });

  test('silme onayı reddedilirse sayfa kalır', async ({ page }) => {
    page.on('dialog', d => d.dismiss());
    await openApp(page);
    await page.getByTitle('Yeni Sayfa Ekle').click();
    await tabs(page).nth(1).getByTitle('Sayfayı Sil').click();
    await expect(tabs(page)).toHaveCount(2);
  });

  test('sayfa ızgarası görünümü açılır, sayfa seçilince kapanır', async ({ page }) => {
    await openApp(page);
    await page.getByTitle('Yeni Sayfa Ekle').click();
    await page.getByTitle('Sayfa Izgarası').click();
    await expect(page.getByTestId('canvas-viewport')).toBeHidden();
    await page.getByTitle('Sayfa Izgarası').click();
    await expect(page.getByTestId('canvas-viewport')).toBeVisible();
  });

  test('sayfa ızgarasından sayfa çoğaltılır ve silinir', async ({ page }) => {
    autoDialogs(page);
    await openApp(page);
    await page.getByTitle('Sayfa Izgarası').click();
    await page.getByTitle('Sayfayı Çoğalt').last().click();
    await expect(tabs(page)).toHaveCount(2);
    await page.getByTitle('Sayfayı Sil').last().click();
    await expect(tabs(page)).toHaveCount(1);
  });

  test('sayfa çubuğu daraltılır ve yeniden açılır', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Sayfa çubuğunu daralt' }).click();
    await expect(tabs(page)).toHaveCount(0);
    await page.locator('button:has(svg.lucide-chevron-up), button:has(svg.lucide-layers)').last().click();
    await expect(tabs(page)).toHaveCount(1);
  });

  test('antet sayfa numarasını gösterir', async ({ page }) => {
    await openApp(page);
    await page.getByTitle('Yeni Sayfa Ekle').click();
    await expect(page.locator('#legend-export-area')).toContainText(/2\s*\/\s*2|2 of 2|Sayfa\s*2/);
  });
});
