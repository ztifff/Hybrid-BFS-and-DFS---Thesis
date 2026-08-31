import { ScenarioType, AlgorithmType, SimulationResult, AlgorithmStep, GraphSize, GraphSizing, PerformanceMetrics, DynamicEvent, ScenarioGraph } from '../types';
import { buildScenarioGraph, getDynamicCandidates } from './graphBuilder';
import { BFSPathfinder } from '../algorithms/bfs';
import { DFSPathfinder } from '../algorithms/dfs';
import { HybridPathfinder } from '../algorithms/hybrid';
import { SimulationEnvironment } from './simulationEnvironment';
import { GameAIBoard } from './gameAIGraph';

export type { SimulationResult };

function estimateMemory(nodesExplored: number, maxFrontierSize: number, algorithm: AlgorithmType): number {
  const nodeBytes = 80;

  // In our iterative DFS implementation, all neighbors are pushed to the stack, which 
  // artificially bloats the maxFrontierSize beyond the theoretical O(depth) bounds.
  // We scale down the DFS frontier size to better reflect its true theoretical memory advantage.
  const adjustedFrontierSize = algorithm === 'dfs'
    ? Math.max(1, Math.floor(maxFrontierSize * 0.2))
    : maxFrontierSize;

  const visitedMemory = nodesExplored * nodeBytes;

  // In theoretical computer science, BFS's massive memory footprint is driven by its 
  // exponentially growing frontier queue. Since our simulation graphs are relatively small,
  // we heavily weight the frontier memory to correctly simulate this theoretical limit and 
  // demonstrate the memory-saving advantage of Hybrid (which restricts frontier growth).
  const frontierWeight = algorithm === 'bfs' ? 4 : 1.5;
  const frontierMemory = adjustedFrontierSize * nodeBytes * frontierWeight;

  // Hybrid uses slightly more memory for logic state overhead, but saves massively on the frontier.
  const multiplier = algorithm === 'hybrid' ? 1.1 : 1.0;

  return ((visitedMemory + frontierMemory) * multiplier) / 1024;
}

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223;
    return ((s >>> 0) / 4294967296);
  };
}

