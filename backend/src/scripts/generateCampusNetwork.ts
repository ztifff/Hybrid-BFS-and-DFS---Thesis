import fs from "node:fs";
import path from "node:path";

interface GraphNode { id: string; label: string; type: string; x: number; y: number; level: number; }
interface GraphEdge { id: string; from: string; to: string; latency: number; type: string; }
interface ScenarioGraph { nodes: GraphNode[]; edges: GraphEdge[]; sourceId: string; destinationIds: string[]; width: number; height: number; }

const W = 2600;
const H = 1300;

function generateCampusNetwork() {
  console.log("Generating Campus Network Topology (Precise Layout)...");

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const destinationIds: string[] = [];

  // Helper to add nodes
  function addNode(id: string, label: string, type: string, x: number, y: number, level: number) {
    nodes.push({ id, label, type, x, y, level });
    if (type === 'access_point' || type === 'end_device' || type === 'server') {
      destinationIds.push(id);
    }
  }

  function addEdge(id: string, from: string, to: string, latency: number, type: string) {
    edges.push({ id, from, to, latency, type });
  }

  // ─── Core Routers (Level 0) ───────────────────────────────────────────────
  addNode("main_router", "Main_Router", "building_router", 1300, 600, 0);
  addNode("hostel_router", "Hostel Router", "building_router", 800, 600, 0);
  addNode("college_router", "College Router", "building_router", 1800, 600, 0);

  addEdge("e-main-hostel", "main_router", "hostel_router", 10, "serial");
  addEdge("e-main-college", "main_router", "college_router", 10, "serial");

  // ─── Distribution Switches (Level 1) ──────────────────────────────────────
  addNode("sw0_server", "Sw0", "floor_router", 1300, 450, 1);
  addNode("s1_hostel", "S1", "floor_router", 650, 600, 1);
  addNode("s0_college", "S0", "floor_router", 2000, 600, 1);

  addEdge("e-main-sw0", "main_router", "sw0_server", 3, "copper_straight");
  addEdge("e-hostel-s1", "hostel_router", "s1_hostel", 3, "copper_straight");
  addEdge("e-college-s0", "college_router", "s0_college", 3, "copper_straight");

  // ─── Servers (Connected directly to Sw0) ──────────────────────────────────
  addNode("server_email", "EMAIL", "server", 1100, 300, 2);
  addNode("server_dns", "DNS", "server", 1300, 300, 2);
  addNode("server_web", "WEB", "server", 1500, 300, 2);

  addEdge("e-sw0-email", "sw0_server", "server_email", 2, "copper_straight");
  addEdge("e-sw0-dns", "sw0_server", "server_dns", 2, "copper_straight");
  addEdge("e-sw0-web", "sw0_server", "server_web", 2, "copper_straight");

  // ─── BOYS BLOCK ───────────────────────────────────────────────────────────
  addNode("ap_boys", "Boys Block AP", "wireless_ap", 500, 400, 2);
  addEdge("e-s1-ap_boys", "s1_hostel", "ap_boys", 2, "copper_straight");
  
  addNode("boys_pc1", "PC-PT\n192.168.3.6", "access_point", 300, 200, 3);
  addNode("boys_lap1", "Laptop-PT\n192.168.3.7", "access_point", 450, 150, 3);
  addNode("boys_lap2", "Laptop-PT\n192.168.3.8", "access_point", 600, 150, 3);
  addNode("boys_smart1", "Smartphone\n192.168.3.9", "access_point", 750, 250, 3);
  
  addEdge("e-ap_boys-1", "ap_boys", "boys_pc1", 5, "wireless");
  addEdge("e-ap_boys-2", "ap_boys", "boys_lap1", 5, "wireless");
  addEdge("e-ap_boys-3", "ap_boys", "boys_lap2", 5, "wireless");
  addEdge("e-ap_boys-4", "ap_boys", "boys_smart1", 5, "wireless");

  // ─── GIRLS BLOCK ──────────────────────────────────────────────────────────
  addNode("ap_girls", "Girls Block AP", "wireless_ap", 500, 800, 2);
  addEdge("e-s1-ap_girls", "s1_hostel", "ap_girls", 2, "copper_straight");

  addNode("girls_pc1", "PC-PT\n192.168.3.2", "access_point", 300, 1000, 3);
  addNode("girls_lap1", "Laptop-PT\n192.168.3.3", "access_point", 450, 1050, 3);
  addNode("girls_lap2", "Laptop-PT\n192.168.3.4", "access_point", 600, 1050, 3);
  addNode("girls_smart1", "Smartphone\n192.168.3.5", "access_point", 750, 950, 3);

  addEdge("e-ap_girls-1", "ap_girls", "girls_pc1", 5, "wireless");
  addEdge("e-ap_girls-2", "ap_girls", "girls_lap1", 5, "wireless");
  addEdge("e-ap_girls-3", "ap_girls", "girls_lap2", 5, "wireless");
  addEdge("e-ap_girls-4", "ap_girls", "girls_smart1", 5, "wireless");

  // ─── AB1 ──────────────────────────────────────────────────────────────────
  addNode("ap_ab1", "AB1 AP", "wireless_ap", 1850, 400, 2);
  addEdge("e-s0-ap_ab1", "s0_college", "ap_ab1", 2, "copper_straight");

  addNode("ab1_pc1", "PC-PT\n192.168.1.17", "access_point", 1650, 200, 3);
  addNode("ab1_lap1", "Laptop-PT\n192.168.1.16", "access_point", 1800, 150, 3);
  addNode("ab1_pc2", "PC-PT\n192.168.1.15", "access_point", 1950, 150, 3);
  addNode("ab1_lap2", "Laptop-PT\n192.168.1.14", "access_point", 2100, 250, 3);

  addEdge("e-ap_ab1-1", "ap_ab1", "ab1_pc1", 5, "wireless");
  addEdge("e-ap_ab1-2", "ap_ab1", "ab1_lap1", 5, "wireless");
  addEdge("e-ap_ab1-3", "ap_ab1", "ab1_pc2", 5, "wireless");
  addEdge("e-ap_ab1-4", "ap_ab1", "ab1_lap2", 5, "wireless");

  // ─── AB2 ──────────────────────────────────────────────────────────────────
  addNode("ap_ab2", "AB2 AP", "wireless_ap", 2450, 400, 2);
  addEdge("e-s0-ap_ab2", "s0_college", "ap_ab2", 2, "copper_straight");

  addNode("ab2_pc1", "PC-PT\n192.168.1.13", "access_point", 2300, 250, 3);
  addNode("ab2_lap1", "Laptop-PT\n192.168.1.12", "access_point", 2450, 150, 3);
  addNode("ab2_pc2", "PC-PT\n192.168.1.11", "access_point", 2600, 150, 3);
  addNode("ab2_lap2", "Laptop-PT\n192.168.1.10", "access_point", 2750, 200, 3);

  addEdge("e-ap_ab2-1", "ap_ab2", "ab2_pc1", 5, "wireless");
  addEdge("e-ap_ab2-2", "ap_ab2", "ab2_lap1", 5, "wireless");
  addEdge("e-ap_ab2-3", "ap_ab2", "ab2_pc2", 5, "wireless");
  addEdge("e-ap_ab2-4", "ap_ab2", "ab2_lap2", 5, "wireless");

  // ─── IT CONSULTING (Yellow Zone) ──────────────────────────────────────────
  addNode("ap_it", "IT AP", "wireless_ap", 1600, 800, 2);
  addEdge("e-s0-ap_it", "s0_college", "ap_it", 2, "copper_straight");

  addNode("it_pc1", "PC-PT\n192.168.1.2", "access_point", 1500, 1000, 3);
  addNode("it_pc2", "PC-PT\n192.168.1.3", "access_point", 1650, 1050, 3);
  addNode("it_lap1", "Laptop-PT\n192.168.1.4", "access_point", 1800, 1000, 3);

  addEdge("e-ap_it-1", "ap_it", "it_pc1", 5, "wireless");
  addEdge("e-ap_it-2", "ap_it", "it_pc2", 5, "wireless");
  addEdge("e-ap_it-3", "ap_it", "it_lap1", 5, "wireless");

  // ─── LIBRARY (Yellow Zone) ────────────────────────────────────────────────
  addNode("ap_lib", "Lib AP", "wireless_ap", 2100, 800, 2);
  addEdge("e-s0-ap_lib", "s0_college", "ap_lib", 2, "copper_straight");

  addNode("lib_pc1", "PC-PT\n192.168.1.5", "access_point", 1950, 1050, 3);
  addNode("lib_pc2", "PC-PT\n192.168.1.6", "access_point", 2200, 1050, 3);

  addEdge("e-ap_lib-1", "ap_lib", "lib_pc1", 5, "wireless");
  addEdge("e-ap_lib-2", "ap_lib", "lib_pc2", 5, "wireless");

  // ─── DOME AREA (Yellow Zone) ──────────────────────────────────────────────
  addNode("ap_dome", "Dome Area AP", "wireless_ap", 2600, 800, 2);
  addEdge("e-s0-ap_dome", "s0_college", "ap_dome", 2, "copper_straight");

  addNode("dome_lap1", "Laptop-PT\n192.168.1.7", "access_point", 2450, 1000, 3);
  addNode("dome_pc1", "PC-PT\n192.168.1.8", "access_point", 2600, 1050, 3);
  addNode("dome_pc2", "PC-PT\n192.168.1.9", "access_point", 2750, 1000, 3);

  addEdge("e-ap_dome-1", "ap_dome", "dome_lap1", 5, "wireless");
  addEdge("e-ap_dome-2", "ap_dome", "dome_pc1", 5, "wireless");
  addEdge("e-ap_dome-3", "ap_dome", "dome_pc2", 5, "wireless");


  const graph: ScenarioGraph = {
    nodes,
    edges,
    sourceId: "main_router",
    destinationIds, // Populated by addNode
    width: 2900,
    height: H,
  };

  const fileContent = `// SYSTEM_GENERATED - DO NOT EDIT MANUALLY
// Generated by backend/src/scripts/generateCampusNetwork.ts
import { ScenarioGraph } from '../types/index';

export const campusNetworkGraph: ScenarioGraph = ${JSON.stringify(graph, null, 2)};
`;

  const outPath = path.resolve(__dirname, "../data/network.campus.ts");
  fs.writeFileSync(outPath, fileContent, "utf-8");
  console.log("Wrote Campus Network graph to:", outPath);
  console.log("Nodes:", nodes.length, "Edges:", edges.length);
}

generateCampusNetwork();
