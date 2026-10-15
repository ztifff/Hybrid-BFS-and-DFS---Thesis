import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TutorialOverlay } from '../TutorialOverlay';

import { ScenarioGraph, ScenarioType } from '../../types';
import { useSimulation } from '../../hooks/useSimulation';
import { useSimulationViewLogic } from '../../hooks/useSimulationViewLogic';
import { MAX_SYNTHETIC_NODES, MIN_SYNTHETIC_NODES, MIN_SYNTHETIC_LINKS, MAX_SYNTHETIC_LINKS, GAME_AI_BOARDS, SizingKey } from '../../hooks/useSimulationModel';
import { getScenario } from '../../config/scenarios';
import { CiscoTerminal } from '../NetworkCanvas/renderers/scenarios/network/CiscoTerminal';
import { MAP_REGISTRY } from '../../config/mapRegistry';

import { NetworkCanvas } from '../../components/NetworkCanvas';
import { MetricsPanel } from './MetricsPanel';
import { Network, Bot, Car, Flame, Gamepad2 } from '../../components/icons';
import { Legend } from '../../components/Legend';
import { SimulationReport } from './SimulationReport';
import { HistoryModal } from '../../components/HistoryModal';
import { DynamicMapEvents } from './DynamicMapEvents';
import { StrategyMapEvents } from './StrategyMapEvents';
import { HelpModal } from '../../components/HelpModal';
import { RobotAssignmentPanel } from './RobotAssignmentPanel';
import { RobotLiveStatusPanel } from './RobotLiveStatusPanel';
import { ResizableSidebar } from '../layout/ResizableSidebar';
import { ExpertModePanel } from './ExpertModePanel';
import { TopologyEditor } from './TopologyEditor';
import { ThemeToggle } from '../ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { PenLine, Move, Save, Check, RotateCcw } from 'lucide-react';

const SIZE_ADJUSTER_THEME: Record<string, { border: string; text: string }> = {
  robotics: { border: 'focus-within:border-orange-500', text: 'text-orange-300' },
  traffic: { border: 'focus-within:border-emerald-500', text: 'text-emerald-300' },
  evacuation: { border: 'focus-within:border-red-500', text: 'text-red-300' },
  gameai: { border: 'focus-within:border-purple-500', text: 'text-purple-300' },
  network: { border: 'focus-within:border-blue-500', text: 'text-blue-300' },
};

interface Props {
  scenario: ScenarioType;
  onBack: () => void;
}

// ── Small inline icon helper (no extra dependency) ───────────────────────────
const ICON_PATHS: Record<string, string> = {
  block: 'M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  reroll: 'M12 2l9 5v10l-9 5-9-5V7l9-5zM12 12l9-5M12 12v10M12 12L3 7',
  reset: 'M4 4v6h6M20 20v-6h-6M20 9A8 8 0 006 6.3M4 15a8 8 0 0014 2.7',
  back: 'M19 5L9 12l10 7V5zM5 5v14',
  fwd: 'M5 5l10 7-10 7V5zM19 5v14',
  skip: 'M5 5l10 7-10 7V5zM19 5v14',
  play: 'M6 4l14 8-14 8V4z',
  pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
};

function Ico({ name, className = 'w-4 h-4' }: { name: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

function CrosshairIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="12" cy="12" r="6" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </svg>
  );
}

// ── Endpoint chip: the whole chip is the button ──────────────────────────────
function EndpointChip({
  label, labelClass, dotClass, borderClass, value, active, disabled, onPick,
}: {
  label: string;
  labelClass: string;
  dotClass: string;
  borderClass: string;
  value: string;
  active: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="flex items-center gap-2">
      <span className={`text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 ${labelClass}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass} opacity-0 sm:opacity-100`} />
        {label}:
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={onPick}
        title={active ? 'Click to cancel picking' : 'Click to pick on map'}
        className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 text-left transition-all cursor-pointer
          hover:-translate-y-0.5 active:scale-[0.98]
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0
          ${borderClass} 
          ${isLight
            ? active
              ? 'ring-2 ring-cyan-500 bg-cyan-100 text-cyan-950 font-bold shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-800 shadow-sm'
            : active
              ? 'ring-2 ring-cyan-400/60 bg-cyan-950/40 text-white'
              : 'bg-gray-800/80 hover:bg-gray-700/80 text-white'
          }`}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass} ${active ? 'animate-pulse' : ''}`} />
        <span className={`text-xs font-bold truncate max-w-[180px] ${isLight ? 'text-slate-900' : 'text-white'}`}>{value}</span>
      </button>
    </div>
  );
}

function SpeedController({
  playbackSpeed,
  handleSpeedChange,
  scenario
}: {
  playbackSpeed: number;
  handleSpeedChange: (speed: number) => void;
  scenario: string;
}) {
  const [inputValue, setInputValue] = useState(playbackSpeed.toFixed(1));

  useEffect(() => {
    setInputValue(playbackSpeed.toFixed(1));
  }, [playbackSpeed]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      handleSpeedChange(val);
    }
  };

  const handleBlur = () => {
    let val = parseFloat(inputValue);
    if (isNaN(val)) val = 1;
    val = Math.max(0.1, Math.min(4, val));
    handleSpeedChange(val);
    setInputValue(val.toFixed(1));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    handleSpeedChange(val);
    setInputValue(val.toFixed(1));
  };

  return (
    <div className="flex items-center gap-3 text-xs text-gray-400 bg-[#0a0f1e]/80 border border-white/10 px-4 py-1.5 rounded-full shadow-inner backdrop-blur-sm">
      <span className="uppercase tracking-wider font-semibold">Speed</span>
      <input
        type="range"
        min="0.1" max="4" step="0.1"
        value={playbackSpeed}
        onChange={handleSliderChange}
        className={`w-32 cursor-pointer transition-all ${scenario === 'network' ? 'accent-blue-500' :
          scenario === 'robotics' ? 'accent-amber-500' :
            scenario === 'traffic' ? 'accent-emerald-500' :
              scenario === 'evacuation' ? 'accent-red-500' :
                scenario === 'gameai' ? 'accent-purple-500' : 'accent-blue-500'
          }`}
      />
      <div className="flex items-center w-14 justify-end text-white font-bold font-mono">
        <input
          type="number"
          min="0.1" max="4" step="0.1"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-10 bg-transparent text-right outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span>x</span>
      </div>
    </div>
  );
}

