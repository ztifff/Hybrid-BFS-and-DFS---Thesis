import { Request, Response } from 'express';
import { buildScenarioGraph } from '../utils/graphBuilder';
import { ScenarioType, GraphSize } from '../types';
import { GameAIBoard } from '../utils/gameAIGraph';
import { parseGraphSizing } from '../utils/graphSizing';

export const getGraphData = (req: Request, res: Response) => {
  try {
    const scenario = req.query.scenario as ScenarioType;
    const mapId = (req.query.mapId as string) || 'synthetic';
    const useRealWorld = scenario !== 'gameai' && mapId !== 'synthetic';
    const mode = mapId;
    const gameBoard = req.query.gameBoard as GameAIBoard | undefined;
    const graphSize = (req.query.graphSize as GraphSize) || 'medium';
    const sizing = useRealWorld
      ? undefined
      : parseGraphSizing(req.query.targetNodes || req.query.nodes, req.query.targetEdges || req.query.edges);
    // 1. Extract the seed from the frontend request (fallback to Date.now() if missing)
    const seed = req.query.seed ? parseInt(req.query.seed as string, 10) : Date.now();
    const chessPiece = (req.query.chessPiece as string) || 'knight';

    if (!scenario) {
      return res.status(400).json({ error: 'Scenario type is required.' });
    }

    const customSourceId = req.query.customSourceId as string | undefined;
    const customSourceIdsStr = req.query.customSourceIds as string | undefined;
    const customSourceIds = customSourceIdsStr ? JSON.parse(customSourceIdsStr) : undefined;
    const customDestinationIdsStr = req.query.customDestinationIds as string | undefined;
    const customDestinationIds = customDestinationIdsStr ? JSON.parse(customDestinationIdsStr) : undefined;

    // 2. Pass the seed into the builder as the 6th parameter
    const graph = buildScenarioGraph(scenario, useRealWorld, gameBoard, mode, graphSize, seed, chessPiece, sizing);

    if (customSourceId) graph.sourceId = customSourceId;
    if (customSourceIds !== undefined) {
      graph.sourceIds = customSourceIds;
      // If a custom list of sources is provided, make sure the singular sourceId 
      // doesn't default to something outside this list (which would incorrectly render it as active).
      if (!customSourceId) graph.sourceId = customSourceIds.length > 0 ? customSourceIds[0] : "";
    }
    if (customDestinationIds !== undefined) {
      graph.destinationIds = customDestinationIds;
    }

    // Note: We deliberately DO NOT apply Campus ACLs here.
    // We want the frontend to always render the full physical topology (all edges intact).
    // The ACLs are enforced purely in the backend simulation algorithm runner (`simulationRunner.ts`),
    // which severs the edges dynamically in memory before DFS/BFS traverses them.
    
    return res.status(200).json({ data: graph });
  } catch (error) {
    console.error('Error fetching graph data:', error);
    return res.status(500).json({ error: 'Failed to build the graph.' });
  }
};
