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

// ── Sizing tables ──────────────────────────────────────────────────────────────
const DEFAULT_SYNTHETIC_SIZING: Record<SizingKey, GraphSizing> = {
  network: { nodes: 28, edges: 27 },
  robotics: { nodes: 56, edges: 63 },
  traffic: { nodes: 36, edges: 29 },
  evacuation: { nodes: 60, edges: 49 },
  gameai: { nodes: 65, edges: 120 }, // fallback (unused when board is known)
  'gameai-dama': { nodes: 65, edges: 112 }, // 8×8 dama = 65 natural nodes
  'gameai-checkers': { nodes: 34, edges: 100 }, // 8×8 checkers = 34 natural nodes
};

export const MAX_SYNTHETIC_NODES: Record<SizingKey, number> = {
  network: 220,
  robotics: 217,
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
  const sizes = [13, 16, 19, 25, 29, 33, 36, 41, 46, 55, 61, 67, 71, 78, 85, 97, 105, 113, 118, 127, 136, 151, 161, 171, 177, 188, 199, 217];
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
  | { type: 'sizing_step'; action: 'nodesUp' | 'nodesDown' | 'edgesUp' | 'edgesDown'; reason?: PendingNavigationReason };

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

  useEffect(() => {
    setEvacuationSourceId(null);
    setTrafficSourceId(null);
    setTrafficDestinationIds([]);
    setGameAISourceId(null);
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
    const max = field === 'nodes' ? MAX_SYNTHETIC_NODES[sizingKey] : 1600;

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
    setSeed(Date.now());
  };

  // Data State
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentGraph, setCurrentGraph] = useState<ScenarioGraph | null>(null);
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
    if (status === 'running' || status === 'paused') {
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
      setTrafficSourceId(null);
      setTrafficDestinationIds([]);
      setSourceDevice('');
      setDestinationDevices([]);
      setEvacuationSourceId(null);
      setGameAISourceId(null);
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
    if (pendingNavigation.type === 'reset' || pendingNavigation.type === 'skip' || pendingNavigation.type === 'reroll') {
      pendingActionCallbackRef.current?.();
      pendingActionCallbackRef.current = null;
    } else if (pendingNavigation.type === 'back') {
      onBack?.();
    } else if (pendingNavigation.type === 'map') {
      setMapId(pendingNavigation.mapId);
      const mapDef = MAP_REGISTRY[scenario]?.find(m => m.id === pendingNavigation.mapId);
      if (mapDef?.isRealWorld) setGraphSize('medium');
    } else if (pendingNavigation.type === 'gameboard') {
      setGameBoard(pendingNavigation.boardId);
      setMapId('synthetic');
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

  const requestSkip = useCallback((onSkip: () => void, status: string, saved: boolean) => {
    if (status === 'running' || status === 'paused') {
      pendingActionCallbackRef.current = onSkip;
      setPendingNavigation({ type: 'skip', reason: 'inprogress' });
    } else if (status === 'done' && !saved) {
      pendingActionCallbackRef.current = onSkip;
      setPendingNavigation({ type: 'skip', reason: 'unsaved' });
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
        if (networkRoutingMode === 'device-to-device') {
          graphParams.set('customSourceId', sourceDevice);
          graphParams.set('customDestinationIds', JSON.stringify(destinationDevices));
        }

        if (scenario === 'robotics') {
          graphParams.set('customSourceIds', JSON.stringify(sourceDevices));
          graphParams.set('customDestinationIds', JSON.stringify(destinationDevices_robotics));
        }

        // Evacuation: pass user-selected starting room as customSourceId
        if (scenario === 'evacuation' && evacuationSourceId) {
          graphParams.set('customSourceId', evacuationSourceId);
        }

        // Traffic: pass user-selected custom source and destination
        if (scenario === 'traffic') {
          if (trafficSourceId) graphParams.set('customSourceId', trafficSourceId);
          if (trafficDestinationIds.length > 0) graphParams.set('customDestinationIds', JSON.stringify(trafficDestinationIds));
        }

        // Game AI: pass user-selected starting point
        if (scenario === 'gameai' && gameAISourceId) {
          graphParams.set('customSourceId', gameAISourceId);
        }

        const response = await fetch(`https://backend-1e4y.onrender.com/api/network/graph?${graphParams}`);
        if (!response.ok) throw new Error(`Graph API Error: ${response.statusText}`);
        const json = await response.json();

        if (isMounted) {
          setCurrentGraph(json.data);
          setIsGraphLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch graph layout from backend:', err);
        if (isMounted) setIsGraphLoading(false);
      }
    };
    fetchGraphStructure();
    return () => { isMounted = false; };
  }, [scenario, mapId, gameBoard, graphSize, seed, syntheticSizing.nodes, syntheticSizing.edges, networkRoutingMode, sourceDevice, sourceDevices, destinationDevices, destinationDevices_robotics, evacuationSourceId, trafficSourceId, trafficDestinationIds, gameAISourceId]);

  // Synchronize custom endpoints if the map changes or if they are invalid
  useEffect(() => {
    if (scenario === 'robotics' && currentGraph && robotAssignments.length === 0) {
      // Pick a default robot (source) and at least 2 default destinations from the graph
      const defaultRobot = currentGraph.sourceIds?.[0] || currentGraph.sourceId || currentGraph.nodes.find(n => n.type === 'depot' || n.id.includes('Robot'))?.id;

      const defaultDests = currentGraph.destinationIds && currentGraph.destinationIds.length >= 2
        ? currentGraph.destinationIds.slice(0, 2)
        : currentGraph.nodes.filter(n => n.type === 'shelf' || n.type === 'delivery_bay' || n.id.includes('nurse') || n.id.includes('air_pressure')).slice(0, 2).map(n => n.id);

      if (defaultRobot && defaultDests.length > 0) {
        setRobotAssignments([{ robotId: defaultRobot, destinations: defaultDests }]);
      }
    }

    if (networkRoutingMode === 'device-to-device' && currentGraph) {
      let currentSource = sourceDevice;
      const validSource = currentGraph.nodes.some(n => n.id === currentSource);
      const endpoints = currentGraph.nodes.filter(n => mapId === 'campus' ? n.type === 'access_point' : (n.type === 'access_point' || n.type === 'server'));


      if (!validSource && endpoints.length > 0) {
        currentSource = endpoints[0].id;
        setSourceDevice(currentSource);
      }

      const validDestinations = destinationDevices.filter(d => currentGraph.nodes.some(n => n.id === d));

      // Ensure at least 2 destinations are selected (if available) so it doesn't default to empty
      const availableDests = endpoints.filter(e => e.id !== currentSource && !validDestinations.includes(e.id));
      const needed = 2 - validDestinations.length;

      if (needed > 0 && availableDests.length > 0) {
        const newDests = [...validDestinations, ...availableDests.slice(0, needed).map(e => e.id)];
        setDestinationDevices(newDests);
      } else if (validDestinations.length !== destinationDevices.length) {
        setDestinationDevices(validDestinations);
      }
    }
  }, [currentGraph, networkRoutingMode, sourceDevice, destinationDevices, mapId]);

  // Synchronize robotics robot assignments if the map changes
  const roboticsInitializedMap = useRef<string | null>(null);

  useEffect(() => {
    if (scenario === 'robotics' && currentGraph) {
      const depots = currentGraph.nodes.filter(n => n.type === 'depot').map(n => n.id);
      const destNodes = currentGraph.nodes.filter(n => n.type === 'shelf' || n.id.startsWith('dest_')).map(n => n.id);

      if (roboticsInitializedMap.current !== mapId) {
        // Initial setup for this map (Synthetic, AWS, or Clinic)
        const defaultDests = mapId === 'synthetic'
          ? currentGraph.nodes.filter(n => n.id.startsWith('dest_')).map(n => n.id)
          : destNodes.slice(0, 2);
        const boxCounts: Record<string, number> = {};
        defaultDests.forEach(d => boxCounts[d] = 6);

        const initialAssignments: RobotAssignment[] = depots.map((depotId, idx) => ({
          robotId: depotId,
          destinations: idx === 0 ? defaultDests : [],
          boxCounts: idx === 0 ? boxCounts : {}
        }));
        setRobotAssignments(initialAssignments);
        roboticsInitializedMap.current = mapId;
      } else {
        // Cleanup: remove depots that no longer exist, remove destinations that no longer exist
        setRobotAssignments(prev => {
          const cleaned = prev
            .filter(a => depots.includes(a.robotId))
            .map(a => ({
              ...a,
              destinations: a.destinations.filter(d => destNodes.includes(d)),
              priorityDest: a.priorityDest && destNodes.includes(a.priorityDest) ? a.priorityDest : undefined,
            }));
          return JSON.stringify(cleaned) !== JSON.stringify(prev) ? cleaned : prev;
        });
      }
    } else {
      roboticsInitializedMap.current = null;
    }
  }, [currentGraph, scenario, mapId]);

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

    currentGraph, isGraphLoading,
    simResults, setSimResults,
    bfsResult, setBfsResult,
    isComputing, setIsComputing,
    totalSteps,
    evacuationSourceId, setEvacuationSourceId,
    trafficSourceId, setTrafficSourceId,
    trafficDestinationIds, setTrafficDestinationIds,
    gameAISourceId, setGameAISourceId,

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
    confirmPendingNavigation,

    // Synthetic size stepper actions
    stepNodesUp,
    stepNodesDown,
    stepEdgesUp,
    stepEdgesDown,
  };
}