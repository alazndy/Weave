import { test, expect } from '@playwright/test';
import {
  openApp, trackErrors, nodes, connections, undoBtn, redoBtn, placePair, wirePair, portOf, tool,
  dropTemplate, CAMERA, MONITOR,
} from './helpers';

test.describe('Bağlantılar', () => {
  test('çıkış portundan giriş portuna tıklayarak bağlantı kurulur', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    await wirePair(page, camera, monitor);
    errors.expectNone();
  });

  test('bağlantı geri alınır ve yinelenir', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    await wirePair(page, camera, monitor);
    await undoBtn(page).click();
    await expect(connections(page)).toHaveCount(0);
    await redoBtn(page).click();
    await expect(connections(page)).toHaveCount(1);
  });

  test('aynı porta tekrar tıklamak bağlantı başlangıcını iptal eder', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    await portOf(camera, 'cam-out').click();
    await portOf(camera, 'cam-out').click();
    await portOf(monitor, 'mon-in').click();
    await expect(connections(page)).toHaveCount(0);
  });

  test('manuel rota aracı ara nokta ekleyerek bağlantı çizer', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    await tool(page, /Manuel Rota/).click();
    await portOf(camera, 'cam-out').click();
    await page.mouse.click(600, 450);
    await page.mouse.click(650, 450);
    await portOf(monitor, 'mon-in').click();
    await expect(connections(page)).toHaveCount(1);
  });

  test('manuel rota: sağ tık yarım kalan çizimi iptal eder', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    await tool(page, /Manuel Rota/).click();
    await portOf(camera, 'cam-out').click();
    await page.mouse.click(600, 450, { button: 'right' });
    await portOf(monitor, 'mon-in').click();
    await expect(connections(page)).toHaveCount(0);
  });

  test('bağlantıya çift tıklayınca düzenleme modalı açılır ve değişiklikler kaydedilir', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    await wirePair(page, camera, monitor);
    await connections(page).first().locator('path').first().dblclick({ force: true });
    const modal = page.locator('div.fixed', { hasText: 'Bağlantı Düzenle' });
    await expect(modal).toBeVisible();
    await modal.getByPlaceholder(/W-101/).fill('W-201');
    await modal.getByRole('button', { name: /Düz|Straight/i }).first().click();
    await modal.getByRole('button', { name: 'Kaydet' }).click();
    await expect(modal).toBeHidden();
    await expect(connections(page).first()).toContainText('W-201');
    await undoBtn(page).click();
    await expect(connections(page).first()).not.toContainText('W-201');
  });

  test('bağlantı modalı iptal ile kapanır', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    await wirePair(page, camera, monitor);
    await connections(page).first().locator('path').first().dblclick({ force: true });
    const modal = page.locator('div.fixed', { hasText: 'Bağlantı Düzenle' });
    await modal.getByRole('button', { name: 'İptal' }).click();
    await expect(modal).toBeHidden();
  });

  test('cihaz silinince bağlantıları da silinir', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    await wirePair(page, camera, monitor);
    await monitor.click();
    await page.keyboard.press('Delete');
    await expect(nodes(page)).toHaveCount(1);
    await expect(connections(page)).toHaveCount(0);
    await undoBtn(page).click();
    await expect(connections(page)).toHaveCount(1);
  });

  test('bağlı cihaz taşınınca bağlantı izler (yol değişir)', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    await wirePair(page, camera, monitor);
    const d0 = await connections(page).first().locator('path').first().getAttribute('d');
    const b = (await monitor.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2 + 60, b.y + b.height / 2 + 90, { steps: 6 });
    await page.mouse.up();
    const d1 = await connections(page).first().locator('path').first().getAttribute('d');
    expect(d1).not.toBe(d0);
  });

  test('uyumsuz portlar bağlanamaz (giriş → giriş)', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    await portOf(camera, 'cam-pwr').click(); // input
    await portOf(monitor, 'mon-in').click(); // input
    await expect(page.getByRole('alert')).toContainText('Giriş portuna giriş bağlanamaz');
    await expect(connections(page)).toHaveCount(0);
    // geçerli hedefe tıklayınca bağlantı kurulabilir
    await portOf(camera, 'cam-out').click();
    await portOf(monitor, 'mon-in').click();
    await expect(connections(page)).toHaveCount(1);
  });

  test('pin haritası bağlı portları listeler', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    await wirePair(page, camera, monitor);
    await page.getByRole('button', { name: 'Pin Haritası' }).click();
    const modal = page.locator('div.fixed', { hasText: 'VIDEO' }).last();
    await expect(modal).toContainText(CAMERA.name);
    await expect(modal).toContainText(MONITOR.name);
    await expect(modal).toContainText('GİRİŞ');
  });

  test('port çift tıklaması port düzenleme modalını açar ve etiketi günceller', async ({ page }) => {
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 450, 300);
    await portOf(nodes(page).first(), 'cam-out').dblclick();
    const modal = page.locator('div.fixed', { hasText: 'Port Düzenle' });
    await expect(modal).toBeVisible();
    await modal.getByRole('textbox').first().fill('SİNYAL');
    await modal.getByRole('button', { name: 'Kaydet' }).click();
    await expect(modal).toBeHidden();
    await expect(nodes(page).first()).toContainText('SİNYAL');
    await undoBtn(page).click();
    await expect(nodes(page).first()).toContainText('VIDEO');
  });
});
