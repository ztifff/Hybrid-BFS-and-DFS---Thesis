import React from 'react';
import { PerformanceMetrics, AlgorithmType, ScenarioType } from '../types';
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

// Scenario-specific metric labels/icons
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
    latencyLabel: 'Travel Time',      latencyUnit: 'min', latencyIcon: '⏱️',
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
}) => {
  const algo = getAlgorithm(algorithm);
  const sc = getScenario(scenario);
  const mc = METRIC_CONFIG[scenario];
  const progress = totalSteps > 0 ? (stepIndex / totalSteps) * 100 : 0;

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

      {/* Live metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          label={mc.exploredLabel}
          value={currentExplored.toLocaleString()}
          icon={mc.exploredIcon}
          color={algo.color}
        />
        <MetricCard
          label={mc.pathLabel}
          value={currentPath > 0 ? currentPath.toString() : '—'}
          icon={mc.pathIcon}
          color={algo.color}
        />
        <MetricCard
          label="Exec Time"
          value={metrics ? `${metrics.timeElapsed.toFixed(3)}ms` : '—'}
          icon="⏱️"
          color={algo.color}
        />
        <MetricCard
          label="Memory"
          value={metrics ? `${metrics.memoryUsed.toFixed(2)}KB` : '—'}
          icon="💾"
          color={algo.color}
        />
      </div>

      {/* Latency metric (scenario-specific) */}
      {metrics && (
        <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">{mc.latencyIcon} {mc.latencyLabel}</span>
          <span className="text-sm font-bold" style={{ color: algo.color }}>
            {metrics.totalLatency > 0 ? `${metrics.totalLatency}${mc.latencyUnit}` : '—'}
          </span>
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
              ✅ {sc.destinationLabel} #{(metrics.exitIndex ?? 0) + 1} reached in {currentPath} hops
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
  <div className="bg-gray-800 rounded-lg p-2.5">
    <div className="text-xs text-gray-400 mb-1">{icon} {label}</div>
    <div className="text-base font-bold" style={{ color }}>{value}</div>
  </div>
);
