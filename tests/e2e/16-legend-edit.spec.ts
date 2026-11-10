import { test, expect } from '@playwright/test';
import { openApp, trackErrors, undoBtn } from './helpers';

test.describe.configure({ timeout: 90000 });

test.describe('Lejant: tıklayarak düzenleme ve yer değiştirme', () => {
  test('başlık tıklanınca düzenlenir; boşaltınca varsayılana döner; geri alınır', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    const lbl = page.getByTestId('lbl-drawingName');
    await lbl.click();
    await page.getByLabel('Başlık: Drawing Name:', { exact: true }).fill('Çizim Adı:');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('lbl-drawingName')).toHaveText('Çizim Adı:');
    await undoBtn(page).click();
    await expect(page.getByTestId('lbl-drawingName')).toHaveText('Drawing Name:');
    // boşaltma = varsayılan
    await page.getByTestId('lbl-scale').click();
    await page.getByLabel('Başlık: Scale', { exact: true }).fill('Ölçek');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('lbl-scale')).toHaveText('Ölçek');
    await page.getByTestId('lbl-scale').click();
    await page.getByLabel('Başlık: Scale', { exact: true }).fill('');
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
    const order = async () => page.evaluate(() => [...document.querySelectorAll('#legend-export-area > div:first-of-type > div')].filter(d => !(d.getAttribute('data-testid') || '').startsWith('resize')).map(d => d.getAttribute('data-testid') || 'drawing'));
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

  test('başlık silinir, geri getirilir; geri al çalışır', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('lbl-scale').click();
    await page.getByRole('button', { name: /başlığını sil/ }).click();
    await expect(page.getByTestId('lbl-scale')).toHaveCount(0);
    await expect(page.getByTestId('lbl-sheet')).toHaveCount(1);
    await page.getByTestId('title-block').hover();
    await page.getByRole('button', { name: 'Silinen başlıkları geri getir' }).click();
    await expect(page.getByTestId('lbl-scale')).toHaveText('Scale');
    await undoBtn(page).click();
    await expect(page.getByTestId('lbl-scale')).toHaveCount(0);
  });

  test('hücre genişliği ve satır yüksekliği sürüklenerek ayarlanır; çift tık sıfırlar; tek geri alma', async ({ page }) => {
    await openApp(page);
    const proj = page.getByTestId('legend-project');
    const w0 = (await proj.boundingBox())!.width;
    await proj.hover();
    const h = page.getByTestId('resize-project');
    const hb = (await h.boundingBox())!;
    await page.mouse.move(hb.x + 3, hb.y + hb.height / 2);
    await page.mouse.down();
    await page.mouse.move(hb.x - 77, hb.y + hb.height / 2, { steps: 6 });
    await page.mouse.up();
    const w1 = (await proj.boundingBox())!.width;
    expect(w1).toBeLessThan(w0 - 40);
    await undoBtn(page).click();                                   // tek adımda geri
    expect(Math.abs((await proj.boundingBox())!.width - w0)).toBeLessThan(2);

    const strip = page.getByTestId('legend-main-strip');
    const oh = () => strip.evaluate(e => (e as HTMLElement).offsetHeight);
    const eh0 = await oh();
    await strip.hover();
    const hh = (await page.getByTestId('resize-mainH').boundingBox())!;
    await page.mouse.move(hh.x + 700, hh.y + 3);
    await page.mouse.down();
    await page.mouse.move(hh.x + 700, hh.y + 43, { steps: 6 });
    await page.mouse.up();
    expect(await oh()).toBeGreaterThan(eh0 + 20);
    await strip.hover();
    await page.getByTestId('resize-mainH').dispatchEvent('dblclick');
    await expect.poll(async () => Math.abs((await oh()) - eh0)).toBeLessThan(2);
  });
});
