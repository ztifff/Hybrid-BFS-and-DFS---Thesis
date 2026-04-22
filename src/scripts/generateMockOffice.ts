import fs from "node:fs";
import path from "node:path";

interface GraphNode {
  id: string;
  label: string;
  type: "origin" | "emergency_exit" | "corridor" | "room" | "stairwell";
  x: number;
  y: number;
  level: number;
  buildingId?: string;
}

interface GraphEdge {
  id: string;
  from: string;
  to: string;
  latency: number;
  type: "corridor" | "stairwell";
}

interface ScenarioGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  sourceId: string;
  destinationIds: string[];
  width: number;
  height: number;
}

function generateMassiveSMRosaMap() {
  // Expanded canvas to fit the sprawling SM layout
  const W = 1600;
  const H = 900;
  const edges: GraphEdge[] = [];

  function link(from: string, to: string, latency = 2, type: "corridor" | "stairwell" = "corridor") {
    edges.push({ id: `e_${from}_${to}`, from, to, latency, type });
    edges.push({ id: `e_${to}_${from}`, from: to, to: from, latency, type });
  }

  const GL = "GL";
  const L2 = "L2";

  // ==========================================
  // 1️⃣ GROUND LEVEL (GL)
  // ==========================================
  const glNodes: GraphNode[] = [
    // 🚪 EXITS
    { id: "exit_main", label: "Main Atrium Exit", type: "emergency_exit", x: 800, y: 800, level: 1, buildingId: GL },
    { id: "exit_supermarket", label: "Supermarket Exit", type: "emergency_exit", x: 100, y: 450, level: 1, buildingId: GL },
    { id: "exit_east", label: "East Wing Exit", type: "emergency_exit", x: 1400, y: 800, level: 1, buildingId: GL },
    { id: "exit_north", label: "North Parkway Exit", type: "emergency_exit", x: 800, y: 100, level: 1, buildingId: GL },

    // 🚶 MAIN SPINE CORRIDORS (Y = 450)
    { id: "c1_w3", label: "GL Far West Hall", type: "corridor", x: 250, y: 450, level: 1, buildingId: GL },
    { id: "c1_w2", label: "GL Mid West Hall", type: "corridor", x: 450, y: 450, level: 1, buildingId: GL },
    { id: "c1_w1", label: "GL West Atrium", type: "corridor", x: 600, y: 450, level: 1, buildingId: GL },
    // Center Node for GL
    { id: "c1_atrium", label: "GL Main Atrium", type: "corridor", x: 800, y: 450, level: 1, buildingId: GL },
    { id: "c1_e1", label: "GL East Atrium", type: "corridor", x: 1000, y: 450, level: 1, buildingId: GL },
    { id: "c1_e2", label: "GL Mid East Hall", type: "corridor", x: 1150, y: 450, level: 1, buildingId: GL },
    { id: "c1_e3", label: "GL Far East Hall", type: "corridor", x: 1350, y: 450, level: 1, buildingId: GL },

    // 🚶 PARALLEL CORRIDORS (To create algorithm loops)
    { id: "c1_north_loop", label: "GL North Annex", type: "corridor", x: 800, y: 250, level: 1, buildingId: GL },
    { id: "c1_south_loop", label: "GL South Annex", type: "corridor", x: 800, y: 650, level: 1, buildingId: GL },

    // 🏬 ANCHOR STORES & RETAIL
    { id: "sm_supermarket", label: "SM Supermarket", type: "room", x: 200, y: 300, level: 1, buildingId: GL },
    { id: "hardware", label: "Ace Hardware", type: "room", x: 300, y: 650, level: 1, buildingId: GL },
    { id: "watsons", label: "Watsons", type: "room", x: 450, y: 300, level: 1, buildingId: GL },
    { id: "bdo", label: "BDO / Banking", type: "room", x: 600, y: 250, level: 1, buildingId: GL },
    { id: "starbucks", label: "Starbucks", type: "room", x: 700, y: 650, level: 1, buildingId: GL },
    { id: "jollibee", label: "Jollibee", type: "room", x: 900, y: 650, level: 1, buildingId: GL },
    { id: "kfc", label: "KFC", type: "room", x: 1000, y: 650, level: 1, buildingId: GL },
    { id: "uniqlo", label: "Uniqlo", type: "room", x: 1000, y: 250, level: 1, buildingId: GL },
    { id: "sm_store_gl", label: "The SM Store (GL)", type: "room", x: 1450, y: 450, level: 1, buildingId: GL },

    // 🪜 ESCALATORS
    { id: "esc_atrium_gl", label: "Main Escalator", type: "stairwell", x: 800, y: 550, level: 1, buildingId: GL },
    { id: "esc_west_gl", label: "West Escalator", type: "stairwell", x: 500, y: 450, level: 1, buildingId: GL },
    { id: "esc_east_gl", label: "East Escalator", type: "stairwell", x: 1100, y: 450, level: 1, buildingId: GL },
  ];

  // ==========================================
  // 2️⃣ SECOND LEVEL (L2)
  // ==========================================
  const l2Nodes: GraphNode[] = [
    // 🚨 FIRE EXITS (L2 Specific)
    { id: "exit_fire_l2", label: "L2 Cinema Fire Exit", type: "emergency_exit", x: 200, y: 150, level: 2, buildingId: L2 },
    { id: "exit_fire_east_l2", label: "L2 East Fire Exit", type: "emergency_exit", x: 1400, y: 150, level: 2, buildingId: L2 },

    // 🚶 MAIN SPINE CORRIDORS (Y = 450, exactly above GL)
    { id: "c2_w3", label: "L2 Far West Hall", type: "corridor", x: 250, y: 450, level: 2, buildingId: L2 },
    { id: "c2_w2", label: "L2 Mid West Hall", type: "corridor", x: 450, y: 450, level: 2, buildingId: L2 },
    { id: "c2_w1", label: "L2 West Atrium", type: "corridor", x: 600, y: 450, level: 2, buildingId: L2 },
    
    // ✅ THE FIX: Center Node becomes the Starting Origin
    { id: "c2_atrium", label: "L2 Main Atrium\n(Start Point)", type: "origin", x: 800, y: 450, level: 2, buildingId: L2 },
    
    { id: "c2_e1", label: "L2 East Atrium", type: "corridor", x: 1000, y: 450, level: 2, buildingId: L2 },
    { id: "c2_e2", label: "L2 Mid East Hall", type: "corridor", x: 1150, y: 450, level: 2, buildingId: L2 },
    { id: "c2_e3", label: "L2 Far East Hall", type: "corridor", x: 1350, y: 450, level: 2, buildingId: L2 },

    // 🚶 PARALLEL CORRIDORS
    { id: "c2_north_loop", label: "L2 North Annex", type: "corridor", x: 800, y: 250, level: 2, buildingId: L2 },
    { id: "c2_south_loop", label: "L2 South Annex", type: "corridor", x: 800, y: 650, level: 2, buildingId: L2 },

    // 🏬 ANCHOR STORES & RETAIL
    { id: "cinema", label: "SM Cinema", type: "room", x: 250, y: 250, level: 2, buildingId: L2 },
    { id: "arcade", label: "Timezone / Arcade", type: "room", x: 300, y: 650, level: 2, buildingId: L2 },
    { id: "medical_city", label: "Medical City Clinic", type: "room", x: 450, y: 300, level: 2, buildingId: L2 },
    { id: "foodcourt", label: "Foodcourt", type: "room", x: 600, y: 250, level: 2, buildingId: L2 },
    { id: "surplus", label: "Surplus Shop", type: "room", x: 700, y: 650, level: 2, buildingId: L2 },
    { id: "hm", label: "H&M", type: "room", x: 900, y: 650, level: 2, buildingId: L2 },
    { id: "toys_r_us", label: "Toys R Us", type: "room", x: 1000, y: 650, level: 2, buildingId: L2 },
    { id: "cyberzone", label: "Cyberzone", type: "room", x: 1150, y: 250, level: 2, buildingId: L2 },
    { id: "sm_store_l2", label: "The SM Store (L2)", type: "room", x: 1450, y: 450, level: 2, buildingId: L2 },

    // 🪜 ESCALATORS
    { id: "esc_atrium_l2", label: "Main Escalator", type: "stairwell", x: 800, y: 550, level: 2, buildingId: L2 },
    { id: "esc_west_l2", label: "West Escalator", type: "stairwell", x: 500, y: 450, level: 2, buildingId: L2 },
    { id: "esc_east_l2", label: "East Escalator", type: "stairwell", x: 1100, y: 450, level: 2, buildingId: L2 },
  ];

  const nodes = [...glNodes, ...l2Nodes];

  // ==========================================
  // 3️⃣ LINK GROUND LEVEL (GL)
  // ==========================================
  // The Spine
  link("c1_w3", "c1_w2", 1);
  link("c1_w2", "esc_west_gl", 1);
  link("esc_west_gl", "c1_w1", 1);
  link("c1_w1", "c1_atrium", 1);
  link("c1_atrium", "c1_e1", 1);
  link("c1_e1", "esc_east_gl", 1);
  link("esc_east_gl", "c1_e2", 1);
  link("c1_e2", "c1_e3", 1);

  // Exits
  link("exit_supermarket", "c1_w3", 1);
  link("exit_supermarket", "sm_supermarket", 1); // Supermarket has its own door
  link("exit_main", "c1_south_loop", 1);
  link("exit_east", "c1_e3", 1);
  link("exit_north", "c1_north_loop", 1);

  // Loops & Complex Paths
  link("c1_north_loop", "c1_w1", 2);
  link("c1_north_loop", "c1_atrium", 1);
  link("c1_north_loop", "c1_e1", 2);
  link("c1_south_loop", "c1_w1", 2);
  link("c1_south_loop", "c1_atrium", 1);
  link("c1_south_loop", "c1_e1", 2);
  link("c1_atrium", "esc_atrium_gl", 1);
  link("c1_south_loop", "esc_atrium_gl", 1); // Escalator connects to main and south loop

  // Stores
  link("sm_supermarket", "c1_w3", 2);
  link("hardware", "c1_w3", 2);
  link("watsons", "c1_w2", 2);
  link("bdo", "c1_north_loop", 2);
  link("bdo", "c1_w1", 3); // Corner store connects to two halls
  link("starbucks", "c1_south_loop", 2);
  link("jollibee", "c1_south_loop", 2);
  link("kfc", "c1_e1", 2);
  link("uniqlo", "c1_north_loop", 2);
  link("sm_store_gl", "c1_e3", 2);

  // ==========================================
  // 4️⃣ LINK SECOND LEVEL (L2)
  // ==========================================
  // The Spine
  link("c2_w3", "c2_w2", 1);
  link("c2_w2", "esc_west_l2", 1);
  link("esc_west_l2", "c2_w1", 1);
  link("c2_w1", "c2_atrium", 1);
  link("c2_atrium", "c2_e1", 1);
  link("c2_e1", "esc_east_l2", 1);
  link("esc_east_l2", "c2_e2", 1);
  link("c2_e2", "c2_e3", 1);

  // Loops & Complex Paths
  link("c2_north_loop", "c2_w1", 2);
  link("c2_north_loop", "c2_atrium", 1);
  link("c2_north_loop", "c2_e1", 2);
  link("c2_south_loop", "c2_w1", 2);
  link("c2_south_loop", "c2_atrium", 1);
  link("c2_south_loop", "c2_e1", 2);
  link("c2_atrium", "esc_atrium_l2", 1);
  link("c2_south_loop", "esc_atrium_l2", 1);

  // 🚨 Fire Exits 
  link("exit_fire_l2", "cinema", 1); // Dedicated Fire exit in cinema!
  link("exit_fire_east_l2", "c2_e3", 1);

  // Stores
  link("cinema", "c2_w3", 2);
  link("arcade", "c2_w3", 2);
  link("medical_city", "c2_w2", 2);
  link("foodcourt", "c2_north_loop", 2);
  link("foodcourt", "c2_atrium", 3); // Foodcourt spills into atrium
  link("surplus", "c2_south_loop", 2);
  link("hm", "c2_south_loop", 2);
  link("toys_r_us", "c2_e1", 2);
  link("cyberzone", "c2_e2", 2);
  link("sm_store_l2", "c2_e3", 2);

  // Sneaky connections (DFS loves to get lost here)
  link("cyberzone", "c2_north_loop", 4);
  link("medical_city", "cinema", 3);

  // ==========================================
  // 5️⃣ LINK ESCALATORS (GL to L2)
  // ==========================================
  // High latency (5) to simulate stairs/escalator travel time
  link("esc_atrium_gl", "esc_atrium_l2", 5, "stairwell");
  link("esc_west_gl", "esc_west_l2", 5, "stairwell");
  link("esc_east_gl", "esc_east_l2", 5, "stairwell");

  // Inside the SM Store, there is always a private escalator!
  link("sm_store_gl", "sm_store_l2", 4, "stairwell");

  const graph: ScenarioGraph = {
    nodes,
    edges,
    // ✅ THE FIX: The simulation now starts exactly in the center of the canvas!
    sourceId: "c2_atrium",
    destinationIds: [
      "exit_main", 
      "exit_supermarket", 
      "exit_east", 
      "exit_north", 
      "exit_fire_l2", 
      "exit_fire_east_l2"
    ],
    width: W, height: H
  };

  const outFile = path.join(process.cwd(), "src", "data", "evacuation.building.ts");
  fs.writeFileSync(outFile, `export const buildingEvacuationGraph = ${JSON.stringify(graph, null, 2)};`);
  console.log("✅ MASSIVE SM Rosa Graph Generated! (Starting Point Centered)");
}

generateMassiveSMRosaMap();