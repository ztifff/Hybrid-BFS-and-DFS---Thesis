import React, { useMemo } from 'react';
import { CellType, AlgorithmType } from '../types';
import { DynamicEvent } from '../utils/simulationRunner';

interface Props {
  baseGrid: CellType[][];
  explored: Set<string>;
  path: Set<string>;
  current: [number, number] | null;
  exits: [number, number][];
  start: [number, number];
  algorithm: AlgorithmType;
  dynamicObstacles: Set<string>;
  stepIndex: number;
  dynamicEvents: DynamicEvent[];
  scenario: string;
}

const WALL_COLORS: Record<string, string> = {
  network: '#0d1b2a',
  robotics: '#1a1400',
  traffic: '#0a1a0a',
  evacuation: '#1a0a0a',
  gameai: '#12001a',
};

const EMPTY_COLORS: Record<string, string> = {
  network: '#1e3a5f',
  robotics: '#2a2000',
  traffic: '#1a2e1a',
  evacuation: '#2e1a1a',
  gameai: '#1e0a2e',
};

function getCellColor(
  type: CellType,
  isExplored: boolean,
  isPath: boolean,
  isCurrent: boolean,
  isStart: boolean,
  isExit: boolean,
  isDynamicObstacle: boolean,
  algorithm: AlgorithmType,
  scenario: string
): string {
  if (isDynamicObstacle) return '#ff6600';
  if (isStart) return '#22c55e';
  if (isExit) return '#ef4444';
  if (isCurrent) {
    if (algorithm === 'bfs') return '#86efac';
    if (algorithm === 'dfs') return '#c084fc';
    return '#fdba74';
  }
  if (isPath) {
    if (algorithm === 'bfs') return '#16a34a';
    if (algorithm === 'dfs') return '#7c3aed';
    return '#ea580c';
  }
  if (isExplored) {
    if (algorithm === 'bfs') return '#166534';
    if (algorithm === 'dfs') return '#4c1d95';
    return '#7c2d12';
  }
  if (type === 'wall') return WALL_COLORS[scenario] ?? '#1a1a2e';
  if (type === 'empty') return EMPTY_COLORS[scenario] ?? '#2d2d3a';
  return EMPTY_COLORS[scenario] ?? '#2d2d3a';
}

export const GridCanvas: React.FC<Props> = ({
  baseGrid,
  explored,
  path,
  current,
  exits,
  start,
  algorithm,
  dynamicObstacles,
  stepIndex,
  dynamicEvents,
  scenario: _scenario,
}) => {
  const rows = baseGrid.length;
  const cols = baseGrid[0]?.length ?? 0;

  // Compute active dynamic obstacles at current step
  const activeDynamic = useMemo(() => {
    const active = new Set<string>();
    for (const ev of dynamicEvents) {
      if (ev.stepIndex <= stepIndex) {
        const k = `${ev.cell[0]},${ev.cell[1]}`;
        if (ev.blocked) active.add(k);
        else active.delete(k);
      }
    }
    // Also include passed-in dynamic obstacles
    dynamicObstacles.forEach((k) => active.add(k));
    return active;
  }, [dynamicEvents, stepIndex, dynamicObstacles]);

  const exitSet = useMemo(
    () => new Set(exits.map(([r, c]) => `${r},${c}`)),
    [exits]
  );
  const startKey = `${start[0]},${start[1]}`;
  const currentKey = current ? `${current[0]},${current[1]}` : null;

  // Cell size based on grid dimensions
  const CELL_SIZE = Math.min(Math.floor(560 / Math.max(rows, cols)), 26);
  const gridWidth = cols * CELL_SIZE;
  const gridHeight = rows * CELL_SIZE;

  return (
    <div
      className="relative"
      style={{
        width: gridWidth,
        height: gridHeight,
        imageRendering: 'pixelated',
      }}
    >
      <svg
        width={gridWidth}
        height={gridHeight}
        style={{ display: 'block', borderRadius: 8 }}
      >
        {baseGrid.map((row, r) =>
          row.map((cellType, c) => {
            const k = `${r},${c}`;
            const isStart = k === startKey;
            const isExit = exitSet.has(k);
            const isDyn = activeDynamic.has(k);
            const isExplored = explored.has(k) && !isStart && !isExit;
            const isPath = path.has(k) && !isStart && !isExit;
            const isCurrent = k === currentKey && !isStart && !isExit;

            const color = getCellColor(
              cellType,
              isExplored,
              isPath,
              isCurrent,
              isStart,
              isExit,
              isDyn && cellType !== 'wall' && !isExit && !isStart,
              algorithm,
              _scenario
            );

            const x = c * CELL_SIZE;
            const y = r * CELL_SIZE;

            return (
              <g key={k}>
                <rect
                  x={x}
                  y={y}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  fill={color}
                  stroke={cellType === 'wall' ? '#111' : 'none'}
                  strokeWidth={0.5}
                />
                {/* Start indicator */}
                {isStart && (
                  <circle
                    cx={x + CELL_SIZE / 2}
                    cy={y + CELL_SIZE / 2}
                    r={CELL_SIZE / 3}
                    fill="#22c55e"
                    opacity={0.9}
                  />
                )}
                {/* Exit indicator */}
                {isExit && (
                  <circle
                    cx={x + CELL_SIZE / 2}
                    cy={y + CELL_SIZE / 2}
                    r={CELL_SIZE / 3}
                    fill="#ef4444"
                    opacity={0.9}
                  />
                )}
                {/* Current node pulse */}
                {isCurrent && (
                  <circle
                    cx={x + CELL_SIZE / 2}
                    cy={y + CELL_SIZE / 2}
                    r={CELL_SIZE / 3}
                    fill="white"
                    opacity={0.6}
                  />
                )}
                {/* Dynamic obstacle indicator */}
                {isDyn && cellType !== 'wall' && !isExit && !isStart && (
                  <text
                    x={x + CELL_SIZE / 2}
                    y={y + CELL_SIZE / 2 + 4}
                    textAnchor="middle"
                    fontSize={CELL_SIZE * 0.6}
                    fill="white"
                    opacity={0.8}
                  >
                    ✕
                  </text>
                )}
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
};
