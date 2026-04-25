import { Request, Response } from 'express';
import { SimulationResult, AlgorithmType, ScenarioType as NetworkType } from '../types/index';
import { runSimulation } from '../utils/simulationRunner';
import { buildNetworkGraph } from '../utils/networkGraph';

// In-memory store
const simulationHistory: Map<string, SimulationResult & { id: string, createdAt: Date }> = new Map();

export class SimulationController {
  async runSimulation(req: Request, res: Response): Promise<void> {
    try {
      const { algorithm, networkType, startNode, targetNode } = req.body as {
        algorithm: AlgorithmType;
        networkType: NetworkType;
        startNode: string;
        targetNode: string;
      };

      const validAlgorithms: AlgorithmType[] = ['bfs', 'dfs', 'hybrid', 'BFS', 'DFS', 'Hybrid-BFS-DFS'];
      if (!validAlgorithms.includes(algorithm)) {
        res.status(400).json({ success: false, error: `Invalid algorithm: ${algorithm}` });
        return;
      }

      // We still build the graph here JUST to validate the nodes exist before running
      const graph = buildNetworkGraph(false, 123);

      const nodeIds = new Set(graph.nodes.map((n) => n.id));
      if (!nodeIds.has(startNode)) {
        res.status(400).json({ success: false, error: `Start node not found: ${startNode}` });
        return;
      }

      // 🔥 FIX: Pass the scenario string (networkType) instead of the graph object
      // Note: Because your simulationRunner rebuilds the graph internally, 
      // we need to wait for the result.
      const result = await runSimulation(networkType, algorithm);
      
      const recordId = Math.random().toString(36).substring(7);
      const record = { ...result, id: recordId, createdAt: new Date() };
      
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