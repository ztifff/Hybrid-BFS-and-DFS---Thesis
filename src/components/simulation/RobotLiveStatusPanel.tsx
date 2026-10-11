import React, { useState, useEffect } from 'react';
import { RobotAssignment, AlgorithmStep, GraphNode } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  assignments: RobotAssignment[];
  activeSteps: { bfs: AlgorithmStep | null; dfs: AlgorithmStep | null; hybrid: AlgorithmStep | null };
  followAlgo?: 'bfs' | 'dfs' | 'hybrid' | null;
  graphNodes: GraphNode[];
  onRobotClick?: (nodeId: string) => void;
  mapId?: string;
  activeAlgorithms?: { bfs: boolean; dfs: boolean; hybrid: boolean };
}

const ALGO_CONFIG = {
  bfs:    { name: 'BFS',    barColor: '#22c55e', btnActive: 'bg-emerald-600 text-white',    textColor: 'text-emerald-400', textColorLight: 'text-emerald-700' },
  dfs:    { name: 'DFS',    barColor: '#a855f7', btnActive: 'bg-purple-600 text-white',     textColor: 'text-purple-400',  textColorLight: 'text-purple-700'  },
  hybrid: { name: 'HYBRID', barColor: '#f97316', btnActive: 'bg-orange-600 text-white',     textColor: 'text-orange-400',  textColorLight: 'text-orange-700'  },
} as const;

