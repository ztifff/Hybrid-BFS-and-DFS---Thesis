export type AlgorithmType = 'bfs' | 'dfs' | 'hybrid' | 'BFS' | 'DFS' | 'Hybrid-BFS-DFS';

export type ScenarioType =
  | 'network'
  | 'robotics'
  | 'traffic'
  | 'evacuation'
  | 'gameai'
  | string; // Extended to allow datacenter, aws, mockoffice

export type NetworkType = string;

// ── API Response Types (Backend) ───────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  error?: string;
}

// ── Graph Node Types per scenario ──────────────────────────────────────────
export type NetworkNodeType =
  | 'datacenter'   // source
  | 'building_router'
  | 'floor_router'
  | 'access_point' // destination
  | 'failed'       // dynamic obstacle
  | 'router'       // Cloud Datacenter
  | 'switch'       // Cloud Datacenter
  | 'server';      // Cloud Datacenter

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
  | 'spawn'        // source
  | 'portal'       // destination
  | 'room'
  | 'corridor'
  | 'enemy';

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
  type: ScenarioNodeType;
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
  type: 'fiber' | 'ethernet' | 'road' | 'corridor' | 'path' | 'wireless' | 'copper';
}

export interface ScenarioGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  sourceId: string;
  destinationIds: string[];
  width: number;
  height: number;
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
  phaseLabel?: string;
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
  id: string;
  name: string;
  description: string;
  networkType: string;
  algorithm: string;
  startNode: string;
  targetNode: string;
  
  // Legacy / optional frontend fields
  icon?: string;
  dynamicDescription?: string;
  sourceLabel?: string;
  destinationLabel?: string;
  obstacleLabel?: string;
  color?: string;
  rows?: number;
  cols?: number;
  startLabel?: string;
  exitLabel?: string;
}

export interface AlgorithmConfig {
  id: AlgorithmType;
  name: string;
  description: string;
  color: string;
  textColor: string;
  borderColor: string;
}