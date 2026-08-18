import { SimulationResult, ScenarioType } from '../../types';

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
  timestamp: Date | string;
  metadata?: {
    mapId?: string;
    gameBoard?: string;
    networkRoutingMode?: string;
    deliveryMode?: string;
    sourceDevice?: string;
    destinationDevices?: string[];
    robotAssignments?: any[];
    evacuationSourceId?: string | null;
    syntheticSizing?: { nodes: number; edges: number };
    activeAlgorithms?: { bfs: boolean; dfs: boolean; hybrid: boolean };
  };
}

export type AlgorithmKey = 'bfs' | 'dfs' | 'hybrid';
export type HistoryResults = Partial<Record<AlgorithmKey, SimulationResult>>;

export interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  scenario?: ScenarioType;
  onDeleteHistory: (ids: string[]) => void;
  onImportHistory: (entries: HistoryEntry[]) => void;
  activeAlgorithms?: { bfs: boolean; dfs: boolean; hybrid: boolean };
}

export const SCENARIO_BADGES: Record<string, string> = {
  network:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  warehouse:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  traffic:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export const MOVEMENT_PROFILES: Record<AlgorithmKey, { motion: string; strategy: string; tradeoff: string; icon: string }> = {
  bfs: {
    icon: '🌊',
    motion: 'Wave-front expansion — visits all neighbors at depth N before advancing to depth N+1',
    strategy: 'Each step moves laterally across the graph width, building a complete "ring" around the source before proceeding deeper. On a map, this looks like a growing flood-fill.',
    tradeoff: 'Guarantees shortest path in hops but explores more nodes and uses more memory than DFS on sparse graphs.',
  },
  dfs: {
    icon: '🎯',
    motion: 'Deep plunge — follows one branch as far as possible, then backtracks to try the next',
    strategy: 'Each step dives down a single chain of nodes, committing fully to one route before reconsidering. On a map, this looks like a single probe shooting forward.',
    tradeoff: 'Uses minimal memory and is fast to reach deep nodes, but may miss shorter paths and must backtrack fully when blocked.',
  },
  hybrid: {
    icon: '⚡',
    motion: 'Adaptive switching — applies BFS at high-branching junctions and DFS in low-branching corridors',
    strategy: 'Each step evaluates the local branching factor. At hubs (many neighbors) it broadcasts like BFS; in corridors (few neighbors) it dives like DFS. This produces an optimal coverage pattern.',
    tradeoff: 'Balances speed and coverage — faster than pure BFS on deep paths, shorter than pure DFS on wide graphs. Superior for dynamic maps where routes change.',
  },
};

export const BLOCK_ICON: Record<string, string> = {
  traffic:    '🚦',
  evacuation: '🔥',
  robotics:   '📦',
  network:    '🚫',
  gameai:     '🔴',
};

export const CLEAR_ICON: Record<string, string> = {
  traffic:    '✅',
  evacuation: '🟢',
  robotics:   '✅',
  network:    '⚡',
  gameai:     '✅',
};
