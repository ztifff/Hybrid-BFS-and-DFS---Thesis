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

const BBOX = { south: 14.20, west: 121.08, north: 14.32, east: 121.18 };
const W = 1000;
const H = 760;
const HIGHWAY_REGEX = "motorway|trunk|primary|secondary|tertiary";

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
  if (highway === "trunk") return 60;
  if (highway === "primary") return 50;
  if (highway === "secondary") return 40;
  if (highway === "tertiary") return 35;
  return 35;
}

async function fetchOverpassRoads(): Promise<OverpassResponse> {
  const query = `[out:json][timeout:90];(way["highway"~"${HIGHWAY_REGEX}"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east}););out body;>;out skel qt;`;
  
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
  ];

  for (const url of endpoints) {
    try {
      console.log(`Connecting to Overpass (${new URL(url).hostname})...`);
      
      const r = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
          "User-Agent": "HybridBFSDFSPerformanceThesis/1.0 (contact: student-researcher@example.com)"
        },
        body: `data=${encodeURIComponent(query)}`
      });

      const text = await r.text();

      if (!r.ok) {
        console.warn(`Server ${new URL(url).hostname} returned ${r.status}. Trying next...`);
        continue;
      }

      try {
        return JSON.parse(text) as OverpassResponse;
      } catch (e) {
        console.warn(`Server ${new URL(url).hostname} sent non-JSON response. Trying next...`);
        continue;
      }
    } catch (err) {
      console.warn(`Could not reach ${new URL(url).hostname}. Trying next...`);
    }
  }
  
  throw new Error("All Overpass servers rejected the request or are unreachable. Please wait 2 minutes for the rate-limit to reset and try again.");
}

function project(nodes: { lat: number; lon: number }[]) {
  const pad = 20;
  return (lat: number, lon: number) => ({
    x: pad + ((lon - BBOX.west) / (BBOX.east - BBOX.west)) * (W - pad * 2),
    y: pad + ((BBOX.north - lat) / (BBOX.north - BBOX.south)) * (H - pad * 2)
  });
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
  ways.forEach(w => w.nodes.forEach(id => nodeUsageCount.set(id, (nodeUsageCount.get(id) || 0) + 1)));

  // Find Center (Start Node)
  const centerLat = (BBOX.south + BBOX.north) / 2;
  const centerLon = (BBOX.west + BBOX.east) / 2;
  let sourceOsm = Array.from(osmNodes.keys())[0];
  let minD = Infinity;
  osmNodes.forEach((p, id) => {
    const d = haversineMeters(centerLat, centerLon, p.lat, p.lon);
    if (d < minD) { minD = d; sourceOsm = id; }
  });

  // EXACT BORDER EXITS (No middle map nodes)
  let nId = sourceOsm, sId = sourceOsm, eId = sourceOsm, wId = sourceOsm;
  let maxLat = -Infinity, minLat = Infinity, maxLon = -Infinity, minLon = Infinity;
  osmNodes.forEach((p, id) => {
    if (p.lat > maxLat) { maxLat = p.lat; nId = id; }
    if (p.lat < minLat) { minLat = p.lat; sId = id; }
    if (p.lon > maxLon) { maxLon = p.lon; eId = id; }
    if (p.lon < minLon) { minLon = p.lon; wId = id; }
  });

  // Only the extreme edges of the city are marked as destinations
  const specialDestinations = new Set([nId, sId, eId, wId]);
  const isJunction = (id: number) => (nodeUsageCount.get(id) || 0) > 1 || specialDestinations.has(id) || id === sourceOsm;

  const finalNodes = new Map<number, GraphNode>();
  const finalEdges: GraphEdge[] = [];
  const projector = project(Array.from(osmNodes.values()));

  ways.forEach((w, wayIdx) => {
    const highway = w.tags?.highway;
    const speed = estimateSpeedKph(highway);
    let lastJunctionIdx = 0;

    for (let i = 1; i < w.nodes.length; i++) {
      if (isJunction(w.nodes[i]) || i === w.nodes.length - 1) {
        const uId = w.nodes[lastJunctionIdx];
        const vId = w.nodes[i];
        
        let distMeters = 0;
        for (let j = lastJunctionIdx; j < i; j++) {
          const p1 = osmNodes.get(w.nodes[j])!;
          const p2 = osmNodes.get(w.nodes[j+1])!;
          distMeters += haversineMeters(p1.lat, p1.lon, p2.lat, p2.lon);
        }
        const latency = (distMeters / ((speed * 1000) / 60));

        [uId, vId].forEach(id => {
          if (!finalNodes.has(id)) {
            const p = osmNodes.get(id)!;
            const { x, y } = projector(p.lat, p.lon);
            let type: ScenarioNodeType = "street";
            let label = `Node ${id}`;
            
            if (id === sourceOsm) {
              type = "origin";
              label = "Cabuyao Center (Start)";
            } else if (specialDestinations.has(id)) {
              type = "highway";
              // Nicely formatted border exits
              if (id === nId) label = "North Exit (Santa Rosa)";
              else if (id === sId) label = "South Exit (Calamba)";
              else if (id === wId) label = "West Exit (Silang)";
              else if (id === eId) label = "East Exit (Lake Road)";
            } else if ((nodeUsageCount.get(id) || 0) > 1) {
              type = "intersection";
            }

            finalNodes.set(id, {
              id: `osm_n_${id}`,
              label,
              type, x, y, level: (type === "street" ? 2 : 1),
            });
          }
        });

        finalEdges.push({
          id: `e_${wayIdx}_${i}`,
          from: `osm_n_${uId}`, to: `osm_n_${vId}`,
          latency: Math.max(0.1, latency),
          type: "road"
        });

        if (w.tags?.oneway !== "yes") {
            finalEdges.push({
                id: `e_rev_${wayIdx}_${i}`,
                from: `osm_n_${vId}`, to: `osm_n_${uId}`,
                latency: Math.max(0.1, latency),
                type: "road"
            });
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
    width: W, height: H,
  };

  const outFile = path.join(process.cwd(), "src", "data", "traffic.cabuyao.ts");
  fs.writeFileSync(outFile, `import type { ScenarioGraph } from "../types";\nexport const cabuyaoTrafficGraph: ScenarioGraph = ${JSON.stringify(graph, null, 2)} as ScenarioGraph;\n`);
  console.log(`Wrote simplified graph. Nodes: ${graph.nodes.length}, Edges: ${graph.edges.length}`);
}

main().catch(console.error);