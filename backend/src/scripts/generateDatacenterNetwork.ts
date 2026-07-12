import fs from "node:fs";
import path from "node:path";

interface GraphNode { id: string; label: string; type: string; x: number; y: number; level: number; }
interface GraphEdge { id: string; from: string; to: string; latency: number; type: string; }
interface ScenarioGraph { nodes: GraphNode[]; edges: GraphEdge[]; sourceId: string; destinationIds: string[]; width: number; height: number; }

// K-ary Fat-Tree Parameters
const k = 8;
const CORE_COUNT = (k / 2) * (k / 2); // 16
const POD_COUNT = k; // 8
const AGG_PER_POD = k / 2; // 4
const EDGE_PER_POD = k / 2; // 4
const HOSTS_PER_EDGE = k / 2; // 4

const W = 1600;
const H = 1200;

function generateFatTreeNetwork() {
  console.log(`Generating k=${k} Fat-Tree Datacenter Topology...`);

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const destinationIds: string[] = [];
  
  let sourceId = "core-0"; // Start at the first core router

  // 1. Generate Core Switches (Level 0)
  // 16 cores evenly spaced across W
  for (let i = 0; i < CORE_COUNT; i++) {
    nodes.push({
      id: `core-${i}`,
      label: `Core-${i}`,
      type: "datacenter",
      x: (W / (CORE_COUNT + 1)) * (i + 1),
      y: 150,
      level: 0
    });
  }

  // Generate Pods
  const podWidth = W / POD_COUNT;
  for (let p = 0; p < POD_COUNT; p++) {
    const podStartX = p * podWidth;
    const podCenterX = podStartX + (podWidth / 2);

    // 2. Generate Aggregation Switches (Level 1)
    for (let a = 0; a < AGG_PER_POD; a++) {
      const aggId = `pod${p}-agg${a}`;
      nodes.push({
        id: aggId,
        label: `Agg-${p}-${a}`,
        type: "building_router",
        x: podStartX + (podWidth / (AGG_PER_POD + 1)) * (a + 1),
        y: 350,
        level: 1
      });

      // Connect Aggregation to Core
      // Agg switch 'a' connects to exactly k/2 core switches.
      // Specifically: cores from (a * k/2) to (a * k/2 + k/2 - 1)
      const coreStart = a * (k / 2);
      for (let j = 0; j < k / 2; j++) {
        const coreIndex = coreStart + j;
        edges.push({
          id: `e-${aggId}-core${coreIndex}`,
          from: aggId,
          to: `core-${coreIndex}`,
          latency: 2,
          type: "fiber"
        });
      }
    }

    // 3. Generate Edge Switches (Level 2)
    for (let e = 0; e < EDGE_PER_POD; e++) {
      const edgeId = `pod${p}-edge${e}`;
      nodes.push({
        id: edgeId,
        label: `Edge-${p}-${e}`,
        type: "floor_router",
        x: podStartX + (podWidth / (EDGE_PER_POD + 1)) * (e + 1),
        y: 550,
        level: 2
      });

      // Connect Edge to all Aggregation switches in the SAME pod
      for (let a = 0; a < AGG_PER_POD; a++) {
        const aggId = `pod${p}-agg${a}`;
        edges.push({
          id: `e-${edgeId}-${aggId}`,
          from: edgeId,
          to: aggId,
          latency: 5,
          type: "fiber"
        });
      }

      // 4. Generate Hosts (Level 3)
      // We will place them in a small grid under the edge switch
      const edgeX = podStartX + (podWidth / (EDGE_PER_POD + 1)) * (e + 1);
      for (let h = 0; h < HOSTS_PER_EDGE; h++) {
        const hostId = `pod${p}-edge${e}-host${h}`;
        // Stagger X slightly around the edge switch
        const hx = edgeX + (h - 1.5) * 20; 
        // Stagger Y so they don't overlap (simulate racks)
        const hy = 750 + (h % 2) * 50;
        
        nodes.push({
          id: hostId,
          label: `Host-${p}-${e}-${h}`,
          type: "server",
          x: hx,
          y: hy,
          level: 3
        });
        
        destinationIds.push(hostId);

        edges.push({
          id: `e-${hostId}-${edgeId}`,
          from: hostId,
          to: edgeId,
          latency: 10,
          type: "copper"
        });
      }
    }
  }

  const graph: ScenarioGraph = {
    nodes,
    edges,
    sourceId,
    destinationIds,
    width: W,
    height: H
  };

  const outPath = path.join(__dirname, "..", "data", "network.datacenter.ts");
  const fileContent = `// Auto-generated k-ary Fat-Tree Topology (k=${k})
import type { ScenarioGraph } from "../types";

export const datacenterNetworkGraph: ScenarioGraph = ${JSON.stringify(graph, null, 2)};
`;

  fs.writeFileSync(outPath, fileContent, "utf8");
  console.log(`✅ FAT-TREE NETWORK GENERATED!`);
  console.log(` Nodes: ${nodes.length} | Edges: ${edges.length} | Hosts (Exits): ${destinationIds.length}`);
}

generateFatTreeNetwork();