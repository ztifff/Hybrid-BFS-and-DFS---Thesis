import React, { useState, useRef, useEffect } from 'react';
import { AlgorithmType, SimulationResult, ScenarioType } from '../types';
import { getAlgorithm } from '../config/scenarios';
import { getCompletionRate, getPathOptimality, getMemoryInMB, getAdaptabilityScore } from './MetricsPanel';
import { NetworkCanvas } from './NetworkCanvas'; 

export interface HistoryEntry {
  id: string;
  runNumber: number;
  name: string; 
  algorithm: AlgorithmType;
  scenario: ScenarioType; 
  simResult: SimulationResult;
  optimalPathLength: number;
  totalNodes: number;
  timestamp: Date;
}

// ✅ NEW: Interface to store saved manual comparisons
interface SavedComparison {
  id: string;
  name: string;
  entries: HistoryEntry[];
  date: Date;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
}

export const HistoryModal: React.FC<Props> = ({ isOpen, onClose, history }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // ✅ NEW: Advanced View State to handle Custom Comparison History
  const [view, setView] = useState<'list' | 'compare' | 'savedCompList' | 'savedCompDetail'>('list');
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([]);
  const [activeCompId, setActiveCompId] = useState<string | null>(null);
  const [isCompSaved, setIsCompSaved] = useState(false);
  const savedCompCounter = useRef(0);

  // ✅ NEW: State for the custom inline naming prompt
  const [isNamingComp, setIsNamingComp] = useState(false);
  const [newCompName, setNewCompName] = useState('');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Reset save/naming state when selection changes
  useEffect(() => {
    setIsCompSaved(false);
    setIsNamingComp(false);
  }, [selectedIds]);

  if (!isOpen) return null;

  const algos: AlgorithmType[] = ['bfs', 'dfs', 'hybrid'];
  const maxRows = Math.max(...algos.map(algo => history.filter(h => h.algorithm === algo).length));

  const toggleSelection = (entry: HistoryEntry) => {
    const next = new Set(selectedIds);
    if (next.has(entry.id)) {
      next.delete(entry.id);
    } else {
      const existingAlgoId = Array.from(next).find(id => history.find(h => h.id === id)?.algorithm === entry.algorithm);
      if (existingAlgoId) {
        next.delete(existingAlgoId);
      }
      next.add(entry.id);
    }
    setSelectedIds(next);
  };

  const handleSelectRow = (rowIndex: number) => {
    const newSelection = new Set<string>();
    algos.forEach(algo => {
      const algoHistory = history.filter(h => h.algorithm === algo);
      if (algoHistory[rowIndex]) {
        newSelection.add(algoHistory[rowIndex].id);
      }
    });
    setSelectedIds(newSelection);
    setIsDropdownOpen(false); 
  };

  const handleUnselectAll = () => {
    setSelectedIds(new Set());
  };

  // ✅ SAVE HANDLER - Phase 1: Trigger the inline naming UI
  const handleSaveComparison = () => {
    const selectedEntries = history.filter(h => selectedIds.has(h.id));
    if (selectedEntries.length < 2) return;

    setNewCompName(`Custom Comparison #${savedCompCounter.current + 1}`);
    setIsNamingComp(true);
  };

  // ✅ SAVE HANDLER - Phase 2: Finalize the save with the custom name
  const confirmSaveComparison = () => {
    const selectedEntries = history.filter(h => selectedIds.has(h.id));
    if (selectedEntries.length < 2) return;

    savedCompCounter.current += 1;
    const newSaved: SavedComparison = {
      id: Date.now().toString(),
      name: newCompName.trim() === '' ? `Custom Comparison #${savedCompCounter.current}` : newCompName,
      entries: selectedEntries,
      date: new Date()
    };

    setSavedComparisons(prev => [newSaved, ...prev]);
    setIsCompSaved(true);
    setIsNamingComp(false);
  };

  const cancelSaveComparison = () => {
    setIsNamingComp(false);
  };

  const renderList = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {algos.map((algo) => {
        const cfg = getAlgorithm(algo);
        const algoHistory = history.filter(h => h.algorithm === algo);

        return (
          <div key={algo} className="flex flex-col border-r border-gray-800/60 last:border-0 pr-0 md:pr-6 last:pr-0">
            <h3 className="text-lg font-bold mb-4 text-center pb-3 border-b border-gray-800" style={{ color: cfg.color }}>
              {cfg.name}
            </h3>
            <div className="flex flex-col gap-3">
              {algoHistory.length === 0 ? (
                <div className="text-gray-600 text-center text-sm italic py-4 bg-gray-900/30 rounded-xl border border-gray-800/50">
                  No results yet
                </div>
              ) : (
                algoHistory.map(entry => {
                  const isSelected = selectedIds.has(entry.id);
                  const isDisabled = !isSelected && Array.from(selectedIds).some(id => history.find(h => h.id === id)?.algorithm === entry.algorithm);

                  return (
                    <button 
                      key={entry.id}
                      disabled={isDisabled}
                      onClick={() => toggleSelection(entry)}
                      className={`relative w-full text-left p-4 rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                        isSelected 
                          ? 'shadow-lg outline-none' 
                          : isDisabled 
                            ? 'border-gray-800/50 bg-gray-900/20 opacity-40 cursor-not-allowed' 
                            : 'border-gray-700/60 bg-gray-900/60 hover:border-gray-500 hover:bg-gray-800 cursor-pointer'
                      }`}
                      style={isSelected ? {
                        borderColor: cfg.color,
                        backgroundColor: `${cfg.color}15`, 
                        boxShadow: `0 0 20px ${cfg.color}22`
                      } : {}}
                    >
                      {isSelected && (
                        <div 
                          className="absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl pointer-events-none transition-opacity" 
                          style={{ backgroundColor: cfg.color, opacity: 0.25 }} 
                        />
                      )}

                      <div className="flex justify-between items-center relative z-10">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-bold text-white text-[15px] leading-tight">
                            {entry.name}
                          </span>
                          <span className="text-xs text-gray-400 font-medium flex items-center gap-2">
                            <span>📍 {entry.simResult.metrics.pathLength} hops</span>
                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span>⏱️ {entry.simResult.metrics.timeElapsed.toFixed(1)} ms</span>
                          </span>
                        </div>

                        <div 
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 ${
                            isSelected ? 'scale-100' : 'border-gray-600 scale-95 opacity-40'
                          }`}
                          style={isSelected ? { borderColor: cfg.color, backgroundColor: cfg.color } : {}}
                        >
                          {isSelected && (
                            <svg className="w-4 h-4 text-gray-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderSingleResult = (entry: HistoryEntry) => {
    const cfg = getAlgorithm(entry.algorithm);
    const res = entry.simResult;
    const isSuccess = res.metrics.exitFound;
    const actualHops = Math.max(res.metrics.pathLength, 1);
    
    const completion = getCompletionRate(res.metrics.nodesExplored, entry.totalNodes);
    const optimality = getPathOptimality(actualHops, entry.optimalPathLength);
    const memory = getMemoryInMB(res.metrics.memoryUsed);
    const adaptability = getAdaptabilityScore('done', res.metrics, entry.algorithm, res.dynamicEvents);

    const lastStep = res.steps[res.steps.length - 1];
    const exploredSet = new Set(lastStep?.explored || []);
    const frontierSet = new Set(lastStep?.frontier || []);
    const pathSet = new Set(lastStep?.path || []);
    const currentNode = lastStep?.current || null;

    const renderAnalysis = () => {
      if (!isSuccess) {
        return (
          <p><strong className="text-red-400">Simulation Failure:</strong> The algorithm failed to reach the destination. The dynamic events completely severed all viable topological paths, trapping the traversal in a dead end after searching {res.metrics.nodesExplored} nodes.</p>
        );
      }

      if (entry.algorithm === 'bfs') {
        return (
          <>
            <p><strong className="text-gray-300">Nodes & Memory:</strong> BFS evaluated <span className="text-white font-bold">{res.metrics.nodesExplored} nodes</span> and consumed <span className="text-white font-bold">{memory}</span>. This high overhead occurs because BFS explores radially, storing the entire perimeter in memory level-by-level before advancing.</p>
            <p><strong className="text-gray-300">Path Optimality:</strong> By evaluating all possible routes equally, BFS mathematically guarantees the shortest path. It successfully found the optimal <span className="text-white font-bold">{actualHops}-hop</span> route.</p>
            <p><strong className="text-gray-300">Adaptability:</strong> BFS inherently resists dynamic disruptions. When a path is blocked, its radial expansion simply continues along alternative routes, reflecting its score of <span className="text-white font-bold">{adaptability.score}/100</span>.</p>
          </>
        );
      } else if (entry.algorithm === 'dfs') {
        return (
          <>
            <p><strong className="text-gray-300">Nodes & Memory:</strong> DFS plunged deeply into singular paths, requiring only <span className="text-white font-bold">{memory}</span>. Its memory footprint remains remarkably low because it only stores the current traversal branch rather than the entire graph perimeter.</p>
            <p><strong className="text-gray-300">Path Optimality:</strong> DFS yielded a <span className="text-white font-bold">{actualHops}-hop</span> route compared to the optimal {entry.optimalPathLength}-hop path (<span style={{color: optimality.color}}>{optimality.label}</span>). This happens because DFS accepts the *first* valid path it discovers, completely ignoring potentially shorter alternatives.</p>
            <p><strong className="text-gray-300">Adaptability:</strong> DFS often struggles with dynamic closures. If a path is blocked deep in a corridor, it wastes execution time backtracking out of the dead end, heavily impacting efficiency.</p>
          </>
        );
      } else {
        return (
          <>
            <p><strong className="text-gray-300">Execution & Memory:</strong> The Hybrid algorithm balanced the load, visiting <span className="text-white font-bold">{res.metrics.nodesExplored} nodes</span> and consuming <span className="text-white font-bold">{memory}</span>. By utilizing BFS for macro-routing between major hubs and DFS for rapid local exploration, it dramatically cut down the memory bloat of pure BFS.</p>
            <p><strong className="text-gray-300">Path Optimality:</strong> It achieved a highly efficient <span className="text-white font-bold">{actualHops}-hop</span> route (<span style={{color: optimality.color}}>{optimality.label}</span>). It maintained topological awareness of the shortest global path while resolving local corridors instantly.</p>
            <p><strong className="text-gray-300">Adaptability:</strong> The Hybrid approach exhibited superior adaptability (<span className="text-white font-bold">{adaptability.score}/100</span>). It quickly pivoted at major intersections when dynamic events occurred, avoiding the deep entrapment of DFS and the memory overload of BFS.</p>
          </>
        );
      }
    };

    return (
      <div className="flex flex-col lg:flex-row gap-5 items-start h-full">
        <div 
          className="w-full lg:flex-1 bg-[#0a0f1e] border rounded-2xl overflow-hidden relative shadow-lg h-[350px] lg:h-[480px]"
          style={{ borderColor: cfg.color + '40', boxShadow: `0 0 40px ${cfg.color}15` }}
        >
          <div className="absolute top-4 left-4 z-10 bg-gray-900/90 border border-gray-700 px-4 py-2 rounded-lg shadow-xl backdrop-blur">
            <h3 className="font-bold text-sm" style={{ color: cfg.color }}>{cfg.name}</h3>
            <p className="text-xs text-gray-400">Final Navigation Map State</p>
          </div>
          <NetworkCanvas
            graph={res.graph}
            explored={exploredSet}
            frontier={frontierSet}
            path={pathSet}
            current={currentNode}
            algorithm={entry.algorithm}
            scenario={entry.scenario || 'traffic'}
            blockedNodes={new Set()}
            stepIndex={res.steps.length}
            dynamicEvents={res.dynamicEvents}
            phaseLabel="Simulation Complete"
          />
        </div>

        <div 
          className="w-full lg:w-[400px] flex flex-col gap-4 h-auto lg:h-[480px] overflow-y-auto pr-2 shrink-0" 
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}
        >
          <div className="bg-gray-800/50 border rounded-xl overflow-hidden relative shrink-0" style={{ borderColor: cfg.color + '40' }}>
            <div className="h-1.5 w-full" style={{ backgroundColor: cfg.color }}></div>
            <div className="p-4">
              <h3 className="text-lg font-bold mb-1 text-center" style={{ color: cfg.color }}>{cfg.name}</h3>
              <div className="text-center text-xs text-gray-400 mb-3 pb-2 border-b border-gray-700">{entry.name}</div>
              
              <div className="space-y-3">
                <CompareRow label="Status" value={isSuccess ? '✅ Success' : '❌ Failed'} valColor={isSuccess ? '#4ade80' : '#f87171'} />
                <CompareRow label="Execution Time" value={`${res.metrics.timeElapsed.toFixed(3)} ms`} />
                <CompareRow label="Nodes Visited" value={`${res.metrics.nodesExplored.toLocaleString()} nodes`} subValue={completion.label} />
                <CompareRow label="Path Optimality" value={optimality.label} valColor={optimality.color} subValue={`${actualHops} hops`} />
                <CompareRow label="Memory Consumed" value={memory} />
                <CompareRow label="Adaptability Score" value={`${adaptability.score} / 100`} valColor={adaptability.color} subValue={adaptability.label} />
              </div>
            </div>
          </div>

          <div className="bg-gray-900/80 border border-gray-700/60 rounded-xl p-4 space-y-3 shrink-0 shadow-inner">
            <h4 className="text-white font-bold text-sm border-b border-gray-700 pb-2 flex items-center gap-2">
              🧠 Algorithmic Analysis
            </h4>
            <div className="space-y-2.5 text-[11px] text-gray-400 leading-normal">
              {renderAnalysis()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCompareAnalysis = (entries: HistoryEntry[]) => {
    if (entries.length < 2) return null;

    const successes = entries.filter(e => e.simResult.metrics.exitFound);
    let winner: HistoryEntry | null = null;
    let explanation = "";

    if (successes.length === 0) {
      explanation = "None of the selected algorithms successfully navigated the map. The dynamic disruptions created an impassable blockade, trapping all routes.";
    } else if (successes.length === 1) {
      winner = successes[0];
      explanation = `It was the only algorithm capable of adapting to the dynamic disruptions and successfully reaching the destination. The others were entirely trapped by dead ends or road closures.`;
    } else {
      const sortedSuccesses = [...successes].sort((a, b) => {
        if (a.simResult.metrics.pathLength !== b.simResult.metrics.pathLength) {
          return a.simResult.metrics.pathLength - b.simResult.metrics.pathLength; 
        }
        return a.simResult.metrics.nodesExplored - b.simResult.metrics.nodesExplored; 
      });

      winner = sortedSuccesses[0];
      const winnerMetrics = winner.simResult.metrics;
      const winnerAlgo = winner.algorithm;

      if (winnerAlgo === 'hybrid') {
        explanation = `Hybrid BFS-DFS provided the best overall comparative performance. It successfully reached the destination in ${winnerMetrics.pathLength} hops while exploring only ${winnerMetrics.nodesExplored} nodes. It effectively balanced the path optimality of BFS with the memory efficiency of DFS, mitigating memory bloat while avoiding dead-end traps.`;
      } else if (winnerAlgo === 'bfs') {
        explanation = `Standard BFS achieved the highest performance in this comparison by guaranteeing the absolute shortest topological route (${winnerMetrics.pathLength} hops). While it evaluated ${winnerMetrics.nodesExplored} nodes, its perfect path optimality outweighed the memory efficiency of the other algorithms.`;
      } else if (winnerAlgo === 'dfs') {
        explanation = `Standard DFS won this comparison due to exceptional memory efficiency. It managed to find the destination rapidly by diving through available corridors, requiring only ${winnerMetrics.nodesExplored} nodes to be evaluated.`;
      }
    }

    const winnerCfg = winner ? getAlgorithm(winner.algorithm) : { name: "No Viable Algorithm", color: "#ef4444" };

    return (
      <div className="mt-4 bg-gray-900/80 border rounded-xl p-5 shadow-inner relative overflow-hidden shrink-0" style={{ borderColor: winnerCfg.color + '60' }}>
        <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: winnerCfg.color }}></div>
        <h3 className="text-lg font-bold flex items-center gap-2 mb-2" style={{ color: winnerCfg.color }}>
          <span>🏆</span> Comparative Analysis: {winnerCfg.name} Wins
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed pl-2 border-l-2 border-gray-700">
          <strong className="text-white">Explanation:</strong> {explanation}
        </p>
      </div>
    );
  };

  // ✅ UNIFIED RENDER LOGIC FOR GRIDS
  const renderCompareContent = (entriesToRender: HistoryEntry[]) => {
    const sortedEntries = [...entriesToRender].sort((a, b) => algos.indexOf(a.algorithm) - algos.indexOf(b.algorithm));

    if (sortedEntries.length === 1) {
      return renderSingleResult(sortedEntries[0]);
    }

    return (
      <div className="flex flex-col gap-2">
        <div className={`grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3`}>
          {sortedEntries.map(entry => {
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
                <div className="p-4">
                  <h3 className="text-lg font-bold mb-1 text-center" style={{ color: cfg.color }}>
                    {cfg.name}
                  </h3>
                  <div className="text-center text-xs text-gray-400 mb-4 pb-2 border-b border-gray-700">{entry.name}</div>
                  
                  <div className="space-y-3">
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
        
        {/* ✅ DYNAMIC SAVING & ANALYSIS BLOCK */}
        {isNamingComp ? (
          // Custom Inline Naming Prompt
          <div className="bg-gray-900 border border-gray-700/60 rounded-xl p-5 shrink-0 shadow-inner mt-4">
            <h4 className="text-white font-bold text-sm border-b border-gray-700 pb-2 flex items-center gap-2 mb-4">
              💾 Save Custom Comparison
            </h4>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              Provide a name to identify this comparison in your history log (must be unique).
            </p>
            <div className="flex gap-2">
              <input 
                type="text"
                value={newCompName}
                onChange={(e) => setNewCompName(e.target.value)}
                placeholder={`e.g., Benchmark #${savedCompCounter.current + 1}`}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
              <button 
                onClick={cancelSaveComparison}
                className="px-4 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSaveComparison}
                disabled={newCompName.trim() === ''}
                className="px-4 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:border-transparent border border-green-500 text-white font-bold text-xs transition-all disabled:cursor-not-allowed cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          // Automated Analytical Conclusion Block
          renderCompareAnalysis(sortedEntries)
        )}
      </div>
    );
  };

  // ✅ LIST VIEW FOR SAVED COMPARISONS
  const renderSavedCompList = () => {
    if (savedComparisons.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-32 text-gray-500 h-full">
          <span className="text-4xl mb-4 opacity-50">🗄️</span>
          <p className="italic">No custom comparisons saved yet.</p>
          <p className="text-sm mt-2">Select multiple runs, click "Compare Selected", and then save them.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
        {savedComparisons.map(comp => {
          const successes = comp.entries.filter(e => e.simResult.metrics.exitFound);
          let winnerAlgo: AlgorithmType | null = null;
          
          if (successes.length === 1) {
            winnerAlgo = successes[0].algorithm;
          } else if (successes.length > 1) {
             const sorted = [...successes].sort((a,b) => {
                if (a.simResult.metrics.pathLength !== b.simResult.metrics.pathLength) {
                  return a.simResult.metrics.pathLength - b.simResult.metrics.pathLength;
                }
                return a.simResult.metrics.nodesExplored - b.simResult.metrics.nodesExplored;
             });
             winnerAlgo = sorted[0].algorithm;
          }
          
          const winnerCfg = winnerAlgo ? getAlgorithm(winnerAlgo) : { name: "No Winner", color: "#ef4444" };
          
          return (
            <div 
              key={comp.id} 
              onClick={() => { setActiveCompId(comp.id); setView('savedCompDetail'); }}
              className="bg-gray-800/40 border border-gray-700/60 rounded-xl p-5 hover:border-gray-500 hover:bg-gray-800/80 transition-all cursor-pointer shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: winnerCfg.color }}></div>
              <h3 className="text-white font-bold text-lg mb-1 ml-2">{comp.name}</h3>
              <p className="text-xs text-gray-500 mb-4 ml-2 font-medium">{comp.date.toLocaleString()}</p>
              
              <div className="ml-2 mb-4 flex flex-wrap gap-1.5">
                {comp.entries.map(e => {
                  const c = getAlgorithm(e.algorithm);
                  return (
                    <span key={e.id} className="text-[10px] px-1.5 py-0.5 rounded border font-semibold" style={{ borderColor: c.color+'40', color: c.color, backgroundColor: c.color+'10' }}>
                      {e.name}
                    </span>
                  );
                })}
              </div>

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

  const activeSavedComp = savedComparisons.find(c => c.id === activeCompId);
  const isSingleView = (view === 'compare' && selectedIds.size === 1) || (view === 'savedCompDetail' && activeSavedComp?.entries.length === 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8 transition-opacity">
      <div className="bg-[#0a0f1e] border border-gray-800 rounded-2xl w-full max-w-[1400px] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden h-[90vh]">
        
        <header className="bg-[#0d1224] border-b border-gray-800 p-4 sm:p-6 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {view === 'list' && '🗄️ Result History'}
              {view === 'compare' && '📊 Comparing Selected Runs'}
              {view === 'savedCompList' && '🗄️ Saved Custom Comparisons'}
              {view === 'savedCompDetail' && `🔍 Viewing: ${activeSavedComp?.name}`}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {view === 'list' && 'Select previous simulation runs to compare their metrics side-by-side.'}
              {view === 'compare' && 'Evaluating algorithm performance across selected historical benchmarks.'}
              {view === 'savedCompList' && 'Review previously saved multi-algorithm comparisons.'}
              {view === 'savedCompDetail' && `Saved on ${activeSavedComp?.date.toLocaleString()}`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            
            {view === 'list' && history.length > 0 && (
              <div className="relative" ref={dropdownRef}>
                {selectedIds.size > 0 ? (
                  <button 
                    onClick={handleUnselectAll} 
                    className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-600 text-xs font-bold text-gray-200 transition-colors cursor-pointer shadow-sm"
                  >
                    Unselect All
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-600 text-xs font-bold text-gray-200 transition-colors cursor-pointer shadow-sm flex items-center gap-2"
                    >
                      Select Rows ▼
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-36 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                        {Array.from({ length: maxRows }).map((_, i) => (
                          <button 
                            key={i} 
                            onClick={() => handleSelectRow(i)} 
                            className="block w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-blue-600/20 hover:text-blue-400 border-b border-gray-800 last:border-0 transition-colors cursor-pointer font-semibold"
                          >
                            Compare Row {i + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 font-bold transition-colors cursor-pointer">
              ✕
            </button>
          </div>
        </header>

        {/* ✅ DYNAMIC OVERFLOW FIX */}
        <div className={`p-4 sm:p-5 flex-1 bg-[#0a0f1e] ${isSingleView ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {view === 'list' && renderList()}
          {view === 'compare' && renderCompareContent(history.filter(h => selectedIds.has(h.id)))}
          {view === 'savedCompList' && renderSavedCompList()}
          {view === 'savedCompDetail' && activeSavedComp && renderCompareContent(activeSavedComp.entries)}
        </div>

        {/* ✅ UNIFIED FOOTER LOGIC - All buttons match your requirement */}
        <footer className="bg-[#0d1224] border-t border-gray-800 p-4 sm:p-5 flex justify-between items-center shrink-0 w-full">
          {view === 'list' ? (
            <div className="flex w-full justify-end gap-3">
              <button 
                onClick={() => setView('compare')}
                disabled={selectedIds.size !== 1}
                className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:border-transparent border border-indigo-500 text-white font-bold text-sm transition-all disabled:cursor-not-allowed cursor-pointer"
              >
                👁️ View Result
              </button>
              
              <button 
                onClick={() => setView('compare')}
                disabled={selectedIds.size < 2}
                className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:border-transparent border border-blue-500 text-white font-bold text-sm transition-all disabled:cursor-not-allowed shadow-[0_0_15px_rgba(37,99,235,0.3)] cursor-pointer"
              >
                📊 Compare Selected ({selectedIds.size})
              </button>
            </div>
          ) : view === 'compare' ? (
            <>
              {/* Left Side: History List Button */}
              {selectedIds.size >= 2 ? (
                <button 
                  onClick={() => setView('savedCompList')}
                  className="px-5 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm transition-all cursor-pointer border border-gray-600 flex items-center gap-2"
                >
                  🗄️ Comparison History
                  <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{savedComparisons.length}</span>
                </button>
              ) : <div />}

              {/* Right Side: Action Buttons */}
              <div className="flex gap-3">
                {selectedIds.size >= 2 && (
                   <button 
                    onClick={handleSaveComparison}
                    disabled={isCompSaved || isNamingComp}
                    className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                      isCompSaved 
                        ? 'bg-green-600/20 border border-green-500/50 text-green-400 cursor-default shadow-none' 
                        : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {isCompSaved ? '✅ Saved' : '💾 Save Comparison'}
                  </button>
                )}
                <button 
                  onClick={() => setView('list')}
                  className="px-6 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm transition-all cursor-pointer border border-gray-600"
                >
                  ← Back to Selection
                </button>
              </div>
            </>
          ) : view === 'savedCompList' ? (
            <div className="flex w-full justify-end">
              <button 
                onClick={() => setView('list')}
                className="px-6 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm transition-all cursor-pointer border border-gray-600"
              >
                ← Back to Main History
              </button>
            </div>
          ) : view === 'savedCompDetail' ? (
            <div className="flex w-full justify-end">
              <button 
                onClick={() => setView('savedCompList')}
                className="px-6 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm transition-all cursor-pointer border border-gray-600"
              >
                ← Back to Comparison History
              </button>
            </div>
          ) : null}
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