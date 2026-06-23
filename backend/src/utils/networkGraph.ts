import { ScenarioGraph, GraphNode, GraphEdge, GraphSize } from '../types/index';
import { datacenterNetworkGraph } from '../data/network.datacenter';
import { as733NetworkGraph } from '../data/network.as733';

function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const W = 1000;
const H = 780;

const SIZE_CONFIG = {
  small: [
    { id: 'A', name: 'Engineering', floors: 2, apsPerFloor: 2, cx: W * 0.25 },
    { id: 'B', name: 'Research',    floors: 2, apsPerFloor: 2, cx: W * 0.75 },
  ],
  medium: [
    { id: 'A', name: 'Engineering', floors: 4, apsPerFloor: 3, cx: W * 0.18 },
    { id: 'B', name: 'Research',    floors: 3, apsPerFloor: 2, cx: W * 0.50 },
    { id: 'C', name: 'Admin',       floors: 2, apsPerFloor: 2, cx: W * 0.82 },
  ],
  large: [
    { id: 'A', name: 'Engineering', floors: 6, apsPerFloor: 4, cx: W * 0.12 },
    { id: 'B', name: 'R&D',         floors: 5, apsPerFloor: 3, cx: W * 0.30 },
    { id: 'C', name: 'Research',    floors: 4, apsPerFloor: 3, cx: W * 0.50 },
    { id: 'D', name: 'Admin',       floors: 3, apsPerFloor: 2, cx: W * 0.70 },
    { id: 'E', name: 'Operations',  floors: 2, apsPerFloor: 2, cx: W * 0.88 },
  ],
};

export function buildNetworkGraph(
  useRealWorld: boolean = false,
  seed: number = 123,
  networkMode: 'datacenter' | 'as733' | 'synthetic' = 'synthetic',
  graphSize: GraphSize = 'medium'
): ScenarioGraph {

  if (networkMode === 'as733') {
    const graph = JSON.parse(JSON.stringify(as733NetworkGraph)) as ScenarioGraph;
    const potentialExits = graph.nodes.filter(n => n.type === 'access_point' && n.id !== graph.sourceId);
    const shuffled = potentialExits.sort((a, b) => seededRandom(seed + a.x) - seededRandom(seed + b.x));
    graph.destinationIds = shuffled.slice(0, 8).map(n => n.id);
    return graph;
  }

  if (networkMode === 'datacenter' || useRealWorld) {
    const graph = JSON.parse(JSON.stringify(datacenterNetworkGraph)) as ScenarioGraph;
    const SCALE_X = 2.8;
    const SCALE_Y = 2.0;
    graph.width *= SCALE_X;
    graph.height *= SCALE_Y;
    graph.nodes.forEach(node => {
      if (node.type === 'router') node.type = 'building_router';
      if (node.type === 'switch') node.type = 'floor_router';
      if (node.level === 4) node.type = 'server';
      node.x *= SCALE_X;
      node.y *= SCALE_Y;
    });
    const potentialExits = graph.nodes.filter(
      n => (n.level === 4 || n.type === 'server') && n.id !== graph.sourceId
    );
    const shuffled = potentialExits.sort((a, b) => {
      return seededRandom(seed + a.x) - seededRandom(seed + b.x);
    });
    const selectedExits = shuffled.slice(0, 8);
    graph.destinationIds = selectedExits.map(n => n.id);
    selectedExits.forEach(n => { n.type = 'access_point'; });
    return graph;
  }

  // Synthetic — size-driven
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const buildings = SIZE_CONFIG[graphSize];

  nodes.push({
    id: 'dc',
    label: 'Main Data Center',
    type: 'datacenter',
    x: W / 2,
    y: 48,
    level: 0,
  });

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
    edges.push({ id: `dc-${brId}`, from: 'dc', to: brId, latency: 1, label: '1ms', type: 'fiber' });

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
      edges.push({ id: `${brId}-${frId}`, from: brId, to: frId, latency: 5, label: '5ms', type: 'ethernet' });

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
        edges.push({ id: `${frId}-${apId}`, from: frId, to: apId, latency: 5, label: '5ms', type: 'ethernet' });
      }
    }
  });

  const destinationIds = nodes.filter(n => n.type === 'access_point').map(n => n.id);
  return { nodes, edges, sourceId: 'dc', destinationIds, width: W, height: H };
}

export function getNetworkFailureCandidates(graph: ScenarioGraph): string[] {
  return graph.nodes
    .filter(n => n.type === 'floor_router' || n.type === 'building_router' || n.type === 'router' || n.type === 'switch')
    .map(n => n.id);
}

export function listNetworkTypes(): string[] {
  return ['datacenter', 'aws', 'traffic', 'evacuation', 'gameai', 'robotics', 'mockoffice'];
}

export function getAllNetworkMeta() {
  return listNetworkTypes().map(type => ({
    type,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} Network`
  }));
}

export function getNetworkGraph(networkType: string): ScenarioGraph {
  return buildNetworkGraph(false, 123);
}
