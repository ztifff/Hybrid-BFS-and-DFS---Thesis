import { ScenarioGraph, GraphNode, GraphEdge, GraphSize } from '../types/index';
import { cabuyaoTrafficGraph } from '../data/traffic.cabuyao';

const W = 1600; 
const H = 1200;

const SIZE_CONFIG = {
  small: { cols: 4, rows: 4 },
  medium: { cols: 6, rows: 6 },
  large: { cols: 9, rows: 7 }
};

export function buildTrafficGraph(
  useRealWorld: boolean = false, 
  graphSize: GraphSize = 'medium'
): ScenarioGraph {
  if (useRealWorld) {
    return cabuyaoTrafficGraph as ScenarioGraph;
  }
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const config = SIZE_CONFIG[graphSize];

  const cellW = (W - 200) / (config.cols - 1);
  const cellH = (H - 200) / (config.rows - 1);

  // 1. Build the Grid of Intersections
  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      const id = `int_${r}_${c}`;
      nodes.push({
        id,
        label: `Block ${r}-${c}`,
        type: 'intersection',
        x: 100 + (c * cellW),
        y: 100 + (r * cellH),
        level: 1,
        buildingId: 'city'
      });

      // Connect West (Horizontal Street)
      if (c > 0) {
        edges.push({ id: `int_${r}_${c-1}-${id}`, from: `int_${r}_${c-1}`, to: id, latency: 3, label: '3m', type: 'road' });
      }
      // Connect North (Vertical Street)
      if (r > 0) {
        edges.push({ id: `int_${r-1}_${c}-${id}`, from: `int_${r-1}_${c}`, to: id, latency: 4, label: '4m', type: 'road' });
      }
    }
  }

  // 2. Add an "Expressway" cutting diagonally (Fast but risky)
  for (let i = 0; i < Math.min(config.rows, config.cols) - 1; i++) {
    edges.push({ 
      id: `hwy_${i}`, 
      from: `int_${i}_${i}`, 
      to: `int_${i+1}_${i+1}`, 
      latency: 1, 
      label: '1m HWY', 
      type: 'road' 
    });
  }

  // 3. Start Point (Top Left) and Exits (Bottom Right edges)
  const sourceId = 'int_0_0';
  const destinationIds = [
    `int_${config.rows - 1}_${config.cols - 1}`, // Bottom Right corner
    `int_${config.rows - 1}_${Math.floor(config.cols / 2)}`, // Bottom Middle
    `int_${Math.floor(config.rows / 2)}_${config.cols - 1}`  // Right Middle
  ];

  // Tag exits visually
  destinationIds.forEach(id => {
    const n = nodes.find(n => n.id === id);
    if (n) { n.type = 'highway'; n.label = 'City Exit'; }
  });

  return { nodes, edges, sourceId, destinationIds, width: W, height: H };
}

export function getTrafficClosureCandidates(graph: ScenarioGraph): string[] {
  return graph.nodes.filter(n => n.type === 'intersection').map(n => n.id);
}