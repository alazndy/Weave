import { test, expect, type Locator, type Page } from '@playwright/test';
import { openApp, trackErrors, autoDialogs, connections, nodes, placePair, wirePair, portOf, undoBtn, dropTemplate, leftTab, freePoint, CAMERA } from './helpers';

const junctions = (page: Page) => page.locator('[data-junction-id]');

/** Screen point at `fraction` of the drawn line of a cable. */
const pointOn = (cable: Locator, fraction: number) => cable.locator('path').nth(2).evaluate((el: SVGPathElement, f) => {
  const p = el.getPointAtLength(el.getTotalLength() * f);
  const m = el.getScreenCTM()!;
  return { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f };
}, fraction);

const center = async (l: Locator) => { const b = (await l.boundingBox())!; return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };

/** Camera top left, monitor top right, one cable, plus a second camera below. */
async function setup(page: Page) {
  await openApp(page);
  const pair = await placePair(page, 260, 430, 760);
  await wirePair(page, pair.camera, pair.monitor);
  await dropTemplate(page, CAMERA.id, 640, 460); // right of the minimap
  await expect(nodes(page)).toHaveCount(3);
  await page.mouse.move(5, 5);
  return { ...pair, second: nodes(page).nth(2) };
}

async function addJunction(page: Page, fraction = 0.3) {
  const p = await pointOn(connections(page).first(), fraction);
  await page.mouse.click(p.x, p.y, { button: 'right' });
  await page.getByRole('button', { name: 'Birleşme noktası ekle' }).click();
  await expect(junctions(page)).toHaveCount(1);
  await expect(connections(page)).toHaveCount(2);
}

const tapJunction = async (page: Page) => { const c = await center(junctions(page).first()); await page.mouse.click(c.x, c.y); };

async function branchTo(page: Page, node: Locator) {
  await tapJunction(page);
  await portOf(node, 'cam-out').click();
  await expect(connections(page)).toHaveCount(3);
  await page.mouse.move(5, 5); // leave the new cable so its hover card closes
}

test.describe('Birleşme noktası', () => {
  test('kablo bölünür; noktadan yeni kol çekilir; her adım geri alınır', async ({ page }) => {
    const errors = trackErrors(page);
    const { second } = await setup(page);
    await addJunction(page);
    await branchTo(page, second);
    await undoBtn(page).click();
    await expect(connections(page)).toHaveCount(2);
    await undoBtn(page).click();
    await expect(connections(page)).toHaveCount(1);
    await expect(junctions(page)).toHaveCount(0);
    errors.expectNone();
  });

  for (const manual of [false, true]) {
    test(`porttan çekilen kablo mevcut kabloya tıklayınca birleşir (${manual ? 'manuel rota' : 'seçim aracı'})`, async ({ page }) => {
      const { second } = await setup(page);
      if (manual) await page.keyboard.press('r');
      await portOf(second, 'cam-out').click();
      const p = await pointOn(connections(page).first(), 0.5);
      await page.mouse.click(p.x, p.y);
      await expect(junctions(page)).toHaveCount(1);
      await expect(connections(page)).toHaveCount(3);
    });
  }

  test('nokta sürüklenince kollar gelir, görünüm kaymaz, tek geri al yeter', async ({ page }) => {
    const { second } = await setup(page);
    await addJunction(page);
    await branchTo(page, second);
    const before = await center(junctions(page).first());
    const paths = () => connections(page).evaluateAll(list => list.map(g => g.querySelectorAll('path')[2].getAttribute('d')));
    const dBefore = await paths();
    const view = () => page.locator('#canvas-export-area').evaluate(el => getComputedStyle(el).transform);
    const viewBefore = await view();
    await page.mouse.move(before.x, before.y);
    await page.mouse.down();
    await page.mouse.move(before.x + 60, before.y + 80, { steps: 8 });
    await page.mouse.up();
    await expect.poll(async () => Math.abs((await center(junctions(page).first())).y - before.y - 80)).toBeLessThan(25);
    (await paths()).forEach((d, i) => expect(d).not.toBe(dBefore[i]));
    expect(await view()).toBe(viewBefore);
    await undoBtn(page).click();
    await expect.poll(async () => (await center(junctions(page).first())).y).toBeCloseTo(before.y, 0);
    await expect(connections(page)).toHaveCount(3);
  });

  test('2 kollu nokta silinince tek kablo kalır; 3 kollu silinince kollar da gider', async ({ page }) => {
    const { second } = await setup(page);
    await addJunction(page);
    await tapJunction(page);
    await page.keyboard.press('Escape');
    await tapJunction(page);
    await page.keyboard.press('Delete');
    await expect(junctions(page)).toHaveCount(0);
    await expect(connections(page)).toHaveCount(1);
    await addJunction(page);
    await branchTo(page, second);
    await tapJunction(page);
    await page.keyboard.press('Delete');
    await expect(junctions(page)).toHaveCount(0);
    await expect(connections(page)).toHaveCount(0);
    await undoBtn(page).click();
    await expect(connections(page)).toHaveCount(3);
    await expect(junctions(page)).toHaveCount(1);
  });

  test('parça silinince yalnızca onun kolu gider', async ({ page }) => {
    const { second } = await setup(page);
    await addJunction(page);
    await branchTo(page, second);
    await second.locator(':scope > div').first().click({ position: { x: 60, y: 20 } });
    await page.keyboard.press('Delete');
    await expect(nodes(page)).toHaveCount(2);
    await expect(connections(page)).toHaveCount(2);
    await expect(junctions(page)).toHaveCount(1);
  });

  test('kaydet-aç sonrası nokta durur; pin haritası nokta üzerinden eşleştirir', async ({ page }) => {
    autoDialogs(page);
    const { second } = await setup(page);
    await addJunction(page);
    await branchTo(page, second);
    await page.getByRole('button', { name: /Pin (Haritası|Map)/ }).click();
    await expect(page.getByText('birleşme noktası üzerinden')).toHaveCount(3);
    await page.getByRole('button', { name: 'Kapat' }).click();
    await leftTab(page, 'Project');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Save' }).click();
    const file = Buffer.concat(await (await (await download).createReadStream()).toArray());
    await page.getByRole('button', { name: 'Sahneyi Temizle' }).click();
    await page.getByRole('button', { name: /Onayla|Sil|Evet|Temizle/ }).last().click();
    await expect(junctions(page)).toHaveCount(0);
    await page.locator('input[type=file][accept=".weave,.json"]').setInputFiles({ name: 's.weave', mimeType: 'application/json', buffer: file });
    await expect(junctions(page)).toHaveCount(1);
    await expect(connections(page)).toHaveCount(3);
    await expect(page.locator('#canvas-export-area [data-junction-id]')).toHaveCount(1);
  });

  test('kilitli kabloya nokta eklenmez', async ({ page }) => {
    await setup(page);
    const p = await pointOn(connections(page).first(), 0.2);
    await page.mouse.click(p.x, p.y);
    await page.getByTestId('connection-toolbar').getByRole('button', { name: /Kilitle/ }).click();
    await page.mouse.click(p.x, p.y, { button: 'right' });
    await expect(page.getByRole('button', { name: 'Birleşme noktası ekle' })).toHaveCount(0);
    await page.mouse.move(5, 5);
    await freePoint(page);
  });
});
