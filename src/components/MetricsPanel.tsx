import React from 'react';
import { PerformanceMetrics, AlgorithmType, ScenarioType, DynamicEvent } from '../types';
import { getAlgorithm, getScenario } from '../config/scenarios';

interface Props {
  metrics: PerformanceMetrics | null;
  algorithm: AlgorithmType;
  scenario: ScenarioType;
  status: 'idle' | 'running' | 'done' | 'paused';
  stepIndex: number;
  totalSteps: number;
  currentExplored: number;
  currentPath: number;
  phaseLabel?: string;
  totalNodes?: number;
  dynamicEvents?: DynamicEvent[];
  optimalPathLength?: number;
}

const statusColors: Record<string, string> = {
  idle:    'bg-gray-600 text-gray-200',
  running: 'bg-green-600 text-white',
  done:    'bg-blue-600 text-white',
  paused:  'bg-yellow-600 text-white',
};

const statusLabels: Record<string, string> = {
  idle:    'IDLE',
  running: 'RUNNING',
  done:    'COMPLETE',
  paused:  'PAUSED',
};

const METRIC_CONFIG: Record<ScenarioType, {
  exploredLabel: string; exploredIcon: string;
  pathLabel: string; pathIcon: string;
  latencyLabel: string; latencyUnit: string; latencyIcon: string;
}> = {
  network: {
    exploredLabel: 'Nodes Visited',   exploredIcon: '📡',
    pathLabel: 'Hops to Target',      pathIcon: '🔀',
    latencyLabel: 'Path Latency',     latencyUnit: 'ms', latencyIcon: '⚡',
  },
  robotics: {
    exploredLabel: 'Nodes Visited',   exploredIcon: '🤖',
    pathLabel: 'Steps to Bay',        pathIcon: '📦',
    latencyLabel: 'Travel Distance',  latencyUnit: 'm',  latencyIcon: '📏',
  },
  traffic: {
    exploredLabel: 'Roads Checked',   exploredIcon: '🚦',
    pathLabel: 'Route Segments',      pathIcon: '🛣️',
    latencyLabel: 'Travel Time',      latencyUnit: 'Min', latencyIcon: '⏱️',
  },
  evacuation: {
    exploredLabel: 'Areas Searched',  exploredIcon: '🚶',
    pathLabel: 'Steps to Exit',       pathIcon: '🚪',
    latencyLabel: 'Evacuation Time',  latencyUnit: 's', latencyIcon: '🔥',
  },
  gameai: {
    exploredLabel: 'Rooms Explored',  exploredIcon: '🏛️',
    pathLabel: 'Moves to Portal',     pathIcon: '🌀',
    latencyLabel: 'Move Cost',        latencyUnit: 'pt', latencyIcon: '⚔️',
  },
};

// ✅ EXPORTED and FIXED to cap at 100%
export function getPathOptimality(
  actualHops: number,
  optimalHops?: number
): { ratio: number; label: string; color: string } {
  if (!optimalHops || optimalHops === 0 || actualHops === 0) {
    return { ratio: 0, label: 'N/A', color: '#64748b' };
  }
  
  const ratio = Math.min(1, optimalHops / actualHops); 
  const percentage = (ratio * 100).toFixed(1);
  
  if (ratio >= 0.95) {
    return { ratio, label: `${percentage}% (Optimal)`, color: '#22c55e' };
  } else if (ratio >= 0.8) {
    return { ratio, label: `${percentage}% (Near-Optimal)`, color: '#84cc16' };
  } else if (ratio >= 0.6) {
    return { ratio, label: `${percentage}% (Acceptable)`, color: '#eab308' };
  } else {
    return { ratio, label: `${percentage}% (Suboptimal)`, color: '#ef4444' };
  }
}

// ✅ EXPORTED
export function getCompletionRate(
  explored: number,
  totalNodes?: number
): { percentage: number; label: string } {
  if (!totalNodes || totalNodes === 0) {
    return { percentage: 0, label: 'N/A' };
  }
  
  const percentage = Math.min(100, (explored / totalNodes) * 100);
  return { percentage, label: `${percentage.toFixed(1)}%` };
}

