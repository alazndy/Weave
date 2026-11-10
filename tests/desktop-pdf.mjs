// Opens a PDF inside the real Electron app (offline worker over app://) and checks it renders.
import { _electron as electron } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const content = '0 0 0 rg 100 100 200 200 re f';
const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 400] /Contents 4 0 R /Resources << >> >>',
  `<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
let out = '%PDF-1.4\n'; const off = [];
objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
const x = out.length; out += `xref\n0 5\n0000000000 65535 f \n`; off.forEach(o => { out += `${String(o).padStart(10, '0')} 00000 n \n`; });
out += `trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;

const userData = mkdtempSync(path.join(tmpdir(), 'weave-pdf-'));
let ok = false;
try {
  const app = await electron.launch({
    executablePath: process.env.WEAVE_BIN || undefined,
    args: process.env.WEAVE_BIN ? ['--no-sandbox', `--user-data-dir=${userData}`] : ['.', '--no-sandbox', `--user-data-dir=${userData}`],
    env: { ...process.env, NODE_ENV: 'production' },
  });
  const page = await app.firstWindow();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.getByRole('button', { name: 'Yeni Proje' }).click();
  await page.getByRole('button', { name: 'Yeni bileşen' }).click();
  await page.locator('input[type=file][accept*=".pdf"]').setInputFiles({ name: 'a.pdf', mimeType: 'application/pdf', buffer: Buffer.from(out, 'latin1') });
  await page.getByRole('heading', { name: /Ön İşleme/ }).waitFor({ timeout: 15000 });
  const w = await page.locator('canvas').first().evaluate(c => c.width);
  console.log('canvas width', w, 'errors', JSON.stringify(errors));
  ok = w === 2400 && errors.length === 0;
  await app.close();
} finally { rmSync(userData, { recursive: true, force: true }); }
console.log(ok ? 'DESKTOP PDF OK' : 'DESKTOP PDF FAILED');
process.exit(ok ? 0 : 1);
