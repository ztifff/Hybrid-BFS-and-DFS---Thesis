import { Request, Response } from 'express';
import { simulationHistory, HistoryEntry } from '../store/historyStore';

export class HistoryController {
  async getAll(req: Request, res: Response): Promise<void> {
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
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }
    res.status(200).json({ success: true, data: result });
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const entry = req.body as HistoryEntry;
      if (!entry || !entry.id) {
        res.status(400).json({ success: false, error: 'Invalid entry' });
        return;
      }
      simulationHistory.set(entry.id, {
        ...entry,
        timestamp: new Date(entry.timestamp),
      });
      res.status(201).json({ success: true, data: entry });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  }

  async deleteById(req: Request, res: Response): Promise<void> {
    const existed = simulationHistory.delete(req.params.id);
    if (!existed) {
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Deleted' });
  }

  async deleteMany(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body as { ids: string[] };
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ success: false, error: 'ids array required' });
        return;
      }
      ids.forEach(id => simulationHistory.delete(id));
      res.status(200).json({ success: true, message: `Deleted ${ids.length} records` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  }

  async exportCSV(req: Request, res: Response): Promise<void> {
    try {
      const scenario = req.query.scenario as string | undefined;
      const graphSize = req.query.graphSize as string | undefined;
      const csv = simulationHistory.exportCSV(scenario, graphSize);

      if (!csv) {
        res.status(404).json({ success: false, error: 'No data found' });
        return;
      }

      const filename = `simulation_results${scenario ? `_${scenario}` : ''}${graphSize ? `_${graphSize}` : ''}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  }
}
