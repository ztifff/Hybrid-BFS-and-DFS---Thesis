import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScenarioType, SimulationResult, ScenarioGraph, GameAIBoard, ChessPiece } from '../types';
import { getScenario } from '../config/scenarios';
import { NetworkCanvas } from './NetworkCanvas';
import { MetricsPanel } from './MetricsPanel';
import { Legend } from './Legend';
import { SimulationReport } from './SimulationReport';
import { HistoryModal, HistoryEntry } from './HistoryModal';
import { DynamicMapEvents } from './DynamicMapEvents';

interface Props {
  scenario: ScenarioType;
  onBack: () => void;
}

type Status = 'idle' | 'running' | 'done' | 'paused';
const STEP_INTERVAL_MS = 60;
const HISTORY_API = 'api/history';

const GAME_AI_BOARDS: { id: GameAIBoard; label: string; icon: string }[] = [
  { id: 'chess', label: 'Chess', icon: '♟️' },
  { id: 'checkers', label: 'Checkers', icon: '⚫' },
  { id: 'snakes', label: 'Snakes & Ladders', icon: '🐍' },
];

const getLocalHistoryKey = (scenario: ScenarioType) => `simulation_history_${scenario}`;

const normalizeHistoryEntry = (entry: any): HistoryEntry => ({
  ...entry,
  simResult: entry.simResult ?? entry.multiResults?.hybrid,
  timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date()
});

const normalizeHistoryEntries = (entries: any[]): HistoryEntry[] =>
  entries
    .filter(entry => entry && (entry.simResult || entry.multiResults?.hybrid))
    .map(normalizeHistoryEntry);

const loadLocalHistory = (scenario: ScenarioType): HistoryEntry[] => {
  const storedData = localStorage.getItem(getLocalHistoryKey(scenario));
  if (!storedData) return [];

  const parsed = JSON.parse(storedData);
  return Array.isArray(parsed) ? normalizeHistoryEntries(parsed) : [];
};

const persistLocalHistory = (scenario: ScenarioType, entries: HistoryEntry[]) => {
  localStorage.setItem(getLocalHistoryKey(scenario), JSON.stringify(entries));
};

