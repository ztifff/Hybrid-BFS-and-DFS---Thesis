import React from 'react';
import { AlgorithmKey, MOVEMENT_PROFILES } from '../types';
import { AlgoData, ScoredAlgo } from '../hooks/useHistoryDetail';

interface Props {
  bfs: AlgoData | null;
  dfs: AlgoData | null;
  hyb: AlgoData | null;
  entryActiveAlgorithms: { bfs: boolean; dfs: boolean; hybrid: boolean };
  winner: ScoredAlgo | null;
}

export const AlgorithmMovements: React.FC<Props> = ({
  bfs, dfs, hyb, entryActiveAlgorithms, winner,
}) => {
  const ALGO_COLORS: Record<AlgorithmKey, string> = {
    bfs: '#4ade80', dfs: '#c084fc', hybrid: '#fb923c',
  };

  const algos: { key: AlgorithmKey; label: string; result: AlgoData | null }[] = [
    { key: 'bfs',    label: 'BFS',            result: bfs },
    { key: 'dfs',    label: 'DFS',            result: dfs },
    { key: 'hybrid', label: 'Hybrid BFS-DFS', result: hyb },
  ];

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 pb-2 border-b border-gray-800">
        🧭 How Each Algorithm Moves Node-to-Node
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {algos.filter(a => entryActiveAlgorithms[a.key]).map(({ key, label, result }) => {
          const profile = MOVEMENT_PROFILES[key];
          const isWinner = winner?.key === key;
          const color = ALGO_COLORS[key];
          return (
            <div
              key={key}
              className={`rounded-lg border p-3 relative ${
                isWinner ? 'border-yellow-500/40 bg-yellow-950/10' : 'border-gray-800 bg-gray-900/30'
              }`}
            >
              {isWinner && (
                <span className="absolute top-2 right-2 text-[9px] font-bold text-yellow-400 bg-yellow-950/60 border border-yellow-700/40 px-1.5 py-0.5 rounded">
                  BEST ★
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{profile.icon}</span>
                <span className="text-xs font-bold" style={{ color }}>{label}</span>
                {result && !result.success && (
                  <span className="text-[9px] text-red-400 border border-red-800/40 px-1 rounded ml-auto">FAILED</span>
                )}
              </div>
              <p className="text-[10px] text-gray-300 leading-relaxed font-semibold mb-1">{profile.motion}</p>
              <p className="text-[10px] text-gray-500 leading-relaxed">{profile.tradeoff}</p>
              {result && result.success && (
                <div className="mt-2 pt-2 border-t border-gray-800/40 grid grid-cols-2 gap-1 text-[10px] font-mono">
                  <span className="text-gray-600">Hops:</span>
                  <span className="text-right" style={{ color }}>{result.distance}</span>
                  <span className="text-gray-600">Nodes:</span>
                  <span className="text-right" style={{ color }}>{result.nodes}</span>
                  <span className="text-gray-600">Time:</span>
                  <span className="text-right" style={{ color }}>{result.time.toFixed(2)} ms</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
