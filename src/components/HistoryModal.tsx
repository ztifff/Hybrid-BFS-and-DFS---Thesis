import React, { useState, useEffect } from 'react';
import { SimulationResult, ScenarioType } from '../types';
import { getAlgorithm } from '../config/scenarios';
import { getCompletionRate, getPathOptimality, getMemoryInMB, getAdaptabilityScore } from './MetricsPanel';
import { NetworkCanvas } from './NetworkCanvas'; 

export interface HistoryEntry {
  id: string;
  runNumber: number;
  name: string; 
  algorithm: string; // Keeps type safety
  scenario: ScenarioType; 
  simResult: SimulationResult; // Represents the Hybrid result (primary)
  multiResults?: { bfs: SimulationResult, dfs: SimulationResult, hybrid: SimulationResult }; // ✅ Added optional field for full history
  optimalPathLength: number;
  totalNodes: number;
  timestamp: Date;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  scenario?: ScenarioType; 
  onDeleteHistory: (ids: string[]) => void;
}

export const HistoryModal: React.FC<Props> = ({ isOpen, onClose, history, scenario, onDeleteHistory }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [activeEntry, setActiveEntry] = useState<HistoryEntry | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; targetId?: string }>({ isOpen: false });

  useEffect(() => {
    if (!isOpen) { setView('list'); setActiveEntry(null); setSelectedIds(new Set()); }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleOpenDetail = (entry: HistoryEntry) => {
    setActiveEntry(entry);
    setView('detail');
  };

  const executeDelete = () => {
    if (deleteDialog.targetId) {
      onDeleteHistory([deleteDialog.targetId]);
      if (activeEntry?.id === deleteDialog.targetId) { setView('list'); setActiveEntry(null); }
    } else {
      onDeleteHistory(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
    setDeleteDialog({ isOpen: false });
  };

  const renderDetailView = (entry: HistoryEntry) => {
    // If multiResults exists use it, otherwise fallback to the single simResult wrapper
    const results = entry.multiResults || { bfs: entry.simResult, dfs: entry.simResult, hybrid: entry.simResult };
    
    const getData = (algo: 'bfs' | 'dfs' | 'hybrid') => {
        const res = results[algo];
        const actualHops = Math.max(res.metrics.pathLength, 1);
        const cRate = res.metrics.completionRate !== undefined ? res.metrics.completionRate.toFixed(1) + '%' : '0%';
        return {
            time: res.metrics.timeElapsed,
            nodes: res.metrics.nodesExplored,
            hops: actualHops,
            memory: getMemoryInMB(res.metrics.memoryUsed),
            optimality: getPathOptimality(actualHops, entry.optimalPathLength),
            completion: cRate,
            adaptability: getAdaptabilityScore('done', res.metrics, algo, res.dynamicEvents),
            success: res.metrics.exitFound
        };
    };

    const bfs = getData('bfs');
    const dfs = getData('dfs');
    const hyb = getData('hybrid');

    const renderCell = (value: string | number, isWinner: boolean, color: string, isFailure: boolean = false) => (
        <td className={`py-2 text-center text-xs font-bold ${isFailure ? 'text-red-500' : isWinner ? 'bg-green-900/20 text-green-400 rounded' : 'text-gray-300'}`} style={!isFailure && !isWinner ? { color } : {}}>
            {isFailure ? 'Failed' : value}
        </td>
    );

    return (
      <div className="flex flex-col gap-6 p-4">
        <div className="bg-gray-900/80 border border-blue-900/50 rounded-xl p-4 shadow-lg">
          <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wide">🏆 Comparative Benchmark</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-2 text-xs text-gray-500">Metric</th>
                <th className="py-2 text-center text-xs text-green-400">BFS</th>
                <th className="py-2 text-center text-xs text-purple-400">DFS</th>
                <th className="py-2 text-center text-xs text-orange-400">HYBRID</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 text-xs text-gray-400">Time</td>
                {renderCell(`${bfs.time.toFixed(1)}ms`, false, '#22c55e', !bfs.success)}
                {renderCell(`${dfs.time.toFixed(1)}ms`, false, '#a855f7', !dfs.success)}
                {renderCell(`${hyb.time.toFixed(1)}ms`, false, '#f97316', !hyb.success)}
              </tr>
              <tr>
                <td className="py-2 text-xs text-gray-400">Completion</td>
                {renderCell(bfs.completion, false, '#22c55e', !bfs.success)}
                {renderCell(dfs.completion, false, '#a855f7', !dfs.success)}
                {renderCell(hyb.completion, false, '#f97316', !hyb.success)}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="h-[400px] w-full bg-[#0a0f1e] rounded-xl border border-gray-800">
             <NetworkCanvas graph={results.hybrid.graph} activeSteps={{bfs: null, dfs: null, hybrid: results.hybrid.steps[results.hybrid.steps.length-1]}} scenario={entry.scenario} stepIndex={results.hybrid.steps.length} dynamicEvents={results.hybrid.dynamicEvents} />
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#0a0f1e] border border-gray-800 rounded-2xl w-full max-w-[1200px] h-[90vh] flex flex-col overflow-hidden">
          <header className="p-6 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">{view === 'list' ? '🗄️ History' : `🔍 ${activeEntry?.name}`}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
          </header>
          <div className="flex-1 overflow-y-auto p-4">
            {view === 'list' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map(entry => (
                  <div key={entry.id} onClick={() => handleOpenDetail(entry)} className="p-4 bg-gray-900 border border-gray-700 rounded-xl cursor-pointer hover:border-gray-500">
                    <h3 className="font-bold text-white">{entry.name}</h3>
                    <p className="text-xs text-gray-500">{entry.timestamp.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : activeEntry && renderDetailView(activeEntry)}
          </div>
          <footer className="p-4 border-t border-gray-800 flex justify-end">
            {view === 'detail' && <button onClick={() => setView('list')} className="px-4 py-2 bg-gray-800 rounded text-white">← Back to List</button>}
          </footer>
        </div>
      </div>
    </>
  );
};