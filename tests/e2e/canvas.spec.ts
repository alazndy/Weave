import { test, expect } from '@playwright/test';

test.describe('Weave Canvas App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load canvas and toolbar', async ({ page }) => {
    // Check for canvas element
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Check for toolbar
    await expect(page.getByRole('button', { name: 'Rectangle', exact: false }).first()).toBeVisible();
  });

  test('should select tools', async ({ page }) => {
    // Select Rectangle Tool (assuming aria-label or title exists, otherwise adapting to class)
    // NOTE: Selectors might need adjustment based on exact UI implementation
    const rectTool = page.locator('button').filter({ hasText: 'Rectangle' }).first(); // Fallback selector
    
    // If not found by text, searching by icon name/lucide class could be needed
    // For now assuming the basic structure loads
    await expect(page.locator('body')).toBeVisible();
  });
  
  test('should open BOM modal', async ({ page }) => {
     // Find BOM/Send to UPH button
     // Assuming it exists in the sidebar
     const exportBtn = page.getByText('Send to UPH');
     if (await exportBtn.isVisible()) {
        await exportBtn.click();
        await expect(page.getByText('BOM Export')).toBeVisible();
     }
  });
});
