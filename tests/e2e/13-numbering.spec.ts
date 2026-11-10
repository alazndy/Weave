import { test, expect } from '@playwright/test';
import { openApp, trackErrors, nodes, placePair, leftTab, undoBtn, redoBtn } from './helpers';

const badge = (node: import('@playwright/test').Locator) => node.getByTestId('number-badge');

test.describe('Bileşen numaralandırma', () => {
  test('varsayılan sıra numarası; rozete çift tıklayıp numara değiştirilir, geri alınır', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    await expect(badge(camera)).toHaveText('1');
    await expect(badge(monitor)).toHaveText('2');

    await badge(camera).dblclick();
    const input = camera.getByLabel('Bileşen numarası');
    await expect(input).toBeFocused();
    await input.fill('A7');
    await input.press('Enter');
    await expect(badge(camera)).toHaveText('A7');
    await expect(badge(monitor)).toHaveText('2');
    await expect(page.getByTestId('bom-refs').first()).toContainText('A7');

    await undoBtn(page).click();
    await expect(badge(camera)).toHaveText('1');
    await redoBtn(page).click();
    await expect(badge(camera)).toHaveText('A7');
    errors.expectNone();
  });

  test('Escape iptal eder; boş bırakmak otomatik numaraya döndürür', async ({ page }) => {
    await openApp(page);
    const { camera } = await placePair(page);
    await badge(camera).dblclick();
    await camera.getByLabel('Bileşen numarası').fill('99');
    await camera.getByLabel('Bileşen numarası').press('Escape');
    await expect(badge(camera)).toHaveText('1');

    await badge(camera).dblclick();
    await camera.getByLabel('Bileşen numarası').fill('Z');
    await camera.getByLabel('Bileşen numarası').press('Enter');
    await expect(badge(camera)).toHaveText('Z');
    await badge(camera).dblclick();
    await camera.getByLabel('Bileşen numarası').fill('');
    await camera.getByLabel('Bileşen numarası').press('Enter');
    await expect(badge(camera)).toHaveText('1');
  });

  test('aynı numara iki bileşende ise rozet kırmızı uyarı gösterir', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    await badge(monitor).dblclick();
    await monitor.getByLabel('Bileşen numarası').fill('1');
    await monitor.getByLabel('Bileşen numarası').press('Enter');
    await expect(badge(camera)).toHaveClass(/bg-red-400/);
    await expect(badge(monitor)).toHaveClass(/bg-red-400/);
  });

  test('sağ paneldeki Bileşen Numarası alanı rozeti günceller', async ({ page }) => {
    await openApp(page);
    const { camera } = await placePair(page);
    await camera.click({ position: { x: 40, y: 40 } });
    const field = page.getByLabel('Bileşen Numarası');
    await expect(field).toBeVisible();
    await field.fill('K-3');
    await field.press('Enter');
    await expect(badge(camera)).toHaveText('K-3');
  });

  test('Konuma göre numarala ve Otomatiğe sıfırla', async ({ page }) => {
    await openApp(page);
    const { camera, monitor } = await placePair(page);
    // monitörü kameranın soluna taşı → konuma göre sırada ilk o gelir
    const m = (await monitor.boundingBox())!, c = (await camera.boundingBox())!;
    await page.mouse.move(m.x + 40, m.y + 40); await page.mouse.down();
    await page.mouse.move(c.x - 140, c.y + 40, { steps: 8 }); await page.mouse.up();
    await leftTab(page, 'Project');
    await page.getByRole('button', { name: 'Konuma göre numarala' }).click();
    await expect(badge(monitor)).toHaveText('1');
    await expect(badge(camera)).toHaveText('2');
    await page.getByRole('button', { name: 'Otomatiğe sıfırla' }).click();
    await expect(badge(camera)).toHaveText('1');
    await expect(badge(monitor)).toHaveText('2');
    await undoBtn(page).click();
    await expect(badge(monitor)).toHaveText('1');
    await expect(nodes(page)).toHaveCount(2);
  });
});
