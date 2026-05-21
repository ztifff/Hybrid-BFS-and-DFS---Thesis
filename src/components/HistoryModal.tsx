import React, { useState, useEffect, useMemo } from 'react';
import { SimulationResult, ScenarioType } from '../types';
import { getMemoryInMB, getPathOptimality, getAdaptabilityScore } from './MetricsPanel';
import { NetworkCanvas } from './NetworkCanvas'; 

export interface HistoryEntry {
  id: string;
  runNumber: number;
  name: string; 
  algorithm: string;
  scenario: ScenarioType; 
  simResult: SimulationResult; 
  multiResults?: { bfs: SimulationResult, dfs: SimulationResult, hybrid: SimulationResult };
  optimalPathLength: number;
  totalNodes: number;
  timestamp: Date | string; // Adjusted to handle backend date parsing strings
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  scenario?: ScenarioType; 
  onDeleteHistory: (ids: string[]) => void;
}

const SCENARIO_BADGES: Record<string, string> = {
  network: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  warehouse: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  traffic: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export const HistoryModal: React.FC<Props> = ({ isOpen, onClose, history, scenario, onDeleteHistory }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [activeEntry, setActiveEntry] = useState<HistoryEntry | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) { 
      setView('list'); 
      setActiveEntry(null); 
      setSelectedIds(new Set()); 
      setDeleteConfirmId(null);
    }
  }, [isOpen]);

  // Filter history if a specific scenario filter is passed from the dashboard view
  const filteredHistory = useMemo(() => {
    if (!scenario) return history;
    return history.filter(h => h.scenario === scenario);
  }, [history, scenario]);

  if (!isOpen) return null;

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    onDeleteHistory(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleSingleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteHistory([id]);
    if (activeEntry?.id === id) {
      setView('list');
      setActiveEntry(null);
    }
    setDeleteConfirmId(null);
  };

  const handleOpenDetail = (entry: HistoryEntry) => {
    setActiveEntry(entry);
    setView('detail');
  };

  const renderDetailView = (entry: HistoryEntry) => {
    const results = entry.multiResults || { bfs: entry.simResult, dfs: entry.simResult, hybrid: entry.simResult };
    
    const getData = (algo: 'bfs' | 'dfs' | 'hybrid') => {
      const res = results[algo];
      if (!res) return null;
      const actualHops = Math.max(res.metrics.pathLength, 0);
      const cRate = res.metrics.completionRate !== undefined ? `${res.metrics.completionRate.toFixed(1)}%` : '0%';
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

    const renderCell = (value: string | number, color: string, isFailure: boolean = false) => (
      <td className={`py-3 text-center text-xs font-mono font-bold ${isFailure ? 'text-red-500 bg-red-950/10' : 'text-gray-200'}`} style={!isFailure ? { color } : {}}>
        {isFailure ? 'CRITICAL FAILURE' : value}
      </td>
    );

    return (
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 p-2 h-full overflow-hidden">
        {/* Left Side: Massive Comparison Metrics Dashboard */}
        <div className="xl:col-span-2 flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-2">
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 backdrop-blur-md shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
              <h3 className="font-bold text-white text-xs uppercase tracking-widest text-blue-400">🏆 Execution Benchmarks</h3>
              <span className="text-[10px] font-mono text-gray-500">RUN #{entry.runNumber}</span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Metrics Parameter</th>
                  <th className="py-2 text-center text-xs text-green-400 font-mono font-bold bg-green-500/5 rounded-t">BFS</th>
                  <th className="py-2 text-center text-xs text-purple-400 font-mono font-bold bg-purple-500/5 rounded-t">DFS</th>
                  <th className="py-2 text-center text-xs text-orange-400 font-mono font-bold bg-orange-500/5 rounded-t">HYBRID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                <tr>
                  <td className="py-3 text-xs text-gray-400">Exec Time</td>
                  {renderCell(bfs ? `${bfs.time.toFixed(2)} ms` : 'N/A', '#4ade80', !bfs?.success)}
                  {renderCell(dfs ? `${dfs.time.toFixed(2)} ms` : 'N/A', '#c084fc', !dfs?.success)}
                  {renderCell(hyb ? `${hyb.time.toFixed(2)} ms` : 'N/A', '#fb923c', !hyb?.success)}
                </tr>
                <tr>
                  <td className="py-3 text-xs text-gray-400">Total Hops Length</td>
                  {renderCell(bfs ? `${bfs.hops} nodes` : 'N/A', '#cbd5e1', !bfs?.success)}
                  {renderCell(dfs ? `${dfs.hops} nodes` : 'N/A', '#cbd5e1', !dfs?.success)}
                  {renderCell(hyb ? `${hyb.hops} nodes` : 'N/A', '#cbd5e1', !hyb?.success)}
                </tr>
                <tr>
                  <td className="py-3 text-xs text-gray-400">Nodes Swept/Explored</td>
                  {renderCell(bfs ? bfs.nodes : 'N/A', '#94a3b8', !bfs?.success)}
                  {renderCell(dfs ? dfs.nodes : 'N/A', '#94a3b8', !dfs?.success)}
                  {renderCell(hyb ? hyb.nodes : 'N/A', '#94a3b8', !hyb?.success)}
                </tr>
                <tr>
                  <td className="py-3 text-xs text-gray-400">Memory Allocation</td>
                  {renderCell(bfs ? `${bfs.memory} MB` : 'N/A', '#cbd5e1', !bfs?.success)}
                  {renderCell(dfs ? `${dfs.memory} MB` : 'N/A', '#cbd5e1', !dfs?.success)}
                  {renderCell(hyb ? `${hyb.memory} MB` : 'N/A', '#cbd5e1', !hyb?.success)}
                </tr>
                <tr>
                  <td className="py-3 text-xs text-gray-400">Path Optimality</td>
                  {renderCell(bfs ? `${bfs.optimality}%` : 'N/A', '#4ade80', !bfs?.success)}
                  {renderCell(dfs ? `${dfs.optimality}%` : 'N/A', '#ef4444', !dfs?.success)}
                  {renderCell(hyb ? `${hyb.optimality}%` : 'N/A', '#fb923c', !hyb?.success)}
                </tr>
                <tr>
                  <td className="py-3 text-xs text-gray-400">Dynamic Adaptation</td>
                  {renderCell(bfs ? `${bfs.adaptability}/100` : 'N/A', '#cbd5e1', !bfs?.success)}
                  {renderCell(dfs ? `${dfs.adaptability}/100` : 'N/A', '#cbd5e1', !dfs?.success)}
                  {renderCell(hyb ? `${hyb.adaptability}/100` : 'N/A', '#fb923c', !hyb?.success)}
                </tr>
                <tr className="bg-gray-950/20">
                  <td className="py-3 text-xs text-gray-400 font-semibold">Task Complete Rate</td>
                  {renderCell(bfs ? bfs.completion : 'N/A', '#4ade80', !bfs?.success)}
                  {renderCell(dfs ? dfs.completion : 'N/A', '#c084fc', !dfs?.success)}
                  {renderCell(hyb ? hyb.completion : 'N/A', '#fb923c', !hyb?.success)}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 text-xs text-gray-400 space-y-2">
            <span className="font-bold text-gray-300 block uppercase text-[10px] tracking-wider text-orange-400">📌 Structural Metadata Summary</span>
            <p>This entry documents an evaluated graph grid composed of <strong className="text-white">{entry.totalNodes} total nodes</strong> running across real-world topology presets. The baseline optimal path calculation requires a theoretical minimum index of <strong className="text-white">{entry.optimalPathLength} hops</strong>.</p>
          </div>
        </div>

        {/* Right Side: High-performance Network Canvas Topology Visualizer */}
        <div className="xl:col-span-3 h-[450px] xl:h-full min-h-[400px] w-full bg-[#0a0f1e] rounded-xl border border-gray-800 overflow-hidden shadow-inner relative">
          {results.hybrid && (
            <NetworkCanvas 
              graph={results.hybrid.graph} 
              activeSteps={{
                bfs: null, 
                dfs: null, 
                hybrid: results.hybrid.steps[results.hybrid.steps.length - 1] || null
              }} 
              scenario={entry.scenario} 
              stepIndex={results.hybrid.steps.length} 
              dynamicEvents={results.hybrid.dynamicEvents || []} 
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-[#060b16] border border-gray-800 rounded-2xl w-full max-w-[1300px] h-[90vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* Header Section */}
        <header className="p-5 border-b border-gray-800 bg-[#0a0f1e]/60 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {view === 'list' ? '🗄️ Core Simulation Storage History' : `🔍 Performance Inspect: ${activeEntry?.name}`}
            </h2>
            {view === 'list' && (
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full font-mono">
                {filteredHistory.length} total entries
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-900 border border-gray-800 hover:border-gray-700 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all">✕</button>
        </header>

        {/* Dynamic Action Toolbar for Selection Management */}
        {view === 'list' && selectedIds.size > 0 && (
          <div className="bg-red-950/20 border-b border-red-900/40 px-6 py-3 flex justify-between items-center animate-fadeIn">
            <div className="flex items-center gap-2 text-xs text-red-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Flagged <strong className="font-mono bg-red-950 px-1.5 py-0.5 border border-red-800/40 rounded">{selectedIds.size}</strong> records for truncation.
            </div>
            <button 
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Purge Target Records
            </button>
          </div>
        )}

        {/* Primary Content Window */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#060b16]">
          {view === 'list' ? (
            filteredHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <span className="text-4xl mb-2">📁</span>
                <h4 className="text-gray-300 font-bold text-sm">No History Indexes Logged</h4>
                <p className="text-gray-500 text-xs mt-1 max-w-xs">Run algorithmic simulation cycles from your network control matrix dashboard to save benchmark logs here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHistory.map(entry => {
                  const isSelected = selectedIds.has(entry.id);
                  const formattedDate = typeof entry.timestamp === 'string' 
                    ? new Date(entry.timestamp).toLocaleString() 
                    : entry.timestamp.toLocaleString();

                  return (
                    <div 
                      key={entry.id} 
                      onClick={() => handleOpenDetail(entry)} 
                      className={`group p-4 bg-gray-900/40 hover:bg-gray-900/80 border rounded-xl cursor-pointer transition-all relative flex flex-col justify-between h-36 shadow-lg ${
                        isSelected ? 'border-red-500/50 bg-red-950/5' : 'border-gray-800/80 hover:border-gray-700'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <h3 className="font-bold text-white text-sm tracking-tight truncate max-w-[75%] group-hover:text-blue-400 transition-colors">
                            {entry.name}
                          </h3>
                          <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${SCENARIO_BADGES[entry.scenario] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                            {entry.scenario}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-gray-500">{formattedDate}</p>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-gray-800/50 mt-auto">
                        <div className="flex items-center gap-3">
                          {/* Selection Checkbox Ring */}
                          <div 
                            onClick={(e) => toggleSelection(entry.id, e)}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              isSelected ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-gray-700 group-hover:border-gray-500'
                            }`}
                          >
                            {isSelected && <span className="text-[9px]">✓</span>}
                          </div>
                          <span className="text-[11px] font-mono text-gray-400">
                            Nodes: <strong className="text-gray-200">{entry.totalNodes || entry.simResult?.graph?.nodes?.length || 0}</strong>
                          </span>
                        </div>

                        {/* Inline Delete Button Wrapper */}
                        {deleteConfirmId === entry.id ? (
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={(e) => handleSingleDelete(entry.id, e)} 
                              className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold tracking-wide"
                            >
                              Confirm
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }} 
                              className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(entry.id); }}
                            className="text-gray-500 hover:text-red-400 opacity-60 group-hover:opacity-100 p-1 text-xs rounded transition-all"
                            title="Delete this record"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            activeEntry && renderDetailView(activeEntry)
          )}
        </div>

        {/* Global Footer Controls */}
        <footer className="p-4 border-t border-gray-800 bg-[#0a0f1e]/40 flex justify-between items-center">
          <div>
            {view === 'detail' && (
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                Viewing Execution Pipeline: <strong className="text-gray-300 font-bold font-sans">{activeEntry?.name}</strong>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {view === 'detail' && (
              <button 
                onClick={() => { setView('list'); setDeleteConfirmId(null); }} 
                className="px-4 py-2 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
              >
                ← Return to Index
              </button>
            )}
            <button 
              onClick={onClose} 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
            >
              Close History Panel
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};