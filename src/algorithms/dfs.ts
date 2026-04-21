import { ScenarioGraph, AlgorithmStep } from '../types';

interface DFSResult {
  steps: AlgorithmStep[];
  nodesExplored: number;
  pathLength: number;
  totalLatency: number;
  foundDestination: string | null;
}

export function runGraphDFS(
  graph: ScenarioGraph,
  blockedNodes: Set<string> = new Set()
): DFSResult {
  const { nodes, edges, sourceId, destinationIds } = graph;

  // Build adjacency map
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

  // DFS stack
  const stack: string[] = [sourceId];
  parentMap.set(sourceId, null);

  let foundDestination: string | null = null;
  let nodesExplored = 0;
  
  // --- Step Sampling Setup ---
  let iteration = 0;
  const isMassive = nodes.length > 5000;

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (visited.has(current)) continue;
    visited.add(current);
    nodesExplored++;
    iteration++;

    if (destSet.has(current) && foundDestination === null) {
      foundDestination = current;
    }

    // Only save state every 150 steps if massive, or every step for small graphs
    if (!isMassive || iteration % 150 === 0) {
      const exploredSoFar = Array.from(visited);
      const frontier = [...stack];
      const path = reconstructPath(parentMap, current);

      steps.push({
        explored: exploredSoFar,
        frontier,
        path,
        current,
        done: false,
        foundDestination: null,
        phaseLabel: 'DFS — Deep Dive (Tunnel Vision)',
      });
    }

    // Push neighbors in reverse so first neighbor is processed first
    const neighbors = (adj.get(current) ?? []).slice().reverse();
    for (const { to } of neighbors) {
      if (!visited.has(to) && !blockedNodes.has(to)) {
        if (!parentMap.has(to)) {
          parentMap.set(to, current);
        }
        stack.push(to);
      }
    }
  }

  const bestDest = foundDestination;
  const finalPath = bestDest ? reconstructPath(parentMap, bestDest) : [];
  const totalLatency = calcPathLatency(finalPath, edges);

  if (steps.length > 0) {
    steps[steps.length - 1] = {
      ...steps[steps.length - 1],
      done: true,
      foundDestination: bestDest,
      path: finalPath,
    };
  }

  return {
    steps,
    nodesExplored,
    pathLength: Math.max(0, finalPath.length - 1),
    totalLatency,
    foundDestination: bestDest,
  };
}

function reconstructPath(
  parentMap: Map<string, string | null>,
  nodeId: string
): string[] {
  const path: string[] = [];
  let cur: string | null = nodeId;
  const seen = new Set<string>();
  while (cur !== null && !seen.has(cur)) {
    seen.add(cur);
    path.unshift(cur);
    cur = parentMap.get(cur) ?? null;
  }
  return path;
}

function calcPathLatency(
  path: string[],
  edges: ScenarioGraph['edges']
): number {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = edges.find(
      (e) => e.from === path[i] && e.to === path[i + 1]
    );
    if (edge) total += edge.latency;
  }
  return total;
}