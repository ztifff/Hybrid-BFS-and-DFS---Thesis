import React from 'react';
import { AlgorithmKey } from '../types';
import { AlgoData } from '../hooks/useHistoryDetail';
import { ScenarioType } from '../../../types';
import { useTheme } from '../../../context/ThemeContext';

interface Props {
  bfs: AlgoData | null;
  dfs: AlgoData | null;
  hyb: AlgoData | null;
  entryActiveAlgorithms: { bfs: boolean; dfs: boolean; hybrid: boolean };
  runNumber?: number;
  scenario?: ScenarioType;
}

export const BenchmarkTable: React.FC<Props> = ({
  bfs,
  dfs,
  hyb,
  entryActiveAlgorithms,
  runNumber,
  scenario,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const allAlgos = ['bfs', 'dfs', 'hybrid'] as const;
  const activeAlgos = allAlgos.filter(a => entryActiveAlgorithms[a]);

  const distanceLabel = scenario === 'network' ? 'Total Latency'
    : scenario === 'traffic' ? 'Travel Time'
    : scenario === 'evacuation' ? 'Evac Time'
    : scenario === 'gameai' ? 'Moves'
    : 'Distance';

  const distanceUnit = scenario === 'network' ? ' ms'
    : scenario === 'robotics' ? ' m'
    : scenario === 'traffic' ? ' min'
    : scenario === 'evacuation' ? ' s'
    : '';

  const algoColors: Record<AlgorithmKey, { text: string; bg: string; hex: string }> = isLight ? {
    bfs: { text: 'text-emerald-700', bg: 'bg-emerald-50', hex: '#047857' },
    dfs: { text: 'text-purple-700', bg: 'bg-purple-50', hex: '#7e22ce' },
    hybrid: { text: 'text-amber-800', bg: 'bg-amber-50', hex: '#b45309' },
  } : {
    bfs: { text: 'text-green-400', bg: 'bg-green-500/5', hex: '#4ade80' },
    dfs: { text: 'text-purple-400', bg: 'bg-purple-500/5', hex: '#c084fc' },
    hybrid: { text: 'text-orange-400', bg: 'bg-orange-500/5', hex: '#fb923c' },
  };

  const neutralColor = isLight ? '#0f172a' : '#cbd5e1';

  const data: Record<string, AlgoData | null> = { bfs, dfs, hyb };
  const mapKey = (a: AlgorithmKey) => (a === 'hybrid' ? 'hyb' : a);

  const renderCell = (value: string | number, color: string, isFailure = false) => (
    <td
      className={`py-3 text-center text-xs font-mono font-bold ${
        isFailure
          ? 'text-red-500 bg-red-950/10'
          : isLight ? 'text-slate-900' : 'text-gray-200'
      }`}
      style={!isFailure ? { color } : {}}
    >
      {isFailure ? 'CRITICAL FAILURE' : value}
    </td>
  );

  return (
    <div className={`rounded-xl p-4 mb-5 border transition-colors ${
      isLight
        ? 'bg-white border-slate-200 shadow-sm text-slate-800'
        : 'bg-gray-900/60 border-gray-800 shadow-2xl text-white'
    }`}>
      <div className={`flex justify-between items-center mb-3 pb-2 border-b ${
        isLight ? 'border-slate-200' : 'border-gray-800'
      }`}>
        <h3 className={`font-bold text-xs uppercase tracking-widest ${
          isLight ? 'text-blue-700 font-extrabold' : 'text-blue-400'
        }`}>
          Execution Benchmarks
        </h3>
        <span className={`text-[10px] font-mono ${isLight ? 'text-slate-600 font-bold' : 'text-gray-500'}`}>
          RUN #{runNumber || 'N/A'}
        </span>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className={`border-b ${isLight ? 'border-slate-200' : 'border-gray-800'}`}>
            <th className={`py-2 text-[11px] font-bold uppercase tracking-wider ${
              isLight ? 'text-slate-700' : 'text-gray-500 font-semibold'
            }`}>
              Metric
            </th>
            {activeAlgos.map(a => (
              <th
                key={a}
                className={`py-2 text-center text-xs ${algoColors[a].text} font-mono font-extrabold ${algoColors[a].bg}`}
              >
                {a === 'hybrid' ? 'HYB' : a.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-gray-800/40'}`}>
          {[
            { label: 'Execution Time', val: (d: AlgoData) => `${d.time.toFixed(2)} ms`, color: (a: AlgorithmKey) => algoColors[a].hex },
            { label: distanceLabel, val: (d: AlgoData) => `${d.distance.toFixed(scenario === 'gameai' ? 0 : 1)}${distanceUnit}`, color: () => neutralColor },

            { label: 'Nodes Visited', val: (d: AlgoData) => String(d.nodes), color: () => neutralColor },
            { label: 'Memory', val: (d: AlgoData) => String(d.memory), color: () => neutralColor },
            { label: 'Path Optimality', val: (d: AlgoData) => String(d.optimality), color: (a: AlgorithmKey) => algoColors[a].hex },
            { label: 'Adaptability', val: (d: AlgoData) => `${d.adaptability}/100`, color: () => neutralColor },
            { label: 'Completion', val: (d: AlgoData) => d.completion, color: (a: AlgorithmKey) => algoColors[a].hex, bold: true },
          ].map(({ label, val, color, bold }) => (
            <tr key={label} className={bold ? (isLight ? 'bg-slate-50' : 'bg-gray-950/20') : ''}>
              <td className={`py-2.5 text-xs ${
                bold ? 'font-bold' : 'font-medium'
              } ${isLight ? 'text-slate-800' : 'text-gray-400'}`}>
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
        <div className={`mt-3 p-2 rounded text-xs leading-snug border ${
          isLight
            ? 'bg-red-50 border-red-300 text-red-900 font-medium'
            : 'bg-red-900/20 border-red-500/30 text-red-300'
        }`}>
          <span className="font-bold uppercase tracking-wider text-[10px]">Failure Reason:</span>{' '}
          {bfs?.reason || dfs?.reason || hyb?.reason || 'Target unreachable'}
        </div>
      )}
    </div>
  );
};
