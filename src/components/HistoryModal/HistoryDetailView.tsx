import React, { useState } from 'react';
import { HistoryEntry, AlgorithmKey } from './types';
import { useHistoryDetail } from './hooks/useHistoryDetail';
import { BenchmarkTable } from './components/BenchmarkTable';
import { CanvasReplay } from './components/CanvasReplay';
import { WinnerCard } from './components/WinnerCard';
import { AlgorithmMovements } from './components/AlgorithmMovements';
import { PerformanceBarChart } from './components/PerformanceBarChart';
import { SimulationConfig } from './components/SimulationConfig';
import { EventLog } from './components/EventLog';
import { isMultiAlgorithmResult } from './historyUtils';

interface Props {
  entry: HistoryEntry;
  historyTimelineStep: number;
  highlightedNodeId: string | null;
  onSeek: (step: number) => void;
  onHighlight: (nodeId: string | null) => void;
}

export const HistoryDetailView: React.FC<Props> = ({
  entry, historyTimelineStep, highlightedNodeId, onSeek, onHighlight,
}) => {
  const detail = useHistoryDetail(entry, historyTimelineStep);

  const [robotAlgo, setRobotAlgo] = useState<AlgorithmKey>(() => {
    const isMulti =
      !!entry.multiResults ||
      isMultiAlgorithmResult(entry.simResult as unknown) ||
      String(entry.algorithm).toLowerCase().includes('multi');
    return isMulti ? 'bfs' : (entry.algorithm as AlgorithmKey);
  });

  if (!detail) return null;

  const {
    results, entryActiveAlgorithms, baseGraph, allEvents,
    maxEventStep, maxSteps, ultimateMax, currentStep, blockedNodeIds,
    shelfBoxCounts, bfs, dfs, hyb, winner, runnerUp, resolvedMapId,
    blockIcon, clearIcon,
  } = detail;

  const handleEventClick = (nodeId: string) => {
    onHighlight(highlightedNodeId === nodeId ? null : nodeId);
  };

  return (
    <div className="flex flex-col gap-5 p-2 h-full overflow-y-auto max-h-[75vh] pr-1">
      {/* Top row: benchmark table + canvas */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-2 flex flex-col">
          <BenchmarkTable
            bfs={bfs}
            dfs={dfs}
            hyb={hyb}
            entryActiveAlgorithms={entryActiveAlgorithms}
            runNumber={entry.runNumber}
          />
        </div>

        <CanvasReplay
          baseGraph={baseGraph}
          results={results}
          entryActiveAlgorithms={entryActiveAlgorithms}
          currentStep={currentStep}
          ultimateMax={ultimateMax}
          allEvents={allEvents}
          blockedNodeIds={blockedNodeIds}
          highlightedNodeId={highlightedNodeId}
          shelfBoxCounts={shelfBoxCounts}
          resolvedMapId={resolvedMapId}
          scenario={entry.scenario}
          robotAssignments={entry.metadata?.robotAssignments}
          onDeselect={() => onHighlight(null)}
          onSeek={onSeek}
        />

        {/* Campus topology note */}
        {entry.scenario === 'network' && baseGraph?.nodes.some((n: any) => n.id.includes('boys') || n.label?.includes('PC-PT')) && (
          <div className="xl:col-span-5 bg-gray-900/60 border border-indigo-900/50 rounded-xl p-4 flex flex-col gap-2 mt-[-10px]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-bold mb-1">
              Campus Topology Rules Context
            </div>
            <div className="text-[11px] text-gray-300 space-y-2 leading-relaxed">
              <div>
                <p className="text-gray-100 font-semibold mb-0.5">1. Routed Traffic with ACLs</p>
                <ul className="list-disc pl-5 space-y-0.5 text-gray-400">
                  <li>Boys Block can ONLY communicate with AB1.</li>
                  <li>Girls Block can ONLY communicate with AB2.</li>
                  <li>Packets to unauthorized zones are dropped at routers.</li>
                </ul>
              </div>
              <div className="pt-2 border-t border-gray-800">
                <p className="text-gray-100 font-semibold mb-0.5">2. Local Switched Traffic</p>
                <p className="text-gray-400">
                  Yellow Zone shares a single subnet. Traffic flows freely via Layer 2 switching, bypassing ACLs.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <WinnerCard winner={winner} runnerUp={runnerUp} bfs={bfs} dfs={dfs} hyb={hyb} />

      <AlgorithmMovements
        bfs={bfs}
        dfs={dfs}
        hyb={hyb}
        entryActiveAlgorithms={entryActiveAlgorithms}
        winner={winner}
      />

      <PerformanceBarChart
        bfs={bfs}
        dfs={dfs}
        hyb={hyb}
        entryActiveAlgorithms={entryActiveAlgorithms}
      />

      <SimulationConfig
        entry={entry}
        baseGraph={baseGraph}
        resolvedMapId={resolvedMapId}
        robotAlgo={robotAlgo}
        setRobotAlgo={setRobotAlgo}
      />

      <EventLog
        entry={entry}
        results={results}
        allEvents={allEvents}
        currentStep={currentStep}
        maxEventStep={maxEventStep}
        maxSteps={maxSteps}
        highlightedNodeId={highlightedNodeId}
        blockIcon={blockIcon}
        clearIcon={clearIcon}
        onEventClick={handleEventClick}
        onSeek={onSeek}
      />
    </div>
  );
};
