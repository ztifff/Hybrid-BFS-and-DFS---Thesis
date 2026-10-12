import React from 'react';
import { ScenarioType } from '../types';
import { ALGORITHMS } from '../config/scenarios';
import { useTheme } from '../context/ThemeContext';

interface Props {
  scenario: ScenarioType;
  mapId?: string;
}

interface LegendItem {
  color: string;
  label: string;
  icon?: string;
  dashed?: boolean;
  type?: string;
}

const SCENARIO_NODE_ITEMS: Record<ScenarioType, LegendItem[]> = {
  network: [
    { color: '#1e40af', label: 'Core Router / ISP', icon: '🌐' },
    { color: '#1d4ed8', label: 'Multilayer Switch', icon: '🎛️' },
    { color: '#2563eb', label: 'Access / Floor Switch', icon: '🔌' },
    { color: '#10b981', label: 'Wireless Access Point', icon: '📡' },
    { color: '#0ea5e9', label: 'End Device (PC/Laptop)', icon: '💻' },
    { color: '#475569', label: 'Server', icon: '🗄️' },
    { color: '#450a0a', label: 'Failed Component', icon: '💥' },
  ],
  robotics: [
    { color: '#92400e', label: 'Central Depot (Source)', icon: '🏭' },
    { color: '#b45309', label: 'Warehouse Zone', icon: '📦' },
    { color: '#d97706', label: 'Shelf', icon: '🔧' },
    { color: '#f59e0b', label: 'Delivery Bay (Target)', icon: '🚚' },
    { color: '#450a0a', label: 'Blocked Aisle', icon: '🚧' },
  ],
  traffic: [
    { color: '#065f46', label: 'Starting Point', icon: '🏙️' },
    { color: '#047857', label: 'Destination', icon: '🛣️' },
    { color: '#059669', label: 'Intersection', icon: '🚦' },
    { color: '#10b981', label: 'Street', icon: '🚗' },
    { color: '#450a0a', label: 'Road Closure', icon: '🚫' },
  ],
  evacuation: [
    { color: '#0e7490', label: 'Real-World Place (Source)', icon: '🏬' },
    { color: '#b91c1c', label: 'Emergency Exit (Target)', icon: '🚪' },
    { color: '#dc2626', label: 'Corridor', icon: '🚶' },
    { color: '#ef4444', label: 'Stairwell', icon: '🪜' },
    { color: '#7f1d1d', label: 'Route Blocked', icon: '⛔' },
  ],
  gameai: [
    { color: '#9333ea', label: 'Strategy Planner (Source)', icon: '🔵' },
    { color: '#dc2626', label: 'Winning Square / King Row', icon: '🏁' },
    { color: '#64748b', label: 'Board Tile (Dama Square)', icon: '⚪' },
    { color: '#ef4444', label: 'Opponent Piece (Blocked)', icon: '🔴' },
  ],
};

const EDGE_ITEMS: Record<ScenarioType, LegendItem[]> = {
  network: [
    { color: '#60a5fa', label: 'Fiber Optic' },
    { color: '#cbd5e1', label: 'Copper Straight-Through' },
    { color: '#cbd5e1', label: 'Copper Cross-Over', dashed: true },
    { color: '#dc2626', label: 'Serial / WAN', type: 'serial' },
    { color: '#06b6d4', label: 'Wireless', dashed: true },
  ],
  robotics: [
    { color: '#c4b5fd', label: 'Robot Path' },
  ],
  traffic: [
    { color: '#6ee7b7', label: 'Road / Street' },
  ],
  evacuation: [
    { color: '#fca5a5', label: 'Corridor', dashed: true },
    { color: '#c4b5fd', label: 'Stairwell Descent' },
  ],
  gameai: [
    { color: '#c4b5fd', label: 'Man Move (forward / lateral)' },
  ],
};

