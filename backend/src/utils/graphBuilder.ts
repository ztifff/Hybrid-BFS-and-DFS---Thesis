import { ScenarioType, ScenarioGraph } from '../types/index';
import { buildNetworkGraph, getNetworkFailureCandidates } from './networkGraph';
import { buildRoboticsGraph, getRoboticsBlockCandidates } from './roboticsGraph';
import { buildTrafficGraph, getTrafficClosureCandidates } from './trafficGraph';
import { buildEvacuationGraph, getEvacuationFireCandidates } from './evacuationGraph';
import { buildGameAIGraph, getGameAIEnemyCandidates } from './gameAIGraph';

export function buildScenarioGraph(scenario: ScenarioType, useRealWorld: boolean = false): ScenarioGraph {
  switch (scenario) {
    case 'network':    return buildNetworkGraph(useRealWorld);
    case 'robotics':   return buildRoboticsGraph(useRealWorld); 
    case 'traffic':    return buildTrafficGraph(useRealWorld); 
    case 'evacuation': return buildEvacuationGraph(useRealWorld);
    case 'gameai':     return buildGameAIGraph(useRealWorld); 
  }
}

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