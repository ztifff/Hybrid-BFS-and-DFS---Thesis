export type AlgorithmType = 'bfs' | 'dfs' | 'hybrid';

export type ScenarioType =
  | 'network'
  | 'robotics'
  | 'traffic'
  | 'evacuation'
  | 'gameai';

export type GameAIBoard = 'dama' | 'checkers' | 'snakes';

export type GraphSize = 'small' | 'medium' | 'large';

export interface GraphSizing {
  nodes: number;
  edges: number;
}

// ── Graph Node Types per scenario ──────────────────────────────────────────
export type NetworkNodeType =
  | 'datacenter'   // source
  | 'building_router'
  | 'floor_router'
  | 'access_point' // destination
  | 'failed'       // dynamic obstacle
  | 'router'       // ✅ Added for Cloud Datacenter
  | 'switch'       // ✅ Added for Cloud Datacenter
  | 'server';      // ✅ Added for Cloud Datacenter

export type RoboticsNodeType =
  | 'depot'        // source
  | 'zone'
  | 'aisle'
  | 'shelf'        // destination
  | 'blocked';

export type TrafficNodeType =
  | 'origin'       // source
  | 'highway'      // destination
  | 'intersection'
  | 'street'
  | 'closed';

export type EvacuationNodeType =
  | 'start'        // source
  | 'emergency_exit' // destination
  | 'corridor'
  | 'stairwell'
  | 'fire';
export type GameAINodeType =
  | 'strategy_planner:'        // strategy planner source
  | 'board_tile'   // board tile
  | 'corridor'     // special board tile / penalty path
  | 'blocked_tile';       // blocked opponent tile

export type ScenarioNodeType =
  | NetworkNodeType
  | RoboticsNodeType
  | TrafficNodeType
  | EvacuationNodeType
  | GameAINodeType;

// ── Core Graph Structures ──────────────────────────────────────────────────
export interface GraphNode {
  id: string;
  label: string;
  type: ScenarioNodeType | string;
  x: number; // SVG layout position (0-1000)
  y: number;
  level: number; // hierarchy depth from source
  buildingId?: string; // for grouping (network scenario)
  metadata?: Record<string, string | number>;
}

export interface GraphEdge {
  id: string;
  from: string; // node id
  to: string;   // node id
  latency: number; // ms / cost
  label?: string;
  // ✅ Added 'copper' for the datacenter cabling
  type: 'fiber' | 'ethernet' | 'road' | 'corridor' | 'path' | 'wireless' | 'copper' | 'serial' | 'copper_straight' | 'copper_crossover';
}

// ── Multi-Robot Assignment (Robotics Scenario) ─────────────────────────────
export interface RobotAssignment {
  robotId: string;           // depot node id
  destinations: string[];    // shelf node ids this robot must visit
  priorityDest?: string;     // if set, visit this destination first (Priority Override)
  boxCounts?: Record<string, number>; // destId → number of boxes (1–6, default 6)
}

export interface ScenarioGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  sourceId: string;
  sourceIds?: string[];
  destinationIds: string[];
  robotAssignments?: RobotAssignment[];
  width: number;
  height: number;
  walls?: { x1: number; y1: number; x2: number; y2: number; level: string; }[];
}

// ── Algorithm Step (graph-based) ───────────────────────────────────────────
export interface AlgorithmStep {
  stepIndex: number;        // (for dynamic event synchronization)
  explored: string[];
  frontier: string[];
  path: string[];
  current: string | null;
  done: boolean;
  foundDestination: string | null;
  foundDestinations?: string[];
  phaseLabel?: string;
  deliveredBoxCounts?: Record<string, number>; // destId -> count of boxes delivered up to this step
  pickedUpBoxCounts?: Record<string, number>; // shelfId -> count of boxes picked up up to this step
  activeRobotId?: string;                     // robotId taking turn in this step
  robotPositions?: Record<string, string>;   // robotId -> current node id map for all robots
}

// ── Performance Metrics ────────────────────────────────────────────────────
export interface PerformanceMetrics {
  nodesExplored: number;
  timeElapsed: number;   // ms
  pathLength: number;    // hops
  totalLatency: number;  // sum of edge latencies on path (ms)
  memoryUsed: number;    // KB estimated
  exitFound: boolean;
  exitIndex: number | null;
  completionRate: number; // ✅ ADDED: Formal metric tracking
  failureReason?: string; // ✅ ADDED: Specific failure reason
}

// ── Dynamic Event ──────────────────────────────────────────────────────────
export interface DynamicEvent {
  stepIndex: number;
  nodeId: string;
  blocked: boolean; // true = node failed, false = restored
  label: string;
}

// ── Simulation Result ──────────────────────────────────────────────────────
export interface SimulationResult {
  steps: AlgorithmStep[];
  metrics: PerformanceMetrics;
  dynamicEvents: DynamicEvent[];
  graph: ScenarioGraph;
}

// ── Config Types ───────────────────────────────────────────────────────────
export interface ScenarioConfig {
  id: ScenarioType;
  name: string;
  icon: string;
  description: string;
  dynamicDescription: string;
  sourceLabel: string;
  destinationLabel: string;
  obstacleLabel: string;
  color: string;
  rows: number;
  cols: number;
  // legacy compat
  startLabel: string;
  exitLabel: string;
}

export interface AlgorithmConfig {
  id: AlgorithmType;
  name: string;
  description: string;
  color: string;
  textColor: string;
  borderColor: string;
}

