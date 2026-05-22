import React, { useMemo } from 'react';
import type { AlgorithmStep, DynamicEvent, SimulationResult } from '../types';

interface ActivityLogItem {
  step: number;
  text: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

interface Props {
  dynamicEvents: DynamicEvent[];
  stepIndex: number;
  simResults: { bfs: SimulationResult; dfs: SimulationResult; hybrid: SimulationResult } | null;
}

const ALGORITHM_LABELS: Record<string, string> = {
  bfs: 'BFS',
  dfs: 'DFS',
  hybrid: 'Hybrid'
};

function didAlgorithmReroute(
  algorithm: 'bfs' | 'dfs' | 'hybrid',
  event: DynamicEvent,
  simResults: { bfs: SimulationResult; dfs: SimulationResult; hybrid: SimulationResult }
) {
  const steps = simResults[algorithm].steps;
  const previous = steps.find((step) => step.stepIndex === event.stepIndex - 1);
  const current = steps.find((step) => step.stepIndex === event.stepIndex);
  const next = steps.find((step) => step.stepIndex === event.stepIndex + 1);

  const wasOnPath = (step?: AlgorithmStep | undefined) =>
    !!step && (step.path.includes(event.nodeId) || step.current === event.nodeId);

  if (!current) return false;
  if (wasOnPath(current)) return true;
  if (previous && wasOnPath(previous) && !wasOnPath(current)) return true;
  if (next && wasOnPath(current) && !wasOnPath(next)) return true;
  return false;
}

export const GlobalEnvironmentLog: React.FC<Props> = ({ dynamicEvents, stepIndex, simResults }) => {
  const visibleActivityLogs = useMemo(() => {
    const logs: ActivityLogItem[] = [];
    const reportedBlocks = new Set<string>();
    const rerouteReported = new Set<string>();

    dynamicEvents.forEach((event) => {
      if (event.blocked && !reportedBlocks.has(event.nodeId)) {
        reportedBlocks.add(event.nodeId);
        logs.push({
          step: event.stepIndex,
          text: `⚠️ Environmental Change: Hazard detected at ${event.label}`,
          type: 'warning'
        });

        if (simResults) {
          (['bfs', 'dfs', 'hybrid'] as const).forEach((algorithm) => {
            if (didAlgorithmReroute(algorithm, event, simResults)) {
              const key = `${event.stepIndex}-${algorithm}-${event.nodeId}`;
              if (!rerouteReported.has(key)) {
                rerouteReported.add(key);
                logs.push({
                  step: event.stepIndex,
                  text: `⚠️ ${ALGORITHM_LABELS[algorithm]} blocked at ${event.label} and rerouted`,
                  type: 'warning'
                });
              }
            }
          });
        }
      } else if (!event.blocked && reportedBlocks.has(event.nodeId)) {
        reportedBlocks.delete(event.nodeId);
        logs.push({
          step: event.stepIndex,
          text: `✅ Environmental Change: Route restored at ${event.label}`,
          type: 'success'
        });
      }
    });

    return logs
      .filter((log) => log.step <= stepIndex - 1)
      .slice(-100)
      .reverse();
  }, [dynamicEvents, stepIndex, simResults]);

  return (
    <div className="bg-[#0d1224] border border-gray-700 rounded-xl p-3 flex flex-col shadow-inner shrink-0 h-[220px]">
      <div className="flex justify-between items-center mb-2 shrink-0 border-b border-gray-800 pb-2">
        <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Global Environment Log
        </h3>
      </div>

      <div
        className="flex-1 overflow-y-auto pr-1 space-y-2 flex flex-col"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}
      >
        {visibleActivityLogs.length > 0 ? (
          visibleActivityLogs.map((log, index) => (
            <div
              key={`${log.step}-${index}`}
              className={`text-[11px] p-2 rounded border transition-all ${
                log.type === 'success'
                  ? 'border-green-500/30 bg-green-900/20 text-green-300'
                  : log.type === 'error'
                  ? 'border-red-500/30 bg-red-900/20 text-red-400 font-bold'
                  : log.type === 'warning'
                  ? 'border-orange-500/30 bg-orange-900/20 text-orange-300 font-semibold'
                  : 'border-gray-700 bg-gray-800/50 text-gray-300'
              }`}
            >
              <span className="opacity-50 mr-1 font-mono">[{log.step}]</span>
              {log.text}
            </div>
          ))
        ) : (
          <div className="text-xs text-gray-500 text-center mt-6 italic">
            Awaiting algorithm initiation...
          </div>
        )}
      </div>
    </div>
  );
};
