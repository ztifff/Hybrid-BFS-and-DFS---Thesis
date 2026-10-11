import React from 'react';
import { AlgorithmKey, MOVEMENT_PROFILES } from '../types';
import { AlgoData, ScoredAlgo } from '../hooks/useHistoryDetail';
import { useTheme } from '../../../context/ThemeContext';

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
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const ALGO_COLORS: Record<AlgorithmKey, string> = isLight
    ? { bfs: '#047857', dfs: '#7e22ce', hybrid: '#b45309' }
    : { bfs: '#4ade80', dfs: '#c084fc', hybrid: '#fb923c' };

  const algos: { key: AlgorithmKey; label: string; result: AlgoData | null }[] = [
    { key: 'bfs',    label: 'BFS',            result: bfs },
    { key: 'dfs',    label: 'DFS',            result: dfs },
    { key: 'hybrid', label: 'Hybrid BFS-DFS', result: hyb },
  ];

  return (
    <div className={`rounded-xl p-4 border transition-colors ${
      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-gray-900/40 border-gray-800'
    }`}>
      <h3 className={`text-xs font-extrabold uppercase tracking-widest mb-3 pb-2 border-b ${
        isLight ? 'text-slate-800 border-slate-200' : 'text-gray-400 border-gray-800'
      }`}>
        How Each Algorithm Moves Node-to-Node
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
                isWinner
                  ? isLight
                    ? 'border-amber-300 bg-amber-50/70 shadow-2xs'
                    : 'border-yellow-500/40 bg-yellow-950/10'
                  : isLight
                    ? 'border-slate-200 bg-slate-50/70'
                    : 'border-gray-800 bg-gray-900/30'
              }`}
            >
              {isWinner && (
                <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                  isLight
                    ? 'text-amber-950 bg-amber-200 border-amber-300 shadow-2xs'
                    : 'text-yellow-400 bg-yellow-950/60 border-yellow-700/40'
                }`}>
                  BEST
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-extrabold" style={{ color }}>{label}</span>
                {result && !result.success && (
                  <span className={`text-[9px] font-bold px-1 rounded ml-auto border ${
                    isLight ? 'text-red-700 bg-red-100 border-red-300' : 'text-red-400 border-red-800/40'
                  }`}>FAILED</span>
                )}
              </div>
              <p className={`text-[10px] leading-relaxed font-bold mb-1 ${
                isLight ? 'text-slate-800' : 'text-gray-300'
              }`}>{profile.motion}</p>
              <p className={`text-[10px] leading-relaxed ${
                isLight ? 'text-slate-600 font-medium' : 'text-gray-500'
              }`}>{profile.tradeoff}</p>
              {result && result.success && (
                <div className={`mt-2 pt-2 border-t grid grid-cols-2 gap-1 text-[10px] font-mono font-bold ${
                  isLight ? 'border-slate-200' : 'border-gray-800/40'
                }`}>
                  <span className={isLight ? 'text-slate-600' : 'text-gray-600'}>Hops:</span>
                  <span className="text-right" style={{ color }}>{result.distance}</span>
                  <span className={isLight ? 'text-slate-600' : 'text-gray-600'}>Nodes:</span>
                  <span className="text-right" style={{ color }}>{result.nodes}</span>
                  <span className={isLight ? 'text-slate-600' : 'text-gray-600'}>Time:</span>
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
