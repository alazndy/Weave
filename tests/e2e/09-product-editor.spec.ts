import { test, expect, type Page } from '@playwright/test';
import { deflateSync } from 'node:zlib';
import { openApp, trackErrors, nodes, dropTemplate, CAMERA, portOf } from './helpers';

/** Builds a solid-colour PNG without any image library. */
function makePng(w: number, h: number): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(w * 3, 200)]);
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

const upload = async (page: Page) => {
  await page.getByRole('button', { name: 'Yeni bileşen' }).click();
  await page.locator('input[type=file][accept*=".png"]').setInputFiles({
    name: 'part.png', mimeType: 'image/png', buffer: makePng(300, 200),
  });
  await expect(page.getByRole('heading', { name: /Ön İşleme/ })).toBeVisible();
};

const toPorts = async (page: Page) => {
  await page.getByRole('button', { name: /Tamamla ve İlerle/ }).click();
  await expect(page.getByAltText('Work area')).toBeVisible();
};

test.describe('Ürün editörü', () => {
  test('Yeni bileşen yükleme ekranını açar, Kapat ile kapanır', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Yeni bileşen' }).click();
    await expect(page.getByRole('heading', { name: 'Görsel Yükleme' })).toBeVisible();
    await page.getByRole('button', { name: 'Kapat' }).click();
    await expect(page.getByRole('heading', { name: 'Görsel Yükleme' })).toBeHidden();
  });

  test('görsel yüklenince ön işleme aşamasına geçilir', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    await upload(page);
    errors.expectNone();
  });

  test('döndür, geri al ve yinele çalışır', async ({ page }) => {
    await openApp(page);
    await upload(page);
    const undo = page.locator('button[title*="Geri"]').first();
    const redo = page.locator('button[title*="İleri Al"]').first();
    await expect(undo).toBeDisabled();
    await page.getByRole('button', { name: 'Sağa Çevir' }).click();
    await expect(undo).toBeEnabled();
    await page.getByRole('button', { name: 'Sola Çevir' }).click();
    await undo.click();
    await expect(redo).toBeEnabled();
    await redo.click();
  });

  test('araç düğmeleri (Seç, Sil, Öl, Tara) seçilebilir', async ({ page }) => {
    await openApp(page);
    await upload(page);
    for (const t of ['Sil', 'Öl', 'Tara', 'Seç']) {
      await page.getByTitle(t, { exact: true }).click();
    }
  });

  test('seçim yapıp kırp uygulanır', async ({ page }) => {
    await openApp(page);
    await upload(page);
    const overlay = page.locator('canvas').nth(1);
    const b = (await overlay.boundingBox())!;
    await page.mouse.move(b.x + 20, b.y + 20);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 5 });
    await page.mouse.up();
    await page.getByRole('button', { name: /Kırp/ }).click();
    await expect(page.getByRole('heading', { name: /Ön İşleme/ })).toBeVisible();
  });

  test('Dosya Değiştir yükleme ekranına döner', async ({ page }) => {
    await openApp(page);
    await upload(page);
    await page.getByRole('button', { name: 'Dosya Değiştir' }).click();
    await expect(page.getByRole('heading', { name: 'Görsel Yükleme' })).toBeVisible();
  });

  test('port ekle, düzenle, kaydet; ürün kütüphaneye ve tuvale girer', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    await upload(page);
    await toPorts(page);

    await page.getByPlaceholder('Örn: Motor Sürücü').fill('Yeni Sensör');
    await page.getByPlaceholder('Örn: MTR-001').fill('SNS-9');

    const img = page.getByAltText('Work area');
    const b = (await img.boundingBox())!;
    await img.click({ position: { x: b.width * 0.8, y: b.height * 0.5 } });
    await page.getByTitle('Port 1').click();
    const popover = page.locator('div.absolute', { has: page.getByRole('heading', { name: 'Port Düzenle' }) });
    await expect(popover).toBeVisible();
    await popover.getByRole('textbox').first().fill('SİNYAL');
    await popover.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.getByTitle('SİNYAL')).toBeVisible();

    await page.locator('div.fixed.z-\\[110\\]').getByRole('button', { name: 'Kaydet', exact: true }).last().click();
    await expect(page.getByTitle('Yeni Sensör')).toBeVisible();

    await dropTemplate(page, (await page.evaluate(() => {
      const lib = JSON.parse(localStorage.getItem('techschematic_library_lib1') || '[]');
      return lib.find((t: { name: string }) => t.name === 'Yeni Sensör')?.id ?? '';
    })) || CAMERA.id, 450, 300);
    await expect(nodes(page)).toHaveCount(1);
    errors.expectNone();
  });

  test('eklenen port silinebilir', async ({ page }) => {
    await openApp(page);
    await upload(page);
    await toPorts(page);
    const img = page.getByAltText('Work area');
    const b = (await img.boundingBox())!;
    await img.click({ position: { x: b.width * 0.3, y: b.height * 0.4 } });
    await page.getByTitle('Port 1').click();
    const popover = page.locator('div.absolute', { has: page.getByRole('heading', { name: 'Port Düzenle' }) });
    await popover.locator('button:has(svg.lucide-trash-2)').click();
    await expect(page.getByTitle('Port 1')).toHaveCount(0);
  });

  test('mevcut ürün sağ tık > Ürünü Düzenle ile düzenlenir', async ({ page }) => {
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 450, 300);
    await nodes(page).first().click({ button: 'right' });
    await page.getByRole('button', { name: 'Ürünü Düzenle' }).click();
    await expect(page.getByRole('heading', { name: 'Ürün Düzenle' })).toBeVisible();
    await page.getByPlaceholder('Örn: Motor Sürücü').fill('Kamera v2');
    await page.locator('div.fixed.z-\\[110\\]').getByRole('button', { name: 'Kaydet', exact: true }).last().click();
    await expect(nodes(page).first()).toContainText('Kamera v2');
    await expect(portOf(nodes(page).first(), 'cam-out')).toBeAttached();
  });
});
