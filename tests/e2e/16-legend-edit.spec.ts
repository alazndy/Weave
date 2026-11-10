import { test, expect } from '@playwright/test';
import { openApp, trackErrors, undoBtn } from './helpers';

test.describe.configure({ timeout: 90000 });

test.describe('Lejant: tıklayarak düzenleme ve yer değiştirme', () => {
  test('başlık tıklanınca düzenlenir; boşaltınca varsayılana döner; geri alınır', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    const lbl = page.getByTestId('lbl-drawingName');
    await lbl.click();
    await page.getByLabel('Başlık: Drawing Name:').fill('Çizim Adı:');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('lbl-drawingName')).toHaveText('Çizim Adı:');
    await undoBtn(page).click();
    await expect(page.getByTestId('lbl-drawingName')).toHaveText('Drawing Name:');
    // boşaltma = varsayılan
    await page.getByTestId('lbl-scale').click();
    await page.getByLabel('Başlık: Scale').fill('Ölçek');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('lbl-scale')).toHaveText('Ölçek');
    await page.getByTestId('lbl-scale').click();
    await page.getByLabel('Başlık: Scale').fill('');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('lbl-scale')).toHaveText('Scale');
    errors.expectNone();
  });

  test('değerler (proje adı, not, sayfa adı) tıklayarak düzenlenir; Escape iptal eder', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('legend-project').getByTitle('Düzenlemek için tıkla').nth(1).click();
    await page.getByLabel('Proje adı').fill('Çanakkale AI');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('legend-project')).toContainText('Çanakkale AI');
    await page.getByTestId('legend-page-name').getByTitle('Düzenlemek için tıkla').nth(1).click();
    await page.getByLabel('Sayfa adı').fill('Sistem Şeması');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('legend-page-name')).toContainText('Sistem Şeması');
    await expect(page.getByRole('button', { name: /Sistem Şeması/ }).or(page.getByText('Sistem Şeması').first())).toBeVisible();
    await page.getByTestId('legend-notes').getByTitle('Düzenlemek için tıkla').nth(1).dispatchEvent('click');
    await page.getByLabel('Teknik notlar').fill('Not A');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('legend-notes')).not.toContainText('Not A');
  });

  test('bölümler ok düğmeleriyle yer değiştirir; sıra kalıcı', async ({ page }) => {
    await openApp(page);
    const order = async () => page.evaluate(() => [...document.querySelectorAll('#legend-export-area > div:first-of-type > div')].map(d => d.getAttribute('data-testid') || 'drawing'));
    expect(await order()).toEqual(['legend-revisions', 'drawing', 'legend-project']);
    await page.getByTestId('legend-project').hover();
    await page.getByRole('button', { name: 'project bölümünü sola taşı' }).click();
    await expect.poll(order).toEqual(['legend-revisions', 'legend-project', 'drawing']);
    await page.getByTestId('legend-extra').locator('[data-testid^="mover-"]').first().evaluate(() => {});
    await page.getByTestId('legend-extra').getByText('Firma').hover();
    await page.getByRole('button', { name: 'company bölümünü sola taşı' }).click();
    await expect(page.getByTestId('legend-extra').locator('> div').nth(0)).toContainText('Firma');
  });

  test('PNG/PDF çıktısında düzenleme araçları görünmez (no-print)', async ({ page }) => {
    await openApp(page);
    const n = await page.locator('[data-testid^="mover-"]:not(.no-print)').count();
    expect(n).toBe(0);
  });
});
