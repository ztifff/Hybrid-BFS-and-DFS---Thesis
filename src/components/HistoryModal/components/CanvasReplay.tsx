import React from 'react';
import { ScenarioType } from '../../../types';
import { NetworkCanvas } from '../../NetworkCanvas';
import { HistoryResults } from '../types';

interface Props {
  baseGraph: any;
  results: HistoryResults;
  entryActiveAlgorithms: { bfs: boolean; dfs: boolean; hybrid: boolean };
  currentStep: number;
  ultimateMax: number;
  allEvents: any[];
  blockedNodeIds: Set<string>;
  highlightedNodeId: string | null;
  shelfBoxCounts: Map<string, number>;
  resolvedMapId: string;
  scenario: ScenarioType;
  robotAssignments?: any[];
  onDeselect: () => void;
  onSeek: (step: number) => void;
}

export const CanvasReplay: React.FC<Props> = ({
  baseGraph,
  results,
  entryActiveAlgorithms,
  currentStep,
  ultimateMax,
  allEvents,
  blockedNodeIds,
  highlightedNodeId,
  shelfBoxCounts,
  resolvedMapId,
  scenario,
  robotAssignments,
  onDeselect,
  onSeek,
}) => {
  const fallbackRobotAssignments = robotAssignments ??
    baseGraph?.nodes
      .filter((n: any) => n.type === 'depot')
      .map((d: any) => ({
        robotId: d.id,
        destinations: baseGraph.nodes
          .filter((n: any) => n.id.startsWith('dest_') || n.type === 'shelf')
          .map((n: any) => n.id),
        boxCounts: baseGraph.nodes
          .filter((n: any) => n.id.startsWith('dest_') || n.type === 'shelf')
          .reduce((acc: any, n: any) => ({ ...acc, [n.id]: 6 }), {}),
      }));

  return (
    <div className="xl:col-span-3 h-[390px] xl:h-[390px] w-full bg-[#0a0f1e] rounded-xl border border-gray-800 overflow-hidden shadow-inner flex flex-col">
      <div className="flex-1 relative overflow-hidden">
        {baseGraph && (
          <NetworkCanvas
            graph={baseGraph}
            activeSteps={{
              bfs:    entryActiveAlgorithms.bfs    && results.bfs?.steps?.length    ? results.bfs.steps[Math.min(currentStep, results.bfs.steps.length - 1)]       : null,
              dfs:    entryActiveAlgorithms.dfs    && results.dfs?.steps?.length    ? results.dfs.steps[Math.min(currentStep, results.dfs.steps.length - 1)]       : null,
              hybrid: entryActiveAlgorithms.hybrid && results.hybrid?.steps?.length ? results.hybrid.steps[Math.min(currentStep, results.hybrid.steps.length - 1)] : null,
            }}
            scenario={scenario}
            stepIndex={currentStep}
            dynamicEvents={allEvents}
            historicalBlockedNodeIds={blockedNodeIds}
            highlightedNodeId={highlightedNodeId}
            onDeselect={onDeselect}
            autoFit={true}
            activeAlgorithms={entryActiveAlgorithms}
            shelfBoxCounts={shelfBoxCounts}
            disableSimultaneousMode={true}
            mapId={resolvedMapId}
            robotAssignments={fallbackRobotAssignments}
          />
        )}
      </div>

      {/* Event Replay slider */}
      <div className="h-10 bg-gray-900 border-t border-gray-800 flex items-center px-4 gap-3 shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.3)] z-10">
        <span
          className="text-[9px] font-bold tracking-widest text-gray-500 uppercase shrink-0 cursor-help"
          title="Replays dynamic events (e.g., blockages). This does not replay individual algorithm pathfinding steps."
        >
          Event Replay
        </span>
        <input
          type="range"
          min="0"
          max={ultimateMax}
          value={currentStep}
          onChange={e => onSeek(Number(e.target.value))}
          className="flex-1 accent-indigo-500 h-1 cursor-pointer bg-gray-800 rounded-lg appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-indigo-300 [&::-webkit-slider-thumb]:transition-all"
        />
        <span
          className="text-[10px] font-mono text-indigo-400 font-bold shrink-0 text-right w-16"
          title="Simulation Tick (Total Events / Time)"
        >
          Tick {currentStep}
        </span>
      </div>
    </div>
  );
};
