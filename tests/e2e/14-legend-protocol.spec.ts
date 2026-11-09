import { test, expect, type Page } from '@playwright/test';
import { openApp, trackErrors, placePair } from './helpers';

const open = async (page: Page) => {
  await page.locator('#legend-export-area').hover();
  await page.getByTitle('Anteti Düzenle').click();
  return page.locator('div.fixed', { hasText: 'Proje Detayları' });
};

test.describe('Antet (örnek lejanta göre) ve döküman protokolü', () => {
  test('antet örnek lejantın bölümlerini gösterir', async ({ page }) => {
    await openApp(page);
    const block = page.getByTestId('title-block');
    for (const t of ['REVISIONS', 'DESCRIPTION', 'CHKD.', 'Drawing Name:', 'Page Name:', 'APPROVED', 'CHECKED', 'DRAWN', 'NAME', 'SIGN', 'Project Name:', 'Drawing No:', 'Scale', 'Sheet', 'T. Sheet', 'Norm', 'Revision'])
      await expect(block).toContainText(new RegExp(t, 'i'));
    await expect(page.getByTestId('legend-rev-symbol').locator('polygon')).toBeVisible();
    await expect(block).toContainText('A4');
  });

  test('çizim adı, imza bilgileri ve revizyon geçmişi antete yansır (yeni revizyon üstte)', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    const modal = await open(page);
    await modal.getByLabel('Çizim Adı (Drawing Name)').fill('CAS General Configuration');
    await modal.getByPlaceholder('Proje Adı').fill('Collision Avoidance System');
    await modal.getByLabel('Kontrol Eden (Checked)').fill('M. Demir');
    await modal.getByLabel('Onay Tarihi').fill('02.11.2026');
    await modal.getByRole('button', { name: 'Revizyon Ekle' }).click();
    await modal.getByLabel('Revizyon 1 açıklama').fill('İlk taslak');
    await modal.getByLabel('Revizyon 1 no').fill('Draft-0');
    await modal.getByRole('button', { name: 'Revizyon Ekle' }).click();
    await modal.getByLabel('Revizyon 2 açıklama').fill('Yayın');
    await modal.getByLabel('Revizyon 2 no').fill('Rev-0');
    await modal.getByRole('button', { name: 'Kaydet' }).click();

    const block = page.getByTestId('title-block');
    await expect(page.getByTestId('legend-drawing-name')).toContainText('CAS General Configuration');
    await expect(page.getByTestId('legend-project')).toContainText(/Collision Avoidance System/i);
    await expect(page.getByTestId('legend-signatures')).toContainText('M. Demir');
    await expect(page.getByTestId('legend-signatures')).toContainText('02.11.2026');
    const rows = await page.getByTestId('legend-revisions').innerText();
    expect(rows.indexOf('Rev-0')).toBeGreaterThanOrEqual(0);
    expect(rows.indexOf('Rev-0')).toBeLessThan(rows.indexOf('Draft-0'));   // en yeni üstte
    await expect(block).toContainText('Yayın');
    errors.expectNone();
  });

  test('protokol açılınca numara AAA-BBB-CCC-DDD-XXX-YY Rev-PP-R biçiminde üretilir, her sayfa kendi sheet no\'sunu alır', async ({ page }) => {
    await openApp(page);
    await placePair(page);
    const modal = await open(page);
    const section = modal.getByTestId('doc-numbering-section');
    await expect(section.getByTestId('doc-number-preview')).toHaveText('AAA-DWD-ELE-GEN-001-01 Rev-P1-0');
    await section.getByText('Protokolü kullan').click();
    await section.getByLabel('Originator (AAA)').fill('anc');
    await section.getByLabel('Döküman Tipi (BBB)').fill('PTC');
    await expect(section).toContainText('Protocol');
    await section.getByLabel('Lokasyon / Alan (DDD)').fill('CS3');
    await expect(section).toContainText('Compressor Station 3');
    await section.getByLabel('Sıra No (XXX)').fill('12');
    await section.getByLabel('Proje Fazı (PP)').selectOption('P3');
    await section.getByLabel('Revizyon No (R)').fill('2');
    await expect(section.getByTestId('doc-number-preview')).toHaveText('ANC-PTC-ELE-CS3-12-01 Rev-P3-2'.replace('-12-', '-012-'));
    await modal.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.getByTestId('legend-docno')).toHaveText('ANC-PTC-ELE-CS3-012-01 Rev-P3-2');
  });

  test('protokol kapalıyken elle yazılan döküman no kullanılır; eksik parça uyarısı görünür', async ({ page }) => {
    await openApp(page);
    const modal = await open(page);
    const section = modal.getByTestId('doc-numbering-section');
    await expect(page.getByTestId('legend-docno')).not.toHaveText(/Rev-P/);
    await section.getByText('Protokolü kullan').click();
    await expect(section).toContainText('Eksik: Originator');
    await section.getByLabel('Originator (AAA)').fill('ANC');
    await expect(section).not.toContainText('Eksik:');
  });
});
