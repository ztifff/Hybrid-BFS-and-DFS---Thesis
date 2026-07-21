import { ScenarioGraph, AlgorithmStep } from '../types';
import { PathfinderObserver, DynamicEventPayload, SimulationEnvironment } from '../utils/simulationEnvironment';

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
const MAX_WAIT_STEPS = 50;
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
    const edge = edges.find((e) => e.from === path[i] && e.to === path[i + 1]);
    if (edge) total += edge.latency;
  }
  return total;
}

export class DFSPathfinder implements PathfinderObserver {
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
    disablePathSevering: boolean = false,
    deliveryMode: 'anycast' | 'multicast' = 'anycast'
  ): Promise<DFSResult> {
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
    const visited = new Set<string>();
    const parentMap = new Map<string, string | null>();
    const childrenMap = new Map<string, string[]>();
    const steps: AlgorithmStep[] = [];
    const stack: { id: string; waited: number }[] = [];

    stack.push({ id: sourceId, waited: 0 });
    parentMap.set(sourceId, null);

    let foundDestination: string | null = null;
    const foundDestinations: string[] = [];
    let lastCurrent: string | null = null;
    let nodesExplored = 0;
    let iteration = 0;
    let maxFrontierSize = 0;
    let lastYieldTime = performance.now();
    const severedBlockedNodes = new Set<string>();

    while (stack.length > 0 && iteration < MAX_TOTAL_STEPS) {
      if (deliveryMode === 'anycast' && foundDestinations.length > 0) break;
      if (deliveryMode === 'multicast' && destSet.size > 0 && foundDestinations.length === destSet.size) break;
      if (stack.length > maxFrontierSize) maxFrontierSize = stack.length;

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

          for (let i = stack.length - 1; i >= 0; i--) {
            if (subtreeSet.has(stack[i].id)) stack.splice(i, 1);
          }

          const rollbackTo = parentMap.get(blockedId) ?? sourceId;
          if (!this.blockedNodes.has(rollbackTo)) {
            visited.delete(rollbackTo);
            stack.push({ id: rollbackTo, waited: 0 }); 
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
            foundDestination: foundDestinations.length > 0 ? foundDestinations[0] : null,
            foundDestinations: [...foundDestinations],
            phaseLabel: `🚧 DFS - Dead End at [${blockedId}]! Retreating back to [${rollbackTo}], detached ${subtree.length} nodes`
          };
          steps.push(severStep);
          environment.tick(severStep);
        }
      }

      for (const id of severedBlockedNodes) {
        if (!this.blockedNodes.has(id)) severedBlockedNodes.delete(id);
      }

      if (didSever) continue;

      const entry = stack.pop()!;
      const current = entry.id;

      if (this.blockedNodes.has(current)) {
        if (entry.waited < MAX_WAIT_STEPS) {
          stack.unshift({ id: current, waited: entry.waited + 1 });
          iteration++;
          const waitStep: AlgorithmStep = {
            stepIndex: iteration,
            explored: Array.from(visited),
            frontier: stack.map(s => s.id),
            path: reconstructPath(parentMap, lastCurrent ?? sourceId),
            current,
            done: false,
            foundDestination: foundDestinations.length > 0 ? foundDestinations[0] : null,
            foundDestinations: [...foundDestinations],
            phaseLabel: `⏳ DFS - Path blocked, waiting for clearance (${entry.waited + 1}/${MAX_WAIT_STEPS})`
          };
          steps.push(waitStep);
          environment.tick(waitStep);
        } else {
          if (!severedBlockedNodes.has(current) && visited.has(current)) {
            const subtree = collectSubtree(current, childrenMap, visited);
            const subtreeSet = new Set(subtree);
            for (const id of subtree) visited.delete(id);
            for (let i = stack.length - 1; i >= 0; i--) {
              if (subtreeSet.has(stack[i].id)) stack.splice(i, 1);
            }
            const rollbackTo = parentMap.get(current) ?? sourceId;
            if (!this.blockedNodes.has(rollbackTo)) {
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
              foundDestination: foundDestinations.length > 0 ? foundDestinations[0] : null,
              foundDestinations: [...foundDestinations],
              phaseLabel: `🔀 DFS — Wait expired at [${current}], forcing reroute from [${rollbackTo}]`
            };
            steps.push(forceStep);
            environment.tick(forceStep);
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
        foundDestination: foundDestinations.length > 0 ? foundDestinations[0] : null,
        foundDestinations: [...foundDestinations],
        phaseLabel: '🧗 DFS - Exploring Deepest Path'
      };
      steps.push(step);
      environment.tick(step);

      if (now - lastYieldTime > 100) {
        await yieldToMain();
        lastYieldTime = performance.now();
      }

      if (destSet.has(current) && !foundDestinations.includes(current)) {
        foundDestinations.push(current);
        if (deliveryMode === 'anycast') {
          foundDestination = current;
          break;
        } else if (deliveryMode === 'multicast' && foundDestinations.length === destSet.size) {
          break;
        }
      }

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

    const closestExit = foundDestinations.length > 0 ? foundDestinations[0] : null;
    const finalPath = closestExit ? reconstructPath(parentMap, closestExit) : [];
    const totalLatency = calcPathLatency(finalPath, edges);

    steps.push({
      stepIndex: iteration,
      explored: Array.from(visited),
      frontier: [],
      path: finalPath,
      current: closestExit ?? lastCurrent ?? sourceId,
      done: true,
      foundDestination: foundDestinations.length > 0 ? foundDestinations[0] : null,
      foundDestinations: [...foundDestinations],
      phaseLabel: foundDestinations.length > 0 ? (deliveryMode === 'multicast' && foundDestinations.length === destSet.size ? '🏁 DFS - All Targets Secured' : '🏁 DFS - Target Secured') : '❌ DFS - All Routes Exhausted'
    });

    return { steps, nodesExplored, pathLength: foundDestinations.length > 0 ? finalPath.length - 1 : -1, totalLatency, foundDestination: foundDestinations.length > 0 ? foundDestinations[0] : null, maxFrontierSize };
  }
}