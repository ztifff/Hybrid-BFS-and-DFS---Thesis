import { ScenarioGraph, GraphNode, GraphEdge, GraphSize } from '../types/index';
import { buildingEvacuationGraph } from '../data/evacuation.building';

const W = 1600; 
const H = 1200;

function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// 🧠 DIALED DOWN: Adjusted the floors and rooms so the large map fits perfectly!
const SIZE_CONFIG = {
  small: { floors: 3, roomsPerFloor: 3 },
  medium: { floors: 4, roomsPerFloor: 4 },
  large: { floors: 5, roomsPerFloor: 5 }
};

export function buildEvacuationGraph(
  useRealWorld: boolean = false, 
  seed: number = 123, 
  graphSize: GraphSize = 'medium'
): ScenarioGraph {
  if (useRealWorld) {
    const rwGraph = { ...(buildingEvacuationGraph as ScenarioGraph) };
    
    // Grab all real-world rooms to use as potential starting zones
    const startZones = rwGraph.nodes.filter(n => n.type === 'room');
    if (startZones.length > 0) {
      const startIdx = Math.floor(seededRandom(seed) * startZones.length);
      rwGraph.sourceId = startZones[startIdx].id;
    }
    return rwGraph;
  }
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const config = SIZE_CONFIG[graphSize];

  const floorHeight = (H - 200) / config.floors;
  const roomSpacing = (W - 400) / (config.roomsPerFloor + 1);

  // 1. Build Ground Floor Exits
  const exits = [
    { id: 'exit_L', label: 'West Exit', x: 150 },
    { id: 'exit_R', label: 'East Exit', x: W - 150 }
  ];
  if (config.floors > 3) exits.push({ id: 'exit_M', label: 'Main Lobby', x: W / 2 });

  exits.forEach(ex => {
    nodes.push({ id: ex.id, label: ex.label, type: 'emergency_exit', x: ex.x, y: H - 50, level: 0, buildingId: 'ground' });
  });

  const startZones: GraphNode[] = [];

  // 2. Build the Floors (Stairs, Corridors, Rooms)
  for (let f = 1; f <= config.floors; f++) {
    const yPos = H - 50 - (f * floorHeight);
    
    // Stairwells
    const stairL = `stair_L_F${f}`;
    const stairR = `stair_R_F${f}`;
    nodes.push({ id: stairL, label: `West Stair F${f}`, type: 'stairwell', x: 150, y: yPos, level: f, buildingId: 'bldg' });
    nodes.push({ id: stairR, label: `East Stair F${f}`, type: 'stairwell', x: W - 150, y: yPos, level: f, buildingId: 'bldg' });

    // Connect Stairs Vertically
    if (f === 1) {
      edges.push({ id: `${stairL}-exit_L`, from: stairL, to: 'exit_L', latency: 5, label: '5s', type: 'path' });
      edges.push({ id: `${stairR}-exit_R`, from: stairR, to: 'exit_R', latency: 5, label: '5s', type: 'path' });
      if (config.floors > 3) {
        const lobby = `corr_${Math.floor(config.roomsPerFloor/2)}_F1`;
        edges.push({ id: `${lobby}-exit_M`, from: lobby, to: 'exit_M', latency: 5, label: '5s', type: 'path' });
      }
    } else {
      // Stairs only go down! (One-way is perfect here)
      edges.push({ id: `${stairL}-stair_L_F${f-1}`, from: stairL, to: `stair_L_F${f-1}`, latency: 15, label: '15s', type: 'path' });
      edges.push({ id: `${stairR}-stair_R_F${f-1}`, from: stairR, to: `stair_R_F${f-1}`, latency: 15, label: '15s', type: 'path' });
    }

    // Build Corridors and Rooms
    let prevCorr = stairL;
    for (let r = 1; r <= config.roomsPerFloor; r++) {
      const corrId = `corr_${r}_F${f}`;
      const xPos = 150 + (r * roomSpacing);
      nodes.push({ id: corrId, label: `Corridor ${f}0${r}`, type: 'corridor', x: xPos, y: yPos, level: f, buildingId: 'bldg' });
      
      // 🧠 FIX 1: Bidirectional Corridors (People can run Left or Right to escape fires!)
      edges.push({ id: `${prevCorr}-${corrId}`, from: prevCorr, to: corrId, latency: 4, label: '4s', type: 'corridor' });
      edges.push({ id: `${corrId}-${prevCorr}`, from: corrId, to: prevCorr, latency: 4, label: '4s', type: 'corridor' });
      prevCorr = corrId;

      // Add a Room attached to this corridor
      const roomId = `room_${r}_F${f}`;
      const roomNode: GraphNode = { id: roomId, label: `Room ${f}0${r}`, type: 'place', x: xPos, y: yPos - 60, level: f+1, buildingId: 'bldg' };
      nodes.push(roomNode);
      
      // 🧠 FIX 2: Bidirectional Rooms (Algorithms can now exit the room they spawn in!)
      edges.push({ id: `${corrId}-${roomId}`, from: corrId, to: roomId, latency: 3, label: '3s', type: 'path' });
      edges.push({ id: `${roomId}-${corrId}`, from: roomId, to: corrId, latency: 3, label: '3s', type: 'path' });
      
      if (f > 1) startZones.push(roomNode); 
    }
    
    // Connect final corridor to Right Stairwell (Bidirectional)
    edges.push({ id: `${prevCorr}-${stairR}`, from: prevCorr, to: stairR, latency: 4, label: '4s', type: 'corridor' });
    edges.push({ id: `${stairR}-${prevCorr}`, from: stairR, to: prevCorr, latency: 4, label: '4s', type: 'corridor' });
  }

  // 3. Randomize Start Room
  const startIdx = Math.floor(seededRandom(seed) * startZones.length);
  const destinationIds = exits.map(e => e.id);

  return { nodes, edges, sourceId: startZones[startIdx].id, destinationIds, width: W, height: H };
}

export function getEvacuationFireCandidates(graph: ScenarioGraph): string[] {
  return graph.nodes.filter(n => n.type === 'corridor' || n.type === 'stairwell').map(n => n.id);
}