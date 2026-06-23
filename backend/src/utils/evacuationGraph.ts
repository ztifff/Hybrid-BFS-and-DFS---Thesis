import { ScenarioGraph, GraphNode, GraphEdge, GraphSize } from '../types/index';
import { buildingEvacuationGraph } from '../data/evacuation.building';

const W = 1000;
const H = 760;

const SIZE_CONFIG = {
  small: {
    floors: 2,
    corridorXs: [W * 0.25, W * 0.75],
    exits: [
      { id: 'exit_main', label: 'Main Exit', x: W * 0.35 },
      { id: 'exit_rear', label: 'Rear Exit', x: W * 0.65 },
    ],
  },
  medium: {
    floors: 4,
    corridorXs: [W * 0.15, W * 0.50, W * 0.85],
    exits: [
      { id: 'exit_main', label: 'Main Exit',  x: W * 0.25 },
      { id: 'exit_side', label: 'Side Exit',  x: W * 0.50 },
      { id: 'exit_rear', label: 'Rear Exit',  x: W * 0.75 },
    ],
  },
  large: {
    floors: 6,
    corridorXs: [W * 0.10, W * 0.30, W * 0.50, W * 0.70, W * 0.90],
    exits: [
      { id: 'exit_nw',   label: 'NW Exit',    x: W * 0.10 },
      { id: 'exit_main', label: 'Main Exit',   x: W * 0.30 },
      { id: 'exit_side', label: 'Side Exit',   x: W * 0.50 },
      { id: 'exit_rear', label: 'Rear Exit',   x: W * 0.70 },
      { id: 'exit_ne',   label: 'NE Exit',     x: W * 0.90 },
    ],
  },
};

export function buildEvacuationGraph(useRealWorld: boolean = false, graphSize: GraphSize = 'medium'): ScenarioGraph {
  if (useRealWorld) {
    return buildingEvacuationGraph as any;
  }

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const { floors, corridorXs, exits } = SIZE_CONFIG[graphSize];

  const floorGapY = 140;
  const startY = 50;
  const stairNX = W * 0.28;
  const stairSX = W * 0.72;

  const startZones = corridorXs.map((x, i) => ({
    id: `zone_${String.fromCharCode(65 + i)}`,
    label: `Zone ${String.fromCharCode(65 + i)}`,
    x,
  }));

  startZones.forEach((z) => {
    nodes.push({ id: z.id, label: z.label, type: 'start', x: z.x, y: startY, level: 0, buildingId: 'top' });
  });

  for (let f = floors; f >= 1; f--) {
    const floorIdx = floors - f;
    const floorY = startY + 100 + floorIdx * floorGapY;

    const stairNId = `stair_N_F${f}`;
    const stairSId = `stair_S_F${f}`;

    nodes.push({ id: stairNId, label: `N-Stair F${f}`, type: 'stairwell', x: stairNX, y: floorY, level: floorIdx + 1, buildingId: 'stair_N' });
    nodes.push({ id: stairSId, label: `S-Stair F${f}`, type: 'stairwell', x: stairSX, y: floorY, level: floorIdx + 1, buildingId: 'stair_S' });

    corridorXs.forEach((cx, ci) => {
      const corrId = `corr_F${f}_${ci + 1}`;
      nodes.push({ id: corrId, label: `Corridor F${f}-${ci + 1}`, type: 'corridor', x: cx, y: floorY, level: floorIdx + 1, buildingId: `floor_${f}` });

      if (f === floors) {
        edges.push({ id: `${startZones[ci].id}-${corrId}`, from: startZones[ci].id, to: corrId, latency: 10, label: '10s', type: 'corridor' });
      }

      edges.push({ id: `${corrId}-${stairNId}`, from: corrId, to: stairNId, latency: 8, label: '8s', type: 'corridor' });
      edges.push({ id: `${corrId}-${stairSId}`, from: corrId, to: stairSId, latency: 8, label: '8s', type: 'corridor' });
    });

    if (f > 1) {
      edges.push({ id: `stair_N_F${f}-stair_N_F${f - 1}`, from: stairNId, to: `stair_N_F${f - 1}`, latency: 15, label: '15s', type: 'path' });
      edges.push({ id: `stair_S_F${f}-stair_S_F${f - 1}`, from: stairSId, to: `stair_S_F${f - 1}`, latency: 15, label: '15s', type: 'path' });
    }
  }

  const exitY = startY + 100 + floors * floorGapY;
  exits.forEach((ex) => {
    nodes.push({ id: ex.id, label: ex.label, type: 'emergency_exit', x: ex.x, y: exitY, level: floors + 2, buildingId: 'ground' });
  });

  const groundStairN = 'stair_N_F1';
  const groundStairS = 'stair_S_F1';
  const midIdx = Math.floor(exits.length / 2);

  exits.forEach((ex, i) => {
    if (i <= midIdx) {
      edges.push({ id: `${groundStairN}-${ex.id}`, from: groundStairN, to: ex.id, latency: 5, label: '5s', type: 'path' });
    }
    if (i >= midIdx) {
      edges.push({ id: `${groundStairS}-${ex.id}`, from: groundStairS, to: ex.id, latency: 5, label: '5s', type: 'path' });
    }
  });

  const destinationIds = exits.map(e => e.id);
  return { nodes, edges, sourceId: startZones[0].id, destinationIds, width: W, height: H };
}

export function getEvacuationFireCandidates(graph: ScenarioGraph): string[] {
  return graph.nodes.filter(n => n.type === 'corridor' || n.type === 'stairwell').map(n => n.id);
}
