import React, { useState } from 'react';
import { AlgorithmType, SimulationResult } from '../types';
import { getAlgorithm } from '../config/scenarios';
import { getCompletionRate, getPathOptimality, getMemoryInMB, getAdaptabilityScore } from './MetricsPanel';

export interface HistoryEntry {
  id: string;
  runNumber: number;
  algorithm: AlgorithmType;
  simResult: SimulationResult;
  optimalPathLength: number;
  totalNodes: number;
  timestamp: Date;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
}

export const HistoryModal: React.FC<Props> = ({ isOpen, onClose, history }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'list' | 'compare'>('list');

  if (!isOpen) return null;

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const algos: AlgorithmType[] = ['bfs', 'dfs', 'hybrid'];

  const renderList = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {algos.map((algo) => {
        const cfg = getAlgorithm(algo);
        const algoHistory = history.filter(h => h.algorithm === algo);

        return (
          <div key={algo} className="flex flex-col border-r border-gray-700 last:border-0 pr-0 md:pr-6 last:pr-0">
            <h3 className="text-xl font-bold mb-4 text-center pb-2 border-b border-gray-700" style={{ color: cfg.color }}>
              {cfg.name}
            </h3>
            <div className="flex flex-col gap-3">
              {algoHistory.length === 0 ? (
                <div className="text-gray-600 text-center text-sm italic py-4">No results yet</div>
              ) : (
                algoHistory.map(entry => {
                  const isSelected = selectedIds.has(entry.id);
                  return (
                    <label 
                      key={entry.id} 
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected ? 'bg-gray-800 border-blue-500' : 'bg-gray-900/50 border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelection(entry.id)}
                        className="w-5 h-5 rounded border-gray-600 text-blue-600 bg-gray-800 focus:ring-blue-500 focus:ring-offset-gray-900"
                      />
                      <div className="ml-3 flex flex-col">
                        <span className="font-bold text-white text-sm">Run #{entry.runNumber}</span>
                        <span className="text-xs text-gray-400">
                          {entry.simResult.metrics.pathLength} hops • {entry.simResult.metrics.timeElapsed.toFixed(1)}ms
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderCompare = () => {
    const selectedEntries = history.filter(h => selectedIds.has(h.id));

    return (
      <div className={`grid gap-4 sm:gap-6 ${selectedEntries.length === 1 ? 'grid-cols-1' : selectedEntries.length === 2 ? 'grid-cols-2' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {selectedEntries.map(entry => {
          const cfg = getAlgorithm(entry.algorithm);
          const res = entry.simResult;
          const isSuccess = res.metrics.exitFound;
          const actualHops = Math.max(res.metrics.pathLength, 1);
          
          const completion = getCompletionRate(res.metrics.nodesExplored, entry.totalNodes);
          const optimality = getPathOptimality(actualHops, entry.optimalPathLength);
          const memory = getMemoryInMB(res.metrics.memoryUsed);
          const adaptability = getAdaptabilityScore('done', res.metrics, entry.algorithm, res.dynamicEvents);

          return (
            <div key={entry.id} className="bg-gray-800/50 border rounded-xl overflow-hidden relative" style={{ borderColor: cfg.color + '40' }}>
              <div className="h-1.5 w-full" style={{ backgroundColor: cfg.color }}></div>
              <div className="p-5">
                <h3 className="text-lg font-bold mb-1 text-center" style={{ color: cfg.color }}>
                  {cfg.name}
                </h3>
                <div className="text-center text-xs text-gray-400 mb-4 pb-2 border-b border-gray-700">Run #{entry.runNumber}</div>
                
                <div className="space-y-4">
                  <CompareRow label="Status" value={isSuccess ? '✅ Success' : '❌ Failed'} valColor={isSuccess ? '#4ade80' : '#f87171'} />
                  <CompareRow label="Execution Time" value={`${res.metrics.timeElapsed.toFixed(3)} ms`} />
                  <CompareRow label="Nodes Visited" value={`${res.metrics.nodesExplored.toLocaleString()} nodes`} subValue={completion.label} />
                  <CompareRow label="Path Optimality" value={optimality.label} valColor={optimality.color} subValue={`${actualHops} hops`} />
                  <CompareRow label="Memory Consumed" value={memory} />
                  <CompareRow label="Adaptability Score" value={`${adaptability.score} / 100`} valColor={adaptability.color} subValue={adaptability.label} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8 transition-opacity">
      <div className="bg-[#0a0f1e] border border-gray-700 rounded-2xl w-full max-w-6xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden max-h-[90vh]">
        
        <header className="bg-gray-900 border-b border-gray-700 p-4 sm:p-6 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🗄️ Result History
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Select previous simulation runs to compare their metrics side-by-side.
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 font-bold transition-colors">
            ✕
          </button>
        </header>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {view === 'list' ? renderList() : renderCompare()}
        </div>

        <footer className="bg-gray-900 border-t border-gray-700 p-4 sm:p-6 flex justify-end gap-4 shrink-0">
          {view === 'compare' ? (
            <button 
              onClick={() => setView('list')}
              className="px-6 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm transition-all"
            >
              ← Back to Selection
            </button>
          ) : (
            <button 
              onClick={() => setView('compare')}
              disabled={selectedIds.size === 0}
              className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold text-sm transition-all disabled:cursor-not-allowed shadow-[0_0_15px_rgba(37,99,235,0.3)]"
            >
              📊 Compare Selected ({selectedIds.size})
            </button>
          )}
        </footer>

      </div>
    </div>
  );
};

const CompareRow: React.FC<{ label: string; value: string; subValue?: string; valColor?: string }> = ({ label, value, subValue, valColor = '#fff' }) => (
  <div className="flex justify-between items-center border-b border-gray-700/50 pb-2 last:border-0 last:pb-0">
    <span className="text-sm text-gray-400">{label}</span>
    <div className="text-right">
      <div className="text-sm font-bold" style={{ color: valColor }}>{value}</div>
      {subValue && <div className="text-[10px] text-gray-500">{subValue}</div>}
    </div>
  </div>
);