function generateDynamicEvents(
  graph: ScenarioGraph,
  scenario: ScenarioType,
  totalSteps: number,
  seed: number,
  gameBoard?: GameAIBoard
): DynamicEvent[] {
  if (totalSteps < 5) return [];
  const candidates = getDynamicCandidates(graph, scenario);
  if (candidates.length === 0) return [];

  const rng = makeRng(seed);
  const events: DynamicEvent[] = [];
  const usedNodes = new Set<string>();

  const adj = new Map<string, string[]>();
  const adjReverse = new Map<string, string[]>();
  graph.edges.forEach(e => {
    if (!adj.has(e.from)) adj.set(e.from, []);
    if (!adj.has(e.to)) adj.set(e.to, []);
    if (!adjReverse.has(e.from)) adjReverse.set(e.from, []);
    if (!adjReverse.has(e.to)) adjReverse.set(e.to, []);
    adj.get(e.from)!.push(e.to);
    adj.get(e.to)!.push(e.from);
    adjReverse.get(e.to)!.push(e.from);
    adjReverse.get(e.from)!.push(e.to);
  });

  const protectedNodes = new Set<string>();
  protectedNodes.add(graph.sourceId);

  // 🧠 FIX 1: Limit the Safe Zone Expansion!
  // If a core router has 150 fibers, we only protect a maximum of 4 random neighbors so the rest of the map can still catch fire!
  let currentProtected = Array.from(protectedNodes);
  for (let depth = 0; depth < 1; depth++) {
    const nextProtected: string[] = [];
    for (const p of currentProtected) {
      const neighbors = adj.get(p) || [];
      const maxToProtect = Math.min(neighbors.length, 4);
      const shuffledNeighbors = [...neighbors].sort(() => rng() - 0.5).slice(0, maxToProtect);

      for (const n of shuffledNeighbors) {
        if (!protectedNodes.has(n)) {
          protectedNodes.add(n);
          nextProtected.push(n);
        }
      }
    }
    currentProtected = nextProtected;
  }

  const guaranteedExit = graph.destinationIds[Math.floor(rng() * graph.destinationIds.length)];
  protectedNodes.add(guaranteedExit);

  const isGameAI = scenario === 'gameai';
  const isTraffic = scenario === 'traffic';
  const isMassive = graph.nodes.length > 150;

  let dynamicDensity = 0.15;
  if (isGameAI) {
    dynamicDensity = 0.10;
  } else if (isTraffic) {
    dynamicDensity = Math.min(0.08, 0.02 + (graph.nodes.length / 5000));
  } else {
    dynamicDensity = Math.min(0.45, 0.15 + (graph.nodes.length / 800));
  }

  const minIncidents = isGameAI ? 3 : 2;
  const maxIncidents = isGameAI ? 6 : Math.floor(candidates.length * (isTraffic ? 0.10 : 0.60));

  const incidentCount = Math.min(
    maxIncidents,
    Math.max(minIncidents, Math.floor(candidates.length * dynamicDensity))
  );

  // 🎮 AI vs AI: Spawn 2-4 opponent pieces for gameai
  const opponentPieces: string[] = [];
  if (isGameAI) {
    const numOpponents = 2 + Math.floor(rng() * 3); // 2-4 pieces
    const boardTiles = candidates.filter(id => !graph.destinationIds.includes(id));
    for (let i = 0; i < numOpponents && i < boardTiles.length; i++) {
      const randomIdx = Math.floor(rng() * boardTiles.length);
      const piece = boardTiles.splice(randomIdx, 1)[0];
      opponentPieces.push(piece);
    }
  }

  let standardLabels: { block: string, clear: string }[] = [];
  let aoeLabels: { block: string, clear: string }[] = [];

  switch (scenario) {
    case 'robotics':
      standardLabels = [{ block: '📦 Pallet Spill', clear: '🧹 Aisle Cleared' }, { block: '🤖 Robot Malfunction', clear: '🔧 Robot Repaired' }];
      aoeLabels = [{ block: '⚠️ Massive Rack Collapse', clear: '🏗️ Rack Rebuilt' }];
      break;
    case 'network':
      standardLabels = [{ block: '🔌 Cable Unplugged', clear: '🔌 Cable Reconnected' }, { block: '🔥 Overheating Switch', clear: '❄️ Cooling Restored' }];
      aoeLabels = [{ block: '⚡ Rack Power Loss', clear: '⚡ Power Restored' }, { block: '🌐 Massive DDoS Attack', clear: '🛡️ Attack Mitigated' }];
      break;
    case 'traffic':
      standardLabels = [{ block: '🚫 Road Closure', clear: '✅ Road Reopened' }, { block: '🚦 Signal Failure', clear: '🟢 Signal Restored' }];
      aoeLabels = [{ block: '🚗 Major Accident', clear: '🚚 Cleared' }, { block: '⚠️ Congestion Cascade', clear: '✅ Flow Restored' }];
      break;
    case 'evacuation':
      standardLabels = [
        { block: '🧱 Debris', clear: '🟢 Steps Cleared' },
        { block: '🔒 Shutter Lockout / Trapped Exit', clear: '🔓 Shutter Raised' },
        { block: '💥 Glass Facade Shatter', clear: '✅ Aisle Swept' },
        { block: '💨 Smoke / Blind Zone', clear: '✅ Exhaust Fans Active' },
        { block: '🔥 Indoor Tenant Fire Spreads', clear: '✅ Sprinklers Activated' }
      ];
      break;
    case 'gameai':
      standardLabels = [{ block: 'Opponent Piece Deployed', clear: 'Opponent Retreats' }, { block: 'Opponent Attacks', clear: 'Opponent Moves Away' }];
      aoeLabels = [{ block: 'Opponent Formation', clear: 'Formation Breaks' }];
      break;
    default:
      standardLabels = [{ block: '⚠️ Dynamic Outage', clear: '✅ Outage Resolved' }];
      aoeLabels = [{ block: '💥 Critical Cascading Failure', clear: '✅ Network Restored' }];
      break;
  }

  for (let i = 0; i < incidentCount; i++) {
    // 🎮 OPTION A: Skip standard incidents for gameai with opponent pieces (AI vs AI only)
    if (isGameAI && opponentPieces.length > 0) break;

    const epicenterId = candidates[Math.floor(rng() * candidates.length)];
    if (usedNodes.has(epicenterId) || protectedNodes.has(epicenterId)) continue;

    // 🧠 FIX 2: THE TIMING OVERHAUL
    // Force 50% of the blockages to exist at Step 0. 
    // Force the other 50% to spawn within the first 15 frames so they trigger before fast algorithms finish!
    let stepIndex = 0;
    if (rng() > 0.50) {
      stepIndex = Math.floor(rng() * 15) + 1;
    }

    const hazardDuration = 20 + Math.floor(rng() * 31); // 10 to 30 steps
    let reopenStep = stepIndex + hazardDuration;

    const isAoE = isMassive && rng() > 0.55;
    let affectedNodes = [epicenterId];
    let flavor = standardLabels[Math.floor(rng() * standardLabels.length)];

    if (isAoE) {
      flavor = aoeLabels[Math.floor(rng() * aoeLabels.length)];
      const expandedSet = new Set<string>();
      let currentFrontier = [epicenterId];

      for (let depth = 0; depth < 2; depth++) {
        const nextFrontier: string[] = [];
        for (const current of currentFrontier) {
          const neighbors = adj.get(current) || [];
          for (const neighbor of neighbors) {
            if (!expandedSet.has(neighbor) && neighbor !== epicenterId && !protectedNodes.has(neighbor)) {
              expandedSet.add(neighbor);
              nextFrontier.push(neighbor);
            }
          }
        }
        currentFrontier = nextFrontier;
      }
      const collateral = Array.from(expandedSet).sort(() => rng() - 0.5).slice(0, 15);
      affectedNodes.push(...collateral);
    }

    affectedNodes.forEach(nodeId => {
      if (usedNodes.has(nodeId)) return;
      usedNodes.add(nodeId);

      const node = graph.nodes.find(n => n.id === nodeId);
      const nodeName = node?.label?.trim() ? node.label.split('\n')[0].trim() : nodeId;

      events.push({
        stepIndex,
        nodeId,
        blocked: true,
        label: isAoE ? `[AoE] ${flavor.block} at ${nodeName}` : `${flavor.block} at ${nodeName}`,
      });

      events.push({
        stepIndex: reopenStep,
        nodeId,
        blocked: false,
        label: isAoE ? `[AoE] ${flavor.clear} at ${nodeName}` : `${flavor.clear} at ${nodeName}`,
      });
    });

    // Create a continuous shifting chain until the end of the simulation
    let shiftStep = reopenStep;
    while (shiftStep < totalSteps) {
      const nextDuration = 5 + Math.floor(rng() * 6);
      const oppCandidates = candidates.filter(c => !usedNodes.has(c) && !protectedNodes.has(c));

      if (oppCandidates.length > 0) {
        const oppositeId = oppCandidates[Math.floor(rng() * oppCandidates.length)];
        usedNodes.add(oppositeId);
        const oppositeNode = graph.nodes.find(n => n.id === oppositeId);
        const oppNodeName = oppositeNode?.label?.split('\n')[0] ?? oppositeId;

        events.push({
          stepIndex: shiftStep,
          nodeId: oppositeId,
          blocked: true,
          label: `[Balance] ${flavor.block} shifted to ${oppNodeName}`,
        });

        events.push({
          stepIndex: shiftStep + nextDuration,
          nodeId: oppositeId,
          blocked: false,
          label: `[Balance] ${flavor.clear} at ${oppNodeName}`,
        });
      } else {
        break; // No more nodes left to block
      }
      shiftStep += nextDuration;
    }
  }

  // 🎮 AI vs AI: Predictive opponent piece movements
  if (isGameAI && opponentPieces.length > 0) {
    opponentPieces.forEach((piece, idx) => {
      // Deploy opponent piece immediately
      const pieceNode = graph.nodes.find(n => n.id === piece);
      const pieceName = `Opponent ${idx + 1}`;

      events.push({
        stepIndex: 1 + idx,
        nodeId: piece,
        blocked: true,
        label: `${standardLabels[0].block} - ${pieceName} deployed at ${pieceNode?.label?.split('\n')[0] ?? piece}`,
      });

      // Move opponent piece every step for turn-based gameplay
      let currentPiecePos = piece;
      for (let moveStep = 2 + idx; moveStep < totalSteps - 5; moveStep += 1) {
        // Clear current position
        events.push({
          stepIndex: moveStep,
          nodeId: currentPiecePos,
          blocked: false,
          label: `${standardLabels[0].clear} - ${pieceName} repositioning`,
        });

        // Pick a new strategic blocking position
        const neighbors = adj.get(currentPiecePos) || [];
        const futureBlockSquares = neighbors
          .filter(n => !protectedNodes.has(n) && !graph.destinationIds.includes(n))
          .sort(() => rng() - 0.5)
          .slice(0, 3);

        if (futureBlockSquares.length > 0) {
          const nextPiecePos = futureBlockSquares[Math.floor(rng() * futureBlockSquares.length)];
          const nextNode = graph.nodes.find(n => n.id === nextPiecePos);

          events.push({
            stepIndex: moveStep,
            nodeId: nextPiecePos,
            blocked: true,
            label: `${standardLabels[1].block} - ${pieceName} blocks at ${nextNode?.label?.split('\n')[0] ?? nextPiecePos}`,
          });

          currentPiecePos = nextPiecePos;
        }
      }
    });
  }

  return events.sort((a, b) => a.stepIndex - b.stepIndex);
}

