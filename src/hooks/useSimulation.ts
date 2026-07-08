import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlgorithmStep, GameAIBoard, GraphSize, GraphSizing, ScenarioGraph, ScenarioType, SimulationResult } from '../types';
import { loadLocalHistory, persistLocalHistory } from '../utils/historyHelpers';

import { HistoryEntry } from '../components/HistoryModal';

type MultiResults = {
  bfs: SimulationResult;
  dfs: SimulationResult;
  hybrid: SimulationResult;
};

// SimulationView historically used `simResults` with this shape.
export interface SimulationState {
  // Data
  currentGraph: ScenarioGraph | null;
  simResults: MultiResults | null;
  bfsResult: { pathLength: number } | null;
  history: HistoryEntry[];

  // Loading / computing state
  isGraphLoading: boolean;
  isComputing: boolean;

  // Animation state
  stepIndex: number;
  status: 'idle' | 'running' | 'done' | 'paused';
  totalSteps: number;

  // Derived animation slices (used by MetricsPanel/NetworkCanvas)
  activeSteps: {
    bfs: AlgorithmStep | null;
    dfs: AlgorithmStep | null;
    hybrid: AlgorithmStep | null;
  };

  // Save state
  isCurrentSaved: boolean;
  currentSavedId: string | null;

  // Configuration State
  gameBoard: GameAIBoard;
  setGameBoard: (board: GameAIBoard) => void;
  mapMode: 'synthetic' | 'realworld' | 'realworld2';
  setMapMode: (mode: 'synthetic' | 'realworld' | 'realworld2') => void;
  graphSize: GraphSize;
  setGraphSize: (size: GraphSize) => void;
  syntheticSizing: GraphSizing;
  updateSyntheticSizing: (field: keyof GraphSizing, value: number) => void;

  // Actions
  handleRun: () => void;
  handleStepForward: () => void;
  handleStepBackward: () => void;
  handlePause: () => void;
  handleResume: () => void;
  handleReset: () => void;
  handleSkipEnd: () => void;
  handleRerollEvents: () => void;
  handleImportHistory: (entries: HistoryEntry[]) => void;
  openSaveModal: () => void;
  confirmSaveResult: () => void;
  handleDeleteHistory: (ids: string[]) => void;

  // Modal state
  isHistoryModalOpen: boolean;
  setIsHistoryModalOpen: (open: boolean) => void;
  isSaveModalOpen: boolean;
  setIsSaveModalOpen: (open: boolean) => void;
  saveNameInput: string;
  setSaveNameInput: (name: string) => void;
  saveDefaultName: string;
  setSaveDefaultName: (name: string) => void;
}

// Local convenience types
export type Status = 'idle' | 'running' | 'done' | 'paused';
const STEP_INTERVAL_MS = 60;
// History is stored exclusively in localStorage — no shared backend.

// Constants for Sizing moved from SimulationView
const DEFAULT_SYNTHETIC_SIZING: Record<ScenarioType, GraphSizing> = {
  network: { nodes: 28, edges: 44 },
  robotics: { nodes: 56, edges: 63 },
  traffic: { nodes: 36, edges: 65 },
  evacuation: { nodes: 43, edges: 81 },
  gameai: { nodes: 66, edges: 339 },
};

const MIN_SYNTHETIC_NODES: Record<ScenarioType, number> = {
  network: 7,
  robotics: 10,
  traffic: 9,
  evacuation: 10,
  gameai: 18,
};

const MAX_SYNTHETIC_NODES: Record<ScenarioType, number> = {
  network: 220,
  robotics: 220,
  traffic: 220,
  evacuation: 220,
  gameai: 220,
};

const clampSizing = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)));

type MultiResultsLocal = {
  bfs: SimulationResult;
  dfs: SimulationResult;
  hybrid: SimulationResult;
};

