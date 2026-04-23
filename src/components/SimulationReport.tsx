import React from 'react';
import { SimulationResult, AlgorithmType, DynamicEvent } from '../types';
import { getCompletionRate, getPathOptimality, getMemoryInMB, getAdaptabilityScore } from './MetricsPanel';

interface Props {
  simResult: SimulationResult;
  bfsResult: any;
  alColor: string;
  currentExplored: number;
  totalNodes: number;
  algorithm: AlgorithmType;
  dynamicEvents: DynamicEvent[];
  onSaveResult: () => void;  // ✅ New Prop
  isSaved: boolean;          // ✅ New Prop
}

export const SimulationReport: React.FC<Props> = ({ 
  simResult, 
  bfsResult, 
  alColor,
  currentExplored,
  totalNodes,
  algorithm,
  dynamicEvents,
  onSaveResult,
  isSaved
}) => {
  const isSuccess = simResult.metrics.exitFound;
  
  const actualHops = Math.max(simResult.metrics.pathLength, 1);
  const optimalHops = bfsResult?.pathLength || 1;
  
  const completion = getCompletionRate(currentExplored, totalNodes);
  const optimality = getPathOptimality(actualHops, optimalHops);
  const memory = getMemoryInMB(simResult.metrics.memoryUsed);
  const adaptability = getAdaptabilityScore('done', simResult.metrics, algorithm, dynamicEvents);

  return (
    <div className="bg-gray-900/80 border border-blue-900/50 rounded-xl p-5 shadow-[0_0_20px_rgba(30,58,138,0.15)] shrink-0 relative overflow-hidden flex flex-col">
      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: alColor }}></div>
      <h3 className="font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
        📑 Final Report
      </h3>
      <div className="space-y-3 flex-1">
        <ReportRow label="Execution Time" value={`${simResult.metrics.timeElapsed.toFixed(3)} ms`} subValue="Total time to compute the path" />
        <ReportRow label="Nodes Visited" value={currentExplored.toLocaleString()} subValue={`Out of ${totalNodes} total map nodes`} />
        <ReportRow label="Path Optimality" value={optimality.label} subValue={isSuccess ? `Algorithm: ${actualHops} hops | Optimal: ${optimalHops} hops` : 'No valid path found'} />
        <ReportRow label="Memory Consumption" value={memory} subValue="Estimated data structure size" />
        <ReportRow label="Completion Rate" value={completion.label} subValue="Exploration coverage of the map" />
        <ReportRow label="Adaptability Score" value={`${adaptability.score} / 100`} subValue={isSuccess ? 'Overcame all topological changes' : 'Trapped by environmental disruptions'} />
      </div>

      {/* ✅ MANUAL SAVE BUTTON */}
      <button 
        onClick={onSaveResult}
        disabled={isSaved}
        className={`mt-5 w-full py-2.5 rounded-lg font-bold text-sm transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)] ${
          isSaved 
            ? 'bg-green-600/20 border border-green-500/50 text-green-400 cursor-default' 
            : 'bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-300 cursor-pointer'
        }`}
      >
        {isSaved ? '✅ Result Saved to History' : '💾 Save Result to History'}
      </button>
    </div>
  );
};

const ReportRow: React.FC<{ label: string; value: string; subValue?: string }> = ({ label, value, subValue }) => (
  <div className="flex flex-col border-b border-gray-800/60 pb-2 last:border-0 last:pb-0">
    <div className="flex justify-between items-start">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <span className="text-sm font-bold text-white text-right" dangerouslySetInnerHTML={{ __html: value }}></span>
    </div>
    {subValue && <span className="text-[10px] text-gray-500 text-right mt-0.5">{subValue}</span>}
  </div>
);