import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScenarioType, AlgorithmType, AlgorithmStep, SimulationResult } from '../types';
import { runSimulation } from '../utils/simulationRunner';
import { getScenario, getAlgorithm } from '../config/scenarios';
import { NetworkCanvas } from './NetworkCanvas';
import { MetricsPanel } from './MetricsPanel';
import { Legend } from './Legend';
import { runGraphBFS } from '../algorithms/bfs';
import { buildScenarioGraph } from '../utils/graphBuilder'; // <-- 1. Import this

interface Props {
  scenario: ScenarioType;
  algorithm: AlgorithmType;
  onBack: () => void;
}

type Status = 'idle' | 'running' | 'done' | 'paused';
const STEP_INTERVAL_MS = 60;

export const SimulationView: React.FC<Props> = ({ scenario, algorithm, onBack }) => {
  const sc = getScenario(scenario);
  const al = getAlgorithm(algorithm);

  const [useRealWorld, setUseRealWorld] = useState(false);

  // 2. Build the base graph immediately so the Canvas always has a map to draw on
  const currentGraph = useMemo(() => buildScenarioGraph(scenario, useRealWorld), [scenario, useRealWorld]);

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

      const result = await runSimulation(scenario, algorithm, scenario.charCodeAt(0), useRealWorld, (step) => {
        if (isMounted) setLiveStep(step);
      });
      if (!isMounted) return;

      const optimalBfsResult = await runGraphBFS(result.graph);
      if (!isMounted) return;

      setSimResult(result);
      setBfsResult(optimalBfsResult);
      setIsComputing(false);
    };

    computeGraphData();

    return () => {
      isMounted = false;
      stopAnimation();
    };
  }, [scenario, algorithm, useRealWorld, stopAnimation]);

  const totalSteps = simResult?.steps.length ?? 0;

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

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between bg-[#0d1224]">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1 cursor-pointer">
            ← Back
          </button>
          <div className="h-5 w-px bg-gray-700" />
          <div className="text-sm flex items-center gap-2">
            <span className="text-xl">{sc.icon}</span>
            <span className="font-bold text-white">{sc.name}</span>
            <span className="text-gray-500">·</span>
            <span style={{ color: al.color }} className="font-semibold">{al.name}</span>
          </div>
        </div>
        <div className="text-xs text-gray-500 hidden md:block">
          Real-World Graph Simulation — BFS / DFS / Hybrid Performance Evaluation
        </div>
      </header>

      <div className="flex flex-1 gap-0 overflow-hidden">
        <aside className="w-64 flex-shrink-0 border-r border-gray-800 p-3 flex flex-col gap-3 overflow-y-auto">
          {simResult && !isComputing ? (
            <MetricsPanel
              metrics={status === 'done' ? simResult.metrics : null}
              algorithm={algorithm}
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
          
          <Legend algorithm={algorithm} scenario={scenario} />

          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Algorithm Behavior
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">{al.description}</p>
            {algorithm === 'hybrid' && (
              <div className="mt-2 text-xs p-2 rounded border" style={{ borderColor: al.color + '44', color: al.color }}>
                🔀 Phase 1: BFS → Hub nodes<br />
                🎯 Phase 2: DFS → Within each hub
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col items-center justify-start p-4 overflow-y-auto">
          <div className="mb-3 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <div className="px-4 py-1.5 rounded-full text-sm font-bold" style={{ backgroundColor: al.color + '22', color: al.color, border: `1px solid ${al.color}55` }}>
                {al.name} · {sc.name}
              </div>
              <div className="text-sm text-gray-400">
                Dynamic: <span className="text-orange-400">{sc.dynamicDescription}</span>
              </div>
            </div>

            {scenario === 'traffic' && (
              <div className="flex flex-col items-center gap-2 mt-2">
                <label className={`flex items-center gap-2 cursor-pointer text-sm font-semibold bg-gray-800 px-4 py-2 rounded-lg border ${isComputing ? 'border-gray-700 opacity-50 cursor-not-allowed' : 'border-gray-600 hover:bg-gray-700 transition-colors'}`}>
                  <input
                    type="checkbox"
                    checked={useRealWorld}
                    disabled={isComputing}
                    onChange={(e) => setUseRealWorld(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-blue-500 bg-gray-900"
                  />
                  🌍 Enable Real-World Map (Cabuyao City)
                </label>
              </div>
            )}
          </div>

          <div className="rounded-2xl overflow-hidden border border-gray-700 w-full relative" style={{ maxWidth: 980, boxShadow: `0 0 48px ${al.color}22`, background: '#0a0f1e' }}>
            <NetworkCanvas
              graph={currentGraph} // <-- 3. Pass the instantly generated graph here!
              explored={exploredSet}
              frontier={frontierSet}
              path={pathSet}
              current={currentNode}
              algorithm={algorithm}
              scenario={scenario}
              blockedNodes={new Set()}
              stepIndex={stepIndex}
              dynamicEvents={simResult?.dynamicEvents || []}
              phaseLabel={phaseLabel}
            />
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
            <button disabled={isComputing} onClick={handleReset} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30">↺ Reset</button>
            <button disabled={isComputing || stepIndex === 0} onClick={handleStepBackward} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30">◀ Step Back</button>

            {status === 'running' ? (
              <button disabled={isComputing} onClick={handlePause} className="px-6 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer disabled:opacity-30" style={{ backgroundColor: al.color, color: '#000' }}>⏸ Pause</button>
            ) : status === 'paused' ? (
              <button disabled={isComputing} onClick={handleResume} className="px-6 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer disabled:opacity-30" style={{ backgroundColor: al.color, color: '#000' }}>▶ Resume</button>
            ) : status === 'done' ? (
              <button disabled={isComputing} onClick={handleRun} className="px-6 py-2 rounded-lg font-bold text-sm cursor-pointer disabled:opacity-30" style={{ backgroundColor: al.color, color: '#000' }}>↺ Replay</button>
            ) : (
              <button disabled={isComputing} onClick={handleRun} className="px-6 py-2 rounded-lg font-bold text-sm cursor-pointer hover:opacity-90 disabled:opacity-30 disabled:bg-gray-700" style={!isComputing ? { backgroundColor: al.color, color: '#000' } : {}}>
                {isComputing ? 'Computing Simulation...' : '▶ Run Simulation'}
              </button>
            )}

            <button disabled={isComputing || stepIndex >= totalSteps} onClick={handleStepForward} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30">Step Fwd ▶</button>
            <button disabled={isComputing} onClick={handleSkipEnd} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30">⏭ Skip to End</button>
          </div>

          {simResult && simResult.dynamicEvents.length > 0 && (
            <div className="mt-4 w-full max-w-3xl">
              <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Dynamic Events Log</h3>
              <div className="flex flex-wrap gap-2">
                {simResult.dynamicEvents.map((ev, i) => (
                  <div key={i} className={`text-xs px-2 py-1 rounded border transition-all ${stepIndex >= ev.stepIndex ? ev.blocked ? 'border-orange-500 bg-orange-900/30 text-orange-300' : 'border-green-600 bg-green-900/30 text-green-300' : 'border-gray-700 bg-gray-800 text-gray-500'}`}>
                    {ev.blocked ? '⚡' : '✅'} Step {ev.stepIndex}: {ev.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {simResult && !isComputing && status === 'done' && (
          <aside className="w-72 flex-shrink-0 border-l border-gray-800 p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">📊 Final Performance Report</h3>
              <div className="space-y-3">
                <StatRow label="Nodes Explored" value={simResult.metrics.nodesExplored.toLocaleString()} color={al.color} />
                <StatRow label="Exec Time" value={`${simResult.metrics.timeElapsed.toFixed(3)}ms`} color={al.color} />
                <StatRow label="Memory Used" value={`${simResult.metrics.memoryUsed.toFixed(2)} KB`} color={al.color} />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

interface StatRowProps { label: string; value: string; color: string; }
const StatRow: React.FC<StatRowProps> = ({ label, value, color }) => (
  <div className="flex justify-between items-center"><span className="text-xs text-gray-400">{label}</span><span className="text-sm font-bold" style={{ color }}>{value}</span></div>
);