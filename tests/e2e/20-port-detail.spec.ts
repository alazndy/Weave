import { test, expect, type Page } from '@playwright/test';
import { openApp, trackErrors, nodes, placePair, portOf, undoBtn, canvas, autoDialogs, leftTab } from './helpers';

// 40x30 grey PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACgAAAAeCAIAAADRv8uKAAAAKElEQVR4nO3NMQEAAAwCIPsnM5YxtgMKkB6JWCwWi8VisVgsFov/xgPORv0XHYdCmQAAAABJRU5ErkJggg==', 'base64');

const cards = (page: Page) => page.locator('[data-portcard-id]');
const dialog = (page: Page) => page.getByTestId('port-detail-dialog');
const showButton = (page: Page) => page.getByRole('button', { name: 'Detayı sayfada göster' });
const view = (page: Page) => page.locator('#canvas-export-area').evaluate(el => getComputedStyle(el).transform);
const box = async (page: Page) => (await cards(page).first().boundingBox())!;

const openPort = async (page: Page) => { await portOf(nodes(page).first(), 'cam-out').dblclick(); await expect(page.getByText('Port Düzenle')).toBeVisible(); };

async function fillDetail(page: Page) {
  await page.getByRole('button', { name: /Port detayı/ }).click();
  await dialog(page).locator('input[type=file]').setInputFiles({ name: 'p.png', mimeType: 'image/png', buffer: PNG });
  await expect(dialog(page).getByRole('img', { name: 'Konnektör görseli' })).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Satır ekle' }).click();
  await dialog(page).getByLabel('Pin numarası 1').fill('1');
  await dialog(page).getByLabel('Kablo rengi 1').fill('Kırmızı');
  await dialog(page).getByLabel('Görevi 1').fill('+12V');
  await dialog(page).getByRole('button', { name: 'Tamam' }).click();
}

async function addCard(page: Page) {
  await openPort(page);
  await fillDetail(page);
  await showButton(page).click();
  await expect(cards(page)).toHaveCount(1);
}

async function drag(page: Page, x: number, y: number, dx: number, dy: number) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 });
  await page.mouse.up();
}

test.describe('Port detay kartı', () => {
  test('detay girilmeden kart eklenemez; girilen bilgi saklanır', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    await placePair(page);
    await openPort(page);
    await expect(showButton(page)).toBeDisabled();
    await fillDetail(page);
    await expect(showButton(page)).toBeEnabled();
    await page.getByRole('button', { name: 'Kaydet', exact: true }).last().click();
    await openPort(page);
    await page.getByRole('button', { name: /Port detayı/ }).click();
    await expect(dialog(page).getByLabel('Görevi 1')).toHaveValue('+12V');
    errors.expectNone();
  });

  test('kart bir kez eklenir, çıktı alanında ve kâğıdın içindedir, çizgiyle porta bağlıdır', async ({ page }) => {
    await openApp(page);
    await placePair(page);
    await addCard(page);
    await expect(cards(page).first()).toContainText('+12V');
    await expect(cards(page).first()).toContainText('Kırmızı');
    await expect(cards(page).first()).toContainText('Test Kamera');
    await expect(page.locator('#canvas-export-area [data-portcard-id]')).toHaveCount(1);
    await expect(page.getByTestId('port-card-leader')).toHaveCount(1);
    const paper = (await page.locator('[data-paper]').boundingBox())!;
    const c = await box(page);
    expect(c.x).toBeGreaterThanOrEqual(paper.x - 1);
    expect(c.x + c.width).toBeLessThanOrEqual(paper.x + paper.width + 1);
    await openPort(page);
    await showButton(page).click();
    await expect(cards(page)).toHaveCount(1);
  });

  test('kart sürüklenir (görünüm kaymaz), geri alınır, boyutlanır ve kaldırılır', async ({ page }) => {
    await openApp(page);
    await placePair(page);
    await addCard(page);
    const before = await box(page), viewBefore = await view(page);
    await drag(page, before.x + 20, before.y + 10, 60, 80);
    await expect.poll(async () => Math.abs((await box(page)).y - before.y - 80)).toBeLessThan(3);
    expect(await view(page)).toBe(viewBefore);
    await expect(page.getByTestId('group-bounds')).toHaveCount(0);
    await undoBtn(page).click();
    await expect.poll(async () => (await box(page)).y).toBeCloseTo(before.y, 0);

    await cards(page).first().hover();
    const h = (await page.getByTestId('port-card-resize').boundingBox())!;
    await drag(page, h.x + h.width / 2, h.y + h.height / 2, 90, 90);
    await expect.poll(async () => (await box(page)).width).toBeGreaterThan(before.width + 40);

    await cards(page).first().hover();
    await page.getByRole('button', { name: 'Kartı kaldır' }).click();
    await expect(cards(page)).toHaveCount(0);
    await undoBtn(page).click();
    await expect(cards(page)).toHaveCount(1);
  });

  test('sayfa çoğaltılınca kart kopyalanır; parça silinince kart da gider', async ({ page }) => {
    autoDialogs(page);
    await openApp(page);
    await placePair(page);
    await addCard(page);
    await page.getByTitle('Sayfayı Çoğalt').first().click();
    await expect(page.getByTestId('page-tab')).toHaveCount(2);
    await expect(cards(page)).toHaveCount(1);
    await nodes(page).first().locator(':scope > div').first().click({ position: { x: 60, y: 20 } });
    await page.keyboard.press('Delete');
    await expect(nodes(page)).toHaveCount(1);
    await expect(cards(page)).toHaveCount(0);
  });

  test('kart ve pin bilgisi .weave dosyasıyla geri gelir', async ({ page }) => {
    autoDialogs(page);
    await openApp(page);
    await placePair(page);
    await addCard(page);
    await leftTab(page, 'Proje');
    const download = page.waitForEvent('download');
    await page.getByRole('tabpanel').getByRole('button', { name: 'Kaydet', exact: true }).click();
    const stream = await (await download).createReadStream();
    const chunks: Buffer[] = [];
    for await (const c of stream) chunks.push(c as Buffer);
    await cards(page).first().hover();
    await page.getByRole('button', { name: 'Kartı kaldır' }).click();
    await page.locator('input[type=file][accept=".weave,.json"]').setInputFiles({ name: 's.weave', mimeType: 'application/json', buffer: Buffer.concat(chunks) });
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page).first()).toContainText('+12V');
    await expect(canvas(page)).toBeVisible();
  });
});
