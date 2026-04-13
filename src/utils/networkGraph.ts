/**
 * Innovatech Corporate Campus Network Graph
 *
 * Topology:
 *   Main Data Center
 *     ├── Building A Router (Engineering, 5 floors, 3 APs/floor)
 *     │     ├── Floor 1-5 Routers
 *     │           └── AP1, AP2, AP3 per floor
 *     ├── Building B Router (Research, 3 floors, 2 APs/floor)
 *     │     ├── Floor 1-3 Routers
 *     │           └── AP1, AP2 per floor
 *     └── Building C Router (Admin, 2 floors, 2 APs/floor)
 *           ├── Floor 1-2 Routers
 *                 └── AP1, AP2 per floor
 *
 * Edge costs (latency):
 *   DC → Building Router : 1ms  (fiber optic)
 *   Building → Floor     : 5ms  (ethernet backbone)
 *   Floor → AP           : 5ms  (ethernet)
 */

import { ScenarioGraph, GraphNode, GraphEdge } from '../types';

const W = 1000;
const H = 780;

export function buildNetworkGraph(): ScenarioGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // ── Data Center (source) ────────────────────────────────────────────────
  nodes.push({
    id: 'dc',
    label: 'Main Data Center',
    type: 'datacenter',
    x: W / 2,
    y: 48,
    level: 0,
  });

  // ── Building configs ────────────────────────────────────────────────────
  const buildings = [
    { id: 'A', name: 'Engineering', floors: 5, apsPerFloor: 3, cx: W * 0.18 },
    { id: 'B', name: 'Research',    floors: 3, apsPerFloor: 2, cx: W * 0.50 },
    { id: 'C', name: 'Admin',       floors: 2, apsPerFloor: 2, cx: W * 0.82 },
  ];

  const buildingRouterY = 145;

  buildings.forEach((b) => {
    // Building router
    const brId = `BR_${b.id}`;
    nodes.push({
      id: brId,
      label: `Bldg ${b.id} Router\n(${b.name})`,
      type: 'building_router',
      x: b.cx,
      y: buildingRouterY,
      level: 1,
      buildingId: b.id,
    });

    edges.push({
      id: `dc-${brId}`,
      from: 'dc',
      to: brId,
      latency: 1,
      label: '1ms',
      type: 'fiber',
    });

    // Floor routers
    const floorStartY = 270;
    const floorGapY = (H - floorStartY - 60) / Math.max(b.floors, 1);

    for (let f = 1; f <= b.floors; f++) {
      const frId = `FR_${b.id}${f}`;
      const floorY = floorStartY + (f - 1) * floorGapY;

      // Spread floor routers within building column
      const floorXSpread = b.apsPerFloor <= 2 ? 0 : 0;
      nodes.push({
        id: frId,
        label: `Floor ${f} Router`,
        type: 'floor_router',
        x: b.cx + floorXSpread,
        y: floorY,
        level: 2,
        buildingId: b.id,
      });

      edges.push({
        id: `${brId}-${frId}`,
        from: brId,
        to: frId,
        latency: 5,
        label: '5ms',
        type: 'ethernet',
      });

      // Access points
      const apSpread = b.apsPerFloor === 2 ? 55 : 75;
      for (let a = 1; a <= b.apsPerFloor; a++) {
        const apId = `AP_${b.id}${f}_${a}`;
        const offset = (a - (b.apsPerFloor + 1) / 2) * apSpread;

        nodes.push({
          id: apId,
          label: `AP ${b.id}${f}-${a}`,
          type: 'access_point',
          x: b.cx + offset,
          y: floorY + floorGapY * 0.55,
          level: 3,
          buildingId: b.id,
        });

        edges.push({
          id: `${frId}-${apId}`,
          from: frId,
          to: apId,
          latency: 5,
          label: '5ms',
          type: 'ethernet',
        });
      }
    }
  });

  // Collect all destination (access point) IDs
  const destinationIds = nodes
    .filter((n) => n.type === 'access_point')
    .map((n) => n.id);

  return {
    nodes,
    edges,
    sourceId: 'dc',
    destinationIds,
    width: W,
    height: H,
  };
}

/** Nodes eligible for dynamic failure (not source, not dest, not already dest) */
export function getNetworkFailureCandidates(graph: ScenarioGraph): string[] {
  return graph.nodes
    .filter(
      (n) =>
        n.type === 'floor_router' || n.type === 'building_router'
    )
    .map((n) => n.id);
}
