/**
 * Real-World Network Graph Generator — Stanford AS-733 (BGP Autonomous Systems)
 *
 * Source: https://snap.stanford.edu/data/as-733.html
 * Strategy: Download the largest snapshot (as20000102.txt), parse edges,
 * crawl the network using Snowball Sampling, and enforce a clean, progressive
 * top-down flow where nodes strictly connect to neighboring tiers.
 *
 * Output: src/data/network.as733.ts
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";

// ── Config ────────────────────────────────────────────────────────────────
const TARGET_NODES = 100;      // Total nodes to keep
const CANVAS_W    = 4000000;
const CANVAS_H    = 2000000;

// AS-733 snapshot URL (January 2 2000 — largest snapshot)
const SNAP_URL = "https://snap.stanford.edu/data/as20000102.txt.gz";

// ── Types ─────────────────────────────────────────────────────────────────
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

// ── Fetch helper ──────────────────────────────────────────────────────────
function fetchGzip(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log(`📥 Fetching ${url}...`);
    const zlib = require("zlib");
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchGzip(res.headers.location!).then(resolve).catch(reject);
        return;
      }
      const gunzip = zlib.createGunzip();
      const chunks: Buffer[] = [];
      res.pipe(gunzip);
      gunzip.on("data", (chunk: Buffer) => chunks.push(chunk));
      gunzip.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      gunzip.on("error", reject);
      res.on("error", reject);
    }).on("error", reject);
  });
}

// ── Layout helpers ────────────────────────────────────────────────────────
function layeredPosition(index: number, total: number, tierY: number, W: number) {
  const spacing = W / (total + 1);
  return { x: spacing * (index + 1), y: tierY };
}

// ── Main generator ────────────────────────────────────────────────────────
async function generateAS733Network() {
  // 1. Fetch and parse
  const raw = await fetchGzip(SNAP_URL);
  const lines = raw.split("\n").filter(l => l && !l.startsWith("#"));

  const degreeMap = new Map<string, number>();
  const edgeSet: Array<[string, string]> = [];
  const adjList = new Map<string, string[]>();

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;
    const [a, b] = parts;
    
    degreeMap.set(a, (degreeMap.get(a) ?? 0) + 1);
    degreeMap.set(b, (degreeMap.get(b) ?? 0) + 1);
    edgeSet.push([a, b]);

    if (!adjList.has(a)) adjList.set(a, []);
    if (!adjList.has(b)) adjList.set(b, []);
    adjList.get(a)!.push(b);
    adjList.get(b)!.push(a);
  }

  console.log(`📊 Raw dataset: ${degreeMap.size} ASes, ${edgeSet.length} edges`);

  // 2. Snowball Sampling (Random Walk) to build an organic mesh network
  const MAX_DEGREE_ALLOWED = 50; 
  const keptNodes = new Set<string>();
  
  let seedNode = Array.from(degreeMap.entries()).find(([id, deg]) => deg >= 5 && deg <= 15)?.[0];
  if (!seedNode) seedNode = Array.from(degreeMap.keys())[0];

  const queue = [seedNode];
  keptNodes.add(seedNode);

  while (queue.length > 0 && keptNodes.size < TARGET_NODES) {
    const current = queue.shift()!;
    const neighbors = adjList.get(current) || [];
    const shuffled = neighbors.sort(() => Math.random() - 0.5);

    for (const neighbor of shuffled) {
      if (keptNodes.size >= TARGET_NODES) break;
      const neighborDegree = degreeMap.get(neighbor) ?? 0;

      if (keptNodes.has(neighbor) || neighborDegree > MAX_DEGREE_ALLOWED) {
        continue;
      }

      keptNodes.add(neighbor);
      queue.push(neighbor);
    }

    if (queue.length === 0 && keptNodes.size < TARGET_NODES) {
      const fallback = Array.from(degreeMap.entries()).find(([id, deg]) => deg >= 2 && deg <= 20 && !keptNodes.has(id))?.[0];
      if (fallback) {
        keptNodes.add(fallback);
        queue.push(fallback);
      }
    }
  }

  // Rank the collected nodes by relative degree to establish visual Tiers
  const ranked = Array.from(keptNodes)
    .sort((a, b) => (degreeMap.get(b) ?? 0) - (degreeMap.get(a) ?? 0));

  const keptSet = new Set(ranked);
  console.log(`✂️  Sampled ${TARGET_NODES} ASes forming a multi-hop mesh`);

  // 3. Assign tiers based on relative degree rank
  const tier0 = ranked.slice(0, 1);
  const tier1 = ranked.slice(1, 10);
  const tier2 = ranked.slice(10, 35);
  const tier3 = ranked.slice(35, 80);
  const tier4 = ranked.slice(80);

  const tierOf = new Map<string, number>();
  tier0.forEach(id => tierOf.set(id, 0));
  tier1.forEach(id => tierOf.set(id, 1));
  tier2.forEach(id => tierOf.set(id, 2));
  tier3.forEach(id => tierOf.set(id, 3));
  tier4.forEach(id => tierOf.set(id, 4));

  const nodeTypeOf = (tier: number): string => {
    if (tier === 0) return "datacenter";
    if (tier === 1) return "building_router";
    if (tier === 2) return "floor_router";
    if (tier === 3) return "server";
    return "access_point";
  };

  const tierY = [100000, 400000, 750000, 1150000, 1600000];

  // 4. Build node list with layered layout
  const nodes: GraphNode[] = [];
  const tiers = [tier0, tier1, tier2, tier3, tier4];
  
  tiers.forEach((group, tierIdx) => {
    group.forEach((asId, i) => {
      const { x, y } = layeredPosition(i, group.length, tierY[tierIdx], CANVAS_W);
      nodes.push({
        id: `as_${asId}`,
        label: `AS${asId}`,
        type: nodeTypeOf(tierIdx),
        x,
        y,
        level: tierIdx,
      });
    });
  });

  // 5. Filter edges — keep only adjacent-tier or same-tier peer connections
  const edges: GraphEdge[] = [];
  const seenEdges = new Set<string>();

  const latencyFor = (ta: number, tb: number): number => {
    const diff = Math.abs(ta - tb);
    if (diff === 0) return 2;   
    return 5;                  
  };

  const edgeTypeFor = (ta: number, tb: number): string => {
    if (ta <= 1 && tb <= 1) return "fiber";
    if (ta <= 2 || tb <= 2) return "ethernet";
    return "copper";
  };

  for (const [a, b] of edgeSet) {
    if (!keptSet.has(a) || !keptSet.has(b)) continue;

    const ta = tierOf.get(a) ?? 4;
    const tb = tierOf.get(b) ?? 4;

    // Ignore any edges that skip rows
    if (Math.abs(ta - tb) > 1) continue;

    const key = [a, b].sort().join("-");
    if (seenEdges.has(key)) continue;
    seenEdges.add(key);

    const latency = latencyFor(ta, tb);
    const edgeType = edgeTypeFor(ta, tb);

    edges.push({ id: `e_${a}_${b}`, from: `as_${a}`, to: `as_${b}`, latency, type: edgeType });
    edges.push({ id: `e_${b}_${a}`, from: `as_${b}`, to: `as_${a}`, latency, type: edgeType });
  }

  // 5.5 Structure Healing & Redundancy Enforcement
  // Prevent lower tiers from failing by ensuring they have multiple uplinks.
  nodes.forEach(node => {
    if (node.level === 0) return;

    // Count how many connections this node has to the tier directly above it
    const upperConnections = edges.filter(e => {
      if (e.from !== node.id) return false;
      const neighbor = nodes.find(n => n.id === e.to);
      return neighbor && neighbor.level === node.level - 1;
    });

    // Lower tiers need more uplinks to prevent single points of failure
    let targetUplinks = 1;
    if (node.level === 2) targetUplinks = 2;
    if (node.level >= 3) targetUplinks = 3;

    if (upperConnections.length < targetUplinks) {
      const upperTierNodes = nodes.filter(n => n.level === node.level - 1);
      
      // Shuffle upper tier nodes so we connect organically, not just to the first ones
      const shuffledUpper = [...upperTierNodes].sort(() => Math.random() - 0.5);
      let connectionsAdded = 0;

      for (const randomUpper of shuffledUpper) {
        if (upperConnections.length + connectionsAdded >= targetUplinks) break;

        const rawA = node.id.replace("as_", "");
        const rawB = randomUpper.id.replace("as_", "");
        const key = [rawA, rawB].sort().join("-");

        if (!seenEdges.has(key)) {
          seenEdges.add(key);
          const latency = 5;
          const edgeType = edgeTypeFor(node.level, randomUpper.level);

          edges.push({ id: `e_${rawA}_${rawB}`, from: node.id, to: randomUpper.id, latency, type: edgeType });
          edges.push({ id: `e_${rawB}_${rawA}`, from: randomUpper.id, to: node.id, latency, type: edgeType });
          connectionsAdded++;
        }
      }
    }
  });

  // 6. Source = tier-0 node
  const sourceId = `as_${tier0[0]}`;

  // 7. Destinations = last 8 access_point nodes (leaf ASes)
  const destinationIds = tier4.slice(-8).map(id => `as_${id}`);

  // 8. Connect source to all tier-1 nodes
  for (const t1 of tier1) {
    const key = [tier0[0], t1].sort().join("-");
    if (!seenEdges.has(key)) {
      seenEdges.add(key);
      edges.push({ id: `e_src_${t1}`, from: sourceId, to: `as_${t1}`, latency: 1, type: "fiber" });
      edges.push({ id: `e_${t1}_src`, from: `as_${t1}`, to: sourceId, latency: 1, type: "fiber" });
    }
  }

  const graph: ScenarioGraph = {
    nodes,
    edges,
    sourceId,
    destinationIds,
    width: CANVAS_W,
    height: CANVAS_H,
  };

  // 9. Write output
  const outPath = path.join(process.cwd(), "src", "data", "network.as733.ts");
  fs.writeFileSync(
    outPath,
    `// Auto-generated from Stanford SNAP AS-733 dataset\n// Source: https://snap.stanford.edu/data/as-733.html\n// Nodes: ${nodes.length} | Edges: ${edges.length / 2} (undirected)\nexport const as733NetworkGraph = ${JSON.stringify(graph, null, 2)};\n`
  );

  console.log(`✅ AS-733 organic mesh network generated with fortified bottom tiers!`);
  console.log(`   Nodes : ${nodes.length}`);
  console.log(`   Edges : ${edges.length / 2} undirected (${edges.length} directed)`);
  console.log(`   Source: ${sourceId}`);
  console.log(`   Output: src/data/network.as733.ts`);
}

generateAS733Network().catch(console.error);