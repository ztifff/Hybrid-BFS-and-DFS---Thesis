import { ScenarioConfig, AlgorithmConfig } from '../types';

export const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'network',
    name: 'Network Routing',
    icon: '🌐',
    description:
      'A critical software update must be routed from the company\'s ISP uplink down through the enterprise network to all end devices across 3 floors. The network follows a real-world Cisco 3-tier architecture: Core Layer (ISP-1/ISP-2 → CORE-R1/CORE-R2) → Distribution Layer (Multilayer Switches) → Access Layer (VLAN-isolated Floor Switches for Sales, HR, Finance, Admin, ICT, and the Server Room). BFS broadcasts hop-by-hop; DFS dives deep into one VLAN first; Hybrid uses BFS across distribution tiers and DFS within each VLAN branch.',
    dynamicDescription: 'VLAN isolation and core router failover events mid-routing',
    sourceLabel: 'ISP Gateway',
    destinationLabel: 'End Device',
    obstacleLabel: 'Failed Component',
    color: '#3b82f6',
    rows: 21,
    cols: 21,
    startLabel: 'Data Center',
    exitLabel: 'Access Point',
  },
  {
    id: 'robotics',
    name: 'Robotics / Warehouse',
    icon: '🤖',
    description:
      'Autonomous robots navigate an Amazon-style fulfillment warehouse. The robot starts at the Central Depot and must deliver packages to all Delivery Bays across four warehouse zones. Shelves shift dynamically, blocking aisles mid-route.',
    dynamicDescription: 'Shelves shift and block aisles dynamically',
    sourceLabel: 'Central Depot',
    destinationLabel: 'Delivery Bay',
    obstacleLabel: 'Blocked Aisle',
    color: '#f59e0b',
    rows: 21,
    cols: 21,
    startLabel: 'Central Depot',
    exitLabel: 'Delivery Bay',
  },
  {
    id: 'traffic',
    name: 'Road Traffic',
    icon: '🚗',
    description:
      'Vehicles navigate a city road network from the City Center to highway exits. The road network includes major intersections, arterial streets, and on-ramps. Road closures and accidents create dynamic blockages forcing rerouting.',
    dynamicDescription: 'Road closures appear randomly during navigation',
    sourceLabel: 'City Center',
    destinationLabel: 'Highway Exit',
    obstacleLabel: 'Road Closure',
    color: '#10b981',
    rows: 21,
    cols: 21,
    startLabel: 'City Center',
    exitLabel: 'Highway Exit',
  },
  {
    id: 'evacuation',
    name: 'Emergency Evacuation',
    icon: '🔥',
    description:
      'People evacuate a multi-story building to reach ground-floor emergency exits. The building has stairwells, corridors and fire doors. Fire spreads dynamically, cutting off corridors and forcing alternate escape routes.',
    dynamicDescription: 'Fire spreads and blocks corridors in real-time',
    sourceLabel: 'Evacuation Zone',
    destinationLabel: 'Emergency Exit',
    obstacleLabel: 'Fire / Blocked',
    color: '#ef4444',
    rows: 21,
    cols: 21,
    startLabel: 'Evacuation Zone',
    exitLabel: 'Emergency Exit',
  },
  {
    id: 'gameai',
    name: 'Game AI Pathfinding',
    icon: '🎮',
    description:
      'A game AI agent evaluates board-game movement spaces across Turkish Draughts (Dama) and Checkers. The agent starts from a strategy planner and searches for the king row (winning target squares) while opponent pieces can block tiles dynamically using orthogonal Dama movement rules.',
    dynamicDescription: 'Opponent pieces and rule locks block board squares dynamically',
    sourceLabel: 'Strategy Planner',
    destinationLabel: 'Winning Square',
    obstacleLabel: 'Blocked Board Tile',
    color: '#8b5cf6',
    rows: 21,
    cols: 21,
    startLabel: 'Strategy Planner',
    exitLabel: 'Winning Square',
  },
];

export const ALGORITHMS: AlgorithmConfig[] = [
  {
    id: 'bfs',
    name: 'Standard BFS',
    description:
      'Breadth-First Search explores all neighbors level by level, guaranteeing the shortest path in hops. Uses a queue (FIFO). In network routing: broadcasts to all buildings simultaneously before going deeper — fair but may be slower to reach deep nodes.',
    color: '#22c55e',
    textColor: 'text-green-400',
    borderColor: 'border-green-500',
  },
  {
    id: 'dfs',
    name: 'Standard DFS',
    description:
      'Depth-First Search dives as deep as possible along one branch before backtracking. Uses a stack (LIFO). In network routing: fully saturates one building before moving to the next — fast locally but leaves others waiting.',
    color: '#a855f7',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500',
  },
  {
    id: 'hybrid',
    name: 'Hybrid BFS-DFS',
    description:
      'BFS at the macro level (between top-level hubs) and DFS at the micro level (within each sub-network). In network routing: broadcasts to all buildings simultaneously via BFS, then each building performs DFS internally — optimal parallelism.',
    color: '#f97316',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500',
  },
];

export const getScenario = (id: string) =>
  SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];

export const getAlgorithm = (id: string) =>
  ALGORITHMS.find((a) => a.id === id) ?? ALGORITHMS[0];

export const getScenarioById = (id: string): ScenarioConfig | undefined =>
  SCENARIOS.find((s) => s.id === id);
