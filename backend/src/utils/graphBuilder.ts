import { ScenarioType, ScenarioGraph, GraphSize } from '../types/index';
import { buildNetworkGraph, getNetworkFailureCandidates } from './networkGraph';
import { buildRoboticsGraph, getRoboticsBlockCandidates } from './roboticsGraph';
import { buildTrafficGraph, getTrafficClosureCandidates } from './trafficGraph';
import { buildEvacuationGraph, getEvacuationFireCandidates } from './evacuationGraph';
import { buildGameAIGraph, getGameAIEnemyCandidates, GameAIBoard } from './gameAIGraph';

export function buildScenarioGraph(
  scenario: ScenarioType,
  useRealWorld: boolean = false,
  gameBoard?: GameAIBoard,
  networkMode?: 'datacenter' | 'as733' | 'synthetic',
  graphSize: GraphSize = 'medium',
  seed: number = 123
): ScenarioGraph {
  switch (scenario) {
    case 'robotics':
      return buildRoboticsGraph(useRealWorld, seed, graphSize); 
    case 'evacuation':
      return buildEvacuationGraph(useRealWorld, seed, graphSize); 
    case 'network':
      return buildNetworkGraph(useRealWorld, seed, networkMode, graphSize); 
    case 'traffic':
      return buildTrafficGraph(useRealWorld, graphSize); 
    case 'gameai':
      return buildGameAIGraph(gameBoard, graphSize);
    default:
      throw new Error(`Unknown scenario: ${scenario}`);
  }
}

export function getDynamicCandidates(graph: ScenarioGraph, scenario: ScenarioType): string[] {
  switch (scenario) {
    case 'network':    return getNetworkFailureCandidates(graph);
    case 'robotics':   return getRoboticsBlockCandidates(graph);
    case 'traffic':    return getTrafficClosureCandidates(graph);
    case 'evacuation': return getEvacuationFireCandidates(graph);
    case 'gameai':     return getGameAIEnemyCandidates(graph);
  }
}
