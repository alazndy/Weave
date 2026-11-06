import { test, expect } from '@playwright/test';
import { seed, trackErrors, autoDialogs, nodes, dropTemplate, CAMERA, flushAutosave, openApp, leftTab } from './helpers';

const EMPTY_PAGE = { id: 'pg1', name: 'Sayfa 1', order: 1, instances: [], connections: [], zones: [], textNodes: [], comments: [] };

test.describe('Karşılama ekranı', () => {
  test('açılışta karşılama ekranı görünür, boş kayıt listesi gösterir', async ({ page }) => {
    const errors = trackErrors(page);
    await seed(page);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Yeni Proje' })).toBeVisible();
    await expect(page.getByText('Henüz kayıtlı proje yok')).toBeVisible();
    errors.expectNone();
  });

  test('Yeni Proje ekranı kapatır ve kütüphane yüklenir', async ({ page }) => {
    await openApp(page);
    await expect(page.getByTitle(CAMERA.name)).toBeVisible();
  });

  test('Kapat (X) butonu ekranı kapatır', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Kapat' }).click();
    await expect(page.getByRole('button', { name: 'Yeni Proje' })).toBeHidden();
  });

  test('Ayarlar butonu uygulama ayarlarını açar', async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Ayarlar' }).click();
    await expect(page.getByRole('dialog')).toContainText('Application Settings');
  });

  test('otomatik kaydedilen proje son projeler listesinde çıkar ve açılır', async ({ page }) => {
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 450, 300);
    await expect(nodes(page)).toHaveCount(1);
    await flushAutosave(page);

    await page.reload();
    const recent = page.getByRole('button', { name: /Yeni Sistem Şeması/ });
    await expect(recent).toBeVisible();
    await recent.click();
    await expect(nodes(page)).toHaveCount(1);
  });

  test('son proje listeden silinebilir', async ({ page }) => {
    autoDialogs(page);
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 450, 300);
    await flushAutosave(page);
    await page.reload();

    const recent = page.getByRole('button', { name: /Yeni Sistem Şeması/ });
    await recent.hover();
    await recent.getByRole('button', { name: 'Sil' }).click();
    await expect(page.getByText('Henüz kayıtlı proje yok')).toBeVisible();
  });

  test('.weave dosyasından proje açılır', async ({ page }) => {
    autoDialogs(page);
    await seed(page);
    await page.goto('/');
    const project = {
      version: '2.0',
      metadata: { projectName: 'Dosyadan Proje' },
      templates: [CAMERA],
      pages: [{ ...EMPTY_PAGE, instances: [{ id: 'i1', templateId: CAMERA.id, x: 200, y: 200 }] }],
      activePageId: 'pg1',
    };
    await page.locator('input[type=file][accept=".weave,.json"]').setInputFiles({
      name: 'test.weave', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(project)),
    });
    await expect(page.getByRole('button', { name: 'Yeni Proje' })).toBeHidden();
    await expect(nodes(page)).toHaveCount(1);
  });

  test('geçersiz dosya hata mesajı verir ve ekran açık kalır', async ({ page }) => {
    const dialogs = autoDialogs(page);
    await seed(page);
    await page.goto('/');
    await page.locator('input[type=file][accept=".weave,.json"]').setInputFiles({
      name: 'bad.weave', mimeType: 'application/json', buffer: Buffer.from('{"nope":1}'),
    });
    await expect.poll(() => dialogs.map(d => d.message)).toContain('Geçersiz proje dosyası.');
    await expect(page.getByRole('button', { name: 'Yeni Proje' })).toBeVisible();
  });

  test('proje sekmesinden Aç dosyası mevcut projeyi değiştirir', async ({ page }) => {
    autoDialogs(page);
    await openApp(page);
    await dropTemplate(page, CAMERA.id, 450, 300);
    await expect(nodes(page)).toHaveCount(1);
    await leftTab(page, 'Project');
    const project = { templates: [], pages: [EMPTY_PAGE], metadata: { projectName: 'Boş' } };
    await page.locator('input[type=file][accept=".weave,.json"]').setInputFiles({
      name: 'empty.weave', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(project)),
    });
    await expect(nodes(page)).toHaveCount(0);
  });
});
