import { ScenarioGraph, AlgorithmStep } from '../types';
import { PathfinderObserver, DynamicEventPayload, SimulationEnvironment } from '../utils/simulationEnvironment';

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

export interface BFSResult {
  steps: AlgorithmStep[];
  nodesExplored: number;
  pathLength: number;
  totalLatency: number;
  foundDestination: string | null;
  maxFrontierSize: number;
}

const MAX_WAIT_STEPS = 25;
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

// Full-subtree descendant finder using childrenMap
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
      if (!seen.has(child) && visited.has(child)) {
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
    const edge = edges.find((e) => (e.from === path[i] && e.to === path[i + 1]) || (e.to === path[i] && e.from === path[i + 1]));
    if (edge) total += edge.latency;
  }
  return total;
}

export class BFSPathfinder implements PathfinderObserver {
  private blockedNodes = new Set<string>();

  public update(event: DynamicEventPayload): void {
    if (event.blocked) {
      this.blockedNodes.add(event.nodeId);
    } else {
      this.blockedNodes.delete(event.nodeId);
    }
  }

  public seedBlockedNodes(initialBlocked: Set<string>): void {
    this.blockedNodes = new Set(initialBlocked);
  }

  public async execute(
    graph: ScenarioGraph,
    environment: SimulationEnvironment,
    disablePathSevering: boolean = false
  ): Promise<BFSResult> {
    const { nodes, edges, sourceId, destinationIds } = graph;

    const adj = new Map<string, { to: string; latency: number }[]>();
    nodes.forEach((n) => adj.set(n.id, []));
    edges.forEach((e) => {
      if (!adj.has(e.from)) adj.set(e.from, []);
      if (!adj.has(e.to)) adj.set(e.to, []);
      adj.get(e.from)!.push({ to: e.to, latency: e.latency });
      adj.get(e.to)!.push({ to: e.from, latency: e.latency });
    });

    const destSet = new Set(destinationIds);
    const visited = new Set<string>([sourceId]);
    const parentMap = new Map<string, string | null>([[sourceId, null]]);
    const childrenMap = new Map<string, string[]>();
    const steps: AlgorithmStep[] = [];

    const queue: { id: string; waited: number }[] = [];
    if (!this.blockedNodes.has(sourceId)) {
        queue.push({ id: sourceId, waited: 0 });
    }

    let nodesExplored = 0;
    let foundDestination: string | null = null;
    let lastCurrent: string | null = null;
    let iteration = 0;
    let maxFrontierSize = 0;
    let lastYieldTime = performance.now();

    const severedBlockedNodes = new Set<string>();

    while (queue.length > 0 && !foundDestination && iteration < MAX_TOTAL_STEPS) {
      if (queue.length > maxFrontierSize) maxFrontierSize = queue.length;

      let didSever = false;
      if (!disablePathSevering) {
        for (const blockedId of this.blockedNodes) {
          if (blockedId === sourceId) continue;
          if (severedBlockedNodes.has(blockedId)) continue; 
          if (!visited.has(blockedId)) continue;            

          severedBlockedNodes.add(blockedId);

          const subtree = collectSubtree(blockedId, childrenMap, visited);
          const subtreeSet = new Set(subtree);

          for (const id of subtree) visited.delete(id);

          for (let i = queue.length - 1; i >= 0; i--) {
            if (subtreeSet.has(queue[i].id)) queue.splice(i, 1);
          }

          const rollbackTo = parentMap.get(blockedId) ?? sourceId;
          if (!this.blockedNodes.has(rollbackTo) && rollbackTo !== sourceId) {
            visited.delete(rollbackTo); 
            queue.unshift({ id: rollbackTo, waited: 0 });
          } else if (rollbackTo === sourceId) {
            visited.delete(sourceId);
            queue.unshift({ id: sourceId, waited: 0 });
          }

          if (lastCurrent && subtreeSet.has(lastCurrent)) {
            lastCurrent = rollbackTo;
          }

          iteration++;
          didSever = true;

          const severStep: AlgorithmStep = {
            stepIndex: iteration,
            explored: Array.from(visited),
            frontier: queue.map(q => q.id),
            path: reconstructPath(parentMap, rollbackTo),
            current: rollbackTo,
            done: false,
            foundDestination: null,
            phaseLabel: `🚧 BFS - Path severed at [${blockedId}]! Backtracking to [${rollbackTo}], cleared ${subtree.length} node(s)`
          };
          steps.push(severStep);
          environment.tick(severStep);
        }
      }

      for (const id of severedBlockedNodes) {
        if (!this.blockedNodes.has(id)) severedBlockedNodes.delete(id);
      }

      if (didSever) continue;

      const entry = queue.shift()!;
      const current = entry.id;

      if (this.blockedNodes.has(current)) {
        if (entry.waited < MAX_WAIT_STEPS) {
          queue.push({ id: current, waited: entry.waited + 1 });
          iteration++;
          const waitStep: AlgorithmStep = {
            stepIndex: iteration,
            explored: Array.from(visited),
            frontier: queue.map(q => q.id),
            path: reconstructPath(parentMap, lastCurrent ?? sourceId),
            current,
            done: false,
            foundDestination: null,
            phaseLabel: `⏳ BFS - Congestion, holding position (${entry.waited + 1}/${MAX_WAIT_STEPS})`
          };
          steps.push(waitStep);
          environment.tick(waitStep);
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
        frontier: queue.map(q => q.id),
        path: reconstructPath(parentMap, current),
        current,
        done: false,
        foundDestination: null,
        phaseLabel: '📡 BFS - Level-by-Level Broadcast'
      };
      steps.push(step);
      environment.tick(step);

      if (now - lastYieldTime > 100) {
        await yieldToMain();
        lastYieldTime = performance.now();
      }

      if (destSet.has(current)) {
        foundDestination = current;
        break;
      }

      const neighbors = adj.get(current) ?? [];
      for (const { to } of neighbors) {
        if (!visited.has(to)) {
          visited.add(to);
          parentMap.set(to, current);
          if (!childrenMap.has(current)) childrenMap.set(current, []);
          childrenMap.get(current)!.push(to);
          queue.push({ id: to, waited: 0 });
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
      phaseLabel: foundDestination ? '🏁 BFS - Path Secured' : '❌ BFS - All Routes Exhausted'
    });

    return { steps, nodesExplored, pathLength: foundDestination ? finalPath.length - 1 : -1, totalLatency, foundDestination, maxFrontierSize };
  }
}