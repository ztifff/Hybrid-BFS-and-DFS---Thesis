import { ScenarioGraph, AlgorithmStep } from '../types';
import { PathfinderObserver, DynamicEventPayload, SimulationEnvironment } from '../utils/simulationEnvironment';

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
    const edge = edges.find(e => e.from === path[i] && e.to === path[i + 1]);
    if (edge) total += edge.latency;
  }
  return total;
}

export class HybridPathfinder implements PathfinderObserver {
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
  ): Promise<HybridResult> {
    const { nodes, edges, sourceId, destinationIds } = graph;

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const destSet = new Set(destinationIds);

    const adj = new Map<string, { to: string; latency: number }[]>();
    nodes.forEach(n => adj.set(n.id, []));
    edges.forEach(e => {
      if (!adj.has(e.from)) adj.set(e.from, []);
      if (!adj.has(e.to)) adj.set(e.to, []);
      adj.get(e.from)!.push({ to: e.to, latency: e.latency });
      adj.get(e.to)!.push({ to: e.from, latency: e.latency });
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
    const foundDestinations: string[] = [];
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

    while (frontier.length > 0 && iteration < MAX_TOTAL_STEPS) {
      if (deliveryMode === 'anycast' && foundDestinations.length > 0) break;
      if (deliveryMode === 'multicast' && destSet.size > 0 && foundDestinations.length === destSet.size) break;
      if (frontier.length > maxFrontierSize) maxFrontierSize = frontier.length;

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

          for (let i = frontier.length - 1; i >= 0; i--) {
            if (subtreeSet.has(frontier[i].id)) frontier.splice(i, 1);
          }

          const rollbackTo = parentMap.get(blockedId) ?? sourceId;
          if (!this.blockedNodes.has(rollbackTo)) {
            visited.delete(rollbackTo);
            frontier.unshift({ id: rollbackTo, waited: 0 }); 
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
            foundDestination: foundDestinations.length > 0 ? foundDestinations[0] : null,
            foundDestinations: [...foundDestinations],
            phaseLabel: `🚧 HYBRID - Route severed at [${blockedId}]! Falling back to [${rollbackTo}] (${subtree.length} nodes lost)`
          };
          steps.push(severStep);
          environment.tick(severStep);
        }
      }

      for (const id of severedBlockedNodes) {
        if (!this.blockedNodes.has(id)) severedBlockedNodes.delete(id);
      }

      if (didSever) continue;

      const strategy = 'Priority';
      const entry = frontier.pop()!;
      if (!entry) continue;
      const current = entry.id;

      if (this.blockedNodes.has(current)) {
        if (entry.waited < MAX_WAIT_STEPS) {
          frontier.push({ id: current, waited: entry.waited + 1 });
          iteration++;
          const waitStep: AlgorithmStep = {
            stepIndex: iteration,
            explored: Array.from(visited),
            frontier: frontier.map(f => f.id),
            path: reconstructPath(parentMap, lastCurrent ?? sourceId),
            current,
            done: false,
            foundDestination: foundDestinations.length > 0 ? foundDestinations[0] : null,
            foundDestinations: [...foundDestinations],
            phaseLabel: `⏳ HYBRID - Congestion, buffering packet (${entry.waited + 1}/${MAX_WAIT_STEPS})`
          };
          steps.push(waitStep);
          environment.tick(waitStep);
        } else {
          if (!severedBlockedNodes.has(current) && visited.has(current)) {
            const subtree = collectSubtree(current, childrenMap, visited);
            const subtreeSet = new Set(subtree);
            for (const id of subtree) visited.delete(id);
            for (let i = frontier.length - 1; i >= 0; i--) {
              if (subtreeSet.has(frontier[i].id)) frontier.splice(i, 1);
            }
            const rollbackTo = parentMap.get(current) ?? sourceId;
            if (!this.blockedNodes.has(rollbackTo)) {
              visited.delete(rollbackTo);
              frontier.unshift({ id: rollbackTo, waited: 0 }); 
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
              foundDestination: foundDestinations.length > 0 ? foundDestinations[0] : null,
              foundDestinations: [...foundDestinations],
              phaseLabel: `🔀 HYBRID — Timeout at [${current}], abandoning path and returning to [${rollbackTo}]`
            };
            steps.push(forceStep);
            environment.tick(forceStep);
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
        foundDestination: foundDestinations.length > 0 ? foundDestinations[0] : null,
        foundDestinations: [...foundDestinations],
        phaseLabel: `🔄 HYBRID - Smart Search`
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

      const neighbors = adj.get(current) ?? [];
      
      const getPriority = (currentLvl: number, neighborLvl: number) => {
        if (currentLvl === 2 && neighborLvl === 3) return 100;
        if (currentLvl === 2 && neighborLvl === 1) return 10;
        if (currentLvl === 1 && neighborLvl === 0) return 100;
        if (currentLvl === 1 && neighborLvl === 2) return 10;
        if (currentLvl === 0 && neighborLvl === 0) return 100;
        if (currentLvl === 0 && neighborLvl === 1) return 10;
        if (currentLvl === 3 && neighborLvl === 3) return 100;
        if (currentLvl === 3 && neighborLvl === 2) return 10;
        return 50;
      };

      const currentLvl = nodeMap.get(current)?.level ?? 99;
      
      const sortedNeighbors = [...neighbors].sort((a, b) => {
        const levelA = nodeMap.get(a.to)?.level ?? 99;
        const levelB = nodeMap.get(b.to)?.level ?? 99;
        return getPriority(currentLvl, levelA) - getPriority(currentLvl, levelB); 
      });

      for (const { to } of sortedNeighbors) {
        if (!visited.has(to)) {
          visited.add(to);
          parentMap.set(to, current);
          if (!childrenMap.has(current)) childrenMap.set(current, []);
          childrenMap.get(current)!.push(to);
          frontier.push({ id: to, waited: 0 });
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
      phaseLabel: foundDestinations.length > 0 ? (deliveryMode === 'multicast' && foundDestinations.length === destSet.size ? '🏁 HYBRID - All Targets Secured' : '🏁 HYBRID - Target Secured') : '❌ HYBRID - All Routes Exhausted'
    });

    return { steps, nodesExplored, pathLength: foundDestinations.length > 0 ? finalPath.length - 1 : -1, totalLatency, foundDestination: foundDestinations.length > 0 ? foundDestinations[0] : null, maxFrontierSize };
  }
}