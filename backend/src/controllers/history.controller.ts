// ============================================================
// CONTROLLERS: history.controller.ts
// Handles fetching and deleting saved simulation runs
// ============================================================

import { Request, Response } from 'express';
import { simulationHistory, HistoryEntry } from '../store/historyStore';

type IncomingHistoryEntry = Partial<Omit<HistoryEntry, 'timestamp'>> & {
  timestamp?: string | Date;
};

const createHistoryId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const parseTimestamp = (timestamp?: string | Date): Date => {
  const parsed = timestamp ? new Date(timestamp) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

export class HistoryController {
  
  // 1. Get all history entries (sorted newest first)
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const allRecords = Array.from(simulationHistory.values())
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      res.status(200).json({ success: true, data: allRecords, total: allRecords.length });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch history';
      res.status(500).json({ success: false, error: message });
    }
  }

  // 2. Save a history entry from the frontend
  async createHistory(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as IncomingHistoryEntry;
      const simResult = body.simResult ?? body.multiResults?.hybrid;

      if (!body.name || !body.scenario || !simResult) {
        res.status(400).json({
          success: false,
          error: 'History entry requires name, scenario, and simResult or multiResults'
        });
        return;
      }

      const record: HistoryEntry = {
        id: body.id || createHistoryId(),
        runNumber: typeof body.runNumber === 'number' && Number.isFinite(body.runNumber)
          ? body.runNumber
          : simulationHistory.size + 1,
        name: body.name,
        algorithm: body.algorithm || 'hybrid',
        scenario: body.scenario,
        simResult,
        multiResults: body.multiResults,
        optimalPathLength: body.optimalPathLength ?? simResult.metrics?.pathLength ?? 0,
        totalNodes: body.totalNodes ?? simResult.graph?.nodes?.length ?? 0,
        timestamp: parseTimestamp(body.timestamp)
      };

      simulationHistory.set(record.id, record);
      res.status(201).json({ success: true, data: record });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save history';
      res.status(500).json({ success: false, error: message });
    }
  }

  // 3. Get a single history entry by ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const result = simulationHistory.get(req.params.id);
      if (!result) {
        res.status(404).json({ success: false, error: 'Simulation record not found' });
        return;
      }
      res.status(200).json({ success: true, data: result });
    } catch (err: unknown) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  }

  // 4. Delete one or multiple entries
  async deleteHistory(req: Request, res: Response): Promise<void> {
    try {
      // Allow passing a single ID in URL or an array of IDs in the body
      const idParam = req.params.id;
      const { ids } = req.body; 

      let deletedCount = 0;

      if (idParam) {
        if (simulationHistory.delete(idParam)) deletedCount++;
      } else if (Array.isArray(ids)) {
        ids.forEach(id => {
          if (simulationHistory.delete(id)) deletedCount++;
        });
      }

      res.status(200).json({ success: true, message: `Deleted ${deletedCount} records` });
    } catch (err: unknown) {
      res.status(500).json({ success: false, error: 'Failed to delete records' });
    }
  }
}