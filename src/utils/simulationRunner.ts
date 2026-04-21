import { AlgorithmType, ScenarioType, AlgorithmStep, PerformanceMetrics, DynamicEvent, SimulationResult, ScenarioGraph } from '../types';

export type { SimulationResult };
import { buildScenarioGraph, getDynamicCandidates } from './graphBuilder';
import { runGraphBFS } from '../algorithms/bfs';
import { runGraphDFS } from '../algorithms/dfs';
import { runGraphHybrid } from '../algorithms/hybrid';

function estimateMemory(nodesExplored: number, algorithm: AlgorithmType): number {
  const nodeBytes = 80;
  const multiplier = algorithm === 'hybrid' ? 2.2 : algorithm === 'bfs' ? 1.5 : 1.2;
  return (nodesExplored * nodeBytes * multiplier) / 1024;
}

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateDynamicEvents(
  graph: ScenarioGraph,
  scenario: ScenarioType,
  totalSteps: number,
  seed: number
): DynamicEvent[] {
  if (totalSteps < 8) return [];
  const candidates = getDynamicCandidates(graph, scenario);
  if (candidates.length === 0) return [];

  const rng = makeRng(seed);
  const events: DynamicEvent[] = [];
  const eventCount = Math.min(4, Math.floor(candidates.length / 3));
  const usedNodes = new Set<string>();

  for (let i = 0; i < eventCount; i++) {
    const stepIndex = Math.floor(rng() * (totalSteps * 0.65)) + Math.floor(totalSteps * 0.1);
    const candidateIdx = Math.floor(rng() * candidates.length);
    const nodeId = candidates[candidateIdx];

    if (!usedNodes.has(nodeId)) {
      usedNodes.add(nodeId);
      const node = graph.nodes.find((n) => n.id === nodeId);
      events.push({
        stepIndex,
        nodeId,
        blocked: true,
        label: `${node?.label ?? nodeId} failed`,
      });

      if (rng() > 0.45) {
        const clearStep = stepIndex + Math.floor(rng() * (totalSteps * 0.2)) + 8;
        if (clearStep < totalSteps) {
          events.push({
            stepIndex: clearStep,
            nodeId,
            blocked: false,
            label: `${node?.label ?? nodeId} restored`,
          });
        }
      }
    }
  }

  return events.sort((a, b) => a.stepIndex - b.stepIndex);
}

export function runSimulation(
  scenario: ScenarioType,
  algorithm: AlgorithmType,
  dynamicSeed: number = 42,
  useRealWorld: boolean = false // <-- Added parameter
): SimulationResult {
  // Pass the flag to your graph builder
  const graph = buildScenarioGraph(scenario, useRealWorld); 

  const startTime = performance.now();

  let result: {
    steps: AlgorithmStep[];
    nodesExplored: number;
    pathLength: number;
    totalLatency: number;
    foundDestination: string | null;
  };

  if (algorithm === 'bfs') {
    result = runGraphBFS(graph);
  } else if (algorithm === 'dfs') {
    result = runGraphDFS(graph);
  } else {
    result = runGraphHybrid(graph);
  }

  const endTime = performance.now();
  const timeElapsed = Math.max(endTime - startTime, 0.001);

  const dynamicEvents = generateDynamicEvents(graph, scenario, result.steps.length, dynamicSeed);
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