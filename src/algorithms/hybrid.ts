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

  // ── Precompute ─────────────────────────────────────
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const destSet = new Set(destinationIds);

  const adj = new Map<string, { to: string; latency: number }[]>();
  nodes.forEach(n => adj.set(n.id, []));

  edges.forEach(e => {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from)!.push({ to: e.to, latency: e.latency });
    // ✅ FIX 2: Removed the undirected hack. Reverting this forces the algorithm 
    // to obey one-way streets, which fixes the line "falling short" visually.
  });

  // ── State ──────────────────────────────────────────
  const visited = new Set<string>();
  const parentMap = new Map<string, string | null>();

  const frontier: string[] = [];
  frontier.push(sourceId);

  visited.add(sourceId);
  parentMap.set(sourceId, null);

  let nodesExplored = 0;
  let foundDestination: string | null = null;

  const steps: AlgorithmStep[] = [];
  let iteration = 0;
  let lastYieldTime = performance.now();
  const isMassive = nodes.length > 200;

  // ── Adaptive Decision Function ─────────────────────
  function chooseStrategy(current: string): 'BFS' | 'DFS' {
    const node = nodeMap.get(current);
    const neighbors = adj.get(current) ?? [];

    const branchingFactor = neighbors.length;
    const isHub = node?.level === 1;

    if (isHub) return 'DFS';
    if (branchingFactor > 3) return 'BFS';
    return 'DFS';
  }

  // ── UI Sync (FIXED FOR ANIMATION) ──────────────────
  const syncUI = async (current: string, strategy: string) => {
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
        frontier: [...frontier],
        path: reconstructPath(parentMap, current),
        current,
        done: false,
        foundDestination: null,
        phaseLabel: `⚡ Adaptive ${strategy}`
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

  // ── Main Loop ──────────────────────────────────────
  while (frontier.length > 0 && !foundDestination) {

    // ✅ FIX 3: Evaluate the node we are ACTUALLY about to pull.
    // If we are functioning like a stack, check the last element.
    const peek = frontier[frontier.length - 1]; 
    const strategy = chooseStrategy(peek);

    const current =
      strategy === 'BFS'
        ? frontier.shift()!
        : frontier.pop()!;

    if (!current) continue;

    nodesExplored++;

    await syncUI(current, strategy);

    if (destSet.has(current)) {
      foundDestination = current;
      await syncUI(current, strategy);
      break;
    }

    const neighbors = adj.get(current) ?? [];
    const orderedNeighbors = strategy === 'DFS' ? [...neighbors].reverse() : neighbors;

    for (const { to } of orderedNeighbors) {
      // ✅ Dynamic Blocked Nodes will now work perfectly!
      if (!visited.has(to) && !blockedNodes.has(to)) {
        visited.add(to);
        parentMap.set(to, current);
        frontier.push(to);
      }
    }
  }

  // ── Finalization ───────────────────────────────────
  const finalPath = foundDestination
    ? reconstructPath(parentMap, foundDestination)
    : [];

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

// ── Helpers ─────────────────────────────────────────
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