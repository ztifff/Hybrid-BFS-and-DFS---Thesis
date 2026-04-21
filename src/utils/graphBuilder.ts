import { ScenarioType, ScenarioGraph } from '../types';
import { buildNetworkGraph, getNetworkFailureCandidates } from './networkGraph';
import { buildRoboticsGraph, getRoboticsBlockCandidates } from './roboticsGraph';
import { buildTrafficGraph, getTrafficClosureCandidates } from './trafficGraph';
import { buildEvacuationGraph, getEvacuationFireCandidates } from './evacuationGraph';
import { buildGameAIGraph, getGameAIEnemyCandidates } from './gameAIGraph';

// Added useRealWorld parameter with a default of false
export function buildScenarioGraph(scenario: ScenarioType, useRealWorld: boolean = false): ScenarioGraph {
  switch (scenario) {
    case 'network':    return buildNetworkGraph();
    case 'robotics':   return buildRoboticsGraph();
    case 'traffic':    return buildTrafficGraph(useRealWorld); // Passed to traffic
    case 'evacuation': return buildEvacuationGraph();
    case 'gameai':     return buildGameAIGraph();
  }
}

// Kept your original dynamic candidates function untouched
export function getDynamicCandidates(
  graph: ScenarioGraph,
  scenario: ScenarioType
): string[] {
  switch (scenario) {
    case 'network':    return getNetworkFailureCandidates(graph);
    case 'robotics':   return getRoboticsBlockCandidates(graph);
    case 'traffic':    return getTrafficClosureCandidates(graph);
    case 'evacuation': return getEvacuationFireCandidates(graph);
    case 'gameai':     return getGameAIEnemyCandidates(graph);
  }
}