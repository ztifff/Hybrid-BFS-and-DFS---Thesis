import React, { useState, useEffect } from 'react';
import { RobotAssignment, AlgorithmStep, GraphNode } from '../../types';

interface Props {
  assignments: RobotAssignment[];
  activeSteps: { bfs: AlgorithmStep | null; dfs: AlgorithmStep | null; hybrid: AlgorithmStep | null };
  followAlgo?: 'bfs' | 'dfs' | 'hybrid' | null;
  graphNodes: GraphNode[];
  onRobotClick?: (nodeId: string) => void;
  mapId?: string;
}

const ALGO_CONFIG = {
  bfs:    { name: 'BFS',    barColor: '#22c55e', btnActive: 'bg-emerald-600 text-white',    textColor: 'text-emerald-400' },
  dfs:    { name: 'DFS',    barColor: '#a855f7', btnActive: 'bg-purple-600 text-white',     textColor: 'text-purple-400'  },
  hybrid: { name: 'HYBRID', barColor: '#f97316', btnActive: 'bg-orange-600 text-white',     textColor: 'text-orange-400'  },
} as const;

export const RobotLiveStatusPanel: React.FC<Props> = ({
  assignments,
  activeSteps,
  followAlgo = null,
  graphNodes,
  onRobotClick,
  mapId,
}) => {
  const [selectedAlgo, setSelectedAlgo] = useState<'bfs' | 'dfs' | 'hybrid'>(followAlgo || 'bfs');

  useEffect(() => {
    if (followAlgo) setSelectedAlgo(followAlgo);
  }, [followAlgo]);

  if (!assignments || assignments.length === 0) return null;

  const isAWSWarehouse = mapId === 'aws' || mapId === 'awsWarehouse';
  const activeStep = activeSteps[selectedAlgo] ?? activeSteps.bfs ?? activeSteps.hybrid ?? activeSteps.dfs;
  const nodeMap = new Map(graphNodes.map(n => [n.id, n.label.replace(/\n/g, ' ')]));
  const theme = ALGO_CONFIG[selectedAlgo];

  return (
    <div className="shrink-0 bg-[#0d1224] border border-gray-800 rounded-xl overflow-hidden shadow-lg">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 bg-[#0a0f1e]">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🤖</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-300">
            Robot Fleet Status
          </span>
        </div>

        {/* Algorithm switcher */}
        <div className="flex items-center gap-0.5 bg-gray-900 border border-gray-700 rounded-md p-0.5">
          {(Object.keys(ALGO_CONFIG) as Array<keyof typeof ALGO_CONFIG>).map(key => (
            <button
              key={key}
              onClick={() => setSelectedAlgo(key)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                selectedAlgo === key
                  ? ALGO_CONFIG[key].btnActive
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {ALGO_CONFIG[key].name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Robot Cards ──────────────────────────────────────── */}
      <div className="flex flex-col divide-y divide-gray-800/70 max-h-[45vh] overflow-y-auto">
        {assignments.map((assignment, idx) => {
          const robotName  = nodeMap.get(assignment.robotId) ?? assignment.robotId;

          /* current robot location: look up per-robot position or fallback */
          const locId = activeStep?.robotPositions?.[assignment.robotId]
            ?? (activeStep?.activeRobotId === assignment.robotId ? activeStep.current : null)
            ?? assignment.robotId;
          const locLabel = locId ? (nodeMap.get(locId) ?? locId) : '—';

          let totalRequired = 0;
          let totalDelivered = 0;

          if (isAWSWarehouse) {
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
          let task = 'In Transit';
          if (isDone) {
            task = '✅ Done';
          } else if (activeStep?.phaseLabel?.toLowerCase().includes('congestion')) {
            task = '⏳ Blocked';
          } else if (locId && assignment.destinations.includes(locId)) {
            task = '🚚 Unloading';
          } else if (locId && (locId.startsWith('shelf') || locId.startsWith('clutter'))) {
            task = '📦 Loading';
          } else if (assignment.priorityDest && !isDone) {
            const pLabel = nodeMap.get(assignment.priorityDest) ?? assignment.priorityDest;
            task = `⭐ ${pLabel.length > 12 ? pLabel.slice(0, 12) + '…' : pLabel}`;
          }

          return (
            <div
              key={assignment.robotId}
              onClick={() => locId && onRobotClick?.(locId)}
              className="group px-3 py-2.5 hover:bg-[#131c38] transition-colors cursor-pointer"
              title="Click to focus on this robot on the map"
            >
              {/* Row 1: name + count */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`text-[11px] font-extrabold shrink-0 ${theme.textColor}`}>R{idx + 1}</span>
                  <span className="text-[11px] font-semibold text-gray-200 truncate" title={robotName}>
                    {robotName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-[11px] font-bold text-white tabular-nums">
                    {totalDelivered}<span className="text-gray-500 font-normal">/{totalRequired}</span>
                  </span>
                  <span className={`text-[10px] font-bold tabular-nums ${isDone ? 'text-emerald-400' : 'text-gray-400'}`}>
                    ({percent}%)
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-800 rounded-full h-1.5 mb-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: isDone ? '#4ade80' : theme.barColor,
                  }}
                />
              </div>

              {/* Row 2: current location + task badge */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[10px] group-hover:text-emerald-400 transition-colors shrink-0">🎯</span>
                  <span className="text-[10px] text-gray-400 truncate group-hover:text-gray-200 transition-colors" title={locLabel}>
                    {locLabel}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-indigo-300 shrink-0 whitespace-nowrap">
                  {task}
                </span>
              </div>

              {/* Assigned destinations list for Clinic / non-AWS maps */}
              {!isAWSWarehouse && assignment.destinations.length > 0 && (
                <div className="mt-1 pt-1.5 border-t border-gray-800/60 space-y-1">
                  <div className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">
                    Assigned Destinations:
                  </div>
                  {assignment.destinations.map(destId => {
                    const destName = nodeMap.get(destId) ?? destId;
                    const isReached = activeStep?.foundDestinations?.includes(destId) || (activeStep?.deliveredBoxCounts?.[destId] ?? 0) > 0;
                    const isCurrent = locId === destId;

                    return (
                      <div key={destId} className="flex items-center justify-between text-[10px] pl-1">
                        <span className={`truncate max-w-[170px] ${
                          isReached ? 'text-emerald-300 font-medium' : isCurrent ? 'text-blue-300 font-semibold' : 'text-gray-400'
                        }`} title={destName}>
                          {isReached ? '✅' : isCurrent ? '🚚' : '📍'} {destName}
                        </span>
                        <span className={`text-[9px] font-bold shrink-0 ${
                          isReached ? 'text-emerald-400' : isCurrent ? 'text-blue-400' : 'text-gray-500'
                        }`}>
                          {isReached ? 'Reached' : isCurrent ? 'Arrived' : 'Pending'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* hover hint */}
              <div className="text-[9px] text-emerald-500/70 text-right mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                Click to focus 🔍
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
