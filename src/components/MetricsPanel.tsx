import React from 'react';
import { PerformanceMetrics, AlgorithmType, ScenarioType, DynamicEvent, SimulationResult, AlgorithmStep } from '../types';
import { getScenario, ALGORITHMS } from '../config/scenarios';

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

export function getPathOptimality(actualHops: number, optimalHops?: number): { ratio: number; label: string; color: string } {
  // ✅ FIX: Safely handle -1 hops (failed paths) so it doesn't output -1600%
  if (!optimalHops || optimalHops <= 0 || actualHops <= 0) return { ratio: 0, label: 'N/A', color: '#64748b' };
  
  const ratio = Math.min(1, optimalHops / actualHops); 
  const percentage = (ratio * 100).toFixed(1);
  if (ratio >= 0.95) return { ratio, label: `${percentage}%`, color: '#22c55e' };
  if (ratio >= 0.8) return { ratio, label: `${percentage}%`, color: '#84cc16' };
  if (ratio >= 0.6) return { ratio, label: `${percentage}%`, color: '#eab308' };
  return { ratio, label: `${percentage}%`, color: '#ef4444' };
}

export function getCompletionRate(explored: number, totalNodes?: number): { percentage: number; label: string } {
  if (!totalNodes || totalNodes === 0) return { percentage: 0, label: '0.0%' };
  const percentage = Math.min(100, (explored / totalNodes) * 100);
  return { percentage, label: `${percentage.toFixed(1)}%` };
}

export function getMemoryInMB(memoryKB: number): string {
  const memoryMB = memoryKB / 1024;
  return memoryMB >= 1 ? `${memoryMB.toFixed(2)} MB` : `${memoryKB.toFixed(1)} KB`;
}

export function getAdaptabilityScore(
  status: 'idle' | 'running' | 'done' | 'paused',
  metrics: PerformanceMetrics | null,
  algorithm: AlgorithmType,
  dynamicEvents?: DynamicEvent[]
): { score: number; label: string; color: string } {
  if (status !== 'done' || !metrics) return { score: 0, label: '-', color: '#64748b' };
  const eventCount = dynamicEvents?.length ?? 0;
  let score = metrics.exitFound ? 50 : 0;
  
  if (eventCount > 0) {
    const eventBonus = Math.min(40, eventCount * 10);
    score += metrics.exitFound ? eventBonus : Math.floor(eventBonus / 3);
    if (algorithm === 'hybrid' && metrics.exitFound) score += 10;
    else if (algorithm === 'bfs' && metrics.exitFound) score += 5;
  } else {
    score = metrics.exitFound ? 85 : 15;
  }
  
  if (metrics.pathLength > 0 && metrics.totalLatency > 0) {
    score += Math.floor(Math.min(10, (1 / metrics.pathLength) * 20));
  }
  
  score = Math.min(100, Math.max(0, score));
  if (score >= 80) return { score, label: 'Great', color: '#22c55e' };
  if (score >= 60) return { score, label: 'Good', color: '#84cc16' };
  if (score >= 40) return { score, label: 'Fair', color: '#eab308' };
  return { score, label: 'Poor', color: '#ef4444' };
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

      const exploredCount = stepData?.explored.length || 0;
      const actualHops = status === 'done' && resultData ? resultData.metrics.pathLength : Math.max(0, (stepData?.path.length || 1) - 1);
      const optimality = getPathOptimality(actualHops, optimalPathLength);
      const adaptability = getAdaptabilityScore(status, resultData?.metrics || null, algoId, multiResults?.hybrid.dynamicEvents);
      
      const completion = (status === 'done' && resultData && resultData.metrics.completionRate !== undefined) 
        ? { percentage: resultData.metrics.completionRate, label: `${resultData.metrics.completionRate.toFixed(1)}%` }
        : getCompletionRate(exploredCount, totalNodes);

      return (
          <div className="flex flex-col gap-2 text-center border-r border-gray-700/50 last:border-0 px-1">
              <div className="font-bold text-sm truncate pb-1 border-b border-gray-700/50" style={{ color }}>{name}</div>
              
              <div className="flex flex-col pt-1">
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider">Visited Nodes</div>
                  <div className="text-sm font-bold text-gray-200">
                    {exploredCount}
                  </div>
              </div>

              {/* ✅ FIX: Separated Completion into its own dedicated row */}
              <div className="flex flex-col">
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider">Completion</div>
                  <div className="text-sm font-bold text-blue-300">
                    {completion.label}
                  </div>
              </div>

              <div className="flex flex-col">
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider">Hops</div>
                  <div className="text-sm font-bold text-gray-200">{actualHops > 0 ? actualHops : '-'}</div>
              </div>

              <div className="flex flex-col">
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider">Optimal %</div>
                  <div className="text-sm font-bold" style={{ color: optimality.color }}>{optimality.label}</div>
              </div>

              <div className="flex flex-col">
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider">Memory</div>
                  <div className="text-sm font-bold text-gray-200">{resultData ? getMemoryInMB(resultData.metrics.memoryUsed) : '-'}</div>
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