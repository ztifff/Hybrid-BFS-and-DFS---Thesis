/**
 * Amazon-style Fulfillment Warehouse Graph
 *
 * Topology:
 *   Central Depot (source)
 *     ├── Zone A (Electronics)  → Aisles A1-A3 → Shelves (Delivery Bays)
 *     ├── Zone B (Apparel)      → Aisles B1-B3 → Shelves
 *     ├── Zone C (Grocery)      → Aisles C1-C2 → Shelves
 *     └── Zone D (Heavy Goods)  → Aisles D1-D2 → Shelves
 *
 * Edge costs:
 *   Depot → Zone     : 2m travel
 *   Zone → Aisle     : 5m travel
 *   Aisle → Shelf    : 3m travel
 */

import { ScenarioGraph, GraphNode, GraphEdge } from '../types';

const W = 1000;
const H = 760;

export function buildRoboticsGraph(): ScenarioGraph {
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

export function getRoboticsBlockCandidates(graph: ScenarioGraph): string[] {
  return graph.nodes.filter((n) => n.type === 'aisle').map((n) => n.id);
}
