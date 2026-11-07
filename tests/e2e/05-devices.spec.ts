import { test, expect, type Page } from '@playwright/test';
import {
  openApp, trackErrors, autoDialogs, nodes, undoBtn, placePair, dropTemplate, CAMERA, tool, portOf,
  flushAutosave,
} from './helpers';

const center = async (loc: ReturnType<Page['locator']>) => {
  const b = (await loc.boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2, b };
};
const moveBy = async (page: Page, node: ReturnType<Page['locator']>, dx: number, dy: number) => {
  const c = await center(node);
  await page.mouse.move(c.x, c.y);
  await page.mouse.down();
  await page.mouse.move(c.x + dx / 2, c.y + dy / 2, { steps: 3 });
  await page.mouse.move(c.x + dx, c.y + dy, { steps: 3 });
  await page.mouse.up();
};
const rightTab = (page: Page, name: string) => page.getByRole('tab', { name, exact: true });

test.describe('Cihazlar', () => {
  test('tıklama cihazı seçer, Properties paneli seçili cihazı gösterir', async ({ page }) => {
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 450, 300);
    await expect(page.getByText('No Selection')).toBeVisible();
    await nodes(page).first().click();
    await expect(page.getByText('No Selection')).toBeHidden();
    await expect(page.getByText(CAMERA.name).last()).toBeVisible();
  });

  test('boş alana tıklamak seçimi kaldırır', async ({ page }) => {
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 450, 300);
    await nodes(page).first().click();
    await page.mouse.click(600, 550);
    await expect(page.getByText('No Selection')).toBeVisible();
  });

  test('Shift ile çoklu seçim yapılır', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    await camera.click();
    await monitor.click({ modifiers: ['Shift'] });
    await expect(page.getByRole('button', { name: 'Grupla', exact: true })).toBeEnabled();
  });

  test('ok tuşları 1px, Shift+ok 10px taşır; geri alınır', async ({ page }) => {
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 450, 300);
    const node = nodes(page).first();
    await node.click();
    const x0 = (await node.boundingBox())!.x;
    await page.keyboard.press('Shift+ArrowRight');
    const x1 = (await node.boundingBox())!.x;
    expect(x1).toBeGreaterThan(x0 + 3);
    await page.keyboard.press('ArrowRight');
    const x2 = (await node.boundingBox())!.x;
    expect(x2).toBeGreaterThan(x1);
    expect(x2 - x1).toBeLessThan(x1 - x0);
    await undoBtn(page).click();
    await undoBtn(page).click();
    expect(Math.abs((await node.boundingBox())!.x - x0)).toBeLessThan(1);
  });

  test('Delete tuşu siler ve tek geri al ile geri gelir', async ({ page }) => {
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 450, 300);
    await nodes(page).first().click();
    await page.keyboard.press('Delete');
    await expect(nodes(page)).toHaveCount(0);
    await undoBtn(page).click();
    await expect(nodes(page)).toHaveCount(1);
  });

  test('Ctrl+C / Ctrl+V cihazı kopyalar', async ({ page }) => {
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 450, 300);
    await nodes(page).first().click();
    await page.keyboard.press('Control+c');
    await page.keyboard.press('Control+v');
    await expect(nodes(page)).toHaveCount(2);
    await page.keyboard.press('Control+v');
    await expect(nodes(page)).toHaveCount(3);
  });

  test('Properties: kopyala ve çoğalt düğmeleri çalışır', async ({ page }) => {
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 450, 300);
    await nodes(page).first().click();
    await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
    await expect(nodes(page)).toHaveCount(2);
  });

  test('Properties: seçimi temizle ve çoklu seçimde Delete Selected çalışır', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    await camera.click();
    await page.getByRole('button', { name: 'Seçimi temizle' }).click();
    await expect(page.getByText('No Selection')).toBeVisible();

    await camera.click();
    await monitor.click({ modifiers: ['Shift'] });
    await expect(page.getByText('2 Items Selected')).toBeVisible();
    await page.getByRole('button', { name: 'Delete Selected' }).click();
    await expect(nodes(page)).toHaveCount(0);
    await undoBtn(page).click();
    await expect(nodes(page)).toHaveCount(2);
  });

  test('sağ tık menüsü: döndür, aynala, düzenle, sil', async ({ page }) => {
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 450, 300);
    const node = nodes(page).first();

    await node.click({ button: 'right' });
    await page.getByRole('button', { name: 'Döndür (+90°)' }).click();
    await expect(node.locator('xpath=.//div[contains(@style,"rotate(90deg)")]').first()).toBeAttached();

    await node.click({ button: 'right' });
    await page.getByRole('button', { name: 'Aynala', exact: true }).click();

    await node.click({ button: 'right' });
    await page.getByRole('button', { name: 'Ürünü Düzenle' }).click();
    await expect(page.getByText('Ürün Düzenle')).toBeVisible();
    await page.getByRole('button', { name: 'Kapat' }).click();

    await node.click({ button: 'right' });
    await page.locator('button.text-red-400', { hasText: 'Sil' }).click();
    await expect(nodes(page)).toHaveCount(0);
    await undoBtn(page).click();
    await expect(nodes(page)).toHaveCount(1);
  });

  test('sağ tık menüsü: Kopyala panoya alır, Ctrl+V yapıştırır', async ({ page }) => {
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 450, 300);
    await nodes(page).first().click({ button: 'right' });
    await page.getByRole('button', { name: 'Kopyala', exact: true }).click();
    await page.keyboard.press('Control+v');
    await expect(nodes(page)).toHaveCount(2);
  });

  test('ölçekle aracı: tutamaçla boyut büyür', async ({ page }) => {
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 450, 300);
    await tool(page, /Ölçekle/).click();
    const node = nodes(page).first();
    const before = (await node.boundingBox())!;
    const handle = node.locator('div.cursor-nwse-resize');
    const h = await center(handle);
    await page.mouse.move(h.x, h.y);
    await page.mouse.down();
    await page.mouse.move(h.x + 40, h.y + 30, { steps: 4 });
    await page.mouse.move(h.x + 90, h.y + 60, { steps: 4 });
    await page.mouse.up();
    const after = (await node.boundingBox())!;
    expect(after.width).toBeGreaterThan(before.width + 20);
  });

  test('Ctrl+G grupla, Ctrl+Shift+G grubu boz; grup birlikte taşınır', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    await camera.click();
    await monitor.click({ modifiers: ['Shift'] });
    await page.keyboard.press('Control+g');
    const m0 = (await monitor.boundingBox())!;
    await moveBy(page, camera, 0, 60);
    const m1 = (await monitor.boundingBox())!;
    expect(m1.y).toBeGreaterThan(m0.y + 20);
    await page.keyboard.press('Control+Shift+g');
    await expect(nodes(page)).toHaveCount(2);
  });

  test('bloğu kaydet seçimi şablon olarak kütüphaneye ekler', async ({ page }) => {
    autoDialogs(page, 'Kamera Seti');
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    await camera.click();
    await monitor.click({ modifiers: ['Shift'] });
    await page.getByRole('button', { name: 'Bloğu Kaydet', exact: true }).click();
    await expect(page.getByTitle('Kamera Seti')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('No saved blocks')).toBeHidden();
  });

  test('sağ panel katmanlar: gizle tuvalden kaldırır, kilitle sürüklemeyi engeller', async ({ page }) => {
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 450, 300);
    await rightTab(page, 'Layers').click();
    const row = page.locator('div.cursor-pointer', { hasText: CAMERA.name });
    const [hide, lock] = [row.locator('button').nth(0), row.locator('button').nth(1)];

    await lock.click();
    const node = nodes(page).first();
    const before = (await node.boundingBox())!;
    await moveBy(page, node, 100, 60);
    const after = (await node.boundingBox())!;
    expect(Math.abs(after.x - before.x)).toBeLessThan(2);
    await lock.click();
    await moveBy(page, node, 100, 60);
    expect((await node.boundingBox())!.x).toBeGreaterThan(before.x + 50);

    await hide.click();
    await expect(nodes(page)).toHaveCount(0);
    await hide.click();
    await expect(nodes(page)).toHaveCount(1);
  });

  test('sağ panel daraltılır ve ayarlar düğmesiyle yeniden açılır', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    const props = page.getByRole('tab', { name: 'Properties', exact: true });
    await expect(props).toBeInViewport();
    await page.locator('button:has(svg.lucide-chevron-right)').first().click();
    await expect(props).not.toBeInViewport();
    await page.locator('button:has(svg.lucide-settings-2)').last().click();
    await expect(props).toBeInViewport();
    errors.expectNone();
  });

  test('cihaz sayfa yenilenince otomatik kayıttan geri gelir ve bağlantılar korunur', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    await portOf(camera, 'cam-out').click();
    await portOf(monitor, 'mon-in').click();
    await expect(page.locator('[data-connection-id]')).toHaveCount(1);
    await flushAutosave(page);
    await page.reload();
    await page.getByRole('button', { name: /Yeni Sistem Şeması/ }).click();
    await expect(nodes(page)).toHaveCount(2);
    await expect(page.locator('[data-connection-id]')).toHaveCount(1);
  });
});
