import React from 'react';
import { AlgoData } from '../hooks/useHistoryDetail';

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
  const rawValues = [
    { val: bfsVal, color: '#4ade80', active: activeAlgorithms.bfs },
    { val: dfsVal, color: '#c084fc', active: activeAlgorithms.dfs },
    { val: hybVal, color: '#fb923c', active: activeAlgorithms.hybrid },
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
        <span className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">{label}</span>
      </div>
      {rawValues.filter(d => d.active).map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] font-mono w-7 shrink-0" style={{ color: d.color }}>
            {d.color === '#4ade80' ? 'BFS' : d.color === '#c084fc' ? 'DFS' : 'HYB'}
          </span>
          <div className="flex-1 bg-gray-800/60 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                d.color === '#4ade80' ? 'bg-green-500' : d.color === '#c084fc' ? 'bg-purple-500' : 'bg-orange-500'
              } ${isBest(d.val) ? 'ring-1 ring-white/30' : 'opacity-70'}`}
              style={{ width: d.val > 0 ? toW(d.val) : '2%' }}
            />
          </div>
          <span className={`text-[10px] font-mono w-16 text-right shrink-0 ${isBest(d.val) ? 'text-white font-bold' : 'text-gray-500'}`}>
            {d.val > 0 ? `${d.val % 1 !== 0 ? d.val.toFixed(2) : d.val}${unit}` : 'N/A'}
            {isBest(d.val) && <span className="ml-0.5 text-yellow-400">★</span>}
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
  const aa = entryActiveAlgorithms;
  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 pb-2 border-b border-gray-800">
        📊 Performance Breakdown — Visual Comparison
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
