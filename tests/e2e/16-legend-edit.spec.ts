import { test, expect } from '@playwright/test';
import { openApp, trackErrors, undoBtn, redoBtn, placePair } from './helpers';

test.describe.configure({ timeout: 90000 });

test.describe('Lejant: tıklayarak düzenleme ve yer değiştirme', () => {
  test('başlık tıklanınca düzenlenir; boşaltınca varsayılana döner; geri alınır', async ({ page }) => {
    const errors = trackErrors(page);
    await openApp(page);
    const lbl = page.getByTestId('lbl-drawingName');
    await lbl.click();
    await page.getByLabel('Başlık: Drawing Name:', { exact: true }).fill('Çizim Adı:');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('lbl-drawingName')).toHaveText('Çizim Adı:');
    await undoBtn(page).click();
    await expect(page.getByTestId('lbl-drawingName')).toHaveText('Drawing Name:');
    // boşaltma = varsayılan
    await page.getByTestId('lbl-scale').click();
    await page.getByLabel('Başlık: Scale', { exact: true }).fill('Ölçek');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('lbl-scale')).toHaveText('Ölçek');
    await page.getByTestId('lbl-scale').click();
    await page.getByLabel('Başlık: Scale', { exact: true }).fill('');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('lbl-scale')).toHaveText('Scale');
    errors.expectNone();
  });

  test('değerler (proje adı, not, sayfa adı) tıklayarak düzenlenir; Escape iptal eder', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('legend-project').getByTitle('Düzenlemek için tıkla').nth(1).click();
    await page.getByLabel('Proje adı').fill('Çanakkale AI');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('legend-project')).toContainText('Çanakkale AI');
    await page.getByTestId('legend-page-name').getByTitle('Düzenlemek için tıkla').nth(1).click();
    await page.getByLabel('Sayfa adı').fill('Sistem Şeması');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('legend-page-name')).toContainText('Sistem Şeması');
    await expect(page.getByRole('button', { name: /Sistem Şeması/ }).or(page.getByText('Sistem Şeması').first())).toBeVisible();
    await page.getByTestId('legend-notes').getByTitle('Düzenlemek için tıkla').nth(1).dispatchEvent('click');
    await page.getByLabel('Teknik notlar').fill('Not A');
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('legend-notes')).not.toContainText('Not A');
  });

  test('bölümler ok düğmeleriyle yer değiştirir; sıra kalıcı', async ({ page }) => {
    await openApp(page);
    const order = async () => page.evaluate(() => [...document.querySelectorAll('#legend-export-area > div:first-of-type > div')].filter(d => !(d.getAttribute('data-testid') || '').startsWith('resize')).map(d => d.getAttribute('data-testid') || 'drawing'));
    expect(await order()).toEqual(['legend-revisions', 'drawing', 'legend-project']);
    await page.getByTestId('legend-project').hover();
    await page.getByRole('button', { name: 'project bölümünü sola taşı' }).click();
    await expect.poll(order).toEqual(['legend-revisions', 'legend-project', 'drawing']);
    await page.getByTestId('legend-extra').locator('[data-testid^="mover-"]').first().evaluate(() => {});
    await page.getByTestId('legend-extra').getByText('Firma').hover();
    await page.getByRole('button', { name: 'company bölümünü sola taşı' }).click();
    await expect(page.getByTestId('legend-extra').locator('> div').nth(0)).toContainText('Firma');
  });

  test('PNG/PDF çıktısında düzenleme araçları görünmez (no-print)', async ({ page }) => {
    await openApp(page);
    const n = await page.locator('[data-testid^="mover-"]:not(.no-print)').count();
    expect(n).toBe(0);
  });

  test('başlık silinir, geri getirilir; geri al çalışır', async ({ page }) => {
    await openApp(page);
    await page.getByTestId('lbl-scale').click();
    await page.getByRole('button', { name: /başlığını sil/ }).click();
    await expect(page.getByTestId('lbl-scale')).toHaveCount(0);
    await expect(page.getByTestId('lbl-sheet')).toHaveCount(1);
    await page.getByTestId('title-block').hover();
    await page.getByRole('button', { name: 'Silinen başlıkları geri getir' }).click();
    await expect(page.getByTestId('lbl-scale')).toHaveText('Scale');
    await undoBtn(page).click();
    await expect(page.getByTestId('lbl-scale')).toHaveCount(0);
  });

  test('hücre genişliği ve satır yüksekliği sürüklenerek ayarlanır; çift tık sıfırlar; tek geri alma', async ({ page }) => {
    await openApp(page);
    const proj = page.getByTestId('legend-project');
    const w0 = (await proj.boundingBox())!.width;
    await proj.hover();
    const h = page.getByTestId('resize-project');
    const hb = (await h.boundingBox())!;
    await page.mouse.move(hb.x + 3, hb.y + hb.height / 2);
    await page.mouse.down();
    await page.mouse.move(hb.x - 77, hb.y + hb.height / 2, { steps: 6 });
    await page.mouse.up();
    const w1 = (await proj.boundingBox())!.width;
    expect(w1).toBeLessThan(w0 - 40);
    await undoBtn(page).click();                                   // tek adımda geri
    expect(Math.abs((await proj.boundingBox())!.width - w0)).toBeLessThan(2);

    const strip = page.getByTestId('legend-main-strip');
    const oh = () => strip.evaluate(e => (e as HTMLElement).offsetHeight);
    const eh0 = await oh();
    await strip.hover();
    const hh = (await page.getByTestId('resize-mainH').boundingBox())!;
    await page.mouse.move(hh.x + 700, hh.y + 3);
    await page.mouse.down();
    await page.mouse.move(hh.x + 700, hh.y + 43, { steps: 6 });
    await page.mouse.up();
    expect(await oh()).toBeGreaterThan(eh0 + 20);
    await strip.hover();
    await page.getByTestId('resize-mainH').dispatchEvent('dblclick');
    await expect.poll(async () => Math.abs((await oh()) - eh0)).toBeLessThan(2);
  });

  test('her sayfaya ayrı Drawing No verilir; boşaltınca protokol numarasına döner; geri alınır', async ({ page }) => {
    await openApp(page);
    await page.getByTitle('Yeni Sayfa Ekle').click();
    const doc = page.getByTestId('legend-docno');
    const setNo = async (v: string) => {
      await doc.getByTitle('Düzenlemek için tıkla').click();
      await page.getByLabel('Çizim numarası (bu sayfa)').fill(v);
      await page.keyboard.press('Enter');
    };
    await setNo('ADC-DWD-ELE-CNK-002');
    await expect(doc).toContainText('ADC-DWD-ELE-CNK-002');
    await page.getByTestId('page-tab').first().click();
    const base1 = (await doc.innerText()).trim();
    expect(base1).not.toContain('CNK-002');
    await setNo('ADC-DWD-ELE-CNK-001');
    await expect(doc).toContainText('CNK-001');
    await page.getByTestId('page-tab').nth(1).click();
    await expect(doc).toContainText('CNK-002');                   // sayfalar bağımsız
    await page.getByTestId('page-tab').first().click();
    await expect(doc).toContainText('CNK-001');
    await undoBtn(page).click();                                  // son değişiklik (sayfa 1 numarası) geri alınır
    await expect(doc).not.toContainText('CNK-001');
    await redoBtn(page).click();
    await expect(doc).toContainText('CNK-001');
    await setNo(base1);                                           // hesaplananla aynı = override kalkar
    await expect(doc).toHaveText(base1);
  });

  test('parça/numara tablosu silinir, geri getirilir; geri al çalışır', async ({ page }) => {
    await openApp(page);
    await placePair(page);
    const bom = page.getByTestId('bom-table');
    await expect(bom).toBeVisible();
    await bom.hover();
    await page.getByRole('button', { name: 'Parça tablosunu sil' }).click();
    await expect(bom).toHaveCount(0);
    await page.getByTestId('title-block').hover();
    await page.getByRole('button', { name: 'Parça tablosunu geri getir' }).click();
    await expect(bom).toBeVisible();
    await bom.hover();
    await page.getByRole('button', { name: 'Parça tablosunu sil' }).click();
    await expect(bom).toHaveCount(0);
    await undoBtn(page).click();
    await expect(bom).toBeVisible();
  });

  test('parça tablosu her sayfada ayrı ayrı gösterilir/gizlenir', async ({ page }) => {
    await openApp(page);
    await placePair(page);                                        // sayfa 1: dolu
    await page.getByTitle('Yeni Sayfa Ekle').click();
    await placePair(page);                                        // sayfa 2: dolu
    const bom = page.getByTestId('bom-table');
    await expect(bom).toBeVisible();
    await bom.hover();
    await page.getByRole('button', { name: 'Parça tablosunu sil' }).click();
    await expect(bom).toHaveCount(0);                             // sayfa 2'de gizli
    await page.getByTestId('page-tab').first().click();
    await expect(bom).toBeVisible();                              // sayfa 1'de duruyor
    await page.getByTestId('page-tab').nth(1).click();
    await expect(bom).toHaveCount(0);
    await page.getByTestId('title-block').hover();
    await page.getByRole('button', { name: 'Parça tablosunu geri getir' }).click();
    await expect(bom).toBeVisible();
  });

  test('lejantın boyutu köşe tutamacıyla ayarlanır; çift tık sıfırlar; tek geri alma', async ({ page }) => {
    await openApp(page);
    const stack = page.getByTestId('legend-stack');
    const sc = async () => Number(await stack.getAttribute('data-scale'));
    const s0 = await sc();
    // tutamak görünür alanın dışında olabilir: işaretçi olaylarını doğrudan gönder
    await page.getByTestId('legend-scale-handle').evaluate((el) => {
      const r = el.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
      const ev = (type: string, dx: number, dy: number) => new PointerEvent(type, { bubbles: true, clientX: x + dx, clientY: y + dy, pointerId: 1 });
      el.dispatchEvent(ev('pointerdown', 0, 0));
      for (let i = 1; i <= 8; i++) window.dispatchEvent(ev('pointermove', 15 * i, 7.5 * i));   // aşağı/sağ = küçült
      window.dispatchEvent(ev('pointerup', 120, 60));
    });
    const s1 = await sc();
    expect(s1).toBeLessThan(s0 - 0.05);
    await undoBtn(page).click();
    await expect.poll(sc).toBeCloseTo(s0, 2);
    await redoBtn(page).click();
    await expect.poll(sc).toBeCloseTo(s1, 2);
    await page.getByTestId('legend-scale-handle').dispatchEvent('dblclick');
    await expect.poll(sc).toBeCloseTo(s0, 2);
  });

  test('Müşteri No alanı müşterinin yanında; lejanttan ve ayarlardan düzenlenir', async ({ page }) => {
    await openApp(page);
    const extra = page.getByTestId('legend-extra');
    const cells = extra.locator('> div');
    await expect(cells.nth(2)).toContainText('Müşteri');          // logo, firma, müşteri
    await expect(cells.nth(3)).toContainText('Müşteri No');       // hemen yanında
    await page.getByTestId('legend-customer-no').getByTitle('Düzenlemek için tıkla').nth(1).dispatchEvent('click');
    await page.getByLabel('Müşteri No', { exact: true }).fill('VCA-0042');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('legend-customer-no')).toContainText('VCA-0042');
    // ayarlar penceresinde de görünür ve oradan değişir
    await page.locator('#legend-export-area').hover();
    await page.getByTitle('Anteti Düzenle').click();
    const modal = page.locator('div.fixed', { hasText: 'Proje Detayları' });
    await expect(modal.getByLabel('Müşteri No')).toHaveValue('VCA-0042');
    await modal.getByLabel('Müşteri No').fill('VCA-0099');
    await modal.getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.getByTestId('legend-customer-no')).toContainText('VCA-0099');
  });

  test('lejant hücre değerleri hücrenin her yerinden gerçek fare tıklamasıyla açılır', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openApp(page);
    const cell = page.getByTestId('legend-customer-no');
    await cell.scrollIntoViewIfNeeded();
    const sp = (await cell.getByTitle('Düzenlemek için tıkla').nth(1).boundingBox())!;
    expect(sp.width).toBeGreaterThan(150);                         // tüm satır tıklanabilir, sadece "-" işareti değil
    await page.mouse.click(sp.x + sp.width * 0.8, sp.y + sp.height / 2);
    await page.keyboard.type('VCA-7');
    await page.keyboard.press('Enter');
    await expect(cell).toContainText('VCA-7');
  });
});
