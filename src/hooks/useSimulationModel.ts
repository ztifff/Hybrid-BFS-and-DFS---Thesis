import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameAIBoard, GraphSizing, RobotAssignment, ScenarioGraph, ScenarioType, SimulationResult } from '../types';
import { loadLocalHistory, persistLocalHistory } from '../utils/historyHelpers';
import { HistoryEntry } from '../components/HistoryModal';
import { MAP_REGISTRY } from '../config/mapRegistry';

export type MultiResultsLocal = {
  bfs: SimulationResult;
  dfs: SimulationResult;
  hybrid: SimulationResult;
};

export type SizingKey = ScenarioType | 'gameai-dama' | 'gameai-checkers';

// ── Exported constants (used by SimulationView for rendering) ──────────────────
export const GAME_AI_BOARDS: { id: GameAIBoard; label: string; icon: string }[] = [
  { id: 'dama', label: 'Turkish Draughts', icon: '🔵' },
  { id: 'checkers', label: 'Checkers', icon: '⚫' },
];

export const MIN_SYNTHETIC_LINKS: Record<ScenarioType, number> = {
  network: 4,
  robotics: 18,
  traffic: 4,
  evacuation: 27,
  gameai: 24,
};

export const MAX_SYNTHETIC_LINKS: Record<SizingKey, number> = {
  network: 185,    // natural generated links at 220 nodes
  robotics: 250,   // natural generated links at 217 nodes
  traffic: 174,    // natural generated links at 220 nodes
  evacuation: 147, // natural generated links at 144 nodes
  gameai: 264,     // natural generated links at 145 nodes
  'gameai-dama': 264,
  'gameai-checkers': 121,
};

// ── Sizing tables ──────────────────────────────────────────────────────────────
const DEFAULT_SYNTHETIC_SIZING: Record<SizingKey, GraphSizing> = {
  network: { nodes: 100, edges: 0 },
  robotics: { nodes: 28, edges: 32 },
  traffic: { nodes: 100, edges: 0 },
  evacuation: { nodes: 60, edges: 49 },
  gameai: { nodes: 65, edges: 120 }, // fallback (unused when board is known)
  'gameai-dama': { nodes: 65, edges: 112 }, // 8×8 dama = 65 natural nodes
  'gameai-checkers': { nodes: 34, edges: 100 }, // 8×8 checkers = 34 natural nodes
};

export const MAX_SYNTHETIC_NODES: Record<SizingKey, number> = {
  network: 220,
  robotics: 141,
  traffic: 220,
  evacuation: 144,
  gameai: 145,
  'gameai-dama': 145,
  'gameai-checkers': 145,
};

export const MIN_SYNTHETIC_NODES: Record<SizingKey, number> = {
  network: 7,
  robotics: 13,
  traffic: 9,
  evacuation: 28,
  gameai: 17,
  'gameai-dama': 17,
  'gameai-checkers': 14
};

// ── Pure helpers (node stepping logic) ────────────────────────────────────────
export function getNextGameAINodes(currentNodes: number, direction: 'up' | 'down', board: GameAIBoard = 'dama'): number {
  if (board === 'dama') {
    const D = Math.round(Math.sqrt(currentNodes - 1));
    const nextD = direction === 'up' ? Math.min(D + 1, 12) : Math.max(D - 1, 4);
    return (nextD * nextD) + 1;
  } else {
    let D = 4;
    while (Math.ceil((D * D) / 2) + 2 <= currentNodes && D <= 12) {
      D++;
    }
    D--;
    const nextD = direction === 'up' ? Math.min(D + 1, 12) : Math.max(D - 1, 4);
    return Math.ceil((nextD * nextD) / 2) + 2;
  }
}

export function getNextRoboticsNodes(currentNodes: number, direction: 'up' | 'down'): number {
  const sizes = [13, 16, 19, 25, 29, 33, 36, 41, 46, 55, 61, 67, 71, 78, 85, 97, 105, 113, 118, 127, 136, 141];
  let currentIndex = sizes.findIndex(s => s >= currentNodes);
  if (currentIndex === -1) currentIndex = sizes.length - 1;

  if (direction === 'up') {
    return sizes[Math.min(currentIndex + 1, sizes.length - 1)];
  } else {
    // If the currentNodes is exactly a size, step down. If it's between sizes, stepping down goes to the previous valid size.
    if (sizes[currentIndex] > currentNodes && currentIndex > 0) {
      return sizes[currentIndex - 1];
    }
    return sizes[Math.max(currentIndex - 1, 0)];
  }
}

// ── Pending navigation type ────────────────────────────────────────────────────
export type PendingNavigationReason = 'unsaved' | 'inprogress';

export type PendingNavigation =
  | { type: 'back'; reason?: PendingNavigationReason }
  | { type: 'reset'; reason: PendingNavigationReason }
  | { type: 'skip'; reason: PendingNavigationReason }
  | { type: 'reroll'; reason: PendingNavigationReason }
  | { type: 'map'; mapId: string; reason?: PendingNavigationReason }
  | { type: 'gameboard'; boardId: GameAIBoard; reason?: PendingNavigationReason }
  | { type: 'sizing'; field: keyof GraphSizing; value: number; reason?: PendingNavigationReason }
  | { type: 'sizing_step'; action: 'nodesUp' | 'nodesDown' | 'edgesUp' | 'edgesDown'; reason?: PendingNavigationReason }
  | { type: 'robot_assignment'; reason: 'inprogress' }
  | { type: 'topology_edit'; reason: PendingNavigationReason };

// ──────────────────────────────────────────────────────────────────────────────

const clampSizing = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)));

