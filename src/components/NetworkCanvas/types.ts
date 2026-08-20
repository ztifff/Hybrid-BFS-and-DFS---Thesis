import { AlgorithmStep, ScenarioGraph, ScenarioType, DynamicEvent, RobotAssignment } from '../../types';

export interface NetworkCanvasProps {
  graph: ScenarioGraph;
  activeSteps: { bfs: AlgorithmStep | null; dfs: AlgorithmStep | null; hybrid: AlgorithmStep | null };
  scenario: ScenarioType;
  stepIndex: number;
  dynamicEvents: DynamicEvent[];
  historicalBlockedNodeIds?: Set<string>;
  highlightedNodeId?: string | null;
  onDeselect?: () => void;
  onNodeClick?: (nodeId: string) => void;
  mapId?: string;
  autoFit?: boolean;
  shelfBoxCounts?: Map<string, number>; // nodeId → box count for AWS Warehouse shelf visualization
  robotAssignments?: RobotAssignment[];  // per-robot rack allocation for AWS Warehouse
  disableSimultaneousMode?: boolean;     // if true, forces single-algorithm box rendering even when multiple algos are visible
  activeAlgorithms?: { bfs: boolean; dfs: boolean; hybrid: boolean }; // from header pill toggles
}

export const NODE_CONFIG: Record<string, { icon: string; radius: number; baseColor: string }> = {
  datacenter: { icon: '🌐', radius: 28, baseColor: '#1e40af' },
  building_router: { icon: '🌐', radius: 22, baseColor: '#1e40af' },
  router: { icon: '🌐', radius: 22, baseColor: '#1e40af' },
  floor_router: { icon: '🎛️', radius: 17, baseColor: '#1d4ed8' },
  switch: { icon: '🔌', radius: 17, baseColor: '#2563eb' },
  access_point: { icon: '💻', radius: 14, baseColor: '#0ea5e9' },
  end_device: { icon: '💻', radius: 14, baseColor: '#0ea5e9' },
  server: { icon: '🗄️', radius: 16, baseColor: '#475569' },
  wireless_ap: { icon: '📡', radius: 15, baseColor: '#10b981' },
  failed: { icon: '💥', radius: 17, baseColor: '#450a0a' },
  depot: { icon: '🏭', radius: 28, baseColor: '#92400e' },
  zone: { icon: '📦', radius: 22, baseColor: '#b45309' },
  aisle: { icon: '🔧', radius: 17, baseColor: '#d97706' },
  shelf: { icon: '📫', radius: 14, baseColor: '#f59e0b' },
  blocked: { icon: '🚧', radius: 17, baseColor: '#7f1d1d' },
  origin: { icon: '🏙️', radius: 28, baseColor: '#065f46' },
  highway: { icon: '🛣️', radius: 22, baseColor: '#047857' },
  intersection: { icon: '🚦', radius: 17, baseColor: '#059669' },
  street: { icon: '🚗', radius: 14, baseColor: '#10b981' },
  closed: { icon: '🚫', radius: 17, baseColor: '#7f1d1d' },
  start: { icon: '🧑', radius: 24, baseColor: '#991b1b' },
  emergency_exit: { icon: '🚪', radius: 22, baseColor: '#b91c1c' },
  corridor: { icon: '🚶', radius: 17, baseColor: '#dc2626' },
  stairwell: { icon: '🪜', radius: 17, baseColor: '#ef4444' },
  fire: { icon: '🔥', radius: 17, baseColor: '#7f1d1d' },
  strategy_planner: { icon: '🔵', radius: 14, baseColor: '#9333ea' },
  winning_square: { icon: '🏁', radius: 14, baseColor: '#dc2626' },
  board_tile: { icon: '⚪', radius: 8, baseColor: '#64748b' },
  blocked_tile: { icon: '🔴', radius: 10, baseColor: '#ef4444' },
  place: { icon: '🏬', radius: 20, baseColor: '#0e7490' },
  shop: { icon: '🏬', radius: 20, baseColor: '#0e7490' },
  restaurant: { icon: '🍽️', radius: 18, baseColor: '#0e7490' },
  amenity: { icon: '🏬', radius: 18, baseColor: '#0e7490' },
};

export const EDGE_CONFIG: Record<string, { color: string; dash: number[]; width: number }> = {
  fiber: { color: '#60a5fa', dash: [], width: 3 },
  serial: { color: '#ff0000', dash: [], width: 2.5 },
  copper_straight: { color: '#ffffff', dash: [], width: 2 },
  copper_crossover: { color: '#ffffff', dash: [8, 6], width: 2 },
  ethernet: { color: '#94a3b8', dash: [], width: 2 },
  copper: { color: '#fdba74', dash: [], width: 2 },
  road: { color: '#6ee7b7', dash: [], width: 2 },
  corridor: { color: '#fca5a5', dash: [4, 3], width: 2 },
  path: { color: '#c4b5fd', dash: [], width: 2 },
  wireless: { color: '#06b6d4', dash: [6, 4], width: 1.5 },
};
