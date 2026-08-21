import { test, expect } from '@playwright/test';

test.describe('Simple Test Cases (STC)', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start at the home page for every test
    await page.goto('/');
  });

  test('STC-01: Network Routing (Baseline Connectivity)', async ({ page }) => {
    // 1. Select Scenario
    await page.getByRole('button', { name: /network/i }).click();
    
    // 2. Execute Comparative Analysis
    await page.getByRole('button', { name: /Execute/i }).click();

    // 3. Verify we are in the simulation view by checking for the scenario title
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });

    // Explicitly select the "Synthetic" map
    await page.getByRole('button', { name: 'Synthetic' }).click();

    // 4. Click 'Run Simulations'
    const runBtn = page.getByRole('button', { name: /Run Simulations/i });
    await expect(runBtn).toBeVisible({ timeout: 10000 });
    await runBtn.click();

    // 5. Wait for the simulation to finish. 
    // When done, the button changes to 'Replay'
    const replayBtn = page.getByRole('button', { name: /Replay/i });
    await expect(replayBtn).toBeVisible({ timeout: 120000 });
  });

  test('STC-02: Robotics Fleet (Baseline Pathing)', async ({ page }) => {
    await page.getByRole('button', { name: /robotics/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();

    await expect(page.locator('h1').filter({ hasText: /robotics/i })).toBeVisible({ timeout: 15000 });

    // Explicitly select the "Synthetic" map
    await page.getByRole('button', { name: 'Synthetic' }).click();

    const runBtn = page.getByRole('button', { name: /Run Simulations/i });
    await expect(runBtn).toBeVisible({ timeout: 10000 });
    await runBtn.click();

    const replayBtn = page.getByRole('button', { name: /Replay/i });
    await expect(replayBtn).toBeVisible({ timeout: 120000 });
  });

  test('STC-03: Road Traffic (Organic Generation Validation)', async ({ page }) => {
    await page.getByRole('button', { name: /traffic/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();

    await expect(page.locator('h1').filter({ hasText: /traffic/i })).toBeVisible({ timeout: 15000 });

    // Explicitly select the "Synthetic" map
    await page.getByRole('button', { name: 'Synthetic' }).click();

    const runBtn = page.getByRole('button', { name: /Run Simulations/i });
    await expect(runBtn).toBeVisible({ timeout: 10000 });
    await runBtn.click();

    const replayBtn = page.getByRole('button', { name: /Replay/i });
    await expect(replayBtn).toBeVisible({ timeout: 120000 });
  });

  test('STC-04: Emergency Evacuation (Floor Plan Rendering)', async ({ page }) => {
    await page.getByRole('button', { name: /evacuation/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();

    await expect(page.locator('h1').filter({ hasText: /evacuation/i })).toBeVisible({ timeout: 15000 });

    // Explicitly select the "Synthetic" map
    await page.getByRole('button', { name: 'Synthetic' }).click();

    const runBtn = page.getByRole('button', { name: /Run Simulations/i });
    await expect(runBtn).toBeVisible({ timeout: 10000 });
    await runBtn.click();

    const replayBtn = page.getByRole('button', { name: /Replay/i });
    await expect(replayBtn).toBeVisible({ timeout: 120000 });
  });

  test('STC-05: Game AI (Basic Piece Dodging)', async ({ page }) => {
    // The button might have text Game AI or GameAI, we'll use game
    await page.getByRole('button', { name: /game/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();

    await expect(page.locator('h1').filter({ hasText: /game/i })).toBeVisible({ timeout: 15000 });

    // Explicitly select the "Checkers" map
    await page.getByRole('button', { name: /Checkers/i }).click();

    const runBtn = page.getByRole('button', { name: /Run Simulations/i });
    await expect(runBtn).toBeVisible({ timeout: 10000 });
    await runBtn.click();

    const replayBtn = page.getByRole('button', { name: /Replay/i });
    await expect(replayBtn).toBeVisible({ timeout: 120000 });
  });
});
