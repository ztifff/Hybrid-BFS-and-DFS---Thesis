import React from 'react';
import { SimulationResult, DynamicEvent } from '../types';
import { getPathOptimality, getMemoryInMB, getAdaptabilityScore } from './MetricsPanel';
import { ALGORITHMS } from '../config/scenarios';

interface Props {
  multiResults: { bfs: SimulationResult, dfs: SimulationResult, hybrid: SimulationResult };
  bfsResult: any;
  totalNodes: number;
  dynamicEvents: DynamicEvent[];
  onSaveResult: () => void;  
  isSaved: boolean;          
}

export const SimulationReport: React.FC<Props> = ({ 
  multiResults, 
  bfsResult, 
  totalNodes,
  dynamicEvents,
  onSaveResult,
  isSaved
}) => {
  const optimalHops = bfsResult?.pathLength || 1;

  const getData = (algo: 'bfs' | 'dfs' | 'hybrid') => {
      const res = multiResults[algo];
      const actualHops = Math.max(res.metrics.pathLength, 1);
      // Grab official completion rate injected from simulationRunner
      const cRate = res.metrics.completionRate ? res.metrics.completionRate.toFixed(1) + '%' : '0%';
      
      return {
          time: res.metrics.timeElapsed,
          nodes: res.metrics.nodesExplored,
          hops: actualHops,
          memory: res.metrics.memoryUsed,
          memoryLabel: getMemoryInMB(res.metrics.memoryUsed),
          optimality: getPathOptimality(actualHops, optimalHops),
          completion: cRate, 
          adaptability: getAdaptabilityScore('done', res.metrics, algo, dynamicEvents),
          success: res.metrics.exitFound
      };
  };

  const bfs = getData('bfs');
  const dfs = getData('dfs');
  const hyb = getData('hybrid');

  const minTime = Math.min(bfs.time, dfs.time, hyb.time);
  const minNodes = Math.min(bfs.nodes, dfs.nodes, hyb.nodes);
  const minMemory = Math.min(bfs.memory, dfs.memory, hyb.memory);
  const maxAdapt = Math.max(bfs.adaptability.score, dfs.adaptability.score, hyb.adaptability.score);

  const renderCell = (value: string | number, isWinner: boolean, color: string, isFailure: boolean = false) => (
      <td className={`py-2 text-center text-xs font-bold ${isFailure ? 'text-red-500' : isWinner ? 'bg-green-900/20 text-green-400 rounded' : 'text-gray-300'}`} style={!isFailure && !isWinner ? { color } : {}}>
          {isFailure ? 'Failed' : value}
      </td>
  );

  const cBFS = ALGORITHMS.find(a => a.id === 'bfs')?.color || '#fff';
  const cDFS = ALGORITHMS.find(a => a.id === 'dfs')?.color || '#fff';
  const cHYB = ALGORITHMS.find(a => a.id === 'hybrid')?.color || '#fff';

  return (
    <div className="bg-gray-900/80 border border-blue-900/50 rounded-xl p-4 shadow-[0_0_20px_rgba(30,58,138,0.15)] shrink-0 relative overflow-hidden flex flex-col">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
        🏆 Comparative Benchmark
      </h3>
      
      <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
              <thead>
                  <tr className="border-b border-gray-700">
                      <th className="py-2 text-xs text-gray-500 uppercase font-normal">Metric</th>
                      <th className="py-2 text-center text-xs font-bold" style={{ color: cBFS }}>BFS</th>
                      <th className="py-2 text-center text-xs font-bold" style={{ color: cDFS }}>DFS</th>
                      <th className="py-2 text-center text-xs font-bold" style={{ color: cHYB }}>HYBRID</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                  <tr>
                      <td className="py-2 text-xs text-gray-400">Execution Time</td>
                      {renderCell(`${bfs.time.toFixed(3)} ms`, bfs.time === minTime, cBFS, !bfs.success)}
                      {renderCell(`${dfs.time.toFixed(3)} ms`, dfs.time === minTime, cDFS, !dfs.success)}
                      {renderCell(`${hyb.time.toFixed(3)} ms`, hyb.time === minTime, cHYB, !hyb.success)}
                  </tr>
                  <tr>
                      <td className="py-2 text-xs text-gray-400">Nodes Visited</td>
                      {renderCell(bfs.nodes, bfs.nodes === minNodes, cBFS, !bfs.success)}
                      {renderCell(dfs.nodes, dfs.nodes === minNodes, cDFS, !dfs.success)}
                      {renderCell(hyb.nodes, hyb.nodes === minNodes, cHYB, !hyb.success)}
                  </tr>
                  {/* ✅ NEW COMPONENT ROW */}
                  <tr>
                      <td className="py-2 text-xs text-gray-400">Completion Rate</td>
                      {renderCell(bfs.completion, false, cBFS, !bfs.success)}
                      {renderCell(dfs.completion, false, cDFS, !dfs.success)}
                      {renderCell(hyb.completion, false, cHYB, !hyb.success)}
                  </tr>
                  <tr>
                      <td className="py-2 text-xs text-gray-400">Memory Used</td>
                      {renderCell(bfs.memoryLabel, bfs.memory === minMemory, cBFS, !bfs.success)}
                      {renderCell(dfs.memoryLabel, dfs.memory === minMemory, cDFS, !dfs.success)}
                      {renderCell(hyb.memoryLabel, hyb.memory === minMemory, cHYB, !hyb.success)}
                  </tr>
                  <tr>
                      <td className="py-2 text-xs text-gray-400">Path Optimality</td>
                      {renderCell(bfs.optimality.label, bfs.optimality.ratio >= 0.95, cBFS, !bfs.success)}
                      {renderCell(dfs.optimality.label, dfs.optimality.ratio >= 0.95, cDFS, !dfs.success)}
                      {renderCell(hyb.optimality.label, hyb.optimality.ratio >= 0.95, cHYB, !hyb.success)}
                  </tr>
                  <tr>
                      <td className="py-2 text-xs text-gray-400">Adaptability</td>
                      {renderCell(bfs.adaptability.score, bfs.adaptability.score === maxAdapt, cBFS, !bfs.success)}
                      {renderCell(dfs.adaptability.score, dfs.adaptability.score === maxAdapt, cDFS, !dfs.success)}
                      {renderCell(hyb.adaptability.score, hyb.adaptability.score === maxAdapt, cHYB, !hyb.success)}
                  </tr>
              </tbody>
          </table>
      </div>

      <button 
        onClick={onSaveResult}
        disabled={isSaved}
        className={`mt-5 w-full py-2.5 rounded-lg font-bold text-sm transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)] ${
          isSaved 
            ? 'bg-green-600/20 border border-green-500/50 text-green-400 cursor-default' 
            : 'bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-300 cursor-pointer'
        }`}
      >
        {isSaved ? '✅ Comparison Saved' : '💾 Save Comparison to History'}
      </button>
    </div>
  );
};