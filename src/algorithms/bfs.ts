import { ScenarioGraph, AlgorithmStep } from '../types';

interface BFSResult {
  steps: AlgorithmStep[];
  nodesExplored: number;
  pathLength: number;
  totalLatency: number;
  foundDestination: string | null;
}

export function runGraphBFS(
  graph: ScenarioGraph,
  blockedNodes: Set<string> = new Set()
): BFSResult {
  const { nodes, edges, sourceId, destinationIds } = graph;

  // Build adjacency map
  const adj = new Map<string, { to: string; latency: number }[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from)!.push({ to: e.to, latency: e.latency });
  });

  const visited = new Set<string>();
  const parentMap = new Map<string, string | null>();
  const steps: AlgorithmStep[] = [];

  // BFS queue
  const queue: string[] = [sourceId];
  visited.add(sourceId);
  parentMap.set(sourceId, null);

  let nodesExplored = 0;

  while (queue.length > 0) {
    const current = queue.shift()!;
    nodesExplored++;

    const exploredSoFar = Array.from(visited);
    const frontier = [...queue];

    // Build path to current node
    const path = reconstructPath(parentMap, current);

    steps.push({
      explored: exploredSoFar,
      frontier,
      path,
      current,
      done: false,
      foundDestination: null,
      phaseLabel: 'BFS — Level-by-Level Broadcast',
    });

    const neighbors = adj.get(current) ?? [];
    for (const { to } of neighbors) {
      if (!visited.has(to) && !blockedNodes.has(to)) {
        visited.add(to);
        parentMap.set(to, current);
        queue.push(to);
      }
    }
  }

  // Find best destination (first found = shortest hops since BFS)
  const destSet2 = new Set(destinationIds);
  const reachedDests = destinationIds.filter((d) => visited.has(d) && destSet2.has(d));
  const bestDest = reachedDests[0] ?? null;
  const finalPath = bestDest ? reconstructPath(parentMap, bestDest) : [];

  // Calculate total latency on final path
  const totalLatency = calcPathLatency(finalPath, edges);

  // Mark final step as done
  if (steps.length > 0) {
    const last = steps[steps.length - 1];
    steps[steps.length - 1] = {
      ...last,
      done: true,
      foundDestination: bestDest,
      path: finalPath,
    };
  }

  return {
    steps,
    nodesExplored,
    pathLength: finalPath.length - 1,
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
  while (cur !== null) {
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
