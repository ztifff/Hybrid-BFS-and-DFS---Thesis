import React from 'react';
import { AlgorithmKey, MOVEMENT_PROFILES } from '../types';
import { AlgoData, ScoredAlgo } from '../hooks/useHistoryDetail';
import { useTheme } from '../../../context/ThemeContext';

interface Props {
  winner: ScoredAlgo | null;
  runnerUp: ScoredAlgo | null;
  bfs: AlgoData | null;
  dfs: AlgoData | null;
  hyb: AlgoData | null;
}

export const WinnerCard: React.FC<Props> = ({ winner, runnerUp, bfs, dfs, hyb }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (!winner) {
    return (
      <div className={`rounded-xl border p-4 text-xs text-center ${
        isLight
          ? 'border-red-300 bg-red-50 text-red-800 font-medium'
          : 'border-red-500/20 bg-red-950/10 text-red-400'
      }`}>
        No algorithm completed successfully on this run — all paths were exhausted or severed.
      </div>
    );
  }

  const profile = MOVEMENT_PROFILES[winner.key];

  return (
    <div className={`rounded-xl p-4 border transition-colors ${
      isLight
        ? 'border-amber-300 bg-amber-50/80 shadow-xs'
        : 'border-yellow-500/30 bg-gradient-to-br from-yellow-950/30 via-amber-950/20 to-gray-900/40 shadow-lg shadow-yellow-900/10'
    }`}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className={`text-sm uppercase tracking-widest ${
              isLight ? 'font-extrabold text-amber-900' : 'font-bold text-yellow-300'
            }`}>
              Best Algorithm for this Map
            </h3>
            <span
              className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-xs"
              style={{
                color: isLight
                  ? winner.key === 'bfs' ? '#047857' : winner.key === 'dfs' ? '#7e22ce' : '#b45309'
                  : winner.color,
                borderColor: `${winner.color}60`,
                background: isLight ? '#ffffff' : `${winner.color}15`,
              }}
            >
              {winner.label}
            </span>
            <span className={`text-[10px] font-mono ${isLight ? 'text-slate-600 font-bold' : 'text-gray-500'}`}>
              Score: {(winner.score * 100).toFixed(1)}/100
            </span>
          </div>

          <p className={`text-xs leading-relaxed mb-2 ${isLight ? 'text-slate-800' : 'text-gray-300'}`}>
            <span className="font-bold mr-1">Movement:</span>
            {profile.motion}
          </p>
          <p className={`text-[11px] leading-relaxed mb-2 ${isLight ? 'text-slate-600 font-medium' : 'text-gray-400'}`}>
            {profile.strategy}
          </p>

          <div className="flex flex-wrap gap-2 mt-2">
            {winner.data.distance <= Math.min(bfs?.distance ?? Infinity, dfs?.distance ?? Infinity, hyb?.distance ?? Infinity) && (
              <span className={`text-[10px] px-2 py-0.5 rounded border ${
                isLight
                  ? 'bg-blue-100 border-blue-300 text-blue-900 font-bold'
                  : 'bg-blue-950/60 border-blue-700/40 text-blue-300'
              }`}>
                Shortest Path
              </span>
            )}
            {winner.data.time <= Math.min(bfs?.time ?? Infinity, dfs?.time ?? Infinity, hyb?.time ?? Infinity) && (
              <span className={`text-[10px] px-2 py-0.5 rounded border ${
                isLight
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold'
                  : 'bg-green-950/60 border-green-700/40 text-green-300'
              }`}>
                Fastest Execution
              </span>
            )}
            {winner.data.nodes <= Math.min(bfs?.nodes ?? Infinity, dfs?.nodes ?? Infinity, hyb?.nodes ?? Infinity) && (
              <span className={`text-[10px] px-2 py-0.5 rounded border ${
                isLight
                  ? 'bg-purple-100 border-purple-300 text-purple-900 font-bold'
                  : 'bg-purple-950/60 border-purple-700/40 text-purple-300'
              }`}>
                Least Nodes Swept
              </span>
            )}
            {Number(winner.data.adaptability) >= Math.max(Number(bfs?.adaptability ?? 0), Number(dfs?.adaptability ?? 0), Number(hyb?.adaptability ?? 0)) && (
              <span className={`text-[10px] px-2 py-0.5 rounded border ${
                isLight
                  ? 'bg-amber-100 border-amber-300 text-amber-950 font-bold'
                  : 'bg-orange-950/60 border-orange-700/40 text-orange-300'
              }`}>
                Highest Adaptability
              </span>
            )}
          </div>

          {runnerUp && (
            <p className={`text-[10px] mt-2 border-t pt-2 ${
              isLight ? 'text-slate-600 border-slate-200' : 'text-gray-500 border-gray-800/50'
            }`}>
              Runner-up:{' '}
              <span
                className="font-bold"
                style={{
                  color: isLight
                    ? runnerUp.key === 'bfs' ? '#047857' : runnerUp.key === 'dfs' ? '#7e22ce' : '#b45309'
                    : runnerUp.color,
                }}
              >
                {runnerUp.label}
              </span>{' '}
              — {MOVEMENT_PROFILES[runnerUp.key as AlgorithmKey].tradeoff}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
