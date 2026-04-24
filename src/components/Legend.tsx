import React from 'react';
import { AlgorithmType, ScenarioType } from '../types';
import { getAlgorithm } from '../config/scenarios';

interface Props {
  algorithm: AlgorithmType;
  scenario: ScenarioType;
}

interface LegendItem {
  color: string;
  label: string;
  icon?: string;
  dashed?: boolean;
}

const SCENARIO_NODE_ITEMS: Record<ScenarioType, LegendItem[]> = {
  network: [
    { color: '#1e40af', label: 'Data Center (Source)',  icon: '🖥️' },
    { color: '#1d4ed8', label: 'Building / Core Router', icon: '📡' },
    { color: '#2563eb', label: 'Floor / Edge Switch',    icon: '🔀' },
    { color: '#3b82f6', label: 'Access Point / Server (Target)', icon: '📶' },
    { color: '#450a0a', label: 'Failed Component',       icon: '💀' },
  ],
  robotics: [
    { color: '#92400e', label: 'Central Depot (Source)', icon: '🏭' },
    { color: '#b45309', label: 'Warehouse Zone',         icon: '📦' },
    { color: '#d97706', label: 'Aisle',                  icon: '🔧' },
    { color: '#f59e0b', label: 'Delivery Bay (Target)',  icon: '📫' },
    { color: '#450a0a', label: 'Blocked Aisle',          icon: '🚧' },
  ],
  traffic: [
    { color: '#065f46', label: 'City Center (Source)', icon: '🏙️' },
    { color: '#047857', label: 'Highway Exit (Target)', icon: '🛣️' },
    { color: '#059669', label: 'Intersection',          icon: '🚦' },
    { color: '#10b981', label: 'Street',                icon: '🚗' },
    { color: '#450a0a', label: 'Road Closure',          icon: '🚫' },
  ],
  evacuation: [
    { color: '#991b1b', label: 'Evacuation Zone (Source)', icon: '🧑' },
    { color: '#b91c1c', label: 'Emergency Exit (Target)',   icon: '🚪' },
    { color: '#dc2626', label: 'Corridor',                  icon: '🚶' },
    { color: '#ef4444', label: 'Stairwell',                 icon: '🪜' },
    { color: '#450a0a', label: 'Fire Blocked',              icon: '🔥' },
  ],
  gameai: [
    { color: '#4c1d95', label: 'Spawn Room (Source)', icon: '⚔️' },
    { color: '#6d28d9', label: 'Goal Portal (Target)', icon: '🌀' },
    { color: '#7c3aed', label: 'Room / Corridor',     icon: '🏛️' },
    { color: '#450a0a', label: 'Enemy Blocked',       icon: '👹' },
  ],
};

const EDGE_ITEMS: Record<ScenarioType, LegendItem[]> = {
  network: [
    { color: '#60a5fa', label: 'Fiber Optic (1-2ms)' },
    { color: '#94a3b8', label: 'Ethernet (5ms)', dashed: false },
    { color: '#fdba74', label: 'Copper (1ms)', dashed: true },
  ],
  robotics: [
    { color: '#c4b5fd', label: 'Robot Path (2-5m)' },
  ],
  traffic: [
    { color: '#6ee7b7', label: 'Road / Street' },
  ],
  evacuation: [
    { color: '#fca5a5', label: 'Corridor', dashed: true },
    { color: '#c4b5fd', label: 'Stairwell Descent' },
  ],
  gameai: [
    { color: '#fca5a5', label: 'Corridor', dashed: true },
    { color: '#fdba74', label: 'Secret Passage', dashed: true },
    { color: '#c4b5fd', label: 'Room Path' },
  ],
};

export const Legend: React.FC<Props> = ({ algorithm, scenario }) => {
  const al = getAlgorithm(algorithm);

  const exploredColor =
    algorithm === 'bfs' ? '#166534' : algorithm === 'dfs' ? '#4c1d95' : '#7c2d12';

  const nodeItems = SCENARIO_NODE_ITEMS[scenario] ?? [];
  const edgeItems = EDGE_ITEMS[scenario] ?? [];

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-4">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
        Legend
      </h3>

      {/* Node types */}
      <div>
        <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Nodes</p>
        <div className="space-y-1.5">
          {nodeItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: item.color, border: '1.5px solid #555' }}
              >
                {item.icon}
              </div>
              <span className="text-xs text-gray-300">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Edge types */}
      {edgeItems.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Edges</p>
          <div className="space-y-1.5">
            {edgeItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <svg width="22" height="10">
                  <line
                    x1="0" y1="5" x2="22" y2="5"
                    stroke={item.color}
                    strokeWidth="2"
                    strokeDasharray={item.dashed ? '4,3' : undefined}
                  />
                </svg>
                <span className="text-xs text-gray-300">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Algorithm state colors */}
      <div>
        <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">
          {al.name} States
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: al.color, backgroundColor: '#fff' }} />
            <span className="text-xs text-gray-300">Current Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: al.color }} />
            <span className="text-xs text-gray-300">On Optimal Path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: exploredColor }} />
            <span className="text-xs text-gray-300">Explored</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: al.color + '33', borderColor: al.color + '88' }} />
            <span className="text-xs text-gray-300">Frontier</span>
          </div>
        </div>
      </div>
    </div>
  );
};