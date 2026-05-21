import fs from "node:fs";
import path from "node:path";

type OverpassElement =
  | { type: "node"; id: number; lat: number; lon: number; tags?: Record<string, string> }
  | { type: "way"; id: number; nodes: number[]; tags?: Record<string, string> };

type OverpassResponse = { elements: OverpassElement[] };

type ScenarioNodeType = "origin" | "highway" | "intersection" | "street" | "closed";

interface GraphNode {
  id: string;
  label: string;
  type: ScenarioNodeType;
  x: number;
  y: number;
  level: number;
  metadata?: Record<string, string | number>;
}

interface GraphEdge {
  id: string;
  from: string;
  to: string;
  latency: number;
  label?: string;
  type: "road";
}

interface ScenarioGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  sourceId: string;
  destinationIds: string[];
  width: number;
  height: number;
}

// Bounding box covering full Cabuyao boundaries (from SLEX down to the Lake shorelines)
const BBOX = { south: 14.20, west: 121.08, north: 14.32, east: 121.18 };
const W = 1200; // Expanded viewport resolution slightly for clearer scannability
const H = 900;

// ✅ EXPANDED: Included residential, unclassified, and major arterial links for thorough coverage
const HIGHWAY_REGEX = "motorway|trunk|primary|secondary|tertiary|residential|unclassified";

// ✅ ADJUSTED: 65m clustering radius keeps localized residential node blocks condensed and clean
const MERGE_RADIUS_METERS = 65; 

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function estimateSpeedKph(highway: string | undefined) {
  if (highway === "motorway") return 80;
  if (highway === "trunk") return 55;
  if (highway === "primary") return 45;
  if (highway === "secondary") return 35;
  if (highway === "tertiary") return 30;
  return 20; // Default slow speed limits for inner residential/barangay pathways
}

async function fetchOverpassRoads(): Promise<OverpassResponse> {
  const query = `[out:json][timeout:120];(way["highway"~"${HIGHWAY_REGEX}"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east}););out body;>;out skel qt;`;
  
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
  ];

  for (const url of endpoints) {
    try {
      console.log(`Connecting to Overpass Engine (${new URL(url).hostname})...`);
      const r = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
          "User-Agent": "CabuyaoTrafficMeshThesis/2.0"
        },
        body: `data=${encodeURIComponent(query)}`
      });

      const text = await r.text();
      if (!r.ok) continue;
      return JSON.parse(text) as OverpassResponse;
    } catch (err) {
      console.warn(`Endpoint connection dropped. Trying alternative node cluster...`);
    }
  }
  throw new Error("All public Overpass servers are heavily rate-limited. Retry in 60 seconds.");
}

function project(lat: number, lon: number) {
  const pad = 40;
  return {
    x: pad + ((lon - BBOX.west) / (BBOX.east - BBOX.west)) * (W - pad * 2),
    y: pad + ((BBOX.north - lat) / (BBOX.north - BBOX.south)) * (H - pad * 2)
  };
}

