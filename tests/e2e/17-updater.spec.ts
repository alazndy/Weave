import { test, expect } from '@playwright/test';
import { openApp, trackErrors } from './helpers';

// The real updater lives in the Electron main process; here the preload bridge is replaced by a fake
// so the banner flow (available → download → ready → install) can be checked in the browser.
const fakeBridge = (initial: object) => `
  (() => {
    let cb = null; const calls = [];
    window.__updCalls = calls;
    window.__updEmit = (s) => cb && cb(s);
    window.electron = { updater: {
      getStatus: async () => (${JSON.stringify(initial)}),
      check: async () => { calls.push('check'); },
      download: async () => { calls.push('download'); },
      install: async () => { calls.push('install'); },
      onStatus: (f) => { cb = f; return () => { cb = null; }; },
    } };
  })();
`;

test.describe('Uygulama güncelleme', () => {
  test('yeni sürüm → indir → ilerleme → yeniden başlat ve güncelle', async ({ page }) => {
    const errors = trackErrors(page);
    await page.addInitScript(fakeBridge({ state: 'available', version: '9.9.9' }));
    await openApp(page);
    const banner = page.getByTestId('update-banner');
    await expect(banner).toContainText('Yeni sürüm hazır: v9.9.9');
    await banner.getByRole('button', { name: 'İndir' }).click();
    expect(await page.evaluate(() => (window as any).__updCalls)).toContain('download');
    await page.evaluate(() => (window as any).__updEmit({ state: 'downloading', version: '9.9.9', percent: 42 }));
    await expect(banner).toContainText('%42');
    await page.evaluate(() => (window as any).__updEmit({ state: 'ready', version: '9.9.9' }));
    await banner.getByRole('button', { name: 'Yeniden başlat ve güncelle' }).click();
    expect(await page.evaluate(() => (window as any).__updCalls)).toContain('install');
    errors.expectNone();
  });

  test('güncel ise banner yok; ayarlardan elle denetlenir', async ({ page }) => {
    await page.addInitScript(fakeBridge({ state: 'none' }));
    await openApp(page);
    await expect(page.getByTestId('update-banner')).toHaveCount(0);
    await page.getByRole('button', { name: /App Settings/ }).click();
    await expect(page.getByTestId('update-settings')).toContainText('Weave güncel.');
    await page.getByRole('button', { name: 'Güncellemeleri denetle' }).click();
    expect(await page.evaluate(() => (window as any).__updCalls)).toContain('check');
  });

  test('tarayıcıda / taşınabilir sürümde (desteklenmiyor) hiçbir şey görünmez', async ({ page }) => {
    await openApp(page);
    await expect(page.getByTestId('update-banner')).toHaveCount(0);
    await page.getByRole('button', { name: /App Settings/ }).click();
    await expect(page.getByTestId('update-settings')).toHaveCount(0);
  });
});
