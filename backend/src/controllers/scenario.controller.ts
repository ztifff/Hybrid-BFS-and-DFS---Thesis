import { Request, Response } from 'express';
import { SCENARIOS, getScenarioById } from '../config/scenarios';
import { AlgorithmType, ScenarioType } from '../types/index';
import { runSimulation } from '../utils/simulationRunner';
import { simulationHistory, HistoryEntry } from '../store/historyStore';

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
      const newEntry: HistoryEntry = {
        id: recordId,
        runNumber: simulationHistory.size + 1,
        name: `Run ${simulationHistory.size + 1} - ${scenarioConfig.id}`,
        algorithm: scenarioConfig.id as AlgorithmType,
        scenario: scenarioConfig.id as ScenarioType,
        simResult: result, 
        optimalPathLength: result.metrics.pathLength, 
        totalNodes: result.graph.nodes.length,
        timestamp: new Date()
      };

      simulationHistory.set(recordId, newEntry);

      res.status(200).json({ success: true, data: newEntry });
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
      const newEntry: HistoryEntry = {
        id: recordId,
        runNumber: simulationHistory.size + 1,
        name: `Run ${simulationHistory.size + 1} - ${validScenario}`,
        algorithm: validAlgorithm,
        scenario: validScenario,
        simResult: result,
        optimalPathLength: result.metrics.pathLength, 
        totalNodes: result.graph.nodes.length,
        timestamp: new Date()
      };

      simulationHistory.set(recordId, newEntry);

      res.status(200).json({ success: true, data: newEntry });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  }
}