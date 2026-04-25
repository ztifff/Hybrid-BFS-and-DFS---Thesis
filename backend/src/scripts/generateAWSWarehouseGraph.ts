import fs from "node:fs";
import path from "node:path";

interface GraphNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  level: number;
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

function generateFatTreeDatacenter() {
  // 🌐 GIGANTIC CANVAS: 4,000,000 x 2,000,000
  const W = 4000000;
  const H = 2000000;
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  function link(from: string, to: string, latency = 2, type = "fiber") {
    edges.push({ id: `e_${from}_${to}`, from, to, latency, type });
    edges.push({ id: `e_${to}_${from}`, from: to, to: from, latency, type });
  }

  const K = 6; 
  const numCore = Math.pow(K / 2, 2); 
  const numPods = K; 
  const aggPerPod = K / 2; 
  const edgePerPod = K / 2; 
  const serversPerEdge = K / 2; 

  // 0️⃣ SOURCE NODE
  nodes.push({
    id: 'dc_source',
    label: 'START', 
    type: 'datacenter', 
    x: W / 2,
    y: 100000,
    level: 0
  });

  // 1️⃣ CORE ROUTERS
  const coreNodes: string[] = [];
  for (let i = 0; i < numCore; i++) {
    const id = `c${i}`;
    coreNodes.push(id);
    nodes.push({
      id,
      label: `C${i+1}`, 
      type: "building_router", 
      x: (i + 1) * (W / (numCore + 1)),
      y: 350000,
      level: 1,
    });
    link('dc_source', id, 1, 'fiber');
  }

  const allAPs: string[] = [];
  let aggIndexCount = 0;
  let edgeIndexCount = 0;
  let serverIndexCount = 1;

  // 2️⃣ PODS
  for (let p = 0; p < numPods; p++) {
    const aggNodes: string[] = [];
    for (let a = 0; a < aggPerPod; a++) {
      const id = `p${p}_a${a}`;
      aggNodes.push(id);
      aggIndexCount++;
      nodes.push({
        id,
        label: `Agg${aggIndexCount}`, 
        type: "building_router",
        x: aggIndexCount * (W / 19), 
        y: 650000,
        level: 2,
      });

      const coreStride = Math.floor(numCore / aggPerPod);
      for (let c = 0; c < coreStride; c++) {
        const coreIndex = a * coreStride + c;
        link(id, coreNodes[coreIndex], 5, "fiber");
      }
    }

    for (let e = 0; e < edgePerPod; e++) {
      const id = `p${p}_e${e}`;
      edgeIndexCount++;
      const currentEdgeX = edgeIndexCount * (W / 19);

      nodes.push({
        id,
        label: `E${edgeIndexCount}`, 
        type: "floor_router",
        x: currentEdgeX,
        y: 950000,
        level: 3,
      });

      for (let a = 0; a < aggPerPod; a++) {
        link(id, aggNodes[a], 3, "ethernet");
      }

      // 3️⃣ SERVERS (Tier 4)
      // 🚀 EXTREME VERTICAL STAGGER: Dropping tiers deep to prevent text overlap
      for (let s = 0; s < serversPerEdge; s++) {
        const sid = `ap_${p}_${e}_${s}`;
        allAPs.push(sid);
        
        let serverX = currentEdgeX;
        let serverY = 1250000;

        if (s === 0) {
            serverX = currentEdgeX - 40000;
            serverY = 1250000;
        } else if (s === 1) {
            serverX = currentEdgeX;
            serverY = 1550000; // Deep drop
        } else if (s === 2) {
            serverX = currentEdgeX + 40000;
            serverY = 1850000; // Deepest drop
        }

        nodes.push({
          id: sid,
          label: `#${serverIndexCount}`, // 🚀 Micro-label: Just the number
          type: "access_point",
          x: serverX,
          y: serverY,
          level: 4,
        });
        serverIndexCount++;
        link(sid, id, 1, "ethernet");
      }
    }
  }

  // Pick 8 targets, ensuring they aren't the source
  const destinationIds = allAPs.slice(-10).slice(0, 8); 

  const graph: ScenarioGraph = {
    nodes,
    edges,
    sourceId: 'dc_source',
    destinationIds,
    width: W,
    height: H
  };

  const outFile = path.join(process.cwd(), "src", "data", "network.datacenter.ts");
  fs.writeFileSync(outFile, `export const datacenterNetworkGraph = ${JSON.stringify(graph, null, 2)};`);
  console.log(`✅ EPIC DATACENTER REGENERATED!`);
}

generateFatTreeDatacenter();