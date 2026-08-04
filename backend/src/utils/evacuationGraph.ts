import { ScenarioGraph, GraphNode, GraphEdge, GraphSize, GraphSizing } from '../types/index';
import { buildingEvacuationGraph } from '../data/evacuation.building';
import { clemensBuildingGraph } from '../data/evacuation.clemens';
import { ayalaMallBuildingGraph } from '../data/evacuation.ayala';
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
  large: { floors: 5, roomsPerFloor: 5 }
};

function resolveEvacuationShape(targetNodes: number, fallback: typeof SIZE_CONFIG.medium, hasSizing: boolean) {
  if (!hasSizing) {
    return {
      floors: fallback.floors,
      exitCount: fallback.floors > 3 ? 3 : 2,
      roomsByFloor: Array.from({ length: fallback.floors }, () => fallback.roomsPerFloor),
      corridorOnlyByFloor: Array.from({ length: fallback.floors }, () => 1),
    };
  }

  const floors = clampInt(Math.round(Math.sqrt(targetNodes / 4)), 2, 8);
  const exitCount = clampInt(Math.round(floors / 2), 1, 4);

  let remainingNodes = Math.max(0, targetNodes - exitCount - (floors * 2));
  const nodesPerFloor = Math.floor(remainingNodes / floors);
  const extraNodes = remainingNodes % floors;

  const roomsByFloor: number[] = [];
  const corridorOnlyByFloor: number[] = [];

  for (let floorIndex = 0; floorIndex < floors; floorIndex++) {
    const floorBudget = nodesPerFloor + (floorIndex < extraNodes ? 1 : 0);
    const roomCount = Math.max(1, Math.floor(floorBudget * 0.7));
    const corridorCount = Math.max(1, floorBudget - roomCount);
    roomsByFloor.push(roomCount);
    corridorOnlyByFloor.push(corridorCount);
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
      'city': ayalaMallBuildingGraph,
      'ayala': ayalaMallBuildingGraph,
      'building': buildingEvacuationGraph
    };
    const baseGraph = registry[mapId || 'city'] || ayalaMallBuildingGraph;
    const rwGraph = { ...(baseGraph as ScenarioGraph) };

    const startZones = rwGraph.nodes.filter((node: any) => node.type === 'origin' || node.type === 'room');

    if (startZones.length > 0) {
      const startIdx = Math.floor(seededRandom(seed) * startZones.length);
      rwGraph.sourceId = startZones[startIdx].id;
    }

    return rwGraph;
  }

  // ── Synthetic Clemens Hall Multi-Floor Building Graph (Dynamic Sizing) ──────────
  const CW = 58000;
  const CH = 36000;

  const fallback = SIZE_CONFIG[graphSize];
  const fallbackNodes = 45;
  const targetNodes = resolveSizingValue(sizing?.nodes, fallbackNodes, 10, 220);

  // ── Explicit Floor Addition Rule ──────────────────────────────────────────
  // Base building has 2 floors (L1, L2).
  // Every ~35 additional nodes adds 1 floor, up to 5 floors max:
  //   10 – 35 nodes  ➔ 2 Floors (L1, L2)
  //   36 – 70 nodes  ➔ 3 Floors (L1, L2, L3)
  //   71 – 105 nodes ➔ 4 Floors (L1..L4)
  //   106+ nodes     ➔ 5 Floors (L1..L5)
  let numFloors = 2;
  if (targetNodes > 105) numFloors = 5;
  else if (targetNodes > 70) numFloors = 4;
  else if (targetNodes > 35) numFloors = 3;

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const startZones: GraphNode[] = [];

  // Ground Exits (L1) - 4 fixed exit nodes
  const exits = [
    { id: 'exit_south_main', label: 'Main Entrance (South Exit)', x: 29000, y: 36000 },
    { id: 'exit_north_gate', label: 'North Gate Exit',             x: 29000, y:     0 },
    { id: 'exit_west_fire',  label: 'West Fire Exit (Ground)',    x:     0, y: 17000 },
    { id: 'exit_east_fire',  label: 'East Fire Exit (Ground)',    x: 58000, y: 17000 },
  ];

  exits.forEach(exit => {
    nodes.push({
      id: exit.id,
      label: exit.label,
      type: 'emergency_exit',
      x: exit.x,
      y: exit.y,
      level: 1,
      buildingId: 'L1',
    });
  });

  const spineCols = [10000, 16000, 22000, 29000, 36000, 42000, 48000];

  // First pass: Build fixed structural backbone for each floor (5 vertical + 7 spine = 12 nodes per floor)
  for (let f = 1; f <= numFloors; f++) {
    const bId = `L${f}`;

    // Vertical Access System Nodes (5 per floor)
    const stairW = `stair_w_${f}`;
    const stairE = `stair_e_${f}`;
    const stairM = `stair_main_${f}`;
    const elevN  = `elev_n_${f}`;
    const elevS  = `elev_s_${f}`;

    nodes.push({ id: stairW, label: `West Fire Stairs (${bId})`, type: 'stairwell', x:  4000, y: 12000, level: f, buildingId: bId });
    nodes.push({ id: stairE, label: `East Fire Stairs (${bId})`, type: 'stairwell', x: 56000, y: 12000, level: f, buildingId: bId });
    nodes.push({ id: stairM, label: `Main Staircase (${bId})`,   type: 'stairwell', x: 29000, y: 22000, level: f, buildingId: bId });
    nodes.push({ id: elevN,  label: `North Elevator (${bId})`,   type: 'stairwell', x: 16000, y:  3000, level: f, buildingId: bId });
    nodes.push({ id: elevS,  label: `South Elevator (${bId})`,   type: 'stairwell', x: 42000, y: 31000, level: f, buildingId: bId });

    // Connect vertical nodes between floors
    if (f === 1) {
      edges.push({ id: `e_stair_w_exit_${f}`, from: stairW, to: 'exit_west_fire',  latency: 3, label: '3s', type: 'corridor' });
      edges.push({ id: `e_stair_e_exit_${f}`, from: stairE, to: 'exit_east_fire',  latency: 3, label: '3s', type: 'corridor' });
      edges.push({ id: `e_stair_m_exit_${f}`, from: stairM, to: 'exit_south_main', latency: 4, label: '4s', type: 'corridor' });
    } else {
      edges.push({ id: `e_stair_w_dn_${f}`, from: stairW, to: `stair_w_${f - 1}`, latency: 12, label: '12s', type: 'corridor' });
      edges.push({ id: `e_stair_e_dn_${f}`, from: stairE, to: `stair_e_${f - 1}`, latency: 12, label: '12s', type: 'corridor' });
      edges.push({ id: `e_stair_m_dn_${f}`, from: stairM, to: `stair_main_${f - 1}`, latency: 10, label: '10s', type: 'corridor' });
      edges.push({ id: `e_elev_n_dn_${f}`,  from: elevN,  to: `elev_n_${f - 1}`,  latency: 6,  label: '6s',  type: 'corridor' });
      edges.push({ id: `e_elev_s_dn_${f}`,  from: elevS,  to: `elev_s_${f - 1}`,  latency: 6,  label: '6s',  type: 'corridor' });
    }

    // Spine Corridor Nodes (7 per floor)
    let prevSpine: string | null = null;
    spineCols.forEach((xPos, idx) => {
      const sId = `l${f}_spine_${idx}`;
      nodes.push({ id: sId, label: `${bId} Main Hall ${idx + 1}`, type: 'corridor', x: xPos, y: 17000, level: f, buildingId: bId });

      if (prevSpine) {
        edges.push({ id: `e_${prevSpine}_${sId}`, from: prevSpine, to: sId, latency: 4, label: '4s', type: 'corridor' });
        edges.push({ id: `e_${sId}_${prevSpine}`, from: sId, to: prevSpine, latency: 4, label: '4s', type: 'corridor' });
      }
      prevSpine = sId;

      if (xPos === 10000) {
        edges.push({ id: `e_${sId}_stairw`, from: sId, to: stairW, latency: 5, label: '5s', type: 'corridor' });
        edges.push({ id: `e_stairw_${sId}`, from: stairW, to: sId, latency: 5, label: '5s', type: 'corridor' });
      }
      if (xPos === 48000) {
        edges.push({ id: `e_${sId}_staire`, from: sId, to: stairE, latency: 5, label: '5s', type: 'corridor' });
        edges.push({ id: `e_staire_${sId}`, from: stairE, to: sId, latency: 5, label: '5s', type: 'corridor' });
      }
      if (xPos === 29000) {
        edges.push({ id: `e_${sId}_stairm`, from: sId, to: stairM, latency: 4, label: '4s', type: 'corridor' });
        edges.push({ id: `e_stairm_${sId}`, from: stairM, to: sId, latency: 4, label: '4s', type: 'corridor' });
        
        // Connect the North Gate Exit on Floor 1 to this central spine node
        if (f === 1) {
          edges.push({ id: `e_${sId}_exitn`, from: sId, to: 'exit_north_gate', latency: 4, label: '4s', type: 'corridor' });
          edges.push({ id: `e_exitn_${sId}`, from: 'exit_north_gate', to: sId, latency: 4, label: '4s', type: 'corridor' });
        }
      }
      if (xPos === 16000) {
        edges.push({ id: `e_${sId}_elevn`, from: sId, to: elevN, latency: 4, label: '4s', type: 'corridor' });
        edges.push({ id: `e_elevn_${sId}`, from: elevN, to: sId, latency: 4, label: '4s', type: 'corridor' });
      }
      if (xPos === 42000) {
        edges.push({ id: `e_${sId}_elevs`, from: sId, to: elevS, latency: 4, label: '4s', type: 'corridor' });
        edges.push({ id: `e_elevs_${sId}`, from: elevS, to: sId, latency: 4, label: '4s', type: 'corridor' });
      }
    });
  }

  // Second pass: Calculate remaining node budget and fill up rooms/hallways precisely
  const fixedNodesCount = nodes.length; // 4 exits + (numFloors * 12)
  let remainingBudget = Math.max(0, targetNodes - fixedNodesCount);

  // Available room slots per floor (up to 4 north rooms + 4 south rooms = 8 room slots per floor)
  const roomSlots = [
    { side: 'north', x: 10000, corrY:  8000, roomY:  3000, labelSuffix: '01' },
    { side: 'north', x: 22000, corrY:  8000, roomY:  3000, labelSuffix: '02' },
    { side: 'north', x: 36000, corrY:  8000, roomY:  3000, labelSuffix: '03' },
    { side: 'north', x: 48000, corrY:  8000, roomY:  3000, labelSuffix: '04' },
    { side: 'south', x: 10000, corrY: 26000, roomY: 31000, labelSuffix: '05' },
    { side: 'south', x: 22000, corrY: 26000, roomY: 31000, labelSuffix: '06' },
    { side: 'south', x: 36000, corrY: 26000, roomY: 31000, labelSuffix: '07' },
    { side: 'south', x: 48000, corrY: 26000, roomY: 31000, labelSuffix: '08' },
  ];

  // Fill rooms in round-robin fashion across floors & slots to match remainingBudget exactly
  let slotIdx = 0;
  let floorIdx = 1;

  while (remainingBudget > 0 && floorIdx <= numFloors) {
    const bId = `L${floorIdx}`;
    const slot = roomSlots[slotIdx];

    // Try to add a pair: 1 Corridor node + 1 Room node (2 nodes) if budget >= 2
    // If budget == 1, add 1 Corridor node
    const corrId = `l${floorIdx}_${slot.side}_c_${slotIdx}`;
    nodes.push({
      id: corrId,
      label: `${bId} ${slot.side === 'north' ? 'North' : 'South'} Hall ${slotIdx + 1}`,
      type: 'corridor',
      x: slot.x,
      y: slot.corrY,
      level: floorIdx,
      buildingId: bId,
    });
    remainingBudget--;

    // Connect corridor node to spine
    const spineMatch = `l${floorIdx}_spine_${spineCols.indexOf(slot.x)}`;
    if (nodes.some(n => n.id === spineMatch)) {
      edges.push({ id: `e_${corrId}_${spineMatch}`, from: corrId, to: spineMatch, latency: 5, label: '5s', type: 'corridor' });
      edges.push({ id: `e_${spineMatch}_${corrId}`, from: spineMatch, to: corrId, latency: 5, label: '5s', type: 'corridor' });
    }

    if (remainingBudget > 0) {
      const roomId = `l${floorIdx}_room_${slot.labelSuffix}`;
      const roomNode: GraphNode = {
        id: roomId,
        label: `Room ${floorIdx}${slot.labelSuffix}`,
        type: 'place',
        x: slot.x,
        y: slot.roomY,
        level: floorIdx,
        buildingId: bId,
      };
      nodes.push(roomNode);
      remainingBudget--;

      edges.push({ id: `e_${roomId}_${corrId}`, from: roomId, to: corrId, latency: 3, label: '3s', type: 'corridor' });
      edges.push({ id: `e_${corrId}_${roomId}`, from: corrId, to: roomId, latency: 3, label: '3s', type: 'corridor' });

      if (floorIdx > 1) startZones.push(roomNode);
    }

    // Advance slot index and floor index
    slotIdx++;
    if (slotIdx >= roomSlots.length) {
      slotIdx = 0;
      floorIdx++;
    }
  }

  const startIdx = Math.floor(seededRandom(seed) * (startZones.length || 1));
  const destinationIds = exits.map(e => e.id);

  const graph = {
    nodes,
    edges,
    sourceId: startZones[startIdx]?.id ?? (nodes.find(n => n.type === 'place')?.id || nodes[0].id),
    destinationIds,
    width: CW,
    height: CH,
  };

  return fitGraphEdgeCount(
    graph,
    sizing?.edges ? sizing.edges * 2 : undefined,
    seed,
    { edgeType: 'corridor', labelUnit: 's', latencyBase: 2, latencySpread: 5, maxEdges: targetNodes * 10 }
  );
}

export function getEvacuationFireCandidates(graph: ScenarioGraph): string[] {
  // If it's the traffic emergency graph, use its corridors instead of stairwells
  return graph.nodes.filter((node) => node.type === 'corridor' || node.type === 'stairwell').map((node) => node.id);
}
