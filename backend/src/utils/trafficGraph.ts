import { ScenarioGraph, GraphNode, GraphEdge, GraphSize, GraphSizing } from '../types/index';
import { cabuyaoTrafficGraph } from '../data/traffic.cabuyao';
import { fitGraphEdgeCount, resolveSizingValue } from './graphSizing';

const W = 1600; 
const H = 1200;

const SIZE_CONFIG = {
  small: { cols: 4, rows: 4 },
  medium: { cols: 6, rows: 6 },
  large: { cols: 9, rows: 7 }
};

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function buildTrafficGraph(
  useRealWorld: boolean = false, 
  graphSize: GraphSize = 'medium',
  seed: number = 123,
  mapId?: string,
  sizing?: GraphSizing
): ScenarioGraph {
  if (useRealWorld) {
    const registry: Record<string, any> = {
      'cabuyao': cabuyaoTrafficGraph
    };
    return (registry[mapId || 'cabuyao'] || cabuyaoTrafficGraph) as ScenarioGraph;
  }

  let currentSeed = seed;
  const rand = () => seededRandom(currentSeed++);

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const config = SIZE_CONFIG[graphSize];
  
  const targetNodes = resolveSizingValue(sizing?.nodes, config.cols * config.rows, 9, 220);
  const cols = sizing
    ? Math.min(targetNodes, Math.max(3, Math.round(Math.sqrt(targetNodes * 1.3))))
    : config.cols;
  const rows = sizing ? Math.ceil(targetNodes / cols) : config.rows;

  const cellW = (W - 200) / Math.max(cols - 1, 1);
  const cellH = (H - 200) / Math.max(rows - 1, 1);
  const hasNode = (r: number, c: number) => r >= 0 && c >= 0 && c < cols && (r * cols + c) < targetNodes;
  const nodeId = (r: number, c: number) => `int_${r}_${c}`;

  // 1. Generate Intersections with Jitter for Organic Layout
  const maxJitterX = cellW * 0.35;
  const maxJitterY = cellH * 0.35;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!hasNode(r, c)) continue;

      // Add organic jitter, but keep perimeter nodes slightly more aligned
      const isPerimeter = r === 0 || c === 0 || r === rows - 1 || c === cols - 1;
      const jitterX = isPerimeter ? (rand() * 2 - 1) * maxJitterX * 0.3 : (rand() * 2 - 1) * maxJitterX;
      const jitterY = isPerimeter ? (rand() * 2 - 1) * maxJitterY * 0.3 : (rand() * 2 - 1) * maxJitterY;

      const mainAvenueCol = Math.floor(cols / 2);
      const mainBoulevardRow = Math.floor(rows / 2);
      const isMajorArtery = c === mainAvenueCol || r === mainBoulevardRow;
      const isStreet = !isMajorArtery && rand() > 0.3;

      const id = nodeId(r, c);
      nodes.push({
        id,
        label: isStreet ? `Street ${r}-${c}` : `Inter ${r}-${c}`,
        type: isStreet ? 'street' : 'intersection',
        x: Math.round(100 + (c * cellW) + jitterX),
        y: Math.round(100 + (r * cellH) + jitterY),
        level: 1,
        buildingId: 'city'
      });
    }
  }

  // 2. Determine Major Arteries (Avenues & Boulevards)
  const mainAvenueCol = Math.floor(cols / 2);
  const mainBoulevardRow = Math.floor(rows / 2);

  // 3. Generate Roads (Edges)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!hasNode(r, c)) continue;
      const id = nodeId(r, c);

      // Horizontal connection (Street)
      if (hasNode(r, c - 1)) {
        const isBoulevard = r === mainBoulevardRow;
        // Randomly drop 15% of minor streets to create realistic blocks/cul-de-sacs
        if (isBoulevard || rand() > 0.15) {
          const latency = isBoulevard ? 2 : 4 + Math.floor(rand() * 3);
          const label = isBoulevard ? `${latency}m Blvd` : `${latency}m St`;
          edges.push({ id: `${nodeId(r, c-1)}-${id}`, from: nodeId(r, c-1), to: id, latency, label, type: 'road' });
        }
      }

      // Vertical connection (Avenue)
      if (hasNode(r - 1, c)) {
        const isAvenue = c === mainAvenueCol;
        if (isAvenue || rand() > 0.15) {
          const latency = isAvenue ? 2 : 4 + Math.floor(rand() * 3);
          const label = isAvenue ? `${latency}m Ave` : `${latency}m St`;
          edges.push({ id: `${nodeId(r-1, c)}-${id}`, from: nodeId(r-1, c), to: id, latency, label, type: 'road' });
        }
      }
    }
  }

  // 4. Winding Highway (Expressway)
  // Instead of a perfect diagonal, make a highway that snakes organically through the city
  let hwyR = 0;
  let hwyC = 0;
  const highwayNodes = [nodeId(hwyR, hwyC)];
  while (hwyR < rows - 1 || hwyC < cols - 1) {
    if (hwyR === rows - 1) hwyC++;
    else if (hwyC === cols - 1) hwyR++;
    else {
      // Move right or down randomly to create a jagged diagonal path
      if (rand() > 0.5) hwyC++;
      else hwyR++;
    }
    if (hasNode(hwyR, hwyC)) {
      highwayNodes.push(nodeId(hwyR, hwyC));
    }
  }

  for (let i = 0; i < highwayNodes.length - 1; i++) {
    edges.push({ 
      id: `hwy_${i}`, 
      from: highwayNodes[i], 
      to: highwayNodes[i+1], 
      latency: 1, 
      label: '1m HWY', 
      type: 'road' 
    });
  }

  // 5. Source and Destinations
  const sourceId = nodeId(0, 0);
  const sourceNode = nodes.find(n => n.id === sourceId);
  if (sourceNode) {
    sourceNode.type = 'origin';
    sourceNode.label = 'City Center';
  }

  const lastIndex = targetNodes - 1;
  const lastRow = Math.floor(lastIndex / cols);
  const lastCol = lastIndex % cols;
  const bottomRowNodes = Array.from({ length: lastCol + 1 }, (_, c) => nodeId(lastRow, c));
  const rightColumnNodes = Array.from({ length: rows }, (_, r) => nodeId(r, cols - 1)).filter((id) =>
    nodes.some((node) => node.id === id)
  );
  
  const destinationIds = Array.from(new Set([
    nodeId(lastRow, lastCol),
    bottomRowNodes[Math.floor(bottomRowNodes.length / 2)],
    rightColumnNodes[Math.floor(rightColumnNodes.length / 2)] ?? nodeId(lastRow, lastCol),
  ]));

  destinationIds.forEach(id => {
    const n = nodes.find(n => n.id === id);
    if (n) { 
      n.type = 'highway'; 
      n.label = 'City Exit'; 
    }
  });

  return fitGraphEdgeCount(
    { nodes, edges, sourceId, destinationIds, width: W, height: H },
    sizing?.edges ? sizing.edges * 2 : 0,
    seed,
    { edgeType: 'road', labelUnit: 'm', latencyBase: 2, latencySpread: 5, maxEdges: targetNodes * 10 }
  );
}

export function getTrafficClosureCandidates(graph: ScenarioGraph): string[] {
  return graph.nodes.filter(n => n.type === 'intersection' || n.type === 'street').map(n => n.id);
}
