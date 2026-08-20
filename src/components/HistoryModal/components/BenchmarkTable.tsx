import React from 'react';
import { AlgorithmKey } from '../types';
import { AlgoData } from '../hooks/useHistoryDetail';

interface Props {
  bfs: AlgoData | null;
  dfs: AlgoData | null;
  hyb: AlgoData | null;
  entryActiveAlgorithms: { bfs: boolean; dfs: boolean; hybrid: boolean };
  runNumber?: number;
}

const renderCell = (value: string | number, color: string, isFailure = false) => (
  <td
    className={`py-3 text-center text-xs font-mono font-bold ${isFailure ? 'text-red-500 bg-red-950/10' : 'text-gray-200'
      }`}
    style={!isFailure ? { color } : {}}
  >
    {isFailure ? 'CRITICAL FAILURE' : value}
  </td>
);

export const BenchmarkTable: React.FC<Props> = ({
  bfs,
  dfs,
  hyb,
  entryActiveAlgorithms,
  runNumber,
}) => {
  const allAlgos = ['bfs', 'dfs', 'hybrid'] as const;
  const activeAlgos = allAlgos.filter(a => entryActiveAlgorithms[a]);

  const algoColors: Record<AlgorithmKey, { text: string; bg: string; hex: string }> = {
    bfs: { text: 'text-green-400', bg: 'bg-green-500/5', hex: '#4ade80' },
    dfs: { text: 'text-purple-400', bg: 'bg-purple-500/5', hex: '#c084fc' },
    hybrid: { text: 'text-orange-400', bg: 'bg-orange-500/5', hex: '#fb923c' },
  };

  const data: Record<string, AlgoData | null> = { bfs, dfs, hyb };
  const mapKey = (a: AlgorithmKey) => (a === 'hybrid' ? 'hyb' : a);

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 shadow-2xl mb-5">
      <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
        <h3 className="font-bold text-xs uppercase tracking-widest text-blue-400">
          Execution Benchmarks
        </h3>
        <span className="text-[10px] font-mono text-gray-500">RUN #{runNumber || 'N/A'}</span>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Metric
            </th>
            {activeAlgos.map(a => (
              <th
                key={a}
                className={`py-2 text-center text-xs ${algoColors[a].text} font-mono font-bold ${algoColors[a].bg}`}
              >
                {a === 'hybrid' ? 'HYB' : a.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/40">
          {[
            { label: 'Execution Time', val: (d: AlgoData) => `${d.time.toFixed(2)} ms`, color: (a: AlgorithmKey) => algoColors[a].hex },
            { label: 'Distance', val: (d: AlgoData) => d.distance.toFixed(1), color: () => '#cbd5e1' },
            { label: 'Nodes Visited', val: (d: AlgoData) => String(d.nodes), color: () => '#94a3b8' },
            { label: 'Memory', val: (d: AlgoData) => String(d.memory), color: () => '#cbd5e1' },
            { label: 'Path Optimality', val: (d: AlgoData) => String(d.optimality), color: (a: AlgorithmKey) => algoColors[a].hex },
            { label: 'Adaptability', val: (d: AlgoData) => `${d.adaptability}/100`, color: () => '#cbd5e1' },
            { label: 'Completion', val: (d: AlgoData) => d.completion, color: (a: AlgorithmKey) => algoColors[a].hex, bold: true },
          ].map(({ label, val, color, bold }) => (
            <tr key={label} className={bold ? 'bg-gray-950/20' : ''}>
              <td className={`py-2.5 text-xs text-gray-400 ${bold ? 'font-semibold' : ''}`}>
                {label}
              </td>
              {activeAlgos.map(a => {
                const d = data[mapKey(a)];
                return (
                  <React.Fragment key={a}>
                    {renderCell(
                      d ? val(d) : 'N/A',
                      color(a),
                      d !== null && !d?.success
                    )}
                  </React.Fragment>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {(bfs !== null && !bfs?.success || dfs !== null && !dfs?.success || hyb !== null && !hyb?.success) && (
        <div className="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-300 leading-snug">
          <span className="font-bold uppercase tracking-wider text-[10px]">Failure Reason:</span>{' '}
          {bfs?.reason || dfs?.reason || hyb?.reason || 'Target unreachable'}
        </div>
      )}
    </div>
  );
};
