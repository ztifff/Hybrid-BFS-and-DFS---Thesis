import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScenarioType, AlgorithmType, AlgorithmStep, SimulationResult, DynamicEvent } from '../types';
import { runSimulation } from '../utils/simulationRunner';
import { getScenario, getAlgorithm } from '../config/scenarios';
import { NetworkCanvas } from './NetworkCanvas';
import { MetricsPanel } from './MetricsPanel';
import { Legend } from './Legend';
import { SimulationReport } from './SimulationReport';
import { HistoryModal, HistoryEntry } from './HistoryModal';
import { runGraphBFS } from '../algorithms/bfs';
import { buildScenarioGraph } from '../utils/graphBuilder';

interface Props {
  scenario: ScenarioType;
  algorithm: AlgorithmType;
  onBack: () => void;
}

type Status = 'idle' | 'running' | 'done' | 'paused';
const STEP_INTERVAL_MS = 60;

export const SimulationView: React.FC<Props> = ({ scenario, algorithm, onBack }) => {
  const [activeAlgorithm, setActiveAlgorithm] = useState<AlgorithmType>(algorithm);
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCurrentSaved, setIsCurrentSaved] = useState(false); // ✅ Track if current run is saved
  const runCounter = useRef(0);
  
  const sc = getScenario(scenario);
  const al = getAlgorithm(activeAlgorithm);

  const [useRealWorld, setUseRealWorld] = useState(false);
  const [seed, setSeed] = useState(() => Date.now()); 
  
  const currentGraph = useMemo(() => buildScenarioGraph(scenario, useRealWorld), [scenario, useRealWorld]);

  const adjList = useMemo(() => {
    const adj = new Map<string, string[]>();
    currentGraph.edges.forEach(e => {
      if (!adj.has(e.from)) adj.set(e.from, []);
      if (!adj.has(e.to)) adj.set(e.to, []);
      adj.get(e.from)!.push(e.to);
      adj.get(e.to)!.push(e.from);
    });
    return adj;
  }, [currentGraph]);

  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [bfsResult, setBfsResult] = useState<any>(null);
  const [isComputing, setIsComputing] = useState(true);
  
  const [liveStep, setLiveStep] = useState<AlgorithmStep | null>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAnimation = useCallback(() => {
    if (animRef.current) {
      clearInterval(animRef.current);
      animRef.current = null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const computeGraphData = async () => {
      setIsComputing(true);
      setStatus('idle');
      setStepIndex(0);
      setLiveStep(null);
      stopAnimation();

      const result = await runSimulation(scenario, activeAlgorithm, seed, useRealWorld, (step) => {
        if (isMounted) setLiveStep(step);
      });
      if (!isMounted) return;

      const optimalBfsResult = await runGraphBFS(result.graph);
      if (!isMounted) return;

      setSimResult(result);
      setBfsResult(optimalBfsResult);
      setIsComputing(false);
      setIsCurrentSaved(false); // ✅ Reset save status on new run
    };

    computeGraphData();

    return () => {
      isMounted = false;
      stopAnimation();
    };
  }, [scenario, activeAlgorithm, useRealWorld, seed, stopAnimation]);

  // ✅ MANUAL SAVE HANDLER
  const handleSaveResult = useCallback(() => {
    if (!simResult || isCurrentSaved) return;
    runCounter.current += 1;
    setHistory(prev => [...prev, {
      id: Date.now().toString(),
      runNumber: runCounter.current,
      algorithm: activeAlgorithm,
      simResult: simResult,
      optimalPathLength: bfsResult?.pathLength || 1,
      totalNodes: currentGraph.nodes.length,
      timestamp: new Date()
    }]);
    setIsCurrentSaved(true);
  }, [simResult, isCurrentSaved, activeAlgorithm, bfsResult, currentGraph.nodes.length]);

  const totalSteps = simResult?.steps.length ?? 0;

  const activityLogs = useMemo(() => {
    if (!simResult) return [];
    
    const logs: { step: number; text: string; type: 'info' | 'warning' | 'success' | 'error' }[] = [];
    const blockedAtStep = new Set<string>();
    const eventsByStep = new Map<number, DynamicEvent[]>();
    
    simResult.dynamicEvents.forEach(e => {
      if (!eventsByStep.has(e.stepIndex)) eventsByStep.set(e.stepIndex, []);
      eventsByStep.get(e.stepIndex)!.push(e);
    });

    let previousPathLength = 0;
    const reportedBlocks = new Set<string>();

    simResult.steps.forEach((step, i) => {
      if (eventsByStep.has(i)) {
        eventsByStep.get(i)!.forEach(e => {
          if (e.blocked) blockedAtStep.add(e.nodeId);
          else blockedAtStep.delete(e.nodeId);
        });
      }

      const currentNode = step.current ? currentGraph.nodes.find(n => n.id === step.current) : null;
      const nodeName = currentNode ? currentNode.label.split('\n')[0] : (step.current || "Unknown Node");

      if (step.done) {
        if (step.foundDestination) {
          const destNode = currentGraph.nodes.find(n => n.id === step.foundDestination);
          logs.push({ step: i, text: `🎉 Reached Destination: ${destNode?.label.split('\n')[0] || step.foundDestination}`, type: 'success' });
        } else {
          logs.push({ step: i, text: `❌ Trapped! No valid route exists to the destination.`, type: 'error' });
        }
        return;
      }

      if (step.path.length < previousPathLength && previousPathLength > 0) {
        logs.push({ step: i, text: `🔙 Dead end reached. Backtracking...`, type: 'info' });
      }
      previousPathLength = step.path.length;

      if (i % 3 === 0 && step.current) { 
        logs.push({ step: i, text: `📍 Exploring ${nodeName}...`, type: 'info' });
      }

      const neighbors = step.current ? (adjList.get(step.current) || []) : [];
      neighbors.forEach(neighborId => {
        if (blockedAtStep.has(neighborId) && !reportedBlocks.has(neighborId)) {
          reportedBlocks.add(neighborId);
          const blockedNode = currentGraph.nodes.find(n => n.id === neighborId);
          const blockedName = blockedNode ? blockedNode.label.split('\n')[0] : neighborId;
          logs.push({ step: i, text: `⚠️ Blockage detected ahead at ${blockedName}. Rerouting...`, type: 'warning' });
        }
      });
    });

    return logs;
  }, [simResult, currentGraph, adjList]);

  const visibleActivityLogs = activityLogs
    .filter(log => log.step <= stepIndex - 1)
    .slice(-100) 
    .reverse();

  const startAnimation = useCallback(() => {
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
  }, [totalSteps, stopAnimation]);

  useEffect(() => () => stopAnimation(), [stopAnimation]);

  useEffect(() => {
    if (stepIndex >= totalSteps && status === 'running') {
      stopAnimation();
      setStatus('done');
    }
  }, [stepIndex, totalSteps, status, stopAnimation]);

  const playbackStep: AlgorithmStep | null = (simResult && stepIndex > 0) 
    ? simResult.steps[Math.min(stepIndex - 1, totalSteps - 1)] 
    : null;
    
  const activeStep = isComputing ? liveStep : playbackStep;

  const exploredSet = useMemo(() => new Set<string>(activeStep?.explored ?? []), [activeStep]);
  const frontierSet = useMemo(() => new Set<string>(activeStep?.frontier ?? []), [activeStep]);
  const pathSet = useMemo(() => new Set<string>(activeStep?.path ?? []), [activeStep]);

  const currentNode = activeStep?.current ?? null;
  const phaseLabel = isComputing ? `⚡ COMPUTING: ${activeStep?.phaseLabel || 'Initializing...'}` : activeStep?.phaseLabel;

  const handleRun = () => { setStepIndex(0); setTimeout(() => startAnimation(), 50); };
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

  const handlePause = () => { stopAnimation(); setStatus('paused'); };
  const handleResume = () => { if (stepIndex < totalSteps) startAnimation(); };
  const handleReset = () => { stopAnimation(); setStepIndex(0); setStatus('idle'); };
  const handleSkipEnd = () => { stopAnimation(); setStepIndex(totalSteps); setStatus('done'); };

  const handleRerollEvents = () => {
    setSeed(Date.now());
  };

  return (
    <>
      <div className="min-h-screen lg:h-screen w-full bg-[#0a0f1e] text-white flex flex-col lg:overflow-hidden relative z-0">
        <header className="border-b border-gray-800 px-4 md:px-6 py-3 flex items-center justify-between bg-[#0d1224] flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1 cursor-pointer">
              ← Back
            </button>
            <div className="h-5 w-px bg-gray-700 hidden sm:block" />
            <div className="text-sm flex items-center gap-2">
              <span className="text-xl">{sc.icon}</span>
              <span className="font-bold text-white">{sc.name}</span>
              <span className="text-gray-500">·</span>
              <select
                value={activeAlgorithm}
                onChange={(e) => setActiveAlgorithm(e.target.value as AlgorithmType)}
                disabled={isComputing}
                className="bg-[#111827] border border-gray-700 rounded-md px-2 py-1 text-sm font-bold outline-none cursor-pointer hover:border-gray-500 focus:border-gray-400 transition-colors disabled:opacity-50"
                style={{ color: al.color }}
              >
                <option value="hybrid" style={{ color: '#fff' }}>Hybrid BFS-DFS</option>
                <option value="bfs" style={{ color: '#fff' }}>Breadth-First Search (BFS)</option>
                <option value="dfs" style={{ color: '#fff' }}>Depth-First Search (DFS)</option>
              </select>
            </div>
          </div>
          <div className="text-xs text-gray-500 hidden md:block">
            Real-World Graph Simulation — BFS / DFS / Hybrid Performance Evaluation
          </div>
        </header>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          
          <aside className="w-full lg:w-80 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-800 p-4 flex flex-col gap-4 overflow-y-auto">
            {simResult && !isComputing ? (
              <MetricsPanel
                metrics={status === 'done' ? simResult.metrics : null}
                algorithm={activeAlgorithm} 
                scenario={scenario}
                status={status}
                stepIndex={stepIndex}
                totalSteps={totalSteps}
                currentExplored={activeStep?.explored.length ?? 0}
                currentPath={activeStep?.path.length ?? 0}
                phaseLabel={phaseLabel}
                totalNodes={currentGraph.nodes.length}
                dynamicEvents={simResult.dynamicEvents}
                optimalPathLength={bfsResult?.pathLength ?? 0}
              />
            ) : (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center py-12 text-center text-gray-400 animate-pulse">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <div>Computing Metrics...</div>
              </div>
            )}
            
            <Legend algorithm={activeAlgorithm} scenario={scenario} />

            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Algorithm Behavior
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">{al.description}</p>
              {activeAlgorithm === 'hybrid' && (
                <div className="mt-2 text-xs p-2 rounded border" style={{ borderColor: al.color + '44', color: al.color }}>
                  🔀 Phase 1: BFS → Hub nodes<br />
                  🎯 Phase 2: DFS → Within each hub
                </div>
              )}
            </div>
          </aside>

          <main className="flex-1 flex flex-col items-center justify-start p-4 overflow-y-auto w-full relative">
            
            <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-2 z-10">
              <button 
                onClick={() => setIsHistoryModalOpen(true)}
                className="px-6 py-2 bg-gray-900/90 hover:bg-gray-800 border border-gray-600 rounded-full text-sm font-bold text-white shadow-[0_4px_15px_rgba(0,0,0,0.5)] backdrop-blur transition-all flex items-center gap-2 cursor-pointer"
              >
                🗄️ Result History 
                <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">{history.length}</span>
              </button>
            </div>

            <div className="mb-3 mt-12 flex flex-col items-center gap-3 w-full shrink-0">
              <div className="flex items-center gap-3 flex-wrap justify-center text-center">
                <div className="px-4 py-1.5 rounded-full text-sm font-bold" style={{ backgroundColor: al.color + '22', color: al.color, border: `1px solid ${al.color}55` }}>
                  {al.name} · {sc.name}
                </div>
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <span>Dynamic: <span className="text-orange-400">{sc.dynamicDescription}</span></span>
                  <button
                    onClick={handleRerollEvents}
                    disabled={isComputing}
                    className="ml-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-orange-500/50 rounded-md text-xs text-orange-400 font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                    title="Generate entirely new dynamic events"
                  >
                    🔀 Re-roll Events
                  </button>
                </div>
              </div>

              {(scenario === 'traffic' || scenario === 'evacuation' || scenario === 'gameai') && (
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
                    '🏢 Enable Real-World Building (SM City Santa Rosa)'}
                  </label>
                </div>
              )}
            </div>

            <div className="rounded-2xl overflow-hidden border border-gray-700 w-full relative flex-1 min-h-[400px] shrink-0" style={{ maxWidth: 1200, boxShadow: `0 0 48px ${al.color}22`, background: '#0a0f1e' }}>
              <NetworkCanvas
                graph={currentGraph}
                explored={exploredSet}
                frontier={frontierSet}
                path={pathSet}
                current={currentNode}
                algorithm={activeAlgorithm}
                scenario={scenario}
                blockedNodes={new Set()}
                stepIndex={stepIndex}
                dynamicEvents={simResult?.dynamicEvents || []}
                phaseLabel={phaseLabel}
              />
            </div>

            <div className="mt-4 flex items-center gap-2 flex-wrap justify-center w-full shrink-0">
              <button disabled={isComputing} onClick={handleReset} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30 flex-1 sm:flex-none">↺ Reset</button>
              <button disabled={isComputing || stepIndex === 0} onClick={handleStepBackward} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30 flex-1 sm:flex-none">◀ Back</button>

              {status === 'running' ? (
                <button disabled={isComputing} onClick={handlePause} className="px-6 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer disabled:opacity-30 flex-1 sm:flex-none" style={{ backgroundColor: al.color, color: '#000' }}>⏸ Pause</button>
              ) : status === 'paused' ? (
                <button disabled={isComputing} onClick={handleResume} className="px-6 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer disabled:opacity-30 flex-1 sm:flex-none" style={{ backgroundColor: al.color, color: '#000' }}>▶ Resume</button>
              ) : status === 'done' ? (
                <button disabled={isComputing} onClick={handleRun} className="px-6 py-2 rounded-lg font-bold text-sm cursor-pointer disabled:opacity-30 flex-1 sm:flex-none" style={{ backgroundColor: al.color, color: '#000' }}>↺ Replay</button>
              ) : (
                <button disabled={isComputing} onClick={handleRun} className="px-6 py-2 rounded-lg font-bold text-sm cursor-pointer hover:opacity-90 disabled:opacity-30 disabled:bg-gray-700 flex-1 sm:flex-none w-full sm:w-auto" style={!isComputing ? { backgroundColor: al.color, color: '#000' } : {}}>
                  {isComputing ? 'Computing...' : '▶ Run Simulation'}
                </button>
              )}

              <button disabled={isComputing || stepIndex >= totalSteps} onClick={handleStepForward} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30 flex-1 sm:flex-none">Fwd ▶</button>
              <button disabled={isComputing} onClick={handleSkipEnd} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30 flex-1 sm:flex-none">⏭ Skip</button>
            </div>
          </main>

          <aside className="w-full lg:w-[350px] flex-shrink-0 border-t lg:border-t-0 lg:border-l border-gray-800 p-4 flex flex-col gap-4 bg-[#0a0f1e] overflow-hidden">
            
            {/* ✅ Passes the handleSaveResult and isCurrentSaved state down */}
            {simResult && !isComputing && status === 'done' && (
              <SimulationReport 
                simResult={simResult} 
                bfsResult={bfsResult} 
                alColor={al.color}
                currentExplored={activeStep?.explored.length ?? 0}
                totalNodes={currentGraph.nodes.length}
                algorithm={activeAlgorithm}
                dynamicEvents={simResult.dynamicEvents}
                onSaveResult={handleSaveResult}
                isSaved={isCurrentSaved}
              />
            )}

            <div className="flex flex-col gap-4 flex-1 overflow-hidden">
              <div className="bg-[#0d1224] border border-gray-700 rounded-xl p-4 flex flex-col shadow-inner flex-1 min-h-[200px] overflow-hidden">
                <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2 shrink-0">
                  <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Live Activity Log
                  </h3>
                </div>
                
                <div 
                  className="flex-1 overflow-y-auto pr-2 space-y-2 flex flex-col" 
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

              {simResult && simResult.dynamicEvents.length > 0 && (
                <div className="bg-[#0d1224] border border-gray-700 rounded-xl p-4 flex flex-col shadow-inner flex-1 min-h-[200px] overflow-hidden">
                  <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2 shrink-0">
                    <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                      📅 Dynamic Map Events
                    </h3>
                    <span className="text-[10px] font-mono text-gray-500">
                      {simResult.dynamicEvents.filter(ev => ev.stepIndex <= stepIndex).length} / {simResult.dynamicEvents.length}
                    </span>
                  </div>
                  
                  <div 
                    className="flex-1 overflow-y-auto pr-2 flex flex-col gap-1.5"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}
                  >
                    {simResult.dynamicEvents
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
                    {simResult.dynamicEvents.filter(ev => ev.stepIndex <= stepIndex).length === 0 && (
                      <div className="text-xs text-gray-500 text-center mt-6 italic">
                        No map events triggered yet...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </aside>
        </div>
      </div>

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
      />
    </>
  );
};