export function useSimulation(params: { scenario: ScenarioType }) {
  const { scenario } = params;

  // UI / Configuration State (Lifted from SimulationView)
  const [gameBoard, setGameBoard] = useState<GameAIBoard>('dama');
  const [seed, setSeed] = useState(() => Date.now());
  const [mapMode, setMapMode] = useState<'synthetic' | 'realworld' | 'realworld2'>('synthetic');
  const [graphSize, setGraphSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [syntheticSizingByScenario, setSyntheticSizingByScenario] = useState(DEFAULT_SYNTHETIC_SIZING);

  const syntheticSizing = syntheticSizingByScenario[scenario];
  const updateSyntheticSizing = useCallback((field: keyof GraphSizing, rawValue: number) => {
    const min = field === 'nodes' ? MIN_SYNTHETIC_NODES[scenario] : 4;
    const max = field === 'nodes' ? MAX_SYNTHETIC_NODES[scenario] : 1600;

    setSyntheticSizingByScenario((previous) => ({
      ...previous,
      [scenario]: {
        ...previous[scenario],
        [field]: clampSizing(rawValue, min, max),
      },
    }));
  }, [scenario]);

  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCurrentSaved, setIsCurrentSaved] = useState(false);
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [saveDefaultName, setSaveDefaultName] = useState('');

  // Base graph data state pulled directly from backend infrastructure
  const [currentGraph, setCurrentGraph] = useState<ScenarioGraph | null>(null);
  const [isGraphLoading, setIsGraphLoading] = useState(true);

  const [simResults, setSimResults] = useState<MultiResultsLocal | null>(null);
  const [bfsResult, setBfsResult] = useState<{ pathLength: number } | null>(null);
  const [isComputing, setIsComputing] = useState(true);

  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSteps = useMemo(() => {
    if (!simResults) return 0;
    return Math.max(
      simResults.bfs?.steps?.length ?? 0,
      simResults.dfs?.steps?.length ?? 0,
      simResults.hybrid?.steps?.length ?? 0
    );
  }, [simResults]);

  const activeSteps = useMemo(() => {
    if (isComputing || !simResults) return { bfs: null, dfs: null, hybrid: null };

    const bfsTotal = simResults.bfs.steps.length;
    const dfsTotal = simResults.dfs.steps.length;
    const hybridTotal = simResults.hybrid.steps.length;

    const step = Math.max(0, stepIndex - 1);

    return {
      bfs: simResults.bfs.steps[Math.min(step, Math.max(bfsTotal - 1, 0))] ?? null,
      dfs: simResults.dfs.steps[Math.min(step, Math.max(dfsTotal - 1, 0))] ?? null,
      hybrid: simResults.hybrid.steps[Math.min(step, Math.max(hybridTotal - 1, 0))] ?? null,
    };
  }, [isComputing, simResults, stepIndex]);


  const stopAnimation = useCallback(() => {
    if (animRef.current) {
      clearInterval(animRef.current);
      animRef.current = null;
    }
  }, []);

  // ── Load history: reads ALL scenario buckets from localStorage ──────────────
  const loadHistory = useCallback(() => {
    try {
      const allScenarios: string[] = ['network', 'robotics', 'traffic', 'evacuation', 'gameai'];
      const allEntries: HistoryEntry[] = [];
      for (const sc of allScenarios) {
        const entries = loadLocalHistory(sc);
        entries.forEach((e) => {
          if (!allEntries.some((x) => x.id === e.id)) allEntries.push(e);
        });
      }
      // Sort newest first
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

  // Fetch base graph structure geometry from the backend api
  useEffect(() => {
    let isMounted = true;
    const fetchGraphStructure = async () => {
      try {
        setIsGraphLoading(true);

        const graphParams = new URLSearchParams({
          scenario,
          useRealWorld: String(mapMode !== 'synthetic'),
          networkMode: mapMode === 'realworld' ? 'datacenter' : mapMode === 'realworld2' ? 'as733' : 'synthetic',
          roboticsMode: mapMode === 'realworld' ? 'aws' : mapMode === 'realworld2' ? 'clinic' : 'synthetic',
          graphSize,
          seed: seed.toString()
        });

        if (mapMode === 'synthetic') {
          graphParams.set('targetNodes', String(syntheticSizing.nodes));
          graphParams.set('targetEdges', String(syntheticSizing.edges));
        }

        if (scenario === 'gameai') graphParams.set('gameBoard', gameBoard);

        const response = await fetch(`api/network/graph?${graphParams}`);
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
    return () => {
      isMounted = false;
    };
  }, [scenario, mapMode, gameBoard, graphSize, seed, syntheticSizing.nodes, syntheticSizing.edges]);

  // ── Delete history entries: localStorage only ─────────────────────────────
  const handleDeleteHistory = useCallback((ids: string[]) => {
    if (ids.length === 0) return;

    setHistory((prev) => {
      const updatedHistory = prev.filter((h) => !ids.includes(h.id));
      // Re-persist each scenario bucket from the updated list
      const allScenarios: string[] = ['network', 'robotics', 'traffic', 'evacuation', 'gameai'];
      for (const sc of allScenarios) {
        try {
          persistLocalHistory(sc, updatedHistory.filter((h) => h.scenario === sc));
        } catch (err) {
          console.error('Failed to update local history after delete:', err);
        }
      }
      return updatedHistory;
    });

    if (currentSavedId && ids.includes(currentSavedId)) {
      setIsCurrentSaved(false);
      setCurrentSavedId(null);
    }
  }, [currentSavedId]);

  // ── Import history entries (merge + persist per scenario) ────────────────
  const handleImportHistory = useCallback((entries: HistoryEntry[]) => {
    if (!entries || entries.length === 0) return;

    setHistory((prev) => {
      const existingIds = new Set(prev.map((h) => h.id));
      const newEntries = entries.filter((e) => !existingIds.has(e.id));
      const merged = [...newEntries, ...prev];
      // Sort newest first
      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const allScenarios: string[] = ['network', 'robotics', 'traffic', 'evacuation', 'gameai'];
      for (const sc of allScenarios) {
        try {
          persistLocalHistory(sc, merged.filter((h) => h.scenario === sc));
        } catch (err) {
          console.error('Failed to persist imported history for', sc, err);
        }
      }

      return merged;
    });
  }, []);

  // Fetch run metrics and evaluated paths from the computing engine (Chunked)
  useEffect(() => {
    let isMounted = true;

    const fetchGraphData = async () => {
      try {
        setIsComputing(true);
        setStatus('idle');
        setStepIndex(0);
        stopAnimation();

        let currentOffset = 0;
        const limit = 1000;
        let keepFetching = true;
        let mergedResults: any = null;

        while (keepFetching && isMounted) {
          const response = await fetch(`api/simulation/run?offset=${currentOffset}&limit=${limit}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scenario,
              useRealWorld: mapMode !== 'synthetic',
              networkMode: mapMode === 'realworld' ? 'datacenter' : mapMode === 'realworld2' ? 'as733' : 'synthetic',
              roboticsMode: mapMode === 'realworld' ? 'aws' : mapMode === 'realworld2' ? 'clinic' : 'synthetic',
              seed,
              graphSize,
              ...(mapMode === 'synthetic' ? { sizing: syntheticSizing } : {}),
              ...(scenario === 'gameai' ? { gameBoard } : {})
            })
          });

          if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
          const json = await response.json();
          if (!isMounted) return;

          const { results, optimalPathLength } = json.data;

          if (currentOffset === 0) {
            mergedResults = results;
            setBfsResult({ pathLength: optimalPathLength });
            setIsCurrentSaved(false);
            setCurrentSavedId(null);
          } else {
            mergedResults = {
              bfs: {
                ...mergedResults.bfs,
                steps: [...mergedResults.bfs.steps, ...results.bfs.steps]
              },
              dfs: {
                ...mergedResults.dfs,
                steps: [...mergedResults.dfs.steps, ...results.dfs.steps]
              },
              hybrid: {
                ...mergedResults.hybrid,
                steps: [...mergedResults.hybrid.steps, ...results.hybrid.steps],
                dynamicEvents: [...mergedResults.hybrid.dynamicEvents]
              }
            };

            const existingEventIds = new Set(mergedResults.hybrid.dynamicEvents.map((e: any) => `${e.stepIndex}-${e.nodeId}`));
            results.hybrid.dynamicEvents.forEach((e: any) => {
              if (!existingEventIds.has(`${e.stepIndex}-${e.nodeId}`)) {
                mergedResults.hybrid.dynamicEvents.push(e);
              }
            });
          }

          setSimResults(mergedResults);

          const maxStepsInChunk = Math.max(
            results.bfs.steps.length,
            results.dfs.steps.length,
            results.hybrid.steps.length
          );

          if (maxStepsInChunk < limit) {
            keepFetching = false;
            setIsComputing(false);
          } else {
            currentOffset += limit;
          }
        }
      } catch (err) {
        console.error('Simulation fetch failed:', err);
        if (isMounted) {
          setIsComputing(false);
          setStatus('idle');
        }
      }
    };

    fetchGraphData();

    return () => {
      isMounted = false;
      stopAnimation();
    };
  }, [scenario, mapMode, seed, gameBoard, graphSize, syntheticSizing, stopAnimation]);

  const startAnimation = useCallback(() => {
    if (!simResults || totalSteps === 0) return;

    stopAnimation();
    setStatus('running');

    animRef.current = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= totalSteps) {
          stopAnimation();
          setStatus('done');
          return prev;
        }
        return prev + 1;
      });
    }, STEP_INTERVAL_MS);
  }, [simResults, totalSteps, stopAnimation]);

  useEffect(() => {
    return () => stopAnimation();
  }, [stopAnimation]);

  useEffect(() => {
    if (stepIndex >= totalSteps && status === 'running') {
      stopAnimation();
      setStatus('done');
    }
  }, [stepIndex, totalSteps, status, stopAnimation]);

  const handleRun = () => {
    if (!simResults) return;
    setStepIndex(0);
    setStatus('idle');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        startAnimation();
      });
    });
  };

  const handleStepForward = () => {
    if (status === 'running') {
      stopAnimation();
      setStatus('paused');
    }

    setStepIndex((prev) => {
      const next = Math.min(prev + 1, totalSteps);
      if (next >= totalSteps) setStatus('done');
      else setStatus('paused');
      return next;
    });
  };

  const handleStepBackward = () => {
    if (status === 'running') {
      stopAnimation();
      setStatus('paused');
    }

    setStepIndex((prev) => {
      const next = Math.max(prev - 1, 0);
      if (next === 0) setStatus('idle');
      else setStatus('paused');
      return next;
    });
  };

  const handlePause = () => {
    stopAnimation();
    setStatus('paused');
  };

  const handleResume = () => {
    if (stepIndex < totalSteps) startAnimation();
  };

  const handleReset = () => {
    stopAnimation();
    setStepIndex(0);
    setStatus('idle');
  };

  const handleSkipEnd = () => {
    stopAnimation();
    setStepIndex(totalSteps);
    setStatus('done');
  };

  const handleRerollEvents = () => {
    setSeed(Date.now());
  };

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

  // ── Save to localStorage only ─────────────────────────────────────────────
  const confirmSaveResult = useCallback(() => {
    if (!simResults || !currentGraph) return;

    const maxRun = history
      .filter((h) => h.scenario === scenario)
      .reduce((max, h) => Math.max(max, h.runNumber), 0);

    const thisRunNumber = maxRun + 1;
    const finalName = saveNameInput.trim() === '' ? saveDefaultName : saveNameInput.trim();

    const compressedSimResult: MultiResultsLocal = {
      bfs: {
        ...simResults.bfs,
        steps: simResults.bfs.steps.length > 0
          ? [simResults.bfs.steps[simResults.bfs.steps.length - 1]] : []
      },
      dfs: {
        ...simResults.dfs,
        steps: simResults.dfs.steps.length > 0
          ? [simResults.dfs.steps[simResults.dfs.steps.length - 1]] : []
      },
      hybrid: {
        ...simResults.hybrid,
        steps: simResults.hybrid.steps.length > 0
          ? [simResults.hybrid.steps[simResults.hybrid.steps.length - 1]] : []
      }
    };

    const newEntryId = Date.now().toString();
    const newEntry: HistoryEntry = {
      id: newEntryId,
      runNumber: thisRunNumber,
      name: finalName,
      algorithm: 'hybrid',
      scenario,
      simResult: compressedSimResult.hybrid as any,
      multiResults: compressedSimResult,
      optimalPathLength: bfsResult?.pathLength || 1,
      totalNodes: currentGraph.nodes.length,
      timestamp: new Date()
    };

    setHistory((prev) => {
      const updatedHistory = [newEntry, ...prev.filter((h) => h.id !== newEntry.id)];
      try {
        persistLocalHistory(scenario, updatedHistory.filter((h) => h.scenario === scenario));
      } catch (err) {
        alert('Browser storage limit reached. This result may not persist after refresh.');
        console.warn('localStorage write failed:', err);
      }
      return updatedHistory;
    });

    setIsCurrentSaved(true);
    setCurrentSavedId(newEntryId);
    setIsSaveModalOpen(false);
  }, [
    simResults,
    currentGraph,
    history,
    scenario,
    saveNameInput,
    saveDefaultName,
    bfsResult
  ]);

  const value: SimulationState = {
    currentGraph,
    simResults,
    bfsResult,
    history,

    isGraphLoading,
    isComputing,

    stepIndex,
    status,
    totalSteps,
    activeSteps,

    isCurrentSaved,
    currentSavedId,

    gameBoard,
    setGameBoard,
    mapMode,
    setMapMode,
    graphSize,
    setGraphSize,
    syntheticSizing,
    updateSyntheticSizing,

    handleRun,
    handleStepForward,
    handleStepBackward,
    handlePause,
    handleResume,
    handleReset,
    handleSkipEnd,
    handleRerollEvents,
    handleImportHistory,
    openSaveModal,
    confirmSaveResult,
    handleDeleteHistory,

    isHistoryModalOpen,
    setIsHistoryModalOpen,
    isSaveModalOpen,
    setIsSaveModalOpen,
    saveNameInput,
    setSaveNameInput,
    saveDefaultName,
    setSaveDefaultName,
  };

  return value;
}