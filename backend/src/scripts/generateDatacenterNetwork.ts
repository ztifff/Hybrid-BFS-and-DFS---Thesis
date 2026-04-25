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
  nodes.push({ id: 'dc_source', label: 'START', type: 'datacenter', x: W / 2, y: 100000, level: 0 });

  // 1️⃣ CORE ROUTERS
  const coreNodes: string[] = [];
  for (let i = 0; i < numCore; i++) {
    const id = `c${i}`;
    coreNodes.push(id);
    nodes.push({ id, label: `C${i+1}`, type: "building_router", x: (i + 1) * (W / (numCore + 1)), y: 350000, level: 1 });
    link('dc_source', id, 1, 'fiber');
  }

  const allLeafNodes: string[] = [];
  let serverCount = 1;

  // 2️⃣ PODS
  for (let p = 0; p < numPods; p++) {
    const podXStart = (p) * (W / numPods) + (W / (numPods * 2));
    const aggNodes: string[] = [];

    for (let a = 0; a < aggPerPod; a++) {
      const id = `p${p}_a${a}`;
      aggNodes.push(id);
      nodes.push({ id, label: `A${p}${a}`, type: "building_router", x: podXStart + (a - 1) * 150000, y: 650000, level: 2 });
      const coreStride = Math.floor(numCore / aggPerPod);
      for (let c = 0; c < coreStride; c++) link(id, coreNodes[a * coreStride + c], 5, "fiber");
    }

    for (let e = 0; e < edgePerPod; e++) {
      const id = `p${p}_e${e}`;
      const edgeX = podXStart + (e - 1) * 150000;
      nodes.push({ id, label: `E${p}${e}`, type: "floor_router", x: edgeX, y: 950000, level: 3 });
      for (let a = 0; a < aggPerPod; a++) link(id, aggNodes[a], 3, "ethernet");

      for (let s = 0; s < serversPerEdge; s++) {
        const sid = `s_${p}_${e}_${s}`;
        allLeafNodes.push(sid);
        let yStagger = (s === 1) ? 1550000 : (s === 2) ? 1850000 : 1250000;
        nodes.push({
          id: sid,
          label: `#${serverCount++}`,
          type: "server", // Base type is neutral server
          x: edgeX + (s - 1) * 45000,
          y: yStagger,
          level: 4,
        });
        link(sid, id, 1, "ethernet");
      }
    }
  }

  // 3️⃣ DEFAULT EXITS (8 targets at the end of the list)
  const destinationIds = allLeafNodes.slice(-8);
  destinationIds.forEach(id => {
    const node = nodes.find(n => n.id === id);
    if (node) node.type = 'access_point'; // Mark as red target
  });

  const graph: ScenarioGraph = { nodes, edges, sourceId: 'dc_source', destinationIds, width: W, height: H };
  fs.writeFileSync(path.join(process.cwd(), "src", "data", "network.datacenter.ts"), `export const datacenterNetworkGraph = ${JSON.stringify(graph, null, 2)};`);
  console.log(`✅ EPIC DATACENTER GENERATED!`);
}
generateFatTreeDatacenter();