import { Request, Response } from 'express';
import { scenarios, getScenarioById } from '../config/scenarios';
import { buildNetworkGraph } from '../utils/networkGraph';
import { runSimulation } from '../utils/simulationRunner';

export class ScenarioController {
  listScenarios(_req: Request, res: Response): void {
    res.status(200).json({ success: true, data: scenarios });
  }

  getScenario(req: Request, res: Response): void {
    const scenario = getScenarioById(req.params.id);
    if (!scenario) {
      res.status(404).json({ success: false, error: `Scenario not found: ${req.params.id}` });
      return;
    }
    res.status(200).json({ success: true, data: scenario });
  }

  async runScenario(req: Request, res: Response): Promise<void> {
    try {
      const scenario = getScenarioById(req.params.id);
      if (!scenario) {
        res.status(404).json({ success: false, error: `Scenario not found: ${req.params.id}` });
        return;
      }

      // Pass the scenario network type string instead of the graph
      const result = await runSimulation(scenario.networkType as any, scenario.algorithm as any);

      res.status(200).json({ success: true, data: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  }
}