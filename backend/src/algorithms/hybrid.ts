import { ScenarioGraph, AlgorithmStep } from '../types';

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

export interface HybridResult {
  steps: AlgorithmStep[];
  nodesExplored: number;
  pathLength: number;
  totalLatency: number;
  foundDestination: string | null;
  maxFrontierSize: number;
}

// How many steps to wait at a congested node before force-severing and rerouting.
const MAX_WAIT_STEPS = 5000;
const MAX_TOTAL_STEPS = 5000;

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

function collectSubtree(
  blockedId: string,
  childrenMap: Map<string, string[]>,
  visited: Set<string>
): string[] {
  const result: string[] = [];
  const queue = [blockedId];
  const seen = new Set<string>([blockedId]);
  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);
    for (const child of childrenMap.get(node) ?? []) {
      if (!seen.has(child)) {
        seen.add(child);
        queue.push(child);
      }
    }
  }
  return result;
}

function calcPathLatency(path: string[], edges: ScenarioGraph['edges']): number {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const edge = edges.find(e => e.from === path[i] && e.to === path[i + 1]);
    if (edge) total += edge.latency;
  }
  return total;
}

export async function runGraphHybrid(
  graph: ScenarioGraph,
  blockedNodes: Set<string> = new Set(),
  onStepProgress?: (step: AlgorithmStep) => void,
  disablePathSevering: boolean = false
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
  const childrenMap = new Map<string, string[]>();
  const steps: AlgorithmStep[] = [];
  const frontier: { id: string; waited: number }[] = [];

  frontier.push({ id: sourceId, waited: 0 });
  visited.add(sourceId);
  parentMap.set(sourceId, null);

  let nodesExplored = 0;
  let foundDestination: string | null = null;
  let lastCurrent: string | null = null;
  let iteration = 0;
  let maxFrontierSize = 0;
  let lastYieldTime = performance.now();
  const severedBlockedNodes = new Set<string>();

  function chooseStrategy(current: string): 'BFS' | 'DFS' {
    const node = nodeMap.get(current);
    const neighbors = adj.get(current) ?? [];
    const branchingFactor = neighbors.length;
    const isHub = node?.level === 1 && branchingFactor > 3;
    if (isHub) return 'DFS';
    if (branchingFactor >= 2) return 'BFS';
    return 'DFS';
  }

  while (frontier.length > 0 && !foundDestination && iteration < MAX_TOTAL_STEPS) {
    if (frontier.length > maxFrontierSize) maxFrontierSize = frontier.length;

    // ── PATH SEVERING ─────────────────────────────────────────────────────────
    // Hybrid's adaptive advantage: when a path is severed, it:
    //   1. Un-visits the full subtree (same as BFS/DFS)
    //   2. Places the rollback node at the FRONT of the frontier (immediate BFS broadcast)
    //   3. This pivots from the deep-dive to a broad scan — the fastest way to find an
    //      alternative route from the rollback junction
    let didSever = false;
    if (!disablePathSevering) {
      for (const blockedId of blockedNodes) {
        if (blockedId === sourceId) continue;
      if (severedBlockedNodes.has(blockedId)) continue;
      if (!visited.has(blockedId)) continue;

      severedBlockedNodes.add(blockedId);

      const subtree = collectSubtree(blockedId, childrenMap, visited);
      const subtreeSet = new Set(subtree);

      for (const id of subtree) visited.delete(id);

      // Strip from frontier
      for (let i = frontier.length - 1; i >= 0; i--) {
        if (subtreeSet.has(frontier[i].id)) frontier.splice(i, 1);
      }

      // Place rollback at FRONT — Hybrid immediately broadcasts from the junction
      const rollbackTo = parentMap.get(blockedId) ?? sourceId;
      if (!blockedNodes.has(rollbackTo)) {
        visited.delete(rollbackTo);
        frontier.unshift({ id: rollbackTo, waited: 0 }); // front = next to process
      } else if (rollbackTo === sourceId) {
        visited.delete(sourceId);
        frontier.unshift({ id: sourceId, waited: 0 });
      }

      if (lastCurrent && subtreeSet.has(lastCurrent)) {
        lastCurrent = rollbackTo;
      }

      iteration++;
      didSever = true;

      const severStep: AlgorithmStep = {
        stepIndex: iteration,
        explored: Array.from(visited),
        frontier: frontier.map(f => f.id),
        path: reconstructPath(parentMap, rollbackTo),
        current: rollbackTo,
        done: false,
        foundDestination: null,
        phaseLabel: `🔙 Hybrid — Path severed at [${blockedId}]! Adaptive pivot to [${rollbackTo}], cleared ${subtree.length} node(s), broadcasting BFS scan`
      };
      steps.push(severStep);
      if (onStepProgress) onStepProgress(severStep);
    }
    }

    for (const id of severedBlockedNodes) {
      if (!blockedNodes.has(id)) severedBlockedNodes.delete(id);
    }

    if (didSever) continue;

    // ── Normal Hybrid dequeue ─────────────────────────────────────────────────
    const peek = frontier[frontier.length - 1];
    const strategy = chooseStrategy(peek?.id ?? sourceId);
    const entry = strategy === 'BFS' ? frontier.shift()! : frontier.pop()!;
    if (!entry) continue;
    const current = entry.id;

    // ── Congestion waiting ────────────────────────────────────────────────────
    // KEY FIX: When blocked, defer to the OPPOSITE end so other branches are
    // explored first. BFS→ push to back (frontier end). DFS→ push to front (frontier start).
    // This ensures the algorithm ACTIVELY finds alternative routes while waiting.
    if (blockedNodes.has(current)) {
      if (entry.waited < MAX_WAIT_STEPS) {
        // Defer to opposite end so other frontier nodes are processed first
        if (strategy === 'DFS') {
          // DFS pulled from back → defer to front so BFS items process first
          frontier.unshift({ id: current, waited: entry.waited + 1 });
        } else {
          // BFS pulled from front → defer to back so other BFS items process first
          frontier.push({ id: current, waited: entry.waited + 1 });
        }
        iteration++;
        const waitStep: AlgorithmStep = {
          stepIndex: iteration,
          explored: Array.from(visited),
          frontier: frontier.map(f => f.id),
          path: reconstructPath(parentMap, lastCurrent ?? sourceId),
          current,
          done: false,
          foundDestination: null,
          phaseLabel: `⚡ Hybrid — Route blocked, exploring alternatives (wait ${entry.waited + 1}/${MAX_WAIT_STEPS})`
        };
        steps.push(waitStep);
        if (onStepProgress) onStepProgress(waitStep);
      } else {
        // Wait exhausted — force-sever so Hybrid finds a completely new route
        if (!severedBlockedNodes.has(current) && visited.has(current)) {
          const subtree = collectSubtree(current, childrenMap, visited);
          const subtreeSet = new Set(subtree);
          for (const id of subtree) visited.delete(id);
          for (let i = frontier.length - 1; i >= 0; i--) {
            if (subtreeSet.has(frontier[i].id)) frontier.splice(i, 1);
          }
          const rollbackTo = parentMap.get(current) ?? sourceId;
          if (!blockedNodes.has(rollbackTo)) {
            visited.delete(rollbackTo);
            frontier.unshift({ id: rollbackTo, waited: 0 }); // front for immediate BFS scan
          }
          severedBlockedNodes.add(current);
          iteration++;
          const forceStep: AlgorithmStep = {
            stepIndex: iteration,
            explored: Array.from(visited),
            frontier: frontier.map(f => f.id),
            path: reconstructPath(parentMap, rollbackTo ?? sourceId),
            current: rollbackTo ?? sourceId,
            done: false,
            foundDestination: null,
            phaseLabel: `🔀 Hybrid — Wait expired at [${current}], adaptive reroute from [${rollbackTo}]`
          };
          steps.push(forceStep);
          if (onStepProgress) onStepProgress(forceStep);
        }
      }
      continue;
    }

    lastCurrent = current;
    nodesExplored++;
    iteration++;

    const now = performance.now();
    const step: AlgorithmStep = {
      stepIndex: iteration,
      explored: Array.from(visited),
      frontier: frontier.map(f => f.id),
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

    if (destSet.has(current)) { foundDestination = current; break; }

    const neighbors = adj.get(current) ?? [];
    const orderedNeighbors = strategy === 'DFS' ? [...neighbors].reverse() : neighbors;

    for (const { to } of orderedNeighbors) {
      if (!visited.has(to)) {
        visited.add(to);
        parentMap.set(to, current);
        if (!childrenMap.has(current)) childrenMap.set(current, []);
        childrenMap.get(current)!.push(to);
        frontier.push({ id: to, waited: 0 });
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
    phaseLabel: foundDestination ? '✅ Hybrid — Path Secured' : '🔄 Hybrid — All Routes Exhausted'
  });

  return { steps, nodesExplored, pathLength: foundDestination ? finalPath.length - 1 : -1, totalLatency, foundDestination, maxFrontierSize };
}