// ✅ EXPORTED
export function getMemoryInMB(memoryKB: number): string {
  const memoryMB = memoryKB / 1024;
  return memoryMB >= 1 
    ? `${memoryMB.toFixed(2)} MB` 
    : `${memoryKB.toFixed(1)} KB`;
}

// ✅ EXPORTED
export function getAdaptabilityScore(
  status: 'idle' | 'running' | 'done' | 'paused',
  metrics: PerformanceMetrics | null,
  algorithm: AlgorithmType,
  dynamicEvents?: DynamicEvent[]
): { score: number; label: string; color: string } {
  if (status !== 'done' || !metrics) {
    return { score: 0, label: 'Calculating...', color: '#64748b' };
  }
  
  const eventCount = dynamicEvents?.length ?? 0;
  let score = metrics.exitFound ? 50 : 0;
  
  if (eventCount > 0) {
    const eventBonus = Math.min(40, eventCount * 10);
    score += metrics.exitFound ? eventBonus : Math.floor(eventBonus / 3);
    
    if (algorithm === 'hybrid' && metrics.exitFound) {
      score += 10;
    } else if (algorithm === 'bfs' && metrics.exitFound) {
      score += 5;
    }
  } else {
    score = metrics.exitFound ? 85 : 15;
  }
  
  if (metrics.pathLength > 0 && metrics.totalLatency > 0) {
    const efficiencyBonus = Math.min(10, (1 / metrics.pathLength) * 20);
    score += Math.floor(efficiencyBonus);
  }
  
  score = Math.min(100, Math.max(0, score));
  
  if (score >= 80) {
    return { score, label: 'Excellent', color: '#22c55e' };
  } else if (score >= 60) {
    return { score, label: 'Good', color: '#84cc16' };
  } else if (score >= 40) {
    return { score, label: 'Fair', color: '#eab308' };
  } else if (score >= 20) {
    return { score, label: 'Poor', color: '#f97316' };
  } else {
    return { score, label: 'Critical', color: '#ef4444' };
  }
}