export const Legend: React.FC<Props> = ({ scenario, mapId }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const rawItems = SCENARIO_NODE_ITEMS[scenario] ?? [];
  // For gameai: replace the generic icons with the board-appropriate icons
  const nodeItems = scenario === 'gameai'
    ? rawItems.map(item => {
      if (item.label === 'Opponent Piece (Blocked)') {
        return { ...item, icon: mapId === 'dama' ? '🔻' : '🔴' };
      }
      if (item.label === 'Strategy Planner (Source)') {
        return { ...item, icon: mapId === 'dama' ? '🔷' : '🔵' };
      }
      return item;
    })
    : rawItems;

  const edgeItems = (EDGE_ITEMS[scenario] ?? []).map(item => {
    // In light mode, pale slate/white-ish copper cables blend into white background
    if (isLight && (item.label.includes('Copper') || item.color === '#cbd5e1')) {
      return { ...item, color: '#334155' };
    }
    return item;
  });

  const cBFS = ALGORITHMS.find(a => a.id === 'bfs')?.color || '#4ade80';
  const cDFS = ALGORITHMS.find(a => a.id === 'dfs')?.color || '#c084fc';
  const cHYB = ALGORITHMS.find(a => a.id === 'hybrid')?.color || '#fb923c';

  return (
    <div className={`rounded-xl p-4 space-y-4 shrink-0 fade-in border transition-colors duration-500 ${
      isLight
        ? 'bg-white border-slate-200/90 text-slate-800 shadow-sm hover:border-blue-400'
        : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-blue-500'
    }`}>
      <h3 className={`text-xs font-bold uppercase tracking-wider text-center ${
        isLight ? 'text-slate-700' : 'text-gray-400'
      }`}>
        Legend
      </h3>

      <div>
        <p className={`text-xs font-semibold mb-2 uppercase tracking-wide ${
          isLight ? 'text-slate-500' : 'text-gray-500'
        }`}>Environment Nodes</p>
        <div className="space-y-1.5">
          {nodeItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                style={{
                  backgroundColor: item.color,
                  border: isLight ? '1.5px solid rgba(0,0,0,0.15)' : '1.5px solid #555'
                }}
              >
                {item.icon}
              </div>
              <span className={`text-xs leading-tight ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                {item.label}
              </span>
            </div>
          ))}

          {/* Explored Nodes Bead explanation */}
          <div className={`flex items-center gap-2 pt-2 border-t mt-2 ${
            isLight ? 'border-slate-200' : 'border-gray-700/50'
          }`}>
            <svg width="24" height="24" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" fill={cBFS} stroke={isLight ? '#334155' : '#fff'} strokeWidth="1.5" />
              <circle cx="12" cy="12" r="6" fill={cDFS} stroke={isLight ? '#334155' : '#fff'} strokeWidth="1" />
              <circle cx="12" cy="12" r="2.5" fill={cHYB} stroke={isLight ? '#334155' : '#fff'} strokeWidth="0.5" />
            </svg>
            <span className={`text-xs leading-tight italic ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
              Explored Nodes (Stacked by Alg.)
            </span>
          </div>
        </div>
      </div>

      {edgeItems.length > 0 && (
        <div>
          <p className={`text-xs font-semibold mb-2 uppercase tracking-wide ${
            isLight ? 'text-slate-500' : 'text-gray-500'
          }`}>Environment Edges</p>
          <div className="space-y-1.5">
            {edgeItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <svg width="22" height="10" className="flex-shrink-0">
                  {item.type === 'serial' ? (
                    <path d="M 0 5 L 7 2 L 15 8 L 22 5" fill="none" stroke={item.color} strokeWidth="2" strokeLinejoin="bevel" />
                  ) : (
                    <line x1="0" y1="5" x2="22" y2="5" stroke={item.color} strokeWidth="2" strokeDasharray={item.dashed ? '4,3' : undefined} />
                  )}
                </svg>
                <span className={`text-xs leading-tight font-medium ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className={`text-xs font-semibold mb-2 uppercase tracking-wide ${
          isLight ? 'text-slate-500' : 'text-gray-500'
        }`}>
          Algorithms
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <svg width="22" height="10" className="flex-shrink-0"><line x1="0" y1="5" x2="22" y2="5" stroke={cBFS} strokeWidth="6" strokeLinecap="round" /></svg>
            <span className={`text-xs leading-tight ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>BFS Path (Outer Layer)</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="22" height="10" className="flex-shrink-0"><line x1="0" y1="5" x2="22" y2="5" stroke={cDFS} strokeWidth="4" strokeLinecap="round" /></svg>
            <span className={`text-xs leading-tight ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>DFS Path (Middle Layer)</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="22" height="10" className="flex-shrink-0"><line x1="0" y1="5" x2="22" y2="5" stroke={cHYB} strokeWidth="2" strokeLinecap="round" /></svg>
            <span className={`text-xs leading-tight ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>Hybrid Path (Inner Layer)</span>
          </div>
          <div className="flex items-center gap-2 pt-1.5">
            <div className="flex -space-x-2 flex-shrink-0">
              <div className="w-4 h-4 rounded-full border-2 z-10" style={{ borderColor: cBFS, backgroundColor: isLight ? '#f1f5f9' : '#111827' }} />
              <div className="w-4 h-4 rounded-full border-2 z-20" style={{ borderColor: cDFS, backgroundColor: isLight ? '#f1f5f9' : '#111827' }} />
              <div className="w-4 h-4 rounded-full border-2 z-30" style={{ borderColor: cHYB, backgroundColor: isLight ? '#f1f5f9' : '#111827' }} />
            </div>
            <span className={`text-xs ml-1 leading-tight ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>Active Search Heads</span>
          </div>
        </div>
      </div>
    </div>
  );
};
