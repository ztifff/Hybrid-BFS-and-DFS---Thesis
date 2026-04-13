/**
 * Multi-Story Office Building Evacuation Graph
 *
 * Topology:
 *   Evacuation Start Points (3 zones on Floor 4)
 *     └── Corridors → Stairwells → Ground Floor → Emergency Exits
 *
 * Buildings have:
 *   - 4 floors
 *   - 2 stairwells (North and South)
 *   - 2-3 corridors per floor
 *   - 3 ground-floor emergency exits
 *
 * Edge costs (evacuation time in seconds):
 *   Zone → Corridor      : 10s
 *   Corridor → Stairwell : 8s
 *   Stairwell descent    : 15s per floor
 *   Stairwell → Exit     : 5s
 */

import { ScenarioGraph, GraphNode, GraphEdge } from '../types';

const W = 1000;
const H = 760;

export function buildEvacuationGraph(): ScenarioGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const floors = 4;
  const floorGapY = 140;
  const startY = 50;

  // Stairwell X positions
  const stairNX = W * 0.28;
  const stairSX = W * 0.72;

  // ── Evacuation start zones (top floor) ─────────────────────────────────
  const startZones = [
    { id: 'zone_A', label: 'Zone A\n(Finance)', x: W * 0.15 },
    { id: 'zone_B', label: 'Zone B\n(HR)', x: W * 0.50 },
    { id: 'zone_C', label: 'Zone C\n(IT)', x: W * 0.85 },
  ];

  startZones.forEach((z) => {
    nodes.push({
      id: z.id,
      label: z.label,
      type: 'start',
      x: z.x,
      y: startY,
      level: 0,
      buildingId: 'top',
    });
  });

  // ── Floors (top = floor 4, bottom = floor 1) ────────────────────────────
  for (let f = floors; f >= 1; f--) {
    const floorIdx = floors - f; // 0 = floor 4 (top)
    const floorY = startY + 100 + floorIdx * floorGapY;

    // North stairwell node for this floor
    const stairNId = `stair_N_F${f}`;
    nodes.push({
      id: stairNId,
      label: `N-Stair F${f}`,
      type: 'stairwell',
      x: stairNX,
      y: floorY,
      level: floorIdx + 1,
      buildingId: 'stair_N',
    });

    // South stairwell node
    const stairSId = `stair_S_F${f}`;
    nodes.push({
      id: stairSId,
      label: `S-Stair F${f}`,
      type: 'stairwell',
      x: stairSX,
      y: floorY,
      level: floorIdx + 1,
      buildingId: 'stair_S',
    });

    // Corridor nodes per floor
    const corridorXs = [W * 0.15, W * 0.50, W * 0.85];
    corridorXs.forEach((cx, ci) => {
      const corrId = `corr_F${f}_${ci + 1}`;
      nodes.push({
        id: corrId,
        label: `Corridor F${f}-${ci + 1}`,
        type: 'corridor',
        x: cx,
        y: floorY,
        level: floorIdx + 1,
        buildingId: `floor_${f}`,
      });

      // Connect start zones to top-floor corridors
      if (f === floors) {
        const zone = startZones[ci];
        edges.push({
          id: `${zone.id}-${corrId}`,
          from: zone.id,
          to: corrId,
          latency: 10,
          label: '10s',
          type: 'corridor',
        });
      } else {
        // Connect from floor above stairwells down to this corridor
        // (handled via stairwell links below)
      }

      // Corridors connect to both stairwells on same floor
      edges.push({
        id: `${corrId}-${stairNId}`,
        from: corrId,
        to: stairNId,
        latency: 8,
        label: '8s',
        type: 'corridor',
      });
      edges.push({
        id: `${corrId}-${stairSId}`,
        from: corrId,
        to: stairSId,
        latency: 8,
        label: '8s',
        type: 'corridor',
      });
    });

    // Stairwell descends to next floor
    if (f > 1) {
      const stairNNextId = `stair_N_F${f - 1}`;
      const stairSNextId = `stair_S_F${f - 1}`;
      edges.push({
        id: `${stairNId}-${stairNNextId}`,
        from: stairNId,
        to: stairNNextId,
        latency: 15,
        label: '15s',
        type: 'path',
      });
      edges.push({
        id: `${stairSId}-${stairSNextId}`,
        from: stairSId,
        to: stairSNextId,
        latency: 15,
        label: '15s',
        type: 'path',
      });
    }
  }

  // ── Ground floor emergency exits ────────────────────────────────────────
  const exitY = startY + 100 + floors * floorGapY;
  const exitConfigs = [
    { id: 'exit_main',  label: 'Main Exit',  x: W * 0.25 },
    { id: 'exit_side',  label: 'Side Exit',  x: W * 0.50 },
    { id: 'exit_rear',  label: 'Rear Exit',  x: W * 0.75 },
  ];

  exitConfigs.forEach((ex) => {
    nodes.push({
      id: ex.id,
      label: ex.label,
      type: 'emergency_exit',
      x: ex.x,
      y: exitY,
      level: floors + 2,
      buildingId: 'ground',
    });
  });

  // Ground floor stairwells connect to exits
  const groundStairN = `stair_N_F1`;
  const groundStairS = `stair_S_F1`;

  edges.push({ id: `${groundStairN}-exit_main`, from: groundStairN, to: 'exit_main', latency: 5, label: '5s', type: 'path' });
  edges.push({ id: `${groundStairN}-exit_side`, from: groundStairN, to: 'exit_side', latency: 5, label: '5s', type: 'path' });
  edges.push({ id: `${groundStairS}-exit_side`, from: groundStairS, to: 'exit_side', latency: 5, label: '5s', type: 'path' });
  edges.push({ id: `${groundStairS}-exit_rear`, from: groundStairS, to: 'exit_rear', latency: 5, label: '5s', type: 'path' });

  const destinationIds = exitConfigs.map((e) => e.id);

  // Source = first start zone (others are connected internally)
  return {
    nodes, edges,
    sourceId: 'zone_A',
    destinationIds,
    width: W,
    height: H,
  };
}

export function getEvacuationFireCandidates(graph: ScenarioGraph): string[] {
  return graph.nodes.filter((n) => n.type === 'corridor' || n.type === 'stairwell').map((n) => n.id);
}
