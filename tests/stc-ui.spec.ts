import { test, expect } from '@playwright/test';

test.describe('Simple Test Cases UI (STC-06 to STC-15)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('STC-06: UI (Map Selector)', async ({ page }) => {
    await page.getByRole('button', { name: 'Network' }).click();
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });

    // The active button has border-purple-500/60
    await page.getByRole('button', { name: 'Company Business Network' }).click();
    await expect(page.getByRole('button', { name: 'Company Business Network' })).toHaveClass(/border-purple-500/);
  });

  test('STC-08: UI (Help & Guide Modal)', async ({ page }) => {
    await page.getByRole('button', { name: 'Network' }).click();
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });

    const helpBtn = page.getByRole('button', { name: /Help & Guide/i });
    await helpBtn.click();
    
    // Check if modal title exists, something like 'Guide' or 'Algorithm'
    await expect(page.locator('h2').filter({ hasText: 'Help & Guide' })).toBeVisible();
    
    // Press escape to close
    await page.keyboard.press('Escape');
  });

  test('STC-10: UI (Playback Controls)', async ({ page }) => {
    await page.getByRole('button', { name: 'Network' }).click();
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Synthetic' }).click();
    
    // Give it a moment to load the synthetic map
    await page.waitForTimeout(1000);
    
    await page.getByRole('button', { name: /Run Simulations/i }).click();
    const pauseBtn = page.getByRole('button', { name: /Pause/i });
    await expect(pauseBtn).toBeVisible({ timeout: 5000 });
    await pauseBtn.click();
    
    const resumeBtn = page.getByRole('button', { name: /Resume/i });
    await expect(resumeBtn).toBeVisible({ timeout: 5000 });
    
    const fwdBtn = page.getByRole('button', { name: /Fwd/i });
    await fwdBtn.click();
    
    const backBtn = page.getByRole('button', { name: 'Back', exact: true });
    await backBtn.click();
  });

  test('STC-11: UI (Skip to End)', async ({ page }) => {
    await page.getByRole('button', { name: 'Network' }).click();
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Synthetic' }).click();
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /Run Simulations/i }).click();
    const skipBtn = page.getByRole('button', { name: /Skip/i });
    await expect(skipBtn).toBeVisible({ timeout: 5000 });
    await skipBtn.click();
    
    const replayBtn = page.getByRole('button', { name: /Replay/i });
    await expect(replayBtn).toBeVisible({ timeout: 10000 });
  });

  test('STC-13: System (History Modal Persistence)', async ({ page }) => {
    await page.getByRole('button', { name: 'Network' }).click();
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Synthetic' }).click();
    await page.waitForTimeout(1000);

    // Run to end
    await page.getByRole('button', { name: /Run Simulations/i }).click();
    const skipBtn = page.getByRole('button', { name: /Skip/i });
    await expect(skipBtn).toBeVisible({ timeout: 5000 });
    await skipBtn.click();
    await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 10000 });

    // Open history
    await page.getByRole('button', { name: /Result History/i }).click();
    
    // Wait for the modal (which usually contains the word "History")
    await expect(page.getByText(/History/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('STC-07: UI (Zoom and Pan Controls)', async ({ page }) => {
    await page.getByRole('button', { name: 'Network' }).click();
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
    
    // Zoom in and out
    await page.getByRole('button', { name: '+' }).click();
    await page.getByRole('button', { name: '-' }).click();
  });

  test('STC-09: UI (Legend Validation)', async ({ page }) => {
    await page.getByRole('button', { name: 'Network' }).click();
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
    
    // Check if legend is visible
    await expect(page.getByText('Legend')).toBeVisible();
    await expect(page.getByText('Core Router / ISP')).toBeVisible(); // Network specific legend
  });

  test('STC-12: System (Dynamic Size Adjuster Clamping)', async ({ page }) => {
    await page.getByRole('button', { name: 'Network' }).click();
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Synthetic' }).click();

    // The dynamic size adjuster has inputs for Nodes and Links.
    // Try to set 9999 nodes
    const nodesInput = page.getByRole('spinbutton').first();
    await nodesInput.fill('9999');
    await nodesInput.blur();
    
    // Verify it clamped down to maximum allowed (e.g. 220 for network)
    await expect(nodesInput).not.toHaveValue('9999');
  });

  test('STC-14: System (Simulation Reset State)', async ({ page }) => {
    await page.getByRole('button', { name: 'Network' }).click();
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Synthetic' }).click();

    await page.getByRole('button', { name: /Run Simulations/i }).click();
    await page.waitForTimeout(500); // let it run to 50%
    await page.getByRole('button', { name: /Pause/i }).click();
    
    const resetBtn = page.getByText('🔄 Reset');
    await resetBtn.click();
    
    // Verify "Run Simulations" is back
    await expect(page.getByRole('button', { name: /Run Simulations/i })).toBeVisible();
  });

  test('STC-15: System (Event Rerolling)', async ({ page }) => {
    await page.getByRole('button', { name: 'Road Traffic' }).click();
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /traffic/i })).toBeVisible({ timeout: 15000 });
    
    const rerollBtn = page.getByRole('button', { name: /Reroll Events/i });
    await rerollBtn.click();
    // Assuming UI does not crash, we pass
  });

  test('STC-16: Network Routing (Anycast Mode)', async ({ page }) => {
    await page.getByRole('button', { name: 'Network' }).click();
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Synthetic' }).click();
    await page.waitForTimeout(1000);
    
    // Find the routing mode dropdown/button
    await page.getByRole('combobox').selectOption('anycast');
    await page.getByRole('button', { name: /Run Simulations/i }).click();
    await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 60000 });
  });

  test('STC-17: Evacuation (Floor Switcher)', async ({ page }) => {
    await page.getByRole('button', { name: /Emergency Evacuation/i }).click();
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /evacuation/i })).toBeVisible({ timeout: 15000 });
    
    await page.getByRole('button', { name: /SM City Santa Rosa/i }).click();
    await page.waitForTimeout(1000);
    
    // There should be buttons for Floor 1 and Floor 2
    await page.getByRole('button', { name: /L1 \(First\)/i }).click({ force: true });
    await page.getByRole('button', { name: /L2 \(Second\)/i }).click({ force: true });
  });

  test('STC-20: Live Metrics (Initialization)', async ({ page }) => {
    await page.getByRole('button', { name: 'Network' }).click();
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
    
    // Verify some zero/NA values in the metrics panel
    await expect(page.getByText('0').first()).toBeVisible();
  });

  test('STC-21: System (Negative Node Sizing)', async ({ page }) => {
    await page.getByRole('button', { name: 'Network' }).click();
    await page.getByRole('button', { name: /Execute/i }).click();
    await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /SM City/i }).click();

    const nodesInput = page.getByRole('spinbutton').first();
    await nodesInput.fill('-50');
    await nodesInput.blur();
    
    // Verify it clamped to minimum
    await expect(nodesInput).not.toHaveValue('-50');
  });
});
