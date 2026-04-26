import React, { useState, useEffect, useRef } from 'react';
import { ScenarioType, AlgorithmType, SimulationResult, ScenarioGraph } from '../types';
import { runSimulation } from '../utils/simulationRunner';
import { getAlgorithm } from '../config/scenarios';
import { getCompletionRate, getPathOptimality, getMemoryInMB, getAdaptabilityScore } from './MetricsPanel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  scenario: ScenarioType;
  useRealWorld: boolean;
  seed: number;
  currentGraph: ScenarioGraph;
  optimalPathLength?: number;
}

interface ComparisonEntry {
  id: string;
  name: string;
  results: Record<string, SimulationResult>;
  optimalPathLength?: number;
  totalNodes: number;
  date: Date;
}

export const ComparisonModal: React.FC<Props> = ({
  isOpen, onClose, scenario, useRealWorld, seed, currentGraph, optimalPathLength
}) => {
  const [results, setResults] = useState<Record<string, SimulationResult>>({});
  const [isComputing, setIsComputing] = useState(false);

  const [compHistory, setCompHistory] = useState<ComparisonEntry[]>([]);
  const [view, setView] = useState<'current' | 'historyList' | 'historyDetail'>('current');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // ✅ CUSTOM MODAL STATES (Replaces window.prompt and window.confirm)
  const [saveDialog, setSaveDialog] = useState<{isOpen: boolean, name: string}>({ isOpen: false, name: '' });
  const [deleteDialog, setDeleteDialog] = useState<{isOpen: boolean, targetId: string | null}>({ isOpen: false, targetId: null });

  const algos: AlgorithmType[] = ['bfs', 'dfs', 'hybrid'];

  useEffect(() => {
    const storageKey = `algo_comparison_history_${scenario}`;
    const storedData = localStorage.getItem(storageKey);
    
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        const hydratedData = parsed.map((item: any) => ({
          ...item,
          date: new Date(item.date)
        }));
        setCompHistory(hydratedData);
      } catch (error) {
        console.error(`Failed to parse comparison history for ${scenario}`, error);
      }
    } else {
      setCompHistory([]);
    }
  }, [scenario, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    
    setView('current');
    setIsSaved(false);

    const fetchResults = async () => {
      setIsComputing(true);
      const newResults: Record<string, SimulationResult> = {};

      for (const algo of algos) {
        const res = await runSimulation(scenario, algo, seed, useRealWorld, () => {});
        if (!isMounted) return;
        newResults[algo] = res;
      }

      setResults(newResults);
      setIsComputing(false);
    };

    fetchResults();
    return () => { isMounted = false; };
  }, [isOpen, scenario, useRealWorld, seed]);

  if (!isOpen) return null;

  const getWinner = (displayResults: Record<string, SimulationResult>): AlgorithmType | null => {
    const successes = algos.filter(a => displayResults[a]?.metrics.exitFound);
    if (successes.length === 0) return null;
    if (successes.length === 1) return successes[0];

    const bfs = displayResults['bfs'];
    const hybrid = displayResults['hybrid'];
    
    if (successes.includes('hybrid') && successes.includes('bfs') && hybrid.metrics.nodesExplored < bfs.metrics.nodesExplored) {
      return 'hybrid';
    } else if (successes.includes('bfs')) {
      return 'bfs';
    } else if (successes.includes('dfs')) {
      return 'dfs';
    }
    return null;
  };

  const renderAnalysisBlock = (displayResults: Record<string, SimulationResult>) => {
    if (Object.keys(displayResults).length < 3) return null;

    const winner = getWinner(displayResults);
    const successes = algos.filter(a => displayResults[a].metrics.exitFound);
    let explanation = "";

    if (successes.length === 0) {
      explanation = "None of the algorithms successfully navigated the map. The dynamic disruptions created an impassable blockade, severing all valid routes to the destination.";
    } else if (successes.length === 1) {
      explanation = `It was the only algorithm capable of adapting to the dynamic disruptions and successfully reaching the destination. The others were entirely trapped by dead ends or road closures.`;
    } else {
      const bfs = displayResults['bfs'];
      const dfs = displayResults['dfs'];
      const hybrid = displayResults['hybrid'];
      
      if (winner === 'hybrid') {
        explanation = `Hybrid BFS-DFS provided the best overall balance of performance. It successfully reached the destination in ${hybrid.metrics.pathLength} hops while exploring only ${hybrid.metrics.nodesExplored} nodes. In contrast, standard BFS explored ${bfs.metrics.nodesExplored} nodes, resulting in significantly higher memory consumption (${getMemoryInMB(bfs.metrics.memoryUsed)} vs ${getMemoryInMB(hybrid.metrics.memoryUsed)}). The Hybrid approach effectively mitigated the memory bloat of BFS while avoiding the dead-end traps of pure DFS.`;
      } else if (winner === 'bfs') {
        explanation = `Standard BFS is the recommended choice for this specific map configuration. It guaranteed the absolute shortest topological route (${bfs.metrics.pathLength} hops). While it consumed ${getMemoryInMB(bfs.metrics.memoryUsed)} of memory by evaluating ${bfs.metrics.nodesExplored} nodes, its perfect path optimality outweighed the performance of the other algorithms in this specific trial.`;
      } else if (winner === 'dfs') {
        explanation = `Standard DFS managed to find the destination efficiently by rapidly diving through available corridors, though its path optimality (${dfs.metrics.pathLength} hops) is highly dependent on topological luck rather than strategic routing.`;
      }
    }

    const winnerCfg = winner ? getAlgorithm(winner) : { name: "No Viable Algorithm", color: "#ef4444" };

    return (
      <div className="mt-6 bg-gray-900/80 border rounded-xl p-6 shadow-inner relative overflow-hidden shrink-0" style={{ borderColor: winnerCfg.color + '60' }}>
        <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: winnerCfg.color }}></div>
        <h3 className="text-lg font-bold flex items-center gap-2 mb-3" style={{ color: winnerCfg.color }}>
          <span>🏆</span> Analytical Conclusion: {winnerCfg.name}
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed pl-2 border-l-2 border-gray-700">
          <strong className="text-white">System Recommendation:</strong> {explanation}
        </p>
      </div>
    );
  };

  const renderCards = (displayResults: Record<string, SimulationResult>, optPathLen?: number, totNodes: number = 0) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 shrink-0">
      {algos.map(algo => {
        const res = displayResults[algo];
        const cfg = getAlgorithm(algo);
        if (!res) return null;

        const isSuccess = res.metrics.exitFound;
        const actualHops = Math.max(res.metrics.pathLength, 1);
        const completion = getCompletionRate(res.metrics.nodesExplored, totNodes);
        const optimality = getPathOptimality(actualHops, optPathLen);
        const memory = getMemoryInMB(res.metrics.memoryUsed);
        const adaptability = getAdaptabilityScore('done', res.metrics, algo, res.dynamicEvents);

        return (
          <div key={algo} className="bg-gray-800/50 border rounded-xl overflow-hidden relative shadow-sm" style={{ borderColor: cfg.color + '40' }}>
            <div className="h-1.5 w-full" style={{ backgroundColor: cfg.color }}></div>
            <div className="p-5">
              <h3 className="text-lg font-bold mb-4 text-center" style={{ color: cfg.color }}>{cfg.name}</h3>
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

  // ✅ TRIGGERS CUSTOM DELETE MODAL
  const handleDeleteComparison = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteDialog({ isOpen: true, targetId: id });
  };

  // ✅ EXECUTES DELETE
  const executeDelete = () => {
    if (deleteDialog.targetId) {
      setCompHistory(prev => {
        const updated = prev.filter(c => c.id !== deleteDialog.targetId);
        localStorage.setItem(`algo_comparison_history_${scenario}`, JSON.stringify(updated));
        return updated;
      });
      if (selectedEntryId === deleteDialog.targetId) {
        setView('historyList');
        setSelectedEntryId(null);
      }
      setIsSaved(false); 
    }
    setDeleteDialog({ isOpen: false, targetId: null });
  };

  const renderHistoryList = () => {
    if (compHistory.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-32 text-gray-500 h-full">
          <span className="text-4xl mb-4 opacity-50">🗄️</span>
          <p className="italic">No comparison results saved yet.</p>
          <p className="text-sm mt-2">Run a comparison and click "Save Comparison Results" to store it here.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
        {compHistory.map(entry => {
          const winnerAlgo = getWinner(entry.results);
          const winnerCfg = winnerAlgo ? getAlgorithm(winnerAlgo) : { name: "No Winner", color: "#ef4444" };

          return (
            <div 
              key={entry.id} 
              onClick={() => { setSelectedEntryId(entry.id); setView('historyDetail'); }}
              className="bg-gray-800/40 border border-gray-700/60 rounded-xl p-5 hover:border-gray-500 hover:bg-gray-800/80 transition-all cursor-pointer shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: winnerCfg.color }}></div>
              
              <button 
                onClick={(e) => handleDeleteComparison(entry.id, e)}
                className="absolute top-3 right-3 text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                title="Delete Comparison"
              >
                🗑️
              </button>

              <h3 className="text-white font-bold text-lg mb-1 ml-2 pr-6">{entry.name}</h3>
              <p className="text-xs text-gray-500 mb-5 ml-2 font-medium">{entry.date.toLocaleString()}</p>
              
              <div className="ml-2">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1 block">🏆 Suggested</span>
                <div className="text-xs px-3 py-1.5 rounded inline-block font-bold shadow-inner" style={{ backgroundColor: winnerCfg.color + '22', color: winnerCfg.color, border: `1px solid ${winnerCfg.color}40` }}>
                  {winnerCfg.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ✅ TRIGGERS CUSTOM SAVE MODAL
  const handleSaveClick = () => {
    if (isComputing || Object.keys(results).length === 0) return;
    
    const maxNum = compHistory.reduce((max, c) => {
      const match = c.name.match(/#(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);

    const defaultName = `Comparison Benchmark #${maxNum + 1}`;
    setSaveDialog({ isOpen: true, name: defaultName });
  };

  // ✅ EXECUTES SAVE
  const executeSave = () => {
    const maxNum = compHistory.reduce((max, c) => {
      const match = c.name.match(/#(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);

    const finalName = saveDialog.name.trim() === '' ? `Comparison Benchmark #${maxNum + 1}` : saveDialog.name;
    
    const compressedResults: Record<string, SimulationResult> = {};
    for (const algo of algos) {
      if (results[algo]) {
        compressedResults[algo] = {
          ...results[algo],
          steps: results[algo].steps.length > 0 ? [results[algo].steps[results[algo].steps.length - 1]] : []
        };
      }
    }

    const newEntry: ComparisonEntry = {
      id: Date.now().toString(),
      name: finalName,
      results: compressedResults,
      optimalPathLength: optimalPathLength,
      totalNodes: currentGraph.nodes.length,
      date: new Date()
    };
    
    setCompHistory(prev => {
      const updatedHistory = [newEntry, ...prev];
      try {
        localStorage.setItem(`algo_comparison_history_${scenario}`, JSON.stringify(updatedHistory));
      } catch (err) {
        console.error("Storage Full:", err);
        alert("Browser storage limit reached! Cannot save more history.");
      }
      return updatedHistory;
    });
    
    setIsSaved(true);
    setSaveDialog({ isOpen: false, name: '' });
  };

  const activeHistoryEntry = compHistory.find(h => h.id === selectedEntryId);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8 transition-opacity">
        <div className="bg-[#0a0f1e] border border-gray-700 rounded-2xl w-full max-w-6xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden max-h-[90vh]">
          
          <header className="bg-gray-900 border-b border-gray-700 p-4 sm:p-6 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {view === 'current' && '📊 Algorithm Performance Comparison'}
                {view === 'historyList' && '🗄️ Saved Comparison History'}
                {view === 'historyDetail' && `🔍 Viewing: ${activeHistoryEntry?.name}`}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {view === 'current' && 'Executing all three algorithms under identical topological conditions.'}
                {view === 'historyList' && 'Review previously saved benchmarks and automated conclusions.'}
                {view === 'historyDetail' && `Saved on ${activeHistoryEntry?.date?.toLocaleString()}`}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {view === 'current' ? (
                <button 
                  onClick={() => setView('historyList')}
                  className="px-5 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-full text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  🗄️ Comparison History 
                  <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{compHistory.length}</span>
                </button>
              ) : (
                <button 
                  onClick={() => setView('current')}
                  className="px-5 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-full text-xs font-bold text-gray-300 transition-all cursor-pointer"
                >
                  ← Back to Live Simulation
                </button>
              )}

              <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 font-bold transition-colors shrink-0 cursor-pointer">
                ✕
              </button>
            </div>
          </header>

          <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}>
            
            {view === 'current' && isComputing && (
              <div className="flex flex-col items-center justify-center py-32 text-gray-400 animate-pulse h-full">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-lg font-bold tracking-widest">COMPUTING BENCHMARKS...</div>
              </div>
            )}

            {view === 'current' && !isComputing && (
              <>
                {renderCards(results, optimalPathLength, currentGraph.nodes.length)}
                {renderAnalysisBlock(results)}
              </>
            )}

            {view === 'historyList' && renderHistoryList()}

            {view === 'historyDetail' && activeHistoryEntry && (
              <>
                {renderCards(activeHistoryEntry.results, activeHistoryEntry.optimalPathLength, activeHistoryEntry.totalNodes)}
                {renderAnalysisBlock(activeHistoryEntry.results)}
              </>
            )}

          </div>

          {(view === 'current' || view === 'historyDetail') && (
            <footer className="bg-gray-900 border-t border-gray-700 p-4 sm:p-5 flex justify-between items-center shrink-0 w-full">
              {view === 'historyDetail' ? (
                <>
                  <div>
                    <button 
                      onClick={() => handleDeleteComparison(activeHistoryEntry!.id)}
                      className="px-4 py-2.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer border border-transparent hover:border-red-500/30"
                    >
                      🗑️ Delete Comparison
                    </button>
                  </div>
                  <button 
                    onClick={() => setView('historyList')}
                    className="px-6 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm transition-all cursor-pointer border border-gray-600"
                  >
                    ← Back to History List
                  </button>
                </>
              ) : (
                <>
                  <div />
                  <button 
                    onClick={handleSaveClick}
                    disabled={isSaved || isComputing}
                    className={`px-8 py-2.5 rounded-lg font-bold text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] ${
                      isSaved 
                        ? 'bg-green-600/20 border border-green-500/50 text-green-400 cursor-default shadow-none' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {isSaved ? '✅ Comparison Saved' : '💾 Save Comparison Results'}
                  </button>
                </>
              )}
            </footer>
          )}

        </div>
      </div>

      {/* ✅ CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteDialog.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4 border border-red-500/30 text-red-400 text-xl">
                ⚠️
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Confirm Deletion</h3>
              <p className="text-sm text-gray-400">
                Are you sure you want to delete this saved comparison? This action cannot be undone.
              </p>
            </div>
            <div className="bg-gray-950 border-t border-gray-800 p-4 flex justify-end gap-3">
              <button 
                onClick={() => setDeleteDialog({ isOpen: false, targetId: null })} 
                className="px-5 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete} 
                className="px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ CUSTOM SAVE/NAMING MODAL */}
      {saveDialog.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-2">💾 Save Result to History</h3>
              <p className="text-sm text-gray-400 mb-5">Enter a custom name for this comparison benchmark to easily identify it later.</p>
              
              <input 
                type="text" 
                value={saveDialog.name}
                onChange={(e) => setSaveDialog(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && executeSave()}
              />
            </div>
            
            <div className="bg-gray-950 border-t border-gray-800 p-4 flex justify-end gap-3">
              <button 
                onClick={() => setSaveDialog({ isOpen: false, name: '' })}
                className="px-5 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={executeSave}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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