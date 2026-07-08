import { ScenarioGraph, AlgorithmStep } from '../types';

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

export interface DFSResult {
  steps: AlgorithmStep[];
  nodesExplored: number;
  pathLength: number;
  totalLatency: number;
  foundDestination: string | null;
  maxFrontierSize: number;
}

// How many steps to wait at a congested node before force-severing and rerouting.
// Keep low so the algorithm actively explores alternatives rather than spinning.
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
    const edge = edges.find((e) => e.from === path[i] && e.to === path[i + 1]);
    if (edge) total += edge.latency;
  }
  return total;
}

export async function runGraphDFS(
  graph: ScenarioGraph,
  blockedNodes: Set<string> = new Set(),
  onStepProgress?: (step: AlgorithmStep) => void,
  disablePathSevering: boolean = false
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
  const childrenMap = new Map<string, string[]>();
  const steps: AlgorithmStep[] = [];
  const stack: { id: string; waited: number }[] = [];

  stack.push({ id: sourceId, waited: 0 });
  parentMap.set(sourceId, null);

  let foundDestination: string | null = null;
  let lastCurrent: string | null = null;
  let nodesExplored = 0;
  let iteration = 0;
  let maxFrontierSize = 0;
  let lastYieldTime = performance.now();
  const severedBlockedNodes = new Set<string>();

  while (stack.length > 0 && !foundDestination && iteration < MAX_TOTAL_STEPS) {
    if (stack.length > maxFrontierSize) maxFrontierSize = stack.length;

    // ── PATH SEVERING: scan all VISITED blocked nodes ─────────────────────────
    // For DFS: when a node on the deep branch becomes blocked, we must climb back
    // up, un-visit the ENTIRE subtree discovered through it, and push the parent
    // back to the TOP of the stack so DFS re-explores sibling branches next.
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

      // Strip invalidated nodes from the stack
      for (let i = stack.length - 1; i >= 0; i--) {
        if (subtreeSet.has(stack[i].id)) stack.splice(i, 1);
      }

      // DFS: push rollback to TOP of stack so it re-explores siblings immediately
      const rollbackTo = parentMap.get(blockedId) ?? sourceId;
      if (!blockedNodes.has(rollbackTo)) {
        visited.delete(rollbackTo);
        stack.push({ id: rollbackTo, waited: 0 }); // push = top of DFS stack
      } else if (rollbackTo === sourceId) {
        visited.delete(sourceId);
        stack.push({ id: sourceId, waited: 0 });
      }

      if (lastCurrent && subtreeSet.has(lastCurrent)) {
        lastCurrent = rollbackTo;
      }

      iteration++;
      didSever = true;

      const severStep: AlgorithmStep = {
        stepIndex: iteration,
        explored: Array.from(visited),
        frontier: stack.map(s => s.id),
        path: reconstructPath(parentMap, rollbackTo),
        current: rollbackTo,
        done: false,
        foundDestination: null,
        phaseLabel: `🔙 DFS — Path severed at [${blockedId}]! Backtracking to [${rollbackTo}], cleared ${subtree.length} node(s)`
      };
      steps.push(severStep);
      if (onStepProgress) onStepProgress(severStep);
    }
    }

    for (const id of severedBlockedNodes) {
      if (!blockedNodes.has(id)) severedBlockedNodes.delete(id);
    }

    if (didSever) continue;

    // ── Normal DFS pop ────────────────────────────────────────────────────────
    const entry = stack.pop()!;
    const current = entry.id;

    // ── Congestion waiting: DFS defers blocked node to BOTTOM of stack ────────
    // KEY FIX: Push to BOTTOM (unshift) instead of top (push). This means DFS will
    // process all other stacked branches before retrying — actively exploring
    // alternative routes while waiting for the congestion to clear.
    if (blockedNodes.has(current)) {
      if (entry.waited < MAX_WAIT_STEPS) {
        // Push to BOTTOM of stack — DFS dives other branches first
        stack.unshift({ id: current, waited: entry.waited + 1 });
        iteration++;
        const waitStep: AlgorithmStep = {
          stepIndex: iteration,
          explored: Array.from(visited),
          frontier: stack.map(s => s.id),
          path: reconstructPath(parentMap, lastCurrent ?? sourceId),
          current,
          done: false,
          foundDestination: null,
          phaseLabel: `⏳ DFS — Route blocked, diving other branches (wait ${entry.waited + 1}/${MAX_WAIT_STEPS})`
        };
        steps.push(waitStep);
        if (onStepProgress) onStepProgress(waitStep);
      } else {
        // Wait exhausted — force-sever so DFS actively reroutes from a safe parent
        if (!severedBlockedNodes.has(current) && visited.has(current)) {
          const subtree = collectSubtree(current, childrenMap, visited);
          const subtreeSet = new Set(subtree);
          for (const id of subtree) visited.delete(id);
          for (let i = stack.length - 1; i >= 0; i--) {
            if (subtreeSet.has(stack[i].id)) stack.splice(i, 1);
          }
          const rollbackTo = parentMap.get(current) ?? sourceId;
          if (!blockedNodes.has(rollbackTo)) {
            visited.delete(rollbackTo);
            stack.push({ id: rollbackTo, waited: 0 });
          }
          severedBlockedNodes.add(current);
          iteration++;
          const forceStep: AlgorithmStep = {
            stepIndex: iteration,
            explored: Array.from(visited),
            frontier: stack.map(s => s.id),
            path: reconstructPath(parentMap, rollbackTo ?? sourceId),
            current: rollbackTo ?? sourceId,
            done: false,
            foundDestination: null,
            phaseLabel: `🔀 DFS — Wait expired at [${current}], forcing reroute from [${rollbackTo}]`
          };
          steps.push(forceStep);
          if (onStepProgress) onStepProgress(forceStep);
        }
      }
      continue;
    }

    if (visited.has(current)) continue;

    visited.add(current);
    lastCurrent = current;
    nodesExplored++;
    iteration++;

    const now = performance.now();
    const step: AlgorithmStep = {
      stepIndex: iteration,
      explored: Array.from(visited),
      frontier: stack.map(s => s.id),
      path: reconstructPath(parentMap, current),
      current,
      done: false,
      foundDestination: null,
      phaseLabel: '🎯 DFS — Deep Dive'
    };
    steps.push(step);
    if (onStepProgress) onStepProgress(step);

    if (now - lastYieldTime > 100) {
      await yieldToMain();
      lastYieldTime = performance.now();
    }

    if (destSet.has(current)) { foundDestination = current; break; }

    const neighbors = (adj.get(current) ?? []).slice().reverse();
    for (const { to } of neighbors) {
      if (!visited.has(to)) {
        if (!parentMap.has(to)) {
          parentMap.set(to, current);
          if (!childrenMap.has(current)) childrenMap.set(current, []);
          childrenMap.get(current)!.push(to);
        }
        stack.push({ id: to, waited: 0 });
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
    phaseLabel: foundDestination ? '✅ DFS — Path Secured' : '🔄 DFS — All Routes Exhausted'
  });

  return { steps, nodesExplored, pathLength: foundDestination ? finalPath.length - 1 : -1, totalLatency, foundDestination, maxFrontierSize };
}