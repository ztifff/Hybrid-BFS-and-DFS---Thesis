import { Request, Response } from 'express';
import { buildScenarioGraph } from '../utils/graphBuilder';
import { ScenarioType } from '../types'; // Adjust this import path if needed

export const getGraphData = (req: Request, res: Response) => {
  try {
    const scenario = req.query.scenario as ScenarioType;
    
    // Query parameters come in as strings, so we parse the boolean
    const useRealWorld = req.query.useRealWorld === 'true';

    if (!scenario) {
      return res.status(400).json({ error: 'Scenario type is required.' });
    }

    // Call the builder function you showed in your image
    const graph = buildScenarioGraph(scenario, useRealWorld);

    return res.status(200).json({ data: graph });
  } catch (error) {
    console.error('Error fetching graph data:', error);
    return res.status(500).json({ error: 'Failed to build the graph.' });
  }
};