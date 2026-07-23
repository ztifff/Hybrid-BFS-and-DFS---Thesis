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
}) => {
  const sc = getScenario(scenario);
  const progress = totalSteps > 0 ? (stepIndex / totalSteps) * 100 : 0;

  const renderAlgoColumn = (algoId: AlgorithmType, name: string) => {
      const color = ALGORITHMS.find(a => a.id === algoId)?.color || '#fff';
      const stepData = activeSteps[algoId];
      const resultData = multiResults?.[algoId];

      // Guard against Step 0 to ensure a clean visual slate before running
      const isStart = stepIndex === 0;

      const exploredCount = (stepIndex === 0) ? 0 : (status === 'done' && resultData ? resultData.metrics.nodesExplored : (stepData?.explored.length || 0));
      
      const actualDistance = (stepIndex === 0) ? 0 : (status === 'done' && resultData ? resultData.metrics.pathLength : Math.max(0, (stepData?.path.length || 1) - 1));
      
      const optimality = isStart ? { ratio: 0, label: 'N/A', color: '#64748b' } : getPathOptimality(actualDistance, optimalPathLength);
      
      const adaptability = isStart 
        ? { score: 0, label: '-', color: '#64748b' } 
        : getAdaptabilityScore(status, resultData?.metrics || null, algoId, multiResults?.hybrid.dynamicEvents);
      
      const hasDeliveredCounts = stepData?.deliveredBoxCounts !== undefined;
      let completion = { percentage: 0, label: '0.0%' };
      if (!isStart) {
        if (hasDeliveredCounts && stepData?.deliveredBoxCounts) {
          const totalDelivered = Object.values(stepData.deliveredBoxCounts).reduce((a, b) => a + b, 0);
          const pct = Math.min(100, (totalDelivered / 12) * 100);
          completion = { percentage: pct, label: `${pct.toFixed(1)}%` };
        } else if (status === 'done' && resultData && resultData.metrics.completionRate !== undefined) {
          completion = { percentage: resultData.metrics.completionRate, label: `${resultData.metrics.completionRate.toFixed(1)}%` };
        } else {
          completion = getCompletionRate(exploredCount, totalNodes);
        }
      }

      const displayMemory = isStart 
        ? '0.0 KB' 
        : (resultData ? getMemoryInMB(resultData.metrics.memoryUsed) : '-');

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
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider">Distance</div>
                  <div className="text-sm font-bold text-gray-200">{actualDistance > 0 ? actualDistance.toFixed(1) : '-'}</div>
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
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: sc.color }}>
          {sc.icon} {sc.name}
        </span>
        <span className="text-xs text-gray-500 font-mono">Step {stepIndex} / {totalSteps}</span>
      </div>

      <div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div className="h-2 rounded-full bg-blue-500 transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-3 bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
          {renderAlgoColumn('bfs', 'BFS')}
          {renderAlgoColumn('dfs', 'DFS')}
          {renderAlgoColumn('hybrid', 'HYBRID')}
      </div>

      {status === 'done' && multiResults && (
        <div className="text-center text-xs text-green-400 bg-green-900/20 border border-green-500/30 p-2 rounded-lg">
          ✅ Simulation Complete. See Final Report below.
        </div>
      )}
    </div>
  );
};
