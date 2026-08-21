# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: etc.spec.ts >> Edge Test Cases (ETC-01 to ETC-15) >> ETC-05: Game AI (Grid Snapping & Fixed Links)
- Location: tests\etc.spec.ts:8:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1').filter({ hasText: /game/i })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('h1').filter({ hasText: /game/i })

```

```yaml
- banner:
  - button "← Back"
  - img
  - heading "Network Routing" [level=1]
  - button "BFS"
  - text: "|"
  - button "DFS"
  - text: "|"
  - button "Hybrid"
  - button "Result History 0"
  - button "Help & Guide"
- complementary:
  - button "❮"
  - text: Network Routing Step 0 / 18 BFS Visited Nodes 0 Completion 0.0% Total Latency 0.0 ms Optimal % N/A Memory 0.000 MB Adaptability 0 DFS Visited Nodes 0 Completion 0.0% Total Latency 0.0 ms Optimal % N/A Memory 0.000 MB Adaptability 0 HYBRID Visited Nodes 0 Completion 0.0% Total Latency 0.0 ms Optimal % N/A Memory 0.000 MB Adaptability 0
  - heading "Legend" [level=3]
  - paragraph: Environment Nodes
  - text: 🌐 Core Router / ISP 🎛️ Multilayer Switch 🔌 Access / Floor Switch 📡 Wireless Access Point 💻 End Device (PC/Laptop) 🗄️ Server 💥 Failed Component
  - img
  - text: Explored Nodes (Stacked by Alg.)
  - paragraph: Environment Edges
  - img
  - text: Fiber Optic
  - img
  - text: Copper Straight-Through
  - img
  - text: Copper Cross-Over
  - img
  - text: Serial / WAN
  - img
  - text: Wireless
  - paragraph: Algorithms
  - img
  - text: BFS Path (Outer Layer)
  - img
  - text: DFS Path (Middle Layer)
  - img
  - text: Hybrid Path (Inner Layer) Active Search Heads
- main:
  - text: "Simultaneous Multi-Algorithm Evaluation Dynamic: VLAN isolation and core router failover events mid-routing"
  - button "Synthetic"
  - button "Company Business Network"
  - button "Campus Network"
  - text: "Mode:"
  - combobox:
    - option "Default (ISP Broadcast)" [selected]
    - option "Device to Device"
  - button "Show ▼"
  - button "Follow ▼"
  - text: "Zoom: 1.0x"
  - button "+"
  - button "-"
  - button "Reset"
  - button "Reroll Events"
  - button "Reset"
  - button "Back" [disabled]
  - button "Run Simulations"
  - button "Fwd"
  - button "Skip"
