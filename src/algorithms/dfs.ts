import { ScenarioGraph, AlgorithmStep } from '../types';

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

export interface DFSResult {
  steps: AlgorithmStep[];
  nodesExplored: number;
  pathLength: number;
  totalLatency: number;
  foundDestination: string | null;
}

export async function runGraphDFS(
  graph: ScenarioGraph,
  blockedNodes: Set<string> = new Set(),
  onStepProgress?: (step: AlgorithmStep) => void
): Promise<DFSResult> {
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

  const stack: string[] = [sourceId];
  parentMap.set(sourceId, null);

  let foundDestination: string | null = null;
  let nodesExplored = 0;
  let iteration = 0;

  let lastYieldTime = performance.now();
  const isMassive = nodes.length > 200;

  const syncUI = async (current: string) => {
    iteration++;
    const now = performance.now();

    const shouldRender = onStepProgress && (
      iteration < 100 || (now - lastYieldTime > 10)
    );

    const shouldStore =
      iteration < 50 ||
      !isMassive ||
      iteration % 25 === 0;

    if (shouldRender || shouldStore) {
      const step: AlgorithmStep = {
        stepIndex: iteration,
        explored: Array.from(visited),
        frontier: [...stack],
        path: reconstructPath(parentMap, current),
        current,
        done: false,
        foundDestination: null,
        phaseLabel: '🎯 DFS — Deep Dive (Tunnel Vision)'
      };

      if (shouldStore) steps.push(step);

      if (shouldRender) {
        onStepProgress?.(step);
        await new Promise(r => setTimeout(r, 15));
        await yieldToMain();
        lastYieldTime = performance.now();
      }
    }
  };

  while (stack.length > 0 && !foundDestination) {
    const current = stack.pop()!;

    if (visited.has(current)) continue;
    visited.add(current);
    nodesExplored++;

    await syncUI(current);

    // EARLY EXIT: Break the loop the moment we find the destination
    if (destSet.has(current)) {
      foundDestination = current;
      await syncUI(current);
      break; 
    }

    const neighbors = (adj.get(current) ?? []).slice().reverse();
    for (const { to } of neighbors) {
      if (!visited.has(to) && !blockedNodes.has(to)) {
        if (!parentMap.has(to)) parentMap.set(to, current);
        stack.push(to);
      }
    }
  }

  const finalPath = foundDestination ? reconstructPath(parentMap, foundDestination) : [];
  const totalLatency = calcPathLatency(finalPath, edges);

  if (steps.length === 0) {
    steps.push({
      stepIndex: iteration,
      explored: Array.from(visited),
      frontier: [],
      path: finalPath,
      current: foundDestination ?? sourceId,
      done: true,
      foundDestination,
      phaseLabel: 'Final State'
    });
  } else {
    const last = steps[steps.length - 1];
    steps[steps.length - 1] = {
      ...last,
      done: true,
      foundDestination,
      path: finalPath
    };
  }

  return { 
    steps, 
    nodesExplored, 
    pathLength: foundDestination ? finalPath.length - 1 : -1, 
    totalLatency, 
    foundDestination 
  };
}

function reconstructPath(parentMap: Map<string, string | null>, nodeId: string): string[] {
  const path: string[] = [];
  let cur: string | null = nodeId;
  const seen = new Set<string>();
  while (cur !== null) { 
    if (seen.has(cur)) break; // Cycle protection
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