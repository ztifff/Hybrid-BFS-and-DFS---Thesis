import React, { useState, useEffect } from 'react';
import { ScenarioType } from '../../types';
import { NODE_CONFIG, EDGE_CONFIG } from '../NetworkCanvas/types';
import { Trash2, MousePointer2, Move, PenLine, Save, Undo2, Check, Star, RotateCcw } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getCiscoIconDataUrl, onCiscoIconsChange } from '../../utils/ciscoIcons';
import { EvacuationNodeIcon } from '../NetworkCanvas/evacuationNodeIcons';

export type PlacementMode =
  | { type: 'node', nodeType: string }
  | { type: 'edge', edgeType: string, sourceNodeId?: string }
  | { type: 'delete' }
  | { type: 'move' }
  | { type: 'rename' }
  | null;

interface TopologyEditorProps {
  scenario: ScenarioType;
  mapId?: string;
  placementMode: PlacementMode;
  setPlacementMode: React.Dispatch<React.SetStateAction<PlacementMode>>;
  onClearGraph: () => void;
  onSavePositions?: () => void;
  onSaveAsDefault?: () => void;
  onUndoSaveAsDefault?: () => void;
  defaultUndoSeconds?: number;
  onUndo?: () => void;
  onApplyManualEdits?: () => void;
  hasPendingManualEdits?: boolean;
  onResetLayout?: () => void;
  canResetLayout?: boolean;
  canUndo?: boolean;
  hasUnsavedChanges?: boolean;
  isSavedRecently?: boolean;
  isDefaultSavedRecently?: boolean;
  disabled?: boolean;
}