async function main() {
  const data = await fetchOverpassRoads();
  const osmNodes = new Map<number, { lat: number; lon: number }>();
  const ways: { nodes: number[]; tags?: Record<string, string> }[] = [];

  data.elements.forEach(el => {
    if (el.type === "node") {
      osmNodes.set(el.id, { lat: el.lat, lon: el.lon });
    } else if (el.type === "way") {
      ways.push(el);
    }
  });

  const nodeUsageCount = new Map<number, number>();
  ways.forEach(w => {
    w.nodes.forEach(id => nodeUsageCount.set(id, (nodeUsageCount.get(id) || 0) + 1));
  });

  // Pinpoint Central Center Anchor near Cabuyao City Hall
  const centerLat = 14.2766;
  const centerLon = 121.1232;
  let sourceOsm = Array.from(osmNodes.keys())[0];
  let minD = Infinity;
  
  osmNodes.forEach((p, id) => {
    const d = haversineMeters(centerLat, centerLon, p.lat, p.lon);
    if (d < minD && (nodeUsageCount.get(id) || 0) > 1) {
      minD = d;
      sourceOsm = id;
    }
  });

  // Calculate Extremities for Peripheral Escape Outlets
  let nId = sourceOsm, sId = sourceOsm, eId = sourceOsm, wId = sourceOsm;
  let maxLat = -Infinity, minLat = Infinity, maxLon = -Infinity, minLon = Infinity;

  osmNodes.forEach((p, id) => {
    if ((nodeUsageCount.get(id) || 0) <= 1) return;
    if (p.lat > maxLat) { maxLat = p.lat; nId = id; }
    if (p.lat < minLat) { minLat = p.lat; sId = id; }
    if (p.lon > maxLon) { maxLon = p.lon; eId = id; }
    if (p.lon < minLon) { minLon = p.lon; wId = id; }
  });

  const specialDestinations = new Set([nId, sId, eId, wId]);
  const junctionCandidates = new Set<number>();

  ways.forEach(w => {
    if (w.nodes.length === 0) return;
    junctionCandidates.add(w.nodes[0]);
    junctionCandidates.add(w.nodes[w.nodes.length - 1]);
    w.nodes.forEach(id => {
      if ((nodeUsageCount.get(id) || 0) > 1 || specialDestinations.has(id) || id === sourceOsm) {
        junctionCandidates.add(id);
      }
    });
  });

  // Node Clustering Optimization System
  const nodeAliases = new Map<number, number>();
  const sortedJunctions = Array.from(junctionCandidates).sort((a, b) => {
    const aW = (specialDestinations.has(a) || a === sourceOsm) ? 1 : 0;
    const bW = (specialDestinations.has(b) || b === sourceOsm) ? 1 : 0;
    return bW - aW;
  });

  for (let i = 0; i < sortedJunctions.length; i++) {
    const id1 = sortedJunctions[i];
    if (nodeAliases.has(id1)) continue;
    const p1 = osmNodes.get(id1);
    if (!p1) continue;

    for (let j = i + 1; j < sortedJunctions.length; j++) {
      const id2 = sortedJunctions[j];
      if (nodeAliases.has(id2)) continue;
      const p2 = osmNodes.get(id2);
      if (!p2) continue;

      if (haversineMeters(p1.lat, p1.lon, p2.lat, p2.lon) < MERGE_RADIUS_METERS) {
        nodeAliases.set(id2, id1);
      }
    }
  }

  const getAlias = (id: number) => nodeAliases.get(id) || id;

  // Track human-readable street names intersecting at specific locations
  const nodeStreetNames = new Map<number, Set<string>>();
  ways.forEach(w => {
    const sName = w.tags?.name || w.tags?.alt_name;
    if (sName) {
      w.nodes.forEach(rawId => {
        const aliasId = getAlias(rawId);
        if (!nodeStreetNames.has(aliasId)) nodeStreetNames.set(aliasId, new Set());
        nodeStreetNames.get(aliasId)!.add(sName);
      });
    }
  });

  const finalNodes = new Map<number, GraphNode>();
  const finalEdges: GraphEdge[] = [];

  ways.forEach((w, wayIdx) => {
    const highway = w.tags?.highway;
    const speed = estimateSpeedKph(highway);
    const streetLabel = w.tags?.name || "Local Unnamed Access";
    let lastJunctionIdx = 0;

    for (let i = 1; i < w.nodes.length; i++) {
      if (junctionCandidates.has(w.nodes[i])) {
        const uId = getAlias(w.nodes[lastJunctionIdx]);
        const vId = getAlias(w.nodes[i]);

        let distMeters = 0;
        for (let j = lastJunctionIdx; j < i; j++) {
          const p1 = osmNodes.get(w.nodes[j]);
          const p2 = osmNodes.get(w.nodes[j + 1]);
          if (p1 && p2) distMeters += haversineMeters(p1.lat, p1.lon, p2.lat, p2.lon);
        }

        const latency = (distMeters / ((speed * 1000) / 60));

        if (uId !== vId && osmNodes.has(uId) && osmNodes.has(vId)) {
          [uId, vId].forEach(id => {
            if (!finalNodes.has(id)) {
              const p = osmNodes.get(id)!;
              const { x, y } = project(p.lat, p.lon);
              
              let type: ScenarioNodeType = "street";
              let label = "";

              const localStreets = Array.from(nodeStreetNames.get(id) || []);

              if (id === sourceOsm) {
                type = "origin";
                label = "🏫 Cabuyao City Hall (Central Core)";
              } else if (specialDestinations.has(id)) {
                type = "highway";
                if (id === nId) label = "🛣️ SLEX North Bound (Santa Rosa Entry)";
                else if (id === sId) label = "🛣️ SLEX South Bound (Calamba Entry)";
                else if (id === wId) label = "⛰️ West Arterial Link (Silang Bypass)";
                else if (id === eId) label = "🌊 East Coastal Link (Bay/Lake Road)";
              } else if (localStreets.length > 1) {
                type = "intersection";
                label = `🛑 Jct: ${localStreets.slice(0, 2).join(" & ")}`;
              } else if (localStreets.length === 1) {
                type = "street";
                label = `📍 ${localStreets[0]}`;
              } else {
                type = "street";
                label = `🚗 Local Link Section #${id.toString().slice(-4)}`;
              }

              finalNodes.set(id, {
                id: `osm_n_${id}`,
                label,
                type,
                x: Math.round(x),
                y: Math.round(y),
                level: (type === "highway" || type === "origin" ? 1 : 2)
              });
            }
          });

          finalEdges.push({
            id: `e_${wayIdx}_${i}`,
            from: `osm_n_${uId}`,
            to: `osm_n_${vId}`,
            latency: parseFloat(Math.max(0.05, latency).toFixed(2)),
            label: streetLabel,
            type: "road"
          });

          if (w.tags?.oneway !== "yes") {
            finalEdges.push({
              id: `e_rev_${wayIdx}_${i}`,
              from: `osm_n_${vId}`,
              to: `osm_n_${uId}`,
              latency: parseFloat(Math.max(0.05, latency).toFixed(2)),
              label: streetLabel,
              type: "road"
            });
          }
        }
        lastJunctionIdx = i;
      }
    }
  });

  const graph: ScenarioGraph = {
    nodes: Array.from(finalNodes.values()),
    edges: finalEdges,
    sourceId: `osm_n_${sourceOsm}`,
    destinationIds: Array.from(specialDestinations).map(id => `osm_n_${id}`),
    width: W,
    height: H,
  };

  const outFile = path.join(process.cwd(), "src", "data", "traffic.cabuyao.ts");
  fs.writeFileSync(
    outFile, 
    `import type { ScenarioGraph } from "../types";\nexport const cabuyaoTrafficGraph: ScenarioGraph = ${JSON.stringify(graph, null, 2)} as ScenarioGraph;\n`
  );
  
  console.log(`\n🚀 [SUCCESS]: Cabuyao City Infrastructure Mesh Mapping Compiled!`);
  console.log(`🔹 Total Generated Structural Nodes: ${graph.nodes.length}`);
  console.log(`🔹 Total Interconnecting Road Edges: ${graph.edges.length}`);
}

main().catch(console.error);