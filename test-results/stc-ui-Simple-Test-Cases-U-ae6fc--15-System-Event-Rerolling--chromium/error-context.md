# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: stc-ui.spec.ts >> Simple Test Cases UI (STC-06 to STC-15) >> STC-15: System (Event Rerolling)
- Location: tests\stc-ui.spec.ts:147:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1').filter({ hasText: /traffic/i })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('h1').filter({ hasText: /traffic/i })

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
  - text: Network Routing Step 0 / 29 BFS Visited Nodes 0 Completion 0.0% Total Latency 0.0 ms Optimal % N/A Memory 0.000 MB Adaptability 0 DFS Visited Nodes 0 Completion 0.0% Total Latency 0.0 ms Optimal % N/A Memory 0.000 MB Adaptability 0 HYBRID Visited Nodes 0 Completion 0.0% Total Latency 0.0 ms Optimal % N/A Memory 0.000 MB Adaptability 0
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
  - text: "[0] 💥 🔥 Overheating Switch at Aggr-SW6 Dynamic Size Adjuster Nodes"
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
  50  |     const fwdBtn = page.getByRole('button', { name: /Fwd/i });
  51  |     await fwdBtn.click();
  52  |     
  53  |     const backBtn = page.getByRole('button', { name: 'Back', exact: true });
  54  |     await backBtn.click();
  55  |   });
  56  | 
  57  |   test('STC-11: UI (Skip to End)', async ({ page }) => {
  58  |     await page.getByRole('button', { name: 'Network' }).click();
  59  |     await page.getByRole('button', { name: /Execute/i }).click();
  60  |     await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
  61  |     await page.getByRole('button', { name: 'Synthetic' }).click();
  62  |     await page.waitForTimeout(1000);
  63  | 
  64  |     await page.getByRole('button', { name: /Run Simulations/i }).click();
  65  |     const skipBtn = page.getByRole('button', { name: /Skip/i });
  66  |     await expect(skipBtn).toBeVisible({ timeout: 5000 });
  67  |     await skipBtn.click();
  68  |     
  69  |     const replayBtn = page.getByRole('button', { name: /Replay/i });
  70  |     await expect(replayBtn).toBeVisible({ timeout: 10000 });
  71  |   });
  72  | 
  73  |   test('STC-13: System (History Modal Persistence)', async ({ page }) => {
  74  |     await page.getByRole('button', { name: 'Network' }).click();
  75  |     await page.getByRole('button', { name: /Execute/i }).click();
  76  |     await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
  77  |     await page.getByRole('button', { name: 'Synthetic' }).click();
  78  |     await page.waitForTimeout(1000);
  79  | 
  80  |     // Run to end
  81  |     await page.getByRole('button', { name: /Run Simulations/i }).click();
  82  |     const skipBtn = page.getByRole('button', { name: /Skip/i });
  83  |     await expect(skipBtn).toBeVisible({ timeout: 5000 });
  84  |     await skipBtn.click();
  85  |     await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 10000 });
  86  | 
  87  |     // Open history
  88  |     await page.getByRole('button', { name: /Result History/i }).click();
  89  |     
  90  |     // Wait for the modal (which usually contains the word "History")
  91  |     await expect(page.getByText(/History/i).first()).toBeVisible({ timeout: 5000 });
  92  |   });
  93  | 
  94  |   test('STC-07: UI (Zoom and Pan Controls)', async ({ page }) => {
  95  |     await page.getByRole('button', { name: 'Network' }).click();
  96  |     await page.getByRole('button', { name: /Execute/i }).click();
  97  |     await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
  98  |     
  99  |     // Zoom in and out
  100 |     await page.getByRole('button', { name: '+' }).click();
  101 |     await page.getByRole('button', { name: '-' }).click();
  102 |   });
  103 | 
  104 |   test('STC-09: UI (Legend Validation)', async ({ page }) => {
  105 |     await page.getByRole('button', { name: 'Network' }).click();
  106 |     await page.getByRole('button', { name: /Execute/i }).click();
  107 |     await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
  108 |     
  109 |     // Check if legend is visible
  110 |     await expect(page.getByText('Legend')).toBeVisible();
  111 |     await expect(page.getByText('Core Router / ISP')).toBeVisible(); // Network specific legend
  112 |   });
  113 | 
  114 |   test('STC-12: System (Dynamic Size Adjuster Clamping)', async ({ page }) => {
  115 |     await page.getByRole('button', { name: 'Network' }).click();
  116 |     await page.getByRole('button', { name: /Execute/i }).click();
  117 |     await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
  118 |     await page.getByRole('button', { name: 'Synthetic' }).click();
  119 | 
  120 |     // The dynamic size adjuster has inputs for Nodes and Links.
  121 |     // Try to set 9999 nodes
  122 |     const nodesInput = page.getByRole('spinbutton').first();
  123 |     await nodesInput.fill('9999');
  124 |     await nodesInput.blur();
  125 |     
  126 |     // Verify it clamped down to maximum allowed (e.g. 220 for network)
  127 |     await expect(nodesInput).not.toHaveValue('9999');
  128 |   });
  129 | 
  130 |   test('STC-14: System (Simulation Reset State)', async ({ page }) => {
  131 |     await page.getByRole('button', { name: 'Network' }).click();
  132 |     await page.getByRole('button', { name: /Execute/i }).click();
  133 |     await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
  134 |     await page.getByRole('button', { name: 'Synthetic' }).click();
  135 | 
  136 |     await page.getByRole('button', { name: /Run Simulations/i }).click();
  137 |     await page.waitForTimeout(500); // let it run to 50%
  138 |     await page.getByRole('button', { name: /Pause/i }).click();
  139 |     
  140 |     const resetBtn = page.getByText('🔄 Reset');
  141 |     await resetBtn.click();
  142 |     
  143 |     // Verify "Run Simulations" is back
  144 |     await expect(page.getByRole('button', { name: /Run Simulations/i })).toBeVisible();
  145 |   });
  146 | 
  147 |   test('STC-15: System (Event Rerolling)', async ({ page }) => {
  148 |     await page.getByRole('button', { name: 'Road Traffic' }).click();
  149 |     await page.getByRole('button', { name: /Execute/i }).click();
> 150 |     await expect(page.locator('h1').filter({ hasText: /traffic/i })).toBeVisible({ timeout: 15000 });
      |                                                                      ^ Error: expect(locator).toBeVisible() failed
  151 |     
  152 |     const rerollBtn = page.getByRole('button', { name: /Reroll Events/i });
  153 |     await rerollBtn.click();
  154 |     // Assuming UI does not crash, we pass
  155 |   });
  156 | 
  157 |   test('STC-16: Network Routing (Anycast Mode)', async ({ page }) => {
  158 |     await page.getByRole('button', { name: 'Network' }).click();
  159 |     await page.getByRole('button', { name: /Execute/i }).click();
  160 |     await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
  161 |     await page.getByRole('button', { name: 'Synthetic' }).click();
  162 |     await page.waitForTimeout(1000);
  163 |     
  164 |     // Find the routing mode dropdown/button
  165 |     await page.getByRole('combobox').selectOption('anycast');
  166 |     await page.getByRole('button', { name: /Run Simulations/i }).click();
  167 |     await expect(page.getByRole('button', { name: /Replay/i })).toBeVisible({ timeout: 60000 });
  168 |   });
  169 | 
  170 |   test('STC-17: Evacuation (Floor Switcher)', async ({ page }) => {
  171 |     await page.getByRole('button', { name: /Emergency Evacuation/i }).click();
  172 |     await page.getByRole('button', { name: /Execute/i }).click();
  173 |     await expect(page.locator('h1').filter({ hasText: /evacuation/i })).toBeVisible({ timeout: 15000 });
  174 |     
  175 |     await page.getByRole('button', { name: /SM City Santa Rosa/i }).click();
  176 |     await page.waitForTimeout(1000);
  177 |     
  178 |     // There should be buttons for Floor 1 and Floor 2
  179 |     await page.getByRole('button', { name: /L1 \(First\)/i }).click({ force: true });
  180 |     await page.getByRole('button', { name: /L2 \(Second\)/i }).click({ force: true });
  181 |   });
  182 | 
  183 |   test('STC-20: Live Metrics (Initialization)', async ({ page }) => {
  184 |     await page.getByRole('button', { name: 'Network' }).click();
  185 |     await page.getByRole('button', { name: /Execute/i }).click();
  186 |     await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
  187 |     
  188 |     // Verify some zero/NA values in the metrics panel
  189 |     await expect(page.getByText('0').first()).toBeVisible();
  190 |   });
  191 | 
  192 |   test('STC-21: System (Negative Node Sizing)', async ({ page }) => {
  193 |     await page.getByRole('button', { name: 'Network' }).click();
  194 |     await page.getByRole('button', { name: /Execute/i }).click();
  195 |     await expect(page.locator('h1').filter({ hasText: /network/i })).toBeVisible({ timeout: 15000 });
  196 |     await page.getByRole('button', { name: /SM City/i }).click();
  197 | 
  198 |     const nodesInput = page.getByRole('spinbutton').first();
  199 |     await nodesInput.fill('-50');
  200 |     await nodesInput.blur();
  201 |     
  202 |     // Verify it clamped to minimum
  203 |     await expect(nodesInput).not.toHaveValue('-50');
  204 |   });
  205 | });
  206 | 
```