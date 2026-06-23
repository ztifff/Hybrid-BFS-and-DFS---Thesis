import { Request, Response } from 'express';
import { buildScenarioGraph } from '../utils/graphBuilder';
import { ScenarioType, GraphSize } from '../types';
import { GameAIBoard } from '../utils/gameAIGraph';

export const getGraphData = (req: Request, res: Response) => {
  try {
    const scenario = req.query.scenario as ScenarioType;
    const useRealWorld = req.query.useRealWorld === 'true';
    const networkMode = (req.query.networkMode as 'datacenter' | 'as733' | 'synthetic') || 'synthetic';
    const gameBoard = req.query.gameBoard as GameAIBoard | undefined;
    const graphSize = (req.query.graphSize as GraphSize) || 'medium';
    
    // 1. Extract the seed from the frontend request (fallback to Date.now() if missing)
    const seed = req.query.seed ? parseInt(req.query.seed as string, 10) : Date.now();

    if (!scenario) {
      return res.status(400).json({ error: 'Scenario type is required.' });
    }

    // 2. Pass the seed into the builder as the 6th parameter
    const graph = buildScenarioGraph(scenario, useRealWorld, gameBoard, networkMode, graphSize, seed);
    
    return res.status(200).json({ data: graph });
  } catch (error) {
    console.error('Error fetching graph data:', error);
    return res.status(500).json({ error: 'Failed to build the graph.' });
  }
};