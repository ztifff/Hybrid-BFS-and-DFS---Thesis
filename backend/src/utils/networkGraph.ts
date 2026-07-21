import { ScenarioGraph, GraphNode, GraphEdge, GraphSize, GraphSizing } from '../types/index';
import { companyBusinessNetworkGraph } from '../data/network.companybusiness';
import { campusNetworkGraph } from '../data/network.campus';
import { clampInt, fitGraphEdgeCount, resolveSizingValue } from './graphSizing';

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

function resolveNetworkShape(targetNodes: number, fallback: typeof SIZE_CONFIG.medium, hasSizing: boolean) {
  if (!hasSizing) {
    return {
      spines: fallback.spines,
      leafs: fallback.leafs,
      rackCounts: Array.from({ length: fallback.leafs }, () => fallback.racksPerLeaf),
    };
  }

  let leafs = clampInt(Math.sqrt(targetNodes) * 1.25, 2, 24);
  let spines = clampInt(leafs / 2, 2, 8);

  while (1 + spines + leafs + leafs > targetNodes && leafs > 2) leafs--;
  while (1 + spines + leafs + leafs > targetNodes && spines > 2) spines--;

  const rackTotal = Math.max(leafs, targetNodes - 1 - spines - leafs);
  const rackCounts = Array.from({ length: leafs }, () => 1);
  let remainingRacks = rackTotal - leafs;
  let index = 0;

  while (remainingRacks > 0) {
    rackCounts[index % leafs]++;
    remainingRacks--;
    index++;
  }

  return { spines, leafs, rackCounts };
}

export function buildNetworkGraph(
  useRealWorld: boolean = false, 
  seed: number = 123, 
  mapId: string = 'synthetic',
  graphSize: GraphSize = 'medium',
  sizing?: GraphSizing
): ScenarioGraph {
  if (useRealWorld) {
    const registry: Record<string, any> = {
      'companybusiness': companyBusinessNetworkGraph,
      'campus': campusNetworkGraph
    };
    const baseGraph = registry[mapId] || companyBusinessNetworkGraph;
    const rwGraph = { ...(baseGraph as ScenarioGraph) };
    
    let currentSeed = seed;

    // Pick a random source node (Prioritize ISPs, fallback to core routers)
    let potentialCores = rwGraph.nodes.filter(n => n.type === 'datacenter');
    if (potentialCores.length === 0) {
      potentialCores = rwGraph.nodes.filter(n => n.type === 'building_router');
    }
    if (potentialCores.length > 0) {
      const coreIndex = Math.floor(seededRandom(currentSeed++) * potentialCores.length);
      rwGraph.sourceId = potentialCores[coreIndex].id;
    }

    // Real-world datacenters use 'server' or 'access_point'. AS733 just uses raw nodes.
    let potentialExits = rwGraph.nodes.filter(n => n.type === 'access_point' || n.type === 'server');
    if (potentialExits.length === 0) {
      potentialExits = rwGraph.nodes.filter(n => n.id !== rwGraph.sourceId);
    }

    if (potentialExits.length > 0) {
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
  const fallback = SIZE_CONFIG[graphSize];
  const fallbackNodes = 1 + fallback.spines + fallback.leafs + (fallback.leafs * fallback.racksPerLeaf);
  const targetNodes = resolveSizingValue(sizing?.nodes, fallbackNodes, 7, 220);
  const config = resolveNetworkShape(targetNodes, fallback, Boolean(sizing));

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
    const racksForLeaf = config.rackCounts[l - 1] ?? 1;
    const rackSpread = leafSpacing / (racksForLeaf + 1);
    for (let r = 1; r <= racksForLeaf; r++) {
      const rackId = `rack_${l}_${r}`;
      const offset = (r - (racksForLeaf + 1) / 2) * rackSpread;
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
  const numExits = Math.min(shuffled.length, Math.floor(seededRandom(currentSeed) * 5) + 3); 
  const destinationIds = shuffled.slice(0, numExits).map(n => n.id);

  return fitGraphEdgeCount(
    { nodes, edges, sourceId: 'dc_ingress', destinationIds, width: W, height: H },
    sizing?.edges,
    seed,
    { edgeType: 'ethernet', labelUnit: 'ms', latencyBase: 2, latencySpread: 5, maxEdges: targetNodes * 12 }
  );
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

export function applyCampusACLs(graph: ScenarioGraph, customSourceId: string) {
  // Scenario A: Boys Block -> AB1 only. Girls Block -> AB2 only.
  const isBoysBlock = [ 'boys_pc1', 'boys_lap1', 'boys_lap2', 'boys_smart1' ].includes(customSourceId);
  const isGirlsBlock = [ 'girls_pc1', 'girls_lap1', 'girls_lap2', 'girls_smart1' ].includes(customSourceId);
  const isYellowZone = [ 'it_pc1', 'it_pc2', 'it_lap1', 'lib_pc1', 'lib_pc2', 'dome_lap1', 'dome_pc1', 'dome_pc2' ].includes(customSourceId);

  if (!isBoysBlock && !isGirlsBlock && !isYellowZone) return;

  if (isBoysBlock) {
    // Boys can only talk to AB1. Sever edges to AB2, IT, Lib, Dome.
    graph.edges = graph.edges.filter(e => 
      !(e.from === 's1_hostel' && e.to === 'ap_girls') && 
      !(e.from === 'ap_girls' && e.to === 's1_hostel') &&
      !(e.from === 's0_college' && e.to === 'ap_ab2') &&
      !(e.from === 'ap_ab2' && e.to === 's0_college') &&
      !(e.from === 's0_college' && e.to === 'ap_it') &&
      !(e.from === 'ap_it' && e.to === 's0_college') &&
      !(e.from === 's0_college' && e.to === 'ap_lib') &&
      !(e.from === 'ap_lib' && e.to === 's0_college') &&
      !(e.from === 's0_college' && e.to === 'ap_dome') &&
      !(e.from === 'ap_dome' && e.to === 's0_college')
    );
  } else if (isGirlsBlock) {
    // Girls can only talk to AB2.
    graph.edges = graph.edges.filter(e => 
      !(e.from === 's1_hostel' && e.to === 'ap_boys') && 
      !(e.from === 'ap_boys' && e.to === 's1_hostel') &&
      !(e.from === 's0_college' && e.to === 'ap_ab1') &&
      !(e.from === 'ap_ab1' && e.to === 's0_college') &&
      !(e.from === 's0_college' && e.to === 'ap_it') &&
      !(e.from === 'ap_it' && e.to === 's0_college') &&
      !(e.from === 's0_college' && e.to === 'ap_lib') &&
      !(e.from === 'ap_lib' && e.to === 's0_college') &&
      !(e.from === 's0_college' && e.to === 'ap_dome') &&
      !(e.from === 'ap_dome' && e.to === 's0_college')
    );
  } else if (isYellowZone) {
    // Scenario B: Layer 2 switching on S0. Bypasses router.
    // Allow communication within Yellow Zone, but block going up to College Router.
    graph.edges = graph.edges.filter(e => 
      !(e.from === 's0_college' && e.to === 'college_router') && 
      !(e.from === 'college_router' && e.to === 's0_college')
    );
  }
}
