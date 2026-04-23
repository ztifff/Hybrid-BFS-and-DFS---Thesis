import React, { useState, useEffect } from 'react';
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

export const ComparisonModal: React.FC<Props> = ({
  isOpen, onClose, scenario, useRealWorld, seed, currentGraph, optimalPathLength
}) => {
  const [results, setResults] = useState<Record<string, SimulationResult>>({});
  const [isComputing, setIsComputing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchResults = async () => {
      setIsComputing(true);
      const algos: AlgorithmType[] = ['bfs', 'dfs', 'hybrid'];
      const newResults: Record<string, SimulationResult> = {};

      // Run all 3 algorithms in the background instantly using the exact same seed
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

  const algos: AlgorithmType[] = ['bfs', 'dfs', 'hybrid'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8 transition-opacity">
      <div className="bg-[#0a0f1e] border border-gray-700 rounded-2xl w-full max-w-6xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        
        <header className="bg-gray-900 border-b border-gray-700 p-4 sm:p-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              📊 Algorithm Performance Comparison
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Executing all three algorithms under identical topological conditions and dynamic events.
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 font-bold transition-colors">
            ✕
          </button>
        </header>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {isComputing ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 animate-pulse">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-lg font-bold tracking-widest">COMPUTING BENCHMARKS...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {algos.map(algo => {
                const res = results[algo];
                const cfg = getAlgorithm(algo);
                if (!res) return null;

                const isSuccess = res.metrics.exitFound;
                const actualHops = Math.max(res.metrics.pathLength, 1);
                const completion = getCompletionRate(res.metrics.nodesExplored, currentGraph.nodes.length);
                const optimality = getPathOptimality(actualHops, optimalPathLength);
                const memory = getMemoryInMB(res.metrics.memoryUsed);
                const adaptability = getAdaptabilityScore('done', res.metrics, algo, res.dynamicEvents);

                return (
                  <div key={algo} className="bg-gray-800/50 border rounded-xl overflow-hidden relative" style={{ borderColor: cfg.color + '40' }}>
                    <div className="h-1.5 w-full" style={{ backgroundColor: cfg.color }}></div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold mb-4 text-center" style={{ color: cfg.color }}>
                        {cfg.name}
                      </h3>
                      
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
          )}
        </div>

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