export const MetricsPanel: React.FC<Props> = ({
  metrics,
  algorithm,
  scenario,
  status,
  stepIndex,
  totalSteps,
  currentExplored,
  currentPath,
  phaseLabel,
  totalNodes,
  dynamicEvents,
  optimalPathLength,
}) => {
  const algo = getAlgorithm(algorithm);
  const sc = getScenario(scenario);
  const mc = METRIC_CONFIG[scenario];
  const progress = totalSteps > 0 ? (stepIndex / totalSteps) * 100 : 0;

  // ✅ THE FIX: Convert live Nodes to Hops. If done, use the official metrics.pathLength!
  const actualHops = status === 'done' && metrics 
    ? metrics.pathLength 
    : Math.max(0, currentPath - 1);

  const completionRate = getCompletionRate(currentExplored, totalNodes);
  const pathOptimality = getPathOptimality(actualHops, optimalPathLength);
  const adaptability = getAdaptabilityScore(status, metrics, algorithm, dynamicEvents);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-4">
      {/* Status + algo badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <div
          className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[status]}`}
          style={
            status === 'running' ? { backgroundColor: algo.color + 'cc' } :
            status === 'done'    ? { backgroundColor: algo.color } : {}
          }
        >
          {statusLabels[status]}
        </div>
        <span className="text-xs font-semibold" style={{ color: sc.color }}>
          {sc.icon} {sc.name}
        </span>
      </div>

      {/* Phase label */}
      {phaseLabel && (
        <div
          className="text-xs px-2 py-1 rounded border font-mono"
          style={{ borderColor: algo.color + '55', color: algo.color, backgroundColor: algo.color + '11' }}
        >
          {phaseLabel}
        </div>
      )}

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-200"
            style={{ width: `${progress}%`, backgroundColor: algo.color }}
          />
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          label="Nodes Visited"
          value={currentExplored.toLocaleString()}
          icon="🔍"
          color={algo.color}
        />
        <MetricCard
          label="Execution Time"
          value={metrics ? `${metrics.timeElapsed.toFixed(3)}ms` : '—'}
          icon="⚡"
          color={algo.color}
        />
        <MetricCard
          label="Path Length"
          value={actualHops > 0 ? actualHops.toString() : '—'}
          icon="📍"
          color={algo.color}
        />
        <MetricCard
          label="Memory Used"
          value={metrics ? getMemoryInMB(metrics.memoryUsed) : '—'}
          icon="💾"
          color={algo.color}
        />
      </div>

      {/* Completion Rate */}
      <div className="bg-gray-800 rounded-lg p-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">📊 Completion Rate</span>
          <span 
            className="text-sm font-bold" 
            style={{ color: completionRate.percentage >= 80 ? '#22c55e' : 
                           completionRate.percentage >= 50 ? '#84cc16' : '#ef4444' }}
          >
            {completionRate.label}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-200"
            style={{ 
              width: `${completionRate.percentage}%`, 
              backgroundColor: completionRate.percentage >= 80 ? '#22c55e' : 
                               completionRate.percentage >= 50 ? '#84cc16' : '#ef4444'
            }}
          />
        </div>
        {totalNodes && (
          <div className="text-xs text-gray-500 text-right">
            {currentExplored} / {totalNodes} nodes
          </div>
        )}
      </div>

      {/* Path Optimality */}
      {metrics && metrics.pathLength > 0 && (
        <div className="bg-gray-800 rounded-lg p-3 flex flex-col gap-1">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-400 whitespace-nowrap">🎯 Path Optimality</span>
            <span className="text-sm font-bold text-right leading-tight" style={{ color: pathOptimality.color }}>
              {pathOptimality.label}
            </span>
          </div>
          {optimalPathLength && (
            <span className="text-[10px] text-gray-500 pt-1">
              {actualHops} hops vs {optimalPathLength} optimal
            </span>
          )}
        </div>
      )}

      {/* Latency metric */}
      {metrics && (
        <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between gap-2">
          <span className="text-xs text-gray-400 whitespace-nowrap">{mc.latencyIcon} {mc.latencyLabel}</span>
          <span className="text-sm font-bold text-right" style={{ color: algo.color }}>
            {metrics.totalLatency > 0 ? `${metrics.totalLatency.toFixed(2)} ${mc.latencyUnit}` : '—'}
          </span>
        </div>
      )}

      {/* Adaptability Score */}
      {status === 'done' && (
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-400">🔄 Adaptability Score</span>
            <span 
              className="text-sm font-bold" 
              style={{ color: adaptability.color }}
            >
              {adaptability.score}/100
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span 
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ 
                backgroundColor: adaptability.color + '33', 
                color: adaptability.color 
              }}
            >
              {adaptability.label}
            </span>
            {dynamicEvents && dynamicEvents.length > 0 && (
              <span className="text-xs text-gray-500">
                {dynamicEvents.length} events
              </span>
            )}
          </div>
        </div>
      )}

      {/* Final result banner */}
      {status === 'done' && metrics && (
        <div
          className="p-3 rounded-lg border text-xs"
          style={{
            borderColor: metrics.exitFound ? '#22c55e44' : '#ef444444',
            backgroundColor: metrics.exitFound ? '#22c55e11' : '#ef444411',
          }}
        >
          {metrics.exitFound ? (
            <span className="text-green-400">
              ✅ {sc.destinationLabel} #{(metrics.exitIndex ?? 0) + 1} reached in {actualHops} hops
            </span>
          ) : (
            <span className="text-red-400">❌ No destination reachable — all paths blocked</span>
          )}
        </div>
      )}

      {/* Step counter */}
      <div className="text-xs text-gray-500 text-right">
        Step {stepIndex} / {totalSteps}
      </div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, color }) => (
  <div className="bg-gray-800 rounded-lg p-2.5 flex flex-col justify-center overflow-hidden">
    <div className="text-[10px] text-gray-400 mb-1 leading-tight whitespace-nowrap text-ellipsis overflow-hidden">
      {icon} {label}
    </div>
    <div className="text-sm font-bold truncate" style={{ color }}>{value}</div>
  </div>
);