const SCENARIO_NODES: Record<ScenarioType, string[]> = {
  network: ['datacenter', 'router', 'multilayer_switch', 'access_switch', 'wireless_ap', 'end_device', 'server'],
  traffic: ['origin', 'highway', 'intersection', 'street'],
  robotics: ['depot', 'zone', 'shelf', 'delivery_bay'],
  evacuation: ['start', 'emergency_exit', 'corridor', 'stairwell', 'place', 'room', 'cinema'],
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
  mapId,
  placementMode,
  setPlacementMode,
  onClearGraph,
  onSavePositions,
  onSaveAsDefault,
  onUndoSaveAsDefault,
  defaultUndoSeconds = 0,
  onUndo,
  onApplyManualEdits,
  hasPendingManualEdits,
  onResetLayout,
  canResetLayout,
  canUndo,
  hasUnsavedChanges,
  isSavedRecently,
  isDefaultSavedRecently,
  disabled
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [, setIconTick] = useState(0);

  useEffect(() => {
    return onCiscoIconsChange(() => setIconTick(t => t + 1));
  }, []);

  const nodes = scenario === 'evacuation' && mapId === 'synthetic'
    ? SCENARIO_NODES[scenario].filter(nodeType => nodeType !== 'place')
    : scenario === 'robotics' && mapId === 'clinic'
      ? SCENARIO_NODES[scenario].filter(nodeType => nodeType !== 'shelf')
      : SCENARIO_NODES[scenario] || [];
  const edges = SCENARIO_EDGES[scenario] || [];

  const getBorderAndShadow = () => {
    if (!placementMode) {
      return isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-[#0a0f1e] border-gray-700';
    }
    if (placementMode.type === 'move') {
      return isLight ? 'bg-white border-indigo-500 shadow-md shadow-indigo-500/10' : 'bg-[#0a0f1e] border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]';
    }
    if (placementMode.type === 'rename') {
      return isLight ? 'bg-white border-amber-500 shadow-md shadow-amber-500/10' : 'bg-[#0a0f1e] border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
    }
    if (placementMode.type === 'delete') {
      return isLight ? 'bg-white border-red-500 shadow-md shadow-red-500/10' : 'bg-[#0a0f1e] border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
    }
    return isLight ? 'bg-white border-blue-500 shadow-md shadow-blue-500/10' : 'bg-[#0a0f1e] border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]';
  };

  return (
    <div
      data-tutorial="tutorial-topology-editor"
      className={`shrink-0 rounded-xl p-4 flex flex-col gap-3 transition-all duration-300 border ${getBorderAndShadow()} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className={`text-[10px] uppercase tracking-[0.2em] font-extrabold ${isLight ? 'text-slate-700' : 'text-gray-500'}`}>
          Topology Editor
        </div>
        <button
          onClick={onClearGraph}
          className={`text-xs flex items-center gap-1 font-semibold transition-colors cursor-pointer ${isLight ? 'text-red-600 hover:text-red-700' : 'text-red-400 hover:text-red-300'
            }`}
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Map
        </button>
      </div>

      {/* Save & Reset Positions Controls */}
      {onSavePositions && (
        <div className={`flex flex-col gap-1.5 p-2.5 rounded-lg border ${isLight ? 'bg-blue-50/60 border-blue-200' : 'bg-blue-950/20 border-blue-900/40'
          }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-blue-900' : 'text-blue-300'}`}>
              Node Layout Persistence
            </span>
            {hasUnsavedChanges && (
              <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                Unsaved edits
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSavePositions}
              disabled={disabled || hasPendingManualEdits}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm ${isSavedRecently
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30'
                : hasUnsavedChanges
                  ? isLight
                    ? 'bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-400/50 shadow-md shadow-blue-500/20'
                    : 'bg-blue-600 hover:bg-blue-500 text-white ring-2 ring-blue-400/40 shadow-blue-500/30'
                  : isLight
                    ? 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
                }`}
              title="Save all node positions to persist even after reloading the page"
            >
              {isSavedRecently ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Saved ✓</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Positions</span>
                </>
              )}
            </button>
            {onUndo && (
              <button
                type="button"
                onClick={onUndo}
                disabled={disabled || hasPendingManualEdits || !canUndo}
                className={`py-1.5 px-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${canUndo
                  ? isLight
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 shadow-2xs'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-blue-950/30 hover:text-blue-300 hover:border-blue-800/60'
                  : 'opacity-35 pointer-events-none border-transparent text-gray-500'
                  }`}
                title="Undo the most recent topology edit"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
            )}
          </div>
          {onSaveAsDefault && (
            <>
              <button
                type="button"
                onClick={onSaveAsDefault}
                disabled={disabled || hasPendingManualEdits}
                className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm ${isLight
                  ? 'bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800'
                  : 'bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/50 text-amber-300'
                  }`}
                title="Make this topology the default restored by Reset Layout"
              >
                {isDefaultSavedRecently ? <Check className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                <span>{isDefaultSavedRecently ? 'Default Saved ✓' : 'Save as Default'}</span>
              </button>
              {defaultUndoSeconds > 0 && onUndoSaveAsDefault && (
                <button
                  type="button"
                  onClick={onUndoSaveAsDefault}
                  className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer border ${isLight
                    ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800'
                    : 'bg-blue-950/30 hover:bg-blue-900/40 border-blue-800/50 text-blue-300'
                    }`}
                  title="Restore the previous default layout"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo Save · {defaultUndoSeconds}s</span>
                </button>
              )}
            </>
          )}
          {canResetLayout && onResetLayout && (
            <button
              type="button"
              onClick={onResetLayout}
              disabled={disabled}
              className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${isLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300 shadow-2xs'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-red-950/30 hover:text-red-300 hover:border-red-800/60'
                }`}
              title="Reset the map layout to its default positions"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Layout</span>
            </button>
          )}
          <span className={`text-[9px] leading-tight ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
            Saved layouts persist after reload. Reset restores the saved default.
          </span>
        </div>
      )}

      <div className="space-y-3">
        {/* Action Tools: Select/Pan, Move, Rename, Delete */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPlacementMode(null)}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${placementMode === null
              ? isLight
                ? 'bg-blue-600 border-blue-600 !text-white shadow-sm'
                : 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/30'
              : isLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-2xs'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
          >
            <MousePointer2 className="w-3.5 h-3.5 shrink-0" /> Select / Pan
          </button>
          <button
            type="button"
            onClick={() => setPlacementMode({ type: 'move' })}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${placementMode?.type === 'move'
              ? isLight
                ? 'bg-indigo-600 border-indigo-600 !text-white shadow-sm'
                : 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/30'
              : isLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-2xs'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
          >
            <Move className="w-3.5 h-3.5 shrink-0" /> Move Node
          </button>
          <button
            type="button"
            onClick={() => setPlacementMode({ type: 'rename' })}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${placementMode?.type === 'rename'
              ? isLight
                ? 'bg-amber-600 border-amber-600 !text-white shadow-sm'
                : 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-500/30'
              : isLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-2xs'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
          >
            <PenLine className="w-3.5 h-3.5 shrink-0" /> Rename
          </button>
          <button
            type="button"
            onClick={() => setPlacementMode({ type: 'delete' })}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${placementMode?.type === 'delete'
              ? isLight
                ? 'bg-red-600 border-red-600 !text-white shadow-sm'
                : 'bg-red-600 border-red-500 text-white shadow-md shadow-red-500/30'
              : isLight
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-2xs'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" /> Delete Tool
          </button>
        </div>

        {/* Dynamic Mode Helper Hint */}
        {placementMode?.type === 'move' && (
          <div className={`text-xs text-center font-bold animate-pulse ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`}>
            Drag any node to move freely...
          </div>
        )}
        {placementMode?.type === 'rename' && (
          <div className={`text-xs text-center font-bold animate-pulse ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
            Click any node to rename it...
          </div>
        )}
        {placementMode?.type === 'delete' && (
          <div className={`text-xs text-center font-bold animate-pulse ${isLight ? 'text-red-700' : 'text-red-400'}`}>
            Click a node or link to delete...
          </div>
        )}

        {/* Nodes Palette */}
        <div>
          <div className={`text-[9px] uppercase tracking-widest mb-1.5 font-bold ${isLight ? 'text-slate-600' : 'text-gray-500'}`}>
            Devices / Nodes
          </div>
          <div className={`flex flex-wrap gap-2 p-2.5 rounded-lg border ${isLight ? 'bg-slate-100/70 border-slate-200/90' : 'bg-black/40 border-white/5'
            }`}>
            {nodes.map(nodeType => {
              const cfg = NODE_CONFIG[nodeType];
              const isActive = placementMode?.type === 'node' && placementMode.nodeType === nodeType;
              const tooltipTitle = `Add ${nodeType.replace('_', ' ')}`;
              return (
                <button
                  key={nodeType}
                  title={tooltipTitle}
                  draggable={!disabled}
                  onClick={() => setPlacementMode({ type: 'node', nodeType })}
                  onDragStart={(event) => {
                    event.dataTransfer.setData('application/x-topology-node-type', nodeType);
                    event.dataTransfer.effectAllowed = 'copy';
                    setPlacementMode({ type: 'node', nodeType });
                  }}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all cursor-pointer ${isActive
                    ? isLight
                      ? 'bg-blue-100 border-2 border-blue-600 shadow-md scale-105'
                      : 'bg-blue-900/80 border-2 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-110'
                    : isLight
                      ? 'bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-2xs'
                      : 'bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-gray-500'
                    }`}
                >
                  {scenario === 'evacuation' ? (
                    <EvacuationNodeIcon
                      type={cfg?.icon ?? nodeType}
                      size={25}
                      color={isActive ? '#1d4ed8' : (isLight ? '#334155' : '#cbd5e1')}
                      strokeWidth={1.8}
                      filter={isLight ? 'none' : 'invert(1)'}
                    />
                  ) : cfg?.iconImg ? (
                    <img
                      src={getCiscoIconDataUrl(cfg.iconImg)}
                      alt={nodeType}
                      className={`w-6 h-6 object-contain ${scenario === 'robotics' ? 'bg-white rounded p-0.5' : ''}`}
                    />
                  ) : (
                    cfg?.icon || '⚪'
                  )}
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
            <div className={`flex flex-wrap gap-2 p-2.5 rounded-lg border ${isLight ? 'bg-slate-100/70 border-slate-200/90' : 'bg-black/40 border-white/5'
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
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all cursor-pointer ${isActive
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
        {hasPendingManualEdits && onApplyManualEdits && (
          <button
            type="button"
            onClick={onApplyManualEdits}
            disabled={disabled}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-colors cursor-pointer"
            title="Apply all staged canvas edits and recalculate once"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Canvas Changes</span>
          </button>
        )}
      </div>
    </div>
  );
};
