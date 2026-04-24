import fs from "node:fs";
import path from "node:path";

interface GraphNode {
  id: string;
  label: string;
  type: "spawn" | "room" | "corridor" | "portal";
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
  type: "corridor" | "path" | "wireless";
}

interface ScenarioGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  sourceId: string;
  destinationIds: string[];
  width: number;
  height: number;
}

function generateEldenRingMap() {
  // 🗺️ GARGANTUAN CANVAS: 300,000 x 200,000
  // Forces nodes to be spread thousands of units apart so labels never overlap!
  const W = 300000;
  const H = 200000;
  const edges: GraphEdge[] = [];

  function link(from: string, to: string, latency = 15, type: "corridor" | "path" | "wireless" = "path") {
    edges.push({ id: `e_${from}_${to}`, from, to, latency, type });
    edges.push({ id: `e_${to}_${from}`, from: to, to: from, latency, type });
  }

  const nodes: GraphNode[] = [
    // ⚔️ SPAWN (Start Point - Center South)
    { id: "spawn", label: "The First Step\n(Limgrave)", type: "spawn", x: 150000, y: 140000, level: 0, buildingId: "Limgrave" },

    // 🏆 PORTALS (Destinations / Boss Arenas)
    { id: "portal_leyndell", label: "Elden Throne\n(Morgott)", type: "portal", x: 210000, y: 30000, level: 5, buildingId: "Leyndell" },
    { id: "portal_haligtree", label: "Malenia's Arena\n(Elphael)", type: "portal", x: 150000, y: 15000, level: 6, buildingId: "Haligtree" },
    { id: "portal_farum", label: "Placidusax Arena\n(Farum Azula)", type: "portal", x: 280000, y: 100000, level: 6, buildingId: "FarumAzula" },

    // 🟢 LIMGRAVE (South-Central)
    { id: "church_elleh", label: "Church of Elleh", type: "room", x: 150000, y: 125000, level: 1, buildingId: "Limgrave" },
    { id: "gatefront", label: "Gatefront Ruins", type: "room", x: 150000, y: 110000, level: 1, buildingId: "Limgrave" },
    { id: "stormgate", label: "Stormgate Pass", type: "corridor", x: 130000, y: 100000, level: 1, buildingId: "Limgrave" },
    { id: "stormveil", label: "Stormveil Castle", type: "room", x: 110000, y: 95000, level: 2, buildingId: "Limgrave" },
    // Limgrave Traps (Dead Ends)
    { id: "murkwater", label: "Murkwater Cave", type: "room", x: 170000, y: 115000, level: 1, buildingId: "Limgrave" },
    { id: "morne", label: "Castle Morne", type: "room", x: 150000, y: 180000, level: 1, buildingId: "WeepingPeninsula" },

    // 🔵 LIURNIA OF THE LAKES (West)
    { id: "lake_cliffs", label: "Lake-Facing Cliffs", type: "room", x: 90000, y: 85000, level: 2, buildingId: "Liurnia" },
    { id: "academy_gate", label: "Academy Gate Town", type: "room", x: 70000, y: 75000, level: 2, buildingId: "Liurnia" },
    { id: "raya_lucaria", label: "Raya Lucaria Academy", type: "room", x: 60000, y: 60000, level: 2, buildingId: "Liurnia" },
    { id: "caria_manor", label: "Caria Manor", type: "room", x: 30000, y: 40000, level: 3, buildingId: "Liurnia" },
    { id: "ruin_strewn", label: "Ruin-Strewn Precipice", type: "corridor", x: 90000, y: 50000, level: 3, buildingId: "Liurnia" },
    // Liurnia Trap
    { id: "village_albinaurics", label: "Village of the Albinaurics", type: "room", x: 50000, y: 95000, level: 2, buildingId: "Liurnia" },

    // 🔴 CAELID (East)
    { id: "smoldering", label: "Smoldering Church", type: "corridor", x: 180000, y: 100000, level: 2, buildingId: "Caelid" },
    { id: "rotview", label: "Rotview Balcony", type: "room", x: 200000, y: 105000, level: 3, buildingId: "Caelid" },
    { id: "sellia", label: "Sellia Town of Sorcery", type: "room", x: 230000, y: 100000, level: 3, buildingId: "Caelid" },
    { id: "redmane", label: "Redmane Castle", type: "room", x: 250000, y: 125000, level: 3, buildingId: "Caelid" },
    // Caelid Traps
    { id: "sellia_tunnel", label: "Sellia Crystal Tunnel", type: "room", x: 215000, y: 90000, level: 3, buildingId: "Caelid" },
    { id: "beast_sanctum", label: "Bestial Sanctum", type: "room", x: 240000, y: 70000, level: 3, buildingId: "Caelid" },

    // 🟡 ALTUS PLATEAU & MT. GELMIR (Central-North)
    { id: "dectus", label: "Grand Lift of Dectus", type: "corridor", x: 100000, y: 55000, level: 3, buildingId: "Altus" },
    { id: "altus_junction", label: "Altus Highway Junction", type: "room", x: 130000, y: 50000, level: 4, buildingId: "Altus" },
    { id: "windmill", label: "Windmill Village", type: "room", x: 130000, y: 30000, level: 4, buildingId: "Altus" },
    { id: "volcano_manor", label: "Volcano Manor", type: "room", x: 80000, y: 25000, level: 4, buildingId: "MtGelmir" },

    // 🟡 LEYNDELL, ROYAL CAPITAL (East of Altus)
    { id: "outer_wall", label: "Outer Wall Phantom Tree", type: "room", x: 160000, y: 50000, level: 4, buildingId: "Leyndell" },
    { id: "capital_rampart", label: "Capital Rampart", type: "corridor", x: 185000, y: 50000, level: 4, buildingId: "Leyndell" },
    { id: "avenue_balcony", label: "Avenue Balcony", type: "room", x: 210000, y: 50000, level: 5, buildingId: "Leyndell" },
    // Leyndell Trap
    { id: "subterranean", label: "Subterranean Shunning-Grounds", type: "room", x: 210000, y: 65000, level: 5, buildingId: "Leyndell" },

    // ⚪ MOUNTAINTOPS OF THE GIANTS (Far North-East)
    { id: "rold", label: "Grand Lift of Rold", type: "corridor", x: 240000, y: 45000, level: 5, buildingId: "Mountaintops" },
    { id: "zamor", label: "Zamor Ruins", type: "room", x: 260000, y: 35000, level: 5, buildingId: "Mountaintops" },
    { id: "freezing_lake", label: "Freezing Lake", type: "room", x: 280000, y: 30000, level: 5, buildingId: "Mountaintops" },
    { id: "fire_forge", label: "Forge of the Giants", type: "room", x: 280000, y: 45000, level: 5, buildingId: "Mountaintops" },

    // ❄️ CONSECRATED SNOWFIELD & HALIGTREE (Far North)
    { id: "hidden_path", label: "Hidden Path to the Haligtree", type: "corridor", x: 230000, y: 25000, level: 6, buildingId: "Snowfield" },
    { id: "ordina", label: "Ordina, Liturgical Town", type: "room", x: 210000, y: 15000, level: 6, buildingId: "Snowfield" },
    { id: "haligtree_canopy", label: "Haligtree Canopy", type: "corridor", x: 180000, y: 15000, level: 6, buildingId: "Haligtree" },

    // 🌪️ FARUM AZULA (Floating East)
    { id: "dragon_temple", label: "Dragon Temple", type: "room", x: 280000, y: 80000, level: 6, buildingId: "FarumAzula" },
  ];

  // 🔗 LINKING THE LANDS BETWEEN
  // Limgrave Links
  link("spawn", "church_elleh", 10, "path");
  link("church_elleh", "gatefront", 15, "path");
  link("gatefront", "stormgate", 20, "corridor");
  link("stormgate", "stormveil", 30, "path");
  link("gatefront", "murkwater", 25, "path"); 
  link("spawn", "morne", 50, "path"); 

  // Limgrave to Caelid
  link("gatefront", "smoldering", 40, "corridor");
  link("smoldering", "rotview", 20, "path");
  link("rotview", "sellia", 25, "path");
  link("sellia", "redmane", 35, "path");
  link("rotview", "sellia_tunnel", 20, "path"); 
  link("rotview", "beast_sanctum", 40, "path"); 

  // Limgrave to Liurnia (Through Stormveil)
  link("stormveil", "lake_cliffs", 20, "path");
  link("lake_cliffs", "academy_gate", 30, "path");
  link("academy_gate", "raya_lucaria", 25, "path");
  link("academy_gate", "caria_manor", 45, "path");
  link("lake_cliffs", "village_albinaurics", 35, "path"); 

  // Liurnia to Altus Plateau (Two Paths)
  link("raya_lucaria", "dectus", 40, "corridor");
  link("raya_lucaria", "ruin_strewn", 50, "corridor");
  link("dectus", "altus_junction", 20, "path");
  link("ruin_strewn", "altus_junction", 30, "path");

  // Altus Interconnections
  link("altus_junction", "windmill", 35, "path");
  link("altus_junction", "volcano_manor", 45, "path"); 

  // Altus to Leyndell
  link("altus_junction", "outer_wall", 30, "path");
  link("outer_wall", "capital_rampart", 15, "corridor");
  link("capital_rampart", "avenue_balcony", 20, "path");
  link("avenue_balcony", "portal_leyndell", 30, "wireless"); // DESTINATION 1
  link("avenue_balcony", "subterranean", 25, "path"); 

  // Leyndell to Mountaintops
  link("avenue_balcony", "rold", 50, "corridor");
  link("rold", "zamor", 20, "path");
  link("zamor", "freezing_lake", 30, "path");
  link("freezing_lake", "fire_forge", 40, "path");

  // Mountaintops to Farum Azula (Story Warp)
  link("fire_forge", "dragon_temple", 100, "wireless");
  link("dragon_temple", "portal_farum", 40, "wireless"); // DESTINATION 2

  // Secret Path to Haligtree
  link("rold", "hidden_path", 50, "corridor"); 
  link("hidden_path", "ordina", 30, "path");
  link("ordina", "haligtree_canopy", 40, "wireless");
  link("haligtree_canopy", "portal_haligtree", 50, "path"); // DESTINATION 3

  const graph: ScenarioGraph = {
    nodes,
    edges,
    sourceId: "spawn", 
    destinationIds: [
      "portal_leyndell",
      "portal_haligtree",
      "portal_farum"
    ],
    width: W, height: H
  };

  const outFile = path.join(process.cwd(), "src", "data", "gameai.eldenring.ts");
  fs.writeFileSync(outFile, `export const gameAIEldenRingGraph = ${JSON.stringify(graph, null, 2)};`);
  console.log("✅ WIDELY SPACED ELDEN RING GRAPH GENERATED! (Prepare to Die Edition)");
}

generateEldenRingMap();