export function useSimulationModel(scenario: ScenarioType, onBack?: () => void) {
  // Configuration State
  const [gameBoard, setGameBoard] = useState<GameAIBoard>('dama');
  const [seed, setSeed] = useState(() => Date.now());
  const [mapId, setMapId] = useState<string>('synthetic');
  const [graphSize, setGraphSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [syntheticSizingByScenario, setSyntheticSizingByScenario] = useState(DEFAULT_SYNTHETIC_SIZING);

  // Network Specific State (Device-to-Device Mode)
  const [networkRoutingMode, setNetworkRoutingMode] = useState<'default' | 'device-to-device'>('default');
  const [sourceDevice, setSourceDevice] = useState<string>('sales_pc1');
  const [destinationDevices, setDestinationDevices] = useState<string[]>(['fin_pc1']);
  const [deliveryMode, setDeliveryMode] = useState<'anycast' | 'multicast'>('anycast');

  // Evacuation: user-selectable starting room (applies to 'city' and 'building' maps)
  const [evacuationSourceId, setEvacuationSourceId] = useState<string | null>(null);

  // Traffic: user-selectable starting point and destination
  const [trafficSourceId, setTrafficSourceId] = useState<string | null>(null);
  const [trafficDestinationIds, setTrafficDestinationIds] = useState<string[]>([]);

  // Game AI: user-selectable starting point (first row nodes)
  const [gameAISourceId, setGameAISourceId] = useState<string | null>(null);

  // Manual Blockages
  const [customBlockedNodes, setCustomBlockedNodes] = useState<{ nodeId: string; label: string }[]>([]);
  const [forceGraphRefetch, setForceGraphRefetch] = useState(0);

  useEffect(() => {
    setEvacuationSourceId(null);
    setTrafficSourceId(null);
    setTrafficDestinationIds([]);
    setGameAISourceId(null);
    setCustomBlockedNodes([]);
  }, [mapId, scenario, gameBoard]);

  // ✅ Multi-Agent Robotics: Per-robot destination assignments
  const [robotAssignments, setRobotAssignments] = useState<RobotAssignment[]>([
    { robotId: 'depot', destinations: ['dest_finish_1', 'dest_finish_2'], boxCounts: { 'dest_finish_1': 6, 'dest_finish_2': 6 } }
  ]);

  // Derived: sourceDevices and destinationDevices from robotAssignments
  // IMPORTANT: wrapped in useMemo so they maintain referential stability across renders.
  // Without this, a new array reference is created on every render, causing useEffect
  // dependency checks to fire continuously (infinite loop / blinking resync).
  const sourceDevices = useMemo(
    () => robotAssignments.map(r => r.robotId),
    [robotAssignments]
  );
  const destinationDevices_robotics = useMemo(
    () => [...new Set(robotAssignments.flatMap(r => r.destinations))],
    [robotAssignments]
  );

  // Compound key: game AI boards have their own independent sizing slots.
  // We explicitly check if the board-specific key exists in the defaults to avoid
  // TypeScript errors from board names (e.g. 'snakes') not listed in SizingKey.
  const boardKey = `gameai-${gameBoard}` as string;
  const sizingKey: SizingKey = scenario === 'gameai' && boardKey in DEFAULT_SYNTHETIC_SIZING
    ? (boardKey as SizingKey)
    : scenario;

  const syntheticSizing = syntheticSizingByScenario[sizingKey] ?? DEFAULT_SYNTHETIC_SIZING[sizingKey];
  const updateSyntheticSizing = useCallback((field: keyof GraphSizing, rawValue: number) => {
    // We set min to 0 here to allow the user to freely type single digits (like '2' for '200')
    // without the input instantly locking to the minimum (e.g. 7). The backend generators
    // will safely clamp the final value to the actual scenario minimums anyway.
    const min = 0;
    const max = field === 'nodes' ? MAX_SYNTHETIC_NODES[sizingKey] : MAX_SYNTHETIC_LINKS[sizingKey];

    setSyntheticSizingByScenario((previous) => {
      const current = previous[sizingKey] ?? DEFAULT_SYNTHETIC_SIZING[sizingKey];
      const nextVal = clampSizing(rawValue, min, max);
      let nextNodes = current.nodes;
      let nextEdges = current.edges;

      if (field === 'nodes') {
        nextNodes = nextVal;
        nextEdges = 0; // 0 means 'auto' (the backend will return the natural edge count)
      } else {
        nextEdges = nextVal;
      }

      return {
        ...previous,
        [sizingKey]: {
          nodes: nextNodes,
          edges: nextEdges,
        },
      };
    });
  }, [sizingKey]);

  const handleRerollEvents = () => {
    const nextSeed = Date.now();
    setSeed(nextSeed);
    setSimResults(null);
    setBfsResult(null);

    // Apply exit position re-randomization ONLY in network, road traffic, and game AI pathfinding
    if (scenario === 'network' || scenario === 'traffic' || scenario === 'gameai') {
      if (scenario === 'network') {
        setDestinationDevices([]);
      } else if (scenario === 'traffic') {
        setTrafficDestinationIds([]);
      }
      setForceGraphRefetch((prev) => prev + 1);
    }
  };

  // Data State
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentGraph, setCurrentGraph] = useState<ScenarioGraph | null>(null);
  const [currentGraphMapId, setCurrentGraphMapId] = useState<string | null>(null);
  const [isGraphLoading, setIsGraphLoading] = useState(true);
  const [simResults, setSimResults] = useState<MultiResultsLocal | null>(null);
  const [bfsResult, setBfsResult] = useState<{ pathLength: number } | null>(null);
  const [isComputing, setIsComputing] = useState(true);

  const [activeAlgorithms, setActiveAlgorithms] = useState({ bfs: true, dfs: true, hybrid: true });

  const [savedSignatures, setSavedSignatures] = useState<string[]>([]);
  const currentSignature = `${activeAlgorithms.bfs}-${activeAlgorithms.dfs}-${activeAlgorithms.hybrid}`;
  const isCurrentSaved = savedSignatures.includes(currentSignature);

  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null);

  // Modals
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [saveDefaultName, setSaveDefaultName] = useState('');

  // ── Derived metrics exposed to the view ───────────────────────────────────────
  const totalSteps = useMemo(() => {
    if (!simResults) return 0;
    return Math.max(
      activeAlgorithms.bfs ? (simResults.bfs?.steps?.length ?? 0) : 0,
      activeAlgorithms.dfs ? (simResults.dfs?.steps?.length ?? 0) : 0,
      activeAlgorithms.hybrid ? (simResults.hybrid?.steps?.length ?? 0) : 0
    );
  }, [simResults, activeAlgorithms]);

  // ── Derived view values ────────────────────────────────────────────────────────
  // Is this an evacuation map that supports click-to-set-source?
  const isEvacuationRealWorld = scenario === 'evacuation' && (mapId === 'city' || mapId === 'building');

  // Number of history entries for this scenario (badge count in header)
  const scenarioHistoryCount = useMemo(
    () => history.filter(h => h.scenario === scenario).length,
    [history, scenario]
  );

  // Shelf box counts derived from robot assignments (for canvas visualization)
  const shelfBoxCounts = useMemo(() => {
    if (scenario !== 'robotics' || !robotAssignments?.length) return undefined;
    const map = new Map<string, number>();
    robotAssignments.forEach(a => {
      a.destinations.forEach(destId => {
        const count = a.boxCounts?.[destId] ?? 6;
        // Sum total required boxes across all robots assigned to this destination
        map.set(destId, (map.get(destId) ?? 0) + count);
      });
    });
    return map;
  }, [scenario, robotAssignments]);

  // Node/edge display counts for the synthetic size adjuster panel
  const generatedNodeCount = currentGraph?.nodes.length ?? syntheticSizing.nodes;
  // Divide the edges length by 2 to show the number of physical undirected links (lines) drawn on the canvas,
  // since the backend models every physical link as two bidirectional directed edges (A->B and B->A).
  // We explicitly exclude 'wireless' edges (like capture jumps in Game AI) from this visual count.
  const generatedEdgeCount = currentGraph
    ? Math.floor(currentGraph.edges.filter(e => e.type !== 'wireless').length / 2)
    : syntheticSizing.edges;

  // ── Local sizing input state (controlled inputs for the size adjuster panel) ──
  const [localNodesInput, setLocalNodesInput] = useState<string>(syntheticSizing.nodes.toString());
  const [localEdgesInput, setLocalEdgesInput] = useState<string>(syntheticSizing.edges.toString());

  useEffect(() => {
    setLocalNodesInput(generatedNodeCount.toString());
  }, [generatedNodeCount]);

  useEffect(() => {
    setLocalEdgesInput(generatedEdgeCount.toString());
  }, [generatedEdgeCount]);

  // ── Algorithm toggle guard ────────────────────────────────────────────────────
  const [minAlgoWarning, setMinAlgoWarning] = useState(false);
  const minAlgoWarningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleAlgorithm = useCallback((algo: 'bfs' | 'dfs' | 'hybrid') => {
    setActiveAlgorithms(prev => {
      const next = { ...prev, [algo]: !prev[algo] };
      const anyActive = next.bfs || next.dfs || next.hybrid;
      if (!anyActive) {
        // Show warning toast and do NOT apply the toggle
        if (minAlgoWarningTimer.current) clearTimeout(minAlgoWarningTimer.current);
        setMinAlgoWarning(true);
        minAlgoWarningTimer.current = setTimeout(() => setMinAlgoWarning(false), 2800);
        return prev;
      }
      return next;
    });
  }, []);

  // ── Navigation guard (unsaved result prompt) ───────────────────────────────────
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);



  // These handlers check if results are unsaved and show the confirmation modal.
  // They require `status` and `isCurrentSaved`, which come from the controller layer.
  // So they are returned as factory functions that the view/controller can call with
  // those values. The actual guard wiring happens in `useSimulation`.
  const requestBack = useCallback((status: string, saved: boolean) => {
    if (status === 'running') {
      setPendingNavigation({ type: 'back', reason: 'inprogress' });
    } else if (status === 'done' && !saved) {
      setPendingNavigation({ type: 'back', reason: 'unsaved' });
    } else {
      onBack?.();
    }
  }, [onBack]);

  const requestMapChange = useCallback((newMapId: string, status: string, saved: boolean) => {
    if (mapId === newMapId) return;
    if (status === 'running' || status === 'paused') {
      setPendingNavigation({ type: 'map', mapId: newMapId, reason: 'inprogress' });
    } else if (status === 'done' && !saved) {
      setPendingNavigation({ type: 'map', mapId: newMapId, reason: 'unsaved' });
    } else {
      setMapId(newMapId);
      setCurrentGraph(null);
      setCurrentGraphMapId(null);
      setTrafficSourceId(null);
      setTrafficDestinationIds([]);
      setSourceDevice('');
      setDestinationDevices([]);
      setEvacuationSourceId(null);
      setGameAISourceId(null);
      setCustomBlockedNodes([]);
      setSimResults(null);
      setBfsResult(null);
      const mapDef = MAP_REGISTRY[scenario]?.find(m => m.id === newMapId);
      if (mapDef?.isRealWorld) setGraphSize('medium');
    }
  }, [mapId, scenario]);

  const requestBoardChange = useCallback((boardId: GameAIBoard, status: string, saved: boolean) => {
    if (gameBoard === boardId) return;
    if (status === 'running' || status === 'paused') {
      setPendingNavigation({ type: 'gameboard', boardId, reason: 'inprogress' });
    } else if (status === 'done' && !saved) {
      setPendingNavigation({ type: 'gameboard', boardId, reason: 'unsaved' });
    } else {
      setGameBoard(boardId);
      setMapId('synthetic');
      setCurrentGraph(null);
      setCurrentGraphMapId(null);
      setGameAISourceId(null);
      setCustomBlockedNodes([]);
      setSimResults(null);
      setBfsResult(null);
    }
  }, [gameBoard]);

  const requestSizingChange = useCallback((field: keyof GraphSizing, value: number, status: string, saved: boolean) => {
    if (status === 'running' || status === 'paused') {
      setPendingNavigation({ type: 'sizing', field, value, reason: 'inprogress' });
    } else if (status === 'done' && !saved) {
      setPendingNavigation({ type: 'sizing', field, value, reason: 'unsaved' });
    } else {
      updateSyntheticSizing(field, value);
    }
  }, [updateSyntheticSizing]);

  // ── Synthetic size stepper actions ────────────────────────────────────────────
  const stepNodesUp = useCallback(() => {
    if (scenario === 'gameai') {
      updateSyntheticSizing('nodes', getNextGameAINodes(syntheticSizing.nodes, 'up', gameBoard));
    } else if (scenario === 'robotics') {
      updateSyntheticSizing('nodes', getNextRoboticsNodes(syntheticSizing.nodes, 'up'));
    } else {
      updateSyntheticSizing('nodes', syntheticSizing.nodes + 1);
    }
  }, [scenario, gameBoard, syntheticSizing.nodes, updateSyntheticSizing]);

  const stepNodesDown = useCallback(() => {
    if (scenario === 'gameai') {
      updateSyntheticSizing('nodes', getNextGameAINodes(syntheticSizing.nodes, 'down', gameBoard));
    } else if (scenario === 'robotics') {
      updateSyntheticSizing('nodes', getNextRoboticsNodes(syntheticSizing.nodes, 'down'));
    } else {
      updateSyntheticSizing('nodes', syntheticSizing.nodes - 1);
    }
  }, [scenario, gameBoard, syntheticSizing.nodes, updateSyntheticSizing]);

  const stepEdgesUp = useCallback(() => {
    updateSyntheticSizing('edges', generatedEdgeCount + 1);
  }, [generatedEdgeCount, updateSyntheticSizing]);

  const stepEdgesDown = useCallback(() => {
    updateSyntheticSizing('edges', generatedEdgeCount - 1);
  }, [generatedEdgeCount, updateSyntheticSizing]);

  // Shared callback ref for reset/skip confirmation dialogs
  const pendingActionCallbackRef = useRef<(() => void) | null>(null);

  const confirmPendingNavigation = useCallback(() => {
    if (!pendingNavigation) return;
    if (pendingNavigation.type === 'reset' || pendingNavigation.type === 'skip' || pendingNavigation.type === 'reroll' || pendingNavigation.type === 'robot_assignment' || pendingNavigation.type === 'topology_edit') {
      pendingActionCallbackRef.current?.();
      pendingActionCallbackRef.current = null;
    } else if (pendingNavigation.type === 'back') {
      onBack?.();
    } else if (pendingNavigation.type === 'map') {
      setMapId(pendingNavigation.mapId);
      setCurrentGraph(null);
      setCurrentGraphMapId(null);
      setTrafficSourceId(null);
      setTrafficDestinationIds([]);
      setSourceDevice('');
      setDestinationDevices([]);
      setEvacuationSourceId(null);
      setGameAISourceId(null);
      setCustomBlockedNodes([]);
      setSimResults(null);
      setBfsResult(null);
      const mapDef = MAP_REGISTRY[scenario]?.find(m => m.id === pendingNavigation.mapId);
      if (mapDef?.isRealWorld) setGraphSize('medium');
    } else if (pendingNavigation.type === 'gameboard') {
      setGameBoard(pendingNavigation.boardId);
      setMapId('synthetic');
      setCurrentGraph(null);
      setCurrentGraphMapId(null);
      setGameAISourceId(null);
      setCustomBlockedNodes([]);
      setSimResults(null);
      setBfsResult(null);
    } else if (pendingNavigation.type === 'sizing') {
      updateSyntheticSizing(pendingNavigation.field, pendingNavigation.value);
    } else if (pendingNavigation.type === 'sizing_step') {
      if (pendingNavigation.action === 'nodesUp') stepNodesUp();
      else if (pendingNavigation.action === 'nodesDown') stepNodesDown();
      else if (pendingNavigation.action === 'edgesUp') stepEdgesUp();
      else if (pendingNavigation.action === 'edgesDown') stepEdgesDown();
    }
    setPendingNavigation(null);
  }, [pendingNavigation, onBack, scenario, mapId, gameBoard, stepNodesUp, stepNodesDown, stepEdgesUp, stepEdgesDown, updateSyntheticSizing]);

  const requestReset = useCallback((onReset: () => void, status: string, _saved: boolean) => {
    if (status === 'running' || status === 'paused') {
      pendingActionCallbackRef.current = onReset;
      setPendingNavigation({ type: 'reset', reason: 'inprogress' });
    } else {
      onReset();
    }
  }, []);

  const requestSkip = useCallback((onSkip: () => void, status: string, _saved: boolean) => {
    if (status === 'running' || status === 'paused') {
      pendingActionCallbackRef.current = onSkip;
      setPendingNavigation({ type: 'skip', reason: 'inprogress' });
    } else {
      onSkip();
    }
  }, []);

  const requestReroll = useCallback((onReroll: () => void, status: string, saved: boolean) => {
    if (status === 'running' || status === 'paused') {
      pendingActionCallbackRef.current = onReroll;
      setPendingNavigation({ type: 'reroll', reason: 'inprogress' });
    } else if (status === 'done' && !saved) {
      pendingActionCallbackRef.current = onReroll;
      setPendingNavigation({ type: 'reroll', reason: 'unsaved' });
    } else {
      onReroll();
    }
  }, []);

  const requestRobotAssignmentOpen = useCallback((onOpen: () => void) => {
    pendingActionCallbackRef.current = onOpen;
    setPendingNavigation({ type: 'robot_assignment', reason: 'inprogress' });
  }, []);

  const requestTopologyEdit = useCallback((onConfirm: () => void, status: string, saved: boolean) => {
    if (status === 'running') {
      pendingActionCallbackRef.current = onConfirm;
      setPendingNavigation({ type: 'topology_edit', reason: 'inprogress' });
    } else if (status === 'done' && !saved) {
      pendingActionCallbackRef.current = onConfirm;
      setPendingNavigation({ type: 'topology_edit', reason: 'unsaved' });
    } else {
      onConfirm();
    }
  }, []);



  // ── DB / History Logic ────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    try {
      const allScenarios: string[] = ['network', 'robotics', 'traffic', 'evacuation', 'gameai'];
      const allEntries: HistoryEntry[] = [];
      for (const sc of allScenarios) {
        const entries = await loadLocalHistory(sc);
        entries.forEach((e) => {
          if (!allEntries.some((x) => x.id === e.id)) allEntries.push(e);
        });
      }
      allEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setHistory(allEntries);
    } catch (err) {
      console.error('Failed to load local history', err);
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDeleteHistory = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const updatedHistory = history.filter((h) => !ids.includes(h.id));
    const allScenarios: string[] = ['network', 'robotics', 'traffic', 'evacuation', 'gameai'];
    for (const sc of allScenarios) {
      persistLocalHistory(sc, updatedHistory.filter((h) => h.scenario === sc)).catch((err) => {
        console.error('Failed to update local history after delete:', err);
      });
    }
    setHistory(updatedHistory);
    if (currentSavedId && ids.includes(currentSavedId)) {
      setSavedSignatures([]);
      setCurrentSavedId(null);
    }
  }, [history, currentSavedId]);

  const handleImportHistory = useCallback((entries: HistoryEntry[]) => {
    if (!entries || entries.length === 0) return;
    const existingIds = new Set(history.map((h) => h.id));
    const newEntries = entries.filter((e) => !existingIds.has(e.id));
    const merged = [...newEntries, ...history];
    merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const allScenarios: string[] = ['network', 'robotics', 'traffic', 'evacuation', 'gameai'];
    for (const sc of allScenarios) {
      persistLocalHistory(sc, merged.filter((h) => h.scenario === sc)).catch((err) => {
        console.error('Failed to persist imported history for', sc, err);
      });
    }
    setHistory(merged);
  }, [history]);

  const openSaveModal = useCallback(() => {
    if (!simResults || isCurrentSaved) return;
    const maxRun = history
      .filter((h) => h.scenario === scenario)
      .reduce((max, h) => Math.max(max, h.runNumber), 0);

    const nextRunNumber = maxRun + 1;
    const defaultName = `Multi-Alg Trial #${nextRunNumber}`;

    setSaveDefaultName(defaultName);
    setSaveNameInput(defaultName);
    setIsSaveModalOpen(true);
  }, [simResults, isCurrentSaved, history, scenario]);

  const confirmSaveResult = useCallback(() => {
    if (!simResults || !currentGraph) return;
    const maxRun = history.filter((h) => h.scenario === scenario).reduce((max, h) => Math.max(max, h.runNumber), 0);
    const thisRunNumber = maxRun + 1;
    const finalName = saveNameInput.trim() === '' ? saveDefaultName : saveNameInput.trim();

    const compressedSimResult: MultiResultsLocal = {
      bfs: {
        ...simResults.bfs,
        graph: null as any,
        steps: simResults.bfs.steps.length > 0 ? [simResults.bfs.steps[simResults.bfs.steps.length - 1]] : []
      },
      dfs: {
        ...simResults.dfs,
        graph: null as any,
        steps: simResults.dfs.steps.length > 0 ? [simResults.dfs.steps[simResults.dfs.steps.length - 1]] : []
      },
      hybrid: {
        ...simResults.hybrid,
        steps: simResults.hybrid.steps.length > 0 ? [simResults.hybrid.steps[simResults.hybrid.steps.length - 1]] : []
      }
    };

    const newEntryId = Date.now().toString();
    const newEntry: HistoryEntry = {
      id: newEntryId,
      runNumber: thisRunNumber,
      name: finalName,
      algorithm: 'hybrid',
      scenario,
      simResult: null as any,
      multiResults: compressedSimResult,
      optimalPathLength: bfsResult?.pathLength || 1,
      totalNodes: currentGraph.nodes.length,
      timestamp: new Date(),
      metadata: {
        mapId,
        gameBoard,
        networkRoutingMode,
        deliveryMode,
        sourceDevice,
        destinationDevices,
        robotAssignments,
        evacuationSourceId,
        trafficSourceId,
        trafficDestinationIds,
        gameAISourceId,
        syntheticSizing: {
          nodes: currentGraph.nodes.length,
          edges: Math.floor(currentGraph.edges.filter(e => e.type !== 'wireless').length / 2)
        },
        activeAlgorithms
      }
    };

    const updatedHistory = [newEntry, ...history.filter((h) => h.id !== newEntry.id)];
    persistLocalHistory(scenario, updatedHistory.filter((h) => h.scenario === scenario)).catch((err) => {
      alert('Failed to save to database. IndexedDB write failed.');
      console.warn('IndexedDB write failed:', err);
    });

    setHistory(updatedHistory);
    setSavedSignatures(prev => [...prev, currentSignature]);
    setCurrentSavedId(newEntryId);
    setIsSaveModalOpen(false);
  }, [simResults, currentGraph, history, scenario, bfsResult, saveNameInput, saveDefaultName]);

  // ── Fetch API logic ───────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const fetchGraphStructure = async () => {
      try {
        setIsGraphLoading(true);
        const graphParams = new URLSearchParams({
          scenario,
          mapId,
          graphSize,
          seed: seed.toString()
        });

        if (mapId === 'synthetic' || scenario === 'gameai') {
          graphParams.set('targetNodes', String(syntheticSizing.nodes));
          if (syntheticSizing.edges > 0) {
            graphParams.set('targetEdges', String(syntheticSizing.edges));
          }
        }

        if (scenario === 'gameai') graphParams.set('gameBoard', gameBoard);
        if (scenario === 'network') {
          graphParams.set('customSourceId', sourceDevice);
          if (destinationDevices.length > 0) {
            graphParams.set('customDestinationIds', JSON.stringify(destinationDevices));
          }
        }

        if (scenario === 'robotics' && roboticsInitializedMap.current === mapId) {
          graphParams.set('customSourceIds', JSON.stringify(sourceDevices));
          graphParams.set('customDestinationIds', JSON.stringify(destinationDevices_robotics));
        }

        // Evacuation: pass user-selected starting room as customSourceId ONLY if on same map
        if (scenario === 'evacuation' && currentGraphMapId === mapId && evacuationSourceId) {
          graphParams.set('customSourceId', evacuationSourceId);
        }

        // Traffic: pass user-selected custom source and destination ONLY if on same map
        if (scenario === 'traffic' && currentGraphMapId === mapId) {
          if (trafficSourceId) graphParams.set('customSourceId', trafficSourceId);
          if (trafficDestinationIds.length > 0) graphParams.set('customDestinationIds', JSON.stringify(trafficDestinationIds));
        }

        // Game AI: pass user-selected starting point
        if (scenario === 'gameai' && gameAISourceId) {
          graphParams.set('customSourceId', gameAISourceId);
        }

        const response = await fetch(`http://localhost:3200/api/network/graph?${graphParams}`);
        if (!response.ok) throw new Error(`Graph API Error: ${response.statusText}`);
        const json = await response.json();

        if (isMounted) {
          let newGraph = json.data;
          
          // Apply saved node positions & custom elements from localStorage if available
          try {
            const savedKey = `saved_node_positions_${scenario}_${mapId}`;
            const defaultKey = `default_node_layout_${scenario}_${mapId}`;
            const storedKey = localStorage.getItem(savedKey) ? savedKey : defaultKey;
            const raw = localStorage.getItem(storedKey);
            if (raw) {
              const parsed = JSON.parse(raw);
              // Upgrade saved synthetic warehouse snapshots to the current
              // three-aisles-per-delivery-bay layout while retaining other
              // saved node positions and custom topology edits.
              if (scenario === 'robotics' && mapId === 'synthetic' && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
                const isGeneratedBayId = (id: string) => /^dest_finish_\d+$/.test(id);
                const previousBayIds = new Set<string>(parsed.nodes
                  .filter((node: any) => node.type === 'delivery_bay' && isGeneratedBayId(node.id))
                  .map((node: any) => node.id));
                const currentBayNodes = newGraph.nodes.filter((node: any) => node.type === 'delivery_bay' && isGeneratedBayId(node.id));
                const currentBayIds = new Set<string>(currentBayNodes.map((node: any) => node.id));

                parsed.nodes = [
                  ...parsed.nodes.filter((node: any) => !previousBayIds.has(node.id)),
                  ...currentBayNodes,
                ];
                parsed.edges = [
                  ...parsed.edges.filter((edge: any) => !previousBayIds.has(edge.from) && !previousBayIds.has(edge.to)),
                  ...newGraph.edges.filter((edge: any) => currentBayIds.has(edge.from) || currentBayIds.has(edge.to)),
                ];
                if (Array.isArray(parsed.customEdges)) {
                  parsed.customEdges = parsed.customEdges.filter((edge: any) => !previousBayIds.has(edge.from) && !previousBayIds.has(edge.to));
                }
                parsed.destinationIds = [
                  ...newGraph.destinationIds,
                  ...(Array.isArray(parsed.destinationIds) ? parsed.destinationIds.filter((id: string) => !previousBayIds.has(id) && !currentBayIds.has(id)) : []),
                ];
                parsed.width = newGraph.width;
                parsed.height = newGraph.height;
                localStorage.setItem(storedKey, JSON.stringify(parsed));
              }
              const isAWSWarehouse = scenario === 'robotics' && (mapId === 'aws' || mapId === 'awsWarehouse');
              const priorAwsLayoutVersion = Number(parsed.awsLayoutVersion ?? 0);
              const awsLayoutVersion = 5;
              if (isAWSWarehouse && priorAwsLayoutVersion < awsLayoutVersion) {
                const rackCenters: Record<string, number> = {
                  shelf_a1: 10000, shelf_a2: 20000, shelf_b1: 30000, shelf_b2: 40000,
                  shelf_d1: 10000, shelf_e1: 20000, shelf_e3: 30000, shelf_f1: 40000,
                  shelf_d2: 10000, shelf_e2: 20000, shelf_e4: 30000, shelf_f2: 40000,
                };
                const aisleCenters: Record<string, number> = {
                  w: 6250, mw: 16250, me: 26250, e: 36250,
                };
                const migrateNodeX = (node: any) => {
                  let x = node.x;
                  // Give the two perimeter service zones breathing room while
                  // carrying any user-moved positions along with the wider plan.
                  if (priorAwsLayoutVersion < 2) {
                    if (node.id === 'clutter_a' || node.id === 'pallet_jack') {
                      if (Math.abs(x - 5000) < 1) x = -2500;
                    } else if (node.id === 'clutter_b' || node.id === 'trash_cans') {
                      if (Math.abs(x - 45000) < 1) x = 52500;
                    }
                    x = 25000 + (x - 25000) * 1.25;
                  }
                  if (rackCenters[node.id] !== undefined) x = rackCenters[node.id];
                  const aisleMatch = String(node.id).match(/^(?:front|mid|back|lower|bottom)_(w|mw|me|e)$/);
                  if (aisleMatch) x = aisleCenters[aisleMatch[1]];
                  if (node.id === 'dest_desk_a') x = 10000;
                  if (node.id === 'dest_desk_b') x = 40000;
                  const y = ['dest_desk_a', 'dest_desk_b', 'depot_secondary'].includes(node.id) ? 44000 : node.y;
                  return { ...node, x, y };
                };
                if (Array.isArray(parsed.nodes)) parsed.nodes = parsed.nodes.map(migrateNodeX);
                if (Array.isArray(parsed.customNodes)) parsed.customNodes = parsed.customNodes.map(migrateNodeX);
                const positions = parsed.positions || (!Array.isArray(parsed) ? parsed : null);
                if (positions && typeof positions === 'object') {
                  for (const [nodeId, position] of Object.entries(positions) as [string, any][]) {
                    if (!position || typeof position.x !== 'number') continue;
                    let x = position.x;
                    if (priorAwsLayoutVersion < 2) {
                      if ((nodeId === 'clutter_a' || nodeId === 'pallet_jack') && Math.abs(x - 5000) < 1) x = -2500;
                      if ((nodeId === 'clutter_b' || nodeId === 'trash_cans') && Math.abs(x - 45000) < 1) x = 52500;
                      x = 25000 + (x - 25000) * 1.25;
                    }
                    if (rackCenters[nodeId] !== undefined) x = rackCenters[nodeId];
                    const aisleMatch = nodeId.match(/^(?:front|mid|back|lower|bottom)_(w|mw|me|e)$/);
                    if (aisleMatch) x = aisleCenters[aisleMatch[1]];
                    if (nodeId === 'dest_desk_a') x = 10000;
                    if (nodeId === 'dest_desk_b') x = 40000;
                    const y = ['dest_desk_a', 'dest_desk_b', 'depot_secondary'].includes(nodeId) ? 44000 : position.y;
                    positions[nodeId] = { ...position, x, y };
                  }
                }

                if (priorAwsLayoutVersion < 3 && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
                  const movedNodes = new Set(['dest_desk_a', 'dest_desk_b', 'depot_secondary']);
                  parsed.nodes = parsed.nodes.map((node: any) =>
                    movedNodes.has(node.id) ? { ...node, y: 44000 } : node
                  );
                  const existingNodeIds = new Set(parsed.nodes.map((node: any) => node.id));
                  const addedStorageNodes = newGraph.nodes.filter((node: any) =>
                    /^(shelf_[gh]\d|lower_|bottom_)/.test(node.id) && !existingNodeIds.has(node.id)
                  );
                  parsed.nodes = [...parsed.nodes, ...addedStorageNodes];
                  const allNodeIds = new Set(parsed.nodes.map((node: any) => node.id));
                  const existingEdgeIds = new Set(parsed.edges.map((edge: any) => edge.id));
                  const addedStorageEdges = newGraph.edges.filter((edge: any) =>
                    (/^(shelf_[gh]\d|lower_|bottom_)/.test(edge.from) || /^(shelf_[gh]\d|lower_|bottom_)/.test(edge.to)) &&
                    allNodeIds.has(edge.from) && allNodeIds.has(edge.to) && !existingEdgeIds.has(edge.id)
                  );
                  parsed.edges = [...parsed.edges, ...addedStorageEdges];
                }
                parsed.height = 51000;
                parsed.awsLayoutVersion = awsLayoutVersion;
                localStorage.setItem(storedKey, JSON.stringify(parsed));
              }
              // Keep AWS utility exits classified as delivery bays in older
              // saved topology snapshots so they remain selectable in assignments.
              if (isAWSWarehouse) {
                const utilityExitIds = ['clutter_a', 'clutter_b', 'pallet_jack', 'trash_cans'];
                const utilityExitIdSet = new Set(utilityExitIds);
                let topologyChanged = false;
                const normalizeUtilityNodes = (nodes: any[]) => nodes.map(node => {
                  if (utilityExitIdSet.has(node.id) && node.type !== 'delivery_bay') {
                    topologyChanged = true;
                    return { ...node, type: 'delivery_bay' };
                  }
                  return node;
                });
                if (Array.isArray(parsed.nodes)) parsed.nodes = normalizeUtilityNodes(parsed.nodes);
                if (Array.isArray(parsed.customNodes)) parsed.customNodes = normalizeUtilityNodes(parsed.customNodes);
                if (Array.isArray(parsed.destinationIds)) {
                  const normalizedDestinations = [...new Set([...parsed.destinationIds, ...utilityExitIds])];
                  if (normalizedDestinations.length !== parsed.destinationIds.length) topologyChanged = true;
                  parsed.destinationIds = normalizedDestinations;
                }
                if (topologyChanged) localStorage.setItem(storedKey, JSON.stringify(parsed));
              }
              if (scenario === 'robotics' && mapId === 'clinic') {
                let topologyChanged = false;
                const normalizeClinicCorridors = (nodes: any[]) => nodes.map(node => {
                  if (node.type === 'shelf' && String(node.label || '').toLowerCase().includes('corridor')) {
                    topologyChanged = true;
                    return { ...node, type: 'zone' };
                  }
                  return node;
                });
                if (Array.isArray(parsed.nodes)) parsed.nodes = normalizeClinicCorridors(parsed.nodes);
                if (Array.isArray(parsed.customNodes)) parsed.customNodes = normalizeClinicCorridors(parsed.customNodes);
                if (topologyChanged) localStorage.setItem(storedKey, JSON.stringify(parsed));
              }
              const hasTopologySnapshot = Array.isArray(parsed.nodes) && Array.isArray(parsed.edges);
              if (hasTopologySnapshot) {
                newGraph = {
                  ...newGraph,
                  nodes: parsed.nodes,
                  edges: parsed.edges,
                  ...(typeof parsed.sourceId === 'string' ? { sourceId: parsed.sourceId } : {}),
                  ...(Array.isArray(parsed.sourceIds) ? { sourceIds: parsed.sourceIds } : {}),
                  ...(Array.isArray(parsed.destinationIds) ? { destinationIds: parsed.destinationIds } : {}),
                  ...(typeof parsed.width === 'number' ? { width: parsed.width } : {}),
                  ...(typeof parsed.height === 'number' ? { height: parsed.height } : {}),
                };
              }
              const positions: Record<string, { x: number; y: number }> = parsed.positions || (parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null);
              if (positions && !hasTopologySnapshot) {
                newGraph.nodes = newGraph.nodes.map((n: any) => {
                  const saved = positions[n.id];
                  if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') {
                    return { ...n, x: saved.x, y: saved.y };
                  }
                  return n;
                });
              }
              // Also restore any saved custom nodes/edges that might not exist in backend graph
              if (!hasTopologySnapshot && Array.isArray(parsed.customNodes) && parsed.customNodes.length > 0) {
                const existingNodeIds = new Set(newGraph.nodes.map((n: any) => n.id));
                const extraNodes = parsed.customNodes.filter((n: any) => !existingNodeIds.has(n.id));
                newGraph.nodes = [...newGraph.nodes, ...extraNodes];
              }
              if (!hasTopologySnapshot && Array.isArray(parsed.customEdges) && parsed.customEdges.length > 0) {
                const existingEdgeIds = new Set(newGraph.edges.map((e: any) => e.id));
                const extraEdges = parsed.customEdges.filter((e: any) => !existingEdgeIds.has(e.id));
                newGraph.edges = [...newGraph.edges, ...extraEdges];
              }
            }
          } catch (e) {
            console.error('Failed to load saved node positions from localStorage:', e);
          }

          // Preserve manually added custom nodes and edges ONLY if the map is the same
          const hasSavedTopologySnapshot = (() => {
            try {
              const raw = localStorage.getItem(`saved_node_positions_${scenario}_${mapId}`)
                ?? localStorage.getItem(`default_node_layout_${scenario}_${mapId}`);
              if (!raw) return false;
              const parsed = JSON.parse(raw);
              return Array.isArray(parsed.nodes) && Array.isArray(parsed.edges);
            } catch {
              return false;
            }
          })();
          if (!hasSavedTopologySnapshot && currentGraph && currentGraphMapId === mapId) {
            const customNodes = currentGraph.nodes.filter(n => /_\d{13}$/.test(n.id));
            const customEdges = currentGraph.edges.filter(e => /_\d{13}$/.test(e.id));
            if (customNodes.length > 0 || customEdges.length > 0) {
              const existingNodeIds = new Set(newGraph.nodes.map((n: any) => n.id));
              const existingEdgeIds = new Set(newGraph.edges.map((e: any) => e.id));
              const missingNodes = customNodes.filter(n => !existingNodeIds.has(n.id));
              const missingEdges = customEdges.filter(e => !existingEdgeIds.has(e.id));
              if (missingNodes.length > 0) newGraph.nodes = [...newGraph.nodes, ...missingNodes];
              if (missingEdges.length > 0) newGraph.edges = [...newGraph.edges, ...missingEdges];
            }
          }

          // Synthetic evacuation nodes represent rooms; migrate older saved layouts that used "place".
          if (scenario === 'evacuation' && mapId === 'synthetic') {
            newGraph = {
              ...newGraph,
              nodes: newGraph.nodes.map((node: any) => node.type === 'place' ? { ...node, type: 'room' } : node),
            };
          }
          
          setCurrentGraph(newGraph);
          setCurrentGraphMapId(mapId);
          setIsGraphLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch graph layout from backend:', err);
        if (isMounted) setIsGraphLoading(false);
      }
    };
    fetchGraphStructure();
    return () => { isMounted = false; };
  }, [scenario, mapId, gameBoard, graphSize, syntheticSizing.nodes, syntheticSizing.edges, forceGraphRefetch]);

  // Synchronize custom endpoints if the map changes or if they are invalid
  useEffect(() => {


    if (scenario === 'network' && currentGraph) {
      const allNodes = currentGraph.nodes;
      const isAPNode = (n: any) =>
        n.type === 'wireless_ap' ||
        (n.type === 'access_point' && !n.label?.toLowerCase().includes('rack')) ||
        (n.label && /(^|\s|[-_])ap(\s|[-_]|\d|$)/i.test(n.label)) ||
        (n.id && /^ap[_-]/i.test(n.id));

      const possibleDests = allNodes.filter(n => {
        if (isAPNode(n)) return false;
        if (networkRoutingMode === 'device-to-device') {
          return n.label.toLowerCase().includes('rack') || n.type === 'end_device';
        }
        return n.label.toLowerCase().includes('rack') || n.type === 'server' || n.type === 'end_device';
      });

      let currentSource = sourceDevice;
      
      if (networkRoutingMode === 'default' && allNodes.length > 0) {
        // Default mode: source must be a router-class node (ISP / core / building router).
        const ROUTER_TYPES = ['datacenter', 'router', 'building_router'];
        const isRouterSource = allNodes.some(n => n.id === currentSource && ROUTER_TYPES.includes(n.type as string));
        if (!isRouterSource) {
          currentSource = allNodes[0].id; // Fallback to Global Ingress / Root
          setSourceDevice(currentSource);
        }
      } else if (networkRoutingMode === 'device-to-device') {
        const validSource = allNodes.some(n => n.id === currentSource && possibleDests.some(pd => pd.id === n.id));
        if (!validSource && possibleDests.length > 0) {
          let fallbackId = possibleDests[0].id;
          if (mapId === 'campus') {
            const boysPC = possibleDests.find(n => n.id.includes('boys'));
            if (boysPC) fallbackId = boysPC.id;
          }
          currentSource = fallbackId;
          setSourceDevice(currentSource);
        }
      } else {
        const validSource = allNodes.some(n => n.id === currentSource);
        if (!validSource && allNodes.length > 0) {
          currentSource = allNodes[0].id;
          setSourceDevice(currentSource);
        }
      }

      // Compute hop distances from currentSource to ensure exits are farther away
      const getHopDistances = (src: string) => {
        const adj = new Map<string, string[]>();
        currentGraph.edges.forEach(e => {
          if (!adj.has(e.from)) adj.set(e.from, []);
          if (!adj.has(e.to)) adj.set(e.to, []);
          adj.get(e.from)!.push(e.to);
          adj.get(e.to)!.push(e.from);
        });
        const dists = new Map<string, number>();
        const q = [src];
        dists.set(src, 0);
        while (q.length > 0) {
          const u = q.shift()!;
          const d = dists.get(u)!;
          for (const v of adj.get(u) || []) {
            if (!dists.has(v)) {
              dists.set(v, d + 1);
              q.push(v);
            }
          }
        }
        return dists;
      };

      const hopDists = getHopDistances(currentSource);

      const validDestinations = destinationDevices.filter(d => d !== currentSource && possibleDests.some(n => n.id === d));
      const graphDests = (currentGraph.destinationIds || []).filter(id => id !== currentSource && possibleDests.some(n => n.id === id));

      if (validDestinations.length === 0 && graphDests.length > 0) {
        setDestinationDevices(graphDests);
      } else {
        // Prioritize candidates with greater hop distance from the start node
        const availableDests = possibleDests
          .filter(e => e.id !== currentSource && !validDestinations.includes(e.id))
          .sort((a, b) => (hopDists.get(b.id) || 0) - (hopDists.get(a.id) || 0));

        const needed = 2 - validDestinations.length;

        if (needed > 0 && availableDests.length > 0) {
          const fallbackDests = graphDests.filter(id => !validDestinations.includes(id));
          const toAdd = fallbackDests.slice(0, needed);
          const stillNeeded = needed - toAdd.length;
          if (stillNeeded > 0) {
            const extra = availableDests.filter(n => !toAdd.includes(n.id)).slice(0, stillNeeded);
            setDestinationDevices([...validDestinations, ...toAdd, ...extra.map(n => n.id)]);
          } else {
            setDestinationDevices([...validDestinations, ...toAdd]);
          }
        } else if (validDestinations.length !== destinationDevices.length) {
          setDestinationDevices(validDestinations);
        }
      }
    }
  }, [currentGraph, networkRoutingMode, sourceDevice, destinationDevices, mapId]);

  // Synchronize robotics robot assignments if the map changes
  const roboticsInitializedMap = useRef<string | null>(null);

  useEffect(() => {
    if (scenario === 'robotics' && currentGraph && currentGraphMapId === mapId) {
      const allDepots = currentGraph.nodes.filter(n => n.type === 'depot' || n.type === 'place' || n.id.includes('Robot') || n.label.includes('Start')).map(n => n.id);
      
      const destNodes = currentGraph.nodes
        .filter(n => n.type === 'delivery_bay')
        .map(n => n.id);

      if (roboticsInitializedMap.current !== mapId) {
        // Initial setup for this map (Synthetic, AWS, or Clinic)
        const defaultDests = destNodes.slice(0, 2);
        const boxCounts: Record<string, number> = {};
        defaultDests.forEach(d => boxCounts[d] = 6);

        const initialAssignments: RobotAssignment[] = allDepots.length > 0 ? [{
          robotId: allDepots[0],
          destinations: defaultDests,
          boxCounts,
          priorityDest: undefined
        }] : [];
        setRobotAssignments(initialAssignments);
        roboticsInitializedMap.current = mapId;
      } else {
        // Cleanup: remove depots that no longer exist, remove destinations that no longer exist
        setRobotAssignments(prev => {
          let cleaned = prev
            .filter(a => allDepots.includes(a.robotId))
            .map(a => ({
              ...a,
              destinations: a.destinations.filter(d => destNodes.includes(d)),
              priorityDest: a.priorityDest && destNodes.includes(a.priorityDest) ? a.priorityDest : undefined,
            }));

          // Preserve the prior default assignment behavior while removing stale
          // assignments to nodes that are no longer delivery bays.
          if (cleaned.length > 0 && cleaned[0].destinations.length === 0 && destNodes.length > 0) {
            const fallbackDests = destNodes.slice(0, 2);
            cleaned[0].destinations = fallbackDests;
            if (!cleaned[0].boxCounts) cleaned[0].boxCounts = {};
            fallbackDests.forEach(d => cleaned[0].boxCounts![d] = 6);
          }

          // If no robots left but depots exist, assign the first depot
          if (cleaned.length === 0 && allDepots.length > 0) {
            const fallbackDests = destNodes.slice(0, 2);
            const boxCounts: Record<string, number> = {};
            fallbackDests.forEach(d => boxCounts[d] = 6);
            cleaned = [{
              robotId: allDepots[0],
              destinations: fallbackDests,
              boxCounts: boxCounts,
              priorityDest: undefined
            }];
          }

          return JSON.stringify(cleaned) !== JSON.stringify(prev) ? cleaned : prev;
        });
      }
    } else {
      roboticsInitializedMap.current = null;
    }
  }, [currentGraph, scenario, mapId]);

  // Synchronize traffic endpoints if the map changes or if endpoints do not exist in currentGraph
  useEffect(() => {
    if (scenario === 'traffic' && currentGraph && currentGraphMapId === mapId) {
      const nodeIds = new Set(currentGraph.nodes.map(n => n.id));
      if (trafficSourceId && !nodeIds.has(trafficSourceId)) {
        setTrafficSourceId(null);
      }
      if (trafficDestinationIds.length > 0) {
        const valid = trafficDestinationIds.filter(id => nodeIds.has(id));
        if (valid.length !== trafficDestinationIds.length) {
          setTrafficDestinationIds(valid);
        }
      }
    }
  }, [scenario, currentGraph, currentGraphMapId, mapId, trafficSourceId, trafficDestinationIds]);

  // Synchronize evacuation endpoint if map changes or invalid
  useEffect(() => {
    if (scenario === 'evacuation' && currentGraph && currentGraphMapId === mapId) {
      const isRoom = (node: any) => ['place', 'origin', 'room', 'start', 'cinema'].includes(node.type);
      const isValidRoomId = (id: string | null | undefined) =>
        !!id && currentGraph.nodes.some(node => node.id === id && isRoom(node));

      if (!isValidRoomId(evacuationSourceId)) {
        const nextSourceId = isValidRoomId(currentGraph.sourceId)
          ? currentGraph.sourceId
          : currentGraph.nodes.find(isRoom)?.id ?? null;
        if (evacuationSourceId !== nextSourceId) setEvacuationSourceId(nextSourceId);
      }
    }
  }, [scenario, currentGraph, currentGraphMapId, mapId, evacuationSourceId]);

  // Synchronize game AI endpoint if board changes or invalid
  useEffect(() => {
    if (scenario === 'gameai' && currentGraph) {
      const nodeIds = new Set(currentGraph.nodes.map(n => n.id));
      if (gameAISourceId && !nodeIds.has(gameAISourceId)) {
        setGameAISourceId(null);
      }
    }
  }, [scenario, currentGraph, gameAISourceId]);

  return {
    scenario,
    gameBoard, setGameBoard,
    seed, setSeed, handleRerollEvents,
    mapId, setMapId,
    graphSize, setGraphSize,
    syntheticSizing, updateSyntheticSizing,
    networkRoutingMode, setNetworkRoutingMode,
    sourceDevice, setSourceDevice,
    // Derived robot source IDs (robotics only)
    sourceDevices,
    // Scenario-aware: robotics uses derived destinations, all other scenarios use network state
    destinationDevices: (scenario === 'robotics' && mapId !== 'synthetic')
      ? destinationDevices_robotics
      : destinationDevices,
    setDestinationDevices,
    // Per-robot assignment state (robotics only)
    robotAssignments, setRobotAssignments,
    deliveryMode, setDeliveryMode,

    history, handleDeleteHistory, handleImportHistory, confirmSaveResult, openSaveModal,
    isCurrentSaved,
    setSavedSignatures,
    currentSavedId, setCurrentSavedId,

    isHistoryModalOpen, setIsHistoryModalOpen,
    isSaveModalOpen, setIsSaveModalOpen,
    saveNameInput, setSaveNameInput,
    saveDefaultName, setSaveDefaultName,
    sizingKey,
    activeAlgorithms, setActiveAlgorithms,

    currentGraph, setCurrentGraph, isGraphLoading,
    currentGraphMapId,
    simResults, setSimResults,
    bfsResult, setBfsResult,
    isComputing, setIsComputing,
    totalSteps,
    evacuationSourceId, setEvacuationSourceId,
    trafficSourceId, setTrafficSourceId,
    trafficDestinationIds, setTrafficDestinationIds,
    gameAISourceId, setGameAISourceId,
    customBlockedNodes, setCustomBlockedNodes,

    // ── Extracted from SimulationView ──────────────────────────────────────────
    // Derived view values
    isEvacuationRealWorld,
    scenarioHistoryCount,
    shelfBoxCounts,
    generatedNodeCount,
    generatedEdgeCount,

    // Local sizing input state (for the synthetic size adjuster controlled inputs)
    localNodesInput, setLocalNodesInput,
    localEdgesInput, setLocalEdgesInput,

    // Algorithm toggle guard
    minAlgoWarning,
    toggleAlgorithm,

    // Navigation guard
    pendingNavigation,
    setPendingNavigation,
    requestBack,
    requestMapChange,
    requestBoardChange,
    requestSizingChange,
    requestReset,
    requestSkip,
    requestReroll,
    requestRobotAssignmentOpen,
    requestTopologyEdit,
    confirmPendingNavigation,

    // Synthetic size stepper actions
    stepNodesUp,
    stepNodesDown,
    stepEdgesUp,
    stepEdgesDown,
    forceRefetchGraph: (clearCustom?: boolean) => {
      if (clearCustom) setCurrentGraph(null);
      setForceGraphRefetch(p => p + 1);
    }
  };
}
