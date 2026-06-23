import { ScenarioGraph, GraphNode, GraphEdge, GraphSize } from '../types/index';
import { awsWarehouseGraph } from '../data/robotics.aws';

const W = 1000;
const H = 760;

const SIZE_CONFIG = {
  small: [
    { id: 'A', name: 'Electronics', aisles: 2, shelves: 2, cx: W * 0.25 },
    { id: 'B', name: 'Apparel',     aisles: 2, shelves: 2, cx: W * 0.75 },
  ],
  medium: [
    { id: 'A', name: 'Electronics', aisles: 3, shelves: 2, cx: W * 0.15 },
    { id: 'B', name: 'Apparel',     aisles: 3, shelves: 2, cx: W * 0.38 },
    { id: 'C', name: 'Grocery',     aisles: 2, shelves: 3, cx: W * 0.62 },
    { id: 'D', name: 'Heavy Goods', aisles: 2, shelves: 2, cx: W * 0.85 },
  ],
  large: [
    { id: 'A', name: 'Electronics', aisles: 4, shelves: 3, cx: W * 0.10 },
    { id: 'B', name: 'Apparel',     aisles: 4, shelves: 3, cx: W * 0.26 },
    { id: 'C', name: 'Grocery',     aisles: 3, shelves: 3, cx: W * 0.42 },
    { id: 'D', name: 'Toys',        aisles: 3, shelves: 3, cx: W * 0.58 },
    { id: 'E', name: 'Automotive',  aisles: 3, shelves: 2, cx: W * 0.74 },
    { id: 'F', name: 'Heavy Goods', aisles: 2, shelves: 2, cx: W * 0.90 },
  ],
};

export function buildRoboticsGraph(useRealWorld: boolean = false, graphSize: GraphSize = 'medium'): ScenarioGraph {
  if (useRealWorld) {
    return awsWarehouseGraph as ScenarioGraph;
  }

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const zones = SIZE_CONFIG[graphSize];

  nodes.push({ id: 'depot', label: 'Central Depot', type: 'depot', x: W / 2, y: 50, level: 0 });

  const zoneY = 165;
  const aisleStartY = 310;
  const aisleGapY = 130;

  zones.forEach((z) => {
    const zId = `zone_${z.id}`;
    nodes.push({ id: zId, label: `Zone ${z.id}\n${z.name}`, type: 'zone', x: z.cx, y: zoneY, level: 1, buildingId: z.id });
    edges.push({ id: `depot-${zId}`, from: 'depot', to: zId, latency: 2, label: '2m', type: 'path' });

    for (let ai = 1; ai <= z.aisles; ai++) {
      const aId = `aisle_${z.id}${ai}`;
      const aisleY = aisleStartY + (ai - 1) * aisleGapY;
      nodes.push({ id: aId, label: `Aisle ${z.id}${ai}`, type: 'aisle', x: z.cx, y: aisleY, level: 2, buildingId: z.id });
      edges.push({ id: `${zId}-${aId}`, from: zId, to: aId, latency: 5, label: '5m', type: 'path' });

      const shelfSpread = 45;
      for (let sh = 1; sh <= z.shelves; sh++) {
        const sId = `shelf_${z.id}${ai}_${sh}`;
        const offset = (sh - (z.shelves + 1) / 2) * shelfSpread;
        nodes.push({ id: sId, label: `Bay ${z.id}${ai}-${sh}`, type: 'shelf', x: z.cx + offset, y: aisleY + 95, level: 3, buildingId: z.id });
        edges.push({ id: `${aId}-${sId}`, from: aId, to: sId, latency: 3, label: '3m', type: 'path' });
      }
    }
  });

  const destinationIds = nodes.filter(n => n.type === 'shelf').map(n => n.id);
  return { nodes, edges, sourceId: 'depot', destinationIds, width: W, height: H };
}

export function getRoboticsBlockCandidates(graph: ScenarioGraph): string[] {
  return graph.nodes.filter(n => n.type === 'aisle' || n.type === 'zone').map(n => n.id);
}
