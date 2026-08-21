# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ctc.spec.ts >> Complex Test Cases (CTC-01 to CTC-15) >> CTC-02: Evacuation (Stairwell Bottleneck + Dynamic Fire)
- Location: tests\ctc.spec.ts:22:3

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /Multi-Story/i })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - button "← Back" [ref=e6]:
        - generic [ref=e7]: ←
        - generic [ref=e8]: Back
      - heading "Emergency Evacuation" [level=1] [ref=e14]
    - generic [ref=e15]:
      - button "BFS" [ref=e16] [cursor=pointer]
      - generic [ref=e19]: "|"
      - button "DFS" [ref=e20] [cursor=pointer]
      - generic [ref=e23]: "|"
      - button "Hybrid" [ref=e24] [cursor=pointer]
    - button "Result History 0" [ref=e28] [cursor=pointer]:
      - generic [ref=e29]: Result History
      - generic [ref=e30]: "0"
    - button "Help & Guide" [ref=e32] [cursor=pointer]
  - generic [ref=e34]:
    - complementary [ref=e35]:
      - button "❮" [ref=e37] [cursor=pointer]
      - generic [ref=e38]:
        - generic [ref=e39]:
          - generic [ref=e40]:
            - generic [ref=e41]: Emergency Evacuation
            - generic [ref=e42]: Step 0 / 10
          - generic [ref=e45]:
            - generic [ref=e46]:
              - generic [ref=e47]: BFS
              - generic [ref=e48]:
                - generic [ref=e49]: Visited Nodes
                - generic [ref=e50]: "0"
              - generic [ref=e51]:
                - generic [ref=e52]: Completion
                - generic [ref=e53]: 0.0%
              - generic [ref=e54]:
                - generic [ref=e55]: Evac Time
                - generic [ref=e56]: 0.0 s
              - generic [ref=e57]:
                - generic [ref=e58]: Optimal %
                - generic [ref=e59]: N/A
              - generic [ref=e60]:
                - generic [ref=e61]: Memory
                - generic [ref=e62]: 0.000 MB
              - generic [ref=e63]:
                - generic [ref=e64]: Adaptability
                - generic [ref=e65]: "0"
            - generic [ref=e66]:
              - generic [ref=e67]: DFS
              - generic [ref=e68]:
                - generic [ref=e69]: Visited Nodes
                - generic [ref=e70]: "0"
              - generic [ref=e71]:
                - generic [ref=e72]: Completion
                - generic [ref=e73]: 0.0%
              - generic [ref=e74]:
                - generic [ref=e75]: Evac Time
                - generic [ref=e76]: 0.0 s
              - generic [ref=e77]:
                - generic [ref=e78]: Optimal %
                - generic [ref=e79]: N/A
              - generic [ref=e80]:
                - generic [ref=e81]: Memory
                - generic [ref=e82]: 0.000 MB
              - generic [ref=e83]:
                - generic [ref=e84]: Adaptability
                - generic [ref=e85]: "0"
            - generic [ref=e86]:
              - generic [ref=e87]: HYBRID
              - generic [ref=e88]:
                - generic [ref=e89]: Visited Nodes
                - generic [ref=e90]: "0"
              - generic [ref=e91]:
                - generic [ref=e92]: Completion
                - generic [ref=e93]: 0.0%
              - generic [ref=e94]:
                - generic [ref=e95]: Evac Time
                - generic [ref=e96]: 0.0 s
              - generic [ref=e97]:
                - generic [ref=e98]: Optimal %
                - generic [ref=e99]: N/A
              - generic [ref=e100]:
                - generic [ref=e101]: Memory
                - generic [ref=e102]: 0.000 MB
              - generic [ref=e103]:
                - generic [ref=e104]: Adaptability
                - generic [ref=e105]: "0"
        - generic [ref=e106]:
          - heading "Legend" [level=3] [ref=e107]
          - generic [ref=e108]:
            - paragraph [ref=e109]: Environment Nodes
            - generic [ref=e110]:
              - generic [ref=e111]:
                - generic [ref=e112]: 🏬
                - generic [ref=e113]: Real-World Place (Source)
              - generic [ref=e114]:
                - generic [ref=e115]: 🚪
                - generic [ref=e116]: Emergency Exit (Target)
              - generic [ref=e117]:
                - generic [ref=e118]: 🚶
                - generic [ref=e119]: Corridor
              - generic [ref=e120]:
                - generic [ref=e121]: 🪜
                - generic [ref=e122]: Stairwell
              - generic [ref=e123]:
                - generic [ref=e124]: ⛔
                - generic [ref=e125]: Route Blocked
              - generic [ref=e126]: Explored Nodes (Stacked by Alg.)
          - generic [ref=e132]:
            - paragraph [ref=e133]: Environment Edges
            - generic [ref=e134]:
              - generic [ref=e135]: Corridor
              - generic [ref=e138]: Stairwell Descent
          - generic [ref=e141]:
            - paragraph [ref=e142]: Algorithms
            - generic [ref=e143]:
              - generic [ref=e144]: BFS Path (Outer Layer)
              - generic [ref=e147]: DFS Path (Middle Layer)
              - generic [ref=e150]: Hybrid Path (Inner Layer)
              - generic [ref=e153]: Active Search Heads
    - main [ref=e161]:
      - generic [ref=e162]:
        - generic [ref=e163]:
          - generic [ref=e164]: Simultaneous Multi-Algorithm Evaluation
          - generic [ref=e165]: "Dynamic: Fire spreads and blocks corridors in real-time"
        - generic [ref=e167]:
          - button "Synthetic" [ref=e168] [cursor=pointer]
          - button "SM City Santa Rosa" [ref=e169] [cursor=pointer]
          - button "Ayala Malls Solenad Nuvali (Atrium)" [ref=e170] [cursor=pointer]
        - generic [ref=e172]:
          - generic [ref=e173]: "STARTING POINT (SRC):"
          - combobox [ref=e174] [cursor=pointer]:
            - option "[L1] Room 101"
            - option "[L1] Room 102"
            - option "[L1] Room 103"
            - option "[L1] Room 104"
            - option "[L1] Room 105"
            - option "[L1] Room 106"
            - option "[L1] Room 107"
            - option "[L1] Room 108"
            - option "[L2] Room 201" [selected]
            - option "[L2] Room 202"
      - generic [ref=e176]:
        - button "Show ▼" [ref=e178] [cursor=pointer]:
          - generic [ref=e179]: Show
          - generic [ref=e180]: ▼
        - button "Follow ▼" [ref=e182] [cursor=pointer]:
          - generic [ref=e183]: Follow
          - generic [ref=e184]: ▼
        - generic [ref=e185]:
          - button "L1 (First)" [ref=e186] [cursor=pointer]
          - button "L2 (Second)" [ref=e187] [cursor=pointer]
          - button "L3 (Third)" [ref=e188] [cursor=pointer]
        - generic [ref=e189]:
          - generic [ref=e190]: "Zoom: 1.0x"
          - button "+" [ref=e191] [cursor=pointer]
          - button "-" [ref=e192] [cursor=pointer]
          - button "Reset" [ref=e193] [cursor=pointer]
      - generic [ref=e195]:
        - button "Reroll Events" [ref=e196] [cursor=pointer]
        - button "Reset" [ref=e197] [cursor=pointer]
        - button "Back" [disabled]
        - button "Run Simulations" [ref=e198] [cursor=pointer]
        - button "Fwd" [ref=e199] [cursor=pointer]
        - button "Skip" [ref=e200] [cursor=pointer]
    - complementary [ref=e201]:
      - button "❯" [ref=e203] [cursor=pointer]
      - generic [ref=e204]:
        - generic [ref=e206]:
          - heading "Dynamic Map Events" [level=3] [ref=e208]
          - generic [ref=e209]:
            - generic "Click to locate on map" [ref=e210] [cursor=pointer]:
              - generic [ref=e211]:
                - generic [ref=e212]: "[0]"
                - generic [ref=e213]: ⛔ 💨 Smoke / Blind Zone at L2 Main Hall 6
            - generic "Click to locate on map" [ref=e214] [cursor=pointer]:
              - generic [ref=e215]:
                - generic [ref=e216]: "[0]"
                - generic [ref=e217]: ⛔ 🔒 Shutter Lockout / Trapped Exit at East Fire Stairs (L3)
            - generic "Click to locate on map" [ref=e218] [cursor=pointer]:
              - generic [ref=e219]:
                - generic [ref=e220]: "[0]"
                - generic [ref=e221]: ⛔ 🧱 Debris at L1 Main Hall 5
        - generic [ref=e222]:
          - generic [ref=e223]: Dynamic Size Adjuster
          - generic [ref=e224]:
            - generic [ref=e225]:
              - generic [ref=e226]: Nodes
              - generic [ref=e227]:
                - spinbutton "Nodes" [ref=e228]: "60"
                - generic [ref=e229]:
                  - button [ref=e230] [cursor=pointer]
                  - button [ref=e233] [cursor=pointer]
            - generic [ref=e236]:
              - generic [ref=e237]: Links
              - generic [ref=e238]:
                - spinbutton "Links" [ref=e239]: "49"
                - generic [ref=e240]:
                  - button [ref=e241] [cursor=pointer]
                  - button [ref=e244] [cursor=pointer]
          - generic [ref=e247]: "Generated: 60 nodes / 49 links"
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Complex Test Cases (CTC-01 to CTC-15)', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/');
  6   |   });
  7   | 
  8   |   test('CTC-01: Robotics (Warehouse Storage to Delivery Multi-path)', async ({ page }) => {
  9   |     await page.getByRole('button', { name: /Robotics/i }).click();
  10  |     await page.waitForTimeout(500);
  11  |     await page.getByRole('button', { name: /Execute/i }).click();
  12  |     await expect(page.locator('h1').filter({ hasText: /robotics/i })).toBeVisible({ timeout: 15000 });
  13  |     
  14  |     // Choose Warehouse map
  15  |     await page.getByRole('button', { name: /Warehouse/i }).click();
  16  |     await page.waitForTimeout(1000);
  17  |     
  18  |     await page.getByRole('button', { name: /Run Simulations/i }).click();
  19  |     await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 120000 });
  20  |   });
  21  | 
  22  |   test('CTC-02: Evacuation (Stairwell Bottleneck + Dynamic Fire)', async ({ page }) => {
  23  |     await page.getByRole('button', { name: /Emergency Evacuation/i }).click();
  24  |     await page.waitForTimeout(500);
  25  |     await page.getByRole('button', { name: /Execute/i }).click();
  26  |     await expect(page.locator('h1').filter({ hasText: /evacuation/i })).toBeVisible({ timeout: 15000 });
  27  |     
> 28  |     await page.getByRole('button', { name: /Multi-Story/i }).click();
      |                                                              ^ Error: locator.click: Test timeout of 120000ms exceeded.
  29  |     await page.waitForTimeout(1000);
  30  |     
  31  |     await page.getByRole('button', { name: /Run Simulations/i }).click();
  32  |     await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 120000 });
  33  |   });
  34  | 
  35  |   test('CTC-03: Network (Multi-tier Enterprise Network)', async ({ page }) => {
  36  |     await page.getByRole('button', { name: /Network/i }).click();
  37  |     await page.waitForTimeout(500);
  38  |     await page.getByRole('button', { name: /Execute/i }).click();
  39  |     await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
  40  |     
  41  |     await page.getByRole('button', { name: 'Company Business Network' }).click();
  42  |     await page.waitForTimeout(1000);
  43  |     
  44  |     await page.getByRole('button', { name: /Run Simulations/i }).click();
  45  |     await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 120000 });
  46  |   });
  47  | 
  48  |   test('CTC-05: Road Traffic (City Grid Peak Hour)', async ({ page }) => {
  49  |     await page.getByRole('button', { name: /Road Traffic/i }).click();
  50  |     await page.waitForTimeout(500);
  51  |     await page.getByRole('button', { name: /Execute/i }).click();
  52  |     await expect(page.locator('h1').filter({ hasText: /traffic/i })).toBeVisible({ timeout: 15000 });
  53  |     
  54  |     await page.getByRole('button', { name: /Cabuyao City/i }).click();
  55  |     await page.waitForTimeout(1000);
  56  |     
  57  |     await page.getByRole('button', { name: /Run Simulations/i }).click();
  58  |     await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 120000 });
  59  |   });
  60  | 
  61  |   test('CTC-06: System (Performance at 100+ Nodes)', async ({ page }) => {
  62  |     await page.getByRole('button', { name: /Network/i }).click();
  63  |     await page.waitForTimeout(500);
  64  |     await page.getByRole('button', { name: /Execute/i }).click();
  65  |     await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
  66  |     
  67  |     await page.getByRole('button', { name: 'Synthetic' }).click();
  68  |     await page.waitForTimeout(1000);
  69  |     
  70  |     const nodesInput = page.getByRole('spinbutton').first();
  71  |     await nodesInput.fill('100');
  72  |     await nodesInput.blur();
  73  |     await page.waitForTimeout(1000);
  74  |     
  75  |     await page.getByRole('button', { name: /Run Simulations/i }).click();
  76  |     await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 120000 });
  77  |   });
  78  | 
  79  |   test('CTC-15: System (Complete Scenario Workflow)', async ({ page }) => {
  80  |     await page.getByRole('button', { name: /Game AI/i }).click();
  81  |     await page.waitForTimeout(500);
  82  |     await page.getByRole('button', { name: /Execute/i }).click();
  83  |     await expect(page.locator('h1').filter({ hasText: /game/i })).toBeVisible({ timeout: 15000 });
  84  |     
  85  |     await page.getByRole('button', { name: 'Synthetic' }).click();
  86  |     await page.waitForTimeout(1000);
  87  |     
  88  |     // Reroll events
  89  |     const rerollBtn = page.getByRole('button', { name: /Reroll/i });
  90  |     if (await rerollBtn.isVisible()) await rerollBtn.click();
  91  |     
  92  |     await page.getByRole('button', { name: /Run Simulations/i }).click();
  93  |     await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 120000 });
  94  |     
  95  |     // View history
  96  |     await page.getByRole('button', { name: /History/i }).click();
  97  |     await expect(page.locator('.fixed.inset-0')).toBeVisible({ timeout: 5000 });
  98  |     await page.locator('.fixed.inset-0').getByRole('button', { name: /Close/i }).first().click();
  99  |   });
  100 | });
  101 | 
```