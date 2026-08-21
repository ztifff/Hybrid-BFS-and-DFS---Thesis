import React from 'react';
import { AlgorithmStep } from '../../types';

interface ExpertModePanelProps {
  activeSteps: {
    bfs?: AlgorithmStep | null;
    dfs?: AlgorithmStep | null;
    hybrid?: AlgorithmStep | null;
  };
  activeAlgorithms: {
    bfs: boolean;
    dfs: boolean;
    hybrid: boolean;
  };
}

export const ExpertModePanel: React.FC<ExpertModePanelProps> = ({ activeSteps, activeAlgorithms }) => {
  return (
    <div className="bg-black border border-green-900/50 rounded-xl p-4 flex flex-col gap-3 font-mono shadow-[0_0_15px_rgba(34,197,94,0.1)] fade-in relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent animate-pulse"></div>
      
      <div className="flex items-center gap-2 mb-1">
        <span className="text-green-500 animate-pulse font-bold text-sm">{'>_'}</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-green-400/80 font-bold">Live Algorithmic Telemetry</span>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto max-h-[40vh] pr-2 custom-scrollbar text-[11px] leading-tight">
        {activeAlgorithms.bfs && activeSteps.bfs && (
          <div className="bg-gray-900/80 rounded p-2 border border-gray-800">
            <div className="text-green-400 font-bold mb-1 border-b border-gray-800 pb-1">BFS Data Structure (Queue)</div>
            <div className="text-gray-400 mt-1.5 flex flex-col gap-1.5">
              <div><span className="text-gray-500">Evaluating:</span> <span className="text-white bg-gray-800 px-1 py-0.5 rounded">{activeSteps.bfs.current || 'null'}</span></div>
              
              <div className="flex flex-col gap-0.5">
                <span className="text-gray-500">Queue (Frontier) [{activeSteps.bfs.frontier.length}]:</span>
                <span className="text-cyan-400 font-mono text-[10px] break-all">
                  {activeSteps.bfs.frontier.length > 0 
                    ? `[${activeSteps.bfs.frontier.slice(0, 5).join(', ')}${activeSteps.bfs.frontier.length > 5 ? ', ...' : ''}]` 
                    : '[]'}
                </span>
                <span className="text-gray-600 text-[9px] italic">← Dequeue (FIFO)</span>
              </div>

              <div className="flex flex-col gap-0.5 border-t border-gray-800/50 pt-1">
                <span className="text-gray-500">Current Path Trace:</span>
                <span className="text-indigo-400 font-mono text-[10px] break-all">
                  {activeSteps.bfs.path.length > 0 ? activeSteps.bfs.path.join(' → ') : 'None'}
                </span>
              </div>
              
              {activeSteps.bfs.phaseLabel && <div><span className="text-gray-500">Routine:</span> <span className="text-yellow-400 text-[10px]">{activeSteps.bfs.phaseLabel}</span></div>}
            </div>
          </div>
        )}

        {activeAlgorithms.dfs && activeSteps.dfs && (
          <div className="bg-gray-900/80 rounded p-2 border border-gray-800">
            <div className="text-purple-400 font-bold mb-1 border-b border-gray-800 pb-1">DFS Data Structure (Stack)</div>
            <div className="text-gray-400 mt-1.5 flex flex-col gap-1.5">
              <div><span className="text-gray-500">Evaluating:</span> <span className="text-white bg-gray-800 px-1 py-0.5 rounded">{activeSteps.dfs.current || 'null'}</span></div>
              
              <div className="flex flex-col gap-0.5">
                <span className="text-gray-500">Stack (Frontier) [{activeSteps.dfs.frontier.length}]:</span>
                <span className="text-cyan-400 font-mono text-[10px] break-all">
                  {activeSteps.dfs.frontier.length > 0 
                    ? `[${activeSteps.dfs.frontier.slice(-5).reverse().join(', ')}${activeSteps.dfs.frontier.length > 5 ? ', ...' : ''}]` 
                    : '[]'}
                </span>
                <span className="text-gray-600 text-[9px] italic">← Pop (LIFO) top 5 shown</span>
              </div>

              <div className="flex flex-col gap-0.5 border-t border-gray-800/50 pt-1">
                <span className="text-gray-500">Current Path Trace:</span>
                <span className="text-indigo-400 font-mono text-[10px] break-all">
                  {activeSteps.dfs.path.length > 0 ? activeSteps.dfs.path.join(' → ') : 'None'}
                </span>
              </div>
              
              {activeSteps.dfs.phaseLabel && <div><span className="text-gray-500">Routine:</span> <span className="text-yellow-400 text-[10px]">{activeSteps.dfs.phaseLabel}</span></div>}
            </div>
          </div>
        )}

        {activeAlgorithms.hybrid && activeSteps.hybrid && (
          <div className="bg-gray-900/80 rounded p-2 border border-gray-800">
            <div className="text-orange-400 font-bold mb-1 border-b border-gray-800 pb-1">Hybrid Data Structure (Smart Queue)</div>
            <div className="text-gray-400 mt-1.5 flex flex-col gap-1.5">
              <div><span className="text-gray-500">Evaluating:</span> <span className="text-white bg-gray-800 px-1 py-0.5 rounded">{activeSteps.hybrid.current || 'null'}</span></div>
              
              <div className="flex flex-col gap-0.5">
                <span className="text-gray-500">Smart Queue [{activeSteps.hybrid.frontier.length}]:</span>
                <span className="text-cyan-400 font-mono text-[10px] break-all">
                  {activeSteps.hybrid.frontier.length > 0 
                    ? `[${activeSteps.hybrid.frontier.slice(0, 5).join(', ')}${activeSteps.hybrid.frontier.length > 5 ? ', ...' : ''}]` 
                    : '[]'}
                </span>
                <span className="text-gray-600 text-[9px] italic">← Active Heuristic Sort</span>
              </div>

              <div className="flex flex-col gap-0.5 border-t border-gray-800/50 pt-1">
                <span className="text-gray-500">Current Path Trace:</span>
                <span className="text-indigo-400 font-mono text-[10px] break-all">
                  {activeSteps.hybrid.path.length > 0 ? activeSteps.hybrid.path.join(' → ') : 'None'}
                </span>
              </div>
              
              {activeSteps.hybrid.phaseLabel && <div><span className="text-gray-500">Routine:</span> <span className="text-yellow-400 font-bold text-[10px]">{activeSteps.hybrid.phaseLabel}</span></div>}
            </div>
          </div>
        )}
        
        {(!activeSteps.bfs && !activeSteps.dfs && !activeSteps.hybrid) && (
          <div className="text-gray-500 italic text-center py-4">Waiting for simulation telemetry...</div>
        )}
      </div>
    </div>
  );
};
