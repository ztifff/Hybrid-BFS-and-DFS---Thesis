import React from 'react';
import { HistoryEntry, AlgorithmKey } from '../types';
import { getEvacuationMapName, getNodeLabelSafe, safeReplace } from '../historyUtils';
import { isMultiAlgorithmResult } from '../historyUtils';
import { useTheme } from '../../../context/ThemeContext';

interface Props {
  entry: HistoryEntry;
  baseGraph: any;
  resolvedMapId: string;
  robotAlgo: AlgorithmKey;
  setRobotAlgo: (algo: AlgorithmKey) => void;
}

export const SimulationConfig: React.FC<Props> = ({
  entry, baseGraph, resolvedMapId, robotAlgo, setRobotAlgo,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const meta = entry.metadata;
  const nodes = baseGraph?.nodes;
  const entryActiveAlgorithms = meta?.activeAlgorithms ?? { bfs: true, dfs: true, hybrid: true };

  if (!meta) {
    return (
      <div className={`rounded-xl p-5 mb-5 border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-gray-900/40 border-gray-800'}`}>
        <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
          No simulation configuration data available for this run.
        </span>
      </div>
    );
  }

  const isBoxDelivery =
    resolvedMapId?.toLowerCase().includes('aws') ||
    resolvedMapId?.toLowerCase().includes('synthetic');

  const robots = Array.isArray(meta.robotAssignments) ? meta.robotAssignments : [];
  const hasRobots = entry.scenario === 'robotics' && robots.length > 0;

  const hasConfig =
    meta.mapId ||
    entry.scenario === 'network' ||
    hasRobots ||
    entry.scenario === 'evacuation' ||
    entry.scenario === 'gameai';

  if (!hasConfig) return null;

  const label = (id: any) => getNodeLabelSafe(id, nodes);

  return (
    <div className={`rounded-xl p-5 mb-5 w-full border ${
      isLight
        ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
        : 'bg-[#0a0f1e] border-blue-900/50 text-white shadow-lg'
    }`}>
      <div className={`flex items-center gap-2 mb-4 pb-3 border-b ${isLight ? 'border-slate-200' : 'border-gray-800'}`}>
        <span className={`font-bold uppercase text-[11px] tracking-[0.15em] ${isLight ? 'text-slate-800' : 'text-gray-200'}`}>
          Simulation Configuration
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-[11px] w-full">
        {meta.mapId && (
          <div className="flex flex-col gap-1.5 w-full">
            <span className={`uppercase tracking-widest text-[9px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-500'}`}>
              Map Selection
            </span>
            <span className={`font-medium capitalize px-3 py-1.5 rounded-md w-full break-words border ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900'
                : 'bg-gray-900 border-gray-700 text-white'
            }`}>
              {entry.scenario === 'evacuation' ? getEvacuationMapName(meta.mapId) : safeReplace(meta.mapId)}
            </span>
          </div>
        )}

        {entry.scenario === 'network' && (
          <>
            <div className="flex flex-col gap-1.5 w-full">
              <span className={`uppercase tracking-widest text-[9px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-500'}`}>
                Routing Mode
              </span>
              <span className={`font-medium capitalize px-3 py-1.5 rounded-md w-full break-words border ${
                isLight
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-900 font-bold'
                  : 'bg-cyan-950/40 border-cyan-900 text-cyan-300'
              }`}>
                {safeReplace(meta.networkRoutingMode)}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <span className={`uppercase tracking-widest text-[9px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-500'}`}>
                Source Device
              </span>
              <span className={`font-mono px-3 py-1.5 rounded-md w-full break-words border ${
                isLight
                  ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                  : 'bg-blue-950/40 border-blue-900 text-blue-400'
              }`}>
                {label(meta.sourceDevice)}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <span className={`uppercase tracking-widest text-[9px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-500'}`}>
                Destinations
              </span>
              <div className={`font-mono px-3 py-1.5 rounded-md w-full max-h-[80px] overflow-y-auto break-words border ${
                isLight
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold'
                  : 'bg-indigo-950/40 border-indigo-900 text-indigo-300'
              }`} style={{ scrollbarWidth: 'thin' }}>
                {Array.isArray(meta.destinationDevices)
                  ? meta.destinationDevices.map((d: any) => label(d)).join(', ')
                  : 'N/A'}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <span className={`uppercase tracking-widest text-[9px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-500'}`}>
                Delivery Style
              </span>
              <span className={`font-medium capitalize px-3 py-1.5 rounded-md w-full break-words border ${
                isLight
                  ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                  : 'bg-purple-950/40 border-purple-900 text-purple-300'
              }`}>
                {meta.deliveryMode || 'N/A'}
              </span>
            </div>
          </>
        )}

        {hasRobots && (
          <>
            <div className="flex flex-col gap-1.5 w-full">
              <span className={`uppercase tracking-widest text-[9px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-500'}`}>
                Active Robots
              </span>
              <span className={`font-medium px-3 py-1.5 rounded-md w-full border ${
                isLight
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                  : 'bg-orange-950/40 border-orange-900 text-orange-300'
              }`}>
                {robots.length} Units
              </span>
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <span className={`uppercase tracking-widest text-[9px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-500'}`}>
                {isBoxDelivery ? 'Total Payload' : 'Total Destinations'}
              </span>
              <span className={`font-medium px-3 py-1.5 rounded-md w-full border ${
                isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                  : 'bg-green-950/40 border-green-900 text-green-300'
              }`}>
                {isBoxDelivery
                  ? robots.reduce((acc: number, r: any) => acc + (r.destinations?.reduce((s: number, d: string) => s + (r.boxCounts?.[d] || 6), 0) || 0), 0) + ' Boxes'
                  : robots.reduce((acc: number, r: any) => acc + (r.destinations?.length || 0), 0) + ' Targets'}
              </span>
            </div>

            {/* Robot Fleet Table */}
            <div className={`col-span-2 md:col-span-4 mt-4 rounded-lg p-4 w-full border ${
              isLight
                ? 'bg-slate-50/80 border-slate-200'
                : 'bg-gray-950/50 border-gray-800'
            }`}>
              <div className={`flex items-center justify-between mb-4 pb-2 border-b ${
                isLight ? 'border-slate-200' : 'border-gray-800'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <h3 className={`font-bold uppercase tracking-widest text-[11px] ${
                    isLight ? 'text-slate-800' : 'text-gray-200'
                  }`}>
                    Robot Fleet Status
                  </h3>
                  {(!!entry.multiResults || isMultiAlgorithmResult(entry.simResult as unknown) || String(entry.algorithm).toLowerCase().includes('multi')) && (
                    <div className={`flex rounded overflow-hidden shadow-inner border ${
                      isLight ? 'bg-slate-200 border-slate-300' : 'bg-gray-900 border-gray-700'
                    }`}>
                      {(['bfs', 'dfs', 'hybrid'] as const).filter(a => entryActiveAlgorithms[a]).map(algo => (
                        <button
                          key={algo}
                          onClick={() => setRobotAlgo(algo)}
                          className={`px-3 py-1 text-[9px] font-bold uppercase transition-colors cursor-pointer ${
                            robotAlgo === algo
                              ? algo === 'bfs'
                                ? 'bg-emerald-600 text-white'
                                : algo === 'dfs'
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-amber-600 text-white'
                              : isLight
                                ? 'text-slate-600 hover:bg-slate-300 hover:text-slate-900'
                                : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
                          }`}
                        >
                          {algo}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] px-2 py-1 rounded border hidden sm:block font-bold ${
                  isLight
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-xs'
                    : 'text-gray-500 bg-gray-900 border-gray-800'
                }`}>
                  Status: ALL DELIVERIES COMPLETED
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {robots.map((r: any, i: number) => {
                  const robotTotalCount = isBoxDelivery
                    ? r.destinations?.reduce((s: number, d: string) => s + (r.boxCounts?.[d] || 6), 0) || 0
                    : r.destinations?.length || 0;

                  const borderColor = isLight
                    ? 'border-slate-200'
                    : robotAlgo === 'bfs'
                      ? 'border-green-900/40'
                      : robotAlgo === 'dfs'
                        ? 'border-purple-900/40'
                        : 'border-orange-900/40';

                  const textColor = isLight
                    ? robotAlgo === 'bfs'
                      ? 'text-emerald-700 font-extrabold'
                      : robotAlgo === 'dfs'
                        ? 'text-purple-700 font-extrabold'
                        : 'text-amber-800 font-extrabold'
                    : robotAlgo === 'bfs'
                      ? 'text-green-400 font-bold'
                      : robotAlgo === 'dfs'
                        ? 'text-purple-400 font-bold'
                        : 'text-orange-400 font-bold';

                  const barColor = robotAlgo === 'bfs'
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                    : robotAlgo === 'dfs'
                      ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                      : 'bg-amber-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]';

                  const badgeColor = robotAlgo === 'bfs'
                    ? 'bg-emerald-600'
                    : robotAlgo === 'dfs'
                      ? 'bg-purple-600'
                      : 'bg-amber-600';

                  return (
                    <div
                      key={i}
                      className={`flex flex-col p-3 rounded-lg border ${borderColor} ${
                        isLight ? 'bg-white shadow-xs' : 'bg-[#0d1326]'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 font-bold">
                          <span className={`text-white px-2 py-0.5 rounded text-[10px] font-bold ${badgeColor}`}>
                            R{i + 1}
                          </span>
                          <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-blue-200'}`}>
                            {label(r.robotId)}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`${textColor} text-[10px]`}>COMPLETED</span>
                          <span className={`text-[9px] font-mono ${isLight ? 'text-slate-500 font-bold' : 'text-gray-500'}`}>
                            {robotTotalCount}/{robotTotalCount} {isBoxDelivery ? 'Boxes' : 'Targets'}
                          </span>
                        </div>
                      </div>

                      <div className={`h-1.5 w-full rounded-full overflow-hidden mb-3 ${isLight ? 'bg-slate-200' : 'bg-gray-800'}`}>
                        <div className={`h-full w-full ${barColor}`} />
                      </div>

                      <div className="flex flex-col gap-1.5 w-full text-[10px]">
                        {r.priorityDest && (
                          <div className={`flex justify-between items-center p-2 rounded border ${
                            isLight
                              ? 'bg-pink-50 border-pink-200 text-pink-900 font-bold'
                              : 'bg-blue-950/50 border-blue-900/50'
                          }`}>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[11px] font-bold ${isLight ? 'text-pink-700' : 'text-pink-400'}`}>Priority:</span>
                              <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-gray-200'}`}>{label(r.priorityDest)}</span>
                            </div>
                            <span className={textColor}>Done</span>
                          </div>
                        )}
                        {r.destinations?.length > 0 && (
                          <div
                            className={`p-2 rounded border flex flex-col gap-1.5 max-h-[100px] overflow-y-auto w-full ${
                              isLight
                                ? 'bg-slate-50 border-slate-200'
                                : 'bg-gray-900/60 border-gray-800'
                            }`}
                            style={{ scrollbarWidth: 'thin' }}
                          >
                            <span className={`uppercase tracking-widest text-[8px] font-bold mb-0.5 ${
                              isLight ? 'text-slate-600' : 'text-gray-500'
                            }`}>
                              Assigned Deliveries
                            </span>
                            {r.destinations.map((d: string, j: number) => {
                              const bCount = r.boxCounts?.[d] || 6;
                              return (
                                <div key={j} className="flex justify-between items-center">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`font-medium truncate max-w-[140px] ${
                                      isLight ? 'text-slate-800 font-semibold' : 'text-gray-300'
                                    }`}>
                                      {label(d)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isBoxDelivery ? (
                                      <span className={`font-mono text-[9px] font-bold ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>
                                        {bCount}/{bCount}
                                      </span>
                                    ) : (
                                      <span className={`${textColor} text-[9px] font-mono font-bold`}>
                                        Reached
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {entry.scenario === 'evacuation' && meta.evacuationSourceId && (
          <div className="flex flex-col gap-1.5 w-full">
            <span className={`uppercase tracking-widest text-[9px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-500'}`}>
              Starting Point (Fire Origin)
            </span>
            <span className={`font-medium px-3 py-1.5 rounded-md w-full truncate border ${
              isLight
                ? 'bg-red-50 border-red-300 text-red-900 font-bold'
                : 'bg-red-950/40 border-red-900 text-red-300'
            }`}>
              {label(meta.evacuationSourceId)}
            </span>
          </div>
        )}

        {entry.scenario === 'gameai' && meta.gameBoard && (
          <div className="flex flex-col gap-1.5 w-full">
            <span className={`uppercase tracking-widest text-[9px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-500'}`}>
              Board Game
            </span>
            <span className={`font-medium capitalize px-3 py-1.5 rounded-md w-full truncate border ${
              isLight
                ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                : 'bg-purple-950/40 border-purple-900 text-purple-300'
            }`}>
              {safeReplace(meta.gameBoard)}
            </span>
          </div>
        )}

        {meta.mapId === 'synthetic' && meta.syntheticSizing && (
          <>
            <div className="flex flex-col gap-1.5 w-full">
              <span className={`uppercase tracking-widest text-[9px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-500'}`}>
                Synthetic Nodes
              </span>
              <span className={`font-medium px-3 py-1.5 rounded-md w-full border ${
                isLight
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                  : 'bg-yellow-950/40 border-yellow-900 text-yellow-300'
              }`}>
                {meta.syntheticSizing.nodes || 0}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <span className={`uppercase tracking-widest text-[9px] font-bold ${isLight ? 'text-slate-600' : 'text-gray-500'}`}>
                Synthetic Edges
              </span>
              <span className={`font-medium px-3 py-1.5 rounded-md w-full border ${
                isLight
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                  : 'bg-yellow-950/40 border-yellow-900 text-yellow-300'
              }`}>
                {meta.syntheticSizing.edges || 0}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