export const RobotLiveStatusPanel: React.FC<Props> = ({
  assignments,
  activeSteps,
  followAlgo = null,
  graphNodes,
  onRobotClick,
  mapId,
  activeAlgorithms,
}) => {
  const { theme: ctxTheme } = useTheme();
  const isLight = ctxTheme === 'light';
  const [selectedAlgo, setSelectedAlgo] = useState<'bfs' | 'dfs' | 'hybrid'>(followAlgo || 'bfs');

  // Determine which algos are visible (default all true)
  const visible = {
    bfs:    activeAlgorithms?.bfs    ?? true,
    dfs:    activeAlgorithms?.dfs    ?? true,
    hybrid: activeAlgorithms?.hybrid ?? true,
  };

  const visibleKeys = (Object.keys(ALGO_CONFIG) as Array<keyof typeof ALGO_CONFIG>).filter(k => visible[k]);

  useEffect(() => {
    if (followAlgo) setSelectedAlgo(followAlgo);
  }, [followAlgo]);

  // If the selected algo is hidden, switch to the first visible one
  useEffect(() => {
    if (!visible[selectedAlgo] && visibleKeys.length > 0) {
      setSelectedAlgo(visibleKeys[0]);
    }
  }, [visible.bfs, visible.dfs, visible.hybrid]);

  if (!assignments || assignments.length === 0) return null;

  const isBoxDeliveryMap = mapId === 'aws' || mapId === 'awsWarehouse' || mapId === 'synthetic';
  const activeStep = activeSteps[selectedAlgo] ?? activeSteps.bfs ?? activeSteps.hybrid ?? activeSteps.dfs;
  const formatLabel = (label: string) => {
    return label.replace(/\n/g, " ");
  };

  const nodeMap = new Map(graphNodes.map(n => [n.id, formatLabel(n.label)]));
  const theme = ALGO_CONFIG[selectedAlgo];

  return (
    <div className={`shrink-0 rounded-xl overflow-hidden fade-in border transition-colors duration-300 ${
      isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-gray-900 border-gray-700 hover:border-blue-500'
    }`}>

      {/* ── Header ───────────────────────────────────────────── */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${
        isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-black/40 border-white/5'
      }`}>
        <div className="flex items-center gap-1.5">
          <span className="text-sm sm:hidden">🤖</span>
          <span className={`text-[11px] font-bold uppercase tracking-widest ${
            isLight ? 'text-slate-800 font-extrabold' : 'text-gray-300'
          }`}>
            Robot Fleet Status
          </span>
        </div>

        {/* Algorithm switcher */}
        <div className={`flex items-center gap-0.5 border shadow-inner rounded-md p-0.5 ${
          isLight ? 'bg-slate-200/70 border-slate-300' : 'bg-black/40 border-white/10'
        }`}>
          {visibleKeys.map(key => (
            <button
              key={key}
              onClick={() => setSelectedAlgo(key)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                selectedAlgo === key
                  ? ALGO_CONFIG[key].btnActive
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {ALGO_CONFIG[key].name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Robot Cards ──────────────────────────────────────── */}
      <div className={`flex flex-col divide-y max-h-[45vh] overflow-y-auto ${
        isLight ? 'divide-slate-200' : 'divide-white/5'
      }`}>
        {assignments.map((assignment, idx) => {
          const robotName  = nodeMap.get(assignment.robotId) ?? assignment.robotId;

          /* current robot location: look up per-robot position or fallback */
          const locId = activeStep?.robotPositions?.[assignment.robotId]
            ?? (activeStep?.activeRobotId === assignment.robotId ? activeStep.current : null)
            ?? assignment.robotId;
          const locLabel = locId ? (nodeMap.get(locId) ?? locId) : '—';

          let totalRequired = 0;
          let totalDelivered = 0;

          if (isBoxDeliveryMap) {
            /* total boxes this robot is responsible for */
            assignment.destinations.forEach(d => {
              totalRequired += assignment.boxCounts?.[d] ?? 6;
            });
            /* how many boxes delivered */
            assignment.destinations.forEach(d => {
              totalDelivered += activeStep?.deliveredBoxCounts?.[d] ?? 0;
            });
            totalDelivered = Math.min(totalRequired, totalDelivered);
          } else {
            /* Clinic / Non-AWS maps: track destination completion */
            totalRequired = assignment.destinations.length;
            assignment.destinations.forEach(d => {
              const reached = activeStep?.foundDestinations?.includes(d)
                || (activeStep?.deliveredBoxCounts?.[d] ?? 0) > 0
                || locId === d;
              if (reached) totalDelivered++;
            });
          }

          const percent   = totalRequired > 0 ? Math.min(100, Math.round((totalDelivered / totalRequired) * 100)) : 0;
          const isDone    = percent >= 100;

          /* task badge */
          let task: React.ReactNode = 'In Transit';
          if (isDone) {
            task = <><span className="sm:hidden">✅ </span>Done</>;
          } else if (activeStep?.phaseLabel?.toLowerCase().includes('congestion')) {
            task = <><span className="sm:hidden">⏳ </span>Blocked</>;
          } else if (locId && assignment.destinations.includes(locId)) {
            task = <><span className="sm:hidden">🚚 </span>Unloading</>;
          } else if (locId && (locId.startsWith('shelf') || locId.startsWith('clutter'))) {
            task = <><span className="sm:hidden">📦 </span>Loading</>;
          } else if (assignment.priorityDest && !isDone) {
            const pLabel = nodeMap.get(assignment.priorityDest) ?? assignment.priorityDest;
            task = <><span className="sm:hidden">⭐ </span>{pLabel.length > 12 ? pLabel.slice(0, 12) + '…' : pLabel}</>;
          }

          return (
            <div
              key={assignment.robotId}
              onClick={() => locId && onRobotClick?.(locId)}
              className={`group px-3 py-2.5 transition-colors cursor-pointer ${
                isLight ? 'hover:bg-slate-50' : 'hover:bg-[#131c38]'
              }`}
              title="Click to focus on this robot on the map"
            >
              {/* Row 1: name + count */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`text-[11px] font-extrabold shrink-0 ${isLight ? theme.textColorLight : theme.textColor}`}>R{idx + 1}</span>
                  <span className={`text-[11px] truncate ${isLight ? 'text-slate-900 font-bold' : 'text-gray-200 font-semibold'}`} title={robotName}>
                    {robotName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className={`text-[11px] font-bold tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {totalDelivered}<span className={`font-normal ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>/{totalRequired}</span>
                  </span>
                  <span className={`text-[10px] font-bold tabular-nums ${isDone ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-slate-500' : 'text-gray-400')}`}>
                    ({percent}%)
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className={`w-full rounded-full h-1.5 mb-1.5 overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-gray-800'}`}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: isDone ? (isLight ? '#16a34a' : '#4ade80') : theme.barColor,
                  }}
                />
              </div>

              {/* Row 2: current location + task badge */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[10px] group-hover:text-emerald-500 transition-colors shrink-0 sm:hidden">🎯</span>
                  <span className={`text-[10px] truncate transition-colors ${
                    isLight ? 'text-slate-600 group-hover:text-slate-900' : 'text-gray-400 group-hover:text-gray-200'
                  }`} title={locLabel}>
                    {locLabel}
                  </span>
                </div>
                <span className={`text-[10px] font-semibold shrink-0 whitespace-nowrap ${
                  isLight ? 'text-indigo-700' : 'text-indigo-300'
                }`}>
                  {task}
                </span>
              </div>

              {/* Assigned destinations list */}
              {assignment.destinations.length > 0 && (
                <div className={`mt-1 pt-1.5 border-t space-y-1 ${isLight ? 'border-slate-200' : 'border-gray-800/60'}`}>
                  <div className={`text-[9px] uppercase tracking-wider font-bold ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
                    Assigned Destinations:
                  </div>
                  {assignment.destinations.map(destId => {
                    const destName = nodeMap.get(destId) ?? destId;
                    const required = assignment.boxCounts?.[destId] ?? (isBoxDeliveryMap ? 6 : 1);
                    const delivered = activeStep?.deliveredBoxCounts?.[destId] ?? 0;
                    const isReached = isBoxDeliveryMap ? delivered >= required : (activeStep?.foundDestinations?.includes(destId) || delivered > 0);
                    const isCurrent = locId === destId;

                    return (
                      <div key={destId} className="flex items-center justify-between text-[10px] pl-1">
                        <span className={`truncate max-w-[170px] ${
                          isReached 
                            ? (isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-300 font-medium') 
                            : isCurrent 
                            ? (isLight ? 'text-blue-700 font-bold' : 'text-blue-300 font-semibold') 
                            : (isLight ? 'text-slate-600' : 'text-gray-400')
                        }`} title={destName}>
                          <span className="sm:hidden">{isReached ? '✅ ' : isCurrent ? '🚚 ' : '📍 '}</span>{destName}
                        </span>
                        <span className={`text-[9px] font-bold shrink-0 ${
                          isReached 
                            ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                            : isCurrent 
                            ? (isLight ? 'text-blue-700' : 'text-blue-400') 
                            : (isLight ? 'text-slate-400' : 'text-gray-500')
                        }`}>
                          {isBoxDeliveryMap ? `${delivered}/${required}` : (isReached ? 'Reached' : isCurrent ? 'Arrived' : 'Pending')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* hover hint */}
              <div className="text-[9px] text-emerald-600 text-right mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                Click to focus <span className="sm:hidden">🔍</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
