import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import zlib from "node:zlib";

interface GraphNode { id: string; label: string; type: string; x: number; y: number; level: number; }
interface GraphEdge { id: string; from: string; to: string; latency: number; type: string; }
interface ScenarioGraph { nodes: GraphNode[]; edges: GraphEdge[]; sourceId: string; destinationIds: string[]; width: number; height: number; }

const DOWNLOAD_URL = "http://snap.stanford.edu/data/p2p-Gnutella08.txt.gz";
const TARGET_NODE_COUNT = 400; 

function generateGnutellaNetwork() {
  console.log("📥 Downloading p2p-Gnutella08 dataset from Stanford SNAP...");

  http.get(DOWNLOAD_URL, (response) => {
    if (response.statusCode !== 200) {
      console.error(`❌ Failed to download: HTTP ${response.statusCode}`);
      return;
    }

    const gunzip = zlib.createGunzip();
    response.pipe(gunzip);

    let data = "";
    gunzip.on("data", (chunk) => { data += chunk; });
    gunzip.on("end", () => {
      console.log("✅ Download complete! Parsing real-world network graph...");
      parseAndBuildGraph(data);
    });
  }).on("error", (err) => {
    console.error("❌ Network error:", err.message);
  });
}

function parseAndBuildGraph(data: string) {
  const lines = data.split('\n');
  const adjacencyList = new Map<string, Set<string>>();

  lines.forEach(line => {
    if (line.startsWith('#') || line.trim() === '') return;
    const [from, to] = line.trim().split('\t');
    if (!from || !to) return;

    if (!adjacencyList.has(from)) adjacencyList.set(from, new Set());
    if (!adjacencyList.has(to)) adjacencyList.set(to, new Set());
    
    adjacencyList.get(from)!.add(to);
    adjacencyList.get(to)!.add(from);
  });

  let maxDegree = 0;
  let sourceNodeId = "";
  for (const [node, edges] of adjacencyList.entries()) {
    if (edges.size > maxDegree) {
      maxDegree = edges.size;
      sourceNodeId = node;
    }
  }

  const visited = new Set<string>();
  const nodeLevels = new Map<string, number>();
  // 🧠 THE FIX Part 1: Track the Spanning Tree (the backbone)
  const parentMap = new Map<string, string>(); 
  
  const queue: { id: string; level: number }[] = [{ id: sourceNodeId, level: 0 }];
  
  visited.add(sourceNodeId);
  nodeLevels.set(sourceNodeId, 0);

  while (queue.length > 0 && visited.size < TARGET_NODE_COUNT) {
    const current = queue.shift()!;
    const neighbors = adjacencyList.get(current.id);
    
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          nodeLevels.set(neighbor, current.level + 1);
          parentMap.set(neighbor, current.id); // Record who discovered this node!
          queue.push({ id: neighbor, level: current.level + 1 });
          if (visited.size >= TARGET_NODE_COUNT) break;
        }
      }
    }
  }

  const W = 1600;
  const H = 1200;
  const cx = W / 2;
  const cy = H / 2;
  
  const maxLevel = Math.max(...Array.from(nodeLevels.values()));
  const radiusStep = 500 / maxLevel; 

  const nodesByLevel = new Map<number, string[]>();
  for (const [node, level] of nodeLevels.entries()) {
    if (!nodesByLevel.has(level)) nodesByLevel.set(level, []);
    nodesByLevel.get(level)!.push(node);
  }

  const nodes: GraphNode[] = [];
  const destinationIds: string[] = [];

  for (const [level, group] of nodesByLevel.entries()) {
    const count = group.length;
    const radius = level * radiusStep;

    group.forEach((nodeId, index) => {
      const angle = (index / count) * 2 * Math.PI;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);

      let type = "router";
      
      if (level === 0) {
        type = "datacenter";
      } else if (level === maxLevel || adjacencyList.get(nodeId)!.size === 1) {
        type = "access_point";
        if (destinationIds.length < 12) destinationIds.push(nodeId);
      }

      nodes.push({ id: nodeId, label: `IP-${nodeId}`, type, x, y, level });
    });
  }

  const edges: GraphEdge[] = [];
  const addedEdges = new Set<string>();

  for (const nodeId of visited) {
    const neighbors = adjacencyList.get(nodeId);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (visited.has(neighbor)) {
          const edgeId1 = `e_${nodeId}_${neighbor}`;
          const edgeId2 = `e_${neighbor}_${nodeId}`;
          
          if (!addedEdges.has(edgeId1) && !addedEdges.has(edgeId2)) {
            
            // 🧠 THE FIX Part 2: Filter the edges!
            // Is this edge part of the core backbone?
            const isSpanningTree = parentMap.get(nodeId) === neighbor || parentMap.get(neighbor) === nodeId;

            // Keep ALL backbone edges (to guarantee connectivity).
            // For the thousands of extra mesh cables, randomly keep only 10% of them.
            if (isSpanningTree || Math.random() < 0.10) {
              const latency = Math.floor(Math.random() * 10) + 1;
              edges.push({ id: edgeId1, from: nodeId, to: neighbor, latency, type: "fiber" });
              edges.push({ id: edgeId2, from: neighbor, to: nodeId, latency, type: "fiber" });
              addedEdges.add(edgeId1);
              addedEdges.add(edgeId2);
            }
          }
        }
      }
    }
  }

  if (destinationIds.length === 0 && nodes.length > 1) {
    destinationIds.push(nodes[nodes.length - 1].id);
  }

  const graph: ScenarioGraph = { nodes, edges, sourceId: sourceNodeId, destinationIds, width: W, height: H };
  
  const outPath = path.join(process.cwd(), "src", "data", "network.datacenter.ts");
  const fileContent = `// Auto-generated Sparse Stanford SNAP (p2p-Gnutella08)\nimport type { ScenarioGraph } from "../types";\n\nexport const datacenterNetworkGraph: ScenarioGraph = ${JSON.stringify(graph, null, 2)};\n`;

  fs.writeFileSync(outPath, fileContent);
  console.log(`✅ EPIC SPARSE SNAP NETWORK GENERATED!`);
  console.log(`📊 Nodes: ${nodes.length} | Edges: ${edges.length / 2} | Exits: ${destinationIds.length}`);
}

generateGnutellaNetwork();