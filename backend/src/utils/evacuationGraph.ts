import { ScenarioGraph, GraphNode, GraphEdge, GraphSize, GraphSizing } from '../types/index';
import { buildingEvacuationGraph } from '../data/evacuation.building';
import { emergencyRoutingGraph } from '../data/traffic.emergency';
import { clampInt, fitGraphEdgeCount, resolveSizingValue } from './graphSizing';

const W = 1600;
const H = 1200;

function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const SIZE_CONFIG = {
  small: { floors: 3, roomsPerFloor: 3 },
  medium: { floors: 4, roomsPerFloor: 4 },
  large: { floors: 5, roomsPerFloor: 5 },
};

function resolveEvacuationShape(targetNodes: number, fallback: typeof SIZE_CONFIG.medium, hasSizing: boolean) {
  const fallbackExitCount = fallback.floors > 3 ? 3 : 2;

  if (!hasSizing) {
    return {
      floors: fallback.floors,
      exitCount: fallbackExitCount,
      roomsByFloor: Array.from({ length: fallback.floors }, () => fallback.roomsPerFloor),
      corridorOnlyByFloor: Array.from({ length: fallback.floors }, () => 0),
    };
  }

  let floors = clampInt(Math.sqrt(targetNodes / 2), 2, 10);
  let exitCount = targetNodes > 28 ? 3 : 2;

  while (exitCount + (floors * 4) > targetNodes && floors > 2) floors--;
  if (exitCount + (floors * 4) > targetNodes) exitCount = 2;

  const roomsByFloor = Array.from({ length: floors }, () => 1);
  const corridorOnlyByFloor = Array.from({ length: floors }, () => 0);
  let remaining = targetNodes - exitCount - (floors * 2) - (floors * 2);
  let floorIndex = 0;

  while (remaining >= 2) {
    roomsByFloor[floorIndex % floors]++;
    remaining -= 2;
    floorIndex++;
  }

  if (remaining === 1) {
    corridorOnlyByFloor[floorIndex % floors]++;
  }

  return { floors, exitCount, roomsByFloor, corridorOnlyByFloor };
}

