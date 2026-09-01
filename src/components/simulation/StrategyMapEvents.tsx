import React, { useMemo } from 'react';
import { DynamicEvent, SimulationResult, AlgorithmStep } from '../../types';

interface Props {
  dynamicEvents: DynamicEvent[];
  stepIndex: number;
  simResults: { bfs: SimulationResult; dfs: SimulationResult; hybrid: SimulationResult } | null;
  activeAlgorithms: { bfs: boolean; dfs: boolean; hybrid: boolean };
}

// ── Per-algorithm color tokens ───────────────────────────────────────────────
const ALGO_STYLES: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  bfs: {
    label: 'BFS',
    color: 'text-green-300',
    bg: 'bg-green-950/40',
    border: 'border-green-500/40',
    dot: 'bg-green-400',
  },
  dfs: {
    label: 'DFS',
    color: 'text-purple-300',
    bg: 'bg-purple-950/40',
    border: 'border-purple-500/40',
    dot: 'bg-purple-400',
  },
  hybrid: {
    label: 'Hybrid',
    color: 'text-orange-300',
    bg: 'bg-orange-950/30',
    border: 'border-orange-500/40',
    dot: 'bg-orange-400',
  },
};

// ── Compute what each algorithm did in response to a dynamic event ───────────
function getAlgorithmStrategy(
  algorithm: 'bfs' | 'dfs' | 'hybrid',
  event: DynamicEvent,
  simResults: { bfs: SimulationResult; dfs: SimulationResult; hybrid: SimulationResult }
): { action: string; detail: string; severity: 'reroute' | 'unaffected' | 'blocked' | 'phase' } | null {
  const steps = simResults[algorithm].steps;
  if (!steps || steps.length === 0) return null;

  const si = event.stepIndex;

  // Grab windows around the event
  const before = steps.find((s) => s.stepIndex === si - 1) ?? steps[Math.max(0, si - 2)];
  const atEvent = steps.find((s) => s.stepIndex === si) ?? steps[Math.min(steps.length - 1, si)];
  const after = steps.find((s) => s.stepIndex === si + 1) ?? steps[Math.min(steps.length - 1, si + 1)];

  if (!atEvent) return null;

  // Helper: does a step have a node (or edge) on its path?
  const nodeOnPath = (step: AlgorithmStep | undefined, nodeId: string): boolean => {
    if (!step) return false;

    // For Game AI, pathfinders only care about head-on collisions at the active search head (current).
    // Blocks on previously visited nodes or distant frontiers are ignored.
    if (event.label.includes('Opponent')) {
      return step.current === nodeId;
    }

    if (step.path.includes(nodeId) || step.current === nodeId || step.frontier.includes(nodeId)) return true;
    // edge id support (e.g. "a1-a2")
    const parts = nodeId.split(/[-_]/);
    if (parts.length === 2) {
      const [u, v] = parts;
      for (let i = 0; i < step.path.length - 1; i++) {
        if ((step.path[i] === u && step.path[i + 1] === v) || (step.path[i] === v && step.path[i + 1] === u)) {
          return true;
        }
      }
    }
    return false;
  };

  const wasOnPath = nodeOnPath(before, event.nodeId);
  const isOnPath = nodeOnPath(atEvent, event.nodeId);
  const willOnPath = nodeOnPath(after, event.nodeId);

  // 1. Explicit Reaction Detection (Ultimate source of truth)
  // If the algorithm explicitly logged a reaction to this specific node in its phaseLabel, trust it!
  const explicitlyReacted = atEvent?.phaseLabel?.includes(`[${event.nodeId}]`);

  if (explicitlyReacted) {
    if (atEvent.phaseLabel?.includes('Severed')) {
      return {
        action: 'Path Blocked',
        detail: 'Active path collided with opponent; backtracking initiated',
        severity: 'blocked',
      };
    }
    if (atEvent.phaseLabel?.includes('Obstacle') || atEvent.phaseLabel?.includes('Wait')) {
      return {
        action: 'Rerouted',
        detail: 'Opponent detected in frontier; finding alternate path',
        severity: 'reroute',
      };
    }
  }

  // 2. Phase detection (hybrid-specific)
  // Only trigger a phase switch if we are genuinely transitioning between algorithmic modes (e.g., BFS -> DFS)
  const isTruePhaseSwitch =
    algorithm === 'hybrid' &&
    before?.phaseLabel?.includes('Mode:') &&
    atEvent?.phaseLabel?.includes('Mode:') &&
    before.phaseLabel !== atEvent.phaseLabel;

  if (isTruePhaseSwitch) {
    return {
      action: 'Phase Switch',
      detail: `Switched from ${before!.phaseLabel} to ${atEvent.phaseLabel} in response to the event`,
      severity: 'phase',
    };
  }

  if (!event.blocked) {
    // Node/edge restored
    if (!willOnPath && !isOnPath) {
      return { action: 'Restoration Ignored', detail: 'Node restored but not on active path — no recalculation needed', severity: 'unaffected' };
    }
    return { action: 'Path Re-evaluated', detail: 'Detected restored node and updated traversal frontier', severity: 'reroute' };
  }

  // 3. Fallback logic for general path evaluation
  if (!wasOnPath && !isOnPath) {
    return { action: 'Unaffected', detail: 'Blocked node was not part of active path or frontier', severity: 'unaffected' };
  }

  if (wasOnPath && !isOnPath) {
    // Path visibly changed after the event
    const pathLenBefore = before?.path.length ?? 0;
    const pathLenAfter = atEvent?.path.length ?? 0;
    const delta = pathLenAfter - pathLenBefore;
    const deltaStr = delta === 0 ? 'same length' : delta > 0 ? `+${delta} hops longer` : `${Math.abs(delta)} hops shorter`;
    return {
      action: 'Rerouted',
      detail: `Obstacle detected — found alternate path (${deltaStr})`,
      severity: 'reroute',
    };
  }

  if (isOnPath) {
    return {
      action: 'Path Blocked',
      detail: 'Active path ran through the blocked node; backtracking or re-queuing initiated',
      severity: 'blocked',
    };
  }

  return { action: 'Evaluating', detail: 'Obstacle in search frontier; continuing with alternative branches', severity: 'unaffected' };
}