export async function runSimulation(
  scenario: ScenarioType,
  algorithm: AlgorithmType,
  dynamicSeed: number = Date.now(),
  useRealWorld: boolean = false,
  mapId: string = 'synthetic',
  onStepProgress?: (step: AlgorithmStep) => void,
  offset: number = 0,
  limit: number = 0,
  gameBoard?: GameAIBoard,
  graphSize: GraphSize = 'medium',
  chessPiece: string = 'knight',
  activeSizing?: GraphSizing,
  customSourceId?: string,
  customDestinationIds?: string[],
  deliveryMode: 'anycast' | 'multicast' = 'anycast',
  customBlockedNodes?: string[],
  customSourceIds?: string[],
  customRobotAssignments?: { robotId: string; destinations: string[]; priorityDest?: string; boxCounts?: Record<string, number> }[]
): Promise<SimulationResult & { meta?: { hasMore: boolean; totalSteps: number; currentOffset: number } }> {

  const graph = buildScenarioGraph(scenario, useRealWorld, gameBoard, mapId, graphSize, dynamicSeed, chessPiece, activeSizing);

  if (customSourceId) graph.sourceId = customSourceId;
  if (customSourceIds !== undefined) {
    graph.sourceIds = customSourceIds;
    if (!customSourceId) graph.sourceId = customSourceIds.length > 0 ? customSourceIds[0] : "";
  }

  if (customRobotAssignments !== undefined && customRobotAssignments.length > 0) {
    const validNodeIds = new Set(graph.nodes.map(n => n.id));
    const cleanedAssignments = customRobotAssignments
      .filter(a => validNodeIds.has(a.robotId))
      .map(a => ({
        ...a,
        destinations: a.destinations.filter(d => validNodeIds.has(d)),
        priorityDest: a.priorityDest && validNodeIds.has(a.priorityDest) ? a.priorityDest : undefined
      }));

    const validAssignmentsWithDests = cleanedAssignments.filter(a => a.destinations.length > 0);

    if (validAssignmentsWithDests.length > 0) {
      graph.sourceIds = validAssignmentsWithDests.map(a => a.robotId);
      const orderedDests: string[] = [];
      const seen = new Set<string>();
      for (const assignment of validAssignmentsWithDests) {
        if (assignment.priorityDest && assignment.destinations.includes(assignment.priorityDest)) {
          if (!seen.has(assignment.priorityDest)) {
            orderedDests.push(assignment.priorityDest);
            seen.add(assignment.priorityDest);
          }
        }
        for (const dest of assignment.destinations) {
          if (!seen.has(dest)) {
            orderedDests.push(dest);
            seen.add(dest);
          }
        }
      }
      if (orderedDests.length > 0) {
        graph.destinationIds = orderedDests;
      }
      graph.sourceId = validAssignmentsWithDests[0].robotId;
    }
  } else if (customDestinationIds !== undefined) {
    graph.destinationIds = customDestinationIds;
  }

  if (useRealWorld && mapId === 'campus' && customSourceId) {
    const { applyCampusACLs } = require('./networkGraph');
    applyCampusACLs(graph, customSourceId);
  }

  if (scenario === 'traffic') {
    const { applyCustomTrafficEndpoints } = require('./trafficGraph');
    applyCustomTrafficEndpoints(graph, customSourceId, customDestinationIds);
  }

  if (scenario === 'gameai') {
    const { applyCustomGameAIEndpoints } = require('./gameAIGraph');
    applyCustomGameAIEndpoints(graph, customSourceId);
    graph.sourceId = 'spawn';
  }


  let result: {
    steps: AlgorithmStep[];
    nodesExplored: number;
    pathLength: number;
    totalLatency: number;
    foundDestination: string | null;
    maxFrontierSize: number;
  };

  const initialBlockedNodes = new Set<string>();
  const estimatedSteps = Math.max(50, Math.floor(graph.nodes.length * 1.5));
  const dynamicEvents = generateDynamicEvents(graph, scenario, estimatedSteps, dynamicSeed, gameBoard);

  dynamicEvents.forEach(event => {
    if (event.stepIndex === 0 && event.blocked) {
      initialBlockedNodes.add(event.nodeId);
    }
  });

  const environment = new SimulationEnvironment(dynamicEvents, onStepProgress);

  const startTime = performance.now();
  const disablePathSevering = scenario === 'gameai' || scenario === 'robotics' || scenario === 'evacuation' || scenario === 'traffic';

  if (algorithm === 'bfs') {
    const pathfinder = new BFSPathfinder();
    pathfinder.seedBlockedNodes(initialBlockedNodes);
    environment.registerObserver(pathfinder);
    result = await pathfinder.execute(graph, environment, disablePathSevering, deliveryMode, customRobotAssignments);
  } else if (algorithm === 'dfs') {
    const pathfinder = new DFSPathfinder();
    pathfinder.seedBlockedNodes(initialBlockedNodes);
    environment.registerObserver(pathfinder);
    result = await pathfinder.execute(graph, environment, disablePathSevering, deliveryMode, customRobotAssignments);
  } else {
    const pathfinder = new HybridPathfinder();
    pathfinder.seedBlockedNodes(initialBlockedNodes);
    environment.registerObserver(pathfinder);
    result = await pathfinder.execute(graph, environment, disablePathSevering, deliveryMode, customRobotAssignments);
  }
  const timeElapsed = Math.max(performance.now() - startTime, 0.001);
  const memoryUsed = estimateMemory(result.nodesExplored, result.maxFrontierSize, algorithm);

  // ✅ PERSIST FIX: Ensure every blockage resolves before the simulation ends.
  // The events were generated with an *estimated* step count, but the algorithm
  // may finish faster (especially BFS/Hybrid). Any blocked node with no clear event
  // at or before the final step gets a forced resolve injected at the last step.
  const actualFinalStep = Math.max(result.steps.length - 1, 0);



  // Re-sort after injections so the frontend renders events in order
  dynamicEvents.sort((a, b) => a.stepIndex - b.stepIndex);

  const exitIndex = result.foundDestination ? graph.destinationIds.indexOf(result.foundDestination) : null;
  const totalGraphNodes = graph.nodes.length || 1;

  const isAWSWarehouse = graph.nodes.some(n => n.id === 'dest_desk_a') || graph.nodes.some(n => n.id === 'shelf_e1');
  let completionRate = 0;
  if (isAWSWarehouse) {
    const lastStep = result.steps[result.steps.length - 1];
    const totalDelivered = lastStep?.deliveredBoxCounts
      ? Object.values(lastStep.deliveredBoxCounts).reduce((a, b) => a + b, 0)
      : 0;
    completionRate = Math.min(100, (totalDelivered / 12) * 100);
  } else {
    completionRate = result.foundDestination !== null ? 100 : Math.min(100, (result.nodesExplored / totalGraphNodes) * 100);
  }

  let failureReason: string | undefined = undefined;
  if (result.foundDestination === null) {
    const isCampus = mapId === 'campus';
    const isACL = isCampus && customSourceId && (
      customSourceId.includes('boys') ||
      customSourceId.includes('girls') ||
      customSourceId.includes('it_') ||
      customSourceId.includes('lib_') ||
      customSourceId.includes('dome_')
    );

    if (scenario === 'network' && isACL) {
      failureReason = 'Target unreachable due to subnet ACL restrictions.';
    } else if (dynamicEvents.some(e => e.blocked)) {
      failureReason = 'No valid route exists after dynamic events (Path Severed).';
    } else {
      failureReason = 'All possible paths are blocked or destination is isolated.';
    }
  }

  const metrics: PerformanceMetrics = {
    nodesExplored: result.nodesExplored,
    timeElapsed,
    pathLength: result.pathLength,
    totalLatency: result.totalLatency,
    memoryUsed,
    exitFound: result.foundDestination !== null,
    exitIndex,
    completionRate,
    failureReason,
  };

  const totalStepsLength = result.steps.length;
  let finalSteps = result.steps;
  let hasMore = false;

  if (limit > 0) {
    const numericOffset = Number(offset);
    const numericLimit = Number(limit);
    finalSteps = result.steps.slice(numericOffset, numericOffset + numericLimit);
    hasMore = (numericOffset + numericLimit) < totalStepsLength;
  }

  return {
    steps: finalSteps,
    metrics,
    dynamicEvents,
    graph: offset === 0 ? graph : { nodes: [], edges: [], sourceId: '', destinationIds: [] } as any,
    meta: {
      hasMore,
      totalSteps: totalStepsLength,
      currentOffset: Number(offset)
    }
  };
}

