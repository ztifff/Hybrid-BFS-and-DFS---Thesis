import { test, expect } from '@playwright/test';

test.describe('Complex Test Cases (CTC-01 to CTC-15)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('CTC-01: Robotics (Warehouse Storage to Delivery Multi-path)', async ({ page }) => {
    await page.getByRole('button', { name: /Robotics/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /robotics/i })).toBeVisible({ timeout: 15000 });
    
    // Choose Warehouse map
    await page.getByRole('button', { name: /Warehouse/i }).click();
    await page.waitForTimeout(1000);
    
    await page.getByRole('button', { name: /Run Simulations/i }).click();
    await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 120000 });
  });

  test('CTC-02: Evacuation (Stairwell Bottleneck + Dynamic Fire)', async ({ page }) => {
    await page.getByRole('button', { name: /Emergency Evacuation/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /evacuation/i })).toBeVisible({ timeout: 15000 });
    
    await page.getByRole('button', { name: /Multi-Story/i }).click();
    await page.waitForTimeout(1000);
    
    await page.getByRole('button', { name: /Run Simulations/i }).click();
    await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 120000 });
  });

  test('CTC-03: Network (Multi-tier Enterprise Network)', async ({ page }) => {
    await page.getByRole('button', { name: /Network/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
    
    await page.getByRole('button', { name: 'Company Business Network' }).click();
    await page.waitForTimeout(1000);
    
    await page.getByRole('button', { name: /Run Simulations/i }).click();
    await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 120000 });
  });

  test('CTC-05: Road Traffic (City Grid Peak Hour)', async ({ page }) => {
    await page.getByRole('button', { name: /Road Traffic/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /traffic/i })).toBeVisible({ timeout: 15000 });
    
    await page.getByRole('button', { name: /Cabuyao City/i }).click();
    await page.waitForTimeout(1000);
    
    await page.getByRole('button', { name: /Run Simulations/i }).click();
    await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 120000 });
  });

  test('CTC-06: System (Performance at 100+ Nodes)', async ({ page }) => {
    await page.getByRole('button', { name: /Network/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
    
    await page.getByRole('button', { name: 'Synthetic' }).click();
    await page.waitForTimeout(1000);
    
    const nodesInput = page.getByRole('spinbutton').first();
    await nodesInput.fill('100');
    await nodesInput.blur();
    await page.waitForTimeout(1000);
    
    await page.getByRole('button', { name: /Run Simulations/i }).click();
    await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 120000 });
  });

  test('CTC-15: System (Complete Scenario Workflow)', async ({ page }) => {
    await page.getByRole('button', { name: /Game AI/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /game/i })).toBeVisible({ timeout: 15000 });
    
    await page.getByRole('button', { name: 'Synthetic' }).click();
    await page.waitForTimeout(1000);
    
    // Reroll events
    const rerollBtn = page.getByRole('button', { name: /Reroll/i });
    if (await rerollBtn.isVisible()) await rerollBtn.click();
    
    await page.getByRole('button', { name: /Run Simulations/i }).click();
    await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 120000 });
    
    // View history
    await page.getByRole('button', { name: /History/i }).click();
    await expect(page.locator('.fixed.inset-0')).toBeVisible({ timeout: 5000 });
    await page.locator('.fixed.inset-0').getByRole('button', { name: /Close/i }).first().click();
  });
});
