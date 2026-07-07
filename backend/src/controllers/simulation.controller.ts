import { Request, Response } from 'express';
import { SimulationResult, ScenarioType, GraphSize, GraphSizing } from '../types/index';
import { runSimulation } from '../utils/simulationRunner';
import { runGraphBFS } from '../algorithms/bfs';
import { simulationHistory } from '../store/historyStore';


export class SimulationController {
 async runSimulation(req: Request, res: Response): Promise<void> {
    try {
      const { scenario, useRealWorld, networkMode, roboticsMode, seed, gameBoard, graphSize, chessPiece, sizing } = req.body as {
        scenario: ScenarioType;
        useRealWorld: boolean;
        networkMode: string;
        roboticsMode: string; 
        seed: number;
        gameBoard?: 'dama' | 'checkers' ;
        customGraphId?: string;
        graphSize: GraphSize;
        chessPiece?: string;
        sizing?: GraphSizing;
      };


      const offset = Number(req.query.offset || 0);
      const limit = Number(req.query.limit || 0);

      if (!scenario) {
        res.status(400).json({ success: false, error: 'Scenario is required' });
        return;
      }

      // 🧠 FIX: Determine which mode to use based on the scenario
      const modeArg = (scenario === 'robotics' ? roboticsMode : networkMode) as 'datacenter' | 'as733' | 'synthetic' | 'aws' | 'clinic';


      // 🧠 FIX: Argument order corrected! 'modeArg' comes BEFORE 'gameBoard'
      const activeSizing = useRealWorld ? undefined : sizing;
      const bfsRes    = await runSimulation(scenario, 'bfs',    seed, useRealWorld, modeArg, undefined, offset, limit, gameBoard, graphSize, chessPiece, activeSizing);
      const dfsRes    = await runSimulation(scenario, 'dfs',    seed, useRealWorld, modeArg, undefined, offset, limit, gameBoard, graphSize, chessPiece, activeSizing);
      const hybridRes = await runSimulation(scenario, 'hybrid', seed, useRealWorld, modeArg, undefined, offset, limit, gameBoard, graphSize, chessPiece, activeSizing);


      let optimalPathLength = 0;
      
      // Only calculate the optimal path if this is the first chunk. 
      // (Subsequent chunks have the graph data stripped to save payload size)
      if (offset === 0) {
        const optimalResult = await runGraphBFS(hybridRes.graph);
        optimalPathLength = optimalResult.pathLength;
      }

      const recordId = Math.random().toString(36).substring(7);

const record = {
  id: recordId,
  createdAt: new Date(),
  results: {
    bfs: bfsRes,
    dfs: dfsRes,
    hybrid: hybridRes
  },
  optimalPathLength: optimalPathLength
};



      res.status(200).json({ success: true, data: record });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  }

 async getHistory(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt((req.query.page as string) ?? '1', 10);
    const limit = parseInt((req.query.limit as string) ?? '10', 10);
    const { data, total } = simulationHistory.getPaginated(page, limit);
    res.status(200).json({ success: true, data, total, page, limit });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
}

async getById(req: Request, res: Response): Promise<void> {
  const result = simulationHistory.get(req.params.id);
  if (!result) {
    res.status(404).json({ success: false, error: 'Simulation not found' });
    return;
  }
  res.status(200).json({ success: true, data: result });
}

async deleteById(req: Request, res: Response): Promise<void> {
  const existed = simulationHistory.delete(req.params.id);
  if (!existed) {
    res.status(404).json({ success: false, error: 'Simulation not found' });
    return;
  }
  res.status(200).json({ success: true, message: 'Deleted successfully' });
}

}
