import { Request, Response } from 'express';
import { SimulationResult, ScenarioType, GraphSize, GraphSizing } from '../types/index';
import { orchestrateSimulation } from '../utils/simulationRunner';
import { simulationHistory } from '../store/historyStore';


export class SimulationController {
 async runSimulation(req: Request, res: Response): Promise<void> {
    try {
      const { scenario, mapId, seed, gameBoard, graphSize, chessPiece, sizing } = req.body as {
        scenario: ScenarioType;
        mapId: string;
        seed: number;
        gameBoard?: 'dama' | 'checkers' ;
        graphSize?: GraphSize;
        chessPiece?: string;
        sizing?: GraphSizing;
      };

      const offset = Number(req.query.offset || 0);
      const limit = Number(req.query.limit || 0);

      if (!scenario) {
        res.status(400).json({ success: false, error: 'Missing required field: scenario' });
        return;
      }

      const useRealWorld = mapId !== 'synthetic';
      const activeSizing = useRealWorld ? undefined : sizing;
      
      const record = await orchestrateSimulation(
        scenario,
        seed,
        useRealWorld,
        mapId,
        offset,
        limit,
        gameBoard,
        graphSize || 'medium',
        chessPiece || 'knight',
        activeSizing
      );

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
