# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: stc-ui.spec.ts >> Simple Test Cases UI (STC-06 to STC-15) >> STC-16: Network Routing (Anycast Mode)
- Location: tests\stc-ui.spec.ts:157:3

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.selectOption: Test timeout of 120000ms exceeded.
Call log:
  - waiting for getByRole('combobox')
    - locator resolved to <select class="bg-gray-800 border border-gray-600 rounded text-xs font-bold text-white px-2 py-1 outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50">…</select>
  - attempting select option action
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
    - waiting 20ms
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
      - waiting 100ms
    227 × waiting for element to be visible and enabled
        - did not find some options
      - retrying select option action
        - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - button "← Back" [ref=e6]:
        - generic [ref=e7]: ←
        - generic [ref=e8]: Back
      - heading "Network Routing" [level=1] [ref=e17]
    - generic [ref=e18]:
      - button "BFS" [ref=e19] [cursor=pointer]
      - generic [ref=e22]: "|"
      - button "DFS" [ref=e23] [cursor=pointer]
      - generic [ref=e26]: "|"
      - button "Hybrid" [ref=e27] [cursor=pointer]
    - button "Result History 0" [ref=e31] [cursor=pointer]:
      - generic [ref=e32]: Result History
      - generic [ref=e33]: "0"
    - button "Help & Guide" [ref=e35] [cursor=pointer]
  - generic [ref=e37]:
    - complementary [ref=e38]:
      - button "❮" [ref=e40] [cursor=pointer]
      - generic [ref=e41]:
        - generic [ref=e42]:
          - generic [ref=e43]:
            - generic [ref=e44]: Network Routing
            - generic [ref=e45]: Step 0 / 22
          - generic [ref=e48]:
            - generic [ref=e49]:
              - generic [ref=e50]: BFS
              - generic [ref=e51]:
                - generic [ref=e52]: Visited Nodes
                - generic [ref=e53]: "0"
              - generic [ref=e54]:
                - generic [ref=e55]: Completion
                - generic [ref=e56]: 0.0%
              - generic [ref=e57]:
                - generic [ref=e58]: Total Latency
                - generic [ref=e59]: 0.0 ms
              - generic [ref=e60]:
                - generic [ref=e61]: Optimal %
                - generic [ref=e62]: N/A
              - generic [ref=e63]:
                - generic [ref=e64]: Memory
                - generic [ref=e65]: 0.000 MB
              - generic [ref=e66]:
                - generic [ref=e67]: Adaptability
                - generic [ref=e68]: "0"
            - generic [ref=e69]:
              - generic [ref=e70]: DFS
              - generic [ref=e71]:
                - generic [ref=e72]: Visited Nodes
                - generic [ref=e73]: "0"
              - generic [ref=e74]:
                - generic [ref=e75]: Completion
                - generic [ref=e76]: 0.0%
              - generic [ref=e77]:
                - generic [ref=e78]: Total Latency
                - generic [ref=e79]: 0.0 ms
              - generic [ref=e80]:
                - generic [ref=e81]: Optimal %
                - generic [ref=e82]: N/A
              - generic [ref=e83]:
                - generic [ref=e84]: Memory
                - generic [ref=e85]: 0.000 MB
              - generic [ref=e86]:
                - generic [ref=e87]: Adaptability
                - generic [ref=e88]: "0"
            - generic [ref=e89]:
              - generic [ref=e90]: HYBRID
              - generic [ref=e91]:
                - generic [ref=e92]: Visited Nodes
                - generic [ref=e93]: "0"
              - generic [ref=e94]:
                - generic [ref=e95]: Completion
                - generic [ref=e96]: 0.0%
              - generic [ref=e97]:
                - generic [ref=e98]: Total Latency
                - generic [ref=e99]: 0.0 ms
              - generic [ref=e100]:
                - generic [ref=e101]: Optimal %
                - generic [ref=e102]: N/A
              - generic [ref=e103]:
                - generic [ref=e104]: Memory
                - generic [ref=e105]: 0.000 MB
              - generic [ref=e106]:
                - generic [ref=e107]: Adaptability
                - generic [ref=e108]: "0"
        - generic [ref=e109]:
          - heading "Legend" [level=3] [ref=e110]
          - generic [ref=e111]:
            - paragraph [ref=e112]: Environment Nodes
            - generic [ref=e113]:
              - generic [ref=e114]:
                - generic [ref=e115]: 🌐
                - generic [ref=e116]: Core Router / ISP
              - generic [ref=e117]:
                - generic [ref=e118]: 🎛️
                - generic [ref=e119]: Multilayer Switch
              - generic [ref=e120]:
                - generic [ref=e121]: 🔌
                - generic [ref=e122]: Access / Floor Switch
              - generic [ref=e123]:
                - generic [ref=e124]: 📡
                - generic [ref=e125]: Wireless Access Point
              - generic [ref=e126]:
                - generic [ref=e127]: 💻
                - generic [ref=e128]: End Device (PC/Laptop)
              - generic [ref=e129]:
                - generic [ref=e130]: 🗄️
                - generic [ref=e131]: Server
              - generic [ref=e132]:
                - generic [ref=e133]: 💥
                - generic [ref=e134]: Failed Component
              - generic [ref=e135]: Explored Nodes (Stacked by Alg.)
          - generic [ref=e141]:
            - paragraph [ref=e142]: Environment Edges
            - generic [ref=e143]:
              - generic [ref=e144]: Fiber Optic
              - generic [ref=e147]: Copper Straight-Through
              - generic [ref=e150]: Copper Cross-Over
              - generic [ref=e153]: Serial / WAN
              - generic [ref=e157]: Wireless
          - generic [ref=e160]:
            - paragraph [ref=e161]: Algorithms
            - generic [ref=e162]:
              - generic [ref=e163]: BFS Path (Outer Layer)
              - generic [ref=e166]: DFS Path (Middle Layer)
              - generic [ref=e169]: Hybrid Path (Inner Layer)
              - generic [ref=e172]: Active Search Heads
    - main [ref=e180]:
      - generic [ref=e181]:
        - generic [ref=e182]:
          - generic [ref=e183]: Simultaneous Multi-Algorithm Evaluation
          - generic [ref=e184]: "Dynamic: VLAN isolation and core router failover events mid-routing"
        - generic [ref=e186]:
          - button "Synthetic" [active] [ref=e187] [cursor=pointer]
          - button "Company Business Network" [ref=e188] [cursor=pointer]
          - button "Campus Network" [ref=e189] [cursor=pointer]
        - generic [ref=e191]:
          - generic [ref=e192]: "Mode:"
          - combobox [ref=e193] [cursor=pointer]:
            - option "Default (ISP Broadcast)" [selected]
            - option "Device to Device"
      - generic [ref=e195]:
        - button "Show ▼" [ref=e197] [cursor=pointer]:
          - generic [ref=e198]: Show
          - generic [ref=e199]: ▼
        - button "Follow ▼" [ref=e201] [cursor=pointer]:
          - generic [ref=e202]: Follow
          - generic [ref=e203]: ▼
        - generic [ref=e204]:
          - generic [ref=e205]: "Zoom: 1.0x"
          - button "+" [ref=e206] [cursor=pointer]
          - button "-" [ref=e207] [cursor=pointer]
          - button "Reset" [ref=e208] [cursor=pointer]
      - generic [ref=e210]:
        - button "Reroll Events" [ref=e211] [cursor=pointer]
        - button "Reset" [ref=e212] [cursor=pointer]
        - button "Back" [disabled]
        - button "Run Simulations" [ref=e213] [cursor=pointer]
        - button "Fwd" [ref=e214] [cursor=pointer]
        - button "Skip" [ref=e215] [cursor=pointer]
    - complementary [ref=e216]:
      - button "❯" [ref=e218] [cursor=pointer]
      - generic [ref=e219]:
        - generic [ref=e221]:
          - heading "Dynamic Map Events" [level=3] [ref=e223]
          - generic [ref=e224]: No map events triggered yet...
        - generic [ref=e226]:
          - generic [ref=e227]: Dynamic Size Adjuster
          - generic [ref=e228]:
            - generic [ref=e229]:
              - generic [ref=e230]: Nodes
              - generic [ref=e231]:
                - spinbutton "Nodes" [ref=e232]: "28"
                - generic [ref=e233]:
                  - button [ref=e234] [cursor=pointer]
                  - button [ref=e237] [cursor=pointer]
            - generic [ref=e240]:
              - generic [ref=e241]: Links
              - generic [ref=e242]:
                - spinbutton "Links" [ref=e243]: "27"
                - generic [ref=e244]:
                  - button [ref=e245] [cursor=pointer]
                  - button [ref=e248] [cursor=pointer]
          - generic [ref=e251]: "Generated: 28 nodes / 27 links"
```

# Test source

```ts
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
  150 |     await expect(page.locator('h1').filter({ hasText: /traffic/i })).toBeVisible({ timeout: 15000 });
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
> 165 |     await page.getByRole('combobox').selectOption('anycast');
      |                                      ^ Error: locator.selectOption: Test timeout of 120000ms exceeded.
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