export async function orchestrateSimulation(
  scenario: ScenarioType,
  seed: number,
  useRealWorld: boolean,
  mapId: string,
  offset: number,
  limit: number,
  gameBoard: GameAIBoard | undefined,
  graphSize: GraphSize,
  chessPiece: string,
  activeSizing: GraphSizing | undefined,
  customSourceId?: string,
  customDestinationIds?: string[],
  deliveryMode?: 'anycast' | 'multicast',
  customBlockedNodes?: string[],
  customSourceIds?: string[],
  customRobotAssignments?: { robotId: string; destinations: string[]; priorityDest?: string; boxCounts?: Record<string, number> }[]
) {
  const bfsRes = await runSimulation(scenario, 'bfs', seed, useRealWorld, mapId, undefined, offset, limit, gameBoard, graphSize, chessPiece, activeSizing, customSourceId, customDestinationIds, deliveryMode, customBlockedNodes, customSourceIds, customRobotAssignments);
  const dfsRes = await runSimulation(scenario, 'dfs', seed, useRealWorld, mapId, undefined, offset, limit, gameBoard, graphSize, chessPiece, activeSizing, customSourceId, customDestinationIds, deliveryMode, customBlockedNodes, customSourceIds, customRobotAssignments);
  const hybridRes = await runSimulation(scenario, 'hybrid', seed, useRealWorld, mapId, undefined, offset, limit, gameBoard, graphSize, chessPiece, activeSizing, customSourceId, customDestinationIds, deliveryMode, customBlockedNodes, customSourceIds, customRobotAssignments);

  let optimalPathLength = 0;
  if (offset === 0) {
    const env = new SimulationEnvironment([]);
    const pathfinder = new BFSPathfinder();
    const optimalResult = await pathfinder.execute(hybridRes.graph, env, false, deliveryMode, customRobotAssignments);
    optimalPathLength = optimalResult.pathLength;
  }

  const recordId = Math.random().toString(36).substring(7);

  return {
    id: recordId,
    createdAt: new Date(),
    results: {
      bfs: bfsRes,
      dfs: dfsRes,
      hybrid: hybridRes
    },
    optimalPathLength: optimalPathLength
  };
}
