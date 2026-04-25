/**
 * Amazon-style Fulfillment Warehouse Graph
 */

import { ScenarioGraph, GraphNode, GraphEdge } from '../types/index';
// ✅ Import the newly generated AWS Robomaker map
import { awsWarehouseGraph } from '../data/robotics.aws';

const W = 1000;
const H = 760;

// ✅ Added the useRealWorld parameter
export function buildRoboticsGraph(useRealWorld: boolean = false): ScenarioGraph {
  
  // ✅ Return the massive AWS map if toggled!
  if (useRealWorld) {
    return awsWarehouseGraph as ScenarioGraph;
  }

  // 👇 Otherwise, return the standard small mock map
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  nodes.push({
    id: 'depot',
    label: 'Central Depot',
    type: 'depot',
    x: W / 2,
    y: 50,
    level: 0,
  });

  const zones = [
    { id: 'A', name: 'Electronics', aisles: 3, shelves: 2, cx: W * 0.15 },
    { id: 'B', name: 'Apparel',     aisles: 3, shelves: 2, cx: W * 0.38 },
    { id: 'C', name: 'Grocery',     aisles: 2, shelves: 3, cx: W * 0.62 },
    { id: 'D', name: 'Heavy Goods', aisles: 2, shelves: 2, cx: W * 0.85 },
  ];

  const zoneY = 165;

  zones.forEach((z) => {
    const zId = `zone_${z.id}`;
    nodes.push({
      id: zId,
      label: `Zone ${z.id}\n${z.name}`,
      type: 'zone',
      x: z.cx,
      y: zoneY,
      level: 1,
      buildingId: z.id,
    });

    edges.push({
      id: `depot-${zId}`,
      from: 'depot',
      to: zId,
      latency: 2,
      label: '2m',
      type: 'path',
    });

    const aisleStartY = 310;
    const aisleGapY = 130;

    for (let ai = 1; ai <= z.aisles; ai++) {
      const aId = `aisle_${z.id}${ai}`;
      const aisleY = aisleStartY + (ai - 1) * aisleGapY;
      const aisleX = z.cx;

      nodes.push({
        id: aId,
        label: `Aisle ${z.id}${ai}`,
        type: 'aisle',
        x: aisleX,
        y: aisleY,
        level: 2,
        buildingId: z.id,
      });

      edges.push({
        id: `${zId}-${aId}`,
        from: zId,
        to: aId,
        latency: 5,
        label: '5m',
        type: 'path',
      });

      const shelfSpread = 45;
      for (let sh = 1; sh <= z.shelves; sh++) {
        const sId = `shelf_${z.id}${ai}_${sh}`;
        const offset = (sh - (z.shelves + 1) / 2) * shelfSpread;

        nodes.push({
          id: sId,
          label: `Bay ${z.id}${ai}-${sh}`,
          type: 'shelf',
          x: aisleX + offset,
          y: aisleY + 95,
          level: 3,
          buildingId: z.id,
        });

        edges.push({
          id: `${aId}-${sId}`,
          from: aId,
          to: sId,
          latency: 3,
          label: '3m',
          type: 'path',
        });
      }
    }
  });

  const destinationIds = nodes
    .filter((n) => n.type === 'shelf')
    .map((n) => n.id);

  return { nodes, edges, sourceId: 'depot', destinationIds, width: W, height: H };
}

// ✅ Dynamic obstacle candidates pull from zones and aisles
export function getRoboticsBlockCandidates(graph: ScenarioGraph): string[] {
  return graph.nodes.filter((n) => n.type === 'aisle' || n.type === 'zone').map((n) => n.id);
}