export const SimulationView: React.FC<Props> = ({ scenario, onBack }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const sc = getScenario(scenario);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [workspaceView, setWorkspaceView] = useState<'physical' | 'logical'>('physical');

  const showConnectionError = (msg: string) => {
    setConnectionError(msg);
    setTimeout(() => setConnectionError(null), 3000);
  };
  const sim = useSimulation({ scenario, onBack });

  // All local UI state + endpoint picking + blockage brush + button styles live in the hook.
  const {
    highlightedNodeId, setHighlightedNodeId,
    terminalNodeId, setTerminalNodeId,
    isHelpOpen, setIsHelpOpen,
    isBlockageMode, setIsBlockageMode,
    blockageBrush, setBlockageBrush,
    draftBlockedNodes, setDraftBlockedNodes,
    placementMode, setPlacementMode,
    pickMode, pickDraft, pickToast,
    tutorial,
    handleEventClick,
    nodeLabel,
    supportsDestPick,
    minDestinations,
    currentSourceId,
    currentDestIds,
    pickRuleText,
    startPicking,
    cancelPicking,
    finishPicking,
    handlePickClick,
    patchedGraph,
    BLOCKAGE_LABELS,
    previewDynamicEvents,
    scenarioBtnClass,
    activeTabClass,
    primaryBtnClass,
    pickDisabled,
  } = useSimulationViewLogic(scenario, sim);

  const getMapTabButtonClass = (isActive: boolean) => {
    if (isActive) {
      if (isLight) {
        switch (scenario) {
          case 'network': return 'bg-blue-600 border-blue-600 !text-white shadow-sm ring-1 ring-blue-500/20';
          case 'robotics': return 'bg-orange-600 border-orange-600 !text-white shadow-sm ring-1 ring-orange-500/20';
          case 'traffic': return 'bg-emerald-600 border-emerald-600 !text-white shadow-sm ring-1 ring-emerald-500/20';
          case 'evacuation': return 'bg-red-600 border-red-600 !text-white shadow-sm ring-1 ring-red-500/20';
          case 'gameai': return 'bg-purple-600 border-purple-600 !text-white shadow-sm ring-1 ring-purple-500/20';
          default: return 'bg-blue-600 border-blue-600 !text-white shadow-sm';
        }
      } else {
        switch (scenario) {
          case 'network': return 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/30';
          case 'robotics': return 'bg-orange-600 border-orange-500 text-white shadow-md shadow-orange-500/30';
          case 'traffic': return 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-500/30';
          case 'evacuation': return 'bg-red-600 border-red-500 text-white shadow-md shadow-red-500/30';
          case 'gameai': return 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-500/30';
          default: return 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/30';
        }
      }
    }

    if (isLight) {
      return 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 shadow-2xs hover:border-slate-400';
    } else {
      return 'bg-gray-800/90 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600';
    }
  };

  // Entering a topology tool cancels endpoint picking and blockage painting,
  // so only one canvas interaction mode is active at a time.
  const setPlacementModeSafe: typeof setPlacementMode = (value) => {
    if (value === null) {
      setPlacementMode(null);
      return;
    }

    // A paused run can enter an editor tool without resetting until an actual
    // graph change is made and confirmed.
    if (sim.status === 'paused') {
      cancelPicking();
      setIsBlockageMode(false);
      setPlacementMode(value);
      return;
    }

    sim.requestTopologyEdit(() => {
      sim.handleReset();
      cancelPicking();
      setIsBlockageMode(false);
      setPlacementMode(value);
    }, sim.status, sim.isCurrentSaved);
  };

  const editorDisabled = sim.isComputing || sim.isGraphLoading || sim.status === 'running';

  // ── Topology Node Move & Rename Handlers ────────────────────────────────────
  const MAX_NODE_LABEL_LENGTH = 32;
  const [renamingNode, setRenamingNode] = useState<{ id: string; label: string; type: string } | null>(null);
  const [renameInput, setRenameInput] = useState<string>('');

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [manualEditGraph, setManualEditGraph] = useState<ScenarioGraph | null>(null);
  const [topologyConfirmation, setTopologyConfirmation] = useState<'clear' | 'reset-saved' | 'reset-original' | null>(null);
  const canvasGraph = manualEditGraph ?? patchedGraph;
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);
  const [isDefaultSavedRecently, setIsDefaultSavedRecently] = useState<boolean>(false);
  const [defaultUndoSeconds, setDefaultUndoSeconds] = useState(0);
  const topologyEditUndoBaseline = useRef<{
    hasUnsavedChanges: boolean;
    hasCustomPositions: boolean;
    isLayoutAtDefault: boolean;
    isSavedRecently: boolean;
  } | null>(null);
  const defaultLayoutUndoSnapshot = useRef<{
    defaultRaw: string | null;
    savedRaw: string | null;
    hasUnsavedChanges: boolean;
    hasCustomPositions: boolean;
    isLayoutAtDefault: boolean;
    isSavedRecently: boolean;
  } | null>(null);
  const defaultUndoInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hasCustomPositions, setHasCustomPositions] = useState<boolean>(false);
  const [isLayoutAtDefault, setIsLayoutAtDefault] = useState<boolean>(true);
  const shouldShowResetLayout = hasUnsavedChanges || (hasCustomPositions && !isLayoutAtDefault) || manualEditGraph !== null;
  const [undoHistory, setUndoHistory] = useState<ScenarioGraph[]>([]);

  useEffect(() => {
    setUndoHistory([]);
    setManualEditGraph(null);
    topologyEditUndoBaseline.current = null;
  }, [scenario, sim.mapId]);

  useEffect(() => {
    setDefaultUndoSeconds(0);
    defaultLayoutUndoSnapshot.current = null;
    if (defaultUndoInterval.current) clearInterval(defaultUndoInterval.current);
    defaultUndoInterval.current = null;
    return () => {
      if (defaultUndoInterval.current) clearInterval(defaultUndoInterval.current);
    };
  }, [scenario, sim.mapId]);

  const recordUndo = () => {
    if (sim.currentGraph) {
      setUndoHistory(previous => [...previous.slice(-49), sim.currentGraph!]);
    }
  };

  const prepareForTopologyMutation = () => {
    if (sim.status === 'paused') sim.preservePausedProgressForEdit();
    else sim.handleReset();
  };

  const stageManualGraphEdit = (edit: (graph: ScenarioGraph) => ScenarioGraph) => {
    const baseGraph = manualEditGraph ?? patchedGraph ?? sim.currentGraph;
    if (!baseGraph) return;
    const nextGraph = edit(baseGraph);
    const originalGraph = patchedGraph ?? sim.currentGraph;
    setManualEditGraph(originalGraph && JSON.stringify(nextGraph) === JSON.stringify(originalGraph) ? null : nextGraph);
  };

  const applyManualGraphEdits = () => {
    if (!manualEditGraph) return;
    const commit = () => {
      prepareForTopologyMutation();
      if (undoHistory.length === 0) {
        topologyEditUndoBaseline.current = {
          hasUnsavedChanges,
          hasCustomPositions,
          isLayoutAtDefault,
          isSavedRecently,
        };
      }
      recordUndo();
      sim.setCurrentGraph?.(() => manualEditGraph);
      markTopologyUnsaved();
      setManualEditGraph(null);
    };
    if (sim.status === 'running' || sim.status === 'paused' || (sim.status === 'done' && !sim.isCurrentSaved)) {
      sim.requestTopologyEdit(commit, sim.status, sim.isCurrentSaved);
    } else {
      commit();
    }
  };

  const handleUndoTopology = () => {
    const previous = undoHistory[undoHistory.length - 1];
    if (!previous) return;
    const applyUndo = () => {
      prepareForTopologyMutation();
      setUndoHistory(history => history.slice(0, -1));
      sim.setCurrentGraph?.(() => previous);
      if (undoHistory.length === 1 && topologyEditUndoBaseline.current) {
        const baseline = topologyEditUndoBaseline.current;
        setHasUnsavedChanges(baseline.hasUnsavedChanges);
        setHasCustomPositions(baseline.hasCustomPositions);
        setIsLayoutAtDefault(baseline.isLayoutAtDefault);
        setIsSavedRecently(baseline.isSavedRecently);
        topologyEditUndoBaseline.current = null;
      } else {
        markTopologyUnsaved();
      }
    };
    if (sim.status === 'running' || sim.status === 'paused' || (sim.status === 'done' && !sim.isCurrentSaved)) {
      sim.requestTopologyEdit(applyUndo, sim.status, sim.isCurrentSaved);
      return;
    }
    applyUndo();
  };

  // Check if custom saved positions exist for current scenario + mapId
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(`saved_node_positions_${scenario}_${sim.mapId}`);
      const defaultRaw = localStorage.getItem(`default_node_layout_${scenario}_${sim.mapId}`);
      setHasCustomPositions(Boolean(savedRaw || defaultRaw));
      if (!savedRaw) {
        setIsLayoutAtDefault(true);
      } else if (!defaultRaw) {
        setIsLayoutAtDefault(false);
      } else {
        const saved = JSON.parse(savedRaw);
        const defaultLayout = JSON.parse(defaultRaw);
        const comparable = (layout: any) => JSON.stringify({
          positions: layout.positions,
          nodes: layout.nodes,
          edges: layout.edges,
          sourceId: layout.sourceId,
          sourceIds: layout.sourceIds,
          destinationIds: layout.destinationIds,
          width: layout.width,
          height: layout.height,
        });
        setIsLayoutAtDefault(comparable(saved) === comparable(defaultLayout));
      }
      setHasUnsavedChanges(false);
      setIsSavedRecently(false);
      setIsDefaultSavedRecently(false);
    } catch {
      setHasCustomPositions(false);
      setIsLayoutAtDefault(true);
    }
  }, [scenario, sim.mapId]);

  const createLayoutSnapshot = () => {
    if (!sim.currentGraph) return null;
    const positions: Record<string, { x: number; y: number }> = {};
    sim.currentGraph.nodes.forEach((n: any) => {
      positions[n.id] = { x: n.x, y: n.y };
    });
    return {
      positions,
      // Save the full topology so deleted backend edges and edits to existing
      // nodes are restored alongside custom nodes and edges.
      nodes: sim.currentGraph.nodes,
      edges: sim.currentGraph.edges,
      sourceId: sim.currentGraph.sourceId,
      sourceIds: sim.currentGraph.sourceIds,
      destinationIds: sim.currentGraph.destinationIds,
      width: sim.currentGraph.width,
      height: sim.currentGraph.height,
      customNodes: sim.currentGraph.nodes.filter((n: any) => /_\d{13}$/.test(n.id)),
      customEdges: sim.currentGraph.edges.filter((e: any) => /_\d{13}$/.test(e.id)),
      ...(scenario === 'robotics' && (sim.mapId === 'aws' || sim.mapId === 'awsWarehouse') ? { awsLayoutVersion: 5 } : {}),
      updatedAt: Date.now()
    };
  };

  const handleSavePositions = () => {
    const data = createLayoutSnapshot();
    if (!data) return;
    try {
      localStorage.setItem(`saved_node_positions_${scenario}_${sim.mapId}`, JSON.stringify(data));
      setHasUnsavedChanges(false);
      setHasCustomPositions(true);
      try {
        const defaultRaw = localStorage.getItem(`default_node_layout_${scenario}_${sim.mapId}`);
        if (!defaultRaw) {
          setIsLayoutAtDefault(false);
        } else {
          const defaultLayout = JSON.parse(defaultRaw);
          setIsLayoutAtDefault(JSON.stringify({
            positions: data.positions, nodes: data.nodes, edges: data.edges,
            sourceId: data.sourceId, sourceIds: data.sourceIds, destinationIds: data.destinationIds,
            width: data.width, height: data.height,
          }) === JSON.stringify({
            positions: defaultLayout.positions, nodes: defaultLayout.nodes, edges: defaultLayout.edges,
            sourceId: defaultLayout.sourceId, sourceIds: defaultLayout.sourceIds, destinationIds: defaultLayout.destinationIds,
            width: defaultLayout.width, height: defaultLayout.height,
          }));
        }
      } catch {
        setIsLayoutAtDefault(false);
      }
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 3000);
    } catch (err) {
      console.error('Failed to save node positions:', err);
    }
  };

  const handleSaveAsDefault = () => {
    const data = createLayoutSnapshot();
    if (!data) return;
    try {
      defaultLayoutUndoSnapshot.current = {
        defaultRaw: localStorage.getItem(`default_node_layout_${scenario}_${sim.mapId}`),
        savedRaw: localStorage.getItem(`saved_node_positions_${scenario}_${sim.mapId}`),
        hasUnsavedChanges,
        hasCustomPositions,
        isLayoutAtDefault,
        isSavedRecently,
      };
      localStorage.setItem(`default_node_layout_${scenario}_${sim.mapId}`, JSON.stringify(data));
      // Keep the live layout in sync immediately; the default remains as the
      // baseline that Reset Layout will restore later.
      localStorage.setItem(`saved_node_positions_${scenario}_${sim.mapId}`, JSON.stringify(data));
      setHasUnsavedChanges(false);
      setHasCustomPositions(true);
      setIsLayoutAtDefault(true);
      setIsSavedRecently(false);
      setIsDefaultSavedRecently(true);
      setTimeout(() => setIsDefaultSavedRecently(false), 5000);
      if (defaultUndoInterval.current) clearInterval(defaultUndoInterval.current);
      setDefaultUndoSeconds(5);
      defaultUndoInterval.current = setInterval(() => {
        setDefaultUndoSeconds(seconds => {
          if (seconds <= 1) {
            if (defaultUndoInterval.current) clearInterval(defaultUndoInterval.current);
            defaultUndoInterval.current = null;
            defaultLayoutUndoSnapshot.current = null;
            return 0;
          }
          return seconds - 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to save default topology layout:', err);
    }
  };

  const handleUndoSaveAsDefault = () => {
    const snapshot = defaultLayoutUndoSnapshot.current;
    if (!snapshot) return;
    try {
      const restoreStorageValue = (key: string, value: string | null) => {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      };
      restoreStorageValue(`default_node_layout_${scenario}_${sim.mapId}`, snapshot.defaultRaw);
      restoreStorageValue(`saved_node_positions_${scenario}_${sim.mapId}`, snapshot.savedRaw);
      setHasUnsavedChanges(snapshot.hasUnsavedChanges);
      setHasCustomPositions(snapshot.hasCustomPositions);
      setIsLayoutAtDefault(snapshot.isLayoutAtDefault);
      setIsSavedRecently(snapshot.isSavedRecently);
      setIsDefaultSavedRecently(false);
      defaultLayoutUndoSnapshot.current = null;
      if (defaultUndoInterval.current) clearInterval(defaultUndoInterval.current);
      defaultUndoInterval.current = null;
      setDefaultUndoSeconds(0);
    } catch (err) {
      console.error('Failed to undo default topology save:', err);
    }
  };

  const handleResetPositions = () => {
    let hasSavedDefault = false;
    try {
      hasSavedDefault = Boolean(localStorage.getItem(`default_node_layout_${scenario}_${sim.mapId}`));
    } catch {
      // Continue with the backend default if browser storage is unavailable.
    }
    setTopologyConfirmation(hasSavedDefault ? 'reset-saved' : 'reset-original');
  };

  const confirmTopologyAction = () => {
    const action = topologyConfirmation;
    setTopologyConfirmation(null);
    if (action === 'clear') {
      stageManualGraphEdit(graph => ({ ...graph, nodes: [], edges: [] }));
      return;
    }
    if (!action) return;

    try {
      localStorage.removeItem(`saved_node_positions_${scenario}_${sim.mapId}`);
    } catch (err) {
      console.error('Failed to remove saved node positions:', err);
    }
    try {
      setHasCustomPositions(Boolean(localStorage.getItem(`default_node_layout_${scenario}_${sim.mapId}`)));
    } catch {
      setHasCustomPositions(false);
    }
    setHasUnsavedChanges(false);
    setManualEditGraph(null);
    sim.forceRefetchGraph(true);
    setIsLayoutAtDefault(true);
  };

  const handleNodeMoveEnd = (nodeId: string, x: number, y: number) => {
    stageManualGraphEdit(graph => ({
      ...graph,
      nodes: graph.nodes.map(n => n.id === nodeId ? { ...n, x, y } : n)
    }));
  };

  const markTopologyUnsaved = () => {
    setHasUnsavedChanges(true);
    setIsSavedRecently(false);
    setIsLayoutAtDefault(false);
  };

  const handleConfirmNodeRename = () => {
    if (!renamingNode) return;
    const trimmed = renameInput.trim().slice(0, MAX_NODE_LABEL_LENGTH);
    if (!trimmed) return;
    const targetNodeId = renamingNode.id;

    stageManualGraphEdit(graph => ({
      ...graph,
      nodes: graph.nodes.map(n => n.id === targetNodeId ? { ...n, label: trimmed } : n)
    }));
    setRenamingNode(null);
  };

  // ── Custom blockage helpers ─────────────────────────────────────────────────
  // NOTE: adjust `setCustomBlockedNodes` if your useSimulation exposes a different setter name.
  const setCustomBlocked = (sim as any).setCustomBlockedNodes as
    | ((updater: (prev: { nodeId: string; label: string }[]) => { nodeId: string; label: string }[]) => void)
    | undefined;

  const blockedList: { nodeId: string; label: string }[] = draftBlockedNodes ?? (sim as any).customBlockedNodes ?? [];
  const blockageDisabled = sim.isComputing || sim.isGraphLoading || sim.status === 'running';
  const [showHopBadges, setShowHopBadges] = useState(true);

  const handlePathNodeClick = (nodeId: string) => {
    if (highlightedNodeId === nodeId) {
      setHighlightedNodeId(null);
      requestAnimationFrame(() => {
        setHighlightedNodeId(nodeId);
      });
    } else {
      setHighlightedNodeId(nodeId);
    }
  };

  const areAllAlgorithmsDone = useMemo(() => {
    const enabled = (['bfs', 'dfs', 'hybrid'] as const).filter(k => sim.activeAlgorithms[k]);
    if (enabled.length === 0) return false;
    return enabled.every(k => sim.activeSteps[k]?.done === true);
  }, [sim.activeAlgorithms, sim.activeSteps]);

  const isSimulationFinished = Boolean(
    sim.status === 'done' ||
    (sim.totalSteps > 0 && sim.stepIndex >= sim.totalSteps) ||
    areAllAlgorithmsDone
  );

  const isManuallyEdited = useMemo(() => {
    if (!sim.currentGraph) return false;
    return sim.currentGraph.nodes.some(n => /_\d{13}$/.test(n.id)) || sim.currentGraph.edges.some(e => /_\d{13}$/.test(e.id));
  }, [sim.currentGraph]);

  const toggleBlockNode = (nodeId: string) => {
    if (!setCustomBlocked || sim.isComputing) return;
    const node = sim.currentGraph?.nodes.find(n => n.id === nodeId);
    if (!node) return;
    // Don't allow blocking the start / exits
    if (nodeId === currentSourceId || currentDestIds.includes(nodeId)) return;
    
    const nodeName = node.label?.trim() ? node.label.split('\n')[0].trim() : nodeId;
    const labelWithNode = `${blockageBrush} at ${nodeName}`;

    const current: { nodeId: string; label: string }[] = draftBlockedNodes ?? (sim as any).customBlockedNodes ?? [];
    const existing = current.find(b => b.nodeId === nodeId);
    const next = existing
      ? existing.label.startsWith(blockageBrush)
        ? current.filter(b => b.nodeId !== nodeId)
        : current.map(b => b.nodeId === nodeId ? { nodeId, label: labelWithNode } : b)
      : [...current, { nodeId, label: labelWithNode }];

    if (sim.status === 'paused') sim.preservePausedProgressForEdit();
    setDraftBlockedNodes(next);
    setCustomBlocked(() => next);
  };

  const toggleBlockageMode = () => {
    if (blockageDisabled) return;
    if (!isBlockageMode) {
      cancelPicking();
      const existing: { nodeId: string; label: string }[] = (sim as any).customBlockedNodes ?? [];
      const normalized = existing.map(b => {
        if (b.label && b.label.includes(' at ')) return b;
        const n = sim.currentGraph?.nodes.find(x => x.id === b.nodeId);
        const name = n?.label?.trim() ? n.label.split('\n')[0].trim() : b.nodeId;
        return { nodeId: b.nodeId, label: `${b.label || blockageBrush} at ${name}` };
      });
      setDraftBlockedNodes(normalized);
      setIsBlockageMode(true);
    } else {
      setDraftBlockedNodes(null);
      setIsBlockageMode(false);
    }
  };

  // Leave edit modes while playback is actively running. They can be entered
  // again after pausing.
  useEffect(() => {
    if (sim.status === 'running' || (sim.isComputing && sim.status !== 'paused')) {
      setIsBlockageMode(false);
      setDraftBlockedNodes(null);
      setPlacementMode(null);
    }
  }, [sim.status, sim.isComputing, setDraftBlockedNodes, setIsBlockageMode, setPlacementMode]);

  // ── Endpoint bar labels ─────────────────────────────────────────────────────
  const srcLabel =
    scenario === 'network'
      ? (sim.networkRoutingMode === 'device-to-device' ? 'SRC DEVICE' : 'SRC ROUTER')
      : scenario === 'robotics' ? 'ROBOT START'
        : scenario === 'gameai' ? 'STRATEGY START'
          : scenario === 'evacuation' ? 'STARTING ROOM'
            : 'STARTING POINT';

  const dstValue = currentDestIds.length > 0
    ? `${currentDestIds.length} exit${currentDestIds.length > 1 ? 's' : ''} selected`
    : 'Select exits';

  const showResetDefault =
    (scenario === 'traffic' && (sim.trafficSourceId || sim.trafficDestinationIds.length > 0)) ||
    (scenario === 'evacuation' && sim.evacuationSourceId) ||
    (scenario === 'gameai' && sim.gameAISourceId);

  const handleResetDefault = () => {
    if (scenario === 'traffic') { sim.setTrafficSourceId(null); sim.setTrafficDestinationIds([]); }
    if (scenario === 'evacuation') sim.setEvacuationSourceId(null);
    if (scenario === 'gameai') sim.setGameAISourceId(null);
  };

  return (
    <>
      {/* Tutorial overlay */}
      <TutorialOverlay
        isOpen={tutorial.isOpen}
        stepIndex={tutorial.stepIndex}
        scenario={scenario}
        onNext={tutorial.next}
        onPrev={tutorial.prev}
        onClose={tutorial.close}
        onGoTo={tutorial.goTo}
      />

      {connectionError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-[#450a0a]/90 border border-red-500/50 text-red-200 px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 backdrop-blur-sm animate-in fade-in slide-in-from-top-8">
          <span className="text-xl leading-none">⚠️</span>
          <span className="font-medium text-sm">{connectionError}</span>
        </div>
      )}

      {/* ── Unsaved-result / in-progress action guard modal ───────────────────── */}
      {sim.pendingNavigation && (() => {
        const nav = sim.pendingNavigation!;
        const isInProgress = nav.reason === 'inprogress';
        const type = nav.type;

        const title = isInProgress ? 'Simulation in Progress' : 'Unsaved Results';
        const icon = isInProgress ? '❗' : '⚠️';
        const borderColor = isInProgress ? 'border-blue-500/30' : 'border-amber-500/30';
        const titleColor = isInProgress ? 'text-blue-400' : 'text-amber-400';
        const btnColor = isInProgress
          ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'
          : 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20';

        const body = (() => {
          if (type === 'reset')
            return isInProgress
              ? 'The simulation is currently running. Are you sure you want to stop it and reset everything?'
              : 'You have unsaved simulation results. Are you sure you want to discard them and reset?';
          if (type === 'reroll')
            return isInProgress
              ? 'The simulation is currently running. Are you sure you want to stop it and reroll the map events?'
              : 'You have unsaved simulation results. Are you sure you want to discard them and reroll the map events?';
          if (type === 'skip')
            return isInProgress
              ? 'The simulation is currently running. Are you sure you want to skip straight to the end?'
              : 'You have unsaved simulation results. Are you sure you want to discard them and skip to the end?';
          if (type === 'sizing' || type === 'sizing_step')
            return isInProgress
              ? 'The simulation is currently running. Are you sure you want to stop it and change the graph size?'
              : 'You have unsaved simulation results. Are you sure you want to discard them and change the graph size?';
          if (type === 'back')
            return isInProgress
              ? 'The simulation is currently running. Are you sure you want to stop it and go back?'
              : 'You have unsaved simulation results. Are you sure you want to discard them and leave?';
          if (type === 'map')
            return isInProgress
              ? 'The simulation is currently running. Are you sure you want to stop it and switch maps?'
              : 'You have unsaved simulation results. Are you sure you want to discard them and switch maps?';
          if (type === 'gameboard')
            return isInProgress
              ? 'The simulation is currently running. Are you sure you want to stop it and switch game boards?'
              : 'You have unsaved simulation results. Are you sure you want to discard them and switch game boards?';
          if (type === 'robot_assignment')
            return 'The simulation is currently paused. Changing robot assignments requires a full reset. Do you want to stop the simulation and open the assignment panel?';
          if (type === 'topology_edit')
            return isInProgress
              ? 'The simulation is currently running. Editing the topology will stop the simulation and discard current results.'
              : 'You have unsaved simulation results. Are you sure you want to discard them and edit the topology?';
          return 'Are you sure you want to proceed?';
        })();

        const confirmLabel = (() => {
          if (type === 'reset') return isInProgress ? 'Stop & Reset' : 'Discard & Reset';
          if (type === 'reroll') return isInProgress ? 'Stop & Reroll' : 'Discard & Reroll';
          if (type === 'skip') return isInProgress ? 'Skip to End' : 'Discard & Skip';
          if (type === 'sizing' || type === 'sizing_step')
            return isInProgress ? 'Stop & Resize' : 'Discard & Resize';
          if (type === 'back') return isInProgress ? 'Stop & Leave' : 'Discard & Leave';
          if (type === 'map') return isInProgress ? 'Stop & Switch' : 'Discard & Switch';
          if (type === 'gameboard') return isInProgress ? 'Stop & Switch' : 'Discard & Switch';
          if (type === 'robot_assignment') return 'Stop & Open';
          if (type === 'topology_edit') return isInProgress ? 'Stop & Edit' : 'Discard & Edit';
          return 'Confirm';
        })();

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
            <div className={`rounded-xl p-6 max-w-sm w-full shadow-2xl scale-in border ${
              isLight ? 'bg-white border-slate-200 text-slate-800 shadow-2xl' : `bg-gray-900 ${borderColor}`
            }`}>
              <h3 className={`font-bold text-lg mb-2 flex items-center gap-2 ${
                isLight ? (isInProgress ? 'text-blue-600' : 'text-amber-700') : titleColor
              }`}>
                <span className="text-xl">{icon}</span>
                {title}
              </h3>
              <p className={`text-sm mb-6 leading-relaxed ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>{body}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => sim.setPendingNavigation(null)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300' 
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={sim.confirmPendingNavigation}
                  className={`px-4 py-2 text-white rounded-lg text-sm font-bold transition-colors shadow-lg cursor-pointer ${btnColor}`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {topologyConfirmation && (() => {
        const isClear = topologyConfirmation === 'clear';
        const title = isClear ? 'Clear Entire Map?' : 'Reset Layout?';
        const message = isClear
          ? 'This will remove every node and link from the canvas. The change will be staged until you apply it.'
          : topologyConfirmation === 'reset-saved'
            ? 'Restore this map to its saved default layout? Current position changes will be discarded.'
            : 'Restore all node positions to the original default layout? Current position changes will be discarded.';
        const actionLabel = isClear ? 'Clear Map' : 'Reset Layout';
        return (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 backdrop-blur-sm animate-fadeIn p-4"
            onClick={() => setTopologyConfirmation(null)}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="topology-confirm-title"
              aria-describedby="topology-confirm-description"
              className={`w-full max-w-md rounded-xl border shadow-2xl overflow-hidden ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-gray-900 border-gray-700 text-white'
              }`}
              onClick={event => event.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 ${
                    isClear
                      ? isLight ? 'bg-red-100 text-red-700' : 'bg-red-950/60 text-red-400'
                      : isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-950/60 text-amber-400'
                  }`}>
                    {isClear ? '⚠️' : <RotateCcw className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 id="topology-confirm-title" className={`text-lg font-bold ${
                      isClear ? isLight ? 'text-red-700' : 'text-red-300' : isLight ? 'text-amber-700' : 'text-amber-300'
                    }`}>{title}</h3>
                    <p id="topology-confirm-description" className={`mt-2 text-sm leading-relaxed ${
                      isLight ? 'text-slate-600' : 'text-gray-300'
                    }`}>{message}</p>
                  </div>
                </div>
              </div>
              <div className={`border-t p-4 flex justify-end gap-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-gray-950 border-gray-800'
              }`}>
                <button
                  type="button"
                  onClick={() => setTopologyConfirmation(null)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmTopologyAction}
                  className={`px-4 py-2 rounded-lg text-sm font-bold text-white transition-colors cursor-pointer shadow-lg ${
                    isClear ? 'bg-red-600 hover:bg-red-500 shadow-red-900/30' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'
                  }`}
                >
                  {actionLabel}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="min-h-screen lg:h-screen w-full max-w-[100vw] bg-transparent text-white flex flex-col relative z-0 lg:overflow-hidden fade-in">
        {/* Help Modal */}
        {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} scenario={scenario} onStartTutorial={tutorial.start} />}



        {/* ── Header ───────────────────────────────────────────────────────────── */}
        <header className="glass-panel border-b-0 border-white/5 px-2 sm:px-3 md:px-6 py-2.5 md:py-3 flex flex-wrap lg:flex-nowrap items-center justify-between shrink-0 relative z-10 gap-y-2 gap-x-1.5 w-full max-w-full">

          {/* Left: Back & Title */}
          <div className="flex items-center gap-1.5 sm:gap-4 relative z-10 min-w-0 flex-1 lg:flex-none">
            <button
              onClick={() => sim.requestBack(sim.status, sim.isCurrentSaved)}
              className="px-2 sm:px-3 py-2 text-gray-400 hover:text-white flex items-center gap-1 sm:gap-2 transition-all hover:bg-white/5 rounded-lg text-sm font-bold whitespace-nowrap active:scale-95 shrink-0"
            >
              <span className="opacity-70 text-lg">←</span> <span className="hidden sm:inline tracking-wider">Back</span>
            </button>
            <div className="h-6 w-px bg-white/10 hidden sm:block mx-0.5 shrink-0"></div>
            <div
              data-tutorial="tutorial-header-title"
              className="flex items-center gap-1.5 sm:gap-3 bg-[#0a0f1e]/80 px-2.5 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-white/10 shadow-inner min-w-0"
            >
              <span className="text-xl sm:text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] shrink-0 flex items-center justify-center" style={{ color: sc?.color }}>
                {(() => {
                  const className = "w-6 h-6 sm:w-8 sm:h-8";
                  switch (scenario) {
                    case 'network': return <Network className={className} />;
                    case 'robotics': return <Bot className={className} />;
                    case 'traffic': return <Car className={className} />;
                    case 'evacuation': return <Flame className={className} />;
                    case 'gameai': return <Gamepad2 className={className} />;
                    default: return <Network className={className} />;
                  }
                })()}
              </span>
              <h1 className="font-bold text-xs sm:text-base md:text-lg text-white tracking-widest drop-shadow-md truncate">{sc?.name}</h1>
            </div>
          </div>

          {/* Center: Algorithm toggle pills (Wraps to new line on mobile) */}
          <div
            data-tutorial="tutorial-algo-pills"
            className="flex items-center justify-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 bg-black/40 rounded-full border border-white/5 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase order-3 lg:order-none w-full lg:w-auto shrink-0 relative lg:mx-4"
          >
            {sim.minAlgoWarning && (
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-[9999]
                flex items-center gap-1.5 px-4 py-2.5 rounded-lg
                bg-amber-950/95 border border-amber-500/60 text-amber-300
                text-xs font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)]
                animate-fadeIn pointer-events-none">
                <span className="text-amber-400">⚠</span>
                At least 1 algorithm must remain active
              </div>
            )}
            {([
              { id: 'bfs' as const, label: 'BFS', textCls: 'text-green-400', dotCls: 'bg-green-500', hoverBg: 'hover:bg-green-500/15', activeBg: 'bg-green-500/10', glow: 'rgba(74,222,128,0.5)', dotGlow: 'rgba(34,197,94,0.8)' },
              { id: 'dfs' as const, label: 'DFS', textCls: 'text-purple-400', dotCls: 'bg-purple-500', hoverBg: 'hover:bg-purple-500/15', activeBg: 'bg-purple-500/10', glow: 'rgba(192,132,252,0.5)', dotGlow: 'rgba(168,85,247,0.8)' },
              { id: 'hybrid' as const, label: 'Hybrid', textCls: 'text-orange-400', dotCls: 'bg-orange-500', hoverBg: 'hover:bg-orange-500/15', activeBg: 'bg-orange-500/10', glow: 'rgba(251,146,60,0.5)', dotGlow: 'rgba(249,115,22,0.8)' },
            ]).map(({ id, label, textCls, dotCls, hoverBg, activeBg, glow, dotGlow }, i) => (
              <React.Fragment key={id}>
                {i > 0 && <span className="text-gray-600">|</span>}
                <button
                  onClick={() => sim.toggleAlgorithm(id)}
                  title={sim.activeAlgorithms[id] ? `Hide ${label} from simulation view` : `Show ${label} in simulation view`}
                  className={`flex items-center gap-1.5 rounded-md px-1.5 sm:px-2 py-1 transition-all duration-150 cursor-pointer select-none ${sim.activeAlgorithms[id]
                    ? `${textCls} ${activeBg} ${hoverBg} drop-shadow-[0_0_6px_${glow}] hover:drop-shadow-[0_0_12px_${glow}] hover:brightness-125 active:scale-95`
                    : `text-gray-500 opacity-50 hover:opacity-75 hover:bg-white/5 active:scale-95`
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200 ${sim.activeAlgorithms[id] ? `${dotCls} shadow-[0_0_8px_${dotGlow}]` : 'bg-gray-600'
                    }`} />
                  <span className={sim.activeAlgorithms[id] ? '' : 'line-through'}>{label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative z-10 ml-auto order-2 lg:order-none">
            <button
              data-tutorial="tutorial-result-history"
              onClick={() => sim.setIsHistoryModalOpen(true)}
              className="px-2.5 sm:px-4 py-1.5 rounded-lg glass-panel text-gray-200 hover:text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:-translate-y-0.5 active:scale-[0.98] shadow-md hover:shadow-glow-blue hover:border-blue-500/50"
            >
              <span className="hidden sm:inline">Result History</span>
              <span className="sm:hidden text-base">🗄️</span>
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none min-w-[20px] text-center">
                {sim.scenarioHistoryCount}
              </span>
            </button>
          </div>

          <div className="z-20 shrink-0 ml-2 sm:ml-4 flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <button
              data-tutorial="tutorial-help-btn"
              onClick={() => setIsHelpOpen(true)}
              title="Help & Guide"
              className="w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-full md:rounded-lg glass-panel text-gray-200 hover:text-white text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]"
              style={{
                borderColor: `${sc?.color}60`,
                boxShadow: `0 0 12px ${sc?.color}20, inset 0 0 8px ${sc?.color}10`,
                textShadow: `0 0 8px ${sc?.color}40`,
              }}
            >
              <span className="md:hidden">{sc?.icon || '?'}</span>
              <span className="hidden md:flex items-center gap-2">
                <span className="text-lg leading-none filter drop-shadow-sm md:hidden">{sc?.icon || '❓'}</span>
                Help &amp; Guide
              </span>
            </button>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row flex-1 lg:min-h-0 overflow-y-auto lg:overflow-hidden">

          {/* ── Left Sidebar: Metrics ─────────────────────────────────────────── */}
          <ResizableSidebar
            side="left"
            storageKey="sim_left_panel"
            defaultWidth={320}
            minWidth={260}
            maxWidth={450}
            className="border-b lg:border-b-0 lg:border-r border-gray-800 lg:max-h-[calc(100vh-theme(spacing.20))] bg-[#0a0f1e]/50 backdrop-blur-sm"
            innerClassName="p-4 flex flex-col gap-4"
          >
            {sim.simResults && !sim.isComputing && sim.currentGraph ? (
              <div data-tutorial="tutorial-metrics-panel" className="w-full shrink-0">
                <MetricsPanel
                  multiResults={sim.simResults}
                  activeSteps={sim.activeSteps}
                  scenario={scenario}
                  status={sim.status}
                  stepIndex={sim.stepIndex}
                  totalSteps={sim.totalSteps}
                  totalNodes={sim.currentGraph.nodes.length}
                  optimalPathLength={sim.bfsResult?.pathLength ?? 0}
                  activeAlgorithms={sim.activeAlgorithms}
                  mapId={sim.mapId}
                  robotAssignments={sim.robotAssignments}
                />
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 flex flex-col items-center justify-center py-10 text-center gap-3">
                {/* Spinner with glow ring */}
                <div className="relative w-10 h-10">
                  <div className="w-10 h-10 border-4 border-gray-800 rounded-full" />
                  <div className="absolute inset-0 w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  {sim.computeProgress >= 30 && (
                    <div className="absolute inset-0 w-10 h-10 rounded-full shadow-[0_0_12px_2px_rgba(59,130,246,0.4)]" />
                  )}
                </div>

                {/* Dynamic phase label */}
                <div className="text-gray-200 text-xs font-semibold">
                  {sim.computeProgress < 5
                    ? 'Contacting backend server\u2026'
                    : sim.computeProgress < 20
                      ? 'Building graph topology\u2026'
                      : sim.computeProgress < 45
                        ? 'Running BFS \u00b7 DFS \u00b7 Hybrid\u2026'
                        : sim.computeProgress < 70
                          ? 'Evaluating algorithm steps\u2026'
                          : sim.computeProgress < 90
                            ? 'Collecting performance metrics\u2026'
                            : sim.computeProgress < 100
                              ? 'Almost there\u2026'
                              : 'Finalizing results\u2026'}
                </div>

                {/* Progress bar */}
                <div className="w-full">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-gray-500 font-mono">
                      {sim.computeProgress < 5 ? 'Connecting\u2026' : 'Computing\u2026'}
                    </span>
                    <span className={`text-[10px] font-bold font-mono transition-colors ${sim.computeProgress >= 90 ? 'text-green-400' :
                      sim.computeProgress >= 50 ? 'text-cyan-400' : 'text-blue-400'
                      }`}>
                      {sim.computeProgress > 0 ? `${sim.computeProgress}%` : '\u2014\u2014'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    {sim.computeProgress > 0 ? (
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${sim.computeProgress >= 90
                          ? 'bg-gradient-to-r from-cyan-500 to-green-400'
                          : 'bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-400'
                          }`}
                        style={{ width: `${sim.computeProgress}%` }}
                      />
                    ) : (
                      /* Shimmer stripe while connecting */
                      <div className="h-full w-full bg-gradient-to-r from-transparent via-blue-700/60 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite] bg-[length:200%_100%]" />
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-gray-600">
                  Simultaneous BFS · DFS · Hybrid evaluation
                </p>
              </div>
            )}

            <div data-tutorial="tutorial-legend" className="w-full shrink-0">
              <Legend scenario={scenario} mapId={sim.mapId} />
            </div>
          </ResizableSidebar>

          {/* ── Main Canvas Area ──────────────────────────────────────────────── */}
          <main className="flex-1 flex flex-col items-center justify-between px-3 py-1.5 sm:px-4 sm:py-2 w-full relative min-h-0 lg:overflow-hidden overflow-y-auto">

            {/* Scenario / Map / Board selectors */}
            <div className="mb-1.5 flex flex-col items-center gap-1.5 w-full shrink-0">

              {/* Row 2: Map Presets & Workspace Toggle Side-by-Side */}
              <div className="flex items-center justify-center gap-2 flex-wrap w-full">
                {scenario === 'gameai' && (
                  <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-gray-900/60 border-gray-800'} overflow-x-auto max-w-full`} style={{ scrollbarWidth: 'none' }}>
                    {GAME_AI_BOARDS.map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => sim.requestBoardChange(id, sim.status, sim.isCurrentSaved)}
                        disabled={sim.isComputing || sim.isGraphLoading}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 border ${getMapTabButtonClass(sim.gameBoard === id)}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {(scenario === 'traffic' || scenario === 'evacuation' || scenario === 'robotics' || scenario === 'network') && (
                  <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-gray-900/60 border-gray-800'} overflow-x-auto max-w-full`} style={{ scrollbarWidth: 'none' }}>
                    {MAP_REGISTRY[scenario]?.map(mapDef => (
                      <button
                        key={mapDef.id}
                        onClick={() => sim.requestMapChange(mapDef.id, sim.status, sim.isCurrentSaved)}
                        disabled={sim.isComputing || sim.isGraphLoading}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 border ${getMapTabButtonClass(sim.mapId === mapDef.id)}`}
                      >
                        {mapDef.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Workspace View Toggle (Physical / Logical) on same row */}
                {sim.mapId !== 'synthetic' && (
                  <div className={`flex items-center gap-1 p-0.5 rounded-lg border ${
                    isLight ? 'bg-white border-slate-300 shadow-sm' : 'bg-gray-900/60 border-gray-700'
                  }`}>
                    <button
                      onClick={() => setWorkspaceView('physical')}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                        workspaceView === 'physical'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                          : isLight
                            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                      }`}
                    >
                      Physical Workspace
                    </button>
                    <button
                      onClick={() => setWorkspaceView('logical')}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                        workspaceView === 'logical'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                          : isLight
                            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                      }`}
                    >
                      Logical Workspace
                    </button>
                  </div>
                )}
              </div>

              {/* Row 3: Compact Endpoint bar (on-map picking) */}
              <div data-tutorial="tutorial-scenario-selectors" className="w-full flex flex-col items-center gap-1 shrink-0 empty:hidden">
                {sim.currentGraph && (
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 w-full bg-gray-900/60 px-3 py-1.5 rounded-xl border border-gray-700/50">

                    {scenario === 'network' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Mode:</span>
                        <div className="flex items-center bg-gray-900/60 border border-gray-700 rounded-md p-0.5" style={{ opacity: sim.isComputing || sim.status === 'running' ? 0.5 : 1, pointerEvents: sim.isComputing || sim.status === 'running' ? 'none' : 'auto' }}>
                          <button
                            type="button"
                            onClick={() => sim.setNetworkRoutingMode('default')}
                            className={`px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded transition-colors ${sim.networkRoutingMode === 'default' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
                          >
                            Default (ISP Broadcast)
                          </button>
                          <button
                            type="button"
                            onClick={() => sim.setNetworkRoutingMode('device-to-device')}
                            className={`px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded transition-colors ${sim.networkRoutingMode === 'device-to-device' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
                          >
                            Device to Device
                          </button>
                        </div>
                      </div>
                    )}

                    <EndpointChip
                      label={srcLabel}
                      labelClass="text-green-400"
                      dotClass="bg-green-500"
                      borderClass="border-green-900"
                      value={nodeLabel(currentSourceId)}
                      active={pickMode === 'source'}
                      disabled={pickDisabled}
                      onPick={() => (pickMode === 'source' ? cancelPicking() : startPicking('source'))}
                    />

                    {supportsDestPick && (
                      <>
                        <span className="text-gray-500 hidden md:block">→</span>
                        <EndpointChip
                          label="DST"
                          labelClass="text-red-400"
                          dotClass="bg-red-500"
                          borderClass={currentDestIds.length > 0 ? 'border-red-900' : 'border-red-500'}
                          value={dstValue}
                          active={pickMode === 'dest'}
                          disabled={pickDisabled}
                          onPick={() => (pickMode === 'dest' ? cancelPicking() : startPicking('dest'))}
                        />
                      </>
                    )}

                    {scenario === 'network' && (
                      <div className="flex items-center bg-gray-900/60 border border-gray-700 rounded-md p-0.5" style={{ opacity: sim.isComputing || sim.status === 'running' ? 0.5 : 1, pointerEvents: sim.isComputing || sim.status === 'running' ? 'none' : 'auto' }}>
                        <button
                          type="button"
                          onClick={() => sim.setDeliveryMode('anycast')}
                          className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded transition-colors ${sim.deliveryMode === 'anycast' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
                        >
                          Anycast (Race to first)
                        </button>
                        <button
                          type="button"
                          onClick={() => sim.setDeliveryMode('multicast')}
                          className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded transition-colors ${sim.deliveryMode === 'multicast' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
                        >
                          Multicast (Find all)
                        </button>
                      </div>
                    )}

                    {showResetDefault && (
                      <button
                        onClick={handleResetDefault}
                        disabled={sim.isComputing || sim.status === 'running'}
                        className="text-[10px] text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-600 px-2 py-0.5 rounded cursor-pointer transition-colors disabled:opacity-40"
                        title="Reset to default endpoints"
                      >
                        Reset Default
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Canvas */}
            <div
              data-tutorial="tutorial-canvas"
              className={`rounded-2xl overflow-hidden border w-full relative flex-1 min-h-[300px] h-0 shadow-[0_0_48px_rgba(37,99,235,0.1)] transition-colors ${pickMode ? 'border-cyan-500/70 cursor-crosshair' : isBlockageMode ? 'border-amber-500/70 cursor-crosshair' : 'border-gray-700'}`}
              style={{ maxWidth: 1400 }}
            >
              {/* In-Canvas Floating Interactive Mode HUDs */}
              {pickMode && (
                <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-30 max-w-[95%] flex flex-wrap items-center justify-center gap-2.5 px-4 py-2 rounded-xl border backdrop-blur-md text-xs shadow-2xl animate-in fade-in slide-in-from-top-2 ${
                  isLight
                    ? 'border-cyan-500 bg-white/95 text-cyan-950 shadow-cyan-900/10'
                    : 'border-cyan-500/60 bg-gray-950/90 text-cyan-200 shadow-cyan-950/50'
                }`}>
                  <CrosshairIcon className={`w-4 h-4 animate-pulse shrink-0 ${isLight ? 'text-cyan-600' : 'text-cyan-300'}`} />
                  <span className="font-bold">
                    {pickMode === 'source'
                      ? 'Click a node on the map to set the starting point'
                      : `Click nodes on the map to toggle exits (${pickDraft.length} selected, min ${minDestinations})`}
                  </span>
                  <span className={`hidden md:inline ${isLight ? 'text-cyan-700 font-semibold' : 'text-cyan-400/70'}`}>· {pickRuleText(pickMode)}</span>
                  <div className="flex items-center gap-2 ml-2">
                    {pickMode === 'dest' && (
                      <button onClick={finishPicking} className="px-3 py-1 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer transition-colors shadow">
                        Done
                      </button>
                    )}
                    <button onClick={cancelPicking} className={`px-3 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {isBlockageMode && (
                <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-30 max-w-[95%] flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl border backdrop-blur-md text-xs shadow-2xl animate-in fade-in slide-in-from-top-2 ${
                  isLight
                    ? 'border-amber-500 bg-white/95 text-amber-950 shadow-amber-900/10'
                    : 'border-amber-500/60 bg-gray-950/90 text-amber-200 shadow-amber-950/50'
                }`}>
                  <span className={`font-bold uppercase tracking-widest text-[10px] shrink-0 ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>Blockage brush:</span>
                  {BLOCKAGE_LABELS[scenario].map(label => (
                    <button
                      key={label}
                      onClick={() => setBlockageBrush(label)}
                      className={`px-2.5 py-1 rounded-md border text-xs font-bold cursor-pointer transition-colors ${
                        blockageBrush === label
                          ? isLight
                            ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-sm'
                            : 'bg-amber-600/30 border-amber-400 text-amber-100 shadow'
                          : isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                            : 'bg-gray-800/90 border-gray-600 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <span className={`ml-1 text-xs ${isLight ? 'text-amber-800 font-semibold' : 'text-amber-300/80'}`}>
                    {sim.isComputing ? 'Updating route…' : `Click nodes to apply immediately (${blockedList.length} blocked)`}
                  </span>
                  
                  <div className="flex items-center gap-2 ml-2">
                    {blockedList.length > 0 && setCustomBlocked && (
                      <button
                        onClick={() => {
                          if (sim.isComputing) return;
                          if (sim.status === 'paused') sim.preservePausedProgressForEdit();
                          setDraftBlockedNodes([]);
                          setCustomBlocked(() => []);
                        }}
                        disabled={sim.isComputing}
                        className={`px-2.5 py-1 rounded-md border font-bold cursor-pointer transition-colors ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                            : 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-300'
                        }`}
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={toggleBlockageMode}
                      className="px-3.5 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer transition-colors shadow-lg shadow-amber-500/20"
                    >
                      Exit
                    </button>
                  </div>
                </div>
              )}

              {/* Floating Move Mode Action Banner */}
              {placementMode?.type === 'move' && (
                <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-30 max-w-[95%] flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs shadow-2xl animate-in fade-in slide-in-from-top-2 ${
                  isLight
                    ? 'border-indigo-500 bg-white/95 text-indigo-950 shadow-indigo-900/10'
                    : 'border-indigo-500/60 bg-gray-950/95 text-indigo-200 shadow-indigo-950/50'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold whitespace-nowrap text-[11px] sm:text-xs">
                    <Move className="w-3.5 h-3.5 text-indigo-500 animate-pulse shrink-0" />
                    <span>Move Mode: Drag nodes to position</span>
                  </div>

                  <div className={`h-3.5 w-px ${isLight ? 'bg-slate-300' : 'bg-white/20'} shrink-0`} />

                  <button
                    type="button"
                    onClick={handleSavePositions}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm whitespace-nowrap ${
                      isSavedRecently
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30'
                        : hasUnsavedChanges
                          ? isLight
                            ? 'bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-400/50 shadow-md shadow-blue-500/20'
                            : 'bg-blue-600 hover:bg-blue-500 text-white ring-2 ring-blue-400/40 shadow-blue-500/30'
                          : isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
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
                        <span>{hasUnsavedChanges ? 'Save Positions •' : 'Save Positions'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlacementModeSafe(null)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer transition-colors shadow-lg shadow-indigo-500/20 whitespace-nowrap text-xs"
                  >
                    Done
                  </button>
                </div>
              )}
              {canvasGraph ? (
                <>
                  <NetworkCanvas
                    graph={canvasGraph}
                    activeSteps={sim.activeSteps}
                    scenario={scenario}
                    stepIndex={sim.stepIndex}
                    dynamicEvents={previewDynamicEvents}
                    highlightedNodeId={highlightedNodeId}
                    workspaceView={workspaceView}
                    autoFit={true}
                    cursor={(pickMode || isBlockageMode || (placementMode && placementMode.type !== 'move' && placementMode.type !== 'rename')) ? 'crosshair' : undefined}
                    isMoveMode={placementMode?.type === 'move'}
                    placementModeType={placementMode?.type || null}
                    edgePreview={placementMode?.type === 'edge' && placementMode.sourceNodeId
                      ? { sourceNodeId: placementMode.sourceNodeId, edgeType: placementMode.edgeType }
                      : null}
                    onNodeMoveEnd={handleNodeMoveEnd}
                    onDeselect={() => setHighlightedNodeId(null)}
                    onNodeClick={(nodeId) => {
                      // 1. Endpoint picking has priority
                      if (pickMode) { handlePickClick(nodeId); return; }
                      // 2. Custom blockage painting
                      if (isBlockageMode) { toggleBlockNode(nodeId); return; }

                      // Topology Editor: Move Node (click is handled via dragging)
                      if (placementMode?.type === 'move') {
                        return;
                      }

                      // Topology Editor: Rename Node
                      if (placementMode?.type === 'rename') {
                        const node = canvasGraph.nodes.find((n: any) => n.id === nodeId);
                        if (node) {
                          const label = (node.label || node.id).slice(0, MAX_NODE_LABEL_LENGTH);
                          setRenamingNode({ id: nodeId, label, type: node.type });
                          setRenameInput(label);
                        }
                        return;
                      }
                      
                      // Topology Editor: Delete Node
                      if (placementMode?.type === 'delete') {
                        stageManualGraphEdit(graph => ({
                          ...graph,
                          nodes: graph.nodes.filter(n => n.id !== nodeId),
                          edges: graph.edges.filter(e => e.from !== nodeId && e.to !== nodeId)
                        }));
                        return;
                      }

                      // Topology Editor: Connect Edge
                      if (placementMode?.type === 'edge') {
                        if (!placementMode.sourceNodeId) {
                          setPlacementModeSafe({ ...placementMode, sourceNodeId: nodeId });
                        } else {
                          const src = placementMode.sourceNodeId;
                          if (src !== nodeId) {
                            let finalEdgeType = placementMode.edgeType;
                            
                            const t1 = canvasGraph.nodes.find((n: any) => n.id === src)?.type || '';
                            const t2 = canvasGraph.nodes.find((n: any) => n.id === nodeId)?.type || '';
                            
                            const isSwitch = (t: string) => ['switch', 'multilayer_switch', 'access_switch', 'floor_router'].includes(t);
                            const isRouter = (t: string) => ['router', 'datacenter', 'building_router'].includes(t);
                            const isHost = (t: string) => ['end_device', 'server'].includes(t);
                            const isWireless = (t: string) => ['wireless_ap', 'access_point'].includes(t);

                            const isMDI = (t: string) => isRouter(t) || isHost(t) || isWireless(t);
                            const isMDIX = (t: string) => isSwitch(t);

                            if (finalEdgeType === 'auto_connect') {
                              if ((isWireless(t1) && isHost(t2)) || (isWireless(t2) && isHost(t1))) {
                                finalEdgeType = 'wireless';
                              } else if (isRouter(t1) && isRouter(t2)) {
                                finalEdgeType = 'serial';
                              } else {
                                if (isMDI(t1) && isMDI(t2)) finalEdgeType = 'copper_crossover';
                                else if (isMDIX(t1) && isMDIX(t2)) finalEdgeType = 'copper_crossover';
                                else if ((isMDI(t1) && isMDIX(t2)) || (isMDIX(t1) && isMDI(t2))) finalEdgeType = 'copper_straight';
                                else finalEdgeType = 'copper_straight';
                              }
                            } else {
                              let isValid = true;
                              if (finalEdgeType === 'copper_straight') {
                                isValid = (isMDI(t1) && isMDIX(t2)) || (isMDIX(t1) && isMDI(t2));
                              } else if (finalEdgeType === 'copper_crossover') {
                                isValid = (isMDI(t1) && isMDI(t2)) || (isMDIX(t1) && isMDIX(t2));
                              } else if (finalEdgeType === 'serial') {
                                isValid = isRouter(t1) && isRouter(t2);
                              } else if (finalEdgeType === 'fiber') {
                                const hasFiber = (t: string) => isSwitch(t) || isRouter(t) || t === 'server';
                                isValid = hasFiber(t1) && hasFiber(t2);
                              } else if (finalEdgeType === 'wireless') {
                                isValid = (isWireless(t1) && isHost(t2)) || (isHost(t1) && isWireless(t2)) || (isWireless(t1) && isWireless(t2));
                              }

                              if (!isValid) {
                                showConnectionError(`Incompatible connection: Cannot use a ${finalEdgeType.replace(/_/g, ' ')} cable between a ${t1.replace(/_/g, ' ')} and a ${t2.replace(/_/g, ' ')}.`);
                                setPlacementModeSafe({ ...placementMode, sourceNodeId: undefined });
                                return;
                              }
                            }

                            stageManualGraphEdit(graph => ({
                              ...graph,
                              edges: [...graph.edges, {
                                id: `edge_${Date.now()}`,
                                from: src,
                                to: nodeId,
                                type: finalEdgeType as any,
                                bandwidth: 1000,
                                latency: 1,
                                status: 'active'
                              }]
                            }));
                          }
                          setPlacementModeSafe({ ...placementMode, sourceNodeId: undefined });
                        }
                        return;
                      }

                      // 3. Default: highlight (robotics)
                      if (scenario === 'robotics') {
                        setHighlightedNodeId(prev => prev === nodeId ? null : nodeId);
                      }
                    }}
                    onEdgeClick={(edgeId) => {
                      if (placementMode?.type === 'delete') {
                        stageManualGraphEdit(graph => ({
                          ...graph,
                          edges: graph.edges.filter(e => e.id !== edgeId)
                        }));
                      }
                    }}
                    onCanvasClick={(x, y, activeFloor) => {
                      if (placementMode?.type === 'node') {
                        if (scenario === 'evacuation' && ['building', 'city', 'synthetic'].includes(sim.mapId ?? '')) {
                          const isSMRosa = sim.mapId === 'building';
                          const isAyala = sim.mapId === 'city';
                          const mapWidth = isSMRosa ? 180000 : isAyala ? 67200 : 58000;
                          const mapHeight = isSMRosa ? 126500 : isAyala ? 53200 : 36000;
                          const minY = isSMRosa && activeFloor === 'L2' ? 19900 : 0;
                          if (x < 0 || x > mapWidth || y < minY || y > mapHeight) {
                            showConnectionError('Place nodes within the current floor plan.');
                            return;
                          }
                        }
                        if (scenario === 'robotics' && ['aws', 'awsWarehouse', 'clinic'].includes(sim.mapId ?? '')) {
                          const isAwsWarehouse = sim.mapId === 'aws' || sim.mapId === 'awsWarehouse';
                          // AWS placement bounds follow the horizontally transformed perimeter wall.
                          const bounds = isAwsWarehouse
                            ? { minX: -13750, maxX: 62500, minY: -3600, maxY: 47000 }
                            : { minX: -48.28, maxX: 1541, minY: -81.08, maxY: 1264 };
                          if (x < bounds.minX || x > bounds.maxX || y < bounds.minY || y > bounds.maxY) {
                            showConnectionError('Place nodes within the building floor plan.');
                            return;
                          }
                        }
                        const nodeType = placementMode.nodeType;
                        const newNode = {
                          id: `${nodeType}_${Date.now()}`,
                          type: nodeType,
                          label: nodeType.replace(/_/g, ' '),
                          x,
                          y,
                          ...(scenario === 'evacuation' && ['building', 'city', 'synthetic'].includes(sim.mapId ?? '')
                            ? { buildingId: activeFloor ?? 'GL' }
                            : {}),
                          level: 0,
                          status: 'active'
                        };
                        stageManualGraphEdit(graph => ({ ...graph, nodes: [...graph.nodes, newNode] }));
                      }
                    }}
                    mapId={sim.mapId}
                    shelfBoxCounts={sim.shelfBoxCounts}
                    robotAssignments={sim.robotAssignments}
                    activeAlgorithms={sim.activeAlgorithms}
                    isFinished={isSimulationFinished}
                    status={sim.status}
                    totalSteps={sim.totalSteps}
                    showHopBadges={showHopBadges}
                  />

                  {/* Pick toast */}
                  {pickToast && (
                    <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg border text-xs font-bold shadow-lg animate-fadeIn pointer-events-none ${pickToast.ok
                      ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-300'
                      : 'bg-red-950/95 border-red-500/60 text-red-300'}`}>
                      {pickToast.msg}
                    </div>
                  )}

                  {scenario === 'network' && (sim.mapId === 'companybusiness' || sim.mapId === 'campus') && terminalNodeId && (
                    <CiscoTerminal nodeId={terminalNodeId} onClose={() => setTerminalNodeId(null)} />
                  )}

                  {scenario === 'network' && (sim.mapId === 'companybusiness' || sim.mapId === 'campus') && (
                    <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
                      {canvasGraph.nodes
                        .filter((n: any) => ['mlt_sw1', 'main_router', 'college_router', 'hostel_router'].includes(n.id))
                        .map((n: any) => (
                          <button
                            key={`terminal-btn-${n.id}`}
                            onClick={(e) => { e.stopPropagation(); setTerminalNodeId(prev => prev === n.id ? null : n.id); }}
                            className={`px-3 py-1.5 rounded border font-mono text-xs shadow-md flex items-center gap-2 transition-colors cursor-pointer ${terminalNodeId === n.id
                              ? 'bg-gray-800 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                              : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                              }`}
                          >
                            {n.label ? n.label.split('\n')[0] : n.id} Terminal
                          </button>
                        ))}
                    </div>
                  )}

                  {sim.isGraphLoading && (
                    <div className="absolute inset-0 bg-[#0a0f1e]/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white gap-3 z-50 transition-all">
                      <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                      <span className="text-sm font-mono tracking-wider font-bold shadow-black drop-shadow-md">Resyncing Map...</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 bg-[#0a0f1e] flex flex-col items-center justify-center text-gray-500 gap-3">
                  <div className="w-6 h-6 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-sm font-mono tracking-wider">Syncing Topology Data...</span>
                </div>
              )}
            </div>

            {/* Playback Controls */}
            <div data-tutorial="tutorial-playback-controls" className="mt-1 flex flex-col items-center gap-1.5 sm:gap-2 w-full shrink-0 pb-0.5">
              {/* Row 1: Primary Simulation Playback Controls */}
              <div className="flex items-center gap-2 flex-wrap justify-center w-full">
                <button disabled={sim.isComputing || sim.isGraphLoading} onClick={() => sim.requestReset(sim.handleReset, sim.status, sim.isCurrentSaved)} className={scenarioBtnClass}>
                  <Ico name="reset" /> Reset
                </button>
                <button disabled={sim.isComputing || sim.isGraphLoading || sim.stepIndex === 0} onClick={sim.handleStepBackward} className={scenarioBtnClass}>
                  <Ico name="back" /> Back
                </button>

                {sim.status === 'running' ? (
                  <button disabled={sim.isComputing || sim.isGraphLoading} onClick={sim.handlePause} className={`${primaryBtnClass} bg-red-600/20 border border-red-500/60 text-red-300 hover:bg-red-600/40 hover:shadow-red-900/40`}>
                    <Ico name="pause" /> Pause
                  </button>
                ) : sim.status === 'paused' ? (
                  <button disabled={sim.isComputing || sim.isGraphLoading} onClick={sim.handleResume} className={`${primaryBtnClass} bg-green-600/20 border border-green-500/60 text-green-300 hover:bg-green-600/40 hover:shadow-green-900/40`}>
                    <Ico name="play" /> Resume
                  </button>
                ) : sim.status === 'done' ? (
                  <button disabled={sim.isComputing || sim.isGraphLoading} onClick={sim.handleRun} className={`${primaryBtnClass} bg-blue-600/20 border border-blue-500/60 text-blue-300 hover:bg-blue-600/40 hover:shadow-blue-900/40`}>
                    <Ico name="play" /> Replay
                  </button>
                ) : (
                  <button
                    disabled={sim.isComputing || sim.isGraphLoading}
                    onClick={() => {
                      if (isBlockageMode) toggleBlockageMode();
                      sim.handleRun();
                    }}
                    className={`${primaryBtnClass} bg-green-600/10 border border-green-500/60 text-green-400 hover:bg-green-600/30 hover:shadow-green-900/40`}
                  >
                    {sim.isComputing ? (
                      <>
                        Computing…
                        {sim.computeProgress > 0 && (
                          <span className="ml-1.5 font-mono text-[11px] opacity-90">{sim.computeProgress}%</span>
                        )}
                      </>
                    ) : (<><Ico name="play" /> Run Simulations</>)}
                  </button>
                )}

                <button disabled={sim.isComputing || sim.isGraphLoading || sim.stepIndex >= sim.totalSteps} onClick={sim.handleStepForward} className={scenarioBtnClass}>
                  <Ico name="fwd" /> Fwd
                </button>
                <button disabled={sim.isComputing || sim.isGraphLoading} onClick={() => sim.requestSkip(sim.handleSkipEnd, sim.status, sim.isCurrentSaved)} className={scenarioBtnClass}>
                  <Ico name="skip" /> Skip
                </button>
              </div>

              {/* Row 2: Secondary Tool Actions (Block Nodes, Reroll Events) and Speed Controller */}
              <div className="flex items-center gap-2.5 flex-wrap justify-center">
                <button
                  disabled={blockageDisabled}
                  onClick={toggleBlockageMode}
                  title={blockageDisabled ? 'Pause the simulation to edit blocked nodes' : 'Paint blocked nodes on the map'}
                  className={`${scenarioBtnClass} ${isBlockageMode ? activeTabClass : ''}`}
                >
                  <Ico name="block" /> Block Nodes
                </button>
                <button disabled={sim.isComputing || sim.isGraphLoading} onClick={() => sim.requestReroll(sim.handleRerollEvents, sim.status, sim.isCurrentSaved)} className={scenarioBtnClass}>
                  <Ico name="reroll" /> Reroll Events
                </button>

                {/* Speed Controller */}
                <SpeedController
                  playbackSpeed={sim.playbackSpeed}
                  handleSpeedChange={sim.handleSpeedChange}
                  scenario={scenario}
                />
              </div>
            </div>
          </main>

          {/* ── Right Sidebar: Reports / Events / Panels ──────────────────────── */}
          <ResizableSidebar
            side="right"
            storageKey="sim_right_panel"
            defaultWidth={360}
            minWidth={300}
            maxWidth={480}
            className="border-t lg:border-t-0 lg:border-l border-white/5 lg:max-h-[calc(100vh-theme(spacing.20))] bg-[#0a0f1e]/50 backdrop-blur-sm"
            innerClassName="p-4 flex flex-col gap-4"
          >


            {sim.simResults && !sim.isComputing && sim.status === 'done' && sim.currentGraph && (
              <div className="shrink-0">
                <SimulationReport
                  multiResults={sim.simResults}
                  bfsResult={sim.bfsResult}
                  totalNodes={sim.currentGraph.nodes.length}
                  dynamicEvents={sim.simResults.hybrid.dynamicEvents}
                  onSaveResult={sim.openSaveModal}
                  isSaved={sim.isCurrentSaved}
                  scenarioColor={sc?.color}
                  activeAlgorithms={sim.activeAlgorithms}
                  scenario={scenario}
                />
              </div>
            )}

            <div className="shrink-0" data-tutorial="tutorial-map-events">
              <DynamicMapEvents
                dynamicEvents={previewDynamicEvents}
                stepIndex={sim.stepIndex}
                simResults={sim.simResults}
                scenario={scenario}
                onEventClick={handleEventClick}
                highlightedNodeId={highlightedNodeId}
                activeAlgorithms={sim.activeAlgorithms}
              />
            </div>

            {/* Algorithm path trace logs (always visible, tabbed BFS / DFS / Hybrid) */}
            <div className="shrink-0">
              <ExpertModePanel
                activeSteps={sim.activeSteps}
                activeAlgorithms={sim.activeAlgorithms}
                isFinished={isSimulationFinished}
                showHopBadges={showHopBadges}
                onToggleHopBadges={() => setShowHopBadges(v => !v)}
                highlightedNodeId={highlightedNodeId}
                onNodeClick={handlePathNodeClick}
                getNodeLabel={nodeLabel}
              />
            </div>

            {scenario === 'robotics' && sim.currentGraph && (
              <div data-tutorial="tutorial-scenario-panels" className="flex flex-col gap-4 shrink-0 w-full">
                <RobotAssignmentPanel
                  assignments={sim.robotAssignments}
                  setAssignments={sim.setRobotAssignments}
                  depotNodes={sim.currentGraph.nodes.filter(n => n.type === 'depot')}
                  shelfNodes={sim.currentGraph.nodes.filter(n => n.type === 'delivery_bay')}
                  disabled={sim.isComputing || sim.status === 'running'}
                  mapId={sim.mapId}
                  simStatus={sim.status}
                  onRequestOpenWhileActive={(openPanel) => {
                    sim.requestRobotAssignmentOpen(openPanel);
                  }}
                />
                <RobotLiveStatusPanel
                  assignments={sim.robotAssignments}
                  activeSteps={sim.activeSteps}
                  graphNodes={sim.currentGraph.nodes}
                  onRobotClick={(nodeId) => setHighlightedNodeId(nodeId)}
                  mapId={sim.mapId}
                  activeAlgorithms={sim.activeAlgorithms}
                />
              </div>
            )}

            {sim.mapId === 'campus' && scenario === 'network' && (
              <div data-tutorial="tutorial-scenario-panels" className={`shrink-0 rounded-xl p-4 flex flex-col gap-2 max-h-[40vh] overflow-y-auto transition-colors ${
                isLight ? 'bg-white border border-slate-200/90 shadow-sm text-slate-800' : 'bg-gray-900 border border-indigo-900/50'
              }`}>
                <div className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-1 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>Campus Topology Rules</div>
                <div className={`text-xs space-y-3 leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-gray-300'}`}>
                  <div>
                    <p className={`font-semibold mb-1 ${isLight ? 'text-slate-900 font-bold' : 'text-gray-100'}`}>1. Routed Traffic with ACLs</p>
                    <p className={`mb-1 ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>Traffic across subnets hits default gateways where routers apply Access Control Lists (ACLs):</p>
                    <ul className={`list-disc pl-4 space-y-1 ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                      <li><span className={`${isLight ? 'text-blue-700' : 'text-blue-300'} font-semibold`}>Boys Block (192.168.3.x)</span> can ONLY communicate with <span className={`${isLight ? 'text-blue-700' : 'text-blue-300'} font-semibold`}>AB1</span></li>
                      <li><span className={`${isLight ? 'text-pink-700' : 'text-pink-300'} font-semibold`}>Girls Block (192.168.3.x)</span> can ONLY communicate with <span className={`${isLight ? 'text-pink-700' : 'text-pink-300'} font-semibold`}>AB2</span></li>
                      <li>Packets to unauthorized zones are dropped at the College Router.</li>
                    </ul>
                    <p className={`italic mt-1.5 text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>Why? This simulates a strict university security policy, intentionally isolating student dormitories to specific academic clusters to prevent unauthorized campus-wide network access.</p>
                  </div>
                  <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-gray-800'}`}>
                    <p className={`font-semibold mb-1 ${isLight ? 'text-slate-900 font-bold' : 'text-gray-100'}`}>2. Local Switched Traffic</p>
                    <p className={isLight ? 'text-slate-700' : 'text-gray-400'}>The <span className={`${isLight ? 'text-amber-700' : 'text-yellow-400'} font-semibold`}>Yellow Zone (IT, Library, Dome)</span> shares a single subnet (192.168.1.x). Their traffic never touches a router; it flows freely via Layer 2 switching on S0, bypassing all security ACLs.</p>
                    <p className={`italic mt-1.5 text-[10px] ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>Why? This demonstrates how devices on the same local network (VLAN) communicate directly and efficiently through switches, avoiding router bottlenecks and firewall restrictions.</p>
                  </div>
                </div>
              </div>
            )}

            {scenario === 'gameai' && (
              <div data-tutorial="tutorial-scenario-panels" className="shrink-0">
                <StrategyMapEvents
                  dynamicEvents={previewDynamicEvents}
                  stepIndex={sim.stepIndex}
                  simResults={sim.simResults}
                  activeAlgorithms={sim.activeAlgorithms}
                />
              </div>
            )}

            {/* Synthetic Size Adjuster */}
            {sim.mapId === 'synthetic' && (
              <div data-tutorial="tutorial-size-adjuster" className="shrink-0 glass-panel rounded-xl p-4 flex flex-col gap-2 fade-in hover:shadow-glow-blue transition-shadow duration-500 relative overflow-hidden">
                {isManuallyEdited && (
                  <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center animate-in fade-in ${
                    isLight 
                      ? 'bg-white/95 backdrop-blur-xs border border-slate-200 shadow-sm' 
                      : 'bg-black/70 backdrop-blur-[2px]'
                  }`}>
                    <span className={`text-xs font-bold mb-2.5 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>Map has been manually edited.</span>
                    <button 
                      onClick={() => sim.forceRefetchGraph(true)}
                      style={{ color: '#ffffff' }}
                      className="bg-blue-600 hover:bg-blue-500 !text-white text-[11px] uppercase tracking-wider font-extrabold px-4 py-2 rounded-lg transition-colors shadow-md shadow-blue-600/30 cursor-pointer"
                    >
                      Reset to Default Map
                    </button>
                  </div>
                )}
                
                <div className={`text-[10px] uppercase tracking-[0.2em] font-extrabold mb-1 ${isLight ? 'text-slate-700' : 'text-gray-500'} ${isManuallyEdited ? 'opacity-30' : ''}`}>Dynamic Size Adjuster</div>

                <div className={`flex items-center justify-between gap-2 ${isManuallyEdited ? 'opacity-30' : ''}`}>
                  {/* Nodes */}
                  <label className={`flex items-center gap-1.5 flex-1 rounded-md border shadow-inner pl-3 pr-0 py-1 overflow-hidden transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 focus-within:border-teal-600'
                      : 'border-white/10 bg-black/40 ' + (SIZE_ADJUSTER_THEME[scenario]?.border || 'focus-within:border-teal-500')
                  }`}>
                    <span className={`text-[10px] uppercase tracking-widest font-bold flex-1 ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>Nodes</span>
                    <div className={`flex items-stretch border-l h-full ml-1 ${isLight ? 'bg-white border-slate-300' : 'bg-black/60 border-white/10'}`}>
                      <input
                        type="number"
                        min={MIN_SYNTHETIC_NODES[sim.sizingKey as SizingKey]}
                        max={MAX_SYNTHETIC_NODES[sim.sizingKey as SizingKey]}
                        value={sim.localNodesInput}
                        onKeyDown={(e) => {
                          if (['e', 'E', '-', '+', '.'].includes(e.key)) e.preventDefault();
                          if (e.key === 'Enter') {
                            const raw = sim.localNodesInput;
                            if (raw !== '') {
                              const max = MAX_SYNTHETIC_NODES[sim.sizingKey as SizingKey];
                              const min = MIN_SYNTHETIC_NODES[sim.sizingKey as SizingKey];
                              const clamped = Math.min(max, Math.max(min, Number(raw)));
                              sim.setLocalNodesInput(String(clamped));
                              sim.requestSizingChange('nodes', clamped, sim.status, sim.isCurrentSaved);
                            }
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, '');
                          if (raw === '') { sim.setLocalNodesInput(''); return; }
                          const max = MAX_SYNTHETIC_NODES[sim.sizingKey as SizingKey];
                          if (Number(raw) > max) {
                            sim.setLocalNodesInput(String(max));
                          } else {
                            sim.setLocalNodesInput(raw);
                          }
                        }}
                        onBlur={() => {
                          if (sim.localNodesInput === '') {
                            sim.setLocalNodesInput(String(sim.syntheticSizing.nodes));
                          } else {
                            const max = MAX_SYNTHETIC_NODES[sim.sizingKey as SizingKey];
                            const min = MIN_SYNTHETIC_NODES[sim.sizingKey as SizingKey];
                            const clamped = Math.min(max, Math.max(min, Number(sim.localNodesInput)));
                            sim.setLocalNodesInput(String(clamped));
                            sim.requestSizingChange('nodes', clamped, sim.status, sim.isCurrentSaved);
                          }
                        }}
                        disabled={sim.isComputing || sim.isGraphLoading}
                        className={`w-12 px-0.5 bg-transparent py-1 text-center text-xs font-extrabold ${
                          isLight ? 'text-slate-900' : (SIZE_ADJUSTER_THEME[scenario]?.text || 'text-teal-300')
                        } focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 m-0`}
                      />
                      <div className={`flex flex-col border-l w-5 ${isLight ? 'border-slate-300 bg-slate-100' : 'border-white/10 bg-black/40'}`}>
                        <button
                          type="button"
                          disabled={sim.isComputing || sim.isGraphLoading || sim.syntheticSizing.nodes >= MAX_SYNTHETIC_NODES[sim.sizingKey as SizingKey]}
                          onClick={() => sim.requestSizingStep('nodesUp', sim.status, sim.isCurrentSaved)}
                          className={`flex-1 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center ${
                            isLight ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button
                          type="button"
                          disabled={sim.isComputing || sim.isGraphLoading || sim.syntheticSizing.nodes <= MIN_SYNTHETIC_NODES[sim.sizingKey as SizingKey]}
                          onClick={() => sim.requestSizingStep('nodesDown', sim.status, sim.isCurrentSaved)}
                          className={`flex-1 border-t transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center ${
                            isLight ? 'border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-200' : 'border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </div>
                  </label>

                  {/* Links */}
                  <label className={`flex items-center gap-1.5 flex-1 rounded-md border shadow-inner pl-3 pr-0 py-1 overflow-hidden transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 focus-within:border-teal-600'
                      : 'border-white/10 bg-black/40 ' + (SIZE_ADJUSTER_THEME[scenario]?.border || 'focus-within:border-teal-500')
                  }`}>
                    <span className={`text-[10px] uppercase tracking-widest font-bold flex-1 ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>Links</span>
                    <div className={`flex items-stretch border-l h-full ml-1 ${isLight ? 'bg-white border-slate-300' : 'bg-black/60 border-white/10'}`}>
                      <input
                        type="number"
                        min={MIN_SYNTHETIC_LINKS[scenario]}
                        max={MAX_SYNTHETIC_LINKS[sim.sizingKey as SizingKey]}
                        value={sim.localEdgesInput}
                        onKeyDown={(e) => {
                          if (['e', 'E', '-', '+', '.'].includes(e.key)) e.preventDefault();
                          if (e.key === 'Enter') {
                            const raw = sim.localEdgesInput;
                            if (raw !== '') {
                              const max = MAX_SYNTHETIC_LINKS[sim.sizingKey as SizingKey];
                              const min = MIN_SYNTHETIC_LINKS[scenario];
                              const clamped = Math.min(max, Math.max(min, Number(raw)));
                              sim.setLocalEdgesInput(String(clamped));
                              sim.requestSizingChange('edges', clamped, sim.status, sim.isCurrentSaved);
                            }
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, '');
                          if (raw === '') { sim.setLocalEdgesInput(''); return; }
                          const max = MAX_SYNTHETIC_LINKS[sim.sizingKey as SizingKey];
                          if (Number(raw) > max) {
                            sim.setLocalEdgesInput(String(max));
                          } else {
                            sim.setLocalEdgesInput(raw);
                          }
                        }}
                        onBlur={() => {
                          if (sim.localEdgesInput === '') {
                            sim.setLocalEdgesInput(String(sim.syntheticSizing.edges));
                          } else {
                            const max = MAX_SYNTHETIC_LINKS[sim.sizingKey as SizingKey];
                            const min = MIN_SYNTHETIC_LINKS[scenario];
                            const clamped = Math.min(max, Math.max(min, Number(sim.localEdgesInput)));
                            sim.setLocalEdgesInput(String(clamped));
                            sim.requestSizingChange('edges', clamped, sim.status, sim.isCurrentSaved);
                          }
                        }}
                        disabled={scenario === 'gameai' || sim.isComputing || sim.isGraphLoading}
                        className={`w-12 px-0.5 bg-transparent py-1 text-center text-xs font-extrabold ${
                          isLight ? 'text-slate-900' : (SIZE_ADJUSTER_THEME[scenario]?.text || 'text-teal-300')
                        } focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 m-0`}
                      />
                      <div className={`flex flex-col border-l w-5 ${isLight ? 'border-slate-300 bg-slate-100' : 'border-white/10 bg-black/40'}`}>
                        <button
                          type="button"
                          disabled={scenario === 'gameai' || sim.isComputing || sim.isGraphLoading || sim.generatedEdgeCount >= MAX_SYNTHETIC_LINKS[sim.sizingKey as SizingKey]}
                          onClick={() => sim.requestSizingStep('edgesUp', sim.status, sim.isCurrentSaved)}
                          className={`flex-1 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center ${
                            isLight ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button
                          type="button"
                          disabled={scenario === 'gameai' || sim.isComputing || sim.isGraphLoading || sim.generatedEdgeCount <= MIN_SYNTHETIC_LINKS[scenario]}
                          onClick={() => sim.requestSizingStep('edgesDown', sim.status, sim.isCurrentSaved)}
                          className={`flex-1 border-t transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center ${
                            isLight ? 'border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-200' : 'border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </div>
                  </label>
                </div>

                <div className={`text-center mt-1 text-[9px] tracking-wider font-semibold ${isLight ? 'text-slate-600' : 'text-gray-500'}`}>
                  Generated: {sim.generatedNodeCount} nodes / {sim.generatedEdgeCount} links
                </div>
              </div>
            )}

            {/* Game AI topology is governed by the board rules. */}
            {scenario !== 'gameai' && <TopologyEditor
              scenario={scenario}
              mapId={sim.mapId}
              placementMode={placementMode}
              setPlacementMode={setPlacementModeSafe}
              onClearGraph={() => setTopologyConfirmation('clear')}
              onSavePositions={handleSavePositions}
              onSaveAsDefault={handleSaveAsDefault}
              onUndoSaveAsDefault={handleUndoSaveAsDefault}
              defaultUndoSeconds={defaultUndoSeconds}
              onUndo={handleUndoTopology}
              onApplyManualEdits={applyManualGraphEdits}
              hasPendingManualEdits={manualEditGraph !== null}
              onResetLayout={handleResetPositions}
              canResetLayout={shouldShowResetLayout}
              canUndo={undoHistory.length > 0 && manualEditGraph === null}
              hasUnsavedChanges={hasUnsavedChanges}
              isSavedRecently={isSavedRecently}
              isDefaultSavedRecently={isDefaultSavedRecently}
              disabled={editorDisabled}
            />}
          </ResizableSidebar>
        </div>
      </div>

      {/* ── History Modal ──────────────────────────────────────────────────────── */}
      <HistoryModal
        isOpen={sim.isHistoryModalOpen}
        onClose={() => sim.setIsHistoryModalOpen(false)}
        history={sim.history}
        scenario={scenario}
        onDeleteHistory={sim.handleDeleteHistory}
        onRestoreHistory={sim.handleRestoreHistory}
        onImportHistory={sim.handleImportHistory}
        activeAlgorithms={sim.activeAlgorithms}
      />

      {/* ── Save Result Modal ──────────────────────────────────────────────────── */}
      {sim.isSaveModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity">
          <div className={`rounded-xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden border ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-gray-900 border-gray-700 text-white shadow-[0_0_50px_rgba(0,0,0,0.8)]'
          }`}>
            <div className="p-6">
              <h3 className={`text-lg font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>💾 Save Result to History</h3>
              <p className={`text-sm mb-5 ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Enter a custom name for this simulation run to easily identify it later.</p>
              <input
                type="text"
                value={sim.saveNameInput}
                onChange={(e) => sim.setSaveNameInput(e.target.value)}
                placeholder={sim.saveDefaultName}
                className={`w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 font-medium transition-all ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20 placeholder:text-slate-400'
                    : 'bg-gray-800 border border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500'
                }`}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && sim.confirmSaveResult()}
              />
            </div>
            <div className={`border-t p-4 flex justify-end gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-gray-950 border-gray-800'
            }`}>
              <button 
                onClick={() => sim.setIsSaveModalOpen(false)} 
                className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                  isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                Cancel
              </button>
              <button 
                onClick={() => sim.confirmSaveResult()} 
                disabled={sim.isCurrentSaved || sim.isComputing} 
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] cursor-pointer disabled:opacity-50"
              >
                Save Result
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rename Node Modal ──────────────────────────────────────────────────── */}
      {renamingNode && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity animate-fadeIn"
          onClick={() => setRenamingNode(null)}
        >
          <div 
            className={`rounded-xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden border ${
              isLight ? 'bg-white border-slate-200 text-slate-900 shadow-xl' : 'bg-gray-900 border-gray-700 text-white shadow-[0_0_50px_rgba(0,0,0,0.8)]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                  isLight ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-amber-950/60 text-amber-400 border border-amber-700/50'
                }`}>
                  <PenLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Rename Node
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                    Change the display label for this device
                  </p>
                </div>
              </div>

              {/* Node Info Badge */}
              <div className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs mb-4 font-mono ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-black/40 border-gray-800 text-gray-300'
              }`}>
                <span className={`px-2 py-0.5 rounded text-[11px] font-sans font-bold uppercase tracking-wider ${
                  isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-900/40 text-amber-300'
                }`}>
                  {renamingNode.type.replace(/_/g, ' ')}
                </span>
                <span className="truncate text-[11px] text-gray-400">ID: {renamingNode.id}</span>
              </div>

              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${
                isLight ? 'text-slate-700' : 'text-gray-300'
              }`}>
                Node Name / Label
              </label>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                maxLength={MAX_NODE_LABEL_LENGTH}
                placeholder="Enter node label..."
                className={`w-full rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 font-medium text-sm transition-all ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-amber-500 focus:ring-amber-500/20 placeholder:text-slate-400'
                    : 'bg-gray-800 border border-gray-600 text-white focus:border-amber-500 focus:ring-amber-500'
                }`}
                autoFocus
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmNodeRename();
                  if (e.key === 'Escape') setRenamingNode(null);
                }}
              />
              <p className={`mt-1 text-[11px] text-right ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
                {renameInput.length}/{MAX_NODE_LABEL_LENGTH} characters
              </p>
            </div>
            
            <div className={`border-t p-4 flex justify-end gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-gray-950 border-gray-800'
            }`}>
              <button 
                type="button"
                onClick={() => setRenamingNode(null)} 
                className={`px-5 py-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleConfirmNodeRename}
                disabled={!renameInput.trim()} 
                className="px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-[0_0_15px_rgba(217,119,6,0.3)] cursor-pointer disabled:opacity-50"
              >
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
