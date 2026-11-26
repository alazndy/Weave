import { test, expect, type Page } from '@playwright/test';
import { openApp, seed, trackErrors, placePair, wirePair, leftTab, CAMERA, MONITOR } from './helpers';

const useEnglishApp = (page: Page) => page.addInitScript(() => {
  if (!localStorage.getItem('weave_app_settings')) localStorage.setItem('weave_app_settings', JSON.stringify({ language: 'en', theme: 'dark', palette: 'weave' }));
});

/** Visible text plus the texts shown on hover or read by screen readers. User data of the seed is removed. */
const interfaceText = (page: Page) => page.evaluate((own) => {
  const attrs = Array.from(document.querySelectorAll('[title],[aria-label],[placeholder],[alt]'))
    .flatMap(el => ['title', 'aria-label', 'placeholder', 'alt'].map(a => el.getAttribute(a) ?? ''));
  const options = Array.from(document.querySelectorAll('option')).map(o => o.textContent ?? '');
  let text = [document.body.innerText, ...attrs, ...options].join('\n');
  for (const word of own) text = text.split(word).join('');
  return text;
}, [CAMERA.name, MONITOR.name, ...[...CAMERA.ports, ...MONITOR.ports].map(p => String(p.label)), 'Türkçe']);

const expectNoTurkish = async (page: Page, where: string) => {
  const lines = (await interfaceText(page)).split('\n').filter(l => /[çğışÇĞİŞ]/.test(l));
  expect(lines, `Turkish text in the English interface: ${where}`).toEqual([]);
};

async function openEnglish(page: Page) {
  await useEnglishApp(page);
  await seed(page);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'New Project' })).toBeVisible();
}

test.describe('Dil seçimi', () => {
  test('İngilizce arayüzde karşılama, paneller ve pencereler Türkçe metin göstermez', async ({ page }) => {
    const errors = trackErrors(page);
    await openEnglish(page);
    await expectNoTurkish(page, 'welcome');
    await page.getByRole('button', { name: 'New Project' }).click();
    await expectNoTurkish(page, 'main screen');
    await leftTab(page, 'Project' as never);
    await expectNoTurkish(page, 'project tab');
    await page.getByRole('button', { name: /App Settings/ }).click();
    await expectNoTurkish(page, 'app settings');
    await page.keyboard.press('Escape');
    for (const name of ['Shortcuts', 'Pin Map', 'History']) {
      await page.getByRole('button', { name, exact: true }).first().click();
      await expectNoTurkish(page, name);
      await page.reload();
      await page.getByRole('button', { name: 'New Project' }).click();
    }
    for (const key of ['r', 't', 'z']) {
      await page.keyboard.press(key);
      await expectNoTurkish(page, `tool ${key}`);
    }
    await page.getByTestId('title-block').getByTitle('Edit Title Block').click({ force: true });
    await expectNoTurkish(page, 'project settings');
    errors.expectNone();
  });

  test('yeni proje uygulama dilini belge dili olarak alır', async ({ page }) => {
    await openEnglish(page);
    await page.getByRole('button', { name: 'New Project' }).click();
    const block = page.getByTestId('title-block');
    await expect(block.getByTestId('lbl-drawingName')).toHaveText('Drawing Name:');
    await expect(block).toContainText('New System Schematic');
    await expect(page.getByTestId('page-tab').first()).toContainText('Page 1');
  });

  test('belge dili arayüzden bağımsızdır: antet, parça tablosu ve varsayılan yazılar değişir', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    const pair = await placePair(page, 260, 430, 760);
    await wirePair(page, pair.camera, pair.monitor);
    const block = page.getByTestId('title-block');
    await expect(block.getByTestId('lbl-drawingName')).toHaveText('Çizim Adı:');
    await expect(page.getByTestId('bom-table')).toContainText('ADET');

    const setDocumentLanguage = async (value: 'tr' | 'en') => {
      await block.getByTitle('Anteti Düzenle').click({ force: true });
      await page.getByLabel('Belge dili').selectOption(value);
      await page.getByLabel('Belge dili').press('Tab');
      await page.getByRole('button', { name: 'Kaydet', exact: true }).last().click();
    };

    await setDocumentLanguage('en');
    await expect(block.getByTestId('lbl-drawingName')).toHaveText('Drawing Name:');
    await expect(block).toContainText('New System Schematic');
    await expect(block).toContainText('All connections must be tightened');
    await expect(page.getByTestId('bom-table')).toContainText('QTY');
    await expect(page.getByTestId('bom-table')).not.toContainText('ADET');
    await expect(page.getByTestId('page-tab').first()).toContainText('Page 1');
    // the interface stays Turkish
    await expect(page.getByRole('button', { name: 'Geri Al' })).toBeVisible();
    await expect(block.getByTitle('Anteti Düzenle')).toHaveCount(1);

    await setDocumentLanguage('tr');
    await expect(block.getByTestId('lbl-drawingName')).toHaveText('Çizim Adı:');
    await expect(page.getByTestId('page-tab').first()).toContainText('Sayfa 1');
    errors.expectNone();
  });

  test('uygulama dili anında değişir, belge dili değişmez', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: /Uygulama Ayarları/ }).click();
    await page.getByRole('dialog').getByRole('combobox').click();
    await page.getByRole('option', { name: /English/ }).click();
    await expect(page.getByRole('dialog')).toContainText('Application Settings');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
    await expect(page.getByTestId('lbl-drawingName')).toHaveText('Çizim Adı:');
  });

  test('elle değiştirilen antet başlığı yalnızca yazıldığı belge dilinde görünür; tüm başlıklar dili izler', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    const block = page.getByTestId('title-block');
    const headings = () => block.locator('[data-testid^="lbl-"]').allInnerTexts();
    const setDocumentLanguage = async (value: 'tr' | 'en') => {
      await block.getByTitle('Anteti Düzenle').click({ force: true });
      await page.getByLabel('Belge dili').selectOption(value);
      await page.getByRole('button', { name: 'Kaydet', exact: true }).last().click();
    };
    const turkish = await headings();
    await block.getByTestId('lbl-scale').click();
    await page.keyboard.press('Control+a');
    await page.keyboard.type('Skala');
    await page.keyboard.press('Enter');
    await expect(block.getByTestId('lbl-scale')).toHaveText('Skala');

    await setDocumentLanguage('en');
    await expect(block.getByTestId('lbl-scale')).toHaveText('Scale');
    const english = await headings();
    expect(english).toHaveLength(turkish.length);
    expect(english.filter(h => /[çğışÇĞİŞ]/.test(h))).toEqual([]);

    await setDocumentLanguage('tr');
    await expect(block.getByTestId('lbl-scale')).toHaveText('Skala');
    errors.expectNone();
  });
});
