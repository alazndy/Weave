import { test, expect } from '@playwright/test';
import { deflateSync } from 'node:zlib';
import { randomBytes } from 'node:crypto';
import { openApp } from './helpers';

function noisePng(w: number, h: number): Buffer {
  const t = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = t[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const ch = (ty: string, d: Buffer) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const b = Buffer.concat([Buffer.from(ty), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(b)); return Buffer.concat([l, b, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  const rows = Buffer.concat(Array.from({ length: h }, () => Buffer.concat([Buffer.from([0]), randomBytes(w * 3)])));
  return Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), ch('IHDR', ih), ch('IDAT', deflateSync(rows, { level: 1 })), ch('IEND', Buffer.alloc(0))]);
}

test('büyük görsel kütüphaneye kaydedilir ve kalıcıdır', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', m => { if (m.type() === 'error') logs.push(m.text()); });
  page.on('pageerror', e => logs.push('PAGEERR ' + e.message));
  test.setTimeout(120000);
  await openApp(page);
  await page.getByRole('button', { name: 'Yeni bileşen' }).click();
  await page.locator('input[type=file][accept*=".png"]').setInputFiles({ name: 'big.png', mimeType: 'image/png', buffer: noisePng(1600, 1200) });
  await page.getByRole('button', { name: /Tamamla ve İlerle/ }).click();
  await page.getByPlaceholder('Örn: Motor Sürücü').fill('Büyük Ürün');
  await page.getByAltText('Work area').click({ position: { x: 100, y: 100 } });
  await page.locator('div.fixed.z-\\[110\\]').getByRole('button', { name: 'Kaydet', exact: true }).last().click();
  await expect(page.getByTitle('Büyük Ürün')).toBeVisible();
  await page.waitForTimeout(500);
  expect(logs).toEqual([]);
  await page.reload();
  await page.getByRole('button', { name: 'Yeni Proje' }).click();
  await expect(page.getByTitle('Büyük Ürün')).toBeVisible();
});
