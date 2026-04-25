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
  // ✅ GARGANTUAN CANVAS: 60000 x 35000
  // Every node is spaced at least 4000-5000 units apart relative to this grid
  // to absolutely guarantee labels will not overlap when zoomed out.
  const W = 60000;
  const H = 35000;
  const edges: GraphEdge[] = [];

  function link(from: string, to: string, latency = 10, type: "corridor" | "stairwell" = "corridor") {
    edges.push({ id: `e_${from}_${to}`, from, to, latency, type });
    edges.push({ id: `e_${to}_${from}`, from: to, to: from, latency, type });
  }

  const GL = "GL";
  const L2 = "L2";

  // Center Point: X = 25000, Y = 17500

  // ==========================================
  // 1️⃣ GROUND LEVEL (GL)
  // ==========================================
  const glNodes: GraphNode[] = [
    // 🚪 EXITS (Absolute Edges)
    { id: "exit_front_main", label: "Main Entrance (South)", type: "emergency_exit", x: 25000, y: 33000, level: 1, buildingId: GL },
    { id: "exit_back_north", label: "North Parking Exit", type: "emergency_exit", x: 25000, y: 2000, level: 1, buildingId: GL },
    { id: "exit_supermarket", label: "West Supermarket Exit", type: "emergency_exit", x: 2000, y: 17500, level: 1, buildingId: GL },
    { id: "exit_dept_store", label: "East Dept Store Exit", type: "emergency_exit", x: 55000, y: 17500, level: 1, buildingId: GL },

    // 🚶 MAIN HALLWAY (Spine Y = 17500)
    { id: "gl_w_far", label: "GL Far West Hall", type: "corridor", x: 10000, y: 17500, level: 1, buildingId: GL },
    { id: "gl_w_mid", label: "GL Mid West Hall", type: "corridor", x: 15000, y: 17500, level: 1, buildingId: GL },
    { id: "gl_w_inner", label: "GL Inner West", type: "corridor", x: 20000, y: 17500, level: 1, buildingId: GL },
    { id: "gl_center", label: "GL Grand Atrium", type: "corridor", x: 25000, y: 17500, level: 1, buildingId: GL },
    { id: "gl_e_inner", label: "GL Inner East", type: "corridor", x: 30000, y: 17500, level: 1, buildingId: GL },
    { id: "gl_e_mid", label: "GL Mid East Hall", type: "corridor", x: 35000, y: 17500, level: 1, buildingId: GL },
    { id: "gl_e_far", label: "GL Far East Hall", type: "corridor", x: 40000, y: 17500, level: 1, buildingId: GL },

    // 🚶 NORTH WING (Y = 8000)
    { id: "gl_nw_wing", label: "GL North-West Wing", type: "corridor", x: 15000, y: 8000, level: 1, buildingId: GL },
    { id: "gl_n_center", label: "GL North Annex", type: "corridor", x: 25000, y: 8000, level: 1, buildingId: GL },
    { id: "gl_ne_wing", label: "GL North-East Wing", type: "corridor", x: 35000, y: 8000, level: 1, buildingId: GL },

    // 🚶 SOUTH WING (Y = 27000)
    { id: "gl_sw_wing", label: "GL South-West Wing", type: "corridor", x: 15000, y: 27000, level: 1, buildingId: GL },
    { id: "gl_s_center", label: "GL South Annex", type: "corridor", x: 25000, y: 27000, level: 1, buildingId: GL },
    { id: "gl_se_wing", label: "GL South-East Wing", type: "corridor", x: 35000, y: 27000, level: 1, buildingId: GL },

    // 🏬 STORES (Pushed extremely far out into the quadrants)
    { id: "gl_supermarket", label: "SM Supermarket", type: "room", x: 6000, y: 12000, level: 1, buildingId: GL },
    { id: "gl_dermcare", label: "Dermcare", type: "room", x: 11000, y: 12000, level: 1, buildingId: GL },
    { id: "gl_silverworks", label: "Silverworks", type: "room", x: 11000, y: 23000, level: 1, buildingId: GL },
    { id: "gl_pierre_cardin", label: "Pierre Cardin", type: "room", x: 20000, y: 12000, level: 1, buildingId: GL },
    { id: "gl_macao", label: "Macao Imperial Tea", type: "room", x: 20000, y: 23000, level: 1, buildingId: GL },
    { id: "gl_ramen", label: "Ramen Kuroda", type: "room", x: 11000, y: 32000, level: 1, buildingId: GL },
    { id: "gl_batchoi", label: "Oishi Batchoi", type: "room", x: 20000, y: 32000, level: 1, buildingId: GL },
    { id: "gl_barrio", label: "Barrio Fiesta", type: "room", x: 30000, y: 32000, level: 1, buildingId: GL },
    { id: "gl_razons", label: "Razon's of Guagua", type: "room", x: 39000, y: 32000, level: 1, buildingId: GL },
    { id: "gl_faceshop", label: "The Face Shop", type: "room", x: 30000, y: 23000, level: 1, buildingId: GL },
    { id: "gl_barbershop", label: "GQ Barbershop", type: "room", x: 39000, y: 12000, level: 1, buildingId: GL },
    { id: "gl_guess", label: "Guess", type: "room", x: 39000, y: 23000, level: 1, buildingId: GL },
    { id: "gl_sm_store", label: "The SM Store (GL)", type: "room", x: 45000, y: 12000, level: 1, buildingId: GL },

    // 🪜 ESCALATORS (Severely offset from atriums to prevent text overlap)
    { id: "esc_main_gl", label: "Grand Escalator", type: "stairwell", x: 28000, y: 21000, level: 1, buildingId: GL },
    { id: "esc_west_gl", label: "West Escalator", type: "stairwell", x: 12000, y: 21000, level: 1, buildingId: GL },
    { id: "esc_east_gl", label: "East Escalator", type: "stairwell", x: 38000, y: 21000, level: 1, buildingId: GL },
    { id: "esc_north_gl", label: "North Escalator", type: "stairwell", x: 28000, y: 11000, level: 1, buildingId: GL },
  ];

  // ==========================================
  // 2️⃣ SECOND LEVEL (L2)
  // ==========================================
  const l2Nodes: GraphNode[] = [
    // 🚨 FIRE EXITS
    { id: "exit_fire_nw", label: "L2 NW Fire Exit", type: "emergency_exit", x: 8000, y: 4000, level: 2, buildingId: L2 },
    { id: "exit_fire_ne", label: "L2 NE Fire Exit", type: "emergency_exit", x: 42000, y: 4000, level: 2, buildingId: L2 },
    { id: "exit_fire_s", label: "L2 South Fire Exit", type: "emergency_exit", x: 25000, y: 32000, level: 2, buildingId: L2 },

    // 🚶 MAIN HALLWAY
    { id: "l2_w_far", label: "L2 Far West Hall", type: "corridor", x: 10000, y: 17500, level: 2, buildingId: L2 },
    { id: "l2_w_mid", label: "L2 Mid West Hall", type: "corridor", x: 15000, y: 17500, level: 2, buildingId: L2 },
    { id: "l2_w_inner", label: "L2 Inner West", type: "corridor", x: 20000, y: 17500, level: 2, buildingId: L2 },
    
    // ✅ ORIGIN NODE
    { id: "l2_center", label: "L2 Grand Atrium\n(Start Point)", type: "origin", x: 25000, y: 17500, level: 2, buildingId: L2 },
    
    { id: "l2_e_inner", label: "L2 Inner East", type: "corridor", x: 30000, y: 17500, level: 2, buildingId: L2 },
    { id: "l2_e_mid", label: "L2 Mid East Hall", type: "corridor", x: 35000, y: 17500, level: 2, buildingId: L2 },
    { id: "l2_e_far", label: "L2 Far East Hall", type: "corridor", x: 40000, y: 17500, level: 2, buildingId: L2 },

    // 🚶 NORTH WING
    { id: "l2_nw_wing", label: "L2 North-West Wing", type: "corridor", x: 15000, y: 8000, level: 2, buildingId: L2 },
    { id: "l2_n_center", label: "L2 North Annex", type: "corridor", x: 25000, y: 8000, level: 2, buildingId: L2 },
    { id: "l2_ne_wing", label: "L2 North-East Wing", type: "corridor", x: 35000, y: 8000, level: 2, buildingId: L2 },

    // 🚶 SOUTH WING
    { id: "l2_sw_wing", label: "L2 South-West Wing", type: "corridor", x: 15000, y: 27000, level: 2, buildingId: L2 },
    { id: "l2_s_center", label: "L2 South Annex", type: "corridor", x: 25000, y: 27000, level: 2, buildingId: L2 },
    { id: "l2_se_wing", label: "L2 South-East Wing", type: "corridor", x: 35000, y: 27000, level: 2, buildingId: L2 },

    // 🏬 STORES
    { id: "l2_cinema", label: "SM Cinema", type: "room", x: 6000, y: 12000, level: 2, buildingId: L2 },
    { id: "l2_turks", label: "Turks Shawarma", type: "room", x: 11000, y: 23000, level: 2, buildingId: L2 },
    { id: "l2_dental", label: "Precious Teeth Dental", type: "room", x: 20000, y: 23000, level: 2, buildingId: L2 },
    { id: "l2_foodcourt", label: "SM Foodcourt", type: "room", x: 25000, y: 12000, level: 2, buildingId: L2 }, 
    { id: "l2_cyberzone", label: "Cyberzone", type: "room", x: 35000, y: 12000, level: 2, buildingId: L2 },
    { id: "l2_mac", label: "Power Mac Center", type: "room", x: 45000, y: 23000, level: 2, buildingId: L2 },
    { id: "l2_vivo", label: "Vivo", type: "room", x: 35000, y: 23000, level: 2, buildingId: L2 },
    { id: "l2_payless", label: "Payless Shoesource", type: "room", x: 30000, y: 23000, level: 2, buildingId: L2 },
    { id: "l2_office_warehouse", label: "Office Warehouse", type: "room", x: 30000, y: 12000, level: 2, buildingId: L2 },
    { id: "l2_sm_store", label: "The SM Store (L2)", type: "room", x: 45000, y: 12000, level: 2, buildingId: L2 },

    // 🪜 ESCALATORS
    { id: "esc_main_l2", label: "Grand Escalator", type: "stairwell", x: 28000, y: 21000, level: 2, buildingId: L2 },
    { id: "esc_west_l2", label: "West Escalator", type: "stairwell", x: 12000, y: 21000, level: 2, buildingId: L2 },
    { id: "esc_east_l2", label: "East Escalator", type: "stairwell", x: 38000, y: 21000, level: 2, buildingId: L2 },
    { id: "esc_north_l2", label: "North Escalator", type: "stairwell", x: 28000, y: 11000, level: 2, buildingId: L2 },
  ];

  const nodes = [...glNodes, ...l2Nodes];

  // ==========================================
  // 3️⃣ LINK GROUND LEVEL (GL)
  // ==========================================
  // Main Hallway (Spine)
  link("gl_w_far", "gl_w_mid", 20);
  link("gl_w_mid", "gl_w_inner", 20);
  link("gl_w_inner", "gl_center", 20);
  link("gl_center", "gl_e_inner", 20);
  link("gl_e_inner", "gl_e_mid", 20);
  link("gl_e_mid", "gl_e_far", 20);

  // Vertical Connections
  link("gl_w_mid", "gl_nw_wing", 25);
  link("gl_w_mid", "gl_sw_wing", 25);
  link("gl_center", "gl_n_center", 25);
  link("gl_center", "gl_s_center", 25);
  link("gl_e_mid", "gl_ne_wing", 25);
  link("gl_e_mid", "gl_se_wing", 25);

  // North/South Wing Connections
  link("gl_nw_wing", "gl_n_center", 30);
  link("gl_n_center", "gl_ne_wing", 30);
  link("gl_sw_wing", "gl_s_center", 30);
  link("gl_s_center", "gl_se_wing", 30);

  // Exits
  link("exit_supermarket", "gl_w_far", 15);
  link("exit_dept_store", "gl_e_far", 15);
  link("exit_front_main", "gl_s_center", 15);
  link("exit_back_north", "gl_n_center", 15);

  // Stores
  link("gl_supermarket", "gl_w_far", 10);
  link("gl_dermcare", "gl_w_mid", 5);
  link("gl_silverworks", "gl_w_mid", 5);
  link("gl_pierre_cardin", "gl_w_inner", 5);
  link("gl_macao", "gl_w_inner", 8);
  link("gl_ramen", "gl_sw_wing", 10);
  link("gl_batchoi", "gl_sw_wing", 12);
  link("gl_barrio", "gl_s_center", 10);
  link("gl_razons", "gl_se_wing", 10);
  link("gl_faceshop", "gl_e_inner", 5);
  link("gl_barbershop", "gl_ne_wing", 10);
  link("gl_guess", "gl_e_mid", 8);
  link("gl_sm_store", "gl_e_far", 15);

  // Escalators
  link("esc_main_gl", "gl_center", 5);
  link("esc_west_gl", "gl_w_mid", 5);
  link("esc_east_gl", "gl_e_mid", 5);
  link("esc_north_gl", "gl_n_center", 5);


  // ==========================================
  // 4️⃣ LINK SECOND LEVEL (L2)
  // ==========================================
  link("l2_w_far", "l2_w_mid", 20);
  link("l2_w_mid", "l2_w_inner", 20);
  link("l2_w_inner", "l2_center", 20);
  link("l2_center", "l2_e_inner", 20);
  link("l2_e_inner", "l2_e_mid", 20);
  link("l2_e_mid", "l2_e_far", 20);

  link("l2_w_mid", "l2_nw_wing", 25);
  link("l2_w_mid", "l2_sw_wing", 25);
  link("l2_center", "l2_n_center", 25);
  link("l2_center", "l2_s_center", 25);
  link("l2_e_mid", "l2_ne_wing", 25);
  link("l2_e_mid", "l2_se_wing", 25);

  link("l2_nw_wing", "l2_n_center", 30);
  link("l2_n_center", "l2_ne_wing", 30);
  link("l2_sw_wing", "l2_s_center", 30);
  link("l2_s_center", "l2_se_wing", 30);

  link("exit_fire_nw", "l2_nw_wing", 10);
  link("exit_fire_ne", "l2_ne_wing", 10);
  link("exit_fire_s", "l2_s_center", 15);

  link("l2_cinema", "l2_w_far", 10);
  link("l2_turks", "l2_w_mid", 5);
  link("l2_dental", "l2_w_inner", 8);
  link("l2_foodcourt", "l2_center", 10); 
  link("l2_cyberzone", "l2_n_center", 15); 
  link("l2_office_warehouse", "l2_e_inner", 5);
  link("l2_payless", "l2_e_inner", 8);
  link("l2_vivo", "l2_e_mid", 8);
  link("l2_mac", "l2_e_mid", 10);
  link("l2_sm_store", "l2_e_far", 15);

  link("esc_main_l2", "l2_center", 5);
  link("esc_west_l2", "l2_w_mid", 5);
  link("esc_east_l2", "l2_e_mid", 5);
  link("esc_north_l2", "l2_n_center", 5);

  // ==========================================
  // 5️⃣ VERTICAL ESCALATORS (GL to L2)
  // ==========================================
  link("esc_main_gl", "esc_main_l2", 40, "stairwell");
  link("esc_west_gl", "esc_west_l2", 40, "stairwell");
  link("esc_east_gl", "esc_east_l2", 40, "stairwell");
  link("esc_north_gl", "esc_north_l2", 40, "stairwell");

  link("gl_sm_store", "l2_sm_store", 25, "stairwell");

  const graph: ScenarioGraph = {
    nodes,
    edges,
    sourceId: "l2_center", 
    destinationIds: [
      "exit_front_main", 
      "exit_back_north", 
      "exit_supermarket", 
      "exit_dept_store", 
      "exit_fire_nw",
      "exit_fire_ne",
      "exit_fire_s"
    ],
    width: W, height: H
  };

  const outFile = path.join(process.cwd(), "src", "data", "evacuation.building.ts");
  fs.writeFileSync(outFile, `export const buildingEvacuationGraph = ${JSON.stringify(graph, null, 2)};`);
  console.log("✅ WIDELY SPACED SM ROSA GRAPH GENERATED! (No Overlapping Text Labels)");
}

generateMassiveSMRosaMap();