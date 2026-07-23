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
    deliveryMode: 'anycast' | 'multicast' = 'anycast',
    customRobotAssignments?: { robotId: string; destinations: string[]; priorityDest?: string; boxCounts?: Record<string, number> }[]
  ): Promise<HybridResult> {
    const { nodes, edges, sourceId, destinationIds } = graph;
    const isAWSWarehouse = nodes.some(n => n.id === 'dest_desk_a') || nodes.some(n => n.id === 'shelf_e1');

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const adj = new Map<string, { to: string; latency: number }[]>();
    nodes.forEach(n => adj.set(n.id, []));
    edges.forEach(e => {
      if (!adj.has(e.from)) adj.set(e.from, []);
      if (!adj.has(e.to)) adj.set(e.to, []);
      adj.get(e.from)!.push({ to: e.to, latency: e.latency });
      adj.get(e.to)!.push({ to: e.from, latency: e.latency });
    });

    const sources = graph.sourceIds && graph.sourceIds.length > 0 ? graph.sourceIds : [sourceId];

    interface AgentState {
      robotId: string;
      destSet: Set<string>;
      requiredBoxes: Record<string, number>; // destId → boxes required
      deliveredBoxes: Record<string, number>; // destId → boxes delivered so far
      pickedUpBoxes: Record<string, number>; // shelfId → boxes picked up so far
      hasCargo: boolean; // true if robot is carrying a box from a shelf
      frontier: { id: string; waited: number }[];
      visited: Set<string>;
      parentMap: Map<string, string | null>;
      childrenMap: Map<string, string[]>;
      foundDestinations: string[];
      severedBlockedNodes: Set<string>;
      lastCurrent: string | null;
      done: boolean;
    }

    const agents: AgentState[] = sources.map(srcId => {
      const assignment = customRobotAssignments?.find(a => a.robotId === srcId);
      const dests = (assignment && assignment.destinations.length > 0)
        ? new Set(assignment.destinations)
        : new Set(destinationIds);

      const requiredBoxes: Record<string, number> = {};
      dests.forEach(destId => {
        requiredBoxes[destId] = (assignment?.boxCounts?.[destId] ?? (isAWSWarehouse ? 6 : 1));
      });

      const parentMap = new Map<string, string | null>();
      parentMap.set(srcId, null);
      const visited = new Set<string>([srcId]);

      return {
        robotId: srcId,
        destSet: dests,
        requiredBoxes,
        deliveredBoxes: {},
        pickedUpBoxes: {},
        hasCargo: false,
        frontier: this.blockedNodes.has(srcId) ? [] : [{ id: srcId, waited: 0 }],
        visited,
        parentMap,
        childrenMap: new Map<string, string[]>(),
        foundDestinations: [],
        severedBlockedNodes: new Set<string>(),
        lastCurrent: srcId,
        done: false,
      };
    });

    let nodesExplored = 0;
    const steps: AlgorithmStep[] = [];
    let iteration = 0;
    let maxFrontierSize = 0;
    let lastYieldTime = performance.now();
    let activeAgentIndex = 0;

    const getAllExplored = () => Array.from(new Set(agents.flatMap(a => Array.from(a.visited))));
    const getAllDeliveredBoxCounts = (): Record<string, number> => {
      const result: Record<string, number> = {};
      agents.forEach(a => {
        Object.entries(a.deliveredBoxes).forEach(([destId, count]) => {
          result[destId] = (result[destId] ?? 0) + count;
        });
      });
      return result;
    };
    const getAllPickedUpBoxCounts = (): Record<string, number> => {
      const result: Record<string, number> = {};
      agents.forEach(a => {
        Object.entries(a.pickedUpBoxes).forEach(([shelfId, count]) => {
          result[shelfId] = (result[shelfId] ?? 0) + count;
        });
      });
      return result;
    };
    const getCombinedPath = (activeAgent: AgentState) => {
      const pathSet = new Set<string>();
      agents.forEach(a => {
        a.foundDestinations.forEach(d => {
          reconstructPath(a.parentMap, d).forEach(n => pathSet.add(n));
        });
      });
      if (activeAgent.lastCurrent) {
        reconstructPath(activeAgent.parentMap, activeAgent.lastCurrent).forEach(n => pathSet.add(n));
      }
      return Array.from(pathSet);
    };
    const getAllFoundDestinations = () => Array.from(new Set(agents.flatMap(a => a.foundDestinations)));

    function chooseStrategy(current: string): 'BFS' | 'DFS' {
      const isDenselyConnected = (adj.get(current)?.length ?? 0) >= 3;
      return isDenselyConnected ? 'BFS' : 'DFS';
    }

    function computeHeuristic(nodeId: string, agent: AgentState): number {
      const node = nodeMap.get(nodeId);
      if (!node) return 0;

      let targetIds: string[] = [];
      if (isAWSWarehouse) {
        const STORAGE_SHELVES = ['shelf_d1','shelf_d2','shelf_e1','shelf_e2','shelf_e3','shelf_e4','shelf_f1','shelf_f2','clutter_a','clutter_b','pallet_jack','trash_cans'];
        if (!agent.hasCargo) {
          targetIds = STORAGE_SHELVES.filter(s => (agent.pickedUpBoxes[s] ?? 0) < 6);
          if (targetIds.length === 0) targetIds = STORAGE_SHELVES;
        } else {
          targetIds = Array.from(agent.destSet).filter(d => (agent.deliveredBoxes[d] ?? 0) < (agent.requiredBoxes[d] ?? 6));
          if (targetIds.length === 0) targetIds = Array.from(agent.destSet);
        }
      } else {
        targetIds = Array.from(agent.destSet);
      }

      let minH = Infinity;
      targetIds.forEach(tId => {
        const tNode = nodeMap.get(tId);
        if (tNode) {
          const dist = Math.hypot(node.x - tNode.x, node.y - tNode.y);
          if (dist < minH) minH = dist;
        }
      });
      return minH === Infinity ? 0 : minH;
    }

    while (agents.some(a => !a.done) && iteration < MAX_TOTAL_STEPS) {
      let attempts = 0;
      while (agents[activeAgentIndex].done && attempts < agents.length) {
        activeAgentIndex = (activeAgentIndex + 1) % agents.length;
        attempts++;
      }

      const agent = agents[activeAgentIndex];
      if (agent.frontier.length === 0) {
        if (!isAWSWarehouse) {
          agent.done = true;
          activeAgentIndex = (activeAgentIndex + 1) % agents.length;
          if (agents.every(a => a.done)) break;
          continue;
        }
        const allDelivered = Array.from(agent.destSet).every(
          d => (agent.deliveredBoxes[d] ?? 0) >= (agent.requiredBoxes[d] ?? 1)
        );
        if (allDelivered || deliveryMode === 'anycast') {
          agent.done = true;
          activeAgentIndex = (activeAgentIndex + 1) % agents.length;
          if (agents.every(a => a.done)) break;
          continue;
        } else {
          agent.visited.clear();
          agent.parentMap.clear();
          agent.parentMap.set(agent.robotId, null);
          agent.childrenMap.clear();
          agent.frontier = [{ id: agent.robotId, waited: 0 }];
        }
      }

      const currentTotalFrontier = agents.reduce((sum, a) => sum + a.frontier.length, 0);
      if (currentTotalFrontier > maxFrontierSize) maxFrontierSize = currentTotalFrontier;

      let didSever = false;
      if (!disablePathSevering) {
        for (const blockedId of this.blockedNodes) {
          if (sources.includes(blockedId)) continue;
          if (agent.severedBlockedNodes.has(blockedId)) continue;
          if (!agent.visited.has(blockedId)) continue;

          agent.severedBlockedNodes.add(blockedId);

          const subtree = collectSubtree(blockedId, agent.childrenMap, agent.visited);
          const subtreeSet = new Set(subtree);

          for (const id of subtree) agent.visited.delete(id);

          for (let i = agent.frontier.length - 1; i >= 0; i--) {
            if (subtreeSet.has(agent.frontier[i].id)) agent.frontier.splice(i, 1);
          }

          const parent = agent.parentMap.get(blockedId);
          const rollbackTo = parent === null ? blockedId : (parent ?? agent.robotId);

          if (!this.blockedNodes.has(rollbackTo) && parent !== null) {
            agent.visited.delete(rollbackTo);
            agent.frontier.push({ id: rollbackTo, waited: 0 });
          } else if (parent === null) {
            agent.visited.delete(blockedId);
            agent.frontier.push({ id: blockedId, waited: 0 });
          }

          if (agent.lastCurrent && subtreeSet.has(agent.lastCurrent)) {
            agent.lastCurrent = rollbackTo;
          }

          iteration++;
          didSever = true;

          const severStep: AlgorithmStep = {
            stepIndex: iteration,
            explored: getAllExplored(),
            frontier: agents.flatMap(a => a.frontier.map(f => f.id)),
            path: getCombinedPath(agent),
            current: rollbackTo,
            done: false,
            foundDestination: getAllFoundDestinations()[0] || null,
            foundDestinations: getAllFoundDestinations(),
            phaseLabel: `🚧 Hybrid [${agent.robotId}] - Severed at [${blockedId}]! Retreating to [${rollbackTo}]`
          };
          steps.push(severStep);
          environment.tick(severStep);
        }
      }

      for (const id of agent.severedBlockedNodes) {
        if (!this.blockedNodes.has(id)) agent.severedBlockedNodes.delete(id);
      }

      if (didSever) {
        activeAgentIndex = (activeAgentIndex + 1) % agents.length;
        continue;
      }

      let bestIdx = 0;
      let bestScore = Infinity;
      for (let i = 0; i < agent.frontier.length; i++) {
        const fItem = agent.frontier[i];
        const strat = chooseStrategy(fItem.id);
        const h = computeHeuristic(fItem.id, agent);
        const score = strat === 'BFS' ? h : h * 0.5 - i; 
        if (score < bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }

      const entry = agent.frontier.splice(bestIdx, 1)[0];
      const current = entry.id;

      if (this.blockedNodes.has(current)) {
        if (entry.waited < MAX_WAIT_STEPS) {
          agent.frontier.push({ id: current, waited: entry.waited + 1 });
          iteration++;
          const waitStep: AlgorithmStep = {
            stepIndex: iteration,
            explored: getAllExplored(),
            frontier: agents.flatMap(a => a.frontier.map(f => f.id)),
            path: getCombinedPath(agent),
            current,
            done: false,
            foundDestination: getAllFoundDestinations()[0] || null,
            foundDestinations: getAllFoundDestinations(),
            phaseLabel: `⏳ Hybrid [${agent.robotId}] - Congestion at [${current}], waiting (${entry.waited + 1}/${MAX_WAIT_STEPS})`
          };
          steps.push(waitStep);
          environment.tick(waitStep);
        }
        activeAgentIndex = (activeAgentIndex + 1) % agents.length;
        continue;
      }

      agent.lastCurrent = current;
      nodesExplored++;
      iteration++;

      const strategy = chooseStrategy(current);
      const now = performance.now();

      const step: AlgorithmStep = {
        stepIndex: iteration,
        explored: getAllExplored(),
        frontier: agents.flatMap(a => a.frontier.map(f => f.id)),
        path: getCombinedPath(agent),
        current,
        done: false,
        foundDestination: getAllFoundDestinations()[0] || null,
        foundDestinations: getAllFoundDestinations(),
        phaseLabel: `🔀 Hybrid [${agent.robotId}] - Dynamic ${strategy} Mode`,
        deliveredBoxCounts: getAllDeliveredBoxCounts(),
        pickedUpBoxCounts: getAllPickedUpBoxCounts()
      };
      steps.push(step);
      environment.tick(step);

      if (now - lastYieldTime > 100) {
        await yieldToMain();
        lastYieldTime = performance.now();
      }

      if (isAWSWarehouse) {
        const STORAGE_SHELVES = new Set(['shelf_d1','shelf_d2','shelf_e1','shelf_e2','shelf_e3','shelf_e4','shelf_f1','shelf_f2','clutter_a','clutter_b','pallet_jack','trash_cans']);

        if (!agent.hasCargo && STORAGE_SHELVES.has(current)) {
          agent.hasCargo = true;
          agent.pickedUpBoxes[current] = (agent.pickedUpBoxes[current] ?? 0) + 1;

          agent.visited.clear();
          agent.visited.add(current);
          agent.parentMap.clear();
          agent.parentMap.set(current, null);
          agent.childrenMap.clear();
          agent.frontier = [{ id: current, waited: 0 }];
        }
        else if (agent.hasCargo && (agent.destSet.has(current) || current === 'dest_desk_a' || current === 'dest_desk_b')) {
          const required = agent.requiredBoxes[current] ?? 6;
          const currentDelivered = agent.deliveredBoxes[current] ?? 0;

          if (currentDelivered < required) {
            agent.deliveredBoxes[current] = currentDelivered + 1;
            agent.hasCargo = false;

            if (agent.deliveredBoxes[current] >= required && !agent.foundDestinations.includes(current)) {
              agent.foundDestinations.push(current);
            }
          }

          const allDelivered = Array.from(agent.destSet).every(
            d => (agent.deliveredBoxes[d] ?? 0) >= (agent.requiredBoxes[d] ?? 1)
          );

          if (allDelivered || deliveryMode === 'anycast') {
            agent.done = true;
          } else {
            agent.visited.clear();
            agent.visited.add(current);
            agent.parentMap.clear();
            agent.parentMap.set(current, null);
            agent.childrenMap.clear();
            agent.frontier = [{ id: current, waited: 0 }];
          }
        }
      } else {
        // Standard pathfinding for non-AWS scenarios
        if (agent.destSet.has(current)) {
          if (!agent.foundDestinations.includes(current)) {
            agent.foundDestinations.push(current);
          }
          const allFound = Array.from(agent.destSet).every(d => agent.visited.has(d));
          if (deliveryMode === 'anycast' || allFound) {
            agent.done = true;
          }
        }
      }

      const neighbors = adj.get(current) ?? [];
      for (const { to } of neighbors) {
        if (!agent.visited.has(to)) {
          agent.visited.add(to);
          agent.parentMap.set(to, current);
          if (!agent.childrenMap.has(current)) agent.childrenMap.set(current, []);
          agent.childrenMap.get(current)!.push(to);
          agent.frontier.push({ id: to, waited: 0 });
        }
      }

      activeAgentIndex = (activeAgentIndex + 1) % agents.length;
    }

    const allFoundDests = getAllFoundDestinations();
    const finalPaths: string[][] = [];
    agents.forEach(a => {
      a.foundDestinations.forEach(d => {
        finalPaths.push(reconstructPath(a.parentMap, d));
      });
    });

    const combinedFinalPath = Array.from(new Set(finalPaths.flat()));
    const totalLatency = calcPathLatency(combinedFinalPath, edges);

    steps.push({
      stepIndex: iteration,
      explored: getAllExplored(),
      frontier: [],
      path: combinedFinalPath,
      current: allFoundDests[0] ?? sources[0],
      done: true,
      foundDestination: allFoundDests[0] ?? null,
      foundDestinations: allFoundDests,
      phaseLabel: allFoundDests.length > 0 ? '🏁 Hybrid - All Active Robot Destinations Reached' : '❌ Hybrid - Search Exhausted',
      deliveredBoxCounts: getAllDeliveredBoxCounts(),
      pickedUpBoxCounts: getAllPickedUpBoxCounts()
    });

    return {
      steps,
      nodesExplored,
      pathLength: allFoundDests.length > 0 ? combinedFinalPath.length - 1 : -1,
      totalLatency,
      foundDestination: allFoundDests[0] ?? null,
      maxFrontierSize
    };
  }
}