- complementary:
  - button "❯"
  - heading "Dynamic Map Events" [level=3]
  - text: "[0] 💥 🔥 Overheating Switch at Aggr-SW7 Dynamic Size Adjuster Nodes"
  - spinbutton "Nodes": "28"
  - button:
    - img
  - button:
    - img
  - text: Links
  - spinbutton "Links": "27"
  - button:
    - img
  - button:
    - img
  - text: "Generated: 28 nodes / 27 links"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Edge Test Cases (ETC-01 to ETC-15)', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/');
  6   |   });
  7   | 
  8   |   test('ETC-05: Game AI (Grid Snapping & Fixed Links)', async ({ page }) => {
  9   |     await page.getByRole('button', { name: /Game AI/i }).click();
  10  |     await page.waitForTimeout(500);
  11  |     await page.getByRole('button', { name: /Execute/i }).click();
> 12  |     await expect(page.locator('h1').filter({ hasText: /game/i })).toBeVisible({ timeout: 15000 });
      |                                                                   ^ Error: expect(locator).toBeVisible() failed
  13  |     
  14  |     // Choose Checkers/Dama which has a fixed grid constraint
  15  |     await page.getByRole('button', { name: /Turkish Draughts/i }).click();
  16  |     await page.waitForTimeout(1000);
  17  |     
  18  |     // Verify inputs are disabled or force reset
  19  |     // This depends on how the UI handles fixed maps. Usually Synthetic is the only one with size adjuster.
  20  |     // If we click Checkers, size adjuster shouldn't even be visible, or is locked.
  21  |     const nodesInput = page.getByRole('spinbutton').first();
  22  |     if (await nodesInput.isVisible()) {
  23  |       await expect(nodesInput).toBeDisabled();
  24  |     }
  25  |   });
  26  | 
  27  |   test('ETC-06: System (Rapid Map Switching)', async ({ page }) => {
  28  |     await page.getByRole('button', { name: /Network/i }).click();
  29  |     await page.waitForTimeout(500);
  30  |     await page.getByRole('button', { name: /Execute/i }).click();
  31  |     await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
  32  |     
  33  |     // Rapidly click between maps
  34  |     await page.getByRole('button', { name: 'Synthetic' }).click();
  35  |     await page.getByRole('button', { name: 'Company Business Network' }).click();
  36  |     await page.getByRole('button', { name: 'Synthetic' }).click();
  37  |     await page.getByRole('button', { name: 'Company Business Network' }).click();
  38  |     
  39  |     // App should not crash and should settle on the last clicked
  40  |     await expect(page.getByRole('button', { name: 'Company Business Network' })).toHaveClass(/border-purple-500/);
  41  |   });
  42  | 
  43  |   test('ETC-12: Robotics (Zero Robot Assignment/Fallback)', async ({ page }) => {
  44  |     await page.getByRole('button', { name: /Robotics/i }).click();
  45  |     await page.waitForTimeout(500);
  46  |     await page.getByRole('button', { name: /Execute/i }).click();
  47  |     await expect(page.locator('h1').filter({ hasText: /robotics/i })).toBeVisible({ timeout: 15000 });
  48  |     await page.getByRole('button', { name: 'Synthetic' }).click();
  49  |     await page.waitForTimeout(1000);
  50  | 
  51  |     // Set bots to 0 if there's a specific input, or if there is a way to deactivate all robots.
  52  |     // The UI might clamp it to 1 minimum.
  53  |     const botsInput = page.getByRole('spinbutton').filter({ hasText: /Robots/i }).first();
  54  |     if (await botsInput.isVisible()) {
  55  |       await botsInput.fill('0');
  56  |       await botsInput.blur();
  57  |       await expect(botsInput).not.toHaveValue('0');
  58  |     }
  59  |   });
  60  | 
  61  |   test('ETC-15: UI (Rapid Play/Pause Toggling)', async ({ page }) => {
  62  |     await page.getByRole('button', { name: /Network/i }).click();
  63  |     await page.waitForTimeout(500);
  64  |     await page.getByRole('button', { name: /Execute/i }).click();
  65  |     await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
  66  |     await page.getByRole('button', { name: 'Synthetic' }).click();
  67  |     await page.waitForTimeout(1000);
  68  | 
  69  |     await page.getByRole('button', { name: /Run Simulations/i }).click();
  70  |     const pauseBtn = page.getByRole('button', { name: /Pause/i });
  71  |     const resumeBtn = page.getByRole('button', { name: /Resume/i });
  72  | 
  73  |     // Rapid toggle
  74  |     for (let i = 0; i < 3; i++) {
  75  |       if (await pauseBtn.isVisible()) await pauseBtn.click();
  76  |       if (await resumeBtn.isVisible()) await resumeBtn.click();
  77  |     }
  78  |   });
  79  | 
  80  |   test('ETC-01: Network Routing (Strict Subnet ACL Limits)', async ({ page }) => {
  81  |     await page.getByRole('button', { name: /Network/i }).click();
  82  |     await page.waitForTimeout(500);
  83  |     await page.getByRole('button', { name: /Execute/i }).click();
  84  |     await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
  85  |     await page.getByRole('button', { name: 'Company Business Network' }).click();
  86  |     await page.waitForTimeout(1000);
  87  |     await page.getByRole('button', { name: /Run Simulations/i }).click();
  88  |     await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 60000 });
  89  |   });
  90  | 
  91  |   test('ETC-02: Robotics (DFS Deep-Branching Trap)', async ({ page }) => {
  92  |     await page.getByRole('button', { name: /Robotics/i }).click();
  93  |     await page.waitForTimeout(500);
  94  |     await page.getByRole('button', { name: /Execute/i }).click();
  95  |     await expect(page.locator('h1').filter({ hasText: /robotics/i })).toBeVisible({ timeout: 15000 });
  96  |     await page.getByRole('button', { name: /Clinic/i }).click();
  97  |     await page.waitForTimeout(1000);
  98  |     await page.getByRole('button', { name: /Run Simulations/i }).click();
  99  |     await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 60000 });
  100 |   });
  101 | 
  102 |   test('ETC-03: Road Traffic (Algorithm Recalculation)', async ({ page }) => {
  103 |     await page.getByRole('button', { name: /Road Traffic/i }).click();
  104 |     await page.waitForTimeout(500);
  105 |     await page.getByRole('button', { name: /Execute/i }).click();
  106 |     await expect(page.locator('h1').filter({ hasText: /traffic/i })).toBeVisible({ timeout: 15000 });
  107 |     await page.getByRole('button', { name: 'Synthetic' }).click();
  108 |     await page.waitForTimeout(1000);
  109 |     await page.getByRole('button', { name: /Run Simulations/i }).click();
  110 |     await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 60000 });
  111 |   });
  112 | 
```