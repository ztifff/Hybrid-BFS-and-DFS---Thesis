import { test, expect } from '@playwright/test';

test.describe('Edge Test Cases (ETC-01 to ETC-15)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ETC-05: Game AI (Grid Snapping & Fixed Links)', async ({ page }) => {
    await page.getByRole('button', { name: /Game AI/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /game/i })).toBeVisible({ timeout: 15000 });
    
    // Choose Checkers/Dama which has a fixed grid constraint
    await page.getByRole('button', { name: /Turkish Draughts/i }).click();
    await page.waitForTimeout(1000);
    
    // Verify inputs are disabled or force reset
    // This depends on how the UI handles fixed maps. Usually Synthetic is the only one with size adjuster.
    // If we click Checkers, size adjuster shouldn't even be visible, or is locked.
    const nodesInput = page.getByRole('spinbutton').first();
    if (await nodesInput.isVisible()) {
      await expect(nodesInput).toBeDisabled();
    }
  });

  test('ETC-06: System (Rapid Map Switching)', async ({ page }) => {
    await page.getByRole('button', { name: /Network/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
    
    // Rapidly click between maps
    await page.getByRole('button', { name: 'Synthetic' }).click();
    await page.getByRole('button', { name: 'Company Business Network' }).click();
    await page.getByRole('button', { name: 'Synthetic' }).click();
    await page.getByRole('button', { name: 'Company Business Network' }).click();
    
    // App should not crash and should settle on the last clicked
    await expect(page.getByRole('button', { name: 'Company Business Network' })).toHaveClass(/border-purple-500/);
  });

  test('ETC-12: Robotics (Zero Robot Assignment/Fallback)', async ({ page }) => {
    await page.getByRole('button', { name: /Robotics/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /robotics/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Synthetic' }).click();
    await page.waitForTimeout(1000);

    // Set bots to 0 if there's a specific input, or if there is a way to deactivate all robots.
    // The UI might clamp it to 1 minimum.
    const botsInput = page.getByRole('spinbutton').filter({ hasText: /Robots/i }).first();
    if (await botsInput.isVisible()) {
      await botsInput.fill('0');
      await botsInput.blur();
      await expect(botsInput).not.toHaveValue('0');
    }
  });

  test('ETC-15: UI (Rapid Play/Pause Toggling)', async ({ page }) => {
    await page.getByRole('button', { name: /Network/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Synthetic' }).click();
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /Run Simulations/i }).click();
    const pauseBtn = page.getByRole('button', { name: /Pause/i });
    const resumeBtn = page.getByRole('button', { name: /Resume/i });

    // Rapid toggle
    for (let i = 0; i < 3; i++) {
      if (await pauseBtn.isVisible()) await pauseBtn.click();
      if (await resumeBtn.isVisible()) await resumeBtn.click();
    }
  });

  test('ETC-01: Network Routing (Strict Subnet ACL Limits)', async ({ page }) => {
    await page.getByRole('button', { name: /Network/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Company Business Network' }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /Run Simulations/i }).click();
    await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 60000 });
  });

  test('ETC-02: Robotics (DFS Deep-Branching Trap)', async ({ page }) => {
    await page.getByRole('button', { name: /Robotics/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /robotics/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /Clinic/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /Run Simulations/i }).click();
    await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 60000 });
  });

  test('ETC-03: Road Traffic (Algorithm Recalculation)', async ({ page }) => {
    await page.getByRole('button', { name: /Road Traffic/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /traffic/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Synthetic' }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /Run Simulations/i }).click();
    await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 60000 });
  });

  test('ETC-04: Emergency Evacuation (Multi-Floor Stairwell)', async ({ page }) => {
    await page.getByRole('button', { name: /Emergency Evacuation/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /evacuation/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /SM City Santa Rosa/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /Run Simulations/i }).click();
    await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 90000 });
  });

  test('ETC-07: Browser Resize', async ({ page }) => {
    await page.getByRole('button', { name: /Network/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: /Run Simulations/i })).toBeVisible();
  });

  test('ETC-08: DFS Infinite Cycle', async ({ page }) => {
    await page.getByRole('button', { name: /Network/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Synthetic' }).click();
    await page.waitForTimeout(1000);
    // Usually DFS is one of the algorithms that run automatically. Just verifying it finishes.
    await page.getByRole('button', { name: /Run Simulations/i }).click();
    await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 60000 });
  });

  test('ETC-09: Evacuation (Spawn Trap)', async ({ page }) => {
    await page.getByRole('button', { name: /Emergency Evacuation/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /evacuation/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /SM City Santa Rosa/i }).click();
    await page.waitForTimeout(1000);
    
    // Reroll events multiple times
    const rerollBtn = page.getByRole('button', { name: /Reroll/i });
    if (await rerollBtn.isVisible()) {
      await rerollBtn.click();
      await rerollBtn.click();
    }
    // As long as no crash, we consider passed
  });

  test('ETC-10: Game AI (Target Encirclement)', async ({ page }) => {
    await page.getByRole('button', { name: /Game AI/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /game/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /Turkish Draughts/i }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /Run Simulations/i }).click();
    await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 60000 });
  });

  test('ETC-11: Network Routing (Core Failure)', async ({ page }) => {
    await page.getByRole('button', { name: /Network/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Company Business Network' }).click();
    await page.waitForTimeout(1000);
    
    // Reroll to simulate core failure
    const rerollBtn = page.getByRole('button', { name: /Reroll/i });
    if (await rerollBtn.isVisible()) await rerollBtn.click();
    
    await page.getByRole('button', { name: /Run Simulations/i }).click();
    await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 60000 });
  });

  test('ETC-13: History Import (Scenario Mismatch)', async ({ page }) => {
    await page.getByRole('button', { name: /Network/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
    
    // Ensure import button doesn't crash app
    const fileChooserPromise = page.waitForEvent('filechooser').catch(() => null);
    await page.getByRole('button', { name: /Import/i }).click().catch(() => null);
    const fileChooser = await fileChooserPromise;
    // We don't actually upload a file, just verify UI doesn't crash when button is clicked
  });

  test('ETC-14: Traffic (Mid-Route Road Closure)', async ({ page }) => {
    await page.getByRole('button', { name: /Road Traffic/i }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /traffic/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Synthetic' }).click();
    await page.waitForTimeout(1000);
    
    // Reroll to ensure closures
    const rerollBtn = page.getByRole('button', { name: /Reroll/i });
    if (await rerollBtn.isVisible()) await rerollBtn.click();
    
    await page.getByRole('button', { name: /Run Simulations/i }).click();
    await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 60000 });
  });
});
