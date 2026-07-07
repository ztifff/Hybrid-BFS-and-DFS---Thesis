import { AlgorithmType, ScenarioType, AlgorithmStep, PerformanceMetrics, DynamicEvent, SimulationResult, ScenarioGraph, GraphSize, GraphSizing } from '../types';
import { buildScenarioGraph, getDynamicCandidates } from './graphBuilder';
import { runGraphBFS } from '../algorithms/bfs';
import { runGraphDFS } from '../algorithms/dfs';
import { runGraphHybrid } from '../algorithms/hybrid';
import { GameAIBoard } from './gameAIGraph';

export type { SimulationResult };

function estimateMemory(nodesExplored: number, maxFrontierSize: number, algorithm: AlgorithmType): number {
  const nodeBytes = 80;
  const visitedMemory = nodesExplored * nodeBytes;
  const frontierMemory = maxFrontierSize * nodeBytes;
  const multiplier = algorithm === 'hybrid' ? 1.2 : algorithm === 'bfs' ? 1.0 : 1.0;
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
      standardLabels = [{ block: '🔥 Fire Outbreak', clear: '✅ Fire Extinguished' }, { block: '🚪 Exit Blocked', clear: '🚪 Exit Cleared' }];
      aoeLabels = [{ block: '🔥 Fire Spreads Rapidly', clear: '✅ Fire Contained' }, { block: '💨 Smoke Fills Corridor', clear: '✅ Ventilation Restored' }];
      break;
    case 'gameai':
      standardLabels = [{ block: '♟️ Opponent Piece Deployed', clear: '✅ Opponent Retreats' }, { block: '🎯 Opponent Attacks', clear: '♟️ Opponent Moves Away' }];
      aoeLabels = [{ block: '[Act] 💥 Opponent Formation', clear: '✅ Formation Breaks' }];
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

    const hazardDuration = Math.max(15, Math.floor(totalSteps * 0.30));
    const reopenStep = stepIndex + hazardDuration;

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
      const nodeName = node?.label?.split('\n')[0] ?? nodeId;

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
  networkMode: 'datacenter' | 'as733' | 'synthetic' | 'aws' | 'clinic' = 'synthetic',
  onStepProgress?: (step: AlgorithmStep) => void,
  offset: number = 0,
  limit: number = 0,
  gameBoard?: GameAIBoard,
  graphSize: GraphSize = 'medium',
  chessPiece: string = 'knight',
  sizing?: GraphSizing,
): Promise<SimulationResult & { meta?: { hasMore: boolean; totalSteps: number; currentOffset: number } }> {
  
  const graph = buildScenarioGraph(scenario, useRealWorld, gameBoard, networkMode, graphSize, dynamicSeed, chessPiece, sizing);

  let result: {
    steps: AlgorithmStep[];
    nodesExplored: number;
    pathLength: number;
    totalLatency: number;
    foundDestination: string | null;
    maxFrontierSize: number;
  };

  const blockedNodes = new Set<string>();
  const estimatedSteps = Math.max(50, Math.floor(graph.nodes.length * 1.5));
  const dynamicEvents = generateDynamicEvents(graph, scenario, estimatedSteps, dynamicSeed, gameBoard);

  dynamicEvents.forEach(event => {
    if (event.stepIndex === 0 && event.blocked) {
      blockedNodes.add(event.nodeId);
    }
  });

  let currentFrame = 1;

  const wrappedStepProgress = (step: AlgorithmStep) => {
    dynamicEvents.forEach(event => {
      if (event.stepIndex > 0 && event.stepIndex === currentFrame) {
        if (event.blocked) blockedNodes.add(event.nodeId);
        else blockedNodes.delete(event.nodeId);
      }
    });
    currentFrame++; 
    onStepProgress?.(step);
  };

  const startTime = performance.now();
  if (algorithm === 'bfs') {
    result = await runGraphBFS(graph, blockedNodes, wrappedStepProgress);
  } else if (algorithm === 'dfs') {
    result = await runGraphDFS(graph, blockedNodes, wrappedStepProgress);
  } else {
    result = await runGraphHybrid(graph, blockedNodes, wrappedStepProgress);
  }
  const timeElapsed = Math.max(performance.now() - startTime, 0.001);
  const memoryUsed = estimateMemory(result.nodesExplored, result.maxFrontierSize, algorithm);

  const exitIndex = result.foundDestination ? graph.destinationIds.indexOf(result.foundDestination) : null;
  const totalGraphNodes = graph.nodes.length || 1;
  const completionRate = Math.min(100, (result.nodesExplored / totalGraphNodes) * 100);

  const metrics: PerformanceMetrics = {
    nodesExplored: result.nodesExplored,
    timeElapsed,
    pathLength: result.pathLength,
    totalLatency: result.totalLatency,
    memoryUsed,
    exitFound: result.foundDestination !== null,
    exitIndex,
    completionRate, 
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
