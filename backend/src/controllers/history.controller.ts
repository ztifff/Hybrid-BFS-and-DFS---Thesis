// ============================================================
// CONTROLLERS: history.controller.ts
// Handles fetching and deleting saved simulation runs
// ============================================================

import { Request, Response } from 'express';
import { simulationHistory } from '../store/historyStore';

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

  // 2. Get a single history entry by ID
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

  // 3. Delete one or multiple entries
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