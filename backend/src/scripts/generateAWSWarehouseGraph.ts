import fs from "node:fs";
import path from "node:path";
import { awsWarehouseGraph } from "../data/robotics.aws";

// ── Node positions (from robotics.aws.ts) ──────────────────────────────────
// shelf_d1 (10000,12000), shelf_d2 (10000,20000)
// shelf_e1 (20000,12000), shelf_e2 (20000,20000)
// shelf_e3 (30000,12000), shelf_e4 (30000,20000)
// shelf_f1 (40000,12000), shelf_f2 (40000,20000)
// clutter_a (5000,12000), clutter_b (45000,12000)
// pallet_jack (5000,20000), trash_cans (45000,20000)

// Shelf rack: 5000 wide × 5000 tall, centred on node  →  2 cols × 3 rows
const HW = 2500; // half-width
const HH = 2500; // half-height

function makeRackWalls(cx: number, cy: number) {
  const x1 = cx - HW, x2 = cx + HW;
  const y1 = cy - HH, y2 = cy + HH;
  const mx  = cx;                     // vertical centre divider
  const hy1 = y1 + (HH * 2) / 3;    // 1st horizontal divider
  const hy2 = y1 + (HH * 4) / 3;    // 2nd horizontal divider
  return [
    { x1, y1, x2, y2: y1 },          // top
    { x1: x2, y1, x2, y2 },           // right
    { x1, y1: y2, x2, y2 },           // bottom
    { x1, y1, x2: x1, y2 },           // left
    { x1, y1: hy1, x2, y2: hy1 },     // h-div 1
    { x1, y1: hy2, x2, y2: hy2 },     // h-div 2
    { x1: mx, y1, x2: mx, y2 },       // v-div
  ].map(w => ({ ...w, level: "warehouse" }));
}

export function generateAWSWarehouseGraph() {
  const walls = [
    // ── Outer Perimeter ────────────────────────────────────────────────────
    { x1: 2000, y1: 1000, x2: 48000, y2: 1000, level: "warehouse" },
    { x1: 48000, y1: 1000, x2: 48000, y2: 29000, level: "warehouse" },
    { x1: 48000, y1: 29000, x2: 2000, y2: 29000, level: "warehouse" },
    { x1: 2000, y1: 29000, x2: 2000, y2: 1000, level: "warehouse" },

    // ── Charging Bay Partition (top centre) ────────────────────────────────
    { x1: 21000, y1: 1000, x2: 21000, y2: 5000, level: "warehouse" },
    { x1: 29000, y1: 1000, x2: 29000, y2: 5000, level: "warehouse" },
    { x1: 21000, y1: 5000, x2: 23500, y2: 5000, level: "warehouse" },
    { x1: 26500, y1: 5000, x2: 29000, y2: 5000, level: "warehouse" },

    // ── Shelf Racks (only for the main 8 shelf nodes in the middle columns) ───
    ...makeRackWalls(10000, 12000),   // shelf_d1
    ...makeRackWalls(10000, 20000),   // shelf_d2
    ...makeRackWalls(20000, 12000),   // shelf_e1
    ...makeRackWalls(20000, 20000),   // shelf_e2
    ...makeRackWalls(30000, 12000),   // shelf_e3
    ...makeRackWalls(30000, 20000),   // shelf_e4
    ...makeRackWalls(40000, 12000),   // shelf_f1
    ...makeRackWalls(40000, 20000),   // shelf_f2

    // ── Packing Desk Enclosures (bottom) ───────────────────────────────────
    { x1: 8000, y1: 26500, x2: 12000, y2: 26500, level: "warehouse" },
    { x1: 12000, y1: 26500, x2: 12000, y2: 29000, level: "warehouse" },
    { x1: 8000, y1: 26500, x2: 8000, y2: 29000, level: "warehouse" },

    { x1: 38000, y1: 26500, x2: 42000, y2: 26500, level: "warehouse" },
    { x1: 38000, y1: 26500, x2: 38000, y2: 29000, level: "warehouse" },
    { x1: 42000, y1: 26500, x2: 42000, y2: 29000, level: "warehouse" },
  ];

  const updatedGraph = { ...awsWarehouseGraph, walls };

  const targetFile = path.join(__dirname, "..", "data", "robotics.aws.ts");
  fs.writeFileSync(
    targetFile,
    `export const awsWarehouseGraph = ${JSON.stringify(updatedGraph, null, 2)};\n`
  );
  console.log("✅ AWS Warehouse walls regenerated – shelf racks centred on nodes.");
}

generateAWSWarehouseGraph();