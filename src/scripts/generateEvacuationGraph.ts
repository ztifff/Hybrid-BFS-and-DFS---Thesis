import fs from "node:fs";
import path from "node:path";
import DxfParser from "dxf-parser";

interface GraphNode {
  id: string;
  label: string;
  type: "origin" | "emergency_exit" | "corridor" | "room" | "stairwell";
  x: number;
  y: number;
  level: number;
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

async function main() {
  const parser = new DxfParser();
  
  // ✅ DXF Filename Target
  const dxfFileName = "FloorPlan.dxf"; 
  const dxfFilePath = path.join(process.cwd(), "src", "data", "DXF", dxfFileName);

  if (!fs.existsSync(dxfFilePath)) {
    console.error(`❌ Cannot find DXF file at: ${dxfFilePath}`);
    process.exit(1);
  }

  console.log(`Loading DXF Model: ${dxfFilePath}`);
  const fileContent = fs.readFileSync(dxfFilePath, "utf-8");
  const dxf = parser.parseSync(fileContent);

  if (!dxf || !dxf.entities) {
    console.error("❌ Failed to parse DXF or file is empty.");
    process.exit(1);
  }

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // 1️⃣ EXTRACT NODES FROM GEOMETRY (Polylines/Shapes) OR TEXT
  console.log("Scanning DXF for geometry and text entities...");
  dxf.entities.forEach((entity: any, index: number) => {
    let x = 0, y = 0;
    let foundNode = false;
    let label = `Area ${index}`;

    // Priority 1: Check for Text Labels
    if (entity.type === "TEXT" || entity.type === "MTEXT") {
      x = entity.position.x;
      y = entity.position.y;
      label = entity.text || entity.value || label;
      foundNode = true;
    } 
    // Priority 2: Fallback to Geometry Centroid (The Software Engineer Fix)
    else if (entity.type === "LWPOLYLINE" || entity.type === "POLYLINE") {
      if (entity.vertices && entity.vertices.length > 2) {
        const sumX = entity.vertices.reduce((acc: number, v: any) => acc + v.x, 0);
        const sumY = entity.vertices.reduce((acc: number, v: any) => acc + v.y, 0);
        x = sumX / entity.vertices.length;
        y = sumY / entity.vertices.length;
        foundNode = true;
      }
    }

    if (foundNode) {
      // Clean up CAD formatting codes (like \P or \p)
      const cleanLabel = label.replace(/\\[Pp]/g, " ").trim();

      let type: GraphNode["type"] = "room";
      if (/corridor|hall|lobby/i.test(cleanLabel)) type = "corridor";
      if (/stair/i.test(cleanLabel)) type = "stairwell";
      if (/exit/i.test(cleanLabel)) type = "emergency_exit";

      nodes.push({
        id: `node_${index}`,
        label: cleanLabel,
        type,
        x, y,
        level: 1 // DXF is 2D, so we default to Level 1
      });
    }
  });

  if (nodes.length === 0) {
    console.error("❌ No valid shapes or text found in DXF. The file might just be loose lines.");
    process.exit(1);
  }

  // 2️⃣ NORMALIZE COORDINATES TO FIT CANVAS (1200x800)
  const W = 1200;
  const H = 800;
  const pad = 80;

  const xVals = nodes.map(n => n.x);
  const yVals = nodes.map(n => n.y);
  const minX = Math.min(...xVals);
  const maxX = Math.max(...xVals);
  const minY = Math.min(...yVals);
  const maxY = Math.max(...yVals);

  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  nodes.forEach(n => {
    const nx = (n.x - minX) / spanX;
    const ny = (n.y - minY) / spanY;
    
    n.x = pad + nx * (W - pad * 2);
    n.y = H - (pad + ny * (H - pad * 2)); // Invert Y because CAD is Y-up, Web is Y-down
  });

  // 3️⃣ GENERATE EDGES BASED ON PROXIMITY
  // Increase/Decrease PROXIMITY_THRESHOLD based on your floorplan scale.
  const PROXIMITY_THRESHOLD = 250; 

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const u = nodes[i];
      const v = nodes[j];

      const dist = Math.sqrt(Math.pow(u.x - v.x, 2) + Math.pow(u.y - v.y, 2));

      if (dist < PROXIMITY_THRESHOLD) {
        edges.push({
          id: `edge_${u.id}_${v.id}`,
          from: u.id,
          to: v.id,
          latency: Math.round(dist / 50) || 1,
          type: u.type === "stairwell" || v.type === "stairwell" ? "stairwell" : "corridor"
        });
        // Bi-directional for evacuation
        edges.push({
          id: `edge_rev_${u.id}_${v.id}`,
          from: v.id,
          to: u.id,
          latency: Math.round(dist / 50) || 1,
          type: u.type === "stairwell" || v.type === "stairwell" ? "stairwell" : "corridor"
        });
      }
    }
  }

  // 4️⃣ ASSIGN SOURCE AND EXITS
  let source = nodes.find(n => n.type === "room") || nodes[0];
  source.type = "origin";
  source.label = "Evacuee (Start)";

  const destinations = nodes
    .filter(n => n.type === "emergency_exit" || n.label.toLowerCase().includes("exit"))
    .map(n => n.id);

  // Fallback: If no exit labeled, pick nodes near the canvas edges
  if (destinations.length === 0) {
    nodes.forEach(n => {
      if (n.id !== source.id && (n.x < pad + 100 || n.x > W - pad - 100 || n.y < pad + 100 || n.y > H - pad - 100)) {
        if (destinations.length < 3) {
          n.type = "emergency_exit";
          n.label = `Emergency Exit ${destinations.length + 1}`;
          destinations.push(n.id);
        }
      }
    });
  }

  // Final Safety Check
  if (destinations.length === 0 && nodes.length > 1) {
    const fallbackExit = nodes[nodes.length - 1];
    fallbackExit.type = "emergency_exit";
    fallbackExit.label = "Emergency Exit";
    destinations.push(fallbackExit.id);
  }

  const graph: ScenarioGraph = {
    nodes,
    edges,
    sourceId: source.id,
    destinationIds: destinations,
    width: W,
    height: H
  };

  const outFile = path.join(process.cwd(), "src", "data", "evacuation.building.ts");
  fs.writeFileSync(
    outFile,
    `import type { ScenarioGraph } from "../types";\nexport const buildingEvacuationGraph: ScenarioGraph = ${JSON.stringify(graph, null, 2)} as ScenarioGraph;`
  );

  console.log(`✅ DXF Graph generated: ${nodes.length} nodes, ${edges.length} edges.`);
}

main().catch(console.error);