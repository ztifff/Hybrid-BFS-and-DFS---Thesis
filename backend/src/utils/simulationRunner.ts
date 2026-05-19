import { AlgorithmType, ScenarioType, AlgorithmStep, PerformanceMetrics, DynamicEvent, SimulationResult, ScenarioGraph } from '../types/index';
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

// ✅ Deterministic RNG seeded from the given seed only
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223;
    return ((s >>> 0) / 4294967296);
  };
}

// 🔥 APOCALYPTIC EDITION: Scaled Durations, Massive AoE, & Scenario-Aware Events
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

  // Build Adjacency List for AoE disasters
  const adj = new Map<string, string[]>();
  graph.edges.forEach(e => {
    if (!adj.has(e.from)) adj.set(e.from, []);
    if (!adj.has(e.to)) adj.set(e.to, []);
    adj.get(e.from)!.push(e.to);
    adj.get(e.to)!.push(e.from); 
  });

  const isMassive = graph.nodes.length > 200;
  const maxIncidents = isMassive ? 16 : 6;
  const incidentCount = Math.min(maxIncidents, Math.max(2, Math.floor(candidates.length * 0.08)));

  // ✅ THE FIX: Scenario-Specific Event Labels
  let standardLabels: { block: string, clear: string }[] = [];
  let aoeLabels: { block: string, clear: string }[] = [];

  switch (scenario) {
    case 'robotics':
      standardLabels = [
        { block: '📦 Pallet Spill', clear: '🧹 Aisle Cleared' },
        { block: '🛑 Forklift Maintenance', clear: '✅ Maintenance Complete' },
        { block: '🤖 Robot Malfunction', clear: '🔧 Robot Repaired' },
        { block: '🚧 Shelf Restocking', clear: '✅ Restocking Finished' }
      ];
      aoeLabels = [
        { block: '⚠️ Massive Rack Collapse', clear: '🏗️ Rack Rebuilt' },
        { block: '🛑 Zone-wide Power Outage', clear: '⚡ Power Restored' },
        { block: '⚠️ Hazardous Material Spill', clear: '🧹 Hazmat Cleared' },
        { block: '🚧 Major Conveyor Jam', clear: '🟢 Conveyor Running' }
      ];
      break;
    case 'evacuation':
      standardLabels = [
        { block: '🔥 Localized Fire', clear: '🧯 Fire Extinguished' },
        { block: '🧱 Falling Debris', clear: '🧹 Debris Cleared' },
        { block: '💨 Heavy Smoke', clear: '💨 Smoke Cleared' },
        { block: '🚪 Door Jammed', clear: '🚪 Door Forced Open' }
      ];
      aoeLabels = [
        { block: '🔥 Massive Fire Outbreak', clear: '🧯 Outbreak Contained' },
        { block: '💥 Structural Collapse', clear: '🚧 Alternate Route Secured' },
        { block: '⚠️ Floor Caved In', clear: '🌉 Temporary Bridge Set' },
        { block: '💨 Toxic Gas Leak', clear: '💨 Ventilation Restored' }
      ];
      break;
    case 'network':
      standardLabels = [
        { block: '🔌 Cable Unplugged', clear: '🔌 Cable Reconnected' },
        { block: '🔥 Overheating Switch', clear: '❄️ Cooling Restored' },
        { block: '🛑 BGP Route Flap', clear: '✅ Route Stabilized' },
        { block: '💾 Drive Failure', clear: '🔄 Array Rebuilt' }
      ];
      aoeLabels = [
        { block: '⚡ Rack Power Loss', clear: '⚡ Power Restored' },
        { block: '🌐 Massive DDoS Attack', clear: '🛡️ Attack Mitigated' },
        { block: '💥 Main Core Switch Failure', clear: '🔄 Core Rerouted' },
        { block: '🌊 Cooling System Leak', clear: '🛠️ Leak Patched' }
      ];
      break;
    case 'traffic':
    default:
      standardLabels = [
        { block: '💥 Minor Collision', clear: '🚓 Accident Cleared' },
        { block: '🚧 Roadwork', clear: '✅ Roadwork Finished' },
        { block: '🛑 Police Checkpoint', clear: '✅ Checkpoint Removed' },
        { block: '🚗 Stalled Vehicle', clear: 'Tow Truck Arrived' }
      ];
      aoeLabels = [
        { block: '💥 Multi-Vehicle Pileup', clear: '🚓 Pileup Cleared' },
        { block: '🚌 Major Bus Collision', clear: '🏗️ Bus Towed Away' },
        { block: '🏗️ Bridge/Road Collapse', clear: '🚧 Temporary Bypass Opened' },
        { block: '🚛 Overturned Semi-Truck', clear: '🏗️ Truck Removed' },
        { block: '🚦 Total Gridlock', clear: '🟢 Traffic Flowing' }
      ];
      break;
  }

  const eventWindow = Math.max(5, Math.floor(totalSteps * 0.25));
  const maxAoE = isMassive ? 10 : 4;

  for (let i = 0; i < incidentCount; i++) {
    const epicenterId = candidates[Math.floor(rng() * candidates.length)];
    if (usedNodes.has(epicenterId)) continue;

    const stepIndex = 1 + Math.floor(rng() * eventWindow);
    const reopenStep = Math.min(totalSteps, stepIndex + Math.max(4, Math.floor(totalSteps * 0.18)));

    const isAoE = isMassive && rng() > 0.7;
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
            if (!expandedSet.has(neighbor) && neighbor !== epicenterId) {
              expandedSet.add(neighbor);
              nextFrontier.push(neighbor);
            }
          }
        }
        currentFrontier = nextFrontier;
      }

      const collateral = Array.from(expandedSet).sort(() => rng() - 0.5).slice(0, maxAoE);
      affectedNodes.push(...collateral);
    }

    affectedNodes.forEach(nodeId => {
      if (usedNodes.has(nodeId)) return;
      usedNodes.add(nodeId);

      const node = graph.nodes.find(n => n.id === nodeId);
      const nodeName = node?.label?.split('\n')[0] ?? nodeId;

      const blockLabel = isAoE ? `[AoE] ${flavor.block} at ${nodeName}` : `${flavor.block} at ${nodeName}`;
      const clearLabel = isAoE ? `[AoE] ${flavor.clear} at ${nodeName}` : `${flavor.clear} at ${nodeName}`;

      events.push({
        stepIndex,
        nodeId,
        blocked: true,
        label: blockLabel,
      });

      // Even massive blockages will eventually clear
      events.push({
        stepIndex: reopenStep,
        nodeId,
        blocked: false,
        label: clearLabel,
      });
    });
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