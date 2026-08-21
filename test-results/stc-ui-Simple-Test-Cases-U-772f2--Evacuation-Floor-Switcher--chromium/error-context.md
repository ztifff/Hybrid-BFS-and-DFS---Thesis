# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: stc-ui.spec.ts >> Simple Test Cases UI (STC-06 to STC-15) >> STC-17: Evacuation (Floor Switcher)
- Location: tests\stc-ui.spec.ts:170:3

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: locator.click: Test timeout of 120000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /L1 \(First\)/i })

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
            - generic [ref=e42]: Step 0 / 24
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
            - option "[GL] Barrio Fiesta"
            - option "[GL] Dermcare"
            - option "[GL] GQ Barbershop"
            - option "[GL] Guess"
            - option "[GL] Macao Imperial Tea"
            - option "[GL] Oishi Batchoi"
            - option "[GL] Pierre Cardin"
            - option "[GL] Ramen Kuroda"
            - option "[GL] Razon's of Guagua"
            - option "[GL] Silverworks"
            - option "[GL] SM Supermarket"
            - option "[GL] The Face Shop"
            - option "[GL] The SM Store (GL)"
            - option "[L2] Cyberzone"
            - option "[L2] L2 Grand Atrium - (Start Point)" [selected]
            - option "[L2] Office Warehouse"
            - option "[L2] Payless Shoesource"
            - option "[L2] Power Mac Center"
            - option "[L2] Precious Teeth Dental"
            - option "[L2] SM Cinema"
            - option "[L2] SM Foodcourt"
            - option "[L2] The SM Store (L2)"
            - option "[L2] Turks Shawarma"
            - option "[L2] Vivo"
      - generic [ref=e176]:
        - button "Show ▼" [ref=e178] [cursor=pointer]:
          - generic [ref=e179]: Show
          - generic [ref=e180]: ▼
        - button "Follow ▼" [ref=e182] [cursor=pointer]:
          - generic [ref=e183]: Follow
          - generic [ref=e184]: ▼
        - generic [ref=e185]:
          - button "GL (Ground)" [ref=e186] [cursor=pointer]
          - button "L2 (Second)" [ref=e187] [cursor=pointer]
        - generic [ref=e188]:
          - generic [ref=e189]: "Zoom: 1.0x"
          - button "+" [ref=e190] [cursor=pointer]
          - button "-" [ref=e191] [cursor=pointer]
          - button "Reset" [ref=e192] [cursor=pointer]
      - generic [ref=e194]:
        - button "Reroll Events" [ref=e195] [cursor=pointer]
        - button "Reset" [ref=e196] [cursor=pointer]
        - button "Back" [disabled]
        - button "Run Simulations" [ref=e197] [cursor=pointer]
        - button "Fwd" [ref=e198] [cursor=pointer]
        - button "Skip" [ref=e199] [cursor=pointer]
    - complementary [ref=e200]:
      - button "❯" [ref=e202] [cursor=pointer]
      - generic [ref=e205]:
        - heading "Dynamic Map Events" [level=3] [ref=e207]
        - generic [ref=e208]:
          - generic "Click to locate on map" [ref=e209] [cursor=pointer]:
            - generic [ref=e210]:
              - generic [ref=e211]: "[0]"
              - generic [ref=e212]: ⛔ 🧱 Debris at L2 North-East Wing
          - generic "Click to locate on map" [ref=e213] [cursor=pointer]:
            - generic [ref=e214]:
              - generic [ref=e215]: "[0]"
              - generic [ref=e216]: ⛔ 🔒 Shutter Lockout / Trapped Exit at GL South Annex
```

# Test source

```ts
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
> 179 |     await page.getByRole('button', { name: /L1 \(First\)/i }).click({ force: true });
      |                                                               ^ Error: locator.click: Test timeout of 120000ms exceeded.
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