import fs from "node:fs";
import path from "node:path";

interface GraphNode {
  id: string;
  label: string;
  type: "origin" | "emergency_exit" | "corridor" | "room" | "stairwell" | "place";
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
  type: "corridor" | "stairwell"; // Repurposed: corridor = road, stairwell = highway/drone-path
}

interface ScenarioGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  sourceId: string;
  destinationIds: string[];
  width: number;
  height: number;
}

function generateEmergencyRoutingMap() {
  // ✅ GARGANTUAN CANVAS: 60000 x 35000 (Consistent with SM Rosa scale)
  const W = 60000;
  const H = 35000;
  const edges: GraphEdge[] = [];

  function link(from: string, to: string, latency: number, type: "corridor" | "stairwell" = "corridor") {
    edges.push({ id: `e_${from}_${to}`, from, to, latency, type });
    edges.push({ id: `e_${to}_${from}`, from: to, to: from, latency, type });
  }

  // Zone Identifiers based on CSV Region_Type
  const URBAN = "Urban_Core";
  const SUBURBAN = "Suburban_Ring";
  const RURAL = "Rural_Outskirts";

  // ==========================================
  // 1️⃣ NODES: DISPATCH & HOSPITALS (Targets)
  // ==========================================
  const facilityNodes: GraphNode[] = [
    // 🚑 CENTRAL DISPATCH (Origin Point)
    { id: "dispatch_hq", label: "Central Dispatch HQ", type: "origin", x: 30000, y: 17500, level: 1, buildingId: URBAN },

    // 🏥 HOSPITALS (Algorithm Destinations / "Exits")
    { id: "hosp_gen", label: "General Hospital (Urban)", type: "emergency_exit", x: 30000, y: 25000, level: 1, buildingId: URBAN },
    { id: "hosp_sub_north", label: "North Suburb Med Center", type: "emergency_exit", x: 30000, y: 5000, level: 1, buildingId: SUBURBAN },
    { id: "hosp_sub_east", label: "East Suburb Clinic", type: "emergency_exit", x: 50000, y: 17500, level: 1, buildingId: SUBURBAN },
    { id: "hosp_rural_west", label: "West Rural Outpost", type: "emergency_exit", x: 5000, y: 17500, level: 1, buildingId: RURAL },
  ];

  // ==========================================
  // 2️⃣ NODES: ROAD INTERSECTIONS & INCIDENTS
  // ==========================================
  const zoneNodes: GraphNode[] = [
    // --- URBAN CORE (High Congestion Area) ---
    { id: "u_int_1", label: "Urban Junction NW", type: "corridor", x: 20000, y: 12000, level: 1, buildingId: URBAN },
    { id: "u_int_2", label: "Urban Junction NE", type: "corridor", x: 40000, y: 12000, level: 1, buildingId: URBAN },
    { id: "u_int_3", label: "Urban Junction SW", type: "corridor", x: 20000, y: 22000, level: 1, buildingId: URBAN },
    { id: "u_int_4", label: "Urban Junction SE", type: "corridor", x: 40000, y: 22000, level: 1, buildingId: URBAN },
    // Incidents (Urban)
    { id: "inc_u_1", label: "⚠️ Major Accident (High Traffic)", type: "place", x: 25000, y: 15000, level: 1, buildingId: URBAN },
    { id: "inc_u_2", label: "⚠️ Cardiac Arrest (Clear)", type: "place", x: 35000, y: 15000, level: 1, buildingId: URBAN },

    // --- SUBURBAN RING (Moderate Congestion Area) ---
    { id: "s_int_n", label: "Suburban Hwy North", type: "corridor", x: 30000, y: 10000, level: 1, buildingId: SUBURBAN },
    { id: "s_int_s", label: "Suburban Hwy South", type: "corridor", x: 30000, y: 30000, level: 1, buildingId: SUBURBAN },
    { id: "s_int_w", label: "Suburban Hwy West", type: "corridor", x: 12000, y: 17500, level: 1, buildingId: SUBURBAN },
    { id: "s_int_e", label: "Suburban Hwy East", type: "corridor", x: 48000, y: 17500, level: 1, buildingId: SUBURBAN },
    // Incidents (Suburban)
    { id: "inc_s_1", label: "⚠️ Minor Accident", type: "place", x: 40000, y: 8000, level: 1, buildingId: SUBURBAN },
    { id: "inc_s_2", label: "⚠️ Fire Emergency", type: "place", x: 20000, y: 30000, level: 1, buildingId: SUBURBAN },

    // --- RURAL OUTSKIRTS (Low Congestion, Unpaved Roads) ---
    { id: "r_int_nw", label: "Rural Route NW", type: "corridor", x: 8000, y: 5000, level: 1, buildingId: RURAL },
    { id: "r_int_sw", label: "Rural Route SW", type: "corridor", x: 8000, y: 30000, level: 1, buildingId: RURAL },
    { id: "r_int_ne", label: "Rural Route NE", type: "corridor", x: 52000, y: 5000, level: 1, buildingId: RURAL },
    { id: "r_int_se", label: "Rural Route SE", type: "corridor", x: 52000, y: 30000, level: 1, buildingId: RURAL },
    // Incidents (Rural)
    { id: "inc_r_1", label: "⚠️ Tractor Accident (Unpaved)", type: "place", x: 8000, y: 12000, level: 1, buildingId: RURAL },
    { id: "inc_r_2", label: "⚠️ Medical Emergency", type: "place", x: 52000, y: 25000, level: 1, buildingId: RURAL },
  ];

  const nodes = [...facilityNodes, ...zoneNodes];

  // ==========================================
  // 3️⃣ EDGE ROUTING (Latency Based on CSV Data)
  // ==========================================
  
  // URBAN: High Traffic Congestion -> High Latency (15-25) despite short distance
  link("dispatch_hq", "inc_u_1", 20);
  link("dispatch_hq", "inc_u_2", 15);
  link("dispatch_hq", "u_int_1", 18);
  link("dispatch_hq", "u_int_2", 18);
  link("dispatch_hq", "u_int_3", 18);
  link("dispatch_hq", "u_int_4", 18);
  link("dispatch_hq", "hosp_gen", 25); // Direct to urban hospital is heavily congested

  link("u_int_1", "inc_u_1", 15);
  link("u_int_2", "inc_u_2", 15);
  link("u_int_3", "hosp_gen", 20);
  link("u_int_4", "hosp_gen", 20);

  // SUBURBAN: Highways -> Fast routing (Latency 5-10)
  // We use "stairwell" type to conceptually represent fast-lane Highways/Drone paths
  link("u_int_1", "s_int_w", 8, "stairwell");
  link("u_int_2", "s_int_e", 8, "stairwell");
  link("u_int_1", "s_int_n", 8, "stairwell");
  link("u_int_3", "s_int_s", 8, "stairwell");

  link("s_int_n", "hosp_sub_north", 5, "stairwell");
  link("s_int_e", "hosp_sub_east", 5, "stairwell");
  
  link("s_int_n", "inc_s_1", 10);
  link("s_int_s", "inc_s_2", 10);

  // RURAL: Long distances and Unpaved Roads -> Extreme Latency (30-50)
  link("s_int_w", "r_int_nw", 35);
  link("s_int_w", "r_int_sw", 35);
  link("s_int_e", "r_int_ne", 35);
  link("s_int_e", "r_int_se", 35);

  link("r_int_nw", "inc_r_1", 40);
  link("r_int_sw", "hosp_rural_west", 20);
  link("r_int_nw", "hosp_rural_west", 30);
  link("r_int_se", "inc_r_2", 45);

  const graph: ScenarioGraph = {
    nodes,
    edges,
    sourceId: "dispatch_hq", 
    destinationIds: [
      "hosp_gen", 
      "hosp_sub_north", 
      "hosp_sub_east", 
      "hosp_rural_west"
    ],
    width: W, height: H
  };

  const outFile = path.join(process.cwd(), "src", "data", "traffic.emergency.ts");
  fs.writeFileSync(outFile, `export const emergencyRoutingGraph = ${JSON.stringify(graph, null, 2)};`);
  console.log("✅ EMERGENCY ROUTING (CSV-BASED) GRAPH GENERATED!");
}

generateEmergencyRoutingMap();