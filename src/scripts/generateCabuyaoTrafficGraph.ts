import fs from "node:fs";
import path from "node:path";

type OverpassElement =
  | { type: "node"; id: number; lat: number; lon: number; tags?: Record<string, string> }
  | { type: "way"; id: number; nodes: number[]; tags?: Record<string, string> };

type OverpassResponse = { elements: OverpassElement[] };

// --- Match your app types (minimal subset) ---
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

// ---------- CONFIG (Cabuyao bbox - adjust if needed) ----------
const BBOX = {
  south: 14.20,
  west: 121.08,
  north: 14.32,
  east: 121.18,
};

// canvas (match your trafficGraph.ts)
const W = 1000;
const H = 760;

// choose which road classes to include (smaller = faster UI)
const HIGHWAY_REGEX = "motorway|trunk|primary|secondary|tertiary|unclassified|residential";

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function estimateSpeedKph(highway: string | undefined) {
  // simple defaults (you can tune)
  if (!highway) return 25;
  if (highway === "motorway") return 80;
  if (highway === "trunk") return 60;
  if (highway === "primary") return 50;
  if (highway === "secondary") return 40;
  if (highway === "tertiary") return 35;
  if (highway === "residential") return 25;
  return 30;
}

function minutesFromMeters(meters: number, speedKph: number) {
  const mPerMin = (speedKph * 1000) / 60;
  return meters / mPerMin;
}

async function fetchOverpassRoads(): Promise<OverpassResponse> {
  const { south, west, north, east } = BBOX;

  const query = `
[out:json][timeout:60];
(
  way["highway"~"${HIGHWAY_REGEX}"](${south},${west},${north},${east});
  node["highway"="motorway_junction"](${south},${west},${north},${east});
);
out body;
>;
out skel qt;
`.trim();

  const overpassUrl = "https://overpass-api.de/api/interpreter";

  const body = new URLSearchParams({ data: query });

  const r = await fetch(overpassUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "hybrid-bfs-dfs-thesis/1.0"
    },
    body
  });

  const text = await r.text();
  if (!r.ok) {
    throw new Error(`Overpass error: ${r.status} ${r.statusText}\n${text.slice(0, 500)}`);
  }

  return JSON.parse(text) as OverpassResponse;
}

function project(nodes: { lat: number; lon: number }[]) {
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const n of nodes) {
    if (n.lat < minLat) minLat = n.lat;
    if (n.lat > maxLat) maxLat = n.lat;
    if (n.lon < minLon) minLon = n.lon;
    if (n.lon > maxLon) maxLon = n.lon;
  }
  const pad = 20;
  return (lat: number, lon: number) => {
    const x = pad + ((lon - minLon) / (maxLon - minLon)) * (W - pad * 2);
    const y = pad + ((maxLat - lat) / (maxLat - minLat)) * (H - pad * 2);
    return { x, y };
  };
}

function nearestNodeId(centerLat: number, centerLon: number, nodeMap: Map<number, { lat: number; lon: number }>) {
  let bestId: number | null = null;
  let bestD = Infinity;
  for (const [id, p] of nodeMap.entries()) {
    const d = haversineMeters(centerLat, centerLon, p.lat, p.lon);
    if (d < bestD) { bestD = d; bestId = id; }
  }
  return bestId;
}

