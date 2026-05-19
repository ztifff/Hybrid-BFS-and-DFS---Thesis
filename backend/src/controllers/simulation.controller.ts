import { Request, Response } from 'express';
import { SimulationResult, ScenarioType } from '../types/index';
import { runSimulation } from '../utils/simulationRunner';
import { runGraphBFS } from '../algorithms/bfs';

// In-memory store (Can be moved to a Database later)
const simulationHistory: Map<string, any> = new Map();

export class SimulationController {
  async runSimulation(req: Request, res: Response): Promise<void> {
    try {
      const { scenario, useRealWorld, seed } = req.body as {
        scenario: ScenarioType;
        useRealWorld: boolean;
        seed: number;
      };

      if (!scenario) {
        res.status(400).json({ success: false, error: 'Scenario is required' });
        return;
      }

      // 🔥 OFFLOAD HEAVY LIFTING TO BACKEND:
      // Run all 3 algorithms concurrently on the server
      const [bfsRes, dfsRes, hybridRes] = await Promise.all([
        runSimulation(scenario, 'bfs', seed, useRealWorld),
        runSimulation(scenario, 'dfs', seed, useRealWorld),
        runSimulation(scenario, 'hybrid', seed, useRealWorld)
      ]);

      // Calculate the optimal path baseline using the generated graph
      const optimalResult = await runGraphBFS(hybridRes.graph);

      const recordId = Math.random().toString(36).substring(7);
      
      const record = { 
        id: recordId, 
        createdAt: new Date(),
        results: {
          bfs: bfsRes,
          dfs: dfsRes,
          hybrid: hybridRes
        },
        optimalPathLength: optimalResult.pathLength
      };
      
      simulationHistory.set(recordId, record);

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

      const all = Array.from(simulationHistory.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      const start = (page - 1) * limit;
      const data = all.slice(start, start + limit);

      res.status(200).json({
        success: true,
        data,
        total: all.length,
        page,
        limit,
      });
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