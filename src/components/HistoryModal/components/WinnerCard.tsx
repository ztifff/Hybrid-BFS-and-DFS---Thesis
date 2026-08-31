import React from 'react';
import { AlgorithmKey, MOVEMENT_PROFILES } from '../types';
import { AlgoData, ScoredAlgo } from '../hooks/useHistoryDetail';

interface Props {
  winner: ScoredAlgo | null;
  runnerUp: ScoredAlgo | null;
  bfs: AlgoData | null;
  dfs: AlgoData | null;
  hyb: AlgoData | null;
}

export const WinnerCard: React.FC<Props> = ({ winner, runnerUp, bfs, dfs, hyb }) => {
  if (!winner) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4 text-xs text-red-400 text-center">
      <>No algorithm completed successfully on this run — all paths were exhausted or severed.</>
      </div>
    );
  }

  const profile = MOVEMENT_PROFILES[winner.key];

  return (
    <div className="rounded-xl border border-yellow-500/30 bg-gradient-to-br from-yellow-950/30 via-amber-950/20 to-gray-900/40 p-4 shadow-lg shadow-yellow-900/10">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-bold text-yellow-300 uppercase tracking-widest">
              Best Algorithm for this Map
            </h3>
            <span
              className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border"
              style={{
                color: winner.color,
                borderColor: `${winner.color}50`,
                background: `${winner.color}15`,
              }}
            >
              {winner.label}
            </span>
            <span className="text-[10px] font-mono text-gray-500">
              Score: {(winner.score * 100).toFixed(1)}/100
            </span>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed mb-2">
            <span className="font-semibold mr-1">Movement:</span>
            {profile.motion}
          </p>
          <p className="text-[11px] text-gray-400 leading-relaxed mb-2">{profile.strategy}</p>

          <div className="flex flex-wrap gap-2 mt-2">
            {winner.data.distance <= Math.min(bfs?.distance ?? Infinity, dfs?.distance ?? Infinity, hyb?.distance ?? Infinity) && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/60 border border-blue-700/40 text-blue-300">Shortest Path</span>
            )}
            {winner.data.time <= Math.min(bfs?.time ?? Infinity, dfs?.time ?? Infinity, hyb?.time ?? Infinity) && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-green-950/60 border border-green-700/40 text-green-300">Fastest Execution</span>
            )}
            {winner.data.nodes <= Math.min(bfs?.nodes ?? Infinity, dfs?.nodes ?? Infinity, hyb?.nodes ?? Infinity) && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/60 border border-purple-700/40 text-purple-300">Least Nodes Swept</span>
            )}
            {Number(winner.data.adaptability) >= Math.max(Number(bfs?.adaptability ?? 0), Number(dfs?.adaptability ?? 0), Number(hyb?.adaptability ?? 0)) && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-orange-950/60 border border-orange-700/40 text-orange-300">Highest Adaptability</span>
            )}
          </div>

          {runnerUp && (
            <p className="text-[10px] text-gray-500 mt-2 border-t border-gray-800/50 pt-2">
              Runner-up:{' '}
              <span className="font-semibold" style={{ color: runnerUp.color }}>
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
