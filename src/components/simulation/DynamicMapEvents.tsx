import React, { useMemo } from 'react';
import { DynamicEvent, SimulationResult } from '../../types';

interface Props {
  dynamicEvents: DynamicEvent[];
  stepIndex: number;
  simResults: { bfs: SimulationResult; dfs: SimulationResult; hybrid: SimulationResult } | null;
  scenario?: string;
  onEventClick?: (nodeId: string) => void;
  highlightedNodeId?: string | null;
  mapId?: string;
  activeAlgorithms?: { bfs: boolean; dfs: boolean; hybrid: boolean };
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
  
  // Find the closest steps near the event index
  // We scan a small window around the event step to handle offset step indices
  const windowStart = Math.max(0, event.stepIndex - 2);
  const windowEnd = event.stepIndex + 3;

  const stepsInWindow = steps.filter(s => s.stepIndex >= windowStart && s.stepIndex <= windowEnd);
  const stepsAfterWindow = steps.filter(s => s.stepIndex > event.stepIndex && s.stepIndex <= event.stepIndex + 5);

  const nodeId = event.nodeId;
  
  // Check if the node was on an active path or explored BEFORE the event
  const wasActiveBeforeEvent = stepsInWindow.some(step => {
    if (step.stepIndex > event.stepIndex) return false;
    return (
      step.path.includes(nodeId) ||
      step.current === nodeId ||
      step.explored.includes(nodeId) ||
      step.frontier.includes(nodeId)
    );
  });

  if (!wasActiveBeforeEvent) return false;

  // Check if a sever happened: node disappears from explored/path after the event,
  // OR the path changes significantly, OR a sever phaseLabel is detected
  const wasSevered = stepsAfterWindow.some(step => {
    // Direct sever label detection
    if (step.phaseLabel?.toLowerCase().includes('sever')) return true;
    // Node was removed from explored (the most reliable signal of a true sever)
    if (!step.explored.includes(nodeId) && !step.path.includes(nodeId)) return true;
    return false;
  });

  // Also catch the case where the node was on the path before and the path changed
  const pathBeforeEvent = stepsInWindow.filter(s => s.stepIndex <= event.stepIndex).pop()?.path ?? [];
  const pathAfterEvent = stepsAfterWindow[0]?.path ?? [];
  const pathChanged = pathBeforeEvent.includes(nodeId) && !pathAfterEvent.includes(nodeId);

  return wasSevered || pathChanged;
}

export const DynamicMapEvents: React.FC<Props> = ({ dynamicEvents, stepIndex, simResults, scenario, onEventClick, highlightedNodeId, mapId, activeAlgorithms }) => {
  // Scenario-specific icons that match what's shown on the canvas
  const BLOCK_ICON: Record<string, string> = {
    traffic: '🚫', // 🚫 Road Closure
    evacuation: '⛔', // ⛔ 
    robotics: '🚧', // 🚧 Blocked Aisle
    network: '💥', // 💥 Failed Component
    gameai: mapId === 'dama' ? '🔻' : '🔴', // 🔻 Dama / 🔴 Checkers
  };
  const CLEAR_ICON: Record<string, string> = {
    traffic: '✅', // ✅ Reopened
    evacuation: '🟢', // 🟢 Extinguished
    robotics: '✅', // ✅ Cleared
    network: '⚡', // ⚡ Restored
    gameai: '✅', // ✅ Retreats
  };
  const blockIcon = BLOCK_ICON[scenario ?? ''] ?? '⛔';
  const clearIcon = CLEAR_ICON[scenario ?? ''] ?? '✅';
  // Process and enrich events with active path disruption details
  const activeEvents = useMemo(() => {
    const visibleEvents = dynamicEvents.filter((event) => event.stepIndex <= stepIndex);

    return visibleEvents.map((event) => {
      const affectedAlgorithms: string[] = [];

      // Only cross-examine algorithm reroutes for blocking events in the Network scenario
      // (This avoids an expensive O(N^2) array lookup freeze on massive maps like Cabuyao)
      if (scenario === 'network' && event.blocked && simResults) {
        (['bfs', 'dfs', 'hybrid'] as const).forEach((algorithm) => {
          if ((!activeAlgorithms || activeAlgorithms[algorithm]) && didAlgorithmReroute(algorithm, event, simResults)) {
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
    <div className="glass-panel rounded-xl p-3 flex flex-col shrink-0 h-[360px] fade-in hover:shadow-glow-purple transition-shadow duration-500">
      <div className="flex items-center mb-2 shrink-0 border-b border-gray-800 pb-2">
        <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
          Dynamic Map Events
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
                className={`text-[11px] p-2 rounded border transition-all flex flex-col gap-1 cursor-pointer select-none ${isHighlighted
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
                {event.blocked && event.affectedAlgorithms.length > 0 && scenario === 'network' && (
                  <div className="mt-1 pl-5 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="text-red-400 font-semibold">Path Severed:</span>
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