export const SimulationView: React.FC<Props> = ({ scenario, onBack }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [isCurrentSaved, setIsCurrentSaved] = useState(false); 
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [saveDefaultName, setSaveDefaultName] = useState('');
  
  const sc = getScenario(scenario);

  const [gameBoard, setGameBoard] = useState<GameAIBoard>('chess');
  const [chessPiece, setChessPiece] = useState<ChessPiece>('knight');
  const [seed, setSeed] = useState(() => Date.now());
  const [mapMode, setMapMode] = useState<'synthetic' | 'realworld' | 'realworld2'>('synthetic');
  const [graphSize, setGraphSize] = useState<'small' | 'medium' | 'large'>('medium');
  
  // Base graph data state pulled directly from backend infrastructure
  const [currentGraph, setCurrentGraph] = useState<ScenarioGraph | null>(null);
  const [isGraphLoading, setIsGraphLoading] = useState(true);

  const [simResults, setSimResults] = useState<{ bfs: SimulationResult, dfs: SimulationResult, hybrid: SimulationResult } | null>(null);
  const [bfsResult, setBfsResult] = useState<any>(null);
  const [isComputing, setIsComputing] = useState(true);

  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch(HISTORY_API);
      if (!response.ok) throw new Error(`History API Error: ${response.statusText}`);

      const json = await response.json();
      const backendEntries = Array.isArray(json.data) ? normalizeHistoryEntries(json.data) : [];

      try {
        const localEntries = loadLocalHistory(scenario);
        const mergedEntries = [...backendEntries];
        localEntries.forEach(localEntry => {
          if (!mergedEntries.some(entry => entry.id === localEntry.id)) {
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

  const stopAnimation = useCallback(() => {
    if (animRef.current) {
      clearInterval(animRef.current);
      animRef.current = null;
    }
  }, []);

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
          roboticsMode: mapMode === 'realworld' ? 'aws' : mapMode === 'realworld2' ? 'shopee' : 'synthetic',
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
        if (isMounted) {
          setIsGraphLoading(false);
        }
      }
    };

    fetchGraphStructure();
    return () => {
      isMounted = false;
    };
  }, [scenario, mapMode, gameBoard, graphSize, seed]);

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
        const limit = 1000; // Fetch 1000 steps per chunk
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
              roboticsMode: mapMode === 'realworld' ? 'aws' : mapMode === 'realworld2' ? 'shopee' : 'synthetic',
              seed,
              graphSize,
              ...(scenario === 'gameai' ? { gameBoard, ...(gameBoard === 'chess' ? { chessPiece } : {}) } : {}),
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
            // Immutably merge subsequent chunks into the result state
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
            
            // Filter and merge dynamic events uniquely by stepIndex and nodeId
            const existingEventIds = new Set(mergedResults.hybrid.dynamicEvents.map((e: any) => `${e.stepIndex}-${e.nodeId}`));
            results.hybrid.dynamicEvents.forEach((e: any) => {
                if (!existingEventIds.has(`${e.stepIndex}-${e.nodeId}`)) {
                    mergedResults.hybrid.dynamicEvents.push(e);
                }
            });
          }

          setSimResults(mergedResults);

          // Evaluate if another chunk needs to be fetched
          const maxStepsInChunk = Math.max(
            results.bfs.steps.length,
            results.dfs.steps.length,
            results.hybrid.steps.length
          );

          if (maxStepsInChunk < limit) {
            keepFetching = false;
            setIsComputing(false); // Enable UI controls once streaming is fully complete
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

  const openSaveModal = useCallback(() => {
    if (!simResults || isCurrentSaved) return;
    
    const maxRun = history
      .filter(h => h.scenario === scenario)
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
      .filter(h => h.scenario === scenario)
      .reduce((max, h) => Math.max(max, h.runNumber), 0);
    const thisRunNumber = maxRun + 1;
    const finalName = saveNameInput.trim() === '' ? saveDefaultName : saveNameInput.trim();

    // ✅ FIX: Extract and compress the final steps for ALL algorithms
    const compressedSimResult = {
      bfs: {
        ...simResults.bfs,
        steps: simResults.bfs.steps.length > 0 ? [simResults.bfs.steps[simResults.bfs.steps.length - 1]] : []
      },
      dfs: {
        ...simResults.dfs,
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
      scenario: scenario, 
      simResult: compressedSimResult.hybrid,
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

    setHistory(prev => {
      const updatedHistory = [savedEntry, ...prev.filter(h => h.id !== savedEntry.id)];
      try {
        persistLocalHistory(scenario, updatedHistory.filter(h => h.scenario === scenario));
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
  }, [simResults, bfsResult, currentGraph, saveNameInput, saveDefaultName, scenario, history]);

  const totalSteps = useMemo(() => {
    if (!simResults) return 0;
    return Math.max(
      simResults.bfs?.steps?.length ?? 0,
      simResults.dfs?.steps?.length ?? 0,
      simResults.hybrid?.steps?.length ?? 0
    );
  }, [simResults]);

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

  const activeSteps = useMemo(() => {
    if (isComputing || !simResults) return { bfs: null, dfs: null, hybrid: null };

    const bfsTotal = simResults.bfs.steps.length;
    const dfsTotal = simResults.dfs.steps.length;
    const hybridTotal = simResults.hybrid.steps.length;

    const step = Math.max(0, stepIndex - 1);

    return {
      bfs: simResults.bfs.steps[Math.min(step, bfsTotal - 1)],
      dfs: simResults.dfs.steps[Math.min(step, dfsTotal - 1)],
      hybrid: simResults.hybrid.steps[Math.min(step, hybridTotal - 1)]
    };
  }, [isComputing, simResults, stepIndex]);

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
    if (status === 'running') { stopAnimation(); setStatus('paused'); }
    setStepIndex((prev) => {
      const next = Math.min(prev + 1, totalSteps);
      if (next >= totalSteps) setStatus('done');
      else setStatus('paused');
      return next;
    });
  };

  const handleStepBackward = () => {
    if (status === 'running') { stopAnimation(); setStatus('paused'); }
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
    if (stepIndex < totalSteps) {
      startAnimation();
    }
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

  const scenarioHistoryCount = useMemo(
    () => history.filter(h => h.scenario === scenario).length,
    [history, scenario]
  );

  const handleDeleteHistory = useCallback((ids: string[]) => {
    if (ids.length === 0) return;

    setHistory(prev => {
      const updatedHistory = prev.filter(h => !ids.includes(h.id));
      try {
        persistLocalHistory(scenario, updatedHistory.filter(h => h.scenario === scenario));
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

  return (
    <>
      <div className="min-h-screen w-full max-w-[100vw] bg-[#0a0f1e] text-white flex flex-col relative z-0">
        
        <header className="border-b border-gray-800 px-3 md:px-6 py-2.5 md:py-3 flex items-center justify-between bg-[#0d1224] shrink-0 relative gap-2 w-full max-w-full">
          <div className="flex items-center gap-2 sm:gap-4 relative z-10 shrink-0">
            <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1 cursor-pointer shrink-0">
              ← <span className="hidden sm:inline">Back</span>
            </button>
            
            <div className="h-5 w-px bg-gray-700 hidden sm:block" />
            
            <div className="text-sm flex items-center gap-3 shrink-0">
              <span className="text-xl hidden lg:inline">{sc.icon}</span>
              <span className="font-bold text-white hidden lg:inline">{sc.name}</span>
              <span className="text-gray-500 hidden lg:inline">·</span>
              <div className="flex items-center gap-2 text-xs font-bold bg-[#111827] border border-gray-700 rounded-md px-3 py-1.5 shadow-inner">
                <span className="text-green-400">BFS</span>
                <span className="text-gray-600">|</span>
                <span className="text-purple-400">DFS</span>
                <span className="text-gray-600">|</span>
                <span className="text-orange-400">Hybrid</span>
              </div>
            </div>
          </div>

          <div className="z-20 md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 shrink-0 ml-auto">
            <button 
              onClick={() => setIsHistoryModalOpen(true)}
              className="px-2.5 sm:px-5 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-full text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer"
            >
              🗄️ 
              <span className="hidden sm:inline">Result History</span>
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">{scenarioHistoryCount}</span>
            </button>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row flex-1">
          
          <aside className="w-full lg:w-80 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-800 p-4 flex flex-col gap-4 overflow-y-auto lg:max-h-[calc(100vh-theme(spacing.20))]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}>
            {simResults && !isComputing && currentGraph ? (
              <MetricsPanel
                multiResults={simResults}
                activeSteps={activeSteps}
                scenario={scenario}
                status={status}
                stepIndex={stepIndex}
                totalSteps={totalSteps}
                totalNodes={currentGraph.nodes.length}
                optimalPathLength={bfsResult?.pathLength ?? 0}
              />
            ) : (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center py-12 text-center text-gray-400 animate-pulse">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <div>Fetching evaluation matrices from backend...</div>
              </div>
            )}
            
            <Legend scenario={scenario} />
          </aside>

          <main className="flex-1 flex flex-col items-center justify-start p-4 w-full relative overflow-hidden">
            
            <div className="mb-1 flex flex-col items-center gap-1.5 w-full shrink-0">
              <div className="flex items-center gap-2 flex-wrap justify-center text-center">
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-blue-900/20 text-blue-400 border border-blue-500/50">
                  Simultaneous Multi-Algorithm Evaluation
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <span>Dynamic: <span className="text-orange-400">{sc.dynamicDescription}</span></span>
                  <button
                    onClick={handleRerollEvents}
                    disabled={isComputing}
                    className="ml-1 px-2 py-0.5 bg-gray-800 hover:bg-gray-700 border border-orange-500/50 rounded-md text-xs text-orange-400 font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                  >
                    🔀 Re-roll
                  </button>
                </div>
              </div>

              {scenario === 'gameai' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 justify-center overflow-x-auto max-w-full" style={{ scrollbarWidth: 'none' }}>
                    {GAME_AI_BOARDS.map(({ id, label, icon }) => (
                                          <button
                      key={id}
                      onClick={() => { setGameBoard(id); setMapMode('synthetic'); }}
                      disabled={isComputing || isGraphLoading}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                          gameBoard === id
                            ? 'bg-purple-900/40 text-purple-300 border border-purple-500/60 shadow-[0_0_10px_rgba(139,92,246,0.25)]'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'
                        }`}
                      >
                        <span>{icon}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(scenario === 'traffic' || scenario === 'evacuation' || scenario === 'robotics' || scenario === 'network') && (
                <div className="flex items-center gap-2 justify-center overflow-x-auto max-w-full scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                  <button
                    onClick={() => setMapMode('synthetic')}
                    disabled={isComputing || isGraphLoading}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                      mapMode === 'synthetic'
                        ? 'bg-purple-900/40 text-purple-300 border border-purple-500/60 shadow-[0_0_10px_rgba(139,92,246,0.25)]'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'
                    }`}
                  >
                    <span>🗺️</span>
                    Synthetic
                  </button>
                  <button
                    onClick={() => { setMapMode('realworld'); setGraphSize('medium'); }}
                    disabled={isComputing || isGraphLoading}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                      mapMode === 'realworld'
                        ? 'bg-purple-900/40 text-purple-300 border border-purple-500/60 shadow-[0_0_10px_rgba(139,92,246,0.25)]'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'
                    }`}
                  >
                    <span>
                      {scenario === 'traffic' ? '🌍' : scenario === 'robotics' ? '🤖' : scenario === 'network' ? '🌐' : '🏢'}
                    </span>
                    {scenario === 'traffic' ? 'Cabuyao City' :
                     scenario === 'robotics' ? 'AWS Warehouse' :
                     scenario === 'network' ? 'Cloud Datacenter' :
                     'SM City Santa Rosa'}
                  </button>
                  {(scenario === 'network' || scenario === 'robotics') && (
                    <button
                      onClick={() => { setMapMode('realworld2'); setGraphSize('medium'); }}
                      disabled={isComputing || isGraphLoading}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                        mapMode === 'realworld2'
                          ? 'bg-purple-900/40 text-purple-300 border border-purple-500/60 shadow-[0_0_10px_rgba(139,92,246,0.25)]'
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'
                      }`}
                    >
                      <span>{scenario === 'network' ? '🛰️' : '📦'}</span>
                      {scenario === 'network' ? 'AS-733 ISP' : 'Shopee Mega Hub'}
                    </button>
                  )}
                </div>
              )}

              {mapMode === 'synthetic' && scenario !== 'gameai' && (
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <span className="text-xs text-gray-500 font-semibold">Graph Size:</span>
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setGraphSize(size)}
                      disabled={isComputing || isGraphLoading}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 capitalize ${
                        graphSize === size
                          ? 'bg-teal-900/40 text-teal-300 border border-teal-500/60 shadow-[0_0_10px_rgba(20,184,166,0.25)]'
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'
                      }`}
                    >
                      {size === 'small' ? '🔹 Small' : size === 'medium' ? '🔷 Medium' : '🔶 Large'}
                    </button>
                  ))}
                </div>
              )}

            </div>

            <div className="rounded-2xl overflow-hidden border border-gray-700 w-full relative flex-1 min-h-[300px] shrink-0 shadow-[0_0_48px_rgba(37,99,235,0.1)] bg-[#0a0f1e]" style={{ maxWidth: 1200 }}>
              {currentGraph ? (
                <>
                  <NetworkCanvas
                    graph={currentGraph}
                    activeSteps={activeSteps}
                    scenario={scenario}
                    stepIndex={stepIndex}
                    dynamicEvents={simResults?.hybrid.dynamicEvents || []}
                  />
                  {/* Subtle transparent overlay when fetching new data so the canvas isn't destroyed! */}
                  {scenario === 'gameai' && gameBoard === 'chess' && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-gray-900/80 border border-gray-700 rounded-xl px-3 py-1.5 backdrop-blur-sm shadow-lg">
                      <span className="text-[10px] text-gray-500 font-semibold mr-1">PIECE:</span>
                      {([
                        { id: 'knight', icon: '♞', label: 'Knight' },
                        { id: 'bishop', icon: '♝', label: 'Bishop' },
                        { id: 'rook',   icon: '♜', label: 'Rook' },
                        { id: 'queen',  icon: '♛', label: 'Queen' },
                      ] as { id: ChessPiece; icon: string; label: string }[]).map(({ id, icon, label }) => (
                        <button
                          key={id}
                          onClick={() => setChessPiece(id)}
                          disabled={isComputing || isGraphLoading}
                          className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 ${
                            chessPiece === id
                              ? 'bg-yellow-900/60 text-yellow-300 border border-yellow-500/60'
                              : 'bg-gray-800/60 hover:bg-gray-700 text-gray-300 border border-gray-600'
                          }`}
                        >
                          <span>{icon}</span>
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                  {isGraphLoading && (
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

            <div className="mt-2 flex items-center gap-2 flex-wrap justify-center w-full shrink-0">
              <button disabled={isComputing || isGraphLoading} onClick={handleReset} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30 flex-1 sm:flex-none">↺ Reset</button>
              <button disabled={isComputing || isGraphLoading || stepIndex === 0} onClick={handleStepBackward} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30 flex-1 sm:flex-none">◀ Back</button>

              {status === 'running' ? (
                <button disabled={isComputing || isGraphLoading} onClick={handlePause} className="px-6 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer disabled:opacity-30 flex-1 sm:flex-none bg-blue-600 text-white">⏸ Pause</button>
              ) : status === 'paused' ? (
                <button disabled={isComputing || isGraphLoading} onClick={handleResume} className="px-6 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer disabled:opacity-30 flex-1 sm:flex-none bg-blue-600 text-white">▶ Resume</button>
              ) : status === 'done' ? (
                <button disabled={isComputing || isGraphLoading} onClick={handleRun} className="px-6 py-2 rounded-lg font-bold text-sm cursor-pointer disabled:opacity-30 flex-1 sm:flex-none bg-blue-600 text-white">↺ Replay</button>
              ) : (
                <button disabled={isComputing || isGraphLoading} onClick={handleRun} className="px-6 py-2 rounded-lg font-bold text-sm cursor-pointer hover:opacity-90 disabled:opacity-30 disabled:bg-gray-700 flex-1 sm:flex-none w-full sm:w-auto bg-blue-600 text-white">
                  {isComputing ? 'Computing...' : '▶ Run Simulations'}
                </button>
              )}

              <button disabled={isComputing || isGraphLoading || stepIndex >= totalSteps} onClick={handleStepForward} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30 flex-1 sm:flex-none">Fwd ▶</button>
              <button disabled={isComputing || isGraphLoading} onClick={handleSkipEnd} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30 flex-1 sm:flex-none">⏭ Skip</button>
            </div>
          </main>

          <aside 
            className="w-full lg:w-80 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-gray-800 p-4 flex flex-col gap-4 bg-[#0a0f1e] overflow-y-auto lg:max-h-[calc(100vh-theme(spacing.20))]"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}
          >
            {simResults && !isComputing && status === 'done' && currentGraph && (
              <div className="shrink-0">
                <SimulationReport 
                  multiResults={simResults}
                  bfsResult={bfsResult} 
                  totalNodes={currentGraph.nodes.length}
                  dynamicEvents={simResults.hybrid.dynamicEvents}
                  onSaveResult={openSaveModal}
                  isSaved={isCurrentSaved}
                />
              </div>
            )}

            {/* Combined intelligence timeline panel */}
            <div className="shrink-0">
              <DynamicMapEvents
                dynamicEvents={simResults?.hybrid.dynamicEvents || []}
                stepIndex={stepIndex}
                simResults={simResults}
              />
            </div>



          </aside>
        </div>
      </div>

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        scenario={scenario} 
        onDeleteHistory={handleDeleteHistory}
      />

      {isSaveModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-2">💾 Save Result to History</h3>
              <p className="text-sm text-gray-400 mb-5">Enter a custom name for this simulation run to easily identify it later.</p>
              
              <input 
                type="text" 
                value={saveNameInput}
                onChange={(e) => setSaveNameInput(e.target.value)}
                placeholder={saveDefaultName}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && confirmSaveResult()}
              />
            </div>
            
            <div className="bg-gray-950 border-t border-gray-800 p-4 flex justify-end gap-3">
              <button 
                onClick={() => setIsSaveModalOpen(false)}
                className="px-5 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSaveResult}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] cursor-pointer"
              >
                Save Result
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