// ── Severity → visual badge ─────────────────────────────────────────────────
const SEVERITY_BADGE: Record<string, string> = {
  reroute: 'bg-blue-900/50 text-blue-300 border-blue-500/40',
  blocked: 'bg-red-900/50 text-red-300 border-red-500/40',
  unaffected: 'bg-gray-800/60 text-gray-400 border-gray-600/40',
  phase: 'bg-yellow-900/50 text-yellow-300 border-yellow-500/40',
};

const SEVERITY_ICON: Record<string, string> = {
  reroute: '🔀',
  blocked: '🚧',
  unaffected: '✔️',
  phase: '⚡',
};

// ── Main Component ───────────────────────────────────────────────────────────
export const StrategyMapEvents: React.FC<Props> = ({ dynamicEvents, stepIndex, simResults, activeAlgorithms }) => {
  const activeStrategyEvents = useMemo(() => {
    if (!simResults) return [];

    const visible = dynamicEvents.filter((e) => e.stepIndex <= stepIndex);

    return visible
      .map((event) => {
        const responses = (['bfs', 'dfs', 'hybrid'] as const)
          .filter(algo => activeAlgorithms[algo])
          .map((algo) => {
            const strategy = getAlgorithmStrategy(algo, event, simResults);
            return strategy ? { algo, ...strategy } : null;
          })
          .filter(Boolean) as { algo: 'bfs' | 'dfs' | 'hybrid'; action: string; detail: string; severity: string }[];

        return { event, responses };
      })
      .filter((entry) => entry.responses.length > 0)
      .reverse(); // newest on top
  }, [dynamicEvents, stepIndex, simResults, activeAlgorithms.bfs, activeAlgorithms.dfs, activeAlgorithms.hybrid]);

  return (
    <div className="glass-panel rounded-xl p-3 flex flex-col shrink-0 fade-in hover:shadow-glow-purple transition-shadow duration-500">
      {/* ── Header ── */}
      <div className="flex items-center mb-2 shrink-0 border-b border-gray-800 pb-2">
        <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <span className="sm:hidden">🧠 </span>Strategy Map Events
        </h3>
      </div>

      <div
        className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2"
        style={{ maxHeight: 320, scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}
      >
        {activeStrategyEvents.length > 0 ? (
          activeStrategyEvents.map(({ event, responses }, idx) => (
            <div
              key={`strategy-${event.stepIndex}-${idx}`}
              className="flex flex-col gap-1.5 p-2.5 rounded-lg border border-gray-700/60 bg-gray-900/40"
            >
              {/* Event title row */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="font-mono text-gray-500 shrink-0">[{event.stepIndex}]</span>
                <span className={`font-semibold ${event.blocked ? 'text-orange-400' : 'text-emerald-400'}`}>
                  <span className="sm:hidden">{event.blocked ? '⚡' : '✅'} </span>{event.label}
                </span>
              </div>

              {/* Per-algorithm strategy rows */}
              <div className="flex flex-col gap-1 pl-1">
                {responses.map(({ algo, action, detail, severity }) => {
                  const style = ALGO_STYLES[algo];
                  return (
                    <div
                      key={algo}
                      className={`flex flex-col gap-0.5 rounded-md border px-2 py-1.5 text-[10px] ${style.bg} ${style.border}`}
                    >
                      {/* Algo label + action badge */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                          <span className={`font-bold font-mono ${style.color}`}>{style.label}</span>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wide ${SEVERITY_BADGE[severity]}`}
                        >
                          {SEVERITY_ICON[severity]} {action}
                        </span>
                      </div>
                      {/* Detail text */}
                      <span className="text-gray-400 pl-3 leading-relaxed">{detail}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-xs text-gray-500 text-center mt-6 italic">
            Algorithm strategies will appear once events are triggered...
          </div>
        )}
      </div>
    </div>
  );
};
