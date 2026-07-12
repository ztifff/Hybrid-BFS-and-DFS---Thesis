import { ScenarioType, ScenarioGraph, GraphSize, GraphSizing } from '../types/index';
import { buildNetworkGraph, getNetworkFailureCandidates } from './networkGraph';
import { buildRoboticsGraph, getRoboticsBlockCandidates } from './roboticsGraph';
import { buildTrafficGraph, getTrafficClosureCandidates } from './trafficGraph';
import { buildEvacuationGraph, getEvacuationFireCandidates } from './evacuationGraph';
import { buildGameAIGraph, getGameAIEnemyCandidates, GameAIBoard } from './gameAIGraph';

interface GraphFactory {
  buildGraph(
    useRealWorld: boolean,
    gameBoard: GameAIBoard | undefined,
    mode: string | undefined, 
    graphSize: GraphSize,
    seed: number,
    chessPiece: string,
    sizing: GraphSizing | undefined
  ): ScenarioGraph;
  getDynamicCandidates(graph: ScenarioGraph): string[];
}

class RoboticsGraphFactory implements GraphFactory {
  buildGraph(useRealWorld: boolean, gameBoard: any, mode: any, graphSize: GraphSize, seed: number, chessPiece: any, sizing: any) {
    return buildRoboticsGraph(useRealWorld, seed, mode, graphSize, sizing);
  }
  getDynamicCandidates(graph: ScenarioGraph) {
    return getRoboticsBlockCandidates(graph);
  }
}

class EvacuationGraphFactory implements GraphFactory {
  buildGraph(useRealWorld: boolean, gameBoard: any, mode: any, graphSize: GraphSize, seed: number, chessPiece: any, sizing: any) {
    return buildEvacuationGraph(useRealWorld, seed, mode, graphSize, sizing);
  }
  getDynamicCandidates(graph: ScenarioGraph) {
    return getEvacuationFireCandidates(graph);
  }
}

class NetworkGraphFactory implements GraphFactory {
  buildGraph(useRealWorld: boolean, gameBoard: any, mode: any, graphSize: GraphSize, seed: number, chessPiece: any, sizing: any) {
    return buildNetworkGraph(useRealWorld, seed, mode, graphSize, sizing);
  }
  getDynamicCandidates(graph: ScenarioGraph) {
    return getNetworkFailureCandidates(graph);
  }
}

class TrafficGraphFactory implements GraphFactory {
  buildGraph(useRealWorld: boolean, gameBoard: any, mode: any, graphSize: GraphSize, seed: number, chessPiece: any, sizing: any) {
    return buildTrafficGraph(useRealWorld, graphSize, seed, mode, sizing);
  }
  getDynamicCandidates(graph: ScenarioGraph) {
    return getTrafficClosureCandidates(graph);
  }
}

class GameAIGraphFactory implements GraphFactory {
  buildGraph(useRealWorld: boolean, gameBoard: GameAIBoard | undefined, mode: any, graphSize: GraphSize, seed: number, chessPiece: string, sizing: any) {
    return buildGameAIGraph(gameBoard, graphSize, chessPiece, seed, sizing);
  }
  getDynamicCandidates(graph: ScenarioGraph) {
    return getGameAIEnemyCandidates(graph);
  }
}

const factoryRegistry: Record<ScenarioType, GraphFactory> = {
  robotics: new RoboticsGraphFactory(),
  evacuation: new EvacuationGraphFactory(),
  network: new NetworkGraphFactory(),
  traffic: new TrafficGraphFactory(),
  gameai: new GameAIGraphFactory(),
};

export function buildScenarioGraph(
  scenario: ScenarioType,
  useRealWorld: boolean = false,
  gameBoard?: GameAIBoard,
  mapId?: string, 
  graphSize: GraphSize = 'medium',
  seed: number = 123,
  chessPiece: string = 'knight',
  sizing?: GraphSizing
): ScenarioGraph {
  const factory = factoryRegistry[scenario];
  if (!factory) throw new Error(`Unknown scenario: ${scenario}`);
  return factory.buildGraph(useRealWorld, gameBoard, mapId, graphSize, seed, chessPiece, sizing);
}

export function getDynamicCandidates(graph: ScenarioGraph, scenario: ScenarioType): string[] {
  const factory = factoryRegistry[scenario];
  if (!factory) throw new Error(`Unknown scenario: ${scenario}`);
  return factory.getDynamicCandidates(graph);
}
