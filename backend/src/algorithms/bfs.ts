import { ScenarioGraph, AlgorithmStep } from '../types';

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

export interface BFSResult {
  steps: AlgorithmStep[];
  nodesExplored: number;
  pathLength: number;
  totalLatency: number;
  foundDestination: string | null;
}

export async function runGraphBFS(
  graph: ScenarioGraph,
  blockedNodes: Set<string> = new Set(),
  onStepProgress?: (step: AlgorithmStep) => void
): Promise<BFSResult> {
  const { nodes, edges, sourceId, destinationIds } = graph;

  const adj = new Map<string, { to: string; latency: number }[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from)!.push({ to: e.to, latency: e.latency });
  });

  const destSet = new Set(destinationIds);
  const visited = new Set<string>();
  const parentMap = new Map<string, string | null>();
  const steps: AlgorithmStep[] = [];

  const blockedHistory = new Set<string>(blockedNodes);
  const queue: string[] = [];

  function resetSearchState() {
    queue.splice(0, queue.length);
    visited.clear();
    parentMap.clear();
    queue.push(sourceId);
    visited.add(sourceId);
    parentMap.set(sourceId, null);
  }

  function blockedSetChanged(): boolean {
    if (blockedHistory.size !== blockedNodes.size) return true;
    for (const nodeId of blockedNodes) {
      if (!blockedHistory.has(nodeId)) return true;
    }
    return false;
  }

  function syncBlockedHistory() {
    blockedHistory.clear();
    for (const nodeId of blockedNodes) blockedHistory.add(nodeId);
  }

  resetSearchState();

  let nodesExplored = 0;
  let foundDestination: string | null = null;
  let lastCurrent: string | null = null;
  let iteration = 0;
  let lastYieldTime = performance.now();

  while (queue.length > 0 && !foundDestination) {
    if (blockedSetChanged()) {
      resetSearchState();
      syncBlockedHistory();
    }

    const current = queue.shift()!;
    lastCurrent = current;

    iteration++;
    const now = performance.now();
    const step: AlgorithmStep = {
      stepIndex: iteration,
      explored: Array.from(visited),
      frontier: [...queue],
      path: reconstructPath(parentMap, current),
      current,
      done: false,
      foundDestination: null,
      phaseLabel: '📡 BFS — Level-by-Level Broadcast'
    };

    steps.push(step);
    if (onStepProgress) onStepProgress(step); 

    if (now - lastYieldTime > 15) {
      await yieldToMain();
      lastYieldTime = performance.now();
    }

    // Lazy evaluation: Skip if it became blocked
    if (blockedNodes.has(current)) {
      visited.delete(current);
      continue;
    }

    nodesExplored++;

    if (destSet.has(current)) {
      foundDestination = current;
      break;
    }

    const neighbors = adj.get(current) ?? [];
    for (const { to } of neighbors) {
      if (!visited.has(to) && !blockedNodes.has(to)) {
        visited.add(to);
        parentMap.set(to, current);
        queue.push(to);
      }
    }
  }

  let finalPath = foundDestination ? reconstructPath(parentMap, foundDestination) : [];
  if (finalPath.some(nodeId => blockedNodes.has(nodeId))) {
    foundDestination = null;
    finalPath = [];
  }

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

// Kept for utility, but removed from the inner loop to save CPU
function isPathValid(parentMap: Map<string, string | null>, nodeId: string, blockedNodes: Set<string>): boolean {
  let cur: string | null = nodeId;
  const seen = new Set<string>();
  while (cur !== null) { 
    if (seen.has(cur)) break; 
    if (blockedNodes.has(cur)) return false;
    seen.add(cur);
    cur = parentMap.get(cur) ?? null; 
  }
  return true;
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
    const edge = edges.find((e) => e.from === path[i] && e.to === path[i + 1]);
    if (edge) total += edge.latency;
  }
  return total;
}