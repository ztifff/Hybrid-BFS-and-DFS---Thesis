import React from 'react';
import { ScenarioType } from '../../types';
import { NODE_CONFIG, EDGE_CONFIG } from '../NetworkCanvas/types';
import { Trash2, MousePointer2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export type PlacementMode = 
  | { type: 'node', nodeType: string } 
  | { type: 'edge', edgeType: string, sourceNodeId?: string } 
  | { type: 'delete' } 
  | null;

interface TopologyEditorProps {
  scenario: ScenarioType;
  placementMode: PlacementMode;
  setPlacementMode: React.Dispatch<React.SetStateAction<PlacementMode>>;
  onClearGraph: () => void;
  disabled?: boolean;
}

const SCENARIO_NODES: Record<ScenarioType, string[]> = {
  network: ['router', 'multilayer_switch', 'access_switch', 'wireless_ap', 'end_device', 'server'],
  traffic: ['origin', 'highway', 'intersection', 'street'],
  robotics: ['depot', 'zone', 'shelf', 'delivery_bay'],
  evacuation: ['start', 'emergency_exit', 'corridor', 'stairwell'],
  gameai: ['strategy_planner', 'winning_square', 'board_tile']
};

const SCENARIO_EDGES: Record<ScenarioType, string[]> = {
  network: ['auto_connect', 'fiber', 'copper_straight', 'copper_crossover', 'serial', 'wireless'],
  traffic: ['road'],
  robotics: ['path'],
  evacuation: ['corridor', 'stairwell'],
  gameai: []
};

const getEdgeStrokeColor = (edgeType: string, isLight: boolean): string => {
  if (isLight) {
    if (edgeType === 'copper_straight' || edgeType === 'copper_crossover') return '#334155'; // Deep visible slate on white
    if (edgeType === 'fiber') return '#2563eb';
    if (edgeType === 'auto_connect') return '#d97706';
    if (edgeType === 'serial') return '#dc2626';
    if (edgeType === 'wireless') return '#0891b2';
    if (edgeType === 'road') return '#059669';
    if (edgeType === 'corridor') return '#e11d48';
    if (edgeType === 'path' || edgeType === 'stairwell') return '#7c3aed';
    return '#334155';
  }
  return EDGE_CONFIG[edgeType]?.color || '#ffffff';
};

export const TopologyEditor: React.FC<TopologyEditorProps> = ({
  scenario,
  placementMode,
  setPlacementMode,
  onClearGraph,
  disabled
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const nodes = SCENARIO_NODES[scenario] || [];
  const edges = SCENARIO_EDGES[scenario] || [];

  return (
    <div
      data-tutorial="tutorial-topology-editor"
      className={`shrink-0 rounded-xl p-4 flex flex-col gap-3 transition-all duration-300 border ${
        isLight
          ? (placementMode ? 'bg-white border-blue-500 shadow-md' : 'bg-white border-slate-200/90 shadow-sm')
          : (placementMode ? 'bg-[#0a0f1e] border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-[#0a0f1e] border-gray-700')
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className={`text-[10px] uppercase tracking-[0.2em] font-extrabold ${isLight ? 'text-slate-700' : 'text-gray-500'}`}>
          Topology Editor
        </div>
        <button
          onClick={onClearGraph}
          className={`text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
            isLight ? 'text-red-600 hover:text-red-700' : 'text-red-400 hover:text-red-300'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Map
        </button>
      </div>

      <div className="space-y-3">
        {/* Cursor / Delete Tools */}
        <div className="flex gap-2">
          <button 
            onClick={() => setPlacementMode(null)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              placementMode === null
                ? isLight
                  ? 'bg-blue-600 border-blue-600 !text-white shadow-sm'
                  : 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/30'
                : isLight
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-2xs'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            <MousePointer2 className="w-4 h-4" /> Select / Pan
          </button>
          <button 
            onClick={() => setPlacementMode({ type: 'delete' })}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              placementMode?.type === 'delete'
                ? isLight
                  ? 'bg-red-600 border-red-600 !text-white shadow-sm'
                  : 'bg-red-600 border-red-500 text-white shadow-md shadow-red-500/30'
                : isLight
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-2xs'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            <Trash2 className="w-4 h-4" /> Delete Tool
          </button>
        </div>

        {/* Nodes Palette */}
        <div>
          <div className={`text-[9px] uppercase tracking-widest mb-1.5 font-bold ${isLight ? 'text-slate-600' : 'text-gray-500'}`}>
            Devices / Nodes
          </div>
          <div className={`flex flex-wrap gap-2 p-2.5 rounded-lg border ${
            isLight ? 'bg-slate-100/70 border-slate-200/90' : 'bg-black/40 border-white/5'
          }`}>
            {nodes.map(nodeType => {
              const cfg = NODE_CONFIG[nodeType];
              const isActive = placementMode?.type === 'node' && placementMode.nodeType === nodeType;
              const tooltipTitle = `Add ${nodeType.replace('_', ' ')}`;
              return (
                <button
                  key={nodeType}
                  title={tooltipTitle}
                  onClick={() => setPlacementMode({ type: 'node', nodeType })}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all cursor-pointer ${
                    isActive
                      ? isLight
                        ? 'bg-blue-100 border-2 border-blue-600 shadow-md scale-105'
                        : 'bg-blue-900/80 border-2 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-110'
                      : isLight
                        ? 'bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-2xs'
                        : 'bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  {cfg?.icon || '⚪'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Edges Palette */}
        {edges.length > 0 && (
          <div>
            <div className={`text-[9px] uppercase tracking-widest mb-1.5 font-bold ${isLight ? 'text-slate-600' : 'text-gray-500'}`}>
              Connections / Links
            </div>
            <div className={`flex flex-wrap gap-2 p-2.5 rounded-lg border ${
              isLight ? 'bg-slate-100/70 border-slate-200/90' : 'bg-black/40 border-white/5'
            }`}>
              {edges.map(edgeType => {
                const cfg = EDGE_CONFIG[edgeType];
                const isActive = placementMode?.type === 'edge' && placementMode.edgeType === edgeType;
                const strokeColor = getEdgeStrokeColor(edgeType, isLight);
                return (
                  <button
                    key={edgeType}
                    title={`Connect via ${edgeType.replace('_', ' ')}`}
                    onClick={() => setPlacementMode({ type: 'edge', edgeType, sourceNodeId: undefined })}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? isLight
                          ? 'bg-blue-100 border-2 border-blue-600 shadow-md scale-105'
                          : 'bg-blue-900/80 border-2 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-110'
                        : isLight
                          ? 'bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-2xs'
                          : 'bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <line 
                        x1="4" y1="20" x2="20" y2="4" 
                        stroke={strokeColor} 
                        strokeWidth={cfg?.width || 2} 
                        strokeDasharray={cfg?.dash?.join(',')}
                      />
                    </svg>
                  </button>
                );
              })}
            </div>
            {placementMode?.type === 'edge' && !placementMode.sourceNodeId && (
              <div className={`text-xs mt-2 text-center animate-pulse font-bold ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
                Click a source node...
              </div>
            )}
            {placementMode?.type === 'edge' && placementMode.sourceNodeId && (
              <div className={`text-xs mt-2 text-center animate-pulse font-bold ${isLight ? 'text-emerald-700' : 'text-green-400'}`}>
                Click a target node...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
