import { ScenarioGraph, GraphNode, GraphEdge, GraphSize } from '../types/index';
import { datacenterNetworkGraph } from '../data/network.datacenter';
import { as733NetworkGraph } from '../data/network.as733';

const W = 1600; 
const H = 1200;

function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const SIZE_CONFIG = {
  small: { spines: 2, leafs: 4, racksPerLeaf: 2 },
  medium: { spines: 3, leafs: 6, racksPerLeaf: 3 },
  large: { spines: 4, leafs: 9, racksPerLeaf: 4 }
};

export function buildNetworkGraph(
  useRealWorld: boolean = false, 
  seed: number = 123, 
  networkMode: string = 'synthetic',
  graphSize: GraphSize = 'medium'
): ScenarioGraph {
  if (useRealWorld) {
    const baseGraph = networkMode === 'datacenter' ? datacenterNetworkGraph : as733NetworkGraph;
    const rwGraph = { ...(baseGraph as ScenarioGraph) };
    
    // Real-world datacenters use 'server' or 'access_point'. AS733 just uses raw nodes.
    let potentialExits = rwGraph.nodes.filter(n => n.type === 'access_point' || n.type === 'server');
    if (potentialExits.length === 0) {
      potentialExits = rwGraph.nodes.filter(n => n.id !== rwGraph.sourceId);
    }

    if (potentialExits.length > 0) {
      let currentSeed = seed;
      const shuffled = [...potentialExits];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(currentSeed++) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const numExits = Math.floor(seededRandom(currentSeed) * 5) + 3; 
      rwGraph.destinationIds = shuffled.slice(0, numExits).map(n => n.id);
    }
    return rwGraph;
  }
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const config = SIZE_CONFIG[graphSize];

  // 1. Data Ingress (Start Node)
  nodes.push({ id: 'dc_ingress', label: 'Global Ingress', type: 'datacenter', x: W / 2, y: 80, level: 0, buildingId: 'core' });

  // 2. Spine Routers (Top Level)
  const spineSpacing = W / (config.spines + 1);
  for (let s = 1; s <= config.spines; s++) {
    const spId = `spine_${s}`;
    nodes.push({ id: spId, label: `Core-SP${s}`, type: 'router', x: s * spineSpacing, y: 250, level: 1, buildingId: 'core' });
    edges.push({ id: `in-${spId}`, from: 'dc_ingress', to: spId, latency: 1, label: '1ms', type: 'fiber' });
  }

  // 3. Leaf Switches (Middle Level)
  const leafSpacing = (W - 100) / (config.leafs - 1);
  for (let l = 1; l <= config.leafs; l++) {
    const leafId = `leaf_${l}`;
    nodes.push({ id: leafId, label: `Aggr-SW${l}`, type: 'switch', x: 50 + ((l-1) * leafSpacing), y: 550, level: 2, buildingId: 'aggr' });
    
    // Spine-Leaf FULL MESH (Every spine connects to every leaf)
    for (let s = 1; s <= config.spines; s++) {
      edges.push({ id: `spine_${s}-${leafId}`, from: `spine_${s}`, to: leafId, latency: 3, label: '3ms', type: 'fiber' });
    }

    // Leaf Horizontal Cross-Links (Mesh Topology for detours)
    if (l > 1) {
      edges.push({ id: `leaf_${l-1}-${leafId}`, from: `leaf_${l-1}`, to: leafId, latency: 2, label: '2ms', type: 'ethernet' });
    }

    // 4. Server Racks (Bottom Level)
    const rackSpread = leafSpacing / config.racksPerLeaf;
    for (let r = 1; r <= config.racksPerLeaf; r++) {
      const rackId = `rack_${l}_${r}`;
      const offset = (r - (config.racksPerLeaf + 1) / 2) * rackSpread;
      nodes.push({ id: rackId, label: `Rack-${l}${r}`, type: 'access_point', x: 50 + ((l-1) * leafSpacing) + offset, y: 900, level: 3, buildingId: 'access' });
      edges.push({ id: `${leafId}-${rackId}`, from: leafId, to: rackId, latency: 5, label: '5ms', type: 'ethernet' });
    }
  }

  // 5. Randomize Exit Endpoints (Server Racks)
  const potentialExits = nodes.filter(n => n.type === 'access_point');
  let currentSeed = seed;
  const shuffled = [...potentialExits];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(currentSeed++) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const numExits = Math.floor(seededRandom(currentSeed) * 5) + 3; 
  const destinationIds = shuffled.slice(0, numExits).map(n => n.id);

  return { nodes, edges, sourceId: 'dc_ingress', destinationIds, width: W, height: H };
}

export function getNetworkFailureCandidates(graph: ScenarioGraph): string[] {
  // 1. Try to find specifically labeled network infrastructure (for synthetic/datacenter maps)
  let candidates = graph.nodes
  .filter(n => n.type === 'floor_router' || n.type === 'building_router' || n.type === 'router' || n.type === 'switch')
  .map(n => n.id);

  // 2. 🧠 THE FIX: If the list is empty (e.g., AS733 real-world raw node data), 
  // fallback to grabbing all nodes EXCEPT the Start node and Exits!
  if (candidates.length === 0) {
    const exits = new Set(graph.destinationIds);
    candidates = graph.nodes
      .filter(n => n.id !== graph.sourceId && !exits.has(n.id))
      .map(n => n.id);
  }

  return candidates;
}