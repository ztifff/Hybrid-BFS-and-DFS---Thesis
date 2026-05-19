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

  const blockedHistory = new Set<string>(blockedNodes);
  const stack: string[] = [];

  function resetSearchState() {
    stack.splice(0, stack.length);
    visited.clear();
    parentMap.clear();
    stack.push(sourceId);
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

  function pruneStack(): boolean {
    const valid: string[] = [];
    for (const nodeId of stack) {
      if (blockedNodes.has(nodeId) || !isPathValid(parentMap, nodeId, blockedNodes)) {
        visited.delete(nodeId);
      } else {
        valid.push(nodeId);
      }
    }
    if (valid.length !== stack.length) {
      stack.splice(0, stack.length, ...valid);
    }
    return stack.length > 0;
  }

  let foundDestination: string | null = null;
  let lastCurrent: string | null = null;
  let nodesExplored = 0;
  let iteration = 0;
  let lastYieldTime = performance.now();

  while (stack.length > 0 && !foundDestination) {
    if (blockedSetChanged()) {
      resetSearchState();
      syncBlockedHistory();
    }

    if (!pruneStack()) break;
    const current = stack.pop()!;
    lastCurrent = current;

    iteration++;
    const now = performance.now();
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

    steps.push(step);
    if (onStepProgress) onStepProgress(step); 

    if (now - lastYieldTime > 15) {
      await yieldToMain();
      lastYieldTime = performance.now();
    }

    if (visited.has(current)) continue;
    
    // 🚨 SMART EVASION: Abandon branch if trail is compromised
    if (blockedNodes.has(current) || !isPathValid(parentMap, current, blockedNodes)) continue;
    
    visited.add(current);
    nodesExplored++;

    if (destSet.has(current)) {
      foundDestination = current;
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

// 🛡️ Ensure the supply line back to the source is clear
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