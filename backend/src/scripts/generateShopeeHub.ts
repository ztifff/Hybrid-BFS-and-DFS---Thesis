import fs from "node:fs";
import path from "node:path";

interface GraphNode {
  id: string;
  label: string;
  type: "depot" | "zone" | "aisle" | "shelf" | "blocked";
  x: number;
  y: number;
  level: number;
  metadata?: any;
}

interface GraphEdge {
  id: string;
  from: string;
  to: string;
  latency: number;
  type: string;
}

interface ScenarioGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  sourceId: string;
  destinationIds: string[];
  width: number;
  height: number;
}

function generateShopeeHub() {
  // 📦 MASSIVE WAREHOUSE CANVAS
  const W = 5000;
  const H = 3500;
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const destinationIds: string[] = [];

  // Helper to create two-way paths
  function link(from: string, to: string, latency = 2, type = "corridor") {
    edges.push({ id: `e_${from}_${to}`, from, to, latency, type });
    edges.push({ id: `e_${to}_${from}`, from: to, to: from, latency, type });
  }

  // 1. MAIN RECEIVING DEPOT (Source)
  const sourceId = "depot_main";
  nodes.push({
    id: sourceId,
    label: "Main Receiving Bay",
    type: "depot",
    x: W / 2,
    y: 200,
    level: 0,
  });

  // 2. SORTATION ZONES (Level 1)
  const zones = [
    { id: "zone_north", label: "North Luzon Sort", x: 1000, y: 800 },
    { id: "zone_ncr", label: "NCR Mega Sort", x: W / 2, y: 800 },
    { id: "zone_south", label: "South Luzon Sort", x: 4000, y: 800 },
    { id: "zone_visayas", label: "Visayas Freight", x: 1500, y: 2500 },
    { id: "zone_mindanao", label: "Mindanao Freight", x: 3500, y: 2500 },
  ];

  // Connect Depot to all Zones
  zones.forEach((z) => {
    nodes.push({ id: z.id, label: z.label, type: "zone", x: z.x, y: z.y, level: 1 });
    link(sourceId, z.id, 10, "path");
  });

  // Cross-connect the zones so the algorithm can find detours if a conveyor breaks
  link(zones[0].id, zones[1].id, 15, "corridor");
  link(zones[1].id, zones[2].id, 15, "corridor");
  link(zones[0].id, zones[3].id, 20, "corridor");
  link(zones[2].id, zones[4].id, 20, "corridor");
  link(zones[3].id, zones[4].id, 25, "corridor");

  // 3. AISLES AND SHELVES (Levels 2 & 3)
  zones.forEach((z) => {
    // Generate 4 Aisles per Zone
    for (let a = 1; a <= 4; a++) {
      const aisleId = `${z.id}_aisle_${a}`;
      const aisleX = z.x + (a - 2.5) * 350; // Spread aisles horizontally
      const aisleY = z.y + 400;

      nodes.push({
        id: aisleId,
        label: `Aisle ${a}`,
        type: "aisle",
        x: aisleX,
        y: aisleY,
        level: 2,
      });
      link(z.id, aisleId, 5, "path");

      // Generate 5 Dispatch Shelves per Aisle
      for (let s = 1; s <= 5; s++) {
        const shelfId = `${aisleId}_shelf_${s}`;
        const shelfX = aisleX;
        const shelfY = aisleY + s * 200; // Stack shelves vertically down the aisle

        nodes.push({
          id: shelfId,
          label: `Bay ${s}`,
          type: "shelf",
          x: shelfX,
          y: shelfY,
          level: 3,
        });

        // Link shelf to the aisle
        link(aisleId, shelfId, 3, "path");
        
        // Every shelf is a valid destination for a delivery robot!
        destinationIds.push(shelfId);
      }
    }
  });

  const graph: ScenarioGraph = {
    nodes,
    edges,
    sourceId,
    destinationIds,
    width: W,
    height: H,
  };

  // 4. WRITE FILE
  const outPath = path.join(process.cwd(), "src", "data", "robotics.shopee_hub.ts");
  
  const fileContent = `// Auto-generated Shopee Cabuyao Logistics Hub
import type { ScenarioGraph } from "../types";

export const shopeeHubGraph: ScenarioGraph = ${JSON.stringify(graph, null, 2)};
`;

  fs.writeFileSync(outPath, fileContent);
  console.log(`✅ Successfully generated Shopee Cabuyao Hub with ${nodes.length} nodes and ${destinationIds.length} exit targets!`);
}

generateShopeeHub();