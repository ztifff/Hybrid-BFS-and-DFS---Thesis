/**
 * Innovatech Corporate Campus Network Graph / Real-World Cloud Datacenter
 */

import { ScenarioGraph, GraphNode, GraphEdge } from '../types/index';
import { datacenterNetworkGraph } from '../data/network.datacenter';

// Simple deterministic pseudo-random generator to keep UI and Algorithm in sync
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const W = 1000;
const H = 780;

/**
 * Builds the graph based on the selected mode.
 * seed parameter ensures that randomized exits are identical for both 
 * the pathfinding algorithm and the visual renderer.
 */
export function buildNetworkGraph(useRealWorld: boolean = false, seed: number = 123): ScenarioGraph {
  
  if (useRealWorld) {
    // 1. Deep Clone to prevent mutating the source file data
    const graph = JSON.parse(JSON.stringify(datacenterNetworkGraph)) as ScenarioGraph;

    // 2. Astronomical Expansion Factor
    // Stretches the coordinate system so fixed-size labels don't overlap.
    const SCALE_X = 2.8; 
    const SCALE_Y = 2.0;
    graph.width *= SCALE_X;
    graph.height *= SCALE_Y;

    graph.nodes.forEach(node => {
      // FIX ICONS: Remap types so they match the NODE_CONFIG icons in the Canvas
      if (node.type === 'router') node.type = 'building_router';
      if (node.type === 'switch') node.type = 'floor_router';
      
      // Reset all bottom-tier nodes to neutral 'server' (Gray) before selecting targets
      if (node.level === 4) node.type = 'server';

      node.x *= SCALE_X;
      node.y *= SCALE_Y;
    });

    // 3. DETERMINISTIC TARGET SELECTION
    // Filter the pool of servers, ensuring the START node is never picked as an exit
    const potentialExits = graph.nodes.filter(
        n => (n.level === 4 || n.type === 'server') && n.id !== graph.sourceId
    );
    
    // Stable shuffle based on the current simulation seed
    const shuffled = potentialExits.sort((a, b) => {
        const hashA = seededRandom(seed + a.x);
        const hashB = seededRandom(seed + b.x);
        return hashA - hashB;
    });

    // Pick exactly 8 and "Upgrade" them to targets (Red color)
    const selectedExits = shuffled.slice(0, 8);
    graph.destinationIds = selectedExits.map(n => n.id);
    
    selectedExits.forEach(n => {
        n.type = 'access_point'; // This triggers the Red Color/Icon in the Legend
    });

    return graph;
  }

  // 👇 Standard Innovatech campus map logic (Preserved)
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  nodes.push({
    id: 'dc',
    label: 'Main Data Center',
    type: 'datacenter',
    x: W / 2,
    y: 48,
    level: 0,
  });

  const buildings = [
    { id: 'A', name: 'Engineering', floors: 5, apsPerFloor: 3, cx: W * 0.18 },
    { id: 'B', name: 'Research',    floors: 3, apsPerFloor: 2, cx: W * 0.50 },
    { id: 'C', name: 'Admin',       floors: 2, apsPerFloor: 2, cx: W * 0.82 },
  ];

  const buildingRouterY = 145;

  buildings.forEach((b) => {
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

    const floorStartY = 270;
    const floorGapY = (H - floorStartY - 60) / Math.max(b.floors, 1);

    for (let f = 1; f <= b.floors; f++) {
      const frId = `FR_${b.id}${f}`;
      const floorY = floorStartY + (f - 1) * floorGapY;

      nodes.push({
        id: frId,
        label: `Floor ${f} Router`,
        type: 'floor_router',
        x: b.cx,
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

/** Nodes eligible for dynamic failure */
export function getNetworkFailureCandidates(graph: ScenarioGraph): string[] {
  return graph.nodes
    .filter(
      (n) =>
        n.type === 'floor_router' || 
        n.type === 'building_router' ||
        n.type === 'router' || 
        n.type === 'switch'    
    )
    .map((n) => n.id);
}

// ============================================================
// ADDED: Controller Helper Functions
// ============================================================

export function listNetworkTypes(): string[] {
  return ['datacenter', 'aws', 'traffic', 'evacuation', 'gameai', 'robotics', 'mockoffice'];
}

export function getAllNetworkMeta() {
  return listNetworkTypes().map(type => ({ 
    type, 
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Network` 
  }));
}

// Wrapper so controllers requesting 'getNetworkGraph' don't fail
export function getNetworkGraph(networkType: string): ScenarioGraph {
  // If your buildNetworkGraph eventually takes the networkType, you can pass it here.
  // For now, we return the base function to satisfy the controller.
  return buildNetworkGraph(false, 123);
}