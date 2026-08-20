import React from 'react';
import { SimulationResult, DynamicEvent } from '../../types';
import { getPathOptimality, getMemoryInMB, getAdaptabilityScore } from '../../utils/metricsHelpers';
import { ALGORITHMS } from '../../config/scenarios';


interface Props {
  multiResults: { bfs: SimulationResult, dfs: SimulationResult, hybrid: SimulationResult };
  bfsResult: any;
  totalNodes: number;
  dynamicEvents: DynamicEvent[];
  onSaveResult: () => void;
  isSaved: boolean;
  scenarioColor?: string;
  activeAlgorithms?: { bfs: boolean; dfs: boolean; hybrid: boolean };
}

export const SimulationReport: React.FC<Props> = ({
  multiResults,
  bfsResult,
  dynamicEvents,
  onSaveResult,
  isSaved,
  scenarioColor,
  activeAlgorithms = { bfs: true, dfs: true, hybrid: true },
}) => {
  const optimalDistance = bfsResult?.pathLength || 1;

  const getData = (algo: 'bfs' | 'dfs' | 'hybrid') => {
    const res = multiResults[algo];
    const actualDistance = Math.max(res.metrics.pathLength, 1);
    const cRate = res.metrics.completionRate ? res.metrics.completionRate.toFixed(1) + '%' : '0%';

    return {
      time: res.metrics.timeElapsed,
      nodes: res.metrics.nodesExplored,
      distance: actualDistance,
      memory: res.metrics.memoryUsed,
      memoryLabel: getMemoryInMB(res.metrics.memoryUsed),
      optimality: getPathOptimality(actualDistance, optimalDistance),
      completion: cRate,
      adaptability: getAdaptabilityScore('done', res.metrics, algo, dynamicEvents),
      success: res.metrics.exitFound,
      reason: res.metrics.failureReason
    };
  };

  // Build list of only active algorithms to render
  type AlgoKey = 'bfs' | 'dfs' | 'hybrid';
  const allAlgos: AlgoKey[] = ['bfs', 'dfs', 'hybrid'];
  const activeAlgos = allAlgos.filter(a => activeAlgorithms[a]);

  const data: Record<AlgoKey, ReturnType<typeof getData>> = {
    bfs: getData('bfs'),
    dfs: getData('dfs'),
    hybrid: getData('hybrid'),
  };

  // Winner comparisons consider only active algorithms
  const minTime = Math.min(...activeAlgos.map(a => data[a].time));
  const minNodes = Math.min(...activeAlgos.map(a => data[a].nodes));
  const minMemory = Math.min(...activeAlgos.map(a => data[a].memory));
  const maxAdapt = Math.max(...activeAlgos.map(a => data[a].adaptability.score));

  const colors: Record<AlgoKey, string> = {
    bfs: ALGORITHMS.find(a => a.id === 'bfs')?.color || '#fff',
    dfs: ALGORITHMS.find(a => a.id === 'dfs')?.color || '#fff',
    hybrid: ALGORITHMS.find(a => a.id === 'hybrid')?.color || '#fff',
  };
  const labels: Record<AlgoKey, string> = { bfs: 'BFS', dfs: 'DFS', hybrid: 'HYBRID' };

  const renderCell = (algo: AlgoKey, value: string | number, isWinner: boolean, isFailure: boolean = false) => (
    <td key={algo} className={`py-2 text-center text-xs font-bold ${isFailure ? 'text-red-500'
        : isWinner ? 'bg-green-900/20 text-green-400 rounded'
          : 'text-gray-300'
      }`} style={!isFailure && !isWinner ? { color: colors[algo] } : {}}>
      {isFailure ? 'Failed' : value}
    </td>
  );

  const anyFailure = activeAlgos.some(a => !data[a].success);

  return (
    <div className="glass-panel rounded-xl p-4 shadow-[0_0_20px_rgba(30,58,138,0.15)] shrink-0 relative overflow-hidden flex flex-col fade-in hover:shadow-glow-blue transition-shadow duration-500">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
        Comparative Benchmark
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="py-2 text-xs text-gray-500 uppercase font-normal">Metric</th>
              {activeAlgos.map(algo => (
                <th key={algo} className="py-2 text-center text-xs font-bold" style={{ color: colors[algo] }}>
                  {labels[algo]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            <tr>
              <td className="py-2 text-xs text-gray-400">Execution Time</td>
              {activeAlgos.map(a => renderCell(a, `${data[a].time.toFixed(3)} ms`, data[a].time === minTime, !data[a].success))}
            </tr>
            <tr>
              <td className="py-2 text-xs text-gray-400">Nodes Visited</td>
              {activeAlgos.map(a => renderCell(a, data[a].nodes, data[a].nodes === minNodes, !data[a].success))}
            </tr>
            <tr>
              <td className="py-2 text-xs text-gray-400">Completion Rate</td>
              {activeAlgos.map(a => renderCell(a, data[a].completion, false, !data[a].success))}
            </tr>
            <tr>
              <td className="py-2 text-xs text-gray-400">Memory Used</td>
              {activeAlgos.map(a => renderCell(a, data[a].memoryLabel, data[a].memory === minMemory, !data[a].success))}
            </tr>
            <tr>
              <td className="py-2 text-xs text-gray-400">Path Optimality</td>
              {activeAlgos.map(a => renderCell(a, data[a].optimality.label, data[a].optimality.ratio >= 0.95, !data[a].success))}
            </tr>
            <tr>
              <td className="py-2 text-xs text-gray-400">Adaptability</td>
              {activeAlgos.map(a => renderCell(a, data[a].adaptability.score, data[a].adaptability.score === maxAdapt, !data[a].success))}
            </tr>
          </tbody>
        </table>
      </div>

      {anyFailure && (
        <div className="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-300 leading-snug">
          <span className="font-bold uppercase tracking-wider text-[10px]">Failure Reason:</span>{' '}
          {activeAlgos.map(a => data[a].reason).find(Boolean) || 'Target unreachable'}
        </div>
      )}

      <button
        onClick={onSaveResult}
        disabled={isSaved}
        style={!isSaved ? {
          backgroundColor: `${scenarioColor || '#3b82f6'}33`,
          borderColor: `${scenarioColor || '#3b82f6'}80`,
          color: scenarioColor || '#93c5fd',
          boxShadow: `0 0 15px ${scenarioColor || '#3b82f6'}26`
        } : {}}
        className={`mt-5 w-full py-2.5 rounded-lg font-bold text-sm transition-all ${isSaved
            ? 'bg-green-600/20 border border-green-500/50 text-green-400 cursor-default shadow-[0_0_15px_rgba(34,197,94,0.15)]'
            : 'hover:brightness-125 cursor-pointer'
          }`}
      >
        {isSaved ? '✅ Comparison Saved' : '💾 Save Comparison to History'}
      </button>
    </div>
  );
};
