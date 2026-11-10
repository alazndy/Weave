// Exports a 2-page PDF from the real Electron app and checks it is vector (real fonts/text, no raster images).
// Usage: OUT=/tmp/x.pdf WEAVE_BIN=path/to/weave node tests/desktop-pdf.mjs   (needs poppler: pdfinfo/pdffonts/pdfimages)
import { _electron as electron } from '@playwright/test';
import { mkdtempSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const userData = mkdtempSync(path.join(tmpdir(), 'weave-vec-'));
const app = await electron.launch({ executablePath: process.env.WEAVE_BIN, args: ['--no-sandbox', `--user-data-dir=${userData}`], env: { ...process.env, NODE_ENV: 'production' } });
await app.evaluate(({ session }, out) => { session.defaultSession.on('will-download', (_e, item) => item.setSavePath(out)); }, process.env.OUT);
const page = await app.firstWindow();
await page.waitForLoadState('domcontentloaded');
await page.getByRole('button', { name: 'Yeni Proje' }).click();
await page.getByRole('button', { name: 'Yeni bileşen' }).waitFor();
await page.getByTitle('Yeni Sayfa Ekle').click();
console.log('hasBridge', await page.evaluate(() => typeof window.electron?.printToPDF));
await page.getByRole('button', { name: 'PDF olarak dışa aktar' }).click();
for (let i = 0; i < 180 && !(existsSync(process.env.OUT) && statSync(process.env.OUT).size > 1000); i++) await page.waitForTimeout(500);
await page.waitForTimeout(1500);
await app.close();
import { execFileSync } from 'node:child_process';
const run = (c, ...a) => execFileSync(c, [...a, process.env.OUT]).toString();
const pages = Number(/Pages:\s+(\d+)/.exec(run('pdfinfo'))[1]);
const fonts = run('pdffonts').split('\n').slice(2).filter(Boolean).length;
const images = run('pdfimages', '-list').split('\n').slice(2).filter(Boolean).length;
console.log({ pages, fonts, images });
if (pages !== 2 || fonts < 1 || images !== 0) { console.error('VECTOR PDF CHECK FAILED'); process.exit(1); }
console.log('VECTOR PDF OK');
