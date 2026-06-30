import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlgorithmStep, GameAIBoard, ChessPiece, GraphSize, ScenarioGraph, ScenarioType, SimulationResult } from '../types';
import { normalizeHistoryEntry, normalizeHistoryEntries, loadLocalHistory, persistLocalHistory } from '../utils/historyHelpers';

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

  // Actions
  handleRun: () => void;
  handleStepForward: () => void;
  handleStepBackward: () => void;
  handlePause: () => void;
  handleResume: () => void;
  handleReset: () => void;
  handleSkipEnd: () => void;
  handleRerollEvents: () => void;
  openSaveModal: () => void;
  confirmSaveResult: () => Promise<void>;
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
const HISTORY_API = 'api/history';

// Local helper types matching SimulationView usage
type MultiResultsLocal = {
  bfs: SimulationResult;
  dfs: SimulationResult;
  hybrid: SimulationResult;
};

export function useSimulation(params: { scenario: ScenarioType; mapMode: 'synthetic' | 'realworld' | 'realworld2'; 
  graphSize: GraphSize; seed: number; gameBoard: GameAIBoard; 
  chessPiece: ChessPiece; onReroll: () => void; }) { 
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCurrentSaved, setIsCurrentSaved] = useState(false);
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [saveDefaultName, setSaveDefaultName] = useState('');

  const { scenario, mapMode, graphSize, seed, gameBoard, chessPiece } = params;


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

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch(HISTORY_API);
      if (!response.ok) throw new Error(`History API Error: ${response.statusText}`);
      const json = await response.json();
      const backendEntries = Array.isArray(json.data) ? normalizeHistoryEntries(json.data) : [];

      try {
        const localEntries = loadLocalHistory(scenario);
        const mergedEntries = [...backendEntries];
        localEntries.forEach((localEntry) => {
          if (!mergedEntries.some((entry) => entry.id === localEntry.id)) {
            mergedEntries.push(localEntry);
          }
        });
        setHistory(mergedEntries);
      } catch (localError) {
        console.error(`Failed to parse local history for ${scenario}`, localError);
        setHistory(backendEntries);
      }
    } catch (error) {
      console.error('Failed to fetch history from backend. Falling back to local history.', error);
      try {
        setHistory(loadLocalHistory(scenario));
      } catch (localError) {
        console.error(`Failed to parse local history for ${scenario}`, localError);
        setHistory([]);
      }
    }
  }, [scenario]);


  useEffect(() => {
    void loadHistory();
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

        if (scenario === 'gameai') {
          graphParams.set('gameBoard', gameBoard);
          if (gameBoard === 'chess') graphParams.set('chessPiece', chessPiece);
        }

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
  }, [scenario, mapMode, gameBoard, graphSize, seed, chessPiece]);

  const handleDeleteHistory = useCallback((ids: string[]) => {
    if (ids.length === 0) return;

    setHistory((prev) => {
      const updatedHistory = prev.filter((h) => !ids.includes(h.id));
      try {
        persistLocalHistory(scenario, updatedHistory.filter((h) => h.scenario === scenario));
      } catch (err) {
        console.error('Failed to update local history after delete:', err);
      }
      return updatedHistory;
    });

    if (currentSavedId && ids.includes(currentSavedId)) {
      setIsCurrentSaved(false);
      setCurrentSavedId(null);
    }

    void (async () => {
      try {
        const response = await fetch(
          ids.length === 1 ? `${HISTORY_API}/${encodeURIComponent(ids[0])}` : HISTORY_API,
          ids.length === 1
            ? { method: 'DELETE' }
            : {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
              }
        );

        if (!response.ok) throw new Error(`History API Error: ${response.statusText}`);
      } catch (error) {
        console.error('Failed to delete history from backend:', error);
      }
    })();
  }, [currentSavedId, scenario]);

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
              ...(scenario === 'gameai' ? { gameBoard, ...(gameBoard === 'chess' ? { chessPiece } : {}) } : {})
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
  }, [scenario, mapMode, seed, gameBoard, chessPiece, graphSize, stopAnimation]);

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
    params.onReroll();
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

  const confirmSaveResult = useCallback(async () => {
    if (!simResults || !currentGraph) return;

    const maxRun = history
      .filter((h) => h.scenario === scenario)
      .reduce((max, h) => Math.max(max, h.runNumber), 0);

    const thisRunNumber = maxRun + 1;
    const finalName = saveNameInput.trim() === '' ? saveDefaultName : saveNameInput.trim();

    const compressedSimResult: MultiResultsLocal = {
      bfs: {
        ...simResults.bfs,
        steps:
          simResults.bfs.steps.length > 0
            ? [simResults.bfs.steps[simResults.bfs.steps.length - 1]]
            : []
      },
      dfs: {
        ...simResults.dfs,
        steps:
          simResults.dfs.steps.length > 0
            ? [simResults.dfs.steps[simResults.dfs.steps.length - 1]]
            : []
      },
      hybrid: {
        ...simResults.hybrid,
        steps:
          simResults.hybrid.steps.length > 0
            ? [simResults.hybrid.steps[simResults.hybrid.steps.length - 1]]
            : []
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

    let savedEntry = newEntry;
    let savedToBackend = false;

    try {
      const response = await fetch(HISTORY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      });

      if (!response.ok) throw new Error(`History API Error: ${response.statusText}`);

      const json = await response.json();
      savedEntry = normalizeHistoryEntry(json.data ?? newEntry);
      savedToBackend = true;
    } catch (error) {
      console.error('Failed to save history to backend. Keeping a local copy instead.', error);
    }

    setHistory((prev) => {
      const updatedHistory = [savedEntry, ...prev.filter((h) => h.id !== savedEntry.id)];

      try {
        persistLocalHistory(scenario, updatedHistory.filter((h) => h.scenario === scenario));
      } catch (err) {
        if (!savedToBackend) {
          alert("Browser storage limit reached and backend save failed. This result may not persist after refresh.");
        } else {
          console.warn('History saved to backend, but local cache could not be updated:', err);
        }
      }

      return updatedHistory;
    });

    setIsCurrentSaved(true);
    setCurrentSavedId(savedEntry.id);
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


  // This hook returns UI state + delegates modal actions to SimulationView.
  // To keep behavior identical, SimulationView will call confirmSaveResult through the returned action.


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

    handleRun,
    handleStepForward,
    handleStepBackward,
    handlePause,
    handleResume,
    handleReset,
    handleSkipEnd,
    handleRerollEvents,
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


  // confirmSaveResult is intentionally not exposed directly; openSaveModal triggers it via UI.
  // (SimulationView delegates via openSaveModal + sets, and will keep the same inline behavior it had before.)

  return value;
}
