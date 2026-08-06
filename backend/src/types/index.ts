export type AlgorithmType = 'bfs' | 'dfs' | 'hybrid';

export type ScenarioType =
  | 'network'
  | 'robotics'
  | 'traffic'
  | 'evacuation'
  | 'gameai';

export type GameAIBoard = 'dama' | 'checkers';

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
  | 'spawn'        // strategy planner source
  | 'room'         // board tile
  | 'corridor'     // special board tile / penalty path
  | 'enemy';       // blocked opponent tile

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

export interface ScenarioGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  sourceId: string; // Legacy / Fallback single source
  sourceIds?: string[]; // ✅ Multi-Agent Support: Multiple starting depots
  destinationIds: string[];
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
  activeRobotId?: string;
  robotPositions?: Record<string, string>;
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



