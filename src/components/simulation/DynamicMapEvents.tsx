import React, { useMemo } from 'react';
import { DynamicEvent, SimulationResult, AlgorithmStep } from '../../types';

interface Props {
  dynamicEvents: DynamicEvent[];
  stepIndex: number;
  simResults: { bfs: SimulationResult; dfs: SimulationResult; hybrid: SimulationResult } | null;
  scenario?: string;
  onEventClick?: (nodeId: string) => void;
  highlightedNodeId?: string | null;
  mapId?: string;
}

const ALGORITHM_LABELS: Record<string, string> = {
  bfs: 'BFS',
  dfs: 'DFS',
  hybrid: 'Hybrid'
};

// Helper function to check if an incident disrupted an algorithm's computed path
function didAlgorithmReroute(
  algorithm: 'bfs' | 'dfs' | 'hybrid',
  event: DynamicEvent,
  simResults: { bfs: SimulationResult; dfs: SimulationResult; hybrid: SimulationResult }
) {
  const steps = simResults[algorithm].steps;
  const previous = steps.find((step) => step.stepIndex === event.stepIndex - 1);
  const current = steps.find((step) => step.stepIndex === event.stepIndex);
  const next = steps.find((step) => step.stepIndex === event.stepIndex + 1);

  const wasOnPath = (step?: AlgorithmStep) => {
    if (!step) return false;
    
    if (
      step.path.includes(event.nodeId) || 
      step.current === event.nodeId ||
      step.explored.includes(event.nodeId) ||
      step.frontier.includes(event.nodeId)
    ) return true;
    
    const parts = event.nodeId.split(/[-_]/);
    if (parts.length === 2) {
      const [u, v] = parts;
      for (let i = 0; i < step.path.length - 1; i++) {
        if ((step.path[i] === u && step.path[i+1] === v) || 
            (step.path[i] === v && step.path[i+1] === u)) {
          return true;
        }
      }
    }
    
    return false;
  };

  if (!current) return false;
  if (wasOnPath(current)) return true;
  if (previous && wasOnPath(previous) && !wasOnPath(current)) return true;
  if (next && wasOnPath(current) && !wasOnPath(next)) return true;
  return false;
}

export const DynamicMapEvents: React.FC<Props> = ({ dynamicEvents, stepIndex, simResults, scenario, onEventClick, highlightedNodeId, mapId }) => {
  // Scenario-specific icons that match what's shown on the canvas
  const BLOCK_ICON: Record<string, string> = {
    traffic:    '🚫', // 🚫 Road Closure
    evacuation: '🔥', // 🔥 Fire
    robotics:   '🚧', // 🚧 Blocked Aisle
    network:    '💥', // 💥 Failed Component
    gameai:     mapId === 'dama' ? '🔻' : '🔴', // 🔻 Dama / 🔴 Checkers
  };
  const CLEAR_ICON: Record<string, string> = {
    traffic:    '✅', // ✅ Reopened
    evacuation: '🟢', // 🟢 Extinguished
    robotics:   '✅', // ✅ Cleared
    network:    '⚡', // ⚡ Restored
    gameai:     '✅', // ✅ Retreats
  };
  const blockIcon = BLOCK_ICON[scenario ?? ''] ?? '⛔';
  const clearIcon = CLEAR_ICON[scenario ?? ''] ?? '✅';
  // Process and enrich events with active path disruption details
  const activeEvents = useMemo(() => {
    const visibleEvents = dynamicEvents.filter((event) => event.stepIndex <= stepIndex);

    return visibleEvents.map((event) => {
      const affectedAlgorithms: string[] = [];

      // Only cross-examine algorithm reroutes for blocking events
      if (event.blocked && simResults) {
        (['bfs', 'dfs', 'hybrid'] as const).forEach((algorithm) => {
          if (didAlgorithmReroute(algorithm, event, simResults)) {
            affectedAlgorithms.push(ALGORITHM_LABELS[algorithm]);
          }
        });
      }

      return {
        ...event,
        affectedAlgorithms
      };
    }).reverse(); // Display latest events on top
  }, [dynamicEvents, stepIndex, simResults]);

  return (
    <div className="bg-[#0d1224] border border-gray-700 rounded-xl p-3 flex flex-col shadow-inner shrink-0 h-[360px]">
      <div className="flex items-center mb-2 shrink-0 border-b border-gray-800 pb-2">
        <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
          📅 Dynamic Map Events
        </h3>
      </div>

      <div
        className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}
      >
        {activeEvents.length > 0 ? (
          activeEvents.map((event, index) => {
            const isHighlighted = highlightedNodeId === event.nodeId;
            return (
              <div
                key={`${event.stepIndex}-${index}`}
                onClick={() => onEventClick?.(event.nodeId)}
                title="Click to locate on map"
                className={`text-[11px] p-2 rounded border transition-all flex flex-col gap-1 cursor-pointer select-none ${
                  isHighlighted
                    ? 'border-yellow-400 bg-yellow-900/30 shadow-[0_0_8px_rgba(234,179,8,0.4)] scale-[1.01]'
                    : event.blocked
                      ? 'border-orange-500/50 bg-orange-900/20 text-orange-300 hover:border-orange-400 hover:bg-orange-900/30'
                      : 'border-green-500/50 bg-green-900/20 text-green-300 hover:border-green-400 hover:bg-green-900/30'
                }`}
              >
                <div className="flex items-start gap-1">
                  <span className="font-mono opacity-60 shrink-0">[{event.stepIndex}]</span>
                  <span>{event.blocked ? blockIcon : clearIcon} {event.label}</span>
                </div>

                {/* 🧠 Mixed Intelligence: If an algorithm was compromised, display badges contextually right inside the incident card */}
                {event.blocked && event.affectedAlgorithms.length > 0 && scenario !== 'gameai' && (
                  <div className="mt-1 pl-5 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="text-red-400 font-semibold">🚨 Path Severed:</span>
                    {event.affectedAlgorithms.map((algo) => (
                      <span 
                        key={algo} 
                        className="px-1.5 py-0.5 rounded border border-red-500/30 bg-red-950/40 text-red-300 font-mono font-bold"
                      >
                        {algo}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-xs text-gray-500 text-center mt-6 italic">
            No map events triggered yet...
          </div>
        )}
      </div>
    </div>
  );
};
