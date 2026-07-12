import { ScenarioGraph, GraphNode, GraphEdge, GraphSize, GraphSizing } from '../types/index';
import { awsWarehouseGraph } from '../data/robotics.aws';
import { clinicGraph } from '../data/robotics.clinic';
import { clampInt, fitGraphEdgeCount, resolveSizingValue } from './graphSizing';

const W = 1600; 
const H = 1200;

function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// 🧠 THE FIX: Dialed back the grid multipliers. 
// Because every spot creates 3 physical nodes (Aisle, Left Shelf, Right Shelf),
// this config ensures "Large" generates a beautifully spaced ~100 node graph instead of 240+!
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

  let aisles = clampInt(Math.sqrt(targetNodes / 3), 2, 18);
  while (1 + (2 * aisles) >= targetNodes && aisles > 2) aisles--;

  const sectionsByAisle: number[][] = Array.from({ length: aisles }, () => []);
  let remaining = targetNodes - 1 - (2 * aisles);
  let aisleIndex = 0;

  while (remaining > 0) {
    remaining--;
    let shelfCount = 0;

    while (shelfCount < 2 && remaining > 0) {
      shelfCount++;
      remaining--;
    }

    sectionsByAisle[aisleIndex % aisles].push(shelfCount);
    aisleIndex++;
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

    
    // Grab all real-world shelves
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
    return rwGraph;
  }

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const fallback = SIZE_CONFIG[graphSize];
  const fallbackNodes = 1 + (2 * fallback.aisles) + (fallback.aisles * fallback.shelvesPerAisle * 3);
  const targetNodes = resolveSizingValue(sizing?.nodes, fallbackNodes, 10, 220);
  const config = resolveRoboticsShape(targetNodes, fallback, Boolean(sizing));

  // 1. Add Depot
  nodes.push({ id: 'depot', label: 'Main Depot', type: 'depot', x: W / 2, y: 100, level: 0, buildingId: 'warehouse' });

  // 2. Build Top & Bottom Highways (Zones)
  const aisleSpacing = W / (config.aisles + 1);
  for (let i = 1; i <= config.aisles; i++) {
    const topX = i * aisleSpacing;
    nodes.push({ id: `top_hw_${i}`, label: `North Hwy ${i}`, type: 'zone', x: topX, y: 250, level: 1, buildingId: 'warehouse' });
    nodes.push({ id: `bot_hw_${i}`, label: `South Hwy ${i}`, type: 'zone', x: topX, y: H - 250, level: 1, buildingId: 'warehouse' });
    
    // Connect Depot to Top Highway
    edges.push({ id: `depot-top_hw_${i}`, from: 'depot', to: `top_hw_${i}`, latency: 2, label: '2m', type: 'path' });

    // Link Highway nodes horizontally to form a continuous road!
    if (i > 1) {
      edges.push({ id: `top_hw_${i-1}-top_hw_${i}`, from: `top_hw_${i-1}`, to: `top_hw_${i}`, latency: 1, label: '1m', type: 'path' });
      edges.push({ id: `bot_hw_${i-1}-bot_hw_${i}`, from: `bot_hw_${i-1}`, to: `bot_hw_${i}`, latency: 1, label: '1m', type: 'path' });
    }
  }

  // 3. Build Vertical Aisles connecting Top and Bottom
  const maxSections = Math.max(...config.sectionsByAisle.map((sections) => sections.length), 1);
  const shelfSpacing = (H - 600) / Math.max(maxSections + 1, 2);
  for (let a = 1; a <= config.aisles; a++) {
    const startX = a * aisleSpacing;
    let prevId = `top_hw_${a}`;
    const sections = config.sectionsByAisle[a - 1] ?? [];

    for (let s = 1; s <= sections.length; s++) {
      const aisleId = `aisle_${a}_${s}`;
      const yPos = 250 + (s * shelfSpacing);
      nodes.push({ id: aisleId, label: `Aisle ${a}-${s}`, type: 'aisle', x: startX, y: yPos, level: 2, buildingId: 'warehouse' });
      edges.push({ id: `${prevId}-${aisleId}`, from: prevId, to: aisleId, latency: 2, label: '2m', type: 'path' });
      
      // Add a shelf to the left and right of the aisle
      const shelfCount = sections[s - 1] ?? 0;
      if (shelfCount >= 1) {
        const lShelf = `shelf_L_${a}_${s}`;
        nodes.push({ id: lShelf, label: `Bay L${a}${s}`, type: 'shelf', x: startX - 40, y: yPos, level: 3, buildingId: 'warehouse' });
        edges.push({ id: `${aisleId}-${lShelf}`, from: aisleId, to: lShelf, latency: 4, label: '4m', type: 'path' });
      }

      if (shelfCount >= 2) {
        const rShelf = `shelf_R_${a}_${s}`;
        nodes.push({ id: rShelf, label: `Bay R${a}${s}`, type: 'shelf', x: startX + 40, y: yPos, level: 3, buildingId: 'warehouse' });
        edges.push({ id: `${aisleId}-${rShelf}`, from: aisleId, to: rShelf, latency: 4, label: '4m', type: 'path' });
      }
      
      prevId = aisleId;
    }
    // Connect the bottom of the aisle to the South Highway
    edges.push({ id: `${prevId}-bot_hw_${a}`, from: prevId, to: `bot_hw_${a}`, latency: 2, label: '2m', type: 'path' });
  }

  // 4. Randomize Exits (Shelves)
  const potentialExits = nodes.filter(n => n.type === 'shelf');
  let currentSeed = seed;
  const shuffled = [...potentialExits];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(currentSeed++) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const numExits = Math.floor(seededRandom(currentSeed) * 4) + 2; 
  const destinationIds = shuffled.slice(0, numExits).map(n => n.id);

  return fitGraphEdgeCount(
    { nodes, edges, sourceId: 'depot', destinationIds, width: W, height: H },
    sizing?.edges,
    seed,
    { edgeType: 'path', labelUnit: 'm', latencyBase: 1, latencySpread: 4, maxEdges: targetNodes * 10 }
  );
}

export function getRoboticsBlockCandidates(graph: ScenarioGraph): string[] {
  return graph.nodes.filter(n => n.type === 'aisle' || n.type === 'zone').map(n => n.id);
}
