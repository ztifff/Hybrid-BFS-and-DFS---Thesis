import { ScenarioGraph, AlgorithmStep } from '../types';

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

export interface HybridResult {
  steps: AlgorithmStep[];
  nodesExplored: number;
  pathLength: number;
  totalLatency: number;
  foundDestination: string | null;
}

export async function runGraphHybrid(
  graph: ScenarioGraph,
  blockedNodes: Set<string> = new Set(),
  onStepProgress?: (step: AlgorithmStep) => void
): Promise<HybridResult> {

  const { nodes, edges, sourceId, destinationIds } = graph;

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const destSet = new Set(destinationIds);

  const adj = new Map<string, { to: string; latency: number }[]>();
  nodes.forEach(n => adj.set(n.id, []));

  edges.forEach(e => {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from)!.push({ to: e.to, latency: e.latency });
  });

  const visited = new Set<string>();
  const parentMap = new Map<string, string | null>();
  const steps: AlgorithmStep[] = [];
  const frontier: string[] = [];
  
  frontier.push(sourceId);
  visited.add(sourceId);
  parentMap.set(sourceId, null);

  let nodesExplored = 0;
  let foundDestination: string | null = null;
  let lastCurrent: string | null = null;
  let iteration = 0;
  let lastYieldTime = performance.now();

  function chooseStrategy(current: string): 'BFS' | 'DFS' {
    const node = nodeMap.get(current);
    const neighbors = adj.get(current) ?? [];
    const branchingFactor = neighbors.length;
    const isHub = node?.level === 1 && branchingFactor > 3;
    if (isHub) return 'DFS';
    if (branchingFactor >= 2) return 'BFS';
    return 'DFS';
  }

  while (frontier.length > 0 && !foundDestination) {
    const peek = frontier[frontier.length - 1];
    const strategy = chooseStrategy(peek);

    const current = strategy === 'BFS' ? frontier.shift()! : frontier.pop()!;
    if (!current) continue;

    // 🧠 Native Detour: Silently skip without wiping memory
    if (blockedNodes.has(current)) {
        const parent = parentMap.get(current);
        if (parent) frontier.unshift(parent);
        continue;
    }

    lastCurrent = current;
    nodesExplored++;
    iteration++;

    const now = performance.now();
    const step: AlgorithmStep = {
      stepIndex: iteration,
      explored: Array.from(visited),
      frontier: [...frontier],
      path: reconstructPath(parentMap, current),
      current,
      done: false,
      foundDestination: null,
      phaseLabel: `⚡ Adaptive ${strategy}`
    };

    steps.push(step);
    if (onStepProgress) onStepProgress(step);

    if (now - lastYieldTime > 100) {
  await yieldToMain();
  lastYieldTime = performance.now();
}

    if (destSet.has(current)) {
      foundDestination = current;
      break;
    }

    const neighbors = adj.get(current) ?? [];
    const orderedNeighbors = strategy === 'DFS' ? [...neighbors].reverse() : neighbors;

    for (const { to } of orderedNeighbors) {
      if (!visited.has(to) && !blockedNodes.has(to)) {
        visited.add(to);
        parentMap.set(to, current);
        frontier.push(to);
      }
    }
  }

  const finalPath = foundDestination ? reconstructPath(parentMap, foundDestination) : [];
  const totalLatency = calcPathLatency(finalPath, edges);

  steps.push({
    stepIndex: iteration,
    explored: Array.from(visited),
    frontier: [],
    path: finalPath,
    current: foundDestination ?? lastCurrent ?? sourceId,
    done: true,
    foundDestination,
    phaseLabel: foundDestination ? 'Path Secured' : 'Path Severed'
  });

  return { steps, nodesExplored, pathLength: foundDestination ? finalPath.length - 1 : -1, totalLatency, foundDestination };
}

function reconstructPath(parentMap: Map<string, string | null>, nodeId: string): string[] {
  const path: string[] = [];
  let cur: string | null = nodeId;
  const seen = new Set<string>();

  while (cur !== null) {
    if (seen.has(cur)) break;
    seen.add(cur);
    path.unshift(cur);
    cur = parentMap.get(cur) ?? null;
  }
  return path;
}

function calcPathLatency(path: string[], edges: ScenarioGraph['edges']): number {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = edges.find(e => e.from === path[i] && e.to === path[i + 1]);
    if (edge) total += edge.latency;
  }
  return total;
}