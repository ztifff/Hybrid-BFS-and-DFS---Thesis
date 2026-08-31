import React from 'react';
import { AlgorithmType, ScenarioType, SimulationResult, AlgorithmStep } from '../../types';
import { getScenario, ALGORITHMS } from '../../config/scenarios';
import { getAdaptabilityScore, getPathOptimality, getCompletionRate, getMemoryInMB } from '../../utils/metricsHelpers';

interface Props {
  multiResults: { bfs: SimulationResult, dfs: SimulationResult, hybrid: SimulationResult } | null;
  activeSteps: { bfs: AlgorithmStep | null, dfs: AlgorithmStep | null, hybrid: AlgorithmStep | null };
  scenario: ScenarioType;
  status: 'idle' | 'running' | 'done' | 'paused';
  stepIndex: number;
  totalSteps: number;
  totalNodes?: number;
  optimalPathLength?: number;
  activeAlgorithms?: { bfs: boolean; dfs: boolean; hybrid: boolean };
  mapId?: string;
}
export const MetricsPanel: React.FC<Props> = ({
  multiResults,
  activeSteps,
  scenario,
  status,
  stepIndex,
  totalSteps,
  totalNodes,
  optimalPathLength,
  activeAlgorithms = { bfs: true, dfs: true, hybrid: true },
  mapId,
}) => {
  const sc = getScenario(scenario);
  const progress = totalSteps > 0 ? (stepIndex / totalSteps) * 100 : 0;

  const activeCount = [activeAlgorithms.bfs, activeAlgorithms.dfs, activeAlgorithms.hybrid].filter(Boolean).length;
  const gridCols = activeCount === 1 ? 'grid-cols-1' : activeCount === 2 ? 'grid-cols-2' : 'grid-cols-3';

  const renderAlgoColumn = (algoId: AlgorithmType, name: string) => {
    const isActive = activeAlgorithms[algoId];
    const color = ALGORITHMS.find(a => a.id === algoId)?.color || '#fff';
    const stepData = activeSteps[algoId];
    const resultData = multiResults?.[algoId];

    // Guard against Step 0 to ensure a clean visual slate before running
    const isStart = stepIndex === 0;

    const exploredCount = (stepIndex === 0) ? 0 : (status === 'done' && resultData ? resultData.metrics.nodesExplored : (stepData?.explored.length || 0));

    const actualDistance = (stepIndex === 0)
      ? 0
      : (status === 'done' && resultData
        ? resultData.metrics.pathLength
        : Math.max(0, (stepData?.path.length || 0) - 1));

    const optimality = (actualDistance > 0 && optimalPathLength && optimalPathLength > 0)
      ? getPathOptimality(actualDistance, optimalPathLength)
      : { ratio: 0, label: 'N/A', color: '#64748b' };

    const hasDeliveredCounts = stepData?.deliveredBoxCounts !== undefined;
    let completion = { percentage: 0, label: '0.0%' };
    if (!isStart) {
      if (scenario === 'robotics' && mapId === 'aws' && hasDeliveredCounts && stepData?.deliveredBoxCounts) {
        const totalDelivered = Object.values(stepData.deliveredBoxCounts).reduce((a, b) => a + b, 0);
        const pct = Math.min(100, (totalDelivered / 12) * 100);
        completion = { percentage: pct, label: `${pct.toFixed(1)}%` };
      } else if (status === 'done' && resultData && resultData.metrics.completionRate !== undefined) {
        completion = { percentage: resultData.metrics.completionRate, label: `${resultData.metrics.completionRate.toFixed(1)}%` };
      } else {
        completion = getCompletionRate(exploredCount, totalNodes);
      }
    }

    const adaptability = isStart
      ? { score: 0, label: '-', color: '#64748b' }
      : getAdaptabilityScore(status, resultData?.metrics || null, algoId, multiResults?.hybrid.dynamicEvents, stepIndex, completion.percentage);


    // ── Real-time memory estimate ───────────────────────────────────────────
    // The backend only returns a single `memoryUsed` figure in `resultData`
    // which represents the PEAK value at the very end of the run.
    // To show a live, growing reading we re-apply the same formula the
    // backend uses (estimateMemory) with the per-step counts available here.
    // Formula: ((nodesExplored + frontierSize) * nodeBytes * multiplier) / 1024
    //   nodeBytes  = 128 B (per visited node) 
    //   multiplier = 1.5 (BFS/Hybrid overhead for queue pointers) / 1.0 (DFS)
    const NODE_BYTES = 128;
    const multiplier = algoId === 'dfs' ? 1.0 : 1.5;
    const liveExplored = stepData?.explored.length ?? 0;
    const liveFrontier = stepData?.frontierLength ?? stepData?.frontier.length ?? 0;
    const liveMemoryKB = ((liveExplored + liveFrontier) * NODE_BYTES * multiplier) / 1024;

    const displayMemory = isStart
      ? '0.000 MB'
      : status === 'done' && resultData
        ? getMemoryInMB(resultData.metrics.memoryUsed)
        : getMemoryInMB(liveMemoryKB);

    // Hidden algorithm — don't render the column at all
    if (!isActive) return null;

    return (
      <div className="flex flex-col gap-2 text-center border-r border-gray-700/50 last:border-0 px-1">
        <div className="font-bold text-sm truncate pb-1 border-b border-gray-700/50" style={{ color }}>{name}</div>

        <div className="flex flex-col pt-1">
          <div className="text-[9px] text-gray-500 uppercase tracking-wider">Visited Nodes</div>
          <div className="text-sm font-bold text-gray-200">
            {exploredCount}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="text-[9px] text-gray-500 uppercase tracking-wider">Completion</div>
          <div className="text-sm font-bold text-blue-300">
            {completion.label}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="text-[9px] text-gray-500 uppercase tracking-wider">
            {scenario === 'network' ? 'Total Latency' : scenario === 'traffic' ? 'Travel Time' : scenario === 'evacuation' ? 'Evac Time' : scenario === 'gameai' ? 'Moves' : 'Distance'}
          </div>
          <div className="text-sm font-bold text-gray-200">
            {status === 'done' && resultData
              ? `${resultData.metrics.totalLatency.toFixed(scenario === 'gameai' ? 0 : 1)}${scenario === 'network' ? ' ms' : scenario === 'robotics' ? ' m' : scenario === 'traffic' ? ' min' : scenario === 'evacuation' ? ' s' : ''}`
              : stepData?.currentLatency !== undefined
                ? `${stepData.currentLatency.toFixed(scenario === 'gameai' ? 0 : 1)}${scenario === 'network' ? ' ms' : scenario === 'robotics' ? ' m' : scenario === 'traffic' ? ' min' : scenario === 'evacuation' ? ' s' : ''}`
                : '-'}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="text-[9px] text-gray-500 uppercase tracking-wider">Optimal %</div>
          <div className="text-sm font-bold" style={{ color: optimality.color }}>{optimality.label}</div>
        </div>

        <div className="flex flex-col">
          <div className="text-[9px] text-gray-500 uppercase tracking-wider">Memory</div>
          <div className="text-sm font-bold text-gray-200">{displayMemory}</div>
        </div>

        <div className="flex flex-col">
          <div className="text-[9px] text-gray-500 uppercase tracking-wider">Adaptability</div>
          <div className="text-sm font-bold" style={{ color: adaptability.color }}>{adaptability.score}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-panel rounded-xl p-4 space-y-4 fade-in hover:shadow-glow-blue transition-shadow duration-500">
      <div className="flex items-center justify-between border-b border-gray-700/50 pb-2 mb-2">
        <span className="text-xs font-bold uppercase tracking-widest drop-shadow-md flex items-center gap-1.5" style={{ color: sc.color }}>
          {sc.name}
        </span>
        <span className="text-xs text-gray-400 font-mono">Step {stepIndex} / {totalSteps}</span>
      </div>

      <div>
        <div className="w-full bg-black/40 rounded-full h-2 shadow-inner border border-white/5">
          <div className="h-2 rounded-full bg-blue-500 transition-all duration-200 shadow-glow-blue" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={`grid ${gridCols} bg-black/30 rounded-lg p-2 border border-white/5 shadow-inner`}>
        {renderAlgoColumn('bfs', 'BFS')}
        {renderAlgoColumn('dfs', 'DFS')}
        {renderAlgoColumn('hybrid', 'HYBRID')}
      </div>

      {status === 'done' && multiResults && (
        multiResults.hybrid.metrics.failureReason ? (
          <div className="text-center text-xs text-red-400 bg-red-900/20 border border-red-500/30 p-2 rounded-lg shadow-glow-red leading-snug">
            <div className="font-bold mb-1 uppercase tracking-wider text-[10px]">Target Unreachable</div>
            <div>{multiResults.hybrid.metrics.failureReason}</div>
          </div>
        ) : (
          <div className="text-center text-xs text-green-400 bg-green-900/20 border border-green-500/30 p-2 rounded-lg shadow-glow-green">
            Simulation Complete
          </div>
        )
      )}
    </div>
  );
};
