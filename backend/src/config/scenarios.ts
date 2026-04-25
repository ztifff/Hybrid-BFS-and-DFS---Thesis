// ============================================================
// SCENARIOS CONFIG
// ============================================================

import { ScenarioConfig } from '../types/index';

export const scenarios: ScenarioConfig[] = [
  {
    id: 'datacenter-hybrid',
    name: 'Datacenter Network - Hybrid BFS/DFS',
    description: 'Simulates packet routing through a datacenter topology using a hybrid BFS-DFS approach.',
    networkType: 'datacenter',
    algorithm: 'Hybrid-BFS-DFS',
    startNode: 'core-1',
    targetNode: 'edge-9',
  },
  {
    id: 'aws-bfs',
    name: 'AWS Cloud Network - BFS',
    description: 'Explores AWS cloud infrastructure with Breadth-First Search to find shortest path.',
    networkType: 'aws',
    algorithm: 'BFS',
    startNode: 'us-east-1',
    targetNode: 'ap-southeast-1',
  },
  {
    id: 'traffic-dfs',
    name: 'Cabuyao Traffic - DFS',
    description: 'Depth-First Search traversal of the Cabuyao city traffic network for route planning.',
    networkType: 'traffic',
    algorithm: 'DFS',
    startNode: 'junction-A',
    targetNode: 'junction-Z',
  },
  {
    id: 'evacuation-bfs',
    name: 'Building Evacuation - BFS',
    description: 'BFS-based evacuation route finder for a multi-floor building emergency scenario.',
    networkType: 'evacuation',
    algorithm: 'BFS',
    startNode: 'floor-5-room-3',
    targetNode: 'exit-main',
  },
  {
    id: 'gameai-dfs',
    name: 'Elden Ring AI - DFS',
    description: 'Game AI pathfinding in an Elden Ring-inspired map using Depth-First Search.',
    networkType: 'gameai',
    algorithm: 'DFS',
    startNode: 'limgrave-start',
    targetNode: 'erdtree-base',
  },
  {
    id: 'robotics-hybrid',
    name: 'Robotics Navigation - Hybrid',
    description: 'Hybrid BFS-DFS path planning for autonomous robot navigation in a warehouse.',
    networkType: 'robotics',
    algorithm: 'Hybrid-BFS-DFS',
    startNode: 'robot-home',
    targetNode: 'target-shelf',
  },
  {
    id: 'mockoffice-bfs',
    name: 'Mock Office - BFS',
    description: 'Simulate office LAN network traversal using Breadth-First Search.',
    networkType: 'mockoffice',
    algorithm: 'BFS',
    startNode: 'router-main',
    targetNode: 'workstation-42',
  },
];

export const getScenarioById = (id: string): ScenarioConfig | undefined =>
  scenarios.find((s) => s.id === id);

export const getScenariosByNetwork = (networkType: string): ScenarioConfig[] =>
  scenarios.filter((s) => s.networkType === networkType);

export const getScenariosByAlgorithm = (algorithm: string): ScenarioConfig[] =>
  scenarios.filter((s) => s.algorithm === algorithm);