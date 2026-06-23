import { AlgorithmType, ScenarioType, AlgorithmStep, PerformanceMetrics, DynamicEvent, SimulationResult, ScenarioGraph, GraphSize } from '../types';
import { buildScenarioGraph, getDynamicCandidates } from './graphBuilder';
import { runGraphBFS } from '../algorithms/bfs';
import { runGraphDFS } from '../algorithms/dfs';
import { runGraphHybrid } from '../algorithms/hybrid';
import { GameAIBoard } from './gameAIGraph';

export type { SimulationResult };

function estimateMemory(nodesExplored: number, algorithm: AlgorithmType): number {
  const nodeBytes = 80;
  const multiplier = algorithm === 'hybrid' ? 2.2 : algorithm === 'bfs' ? 1.5 : 1.2;
  return (nodesExplored * nodeBytes * multiplier) / 1024;
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
  seed: number
): DynamicEvent[] {
  if (totalSteps < 5) return [];
  const candidates = getDynamicCandidates(graph, scenario);
  if (candidates.length === 0) return [];

  const rng = makeRng(seed);
  const events: DynamicEvent[] = [];
  const usedNodes = new Set<string>();

  const adj = new Map<string, string[]>();
  graph.edges.forEach(e => {
    if (!adj.has(e.from)) adj.set(e.from, []);
    if (!adj.has(e.to)) adj.set(e.to, []);
    adj.get(e.from)!.push(e.to);
    adj.get(e.to)!.push(e.from); 
  });

  // 🛡️ NEW FIX: Establish a "Safe Zone" around the Start and Exits
  const protectedNodes = new Set<string>();
  protectedNodes.add(graph.sourceId);
  graph.destinationIds.forEach(id => protectedNodes.add(id));

  // Expand the Safe Zone by 2 hops to ensure the algorithms have room to breathe
  let currentProtected = Array.from(protectedNodes);
  for (let depth = 0; depth < 2; depth++) {
    const nextProtected: string[] = [];
    for (const p of currentProtected) {
      const neighbors = adj.get(p) || [];
      for (const n of neighbors) {
        if (!protectedNodes.has(n)) {
          protectedNodes.add(n);
          nextProtected.push(n);
        }
      }
    }
    currentProtected = nextProtected;
  }

  const isMassive = graph.nodes.length > 200;
  const isGameAI = scenario === 'gameai';
  const maxIncidents = isGameAI ? 6 : (isMassive ? 30 : 5);
  const incidentDensity = isGameAI ? 0.10 : 0.5;
  const minIncidents = isGameAI ? 3 : 1;
  const incidentCount = Math.min(
    maxIncidents,
    Math.max(minIncidents, Math.floor(candidates.length * incidentDensity))
  );

  let standardLabels: { block: string, clear: string }[] = [];
  let aoeLabels: { block: string, clear: string }[] = [];

  switch (scenario) {
    case 'robotics':
      standardLabels = [
        { block: '📦 Pallet Spill', clear: '🧹 Aisle Cleared' },
        { block: '🛑 Forklift Maintenance', clear: '✅ Maintenance Complete' },
        { block: '🤖 Robot Malfunction', clear: '🔧 Robot Repaired' }
      ];
      aoeLabels = [
        { block: '⚠️ Massive Rack Collapse', clear: '🏗️ Rack Rebuilt' },
        { block: '🛑 Zone-wide Power Outage', clear: '⚡ Power Restored' }
      ];
      break;
    case 'evacuation':
      standardLabels = [
        { block: '🔥 Localized Fire', clear: '🧯 Fire Extinguished' },
        { block: '🧱 Falling Debris', clear: '🧹 Debris Cleared' }
      ];
      aoeLabels = [
        { block: '🔥 Massive Fire Outbreak', clear: '🧯 Outbreak Contained' },
        { block: '💥 Structural Collapse', clear: '🚧 Alternate Route Secured' }
      ];
      break;
    case 'network':
      standardLabels = [
        { block: '🔌 Cable Unplugged', clear: '🔌 Cable Reconnected' },
        { block: '🔥 Overheating Switch', clear: '❄️ Cooling Restored' }
      ];
      aoeLabels = [
        { block: '⚡ Rack Power Loss', clear: '⚡ Power Restored' },
        { block: '🌐 Massive DDoS Attack', clear: '🛡️ Attack Mitigated' }
      ];
      break;
    case 'gameai':
      standardLabels = [
        { block: '♟️ Opponent Piece Blocks', clear: '✅ Piece Captured' },
        { block: '🎲 Rule Lock Freezes', clear: '🔓 Rule Lock Released' },
        { block: '⏱️ Turn Timer Blocks', clear: '▶️ Turn Resumed' }
      ];
      aoeLabels = [
        { block: '♜ Board Control Trap', clear: '♞ Tactical Escape Found' },
        { block: '🎲 Forced Reroll Zone', clear: '✅ Board State Stabilized' }
      ];
      break;
    case 'traffic':
    default:
      standardLabels = [
        { block: '💥 Minor Collision', clear: '🚓 Accident Cleared' },
        { block: '🚧 Roadwork', clear: '✅ Roadwork Finished' }
      ];
      aoeLabels = [
        { block: '💥 Multi-Vehicle Pileup', clear: '🚓 Pileup Cleared' },
        { block: '🚧 Major Road Collapse', clear: '🚧 Temporary Bypass Opened' }
      ];
      break;
  }

  for (let i = 0; i < incidentCount; i++) {
    const epicenterId = candidates[Math.floor(rng() * candidates.length)];
    
    // 🚨 Prevent traps from spawning in the Safe Zone
    if (usedNodes.has(epicenterId) || protectedNodes.has(epicenterId)) continue;
    
    // 🧠 FIXED: Front-load spawns to the first 15% of total steps (min 3 steps for tiny maps)
    const maxSpawnWindow = scenario === 'gameai'
      ? Math.max(3, Math.floor(totalSteps * 0.10))
      : Math.max(3, Math.floor(totalSteps * 0.15));
    const stepIndex = Math.floor(rng() * maxSpawnWindow); 

    // 🧠 FIXED: Clear hazards after a proportional duration (min 15 steps) so logs show closures and openings
    const hazardDuration = scenario === 'gameai'
      ? Math.max(6, Math.floor(totalSteps * 0.08))
      : Math.max(15, Math.floor(totalSteps * 0.30));
    const reopenStep = stepIndex + hazardDuration;

    const isAoE = isMassive && rng() > 0.55;
    let affectedNodes = [epicenterId];
    let flavor = standardLabels[Math.floor(rng() * standardLabels.length)];

    if (isAoE) {
      flavor = aoeLabels[Math.floor(rng() * aoeLabels.length)];
      const expandedSet = new Set<string>();
      let currentFrontier = [epicenterId];

      for (let depth = 0; depth < 3; depth++) {
        const nextFrontier: string[] = [];
        for (const current of currentFrontier) {
          const neighbors = adj.get(current) || [];
          for (const neighbor of neighbors) {
            // 🚨 Prevent AoE blast radius from bleeding into the Safe Zone
            if (!expandedSet.has(neighbor) && neighbor !== epicenterId && !protectedNodes.has(neighbor)) {
              expandedSet.add(neighbor);
              nextFrontier.push(neighbor);
            }
          }
        }
        currentFrontier = nextFrontier;
      }
      const collateral = Array.from(expandedSet).sort(() => rng() - 0.5).slice(0, 25);
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

  return events.sort((a, b) => a.stepIndex - b.stepIndex);
}

// 🚨 UPDATED SIGNATURE: Added offset and limit parameters with defaults
export async function runSimulation(
  scenario: ScenarioType,
  algorithm: AlgorithmType,
  dynamicSeed: number = Date.now(),
  useRealWorld: boolean = false,
  networkMode: 'datacenter' | 'as733' | 'synthetic' = 'synthetic',
  onStepProgress?: (step: AlgorithmStep) => void,
  offset: number = 0,
  limit: number = 0,
  gameBoard?: GameAIBoard,
  graphSize: GraphSize = 'medium',
): Promise<SimulationResult & { meta?: { hasMore: boolean; totalSteps: number; currentOffset: number } }> {
  
  // Build the scenario graph
  const graph = buildScenarioGraph(scenario, useRealWorld, gameBoard, networkMode, graphSize);
  const startTime = performance.now();

  let result: {
    steps: AlgorithmStep[];
    nodesExplored: number;
    pathLength: number;
    totalLatency: number;
    foundDestination: string | null;
  };

  const blockedNodes = new Set<string>();
  const estimatedSteps = Math.max(50, Math.floor(graph.nodes.length * 1.5));
  const dynamicEvents = generateDynamicEvents(graph, scenario, estimatedSteps, dynamicSeed);

  dynamicEvents.forEach(event => {
    if (event.stepIndex === 0 && event.blocked) {
      blockedNodes.add(event.nodeId);
    }
  });

  const wrappedStepProgress = (step: AlgorithmStep) => {
    dynamicEvents.forEach(event => {
      if (event.stepIndex > 0 && event.stepIndex === step.stepIndex) {
        if (event.blocked) blockedNodes.add(event.nodeId);
        else blockedNodes.delete(event.nodeId);
      }
    });
    onStepProgress?.(step);
  };

  if (algorithm === 'bfs') {
    result = await runGraphBFS(graph, blockedNodes, wrappedStepProgress);
  } else if (algorithm === 'dfs') {
    result = await runGraphDFS(graph, blockedNodes, wrappedStepProgress);
  } else {
    result = await runGraphHybrid(graph, blockedNodes, wrappedStepProgress);
  }

  const endTime = performance.now();
  const timeElapsed = Math.max(endTime - startTime, 0.001);
  const memoryUsed = estimateMemory(result.nodesExplored, algorithm);

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

  // --------------------------------------------------------
  // 🚀 CHUNKING & PAGINATION LOGIC
  // --------------------------------------------------------
  const totalStepsLength = result.steps.length;
  let finalSteps = result.steps;
  let hasMore = false;

  // If a limit is provided, slice the array
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
    // 🧠 MASSIVE OPTIMIZATION: Only send the huge Graph object on the very first chunk.
    // For offset > 0, send an empty graph to save Vercel payload size limits.
    graph: offset === 0 ? graph : { nodes: [], edges: [], sourceId: '', destinationIds: [] } as any,
    meta: {
      hasMore,
      totalSteps: totalStepsLength,
      currentOffset: Number(offset)
    }
  };
}
