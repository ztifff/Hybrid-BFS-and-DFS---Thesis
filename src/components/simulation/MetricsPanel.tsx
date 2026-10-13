import React from 'react';
import { AlgorithmType, ScenarioType, SimulationResult, AlgorithmStep, RobotAssignment } from '../../types';
import { getScenario, ALGORITHMS } from '../../config/scenarios';
import { getAdaptabilityScore, getPathOptimality, getCompletionRate, getMemoryInMB } from '../../utils/metricsHelpers';
import { useTheme } from '../../context/ThemeContext';

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
  robotAssignments?: RobotAssignment[];
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
  robotAssignments = [],
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const sc = getScenario(scenario);
  const progress = totalSteps > 0 ? (stepIndex / totalSteps) * 100 : 0;

  const activeCount = [activeAlgorithms.bfs, activeAlgorithms.dfs, activeAlgorithms.hybrid].filter(Boolean).length;
  const gridCols = activeCount === 1 ? 'grid-cols-1' : activeCount === 2 ? 'grid-cols-2' : 'grid-cols-3';

  // Contrast-aware algorithm colors for headers
  const getAlgoHeaderColor = (algoId: AlgorithmType) => {
    if (isLight) {
      if (algoId === 'bfs') return '#047857'; // emerald-700
      if (algoId === 'dfs') return '#7e22ce'; // purple-700
      return '#b45309'; // amber-700
    }
    return ALGORITHMS.find(a => a.id === algoId)?.color || '#fff';
  };

  const renderAlgoColumn = (algoId: AlgorithmType, name: string) => {
    const isActive = activeAlgorithms[algoId];
    const headerColor = getAlgoHeaderColor(algoId);
    const stepData = activeSteps[algoId];
    const resultData = multiResults?.[algoId];

    // Guard against Step 0 to ensure a clean visual slate before running
    const isStart = stepIndex === 0;

    const exploredCount = (stepIndex === 0) ? 0 : (status === 'done' && resultData ? resultData.metrics.nodesExplored : (stepData?.nodesExplored ?? stepData?.explored.length ?? 0));

    const actualDistance = (stepIndex === 0)
      ? 0
      : (status === 'done' && resultData
        ? resultData.metrics.pathLength
        : Math.max(0, (stepData?.path.length || 0) - 1));

    const rawOptimality = (actualDistance > 0 && optimalPathLength && optimalPathLength > 0)
      ? getPathOptimality(actualDistance, optimalPathLength)
      : { ratio: 0, label: 'N/A', color: '#64748b' };

    // High contrast color mapping for light mode
    const getOptimalityColor = (ratio: number, defaultColor: string) => {
      if (!isLight) return defaultColor;
      if (ratio <= 0) return '#475569';
      if (ratio >= 0.95) return '#15803d'; // emerald-700
      if (ratio >= 0.8) return '#16a34a';  // green-600
      if (ratio >= 0.6) return '#b45309';  // amber-700 (deep readable gold)
      return '#dc2626'; // red-600
    };

    const optimalityColor = getOptimalityColor(rawOptimality.ratio, rawOptimality.color);

    const hasDeliveredCounts = stepData?.deliveredBoxCounts !== undefined;
    let completion = { percentage: 0, label: '0.0%' };
    if (!isStart) {
      if (scenario === 'robotics' && mapId !== 'clinic' && hasDeliveredCounts && stepData?.deliveredBoxCounts) {
        const boxTargets = new Map<string, number>();
        const assigned = robotAssignments.filter(assignment => assignment.destinations.length > 0);
        if (assigned.length > 0) {
          assigned.forEach(assignment => assignment.destinations.forEach(destinationId => {
            boxTargets.set(destinationId, (boxTargets.get(destinationId) ?? 0) + (assignment.boxCounts?.[destinationId] ?? 6));
          }));
        } else {
          (resultData?.graph.destinationIds ?? []).forEach(destinationId => boxTargets.set(destinationId, 6));
        }
        const totalRequired = [...boxTargets.values()].reduce((sum, count) => sum + count, 0);
        const totalDelivered = [...boxTargets.keys()].reduce(
          (sum, destinationId) => sum + Math.min(stepData.deliveredBoxCounts?.[destinationId] ?? 0, boxTargets.get(destinationId) ?? 0),
          0
        );
        const pct = totalRequired > 0 ? Math.min(100, (totalDelivered / totalRequired) * 100) : 0;
        completion = { percentage: pct, label: `${pct.toFixed(1)}%` };
      } else if (status === 'done' && resultData && resultData.metrics.completionRate !== undefined) {
        completion = { percentage: resultData.metrics.completionRate, label: `${resultData.metrics.completionRate.toFixed(1)}%` };
      } else {
        completion = getCompletionRate(exploredCount, totalNodes);
      }
    }

    const rawAdaptability = isStart
      ? { score: 0, label: '-', color: '#64748b' }
      : getAdaptabilityScore(status, resultData?.metrics || null, algoId, multiResults?.hybrid.dynamicEvents, stepIndex, completion.percentage);

    const getAdaptabilityColor = (score: number, defaultColor: string) => {
      if (!isLight) return defaultColor;
      if (score === 0 && isStart) return '#475569';
      if (score >= 80) return '#15803d'; // deep emerald
      if (score >= 60) return '#16a34a'; // green
      if (score >= 40) return '#b45309'; // amber-700
      return '#dc2626'; // red-600
    };

    const adaptabilityColor = getAdaptabilityColor(rawAdaptability.score, rawAdaptability.color);

    // ── Real-time memory estimate ───────────────────────────────────────────
    const NODE_BYTES = 80;
    const liveExplored = stepData?.nodesExplored ?? (stepData?.explored.length ?? 0);
    const rawFrontier = stepData?.frontierLength ?? (stepData?.frontier.length ?? 0);
    const adjustedFrontier = algoId === 'dfs' ? Math.max(1, Math.floor(rawFrontier * 0.2)) : rawFrontier;
    const frontierWeight = algoId === 'bfs' ? 4 : 1.5;
    const multiplier = algoId === 'hybrid' ? 1.1 : 1.0;
    const liveMemoryKB = ((liveExplored * NODE_BYTES + adjustedFrontier * NODE_BYTES * frontierWeight) * multiplier) / 1024;

    const displayMemory = isStart
      ? '0.000 MB'
      : status === 'done' && resultData
        ? getMemoryInMB(resultData.metrics.memoryUsed)
        : getMemoryInMB(liveMemoryKB);

    // Hidden algorithm — don't render the column at all
    if (!isActive) return null;

    const cardClass = isLight
      ? 'flex flex-col bg-white border border-slate-200/90 rounded-lg p-2 shadow-xs'
      : 'flex flex-col bg-gradient-to-br from-slate-800/50 to-slate-900/80 border border-slate-700/30 rounded-lg p-2';

    const labelClass = isLight
      ? 'text-[9px] text-slate-600 uppercase tracking-wider font-extrabold mb-0.5'
      : 'text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-0.5';

    const primaryValueClass = isLight
      ? 'text-sm font-extrabold text-slate-900'
      : 'text-sm font-bold text-slate-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]';

    return (
      <div className={`flex flex-col gap-2.5 text-center ${isLight ? 'border-r border-slate-200 last:border-0' : 'border-r border-slate-700/40 last:border-0'} px-1.5`}>
        <div
          className="font-extrabold text-sm truncate pb-1.5 border-b"
          style={{
            color: headerColor,
            borderColor: isLight ? '#e2e8f0' : 'rgba(51, 65, 85, 0.4)'
          }}
        >
          {name}
        </div>

        <div className={cardClass}>
          <div className={labelClass}>Visited Nodes</div>
          <div className={primaryValueClass}>
            {exploredCount}
          </div>
        </div>

        <div className={cardClass}>
          <div className={labelClass}>Completion</div>
          <div className={`text-sm font-extrabold ${isLight ? 'text-blue-700' : 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.3)]'}`}>
            {completion.label}
          </div>
        </div>

        <div className={cardClass}>
          <div className={labelClass}>
            {scenario === 'network' ? 'Total Latency' : scenario === 'traffic' ? 'Travel Time' : scenario === 'evacuation' ? 'Evac Time' : scenario === 'gameai' ? 'Moves' : 'Distance'}
          </div>
          <div className={primaryValueClass}>
            {status === 'done' && resultData
              ? `${resultData.metrics.totalLatency.toFixed(scenario === 'gameai' ? 0 : 1)}${scenario === 'network' ? ' ms' : scenario === 'robotics' ? ' m' : scenario === 'traffic' ? ' min' : scenario === 'evacuation' ? ' s' : ''}`
              : stepData?.currentLatency !== undefined
                ? `${stepData.currentLatency.toFixed(scenario === 'gameai' ? 0 : 1)}${scenario === 'network' ? ' ms' : scenario === 'robotics' ? ' m' : scenario === 'traffic' ? ' min' : scenario === 'evacuation' ? ' s' : ''}`
                : '-'}
          </div>
        </div>

        <div className={cardClass}>
          <div className={labelClass}>Optimal % (Hops)</div>
          <div className="text-sm font-extrabold" style={{ color: optimalityColor }}>{rawOptimality.label}</div>
        </div>

        <div className={cardClass}>
          <div className={labelClass}>Memory</div>
          <div className={primaryValueClass}>{displayMemory}</div>
        </div>

        <div className={cardClass}>
          <div className={labelClass}>Adaptability</div>
          <div className="text-sm font-extrabold" style={{ color: adaptabilityColor }}>{rawAdaptability.score}</div>
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-xl p-4 transition-colors duration-300 space-y-4 fade-in border ${
      isLight
        ? 'bg-white/95 backdrop-blur-lg border-slate-200/90 shadow-lg'
        : 'bg-slate-900/60 backdrop-blur-lg border-slate-800/80 shadow-xl hover:border-slate-700/60'
    }`}>
      <div className={`flex items-center justify-between border-b pb-2 mb-2 ${isLight ? 'border-slate-200' : 'border-gray-700/50'}`}>
        <span
          className="text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5"
          style={{ color: isLight ? sc.color : sc.color }}
        >
          {sc.name}
        </span>
        <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Step {stepIndex} / {totalSteps}</span>
      </div>

      <div>
        <div className={`w-full rounded-full h-2 border ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-gray-800 border-gray-700'}`}>
          <div className="h-2 rounded-full bg-blue-600 transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={`grid ${gridCols} rounded-lg p-2 border ${
        isLight
          ? 'bg-slate-100/70 border-slate-200/80 shadow-inner'
          : 'bg-black/30 border-white/5 shadow-inner'
      }`}>
        {renderAlgoColumn('bfs', 'BFS')}
        {renderAlgoColumn('dfs', 'DFS')}
        {renderAlgoColumn('hybrid', 'HYBRID')}
      </div>

      {status === 'done' && multiResults && (
        multiResults.hybrid.metrics.failureReason ? (
          <div className={`text-center text-xs p-2.5 rounded-lg leading-snug border ${
            isLight
              ? 'text-red-900 bg-red-100/80 border-red-300 font-medium'
              : 'text-red-400 bg-red-900/20 border-red-500/30'
          }`}>
            <div className="font-extrabold mb-1 uppercase tracking-wider text-[10px]">Target Unreachable</div>
            <div>{multiResults.hybrid.metrics.failureReason}</div>
          </div>
        ) : (
          <div className={`text-center text-xs p-2.5 rounded-lg border font-bold ${
            isLight
              ? 'text-emerald-900 bg-emerald-100/90 border-emerald-300 shadow-xs'
              : 'text-green-400 bg-green-900/20 border-green-500/30'
          }`}>
            Simulation Complete
          </div>
        )
      )}
    </div>
  );
};
