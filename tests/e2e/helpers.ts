import { expect, type Locator, type Page } from '@playwright/test';

export interface SeedTemplate {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  modelNumber?: string;
  ports: Record<string, unknown>[];
}

const PIXEL = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>';

const port = (id: string, label: string, type: 'input' | 'output', x: number, y: number) => ({
  id, label, x, y, type, connectorType: 'generic',
});

export const CAMERA: SeedTemplate = {
  id: 'tpl-camera', name: 'Test Kamera', modelNumber: 'CAM-1', imageUrl: PIXEL, width: 120, height: 80,
  ports: [port('cam-out', 'VIDEO', 'output', 100, 50), port('cam-pwr', 'GÜÇ', 'input', 0, 50)],
};

export const MONITOR: SeedTemplate = {
  id: 'tpl-monitor', name: 'Test Monitör', modelNumber: 'MON-1', imageUrl: PIXEL, width: 120, height: 80,
  ports: [port('mon-in', 'GİRİŞ', 'input', 0, 50)],
};

/** Seeds a library before the app boots (only on the first load of a test). */
export async function seed(page: Page, templates: SeedTemplate[] = [CAMERA, MONITOR]) {
  await page.addInitScript((tpls) => {
    if (localStorage.getItem('techschematic_libraries_meta')) return;
    localStorage.setItem('techschematic_libraries_meta', JSON.stringify([{ id: 'lib1', name: 'Test', createdAt: new Date().toISOString() }]));
    localStorage.setItem('techschematic_library_lib1', JSON.stringify(tpls));
  }, templates);
}

/** Collects uncaught page errors; call `.expectNone()` at the end of a test. */
export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  return { expectNone: () => expect(errors, 'uncaught page errors').toEqual([]) };
}

/** Accept every confirm/alert/prompt; prompts answer with `promptValue`. */
export function autoDialogs(page: Page, promptValue = '') {
  const seen: { type: string; message: string }[] = [];
  page.on('dialog', d => {
    seen.push({ type: d.type(), message: d.message() });
    d.type() === 'prompt' ? d.accept(promptValue) : d.accept();
  });
  return seen;
}

/** Seeds, opens the app and dismisses the welcome screen with a new project. */
export async function openApp(page: Page, templates?: SeedTemplate[]) {
  await seed(page, templates);
  await page.goto('/');
  await page.getByRole('button', { name: 'Yeni Proje' }).click();
  await expect(page.getByRole('button', { name: 'Yeni Proje' })).toBeHidden();
}

export const nodes = (page: Page) => page.locator('[data-instance-id]');
export const connections = (page: Page) => page.locator('[data-connection-id]');
export const zones = (page: Page) => page.locator('[data-zone-id]');
export const texts = (page: Page) => page.locator('[data-text-id]');
export const comments = (page: Page) => page.locator('[data-comment-id]');
export const undoBtn = (page: Page) => page.getByRole('button', { name: 'Geri Al' });
export const redoBtn = (page: Page) => page.getByRole('button', { name: 'Yinele' });
export const tool = (page: Page, title: RegExp | string) => page.getByTitle(title);
export const canvas = (page: Page) => page.getByTestId('canvas-viewport');

/** Drops a library template onto the canvas at viewport coordinates (real HTML5 drop). */
export async function dropTemplate(page: Page, templateId: string, x: number, y: number) {
  const dataTransfer = await page.evaluateHandle((id) => {
    const dt = new DataTransfer();
    dt.setData('application/weave-template', id);
    return dt;
  }, templateId);
  await canvas(page).dispatchEvent('drop', { dataTransfer, clientX: x, clientY: y });
}

/** Places a camera at (x1,y) and a monitor at (x2,y); returns their node locators. */
export async function placePair(page: Page, y = 300, x1 = 430, x2 = 720) {
  await dropTemplate(page, CAMERA.id, x1, y);
  await dropTemplate(page, MONITOR.id, x2, y);
  await expect(nodes(page)).toHaveCount(2);
  return { camera: nodes(page).nth(0), monitor: nodes(page).nth(1) };
}

export const portOf = (node: Locator, portId: string) => node.locator(`[data-port-id="${portId}"]`);

/** Wires camera VIDEO (output) to monitor GİRİŞ (input) with the cursor tool. */
export async function wirePair(page: Page, camera: Locator, monitor: Locator) {
  await portOf(camera, 'cam-out').click();
  await portOf(monitor, 'mon-in').click();
  await expect(connections(page)).toHaveCount(1);
}

/** Opens a tab of the left sidebar. */
export const leftTab = (page: Page, name: 'Library' | 'Project') => page.getByRole('tab', { name }).first().click();

/** Waits for the autosave debounce to flush. */
export const flushAutosave = (page: Page) => page.waitForTimeout(2200);

/** A point on the visible paper that is clear of toolbars, sidebars and the minimap. */
export async function freePoint(page: Page, fx = 0.7, fy = 0.65) {
  return page.locator('#canvas-export-area').evaluate((el, [px, py]) => {
    const paper = el.firstElementChild!.getBoundingClientRect();
    const safe = { l: 340, t: 120, r: 880, b: 680 };
    const l = Math.max(paper.left, safe.l), t = Math.max(paper.top, safe.t);
    const r = Math.min(paper.right, safe.r), b = Math.min(paper.bottom, safe.b);
    return { x: Math.round(l + (r - l) * px), y: Math.round(t + (b - t) * py) };
  }, [fx, fy]);
}
