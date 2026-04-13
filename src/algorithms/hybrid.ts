/**
 * Hybrid BFS-DFS Graph Algorithm
 *
 * Strategy:
 *   Phase 1 (BFS Macro): BFS from source to all Level-1 hub nodes simultaneously.
 *   Phase 2 (DFS Micro): From each hub, perform DFS independently into its sub-graph.
 *
 * This mirrors the real-world pattern: broadcast to buildings (BFS), then
 * each building saturates its own floors/APs in parallel (DFS).
 */

import { ScenarioGraph, AlgorithmStep } from '../types';

interface HybridResult {
  steps: AlgorithmStep[];
  nodesExplored: number;
  pathLength: number;
  totalLatency: number;
  foundDestination: string | null;
}

export function runGraphHybrid(
  graph: ScenarioGraph,
  blockedNodes: Set<string> = new Set()
): HybridResult {
  const { nodes, edges, sourceId, destinationIds } = graph;

  // Build adjacency map
  const adj = new Map<string, { to: string; latency: number }[]>();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from)!.push({ to: e.to, latency: e.latency });
  });

  const destSet = new Set(destinationIds);
  const visited = new Set<string>([sourceId]);
  const parentMap = new Map<string, string | null>([[sourceId, null]]);
  const steps: AlgorithmStep[] = [];
  let nodesExplored = 0;
  let foundDestination: string | null = null;

  // ── Phase 1: BFS to reach all Level-1 hubs ─────────────────────────────
  const level1Nodes = nodes.filter((n) => n.level === 1 && !blockedNodes.has(n.id));
  const bfsQueue: string[] = [sourceId];

  while (bfsQueue.length > 0) {
    const current = bfsQueue.shift()!;
    nodesExplored++;

    const path = reconstructPath(parentMap, current);
    steps.push({
      explored: Array.from(visited),
      frontier: [...bfsQueue],
      path,
      current,
      done: false,
      foundDestination: null,
      phaseLabel: '📡 Phase 1: BFS Macro-Broadcast (Hub Discovery)',
    });

    if (destSet.has(current) && !foundDestination) foundDestination = current;

    // Only BFS to level 1 — stop expanding beyond hubs
    const currentNode = nodes.find((n) => n.id === current);
    if (currentNode && currentNode.level >= 1) continue;

    const neighbors = adj.get(current) ?? [];
    for (const { to } of neighbors) {
      if (!visited.has(to) && !blockedNodes.has(to)) {
        visited.add(to);
        parentMap.set(to, current);
        bfsQueue.push(to);
      }
    }
  }

  // ── Phase 2: DFS from each hub into its sub-graph ──────────────────────
  // Interleave DFS steps across hubs to simulate parallel execution
  const hubIds = level1Nodes.map((n) => n.id);

  // Build per-hub DFS stacks
  const hubStacks: Map<string, string[]> = new Map();
  const hubVisited: Map<string, Set<string>> = new Map();

  hubIds.forEach((hId) => {
    if (!blockedNodes.has(hId)) {
      hubStacks.set(hId, [hId]);
      hubVisited.set(hId, new Set([hId]));
    }
  });

  // Interleaved DFS: one step per hub per round
  let anyActive = true;
  while (anyActive) {
    anyActive = false;
    for (const hId of hubIds) {
      const stack = hubStacks.get(hId);
      const hVisited = hubVisited.get(hId);
      if (!stack || !hVisited || stack.length === 0) continue;

      anyActive = true;
      const current = stack.pop()!;
      if (hVisited.has(current) && current !== hId) continue;
      if (!hVisited.has(current)) hVisited.add(current);
      if (!visited.has(current)) {
        visited.add(current);
        if (!parentMap.has(current)) parentMap.set(current, hId);
      }
      nodesExplored++;

      if (destSet.has(current) && !foundDestination) {
        foundDestination = current;
      }

      const path = reconstructPath(parentMap, current);

      steps.push({
        explored: Array.from(visited),
        frontier: Array.from(hubStacks.values()).flat(),
        path,
        current,
        done: false,
        foundDestination: null,
        phaseLabel: `🔀 Phase 2: DFS Micro-Saturation (Hub ${hId})`,
      });

      const neighbors = (adj.get(current) ?? []).slice().reverse();
      for (const { to } of neighbors) {
        if (!visited.has(to) && !blockedNodes.has(to)) {
          // Only expand within this hub's sub-graph (level >= hub's level)
          const toNode = nodes.find((n) => n.id === to);
          const hubNode = nodes.find((n) => n.id === hId);
          if (toNode && hubNode && toNode.level > hubNode.level) {
            if (!parentMap.has(to)) parentMap.set(to, current);
            stack.push(to);
          } else if (toNode && toNode.level === 0) {
            // Don't go back to source
          } else if (toNode && hubNode && toNode.buildingId === hubNode.buildingId) {
            if (!parentMap.has(to)) parentMap.set(to, current);
            stack.push(to);
          }
        }
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
