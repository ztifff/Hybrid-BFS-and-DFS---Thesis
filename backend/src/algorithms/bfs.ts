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

function calcPathLatency(paths: string[][], edges: ScenarioGraph['edges']): number {
  const usedEdges = new Set<string>();
  let total = 0;

  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];
      const edgeKey = from < to ? `${from}-${to}` : `${to}-${from}`;
      
      if (!usedEdges.has(edgeKey)) {
        usedEdges.add(edgeKey);
        const edge = edges.find((e) => (e.from === from && e.to === to) || (e.to === from && e.from === to));
        if (edge) total += edge.latency;
      }
    }
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
    disablePathSevering: boolean = false,
    deliveryMode: 'anycast' | 'multicast' = 'anycast',
    customRobotAssignments?: { robotId: string; destinations: string[]; priorityDest?: string; boxCounts?: Record<string, number> }[]
  ): Promise<BFSResult> {
    const { nodes, edges, sourceId, destinationIds } = graph;
    const isAWSWarehouse = nodes.some(n => n.id === 'dest_desk_a') || nodes.some(n => n.id === 'shelf_e1');
    const isRoboticsMap = isAWSWarehouse || nodes.some(n => n.id.startsWith('shelf_'));

    const adj = new Map<string, { to: string; latency: number }[]>();
    nodes.forEach((n) => adj.set(n.id, []));
    edges.forEach((e) => {
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
      queue: { id: string; waited: number }[];
      visited: Set<string>;
      parentMap: Map<string, string | null>;
      childrenMap: Map<string, string[]>;
      foundDestinations: string[];
      severedBlockedNodes: Set<string>;
      lastCurrent: string | null;
      priorityDest?: string;
      done: boolean;
    }

    const agents: AgentState[] = sources.map(srcId => {
      const assignment = customRobotAssignments?.find(a => a.robotId === srcId);
      const dests = (assignment && assignment.destinations.length > 0)
        ? new Set(assignment.destinations)
        : new Set(destinationIds);

      // Build required boxes map (default 6 for AWS Warehouse packing desks, 1 otherwise)
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
        queue: this.blockedNodes.has(srcId) ? [] : [{ id: srcId, waited: 0 }],
        visited,
        parentMap,
        childrenMap: new Map<string, string[]>(),
        foundDestinations: [],
        severedBlockedNodes: new Set<string>(),
        lastCurrent: srcId,
        priorityDest: assignment?.priorityDest,
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
    const getRobotPositions = (): Record<string, string> => {
      const result: Record<string, string> = {};
      agents.forEach(a => {
        result[a.robotId] = a.lastCurrent || a.robotId;
      });
      return result;
    };
    const getCurrentPaths = (activeAgent: AgentState): string[][] => {
      const paths: string[][] = [];
      agents.forEach(a => {
        a.foundDestinations.forEach(d => {
          paths.push(reconstructPath(a.parentMap, d));
        });
      });
      if (activeAgent.lastCurrent) {
        paths.push(reconstructPath(activeAgent.parentMap, activeAgent.lastCurrent));
      }
      return paths;
    };
    const getCombinedPath = (activeAgent: AgentState) => {
      const pathSet = new Set<string>();
      getCurrentPaths(activeAgent).forEach(p => p.forEach(n => pathSet.add(n)));
      return Array.from(pathSet);
    };
    const getAllFoundDestinations = () => Array.from(new Set(agents.flatMap(a => a.foundDestinations)));

    while (agents.some(a => !a.done) && iteration < MAX_TOTAL_STEPS) {
      let attempts = 0;
      while (agents[activeAgentIndex].done && attempts < agents.length) {
        activeAgentIndex = (activeAgentIndex + 1) % agents.length;
        attempts++;
      }

      const agent = agents[activeAgentIndex];
      if (agent.queue.length === 0) {
        if (!isRoboticsMap) {
          agent.done = true;
          activeAgentIndex = (activeAgentIndex + 1) % agents.length;
          if (agents.every(a => a.done)) break;
          continue;
        }
        const allDelivered = Array.from(agent.destSet).every(
          d => (agent.deliveredBoxes[d] ?? 0) >= (agent.requiredBoxes[d] ?? 6)
        );
        if (allDelivered) {
          agent.done = true;
          activeAgentIndex = (activeAgentIndex + 1) % agents.length;
          if (agents.every(a => a.done)) break;
          continue;
        } else {
          // Re-initialize queue from last known valid position (agent.lastCurrent), NOT robot start!
          const restartNode = (agent.lastCurrent && !this.blockedNodes.has(agent.lastCurrent))
            ? agent.lastCurrent
            : agent.robotId;

          agent.visited.clear();
          agent.visited.add(restartNode);
          agent.parentMap.clear();
          agent.parentMap.set(restartNode, null);
          agent.childrenMap.clear();
          agent.queue = [{ id: restartNode, waited: 0 }];
        }
      }

      const currentTotalFrontier = agents.reduce((sum, a) => sum + a.queue.length, 0);
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

          for (let i = agent.queue.length - 1; i >= 0; i--) {
            if (subtreeSet.has(agent.queue[i].id)) agent.queue.splice(i, 1);
          }

          const parent = agent.parentMap.get(blockedId);
          const rollbackTo = parent === null ? blockedId : (parent ?? agent.robotId);

          if (!this.blockedNodes.has(rollbackTo) && parent !== null) {
            agent.visited.delete(rollbackTo);
            agent.queue.unshift({ id: rollbackTo, waited: 0 });
          } else if (parent === null) {
            agent.visited.delete(blockedId);
            agent.queue.unshift({ id: blockedId, waited: 0 });
          }

          if (agent.lastCurrent && subtreeSet.has(agent.lastCurrent)) {
            agent.lastCurrent = rollbackTo;
          }

          iteration++;
          didSever = true;

          const severStep: AlgorithmStep = {
            stepIndex: iteration,
            explored: getAllExplored(),
            frontier: agents.flatMap(a => a.queue.map(q => q.id)),
            path: getCombinedPath(agent),
            currentLatency: calcPathLatency(getCurrentPaths(agent), edges),
            current: rollbackTo,
            done: false,
            foundDestination: getAllFoundDestinations()[0] || null,
            foundDestinations: getAllFoundDestinations(),
            phaseLabel: `🚧 BFS [${agent.robotId}] - Severed at [${blockedId}]! Rollback to [${rollbackTo}]`,
            deliveredBoxCounts: getAllDeliveredBoxCounts(),
            pickedUpBoxCounts: getAllPickedUpBoxCounts(),
            activeRobotId: agent.robotId,
            robotPositions: getRobotPositions()
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

      const entry = agent.queue.shift()!;
      const current = entry.id;

      if (this.blockedNodes.has(current)) {
        const hasUnblockedAlternatives = agent.queue.some(q => !this.blockedNodes.has(q.id));

        if (hasUnblockedAlternatives) {
          agent.queue.push({ id: current, waited: entry.waited });
          
          if (entry.waited === 0) {
            iteration++;
            const rerouteStep: AlgorithmStep = {
              stepIndex: iteration,
              explored: getAllExplored(),
              frontier: agents.flatMap(a => a.queue.map(q => q.id)),
              path: getCombinedPath(agent),
            currentLatency: calcPathLatency(getCurrentPaths(agent), edges),
              current,
              done: false,
              foundDestination: getAllFoundDestinations()[0] || null,
              foundDestinations: getAllFoundDestinations(),
              phaseLabel: `🔀 BFS [${agent.robotId}] — Blockade at [${current}], rerouting!`,
              deliveredBoxCounts: getAllDeliveredBoxCounts(),
              pickedUpBoxCounts: getAllPickedUpBoxCounts(),
              activeRobotId: agent.robotId,
              robotPositions: getRobotPositions()
            };
            steps.push(rerouteStep);
            environment.tick(rerouteStep);
          }
        } else {
          if (entry.waited < MAX_WAIT_STEPS) {
            agent.queue.unshift({ id: current, waited: entry.waited + 1 });
            iteration++;
            const waitStep: AlgorithmStep = {
              stepIndex: iteration,
              explored: getAllExplored(),
              frontier: agents.flatMap(a => a.queue.map(q => q.id)),
              path: getCombinedPath(agent),
            currentLatency: calcPathLatency(getCurrentPaths(agent), edges),
              current,
              done: false,
              foundDestination: getAllFoundDestinations()[0] || null,
              foundDestinations: getAllFoundDestinations(),
              phaseLabel: `⏳ BFS [${agent.robotId}] - Congestion at [${current}], waiting (${entry.waited + 1}/${MAX_WAIT_STEPS})`,
              deliveredBoxCounts: getAllDeliveredBoxCounts(),
              pickedUpBoxCounts: getAllPickedUpBoxCounts(),
              activeRobotId: agent.robotId,
              robotPositions: getRobotPositions()
            };
            steps.push(waitStep);
            environment.tick(waitStep);
          } else {
            const restartNode = (agent.lastCurrent && !this.blockedNodes.has(agent.lastCurrent))
              ? agent.lastCurrent
              : agent.robotId;

            agent.visited.clear();
            agent.visited.add(restartNode);
            agent.parentMap.clear();
            agent.parentMap.set(restartNode, null);
            agent.childrenMap.clear();
            agent.queue = [{ id: restartNode, waited: 0 }];
          }
        }

        activeAgentIndex = (activeAgentIndex + 1) % agents.length;
        continue;
      }

      agent.lastCurrent = current;

      let resetHappened = false;

      const getActiveDestinations = (ag: AgentState): Set<string> => {
        if (ag.priorityDest && ag.destSet.has(ag.priorityDest)) {
          const req = ag.requiredBoxes[ag.priorityDest] ?? (isAWSWarehouse ? 6 : 1);
          const del = ag.deliveredBoxes[ag.priorityDest] ?? (ag.foundDestinations.includes(ag.priorityDest) ? 1 : 0);
          if (del < req) {
            return new Set([ag.priorityDest]);
          }
        }
        return ag.destSet;
      };

      if (isRoboticsMap) {
        const STORAGE_SHELVES = new Set(['shelf_a1', 'shelf_a2', 'shelf_b1', 'shelf_b2', 'shelf_d1', 'shelf_d2', 'shelf_e1', 'shelf_e2', 'shelf_e3', 'shelf_e4', 'shelf_f1', 'shelf_f2']);
        const isStorageShelf = (id: string) => STORAGE_SHELVES.has(id) || (id.startsWith('shelf_') && !id.startsWith('dest_'));

        // Phase 1: Seeking a box from an available storage shelf (shelf has remaining boxes < 6)
        if (!agent.hasCargo && isStorageShelf(current) && (agent.pickedUpBoxes[current] ?? 0) < 6) {
          agent.hasCargo = true; // Robot picks up 1 box!
          agent.pickedUpBoxes[current] = (agent.pickedUpBoxes[current] ?? 0) + 1;

          agent.visited.clear();
          agent.visited.add(current);
          agent.parentMap.clear();
          agent.parentMap.set(current, null);
          agent.childrenMap.clear();
          agent.queue = [{ id: current, waited: 0 }];
          resetHappened = true;
        }
        // Phase 2: Seeking an unsatisfied packing desk assigned to this robot (priority first)
        else if (agent.hasCargo && getActiveDestinations(agent).has(current)) {
          const required = agent.requiredBoxes[current] ?? 6;
          const currentDelivered = agent.deliveredBoxes[current] ?? 0;

          if (currentDelivered < required) {
            agent.deliveredBoxes[current] = currentDelivered + 1;
            agent.hasCargo = false; // Unloaded cargo into desk!

            if (agent.deliveredBoxes[current] >= required && !agent.foundDestinations.includes(current)) {
              agent.foundDestinations.push(current);
            }

            // In AWS Warehouse: check if ALL desks are now full
            const allDelivered = Array.from(agent.destSet).every(
              d => (agent.deliveredBoxes[d] ?? 0) >= (agent.requiredBoxes[d] ?? 6)
            );

            if (allDelivered) {
              agent.done = true;
            } else {
              agent.visited.clear();
              agent.visited.add(current);
              agent.parentMap.clear();
              agent.parentMap.set(current, null);
              agent.childrenMap.clear();
              agent.queue = [{ id: current, waited: 0 }];
              resetHappened = true;
            }
          }
          // If desk is already full (currentDelivered >= required), pass through keeping hasCargo = true!
        }
      } else {
        // Standard pathfinding for non-AWS scenarios
        const activeDests = getActiveDestinations(agent);
        if (activeDests.has(current)) {
          if (!agent.foundDestinations.includes(current)) {
            agent.foundDestinations.push(current);
          }
          const allFound = Array.from(agent.destSet).every(d => agent.foundDestinations.includes(d));
          if (deliveryMode === 'anycast' || allFound) {
            agent.done = true;
          }
        }
      }

      nodesExplored++;
      iteration++;

      const now = performance.now();
      const step: AlgorithmStep = {
        stepIndex: iteration,
        explored: getAllExplored(),
        frontier: agents.flatMap(a => a.queue.map(q => q.id)),
        path: getCombinedPath(agent),
        currentLatency: calcPathLatency(getCurrentPaths(agent), edges),
        current,
        done: false,
        foundDestination: getAllFoundDestinations()[0] || null,
        foundDestinations: getAllFoundDestinations(),
        phaseLabel: `📡 BFS [${agent.robotId}] - Expanding Level`,
        deliveredBoxCounts: getAllDeliveredBoxCounts(),
        pickedUpBoxCounts: getAllPickedUpBoxCounts(),
        activeRobotId: agent.robotId,
        robotPositions: getRobotPositions()
      };
      steps.push(step);
      environment.tick(step);

      if (now - lastYieldTime > 100) {
        await yieldToMain();
        lastYieldTime = performance.now();
      }

      // Only expand neighbors when no pickup/delivery reset happened this iteration.
      // After a reset, the robot re-processes 'current' next iteration with fresh state.
      if (!resetHappened) {
        const neighbors = adj.get(current) ?? [];
        for (const { to } of neighbors) {
          if (!agent.visited.has(to)) {
            agent.visited.add(to);
            agent.parentMap.set(to, current);
            if (!agent.childrenMap.has(current)) agent.childrenMap.set(current, []);
            agent.childrenMap.get(current)!.push(to);
            agent.queue.push({ id: to, waited: 0 });
          }
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
    const totalLatency = calcPathLatency(finalPaths, edges);

    steps.push({
      stepIndex: iteration,
      explored: getAllExplored(),
      frontier: [],
      path: combinedFinalPath,
      currentLatency: totalLatency,
      current: allFoundDests[0] ?? sources[0],
      done: true,
      foundDestination: allFoundDests[0] ?? null,
      foundDestinations: allFoundDests,
      phaseLabel: allFoundDests.length > 0 ? '🏁 BFS - All Active Destinations Reached' : '❌ BFS - Search Exhausted',
      deliveredBoxCounts: getAllDeliveredBoxCounts(),
      pickedUpBoxCounts: getAllPickedUpBoxCounts(),
      robotPositions: getRobotPositions()
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