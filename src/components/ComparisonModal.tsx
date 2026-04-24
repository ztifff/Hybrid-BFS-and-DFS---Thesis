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

// ✅ NEW: Interface to store saved comparisons
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
  // Live Simulation State
  const [results, setResults] = useState<Record<string, SimulationResult>>({});
  const [isComputing, setIsComputing] = useState(false);

  // ✅ NEW: History & View State
  const [compHistory, setCompHistory] = useState<ComparisonEntry[]>([]);
  const [view, setView] = useState<'current' | 'historyList' | 'historyDetail'>('current');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const compCounter = useRef(0);

  const algos: AlgorithmType[] = ['bfs', 'dfs', 'hybrid'];

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    
    // Reset view and save state when a new live comparison is opened
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

  // ✅ DYNAMIC WINNER HELPER (Used for both analysis and history list tags)
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

  // ✅ DYNAMIC RECOMMENDATION ENGINE
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

  // ✅ RENDER CARDS LOGIC (Reusable for Live and History)
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

  // ✅ HISTORY LIST VIEW
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
              <h3 className="text-white font-bold text-lg mb-1 ml-2">{entry.name}</h3>
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

  // ✅ SAVE HANDLER
  const handleSaveResult = () => {
    if (isComputing || Object.keys(results).length === 0) return;
    
    // Generate a default name
    const defaultName = `Comparison Benchmark #${compCounter.current + 1}`;
    
    // Prompt the user for a custom name
    const customName = window.prompt("Save this comparison to history.\n\nEnter a custom name:", defaultName);
    
    if (customName === null) return; // User clicked Cancel
    
    compCounter.current += 1;
    
    const newEntry: ComparisonEntry = {
      id: Date.now().toString(),
      name: customName.trim() === '' ? defaultName : customName,
      results: results,
      optimalPathLength: optimalPathLength,
      totalNodes: currentGraph.nodes.length,
      date: new Date()
    };
    
    setCompHistory(prev => [newEntry, ...prev]); // Add to top of list
    setIsSaved(true);
  };

  const activeHistoryEntry = compHistory.find(h => h.id === selectedEntryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8 transition-opacity">
      <div className="bg-[#0a0f1e] border border-gray-700 rounded-2xl w-full max-w-6xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden max-h-[90vh]">
        
        {/* HEADER */}
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
              {view === 'historyDetail' && `Saved on ${activeHistoryEntry?.date.toLocaleString()}`}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* View Toggle Button */}
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

        {/* MAIN CONTENT BODY */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto flex flex-col" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}>
          
          {/* VIEW: LIVE COMPUTATION */}
          {view === 'current' && isComputing && (
            <div className="flex flex-col items-center justify-center py-32 text-gray-400 animate-pulse h-full">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-lg font-bold tracking-widest">COMPUTING BENCHMARKS...</div>
            </div>
          )}

          {/* VIEW: LIVE RESULTS */}
          {view === 'current' && !isComputing && (
            <>
              {renderCards(results, optimalPathLength, currentGraph.nodes.length)}
              {renderAnalysisBlock(results)}
            </>
          )}

          {/* VIEW: HISTORY LIST */}
          {view === 'historyList' && renderHistoryList()}

          {/* VIEW: HISTORY DETAILS */}
          {view === 'historyDetail' && activeHistoryEntry && (
            <>
              {renderCards(activeHistoryEntry.results, activeHistoryEntry.optimalPathLength, activeHistoryEntry.totalNodes)}
              {renderAnalysisBlock(activeHistoryEntry.results)}
            </>
          )}

        </div>

        {/* FOOTER (Only renders in Current or Detail view) */}
        {(view === 'current' || view === 'historyDetail') && (
          <footer className="bg-gray-900 border-t border-gray-700 p-4 sm:p-5 flex justify-end gap-4 shrink-0">
            {view === 'historyDetail' ? (
              <button 
                onClick={() => setView('historyList')}
                className="px-6 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm transition-all cursor-pointer border border-gray-600"
              >
                ← Back to History List
              </button>
            ) : (
              <button 
                onClick={handleSaveResult}
                disabled={isSaved || isComputing}
                className={`px-8 py-2.5 rounded-lg font-bold text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] ${
                  isSaved 
                    ? 'bg-green-600/20 border border-green-500/50 text-green-400 cursor-default shadow-none' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {isSaved ? '✅ Comparison Saved' : '💾 Save Comparison Results'}
              </button>
            )}
          </footer>
        )}

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