import { ScenarioGraph, GraphNode, GraphEdge, GraphSize, GraphSizing } from '../types/index';
import { awsWarehouseGraph } from '../data/robotics.aws';
import { clinicGraph } from '../data/robotics.clinic';
import { clampInt, fitGraphEdgeCount, resolveSizingValue } from './graphSizing';

const W = 50000; 
const H = 30000;

function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function addTwoWayEdge(edges: GraphEdge[], from: string, to: string, latency: number, label: string) {
  edges.push({ id: `${from}-${to}`, from, to, latency, label, type: 'path' });
  edges.push({ id: `${to}-${from}`, from: to, to: from, latency, label, type: 'path' });
}

const SIZE_CONFIG = {
  small: { aisles: 3, shelvesPerAisle: 2 },
  medium: { aisles: 5, shelvesPerAisle: 3 },
  large: { aisles: 6, shelvesPerAisle: 4 }
};

function resolveRoboticsShape(targetNodes: number, fallback: typeof SIZE_CONFIG.medium, hasSizing: boolean) {
  if (!hasSizing) {
    return {
      aisles: fallback.aisles,
      sectionsByAisle: Array.from(
        { length: fallback.aisles },
        () => Array.from({ length: fallback.shelvesPerAisle }, () => 2)
      ),
    };
  }

  let aisles = clampInt(Math.round(Math.sqrt(targetNodes * 1.5)), 2, 18);
  const totalSections = Math.max(aisles, targetNodes - 1 - (2 * aisles));
  const sectionsPerAisle = Math.max(1, Math.floor(totalSections / aisles));

  const sectionsByAisle: number[][] = [];
  for (let a = 0; a < aisles; a++) {
    sectionsByAisle.push(Array.from({ length: sectionsPerAisle }, () => 2));
  }

  return { aisles, sectionsByAisle };
}

export function buildRoboticsGraph(
  useRealWorld: boolean = false, 
  seed: number = 123, 
  mapId: string = 'aws',
  graphSize: GraphSize = 'medium',
  sizing?: GraphSizing
): ScenarioGraph {
  if (useRealWorld) {
    const registry: Record<string, any> = {
      'aws': awsWarehouseGraph,
      'clinic': clinicGraph
    };
    const baseGraph = registry[mapId] || awsWarehouseGraph;
    let rwGraph = { ...(baseGraph as ScenarioGraph) };

    if (mapId === 'clinic') {
      const xs = rwGraph.nodes.map(n => n.x);
      const ys = rwGraph.nodes.map(n => n.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const scaleX = 1400 / (maxX - minX);
      const scaleY = 1000 / (maxY - minY);
      const s = Math.min(scaleX, scaleY);
      rwGraph = {
        ...rwGraph,
        width: 1600,
        height: 1200,
        nodes: rwGraph.nodes.map(n => ({
          ...n,
          x: (n.x - minX) * s + 100,
          y: (n.y - minY) * s + 100,
        }))
      };
    }

    if (!rwGraph.destinationIds || rwGraph.destinationIds.length === 0) {
      const potentialExits = rwGraph.nodes.filter(n => n.type === 'shelf');
      if (potentialExits.length > 0) {
        let currentSeed = seed;
        const shuffled = [...potentialExits];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(seededRandom(currentSeed++) * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const numExits = Math.floor(seededRandom(currentSeed) * 4) + 2; 
        rwGraph.destinationIds = shuffled.slice(0, numExits).map(n => n.id);
      }
    }
    return rwGraph;
  }

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const fallback = SIZE_CONFIG[graphSize];
  const fallbackNodes = 1 + (2 * fallback.aisles) + (fallback.aisles * fallback.shelvesPerAisle * 3);
  const targetNodes = resolveSizingValue(sizing?.nodes, fallbackNodes, 10, 220);
  const config = resolveRoboticsShape(targetNodes, fallback, Boolean(sizing));

  const colSpacing = 12000;
  const actualW = (config.aisles + 1) * colSpacing;

  // 1. Add Top Central Depot
  nodes.push({ id: 'depot', label: 'Robot Charging Station\n(Start)', type: 'depot', x: actualW / 2, y: 2000, level: 0, buildingId: 'warehouse' });

  // 2. Build North Entry Corridor Row
  for (let i = 1; i <= config.aisles; i++) {
    const topX = i * colSpacing;
    const topId = `top_hw_${i}`;
    nodes.push({ id: topId, label: `North Entry ${i}`, type: 'zone', x: topX, y: 5000, level: 1, buildingId: 'warehouse' });
    
    // Connect Depot to North Entry
    addTwoWayEdge(edges, 'depot', topId, 2, '2m');

    // Link North entry nodes horizontally
    if (i > 1) {
      addTwoWayEdge(edges, `top_hw_${i-1}`, topId, 1, '1m');
    }
  }

  // 3. Build Vertical Aisles with Storage Shelves
  const maxSections = Math.max(...config.sectionsByAisle.map((sections) => sections.length), 1);
  const shelfSpacing = 6500;
  const finishY = 5000 + (maxSections + 1.8) * shelfSpacing;
  const totalH = finishY + 6000;
  const destIds: string[] = [];

  for (let a = 1; a <= config.aisles; a++) {
    const startX = a * colSpacing;
    let prevId = `top_hw_${a}`;
    const sections = config.sectionsByAisle[a - 1] ?? [];

    for (let s = 1; s <= sections.length; s++) {
      const shelfId = `shelf_${a}_${s}`;
      const yPos = 5000 + (s * shelfSpacing);
      nodes.push({ id: shelfId, label: `Shelf ${a}-${s}`, type: 'aisle', x: startX, y: yPos, level: 2, buildingId: 'warehouse' });
      addTwoWayEdge(edges, prevId, shelfId, 2, '2m');
      prevId = shelfId;
    }

    // 4. Add Finish Line Destination Node at bottom of column
    const finishId = `dest_finish_${a}`;
    destIds.push(finishId);
    nodes.push({ id: finishId, label: `Finish Line ${a}`, type: 'shelf', x: startX, y: finishY, level: 3, buildingId: 'warehouse' });
    addTwoWayEdge(edges, prevId, finishId, 2, '2m');

    // Link bottom finish line nodes horizontally
    if (a > 1) {
      addTwoWayEdge(edges, `dest_finish_${a-1}`, finishId, 1, '1m');
    }
  }

  const predefinedExitIds = destIds.length >= 2 ? destIds.slice(0, 2) : destIds;

  // The UI sends undirected link requested limits. Since we use bidirectional edges, multiply by 2.
  const requestedLinks = sizing?.edges !== undefined ? Math.max(sizing.edges * 2, edges.length) : edges.length;

  return fitGraphEdgeCount(
    {
      nodes,
      edges,
      sourceId: 'depot',
      sourceIds: ['depot'],
      destinationIds: predefinedExitIds,
      width: actualW,
      height: totalH,
    },
    requestedLinks,
    seed,
    { edgeType: 'path', labelUnit: 'm', latencyBase: 1, latencySpread: 4, maxEdges: targetNodes * 10 }
  );
}

export function getRoboticsBlockCandidates(graph: ScenarioGraph): string[] {
  return graph.nodes.filter(n => n.type === 'aisle' || n.type === 'zone').map(n => n.id);
}