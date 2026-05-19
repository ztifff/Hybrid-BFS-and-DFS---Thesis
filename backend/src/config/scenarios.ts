import { ScenarioConfig, AlgorithmConfig } from '../types';

export const SCENARIOS: ScenarioConfig[] = [
  {
    id: 'network',
    name: 'Network Routing',
    icon: '🌐',
    description:
      'A security patch is pushed from the Main Data Center to all Wi-Fi Access Points across the Innovatech Corporate Campus. Three buildings (Engineering, Research, Admin) are connected via fiber optic links. BFS broadcasts level-by-level; DFS dives deep into one branch first; Hybrid uses BFS between buildings and DFS within each building.',
    dynamicDescription: 'Router nodes fail randomly during patch delivery',
    sourceLabel: 'Data Center',
    destinationLabel: 'Access Point',
    obstacleLabel: 'Failed Router',
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
      'People evacuate a multi-story office building to reach ground-floor emergency exits. The building has stairwells, corridors and fire doors. Fire spreads dynamically, cutting off corridors and forcing alternate escape routes.',
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
      'A game AI agent navigates a dungeon complex from the Spawn Room to goal Portals. The dungeon has interconnected rooms, corridors, and secret passages. Enemy spawns and destructible terrain create dynamic environmental changes.',
    dynamicDescription: 'Enemies spawn and terrain changes dynamically',
    sourceLabel: 'Spawn Room',
    destinationLabel: 'Goal Portal',
    obstacleLabel: 'Enemy Blocked',
    color: '#8b5cf6',
    rows: 21,
    cols: 21,
    startLabel: 'Spawn Room',
    exitLabel: 'Goal Portal',
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
