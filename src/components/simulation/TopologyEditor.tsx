import React from 'react';
import { ScenarioType } from '../../types';
import { NODE_CONFIG, EDGE_CONFIG } from '../NetworkCanvas/types';
import { Trash2, MousePointer2 } from 'lucide-react';

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

export const TopologyEditor: React.FC<TopologyEditorProps> = ({
  scenario,
  placementMode,
  setPlacementMode,
  onClearGraph,
  disabled
}) => {
  const nodes = SCENARIO_NODES[scenario] || [];
  const edges = SCENARIO_EDGES[scenario] || [];

  return (
    <div className={`shrink-0 bg-[#0a0f1e] border ${placementMode ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-gray-700'} rounded-xl p-4 flex flex-col gap-3 transition-all duration-300 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Topology Editor</div>
        <button onClick={onClearGraph} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Trash2 className="w-3 h-3"/> Clear Map</button>
      </div>

      <div className="space-y-3">
        {/* Cursor / Delete Tools */}
        <div className="flex gap-2">
          <button 
            onClick={() => setPlacementMode(null)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${placementMode === null ? 'bg-blue-900/50 border-blue-500 text-blue-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
          >
            <MousePointer2 className="w-4 h-4" /> Select / Pan
          </button>
          <button 
            onClick={() => setPlacementMode({ type: 'delete' })}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${placementMode?.type === 'delete' ? 'bg-red-900/50 border-red-500 text-red-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200'}`}
          >
            <Trash2 className="w-4 h-4" /> Delete Tool
          </button>
        </div>

        {/* Nodes Palette */}
        <div>
          <div className="text-[9px] uppercase tracking-widest text-gray-500 mb-1.5 font-semibold">Devices / Nodes</div>
          <div className="flex flex-wrap gap-2 bg-black/40 p-2.5 rounded-lg border border-white/5">
            {nodes.map(nodeType => {
              const cfg = NODE_CONFIG[nodeType];
              const isActive = placementMode?.type === 'node' && placementMode.nodeType === nodeType;
              const tooltipTitle = `Add ${nodeType.replace('_', ' ')}`;
              return (
                <button
                  key={nodeType}
                  title={tooltipTitle}
                  onClick={() => setPlacementMode({ type: 'node', nodeType })}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${isActive ? 'bg-blue-900/80 border-2 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-110' : 'bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-gray-500'}`}
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
            <div className="text-[9px] uppercase tracking-widest text-gray-500 mb-1.5 font-semibold">Connections / Links</div>
            <div className="flex flex-wrap gap-2 bg-black/40 p-2.5 rounded-lg border border-white/5">
              {edges.map(edgeType => {
                const cfg = EDGE_CONFIG[edgeType];
                const isActive = placementMode?.type === 'edge' && placementMode.edgeType === edgeType;
                return (
                  <button
                    key={edgeType}
                    title={`Connect via ${edgeType.replace('_', ' ')}`}
                    onClick={() => setPlacementMode({ type: 'edge', edgeType, sourceNodeId: undefined })}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-blue-900/80 border-2 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-110' : 'bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-gray-500'}`}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24">
                      <line 
                        x1="4" y1="20" x2="20" y2="4" 
                        stroke={cfg?.color || '#fff'} 
                        strokeWidth={cfg?.width || 2} 
                        strokeDasharray={cfg?.dash?.join(',')}
                      />
                    </svg>
                  </button>
                );
              })}
            </div>
            {placementMode?.type === 'edge' && !placementMode.sourceNodeId && (
              <div className="text-xs text-blue-400 mt-2 text-center animate-pulse font-medium">Click a source node...</div>
            )}
            {placementMode?.type === 'edge' && placementMode.sourceNodeId && (
              <div className="text-xs text-green-400 mt-2 text-center animate-pulse font-medium">Click a target node...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