async function main() {
  const data = await fetchOverpassRoads();

  const osmNodes = new Map<number, { lat: number; lon: number; tags?: Record<string, string> }>();
  const ways: { id: number; nodes: number[]; tags?: Record<string, string> }[] = [];
  const motorwayJunctions: number[] = [];

  for (const el of data.elements) {
    if (el.type === "node") {
      osmNodes.set(el.id, { lat: el.lat, lon: el.lon, tags: el.tags });
      if (el.tags?.highway === "motorway_junction") motorwayJunctions.push(el.id);
    } else if (el.type === "way") {
      ways.push({ id: el.id, nodes: el.nodes, tags: el.tags });
    }
  }

  // Build directed edges list (add reverse edge if not oneway)
  const edgePairs: Array<{ from: number; to: number; minutes: number; highway?: string; wayId: number }> = [];

  for (const w of ways) {
    const refs = w.nodes;
    const highway = w.tags?.highway;
    const speed = estimateSpeedKph(highway);
    const oneway = w.tags?.oneway === "yes" || w.tags?.oneway === "1" || w.tags?.oneway === "true";

    for (let i = 0; i < refs.length - 1; i++) {
      const a = osmNodes.get(refs[i]);
      const b = osmNodes.get(refs[i + 1]);
      if (!a || !b) continue;

      const meters = haversineMeters(a.lat, a.lon, b.lat, b.lon);
      const minutes = minutesFromMeters(meters, speed);

      edgePairs.push({ from: refs[i], to: refs[i + 1], minutes, highway, wayId: w.id });
      if (!oneway) edgePairs.push({ from: refs[i + 1], to: refs[i], minutes, highway, wayId: w.id });
    }
  }

  // Degree for classification
  const outDeg = new Map<number, number>();
  for (const e of edgePairs) outDeg.set(e.from, (outDeg.get(e.from) ?? 0) + 1);

  // Build projection
  const projector = project([...osmNodes.values()]);

  // Pick source = nearest node to bbox center
  const centerLat = (BBOX.south + BBOX.north) / 2;
  const centerLon = (BBOX.west + BBOX.east) / 2;
  const sourceOsm = nearestNodeId(centerLat, centerLon, osmNodes);
  if (!sourceOsm) throw new Error("No nodes found in bbox.");

  // Destinations: use motorway_junction nodes if available; else pick a few farthest nodes
  let destOsm = motorwayJunctions.slice(0, 3);
  if (destOsm.length === 0) {
    // fallback: farthest 3 nodes from source
    const src = osmNodes.get(sourceOsm)!;
    const scored = [...osmNodes.entries()].map(([id, p]) => ({
      id,
      d: haversineMeters(src.lat, src.lon, p.lat, p.lon),
    }));
    scored.sort((a, b) => b.d - a.d);
    destOsm = scored.slice(0, 3).map(s => s.id);
  }

  // Create GraphNodes for *all* OSM nodes used in edges (keeps it consistent)
  const usedNodeIds = new Set<number>();
  for (const e of edgePairs) { usedNodeIds.add(e.from); usedNodeIds.add(e.to); }

  const nodes: GraphNode[] = [];
  for (const osmId of usedNodeIds) {
    const p = osmNodes.get(osmId);
    if (!p) continue;
    const { x, y } = projector(p.lat, p.lon);

    let type: ScenarioNodeType = "street";
    const deg = outDeg.get(osmId) ?? 0;
    if (osmId === sourceOsm) type = "origin";
    else if (destOsm.includes(osmId)) type = "highway";
    else if (deg >= 3) type = "intersection";

    nodes.push({
      id: `osm_n_${osmId}`,
      label: type === "origin" ? "Cabuyao (Start)" : type === "highway" ? "Highway Exit" : `Node ${osmId}`,
      type,
      x,
      y,
      level: 0,
      metadata: { lat: p.lat, lon: p.lon, deg },
    });
  }

  // Edges
  const edges: GraphEdge[] = [];
  let ei = 0;
  for (const e of edgePairs) {
    if (!usedNodeIds.has(e.from) || !usedNodeIds.has(e.to)) continue;
    const latency = Math.max(0.05, e.minutes); // keep non-zero
    edges.push({
      id: `e_${e.wayId}_${ei++}`,
      from: `osm_n_${e.from}`,
      to: `osm_n_${e.to}`,
      latency,
      label: `${latency.toFixed(2)}m`,
      type: "road",
    });
  }

  const graph: ScenarioGraph = {
    nodes,
    edges,
    sourceId: `osm_n_${sourceOsm}`,
    destinationIds: destOsm.map(id => `osm_n_${id}`),
    width: W,
    height: H,
  };

  const outFile = path.join(process.cwd(), "src", "data", "traffic.cabuyao.ts");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });

  const content =
    `// AUTO-GENERATED. Do not edit by hand.\n` +
    `import type { ScenarioGraph } from "../types";\n` +
    `export const cabuyaoTrafficGraph: ScenarioGraph = ${JSON.stringify(graph, null, 2)} as ScenarioGraph;\n`;

  fs.writeFileSync(outFile, content, "utf8");
  console.log(`Wrote ${outFile}`);
  console.log(`Nodes: ${nodes.length}, Edges: ${edges.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});