import React from 'react';
import { AlgoData } from '../hooks/useHistoryDetail';
import { useTheme } from '../../../context/ThemeContext';

interface BarRowProps {
  label: string;
  bfsVal: number;
  dfsVal: number;
  hybVal: number;
  unit?: string;
  lowerBetter?: boolean;
  activeAlgorithms: { bfs: boolean; dfs: boolean; hybrid: boolean };
}

const BarRow: React.FC<BarRowProps> = ({
  label, bfsVal, dfsVal, hybVal, unit = '', lowerBetter = true, activeAlgorithms,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const rawValues = [
    { val: bfsVal, color: isLight ? '#047857' : '#4ade80', active: activeAlgorithms.bfs, key: 'BFS' },
    { val: dfsVal, color: isLight ? '#7e22ce' : '#c084fc', active: activeAlgorithms.dfs, key: 'DFS' },
    { val: hybVal, color: isLight ? '#b45309' : '#fb923c', active: activeAlgorithms.hybrid, key: 'HYB' },
  ];
  const activeVals = rawValues.filter(d => d.active).map(d => d.val);
  const values = activeVals.filter(v => v > 0);
  const maxVal = Math.max(...values, 0.001);
  const toW = (v: number) => `${Math.min(100, (v / maxVal) * 100).toFixed(1)}%`;
  const isBest = (v: number) =>
    values.length > 0 &&
    (lowerBetter ? v === Math.min(...values) : v === Math.max(...values));

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className={`text-[10px] uppercase tracking-wide font-extrabold ${isLight ? 'text-slate-700' : 'text-gray-500'}`}>
          {label}
        </span>
      </div>
      {rawValues.filter(d => d.active).map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-extrabold w-7 shrink-0" style={{ color: d.color }}>
            {d.key}
          </span>
          <div className={`flex-1 rounded-full h-2 overflow-hidden ${isLight ? 'bg-slate-200 border border-slate-300/60' : 'bg-gray-800/60'}`}>
            <div
              className={`h-full rounded-full transition-all ${
                d.key === 'BFS' ? 'bg-emerald-600' : d.key === 'DFS' ? 'bg-purple-600' : 'bg-amber-600'
              } ${isBest(d.val) ? (isLight ? 'ring-1 ring-slate-400' : 'ring-1 ring-white/30') : 'opacity-80'}`}
              style={{ width: d.val > 0 ? toW(d.val) : '2%' }}
            />
          </div>
          <span className={`text-[10px] font-mono w-16 text-right shrink-0 ${
            isBest(d.val)
              ? isLight ? 'text-slate-900 font-extrabold' : 'text-white font-bold'
              : isLight ? 'text-slate-600 font-semibold' : 'text-gray-500'
          }`}>
            {d.val > 0 ? `${d.val % 1 !== 0 ? d.val.toFixed(2) : d.val}${unit}` : 'N/A'}
            {isBest(d.val) && <span className={isLight ? 'ml-0.5 text-amber-600' : 'ml-0.5 text-yellow-400'}>★</span>}
          </span>
        </div>
      ))}
    </div>
  );
};

interface Props {
  bfs: AlgoData | null;
  dfs: AlgoData | null;
  hyb: AlgoData | null;
  entryActiveAlgorithms: { bfs: boolean; dfs: boolean; hybrid: boolean };
}

export const PerformanceBarChart: React.FC<Props> = ({ bfs, dfs, hyb, entryActiveAlgorithms }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const aa = entryActiveAlgorithms;

  return (
    <div className={`rounded-xl p-4 border transition-colors ${
      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-gray-900/40 border-gray-800'
    }`}>
      <div className={`px-4 py-3 rounded-lg border ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-gray-900/40 border-gray-800'
      }`}>
        <h3 className={`text-[11px] font-extrabold uppercase tracking-[0.2em] flex items-center gap-2 ${
          isLight ? 'text-slate-800' : 'text-gray-400'
        }`}>
          Performance Breakdown — Visual Comparison
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
        <BarRow label="Execution Time (lower ★ = better)"       bfsVal={aa.bfs ? (bfs?.time ?? 0) : 0}                        dfsVal={aa.dfs ? (dfs?.time ?? 0) : 0}                        hybVal={aa.hybrid ? (hyb?.time ?? 0) : 0}                        unit=" ms"  lowerBetter={true}  activeAlgorithms={aa} />
        <BarRow label="Path Distance — Hops (lower ★ = better)" bfsVal={aa.bfs ? (bfs?.distance ?? 0) : 0}                    dfsVal={aa.dfs ? (dfs?.distance ?? 0) : 0}                    hybVal={aa.hybrid ? (hyb?.distance ?? 0) : 0}                    lowerBetter={true}  activeAlgorithms={aa} />
        <BarRow label="Nodes Swept / Explored (lower ★ = better)"bfsVal={aa.bfs ? (bfs?.nodes ?? 0) : 0}                      dfsVal={aa.dfs ? (dfs?.nodes ?? 0) : 0}                      hybVal={aa.hybrid ? (hyb?.nodes ?? 0) : 0}                      lowerBetter={true}  activeAlgorithms={aa} />
        <BarRow label="Dynamic Adaptability (higher ★ = better)" bfsVal={aa.bfs ? Number(bfs?.adaptability ?? 0) : 0}         dfsVal={aa.dfs ? Number(dfs?.adaptability ?? 0) : 0}         hybVal={aa.hybrid ? Number(hyb?.adaptability ?? 0) : 0}         lowerBetter={false} activeAlgorithms={aa} />
        <BarRow label="Completion Rate % (higher ★ = better)"   bfsVal={aa.bfs ? parseFloat(bfs?.completion ?? '0') : 0}     dfsVal={aa.dfs ? parseFloat(dfs?.completion ?? '0') : 0}     hybVal={aa.hybrid ? parseFloat(hyb?.completion ?? '0') : 0}     lowerBetter={false} activeAlgorithms={aa} />
        <BarRow label="Memory Used — KB (lower ★ = better)"     bfsVal={aa.bfs ? parseFloat(String(bfs?.memory ?? '0')) : 0} dfsVal={aa.dfs ? parseFloat(String(dfs?.memory ?? '0')) : 0} hybVal={aa.hybrid ? parseFloat(String(hyb?.memory ?? '0')) : 0} unit=" KB"  lowerBetter={true}  activeAlgorithms={aa} />
      </div>
    </div>
  );
};
