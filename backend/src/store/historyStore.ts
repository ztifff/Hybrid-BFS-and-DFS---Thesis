// ============================================================
// STORE: historyStore.ts
// Shared in-memory database for simulation history
// ============================================================

import { SimulationResult, ScenarioType } from '../types';

// Matching your frontend's exact interface
export interface HistoryEntry {
  id: string;
  runNumber: number;
  name: string;
  algorithm: string;
  scenario: ScenarioType;
  simResult: SimulationResult;
  multiResults?: { bfs: SimulationResult; dfs: SimulationResult; hybrid: SimulationResult };
  optimalPathLength: number;
  totalNodes: number;
  timestamp: Date;
}

// Export the shared map
export const simulationHistory: Map<string, HistoryEntry> = new Map();