export function buildEvacuationGraph(
  useRealWorld: boolean = false,
  seed: number = 123,
  mapId?: string,
  graphSize: GraphSize = 'medium',
  sizing?: GraphSizing
): ScenarioGraph {
  if (useRealWorld) {
    const registry: Record<string, any> = {
      'city': emergencyRoutingGraph,
      'building': buildingEvacuationGraph
    };
    const baseGraph = registry[mapId || 'building'] || buildingEvacuationGraph;
    const rwGraph = { ...(baseGraph as ScenarioGraph) };

    const startZones = rwGraph.nodes.filter((node: any) => node.type === 'origin' || node.type === 'room');

    if (startZones.length > 0) {
      const startIdx = Math.floor(seededRandom(seed) * startZones.length);
      rwGraph.sourceId = startZones[startIdx].id;
    }

    return rwGraph;
  }

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const fallback = SIZE_CONFIG[graphSize];
  const fallbackExitCount = fallback.floors > 3 ? 3 : 2;
  const fallbackNodes = fallbackExitCount + (fallback.floors * (2 + (fallback.roomsPerFloor * 2)));
  const targetNodes = resolveSizingValue(sizing?.nodes, fallbackNodes, 10, 220);
  const config = resolveEvacuationShape(targetNodes, fallback, Boolean(sizing));

  const floorHeight = (H - 200) / config.floors;
  const maxCorridors = Math.max(
    ...config.roomsByFloor.map((roomCount, index) => roomCount + (config.corridorOnlyByFloor[index] ?? 0)),
    1
  );
  const roomSpacing = (W - 400) / (maxCorridors + 1);

  const exits = [
    { id: 'exit_L', label: 'West Exit', x: 150 },
    { id: 'exit_R', label: 'East Exit', x: W - 150 },
  ];

  if (config.exitCount > 2) {
    exits.push({ id: 'exit_M', label: 'Main Lobby', x: W / 2 });
  }

  exits.forEach((exit) => {
    nodes.push({
      id: exit.id,
      label: exit.label,
      type: 'emergency_exit',
      x: exit.x,
      y: H - 50,
      level: 0,
      buildingId: 'ground',
    });
  });

  const startZones: GraphNode[] = [];
  const firstFloorCorridors: string[] = [];

  for (let f = 1; f <= config.floors; f++) {
    const yPos = H - 50 - (f * floorHeight);
    const stairL = `stair_L_F${f}`;
    const stairR = `stair_R_F${f}`;

    nodes.push({ id: stairL, label: `West Stair F${f}`, type: 'stairwell', x: 150, y: yPos, level: f, buildingId: 'bldg' });
    nodes.push({ id: stairR, label: `East Stair F${f}`, type: 'stairwell', x: W - 150, y: yPos, level: f, buildingId: 'bldg' });

    if (f === 1) {
      edges.push({ id: `${stairL}-exit_L`, from: stairL, to: 'exit_L', latency: 5, label: '5s', type: 'path' });
      edges.push({ id: `${stairR}-exit_R`, from: stairR, to: 'exit_R', latency: 5, label: '5s', type: 'path' });
    } else {
      edges.push({ id: `${stairL}-stair_L_F${f - 1}`, from: stairL, to: `stair_L_F${f - 1}`, latency: 15, label: '15s', type: 'path' });
      edges.push({ id: `${stairR}-stair_R_F${f - 1}`, from: stairR, to: `stair_R_F${f - 1}`, latency: 15, label: '15s', type: 'path' });
    }

    let prevCorr = stairL;
    const roomCount = config.roomsByFloor[f - 1] ?? 1;
    const corridorCount = roomCount + (config.corridorOnlyByFloor[f - 1] ?? 0);

    for (let r = 1; r <= corridorCount; r++) {
      const corrId = `corr_${r}_F${f}`;
      const xPos = 150 + (r * roomSpacing);

      nodes.push({ id: corrId, label: `Corridor ${f}0${r}`, type: 'corridor', x: xPos, y: yPos, level: f, buildingId: 'bldg' });
      if (f === 1) firstFloorCorridors.push(corrId);

      edges.push({ id: `${prevCorr}-${corrId}`, from: prevCorr, to: corrId, latency: 4, label: '4s', type: 'corridor' });
      edges.push({ id: `${corrId}-${prevCorr}`, from: corrId, to: prevCorr, latency: 4, label: '4s', type: 'corridor' });
      prevCorr = corrId;

      if (r <= roomCount) {
        const roomId = `room_${r}_F${f}`;
        const roomNode: GraphNode = {
          id: roomId,
          label: `Room ${f}0${r}`,
          type: 'place',
          x: xPos,
          y: yPos - 60,
          level: f + 1,
          buildingId: 'bldg',
        };

        nodes.push(roomNode);
        edges.push({ id: `${corrId}-${roomId}`, from: corrId, to: roomId, latency: 3, label: '3s', type: 'path' });
        edges.push({ id: `${roomId}-${corrId}`, from: roomId, to: corrId, latency: 3, label: '3s', type: 'path' });

        if (f > 1) startZones.push(roomNode);
      }
    }

    edges.push({ id: `${prevCorr}-${stairR}`, from: prevCorr, to: stairR, latency: 4, label: '4s', type: 'corridor' });
    edges.push({ id: `${stairR}-${prevCorr}`, from: stairR, to: prevCorr, latency: 4, label: '4s', type: 'corridor' });
  }

  if (config.exitCount > 2 && firstFloorCorridors.length > 0) {
    const lobby = firstFloorCorridors[Math.floor(firstFloorCorridors.length / 2)];
    edges.push({ id: `${lobby}-exit_M`, from: lobby, to: 'exit_M', latency: 5, label: '5s', type: 'path' });
  }

  const startIdx = Math.floor(seededRandom(seed) * startZones.length);
  const destinationIds = exits.map((exit) => exit.id);
  const graph = {
    nodes,
    edges,
    sourceId: startZones[startIdx]?.id ?? nodes[0].id,
    destinationIds,
    width: W,
    height: H,
  };

  return fitGraphEdgeCount(
    graph,
    sizing?.edges,
    seed,
    { edgeType: 'corridor', labelUnit: 's', latencyBase: 2, latencySpread: 5, maxEdges: targetNodes * 10 }
  );
}

export function getEvacuationFireCandidates(graph: ScenarioGraph): string[] {
  // If it's the traffic emergency graph, use its corridors instead of stairwells
  return graph.nodes.filter((node) => node.type === 'corridor' || node.type === 'stairwell').map((node) => node.id);
}
