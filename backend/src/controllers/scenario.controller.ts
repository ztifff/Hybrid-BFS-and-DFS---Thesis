import { Request, Response } from 'express';
import { SCENARIOS, getScenarioById } from '../config/scenarios';
import { SimulationResult, AlgorithmType, ScenarioType } from '../types/index';
import { runSimulation } from '../utils/simulationRunner';

// In-memory store
const simulationHistory: Map<string, SimulationResult & { id: string, createdAt: Date }> = new Map();

export class ScenarioController {
  
  // 1. List all available scenarios for the Picker
  listScenarios(_req: Request, res: Response): void {
    res.status(200).json({ success: true, data: SCENARIOS });
  }

  // 2. Get info for a specific scenario
  getScenario(req: Request, res: Response): void {
    const scenario = getScenarioById(req.params.id);
    if (!scenario) {
      res.status(404).json({ success: false, error: `Scenario not found: ${req.params.id}` });
      return;
    }
    res.status(200).json({ success: true, data: scenario });
  }

  // 3. Run a simulation based on a pre-defined Scenario ID (The "Thesis" way)
  async runScenario(req: Request, res: Response): Promise<void> {
    try {
      const scenarioConfig = getScenarioById(req.params.id);
      if (!scenarioConfig) {
        res.status(404).json({ success: false, error: `Scenario not found` });
        return;
      }

      const { seed, useRealWorld } = req.body || {};

      const result = await runSimulation(
        scenarioConfig.id as ScenarioType,
        scenarioConfig.id as AlgorithmType,
        seed || Date.now(),
        useRealWorld || false
      );

      const recordId = Math.random().toString(36).substring(7);
      const record = { ...result, id: recordId, createdAt: new Date() };
      simulationHistory.set(recordId, record);

      res.status(200).json({ success: true, data: record });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  }

  // 4. Run an ad-hoc simulation (The "Raw Data" way)
  async runSimulation(req: Request, res: Response): Promise<void> {
    try {
      const { algorithm, scenario, useRealWorld, seed } = req.body as {
        algorithm: string;
        scenario: string;
        useRealWorld: boolean;
        seed: number;
      };

      const validAlgorithm = algorithm as AlgorithmType;
      const validScenario = scenario as ScenarioType;

      const validAlgorithms: AlgorithmType[] = ['bfs', 'dfs', 'hybrid'];
      if (!validAlgorithms.includes(validAlgorithm)) {
        res.status(400).json({ success: false, error: `Invalid algorithm: ${algorithm}` });
        return;
      }

      const result = await runSimulation(
        validScenario, 
        validAlgorithm, 
        seed || Date.now(), 
        useRealWorld || false
      );
      
      const recordId = Math.random().toString(36).substring(7);
      const record = { ...result, id: recordId, createdAt: new Date() };
      simulationHistory.set(recordId, record);

      res.status(200).json({ success: true, data: record });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  }

  // 5. History and Cleanup methods
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt((req.query.page as string) ?? '1', 10);
      const limit = parseInt((req.query.limit as string) ?? '10', 10);
      const all = Array.from(simulationHistory.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const start = (page - 1) * limit;
      res.status(200).json({ success: true, data: all.slice(start, start + limit), total: all.length });
    } catch (err: unknown) {
      res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Error' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    const result = simulationHistory.get(req.params.id);
    if (!result) res.status(404).json({ success: false, error: 'Simulation not found' });
    else res.status(200).json({ success: true, data: result });
  }

  async deleteById(req: Request, res: Response): Promise<void> {
    const existed = simulationHistory.delete(req.params.id);
    if (!existed) res.status(404).json({ success: false, error: 'Simulation not found' });
    else res.status(200).json({ success: true, message: 'Deleted successfully' });
  }
}