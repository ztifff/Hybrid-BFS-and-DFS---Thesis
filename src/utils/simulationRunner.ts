import { AlgorithmType, ScenarioType, AlgorithmStep, PerformanceMetrics, DynamicEvent, SimulationResult, ScenarioGraph } from '../types';
import { buildScenarioGraph, getDynamicCandidates } from './graphBuilder';
import { runGraphBFS } from '../algorithms/bfs';
import { runGraphDFS } from '../algorithms/dfs';
import { runGraphHybrid } from '../algorithms/hybrid';

export type { SimulationResult };

function estimateMemory(nodesExplored: number, algorithm: AlgorithmType): number {
  const nodeBytes = 80;
  const multiplier = algorithm === 'hybrid' ? 2.2 : algorithm === 'bfs' ? 1.5 : 1.2;
  return (nodesExplored * nodeBytes * multiplier) / 1024;
}

// ✅ Improved RNG (true variability every run)
function makeRng(seed: number) {
  let s = seed ^ Date.now();
  return () => {
    s = Math.imul(1664525, s) + 1013904223;
    return ((s >>> 0) / 4294967296);
  };
}

// 🔥 EXTREME Chaos Dynamic Events
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

  const isMassive = graph.nodes.length > 200;
  
  // 💥 Cranked up to 80 maximum events for real-world maps
  const maxEvents = isMassive ? 80 : 12; 
  const eventCount = Math.min(maxEvents, Math.floor(candidates.length * 0.4));

  const realWorldLabels = [
    { block: '💥 Major Collision', clear: '🚓 Accident Cleared' },
    { block: '🚧 Roadwork', clear: '✅ Roadwork Finished' },
    { block: '🌊 Flash Flood', clear: '🌤️ Flood Subsided' },
    { block: '🚦 Severe Gridlock', clear: '🟢 Traffic Flowing' },
    { block: '🔥 Vehicle Fire', clear: '🚒 Fire Extinguished' },
    { block: '🛑 Police Checkpoint', clear: '✅ Checkpoint Removed' }
  ];

  for (let i = 0; i < eventCount; i++) {
    const nodeId = candidates[Math.floor(rng() * candidates.length)];
    if (usedNodes.has(nodeId)) continue;
    usedNodes.add(nodeId);

    const node = graph.nodes.find(n => n.id === nodeId);
    const nodeName = node?.label?.split('\n')[0] ?? nodeId;

    // 20% chance it's already closed before we start (Step 0)
    // 80% chance it spawns randomly while driving (spread across the first 80% of the trip)
    let stepIndex = 0;
    if (rng() > 0.20) {
      stepIndex = Math.floor(rng() * (totalSteps * 0.8)) + 1; 
    }

    let blockLabel = `🚧 ${nodeName} closed`;
    let clearLabel = `✅ ${nodeName} reopened`;
    
    if (isMassive) {
      const flavor = realWorldLabels[Math.floor(rng() * realWorldLabels.length)];
      blockLabel = `${flavor.block} at ${nodeName}`;
      clearLabel = `${flavor.clear} at ${nodeName}`;
    }

    events.push({
      stepIndex,
      nodeId,
      blocked: true,
      label: blockLabel,
    });

    // 🌪️ High Volatility: 75% chance the road clears up later in the simulation
    if (rng() > 0.25) {
      // Reopens rapidly (between 5 and 30 steps later) to create a "breathing" map
      const reopenStep = stepIndex + Math.floor(rng() * 25) + 5; 
      if (reopenStep < totalSteps * 1.5) { 
        events.push({
          stepIndex: reopenStep,
          nodeId,
          blocked: false,
          label: clearLabel,
        });
      }
    }
  }

  return events.sort((a, b) => a.stepIndex - b.stepIndex);
}

export async function runSimulation(
  scenario: ScenarioType,
  algorithm: AlgorithmType,
  dynamicSeed: number = Date.now(), 
  useRealWorld: boolean = false,
  onStepProgress?: (step: AlgorithmStep) => void
): Promise<SimulationResult> {

  const graph = buildScenarioGraph(scenario, useRealWorld);
  const startTime = performance.now();

  let result: {
    steps: AlgorithmStep[];
    nodesExplored: number;
    pathLength: number;
    totalLatency: number;
    foundDestination: string | null;
  };

  const blockedNodes = new Set<string>();

  const estimatedSteps = Math.max(20, Math.floor(graph.nodes.length / 1.5));
  const dynamicEvents = generateDynamicEvents(graph, scenario, estimatedSteps, dynamicSeed);

  // Apply "Step 0" Pre-existing closures immediately
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

  const exitIndex = result.foundDestination
    ? graph.destinationIds.indexOf(result.foundDestination)
    : null;

  const metrics: PerformanceMetrics = {
    nodesExplored: result.nodesExplored,
    timeElapsed,
    pathLength: result.pathLength,
    totalLatency: result.totalLatency,
    memoryUsed,
    exitFound: result.foundDestination !== null,
    exitIndex,
  };

  return {
    steps: result.steps,
    metrics,
    dynamicEvents,
    graph,
  };
}