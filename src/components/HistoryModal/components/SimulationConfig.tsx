import React from 'react';
import { HistoryEntry, AlgorithmKey } from '../types';
import { getEvacuationMapName, getNodeLabelSafe, safeReplace } from '../historyUtils';
import { isMultiAlgorithmResult } from '../historyUtils';

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
  const meta = entry.metadata;
  const nodes = baseGraph?.nodes;
  const entryActiveAlgorithms = meta?.activeAlgorithms ?? { bfs: true, dfs: true, hybrid: true };

  if (!meta) {
    return (
      <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 mb-5 shadow-inner">
        <span className="text-gray-500 text-xs font-mono">
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
    <div className="bg-[#0a0f1e] border border-blue-900/50 rounded-xl p-5 mb-5 shadow-lg w-full">
      <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-3">

        <span className="font-bold text-gray-200 uppercase text-[11px] tracking-[0.15em]">
          Simulation Configuration
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-[11px] w-full">
        {meta.mapId && (
          <div className="flex flex-col gap-1.5 w-full">
            <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Map Selection</span>
            <span className="text-white font-medium capitalize bg-gray-900 border border-gray-700 px-3 py-1.5 rounded-md w-full break-words">
              {entry.scenario === 'evacuation' ? getEvacuationMapName(meta.mapId) : safeReplace(meta.mapId)}
            </span>
          </div>
        )}

        {entry.scenario === 'network' && (
          <>
            <div className="flex flex-col gap-1.5 w-full">
              <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Routing Mode</span>
              <span className="text-cyan-300 font-medium capitalize bg-cyan-950/40 border border-cyan-900 px-3 py-1.5 rounded-md w-full break-words">
                {safeReplace(meta.networkRoutingMode)}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Source Device</span>
              <span className="text-blue-400 font-mono bg-blue-950/40 border border-blue-900 px-3 py-1.5 rounded-md w-full break-words">
                {label(meta.sourceDevice)}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Destinations</span>
              <div className="text-indigo-300 font-mono bg-indigo-950/40 border border-indigo-900 px-3 py-1.5 rounded-md w-full max-h-[80px] overflow-y-auto break-words" style={{ scrollbarWidth: 'thin' }}>
                {Array.isArray(meta.destinationDevices)
                  ? meta.destinationDevices.map((d: any) => label(d)).join(', ')
                  : 'N/A'}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Delivery Style</span>
              <span className="text-purple-300 font-medium capitalize bg-purple-950/40 border border-purple-900 px-3 py-1.5 rounded-md w-full break-words">
                {meta.deliveryMode || 'N/A'}
              </span>
            </div>
          </>
        )}

        {hasRobots && (
          <>
            <div className="flex flex-col gap-1.5 w-full">
              <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Active Robots</span>
              <span className="text-orange-300 font-medium bg-orange-950/40 border border-orange-900 px-3 py-1.5 rounded-md w-full">
                {robots.length} Units
              </span>
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">
                {isBoxDelivery ? 'Total Payload' : 'Total Destinations'}
              </span>
              <span className="text-green-300 font-medium bg-green-950/40 border border-green-900 px-3 py-1.5 rounded-md w-full">
                {isBoxDelivery
                  ? robots.reduce((acc: number, r: any) => acc + (r.destinations?.reduce((s: number, d: string) => s + (r.boxCounts?.[d] || 6), 0) || 0), 0) + ' Boxes'
                  : robots.reduce((acc: number, r: any) => acc + (r.destinations?.length || 0), 0) + ' Targets'}
              </span>
            </div>

            {/* Robot Fleet Table */}
            <div className="col-span-2 md:col-span-4 mt-4 bg-gray-950/50 border border-gray-800 rounded-lg p-4 w-full">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <h3 className="font-bold text-gray-200 uppercase tracking-widest text-[11px]">Robot Fleet Status</h3>
                  {(!!entry.multiResults || isMultiAlgorithmResult(entry.simResult as unknown) || String(entry.algorithm).toLowerCase().includes('multi')) && (
                    <div className="flex bg-gray-900 border border-gray-700 rounded overflow-hidden shadow-inner">
                      {(['bfs', 'dfs', 'hybrid'] as const).filter(a => entryActiveAlgorithms[a]).map(algo => (
                        <button
                          key={algo}
                          onClick={() => setRobotAlgo(algo)}
                          className={`px-3 py-1 text-[9px] font-bold uppercase transition-colors ${
                            robotAlgo === algo
                              ? algo === 'bfs' ? 'bg-green-600 text-white' : algo === 'dfs' ? 'bg-purple-600 text-white' : 'bg-orange-600 text-white'
                              : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
                          }`}
                        >
                          {algo}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800 hidden sm:block">
                  Status: ALL DELIVERIES COMPLETED
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {robots.map((r: any, i: number) => {
                  const robotTotalCount = isBoxDelivery
                    ? r.destinations?.reduce((s: number, d: string) => s + (r.boxCounts?.[d] || 6), 0) || 0
                    : r.destinations?.length || 0;

                  const borderColor = robotAlgo === 'bfs' ? 'border-green-900/40' : robotAlgo === 'dfs' ? 'border-purple-900/40' : 'border-orange-900/40';
                  const textColor   = robotAlgo === 'bfs' ? 'text-green-400'  : robotAlgo === 'dfs' ? 'text-purple-400'  : 'text-orange-400';
                  const barColor    = robotAlgo === 'bfs' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : robotAlgo === 'dfs' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]';
                  const badgeColor  = robotAlgo === 'bfs' ? 'bg-green-600'  : robotAlgo === 'dfs' ? 'bg-purple-600'  : 'bg-orange-600';

                  return (
                    <div key={i} className={`flex flex-col bg-[#0d1326] p-3 rounded-lg border ${borderColor}`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 font-bold">
                          <span className={`text-white px-2 py-0.5 rounded text-[10px] ${badgeColor}`}>R{i + 1}</span>
                          <span className="text-blue-200 text-xs">{label(r.robotId)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`${textColor} font-bold text-[10px]`}>COMPLETED</span>
                          <span className="text-gray-500 text-[9px] font-mono">{robotTotalCount}/{robotTotalCount} {isBoxDelivery ? 'Boxes' : 'Targets'}</span>
                        </div>
                      </div>

                      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden mb-3">
                        <div className={`h-full w-full ${barColor}`} />
                      </div>

                      <div className="flex flex-col gap-1.5 w-full text-[10px]">
                        {r.priorityDest && (
                          <div className="flex justify-between items-center bg-blue-950/50 p-2 rounded border border-blue-900/50">
                            <div className="flex items-center gap-1.5">
                              <span className="text-pink-400 text-[11px]">Priority:</span>
                              <span className="text-gray-200 font-medium">{label(r.priorityDest)}</span>
                            </div>
                            <span className={textColor}>Done</span>
                          </div>
                        )}
                        {r.destinations?.length > 0 && (
                          <div className="bg-gray-900/60 p-2 rounded border border-gray-800 flex flex-col gap-1.5 max-h-[100px] overflow-y-auto w-full" style={{ scrollbarWidth: 'thin' }}>
                            <span className="text-gray-500 uppercase tracking-widest text-[8px] font-bold mb-0.5">Assigned Deliveries</span>
                            {r.destinations.map((d: string, j: number) => {
                              const bCount = r.boxCounts?.[d] || 6;
                              return (
                                <div key={j} className="flex justify-between items-center">
                                  <div className="flex items-center gap-1.5">

                                    <span className="text-gray-300 font-medium truncate max-w-[140px]">{label(d)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isBoxDelivery
                                      ? <span className="text-gray-400 font-mono text-[9px]">{bCount}/{bCount}</span>
                                      : <span className={`${textColor} opacity-80 text-[9px] font-mono`}>Reached</span>}
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
            <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Starting Point (Fire Origin)</span>
            <span className="text-red-300 font-medium bg-red-950/40 border border-red-900 px-3 py-1.5 rounded-md w-full truncate">
              {label(meta.evacuationSourceId)}
            </span>
          </div>
        )}

        {entry.scenario === 'gameai' && meta.gameBoard && (
          <div className="flex flex-col gap-1.5 w-full">
            <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Board Game</span>
            <span className="text-purple-300 font-medium capitalize bg-purple-950/40 border border-purple-900 px-3 py-1.5 rounded-md w-full truncate">
              {safeReplace(meta.gameBoard)}
            </span>
          </div>
        )}

        {meta.mapId === 'synthetic' && meta.syntheticSizing && (
          <>
            <div className="flex flex-col gap-1.5 w-full">
              <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Synthetic Nodes</span>
              <span className="text-yellow-300 font-medium bg-yellow-950/40 border border-yellow-900 px-3 py-1.5 rounded-md w-full">
                {meta.syntheticSizing.nodes || 0}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Synthetic Edges</span>
              <span className="text-yellow-300 font-medium bg-yellow-950/40 border border-yellow-900 px-3 py-1.5 rounded-md w-full">
                {meta.syntheticSizing.edges || 0}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
