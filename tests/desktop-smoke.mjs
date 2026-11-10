// Launches the real Electron app twice against a throw-away profile and checks that
// data written in the first run is still there in the second (persistence).
import { _electron as electron } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const userData = mkdtempSync(path.join(tmpdir(), 'weave-profile-'));
const launch = () => electron.launch({
  executablePath: process.env.WEAVE_BIN || undefined,
  args: process.env.WEAVE_BIN ? ['--no-sandbox', `--user-data-dir=${userData}`] : ['.', '--no-sandbox', `--user-data-dir=${userData}`],
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: 'production' },
});

let ok = false;
try {
  let app = await launch();
  let page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  console.log('origin:', await page.evaluate(() => location.origin));
  await page.getByRole('button', { name: 'Yeni Proje' }).click();
  await page.getByRole('button', { name: 'Yeni bileşen' }).waitFor();
  // write a marker into the library store (IndexedDB) and settings (localStorage)
  await page.evaluate(() => new Promise((res, rej) => {
    localStorage.setItem('weave_smoke', '1');
    const open = indexedDB.open('weave-library', 1);
    open.onsuccess = () => {
      const tx = open.result.transaction('kv', 'readwrite');
      tx.objectStore('kv').put([{ id: 'smoke', name: 'Kalıcılık Testi', imageUrl: '', width: 10, height: 10, ports: [] }], 'lib:smoke-lib');
      tx.oncomplete = () => res(true); tx.onerror = () => rej(tx.error);
    };
  }));
  await page.waitForTimeout(500);
  await app.close();

  app = await launch();
  page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  const persisted = await page.evaluate(() => new Promise((res) => {
    const ls = localStorage.getItem('weave_smoke') === '1';
    const open = indexedDB.open('weave-library', 1);
    open.onsuccess = () => {
      const g = open.result.transaction('kv').objectStore('kv').get('lib:smoke-lib');
      g.onsuccess = () => res({ ls, idb: g.result?.[0]?.name });
    };
  }));
  console.log('persisted:', JSON.stringify(persisted));
  ok = persisted.ls === true && persisted.idb === 'Kalıcılık Testi';
  await app.close();
} finally {
  rmSync(userData, { recursive: true, force: true });
}
console.log(ok ? 'DESKTOP SMOKE OK' : 'DESKTOP SMOKE FAILED');
process.exit(ok ? 0 : 1);
