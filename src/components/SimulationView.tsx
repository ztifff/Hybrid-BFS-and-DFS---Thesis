import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScenarioType, AlgorithmStep, SimulationResult } from '../types';
import { getScenario } from '../config/scenarios';
import { NetworkCanvas } from './NetworkCanvas';
import { MetricsPanel } from './MetricsPanel';
import { Legend } from './Legend';
import { SimulationReport } from './SimulationReport';
import { HistoryModal, HistoryEntry } from './HistoryModal';
import { buildScenarioGraph } from '../utils/graphBuilder';

interface Props {
  scenario: ScenarioType;
  onBack: () => void;
}

type Status = 'idle' | 'running' | 'done' | 'paused';
const STEP_INTERVAL_MS = 60;

export const SimulationView: React.FC<Props> = ({ scenario, onBack }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [isCurrentSaved, setIsCurrentSaved] = useState(false); 
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null);
  
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [saveDefaultName, setSaveDefaultName] = useState('');
  
  const sc = getScenario(scenario);

  const [useRealWorld, setUseRealWorld] = useState(false);
  const [seed, setSeed] = useState(() => Date.now()); 
  
  // Keep local builder temporarily just to render the empty map instantly while API fetches
  const currentGraph = useMemo(() => buildScenarioGraph(scenario, useRealWorld), [scenario, useRealWorld]);

  const [simResults, setSimResults] = useState<{ bfs: SimulationResult, dfs: SimulationResult, hybrid: SimulationResult } | null>(null);
  const [bfsResult, setBfsResult] = useState<any>(null);
  const [isComputing, setIsComputing] = useState(true);

  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const storageKey = `simulation_history_${scenario}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        const hydratedData = parsed.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
        setHistory(hydratedData);
      } catch (error) {
        console.error(`Failed to parse history for ${scenario}`, error);
      }
    } else {
      setHistory([]);
    }
  }, [scenario]);

  const stopAnimation = useCallback(() => {
    if (animRef.current) {
      clearInterval(animRef.current);
      animRef.current = null;
    }
  }, []);

  // 🔥 FETCH DATA FROM BACKEND INSTEAD OF RUNNING LOCALLY
  useEffect(() => {
    let isMounted = true;

    const fetchGraphData = async () => {
      try {
        setIsComputing(true);
        setStatus('idle');
        setStepIndex(0);
        stopAnimation();

        const response = await fetch('https://backend-1e4y.onrender.com/api/simulation/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario, useRealWorld, seed })
        });

        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        
        const json = await response.json();
        
        if (!isMounted) return;

        const { results, optimalPathLength } = json.data;

        setSimResults(results);
        setBfsResult({ pathLength: optimalPathLength });
        setIsComputing(false);
        setIsCurrentSaved(false);
        setCurrentSavedId(null);
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
  }, [scenario, useRealWorld, seed, stopAnimation]);

  const openSaveModal = useCallback(() => {
    if (!simResults || isCurrentSaved) return;
    
    const maxRun = history.reduce((max, h) => Math.max(max, h.runNumber), 0);
    const nextRunNumber = maxRun + 1;
    const defaultName = `Multi-Alg Trial #${nextRunNumber}`;
    
    setSaveDefaultName(defaultName);
    setSaveNameInput(defaultName); 
    setIsSaveModalOpen(true);
  }, [simResults, isCurrentSaved, history]);

  const confirmSaveResult = useCallback(() => {
    if (!simResults) return;
    
    const maxRun = history.reduce((max, h) => Math.max(max, h.runNumber), 0);
    const thisRunNumber = maxRun + 1;
    const finalName = saveNameInput.trim() === '' ? saveDefaultName : saveNameInput.trim();

    const compressedSimResult = {
      ...simResults.hybrid,
      steps: simResults.hybrid.steps.length > 0 ? [simResults.hybrid.steps[simResults.hybrid.steps.length - 1]] : []
    };

    const newEntryId = Date.now().toString(); 

    const newEntry: HistoryEntry = {
      id: newEntryId,
      runNumber: thisRunNumber,
      name: finalName,
      algorithm: 'hybrid',
      scenario: scenario, 
      simResult: compressedSimResult,
      optimalPathLength: bfsResult?.pathLength || 1,
      totalNodes: currentGraph.nodes.length,
      timestamp: new Date()
    };

    setHistory(prev => {
      const updatedHistory = [newEntry, ...prev];
      try {
        localStorage.setItem(`simulation_history_${scenario}`, JSON.stringify(updatedHistory));
      } catch (err) {
        alert("Browser storage limit reached! Cannot save more history.");
      }
      return updatedHistory;
    });
    
    setIsCurrentSaved(true);
    setCurrentSavedId(newEntryId);
    setIsSaveModalOpen(false);
  }, [simResults, bfsResult, currentGraph.nodes.length, saveNameInput, saveDefaultName, scenario, history]);

  const totalSteps = useMemo(() => {
    if (!simResults) return 0;
    return Math.max(
      simResults.bfs?.steps?.length ?? 0,
      simResults.dfs?.steps?.length ?? 0,
      simResults.hybrid?.steps?.length ?? 0
    );
  }, [simResults]);

  const activityLogs = useMemo(() => {
    if (!simResults) return [];
    const logs: { step: number; text: string; type: 'info' | 'warning' | 'success' | 'error' }[] = [];
    const reportedBlocks = new Set<string>();

    simResults.hybrid.dynamicEvents.forEach(e => {
        if (e.blocked && !reportedBlocks.has(e.nodeId)) {
            reportedBlocks.add(e.nodeId);
            logs.push({ step: e.stepIndex, text: `⚠️ Environmental Change: Hazard detected at ${e.label}`, type: 'warning' });
        } else if (!e.blocked && reportedBlocks.has(e.nodeId)) {
            reportedBlocks.delete(e.nodeId);
            logs.push({ step: e.stepIndex, text: `✅ Environmental Change: Route restored at ${e.label}`, type: 'success' });
        }
    });
    return logs;
  }, [simResults]);

  const visibleActivityLogs = activityLogs
    .filter(log => log.step <= stepIndex - 1)
    .slice(-100) 
    .reverse();

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

  return (
    <>
      <div className="min-h-screen lg:h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#0a0f1e] text-white flex flex-col lg:overflow-hidden relative z-0">
        
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
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">{history.length}</span>
            </button>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          
          <aside className="w-full lg:w-80 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-800 p-4 flex flex-col gap-4 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}>
            {simResults && !isComputing ? (
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
                <div>Fetching algorithms from backend...</div>
              </div>
            )}
            
            <Legend scenario={scenario} />
          </aside>

          <main className="flex-1 flex flex-col items-center justify-start p-4 overflow-y-auto w-full relative">
            
            <div className="mb-3 flex flex-col items-center gap-3 w-full shrink-0">
              <div className="flex items-center gap-3 flex-wrap justify-center text-center">
                <div className="px-4 py-1.5 rounded-full text-sm font-bold bg-blue-900/20 text-blue-400 border border-blue-500/50">
                  Simultaneous Multi-Algorithm Evaluation
                </div>
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <span>Dynamic: <span className="text-orange-400">{sc.dynamicDescription}</span></span>
                  <button
                    onClick={handleRerollEvents}
                    disabled={isComputing}
                    className="ml-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-orange-500/50 rounded-md text-xs text-orange-400 font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                  >
                    🔀 Re-roll Events
                  </button>
                </div>
              </div>

              {(scenario === 'traffic' || scenario === 'evacuation' || scenario === 'gameai' || scenario === 'robotics' || scenario === 'network') && (
                <div className="flex flex-col items-center gap-2 mt-2 w-full max-w-sm">
                  <label className={`flex justify-center items-center gap-2 cursor-pointer text-sm font-semibold bg-gray-800 px-4 py-2 rounded-lg border w-full ${isComputing ? 'border-gray-700 opacity-50 cursor-not-allowed' : 'border-gray-600 hover:bg-gray-700 transition-colors'}`}>
                    <input
                      type="checkbox"
                      checked={useRealWorld}
                      disabled={isComputing}
                      onChange={(e) => setUseRealWorld(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 text-blue-500 bg-gray-900"
                    />
                    {scenario === 'traffic' ? '🌍 Enable Real-World Map (Cabuyao City)' : 
                     scenario === 'gameai' ? '⚔️ Enable Real-World Map (Elden Ring)' :
                     scenario === 'robotics' ? '🤖 Enable Real-World Map (AWS Warehouse)' :
                     scenario === 'network' ? '🌐 Enable Real-World Map (Cloud Datacenter)' :
                    '🏢 Enable Real-World Building (SM City Santa Rosa)'}
                  </label>
                </div>
              )}
            </div>

            <div className="rounded-2xl overflow-hidden border border-gray-700 w-full relative flex-1 min-h-[400px] shrink-0 shadow-[0_0_48px_rgba(37,99,235,0.1)] bg-[#0a0f1e]" style={{ maxWidth: 1200 }}>
              <NetworkCanvas
                graph={currentGraph}
                activeSteps={activeSteps}
                scenario={scenario}
                stepIndex={stepIndex}
                dynamicEvents={simResults?.hybrid.dynamicEvents || []}
              />
            </div>

            <div className="mt-4 flex items-center gap-2 flex-wrap justify-center w-full shrink-0">
              <button disabled={isComputing} onClick={handleReset} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30 flex-1 sm:flex-none">↺ Reset</button>
              <button disabled={isComputing || stepIndex === 0} onClick={handleStepBackward} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30 flex-1 sm:flex-none">◀ Back</button>

              {status === 'running' ? (
                <button disabled={isComputing} onClick={handlePause} className="px-6 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer disabled:opacity-30 flex-1 sm:flex-none bg-blue-600 text-white">⏸ Pause</button>
              ) : status === 'paused' ? (
                <button disabled={isComputing} onClick={handleResume} className="px-6 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer disabled:opacity-30 flex-1 sm:flex-none bg-blue-600 text-white">▶ Resume</button>
              ) : status === 'done' ? (
                <button disabled={isComputing} onClick={handleRun} className="px-6 py-2 rounded-lg font-bold text-sm cursor-pointer disabled:opacity-30 flex-1 sm:flex-none bg-blue-600 text-white">↺ Replay</button>
              ) : (
                <button disabled={isComputing} onClick={handleRun} className="px-6 py-2 rounded-lg font-bold text-sm cursor-pointer hover:opacity-90 disabled:opacity-30 disabled:bg-gray-700 flex-1 sm:flex-none w-full sm:w-auto bg-blue-600 text-white">
                  {isComputing ? 'Computing...' : '▶ Run Simulations'}
                </button>
              )}

              <button disabled={isComputing || stepIndex >= totalSteps} onClick={handleStepForward} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30 flex-1 sm:flex-none">Fwd ▶</button>
              <button disabled={isComputing} onClick={handleSkipEnd} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30 flex-1 sm:flex-none">⏭ Skip</button>
            </div>
          </main>

          <aside 
            className="w-full lg:w-[350px] flex-shrink-0 border-t lg:border-t-0 lg:border-l border-gray-800 p-4 flex flex-col gap-4 bg-[#0a0f1e] overflow-y-auto lg:h-full"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}
          >
            {simResults && !isComputing && status === 'done' && (
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

            <div className="bg-[#0d1224] border border-gray-700 rounded-xl p-3 flex flex-col shadow-inner shrink-0 h-[220px]">
              <div className="flex justify-between items-center mb-2 shrink-0 border-b border-gray-800 pb-2">
                <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Global Environment Log
                </h3>
              </div>
              
              <div 
                className="flex-1 overflow-y-auto pr-1 space-y-2 flex flex-col" 
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}
              >
                {visibleActivityLogs.length > 0 ? (
                  visibleActivityLogs.map((log, i) => (
                    <div key={`${log.step}-${i}`} className={`text-[11px] p-2 rounded border transition-all ${
                      log.type === 'success' ? 'border-green-500/30 bg-green-900/20 text-green-300' :
                      log.type === 'error' ? 'border-red-500/30 bg-red-900/20 text-red-400 font-bold' :
                      log.type === 'warning' ? 'border-orange-500/30 bg-orange-900/20 text-orange-300 font-semibold' :
                      'border-gray-700 bg-gray-800/50 text-gray-300'
                    }`}>
                      <span className="opacity-50 mr-1 font-mono">[{log.step}]</span> {log.text}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500 text-center mt-6 italic">
                    Awaiting algorithm initiation...
                  </div>
                )}
              </div>
            </div>

            {simResults && simResults.hybrid.dynamicEvents.length > 0 && (
              <div className="bg-[#0d1224] border border-gray-700 rounded-xl p-3 flex flex-col shadow-inner shrink-0 h-[220px]">
                <div className="flex justify-between items-center mb-2 shrink-0 border-b border-gray-800 pb-2">
                  <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    📅 Dynamic Map Events
                  </h3>
                  <span className="text-[10px] font-mono text-gray-500">
                    {simResults.hybrid.dynamicEvents.filter(ev => ev.stepIndex <= stepIndex).length} / {simResults.hybrid.dynamicEvents.length}
                  </span>
                </div>
                
                <div 
                  className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}
                >
                  {simResults.hybrid.dynamicEvents
                    .filter(ev => ev.stepIndex <= stepIndex)
                    .reverse()
                    .map((ev, i) => (
                      <div key={`${ev.stepIndex}-${i}`} className={`text-[11px] p-2 rounded border transition-all ${
                        ev.blocked 
                          ? 'border-orange-500/50 bg-orange-900/20 text-orange-300' 
                          : 'border-green-500/50 bg-green-900/20 text-green-300' 
                      }`}>
                        <span className="font-mono opacity-60 mr-1">[{ev.stepIndex}]</span>
                        {ev.blocked ? '⚡' : '✅'} {ev.label}
                      </div>
                    ))}
                  {simResults.hybrid.dynamicEvents.filter(ev => ev.stepIndex <= stepIndex).length === 0 && (
                    <div className="text-xs text-gray-500 text-center mt-6 italic">
                      No map events triggered yet...
                    </div>
                  )}
                </div>
              </div>
            )}

          </aside>
        </div>
      </div>

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        scenario={scenario} 
        onDeleteHistory={(ids) => {
          setHistory(prev => {
            const updated = prev.filter(h => !ids.includes(h.id));
            localStorage.setItem(`simulation_history_${scenario}`, JSON.stringify(updated));
            return updated;
          });
          if (currentSavedId && ids.includes(currentSavedId)) {
            setIsCurrentSaved(false);
            setCurrentSavedId(null);
          }
        }}
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