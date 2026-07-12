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
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const config = SIZE_CONFIG[graphSize];
  const targetNodes = resolveSizingValue(sizing?.nodes, config.cols * config.rows, 9, 220);
  const cols = sizing
    ? Math.min(targetNodes, Math.max(3, Math.round(Math.sqrt(targetNodes * 1.25))))
    : config.cols;
  const rows = sizing ? Math.ceil(targetNodes / cols) : config.rows;

  const cellW = (W - 200) / Math.max(cols - 1, 1);
  const cellH = (H - 200) / Math.max(rows - 1, 1);
  const hasNode = (r: number, c: number) => r >= 0 && c >= 0 && c < cols && (r * cols + c) < targetNodes;
  const nodeId = (r: number, c: number) => `int_${r}_${c}`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!hasNode(r, c)) continue;

      const id = nodeId(r, c);
      nodes.push({
        id,
        label: `Block ${r}-${c}`,
        type: 'intersection',
        x: 100 + (c * cellW),
        y: 100 + (r * cellH),
        level: 1,
        buildingId: 'city'
      });

      if (hasNode(r, c - 1)) {
        edges.push({ id: `${nodeId(r, c-1)}-${id}`, from: nodeId(r, c-1), to: id, latency: 3, label: '3m', type: 'road' });
      }

      if (hasNode(r - 1, c)) {
        edges.push({ id: `${nodeId(r-1, c)}-${id}`, from: nodeId(r-1, c), to: id, latency: 4, label: '4m', type: 'road' });
      }
    }
  }

  for (let i = 0; i < Math.min(rows, cols) - 1; i++) {
    if (!hasNode(i, i) || !hasNode(i + 1, i + 1)) continue;
    edges.push({ 
      id: `hwy_${i}`, 
      from: nodeId(i, i), 
      to: nodeId(i+1, i+1), 
      latency: 1, 
      label: '1m HWY', 
      type: 'road' 
    });
  }

  const sourceId = nodeId(0, 0);
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
    if (n) { n.type = 'highway'; n.label = 'City Exit'; }
  });

  return fitGraphEdgeCount(
    { nodes, edges, sourceId, destinationIds, width: W, height: H },
    sizing?.edges,
    seed,
    { edgeType: 'road', labelUnit: 'm', latencyBase: 2, latencySpread: 5, maxEdges: targetNodes * 10 }
  );
}

export function getTrafficClosureCandidates(graph: ScenarioGraph): string[] {
  return graph.nodes.filter(n => n.type === 'intersection').map(n => n.id);
}
