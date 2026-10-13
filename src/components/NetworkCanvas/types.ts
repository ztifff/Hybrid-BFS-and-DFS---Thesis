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
  onNodeDoubleClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
  onCanvasClick?: (x: number, y: number, activeFloor?: string) => void;
  isMoveMode?: boolean;
  placementModeType?: 'node' | 'edge' | 'delete' | 'move' | 'rename' | null;
  onNodeMoveEnd?: (nodeId: string, x: number, y: number) => void;
  mapId?: string;
  autoFit?: boolean;
  shelfBoxCounts?: Map<string, number>; // nodeId → box count for AWS Warehouse shelf visualization
  robotAssignments?: RobotAssignment[];  // per-robot rack allocation for AWS Warehouse
  disableSimultaneousMode?: boolean;     // if true, forces single-algorithm box rendering even when multiple algos are visible
  activeAlgorithms?: { bfs: boolean; dfs: boolean; hybrid: boolean }; // from header pill toggles
  workspaceView?: 'physical' | 'logical';
  cursor?: string;
  isFinished?: boolean;
  status?: string;
  totalSteps?: number;
  showHopBadges?: boolean;
  theme?: 'dark' | 'light';
}

export const NODE_CONFIG: Record<string, { icon: string; iconImg?: string; radius: number; baseColor: string }> = {
  datacenter: { icon: '🌐', iconImg: '/networkIcons/carrier routing system.jpg', radius: 26, baseColor: '#1e3a8a' },
  isp: { icon: '🌐', iconImg: '/networkIcons/carrier routing system.jpg', radius: 26, baseColor: '#1e3a8a' },
  building_router: { icon: '🌐', iconImg: '/networkIcons/router.jpg', radius: 24, baseColor: '#1e40af' },
  router: { icon: '🌐', iconImg: '/networkIcons/router.jpg', radius: 24, baseColor: '#1e40af' },
  multilayer_switch: { icon: '🎛️', iconImg: '/networkIcons/layer 3 switch.jpg', radius: 20, baseColor: '#1d4ed8' },
  floor_router: { icon: '🎛️', iconImg: '/networkIcons/layer 3 switch.jpg', radius: 20, baseColor: '#1d4ed8' }, // Fallback
  access_switch: { icon: '🔌', iconImg: '/networkIcons/workgroup switch.jpg', radius: 18, baseColor: '#2563eb' },
  switch: { icon: '🔌', iconImg: '/networkIcons/workgroup switch.jpg', radius: 18, baseColor: '#2563eb' }, // Fallback for backend cached data
  access_point: { icon: '📡', iconImg: '/networkIcons/accesspoint.jpg', radius: 16, baseColor: '#10b981' },
  end_device: { icon: '💻', iconImg: '/networkIcons/pc.jpg', radius: 16, baseColor: '#0ea5e9' },
  server: { icon: '🗄️', iconImg: '/networkIcons/fileserver.jpg', radius: 18, baseColor: '#475569' },
  wireless_ap: { icon: '📡', iconImg: '/networkIcons/accesspoint.jpg', radius: 16, baseColor: '#10b981' },
  failed: { icon: '💥', radius: 17, baseColor: '#450a0a' },
  depot: { icon: '🏭', iconImg: '/RoboticsMaps/icons/robot.png', radius: 28, baseColor: '#92400e' },
  zone: { icon: '📦', iconImg: '/RoboticsMaps/icons/move.png', radius: 22, baseColor: '#b45309' },
  aisle: { icon: '🔧', iconImg: '/RoboticsMaps/icons/move.png', radius: 17, baseColor: '#d97706' },
  shelf: { icon: '🔧', iconImg: '/RoboticsMaps/icons/store.png', radius: 17, baseColor: '#d97706' },
  delivery_bay: { icon: '🚚', iconImg: '/RoboticsMaps/icons/loading-bay.png', radius: 14, baseColor: '#f59e0b' },
  blocked: { icon: '🚧', radius: 17, baseColor: '#7f1d1d' },
  origin: { icon: '🏙️', radius: 28, baseColor: '#065f46' },
  highway: { icon: '🛣️', radius: 22, baseColor: '#047857' },
  intersection: { icon: '🚦', radius: 17, baseColor: '#059669' },
  street: { icon: '🚗', radius: 14, baseColor: '#10b981' },
  closed: { icon: '🚫', radius: 17, baseColor: '#7f1d1d' },
  start: { icon: 'start', radius: 24, baseColor: '#0e7490' },
  emergency_exit: { icon: 'emergency_exit', radius: 22, baseColor: '#b91c1c' },
  corridor: { icon: 'corridor', radius: 17, baseColor: '#dc2626' },
  stairwell: { icon: 'stairwell', radius: 17, baseColor: '#ef4444' },
  fire: { icon: 'fire', radius: 17, baseColor: '#7f1d1d' },
  strategy_planner: { icon: '🔵', radius: 14, baseColor: '#9333ea' },
  winning_square: { icon: '🏁', radius: 14, baseColor: '#dc2626' },
  board_tile: { icon: '⚪', radius: 8, baseColor: '#64748b' },
  blocked_tile: { icon: '🔴', radius: 10, baseColor: '#ef4444' },
  place: { icon: 'place', radius: 20, baseColor: '#0e7490' },
  shop: { icon: 'place', radius: 20, baseColor: '#0e7490' },
  restaurant: { icon: 'place', radius: 18, baseColor: '#0e7490' },
  amenity: { icon: 'place', radius: 18, baseColor: '#0e7490' },
  cinema: { icon: 'cinema', radius: 22, baseColor: '#7c3aed' },
  room: { icon: 'room', radius: 18, baseColor: '#0e7490' },
};

export const EDGE_CONFIG: Record<string, { color: string; dash: number[]; width: number }> = {
  auto_connect: { color: '#fbbf24', dash: [], width: 3 },
  fiber: { color: '#60a5fa', dash: [], width: 3 },
  serial: { color: '#ff0000', dash: [], width: 2.5 },
  copper_straight: { color: '#ffffff', dash: [], width: 2 },
  copper_crossover: { color: '#ffffff', dash: [8, 6], width: 2 },
  ethernet: { color: '#94a3b8', dash: [], width: 2 },
  copper: { color: '#fdba74', dash: [], width: 2 },
  road: { color: '#6ee7b7', dash: [], width: 2 },
  corridor: { color: '#fca5a5', dash: [4, 3], width: 2 },
  stairwell: { color: '#c4b5fd', dash: [], width: 2 },
  path: { color: '#c4b5fd', dash: [], width: 2 },
  wireless: { color: '#06b6d4', dash: [6, 4], width: 1.5 },
};
