import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ScenarioType, AlgorithmType, AlgorithmStep } from '../types';
import { runSimulation } from '../utils/simulationRunner';
import { SimulationResult } from '../types';
import { getScenario, getAlgorithm } from '../config/scenarios';
import { NetworkCanvas } from './NetworkCanvas';
import { MetricsPanel } from './MetricsPanel';
import { Legend } from './Legend';

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

  // Run simulation (deterministic per scenario+algorithm)
  const simResult: SimulationResult = useMemo(() => {
    return runSimulation(scenario, algorithm, scenario.charCodeAt(0));
  }, [scenario, algorithm]);

  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSteps = simResult.steps.length;

  const currentStep: AlgorithmStep | null =
    stepIndex > 0 ? simResult.steps[Math.min(stepIndex - 1, totalSteps - 1)] : null;

  const exploredSet = useMemo(
    () => new Set<string>(currentStep?.explored ?? []),
    [currentStep]
  );
  const frontierSet = useMemo(
    () => new Set<string>(currentStep?.frontier ?? []),
    [currentStep]
  );
  const pathSet = useMemo(
    () => new Set<string>(currentStep?.path ?? []),
    [currentStep]
  );

  const currentNode = currentStep?.current ?? null;
  const phaseLabel = currentStep?.phaseLabel;

  const stopAnimation = useCallback(() => {
    if (animRef.current) {
      clearInterval(animRef.current);
      animRef.current = null;
    }
  }, []);

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

  const handleRun = () => {
    setStepIndex(0);
    setTimeout(() => startAnimation(), 50);
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

  const handlePause = () => { stopAnimation(); setStatus('paused'); };
  const handleResume = () => { if (stepIndex < totalSteps) startAnimation(); };
  const handleReset = () => { stopAnimation(); setStepIndex(0); setStatus('idle'); };
  const handleSkipEnd = () => { stopAnimation(); setStepIndex(totalSteps); setStatus('done'); };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between bg-[#0d1224]">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1 cursor-pointer"
          >
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
        {/* Left sidebar */}
        <aside className="w-64 flex-shrink-0 border-r border-gray-800 p-3 flex flex-col gap-3 overflow-y-auto">
          <MetricsPanel
            metrics={status === 'done' ? simResult.metrics : null}
            algorithm={algorithm}
            scenario={scenario}
            status={status}
            stepIndex={stepIndex}
            totalSteps={totalSteps}
            currentExplored={currentStep?.explored.length ?? 0}
            currentPath={currentStep?.path.length ?? 0}
            phaseLabel={phaseLabel}
          />
          <Legend algorithm={algorithm} scenario={scenario} />

          {/* Algorithm info */}
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Algorithm Behavior
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">{al.description}</p>
            {algorithm === 'hybrid' && (
              <div
                className="mt-2 text-xs p-2 rounded border"
                style={{ borderColor: al.color + '44', color: al.color }}
              >
                🔀 Phase 1: BFS → Hub nodes<br />
                🎯 Phase 2: DFS → Within each hub
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-start p-4 overflow-y-auto">
          {/* Label bar */}
          <div className="mb-3 flex items-center gap-3 flex-wrap justify-center">
            <div
              className="px-4 py-1.5 rounded-full text-sm font-bold"
              style={{ backgroundColor: al.color + '22', color: al.color, border: `1px solid ${al.color}55` }}
            >
              {al.name} · {sc.name}
            </div>
            <div className="text-sm text-gray-400">
              Dynamic: <span className="text-orange-400">{sc.dynamicDescription}</span>
            </div>
          </div>

          {/* Network Graph Canvas */}
          <div
            className="rounded-2xl overflow-hidden border border-gray-700 w-full"
            style={{
              maxWidth: 980,
              boxShadow: `0 0 48px ${al.color}22`,
              background: '#0a0f1e',
            }}
          >
            <NetworkCanvas
              graph={simResult.graph}
              explored={exploredSet}
              frontier={frontierSet}
              path={pathSet}
              current={currentNode}
              algorithm={algorithm}
              scenario={scenario}
              blockedNodes={new Set()}
              stepIndex={stepIndex}
              dynamicEvents={simResult.dynamicEvents}
              phaseLabel={phaseLabel}
            />
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer"
            >
              ↺ Reset
            </button>
            <button
              onClick={handleStepBackward}
              disabled={stepIndex === 0}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40"
            >
              ◀ Step Back
            </button>

            {status === 'running' ? (
              <button
                onClick={handlePause}
                className="px-6 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer"
                style={{ backgroundColor: al.color, color: '#000' }}
              >
                ⏸ Pause
              </button>
            ) : status === 'paused' ? (
              <button
                onClick={handleResume}
                className="px-6 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer"
                style={{ backgroundColor: al.color, color: '#000' }}
              >
                ▶ Resume
              </button>
            ) : status === 'done' ? (
              <button
                onClick={handleRun}
                className="px-6 py-2 rounded-lg font-bold text-sm cursor-pointer"
                style={{ backgroundColor: al.color, color: '#000' }}
              >
                ↺ Replay
              </button>
            ) : (
              <button
                onClick={handleRun}
                className="px-6 py-2 rounded-lg font-bold text-sm cursor-pointer hover:opacity-90"
                style={{ backgroundColor: al.color, color: '#000' }}
              >
                ▶ Run Simulation
              </button>
            )}

            <button
              onClick={handleStepForward}
              disabled={stepIndex >= totalSteps}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-40"
            >
              Step Fwd ▶
            </button>
            <button
              onClick={handleSkipEnd}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer"
            >
              ⏭ Skip to End
            </button>
          </div>

          {/* Dynamic events log */}
          {simResult.dynamicEvents.length > 0 && (
            <div className="mt-4 w-full max-w-3xl">
              <h3 className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                Dynamic Events Log
              </h3>
              <div className="flex flex-wrap gap-2">
                {simResult.dynamicEvents.map((ev: import('../types').DynamicEvent, i: number) => (
                  <div
                    key={i}
                    className={`text-xs px-2 py-1 rounded border transition-all ${
                      stepIndex >= ev.stepIndex
                        ? ev.blocked
                          ? 'border-orange-500 bg-orange-900/30 text-orange-300'
                          : 'border-green-600 bg-green-900/30 text-green-300'
                        : 'border-gray-700 bg-gray-800 text-gray-500'
                    }`}
                  >
                    {ev.blocked ? '⚡' : '✅'} Step {ev.stepIndex}: {ev.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Right panel — Final Stats */}
        {status === 'done' && (
          <aside className="w-72 flex-shrink-0 border-l border-gray-800 p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                📊 Final Performance Report
              </h3>
              <div className="space-y-3">
                <StatRow label="Algorithm"   value={al.name}  color={al.color} />
                <StatRow label="Scenario"    value={sc.name}  color={sc.color} />
                <div className="border-t border-gray-700 my-2" />
                <StatRow
                  label="Nodes Explored"
                  value={simResult.metrics.nodesExplored.toLocaleString()}
                  color={al.color}
                />
                <StatRow
                  label="Path Length"
                  value={simResult.metrics.pathLength > 0 ? `${simResult.metrics.pathLength} hops` : 'N/A'}
                  color={al.color}
                />
                <StatRow
                  label="Path Latency"
                  value={simResult.metrics.totalLatency > 0 ? `${simResult.metrics.totalLatency}ms` : 'N/A'}
                  color={al.color}
                />
                <StatRow
                  label="Exec Time"
                  value={`${simResult.metrics.timeElapsed.toFixed(3)}ms`}
                  color={al.color}
                />
                <StatRow
                  label="Memory Used"
                  value={`${simResult.metrics.memoryUsed.toFixed(2)} KB`}
                  color={al.color}
                />
                <div className="border-t border-gray-700 my-2" />
                <StatRow
                  label="Destination Found"
                  value={simResult.metrics.exitFound
                    ? `Yes (#${(simResult.metrics.exitIndex ?? 0) + 1})`
                    : 'No'}
                  color={simResult.metrics.exitFound ? '#22c55e' : '#ef4444'}
                />
                <StatRow
                  label="Dynamic Events"
                  value={`${simResult.dynamicEvents.length} events`}
                  color="#f97316"
                />
              </div>
            </div>

            {/* Complexity Notes */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Complexity Analysis
              </h3>
              <div className="space-y-2 text-xs text-gray-400">
                {algorithm === 'bfs' && (
                  <>
                    <div>⏱ Time: <span className="text-green-400">O(V + E)</span></div>
                    <div>💾 Space: <span className="text-yellow-400">O(V)</span> — queue</div>
                    <div>📍 Shortest Hops: <span className="text-green-400">Guaranteed</span></div>
                    <div>🔄 Strategy: <span className="text-blue-400">Level-by-level broadcast</span></div>
                    <div>⚠️ Weakness: <span className="text-orange-400">Bounces between hubs</span></div>
                  </>
                )}
                {algorithm === 'dfs' && (
                  <>
                    <div>⏱ Time: <span className="text-green-400">O(V + E)</span></div>
                    <div>💾 Space: <span className="text-green-400">O(H)</span> — stack depth</div>
                    <div>📍 Shortest Hops: <span className="text-red-400">Not Guaranteed</span></div>
                    <div>🔄 Strategy: <span className="text-purple-400">Deep single-branch dive</span></div>
                    <div>⚠️ Weakness: <span className="text-orange-400">Other hubs starved</span></div>
                  </>
                )}
                {algorithm === 'hybrid' && (
                  <>
                    <div>⏱ Time: <span className="text-green-400">O(V + E)</span></div>
                    <div>💾 Space: <span className="text-yellow-400">O(V)</span></div>
                    <div>📍 Near-Optimal: <span className="text-yellow-400">Heuristic</span></div>
                    <div>🔄 Strategy: <span className="text-orange-400">BFS macro + DFS micro</span></div>
                    <div>✅ Advantage: <span className="text-green-400">Parallel hub saturation</span></div>
                  </>
                )}
              </div>
            </div>

            {/* Scenario context */}
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Scenario Context
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">{sc.description}</p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

interface StatRowProps { label: string; value: string; color: string; }
const StatRow: React.FC<StatRowProps> = ({ label, value, color }) => (
  <div className="flex justify-between items-center">
    <span className="text-xs text-gray-400">{label}</span>
    <span className="text-sm font-bold" style={{ color }}>{value}</span>
  </div>
);
