import React, { useMemo } from 'react';
import { ScenarioGraph, GraphNode, AlgorithmType, ScenarioType, DynamicEvent } from '../types';
import { getAlgorithm } from '../config/scenarios';

interface Props {
  graph: ScenarioGraph;
  explored: Set<string>;
  frontier: Set<string>;
  path: Set<string>;
  current: string | null;
  algorithm: AlgorithmType;
  scenario: ScenarioType;
  blockedNodes: Set<string>;
  stepIndex: number;
  dynamicEvents: DynamicEvent[];
  phaseLabel?: string;
}

// Node visual config per type
const NODE_CONFIG: Record<string, { icon: string; radius: number; baseColor: string; shape: 'circle' | 'rect' | 'diamond' }> = {
  // Network
  datacenter:      { icon: '🖥️',  radius: 28, baseColor: '#1e40af', shape: 'circle' },
  building_router: { icon: '📡',  radius: 22, baseColor: '#1d4ed8', shape: 'circle' },
  floor_router:    { icon: '🔀',  radius: 17, baseColor: '#2563eb', shape: 'circle' },
  access_point:    { icon: '📶',  radius: 14, baseColor: '#3b82f6', shape: 'circle' },
  failed:          { icon: '💀',  radius: 17, baseColor: '#7f1d1d', shape: 'circle' },
  // Robotics
  depot:  { icon: '🏭', radius: 28, baseColor: '#92400e', shape: 'circle' },
  zone:   { icon: '📦', radius: 22, baseColor: '#b45309', shape: 'circle' },
  aisle:  { icon: '🔧', radius: 17, baseColor: '#d97706', shape: 'circle' },
  shelf:  { icon: '📫', radius: 14, baseColor: '#f59e0b', shape: 'circle' },
  blocked:{ icon: '🚧', radius: 17, baseColor: '#7f1d1d', shape: 'circle' },
  // Traffic
  origin:       { icon: '🏙️', radius: 28, baseColor: '#065f46', shape: 'circle' },
  highway:      { icon: '🛣️', radius: 22, baseColor: '#047857', shape: 'circle' },
  intersection: { icon: '🚦', radius: 17, baseColor: '#059669', shape: 'circle' },
  street:       { icon: '🚗', radius: 14, baseColor: '#10b981', shape: 'circle' },
  closed:       { icon: '🚫', radius: 17, baseColor: '#7f1d1d', shape: 'circle' },
  // Evacuation
  start:          { icon: '🧑', radius: 24, baseColor: '#991b1b', shape: 'circle' },
  emergency_exit: { icon: '🚪', radius: 22, baseColor: '#b91c1c', shape: 'circle' },
  corridor:       { icon: '🚶', radius: 17, baseColor: '#dc2626', shape: 'circle' },
  stairwell:      { icon: '🪜', radius: 17, baseColor: '#ef4444', shape: 'circle' },
  fire:           { icon: '🔥', radius: 17, baseColor: '#7f1d1d', shape: 'circle' },
  // Game AI
  spawn:   { icon: '⚔️', radius: 28, baseColor: '#4c1d95', shape: 'circle' },
  portal:  { icon: '🌀', radius: 22, baseColor: '#6d28d9', shape: 'circle' },
  room:    { icon: '🏛️', radius: 17, baseColor: '#7c3aed', shape: 'circle' },
  enemy:   { icon: '👹', radius: 17, baseColor: '#7f1d1d', shape: 'circle' },
};

const EDGE_CONFIG: Record<string, { color: string; dash: string; width: number }> = {
  fiber:    { color: '#60a5fa', dash: 'none', width: 3 },
  ethernet: { color: '#94a3b8', dash: 'none', width: 2 },
  road:     { color: '#6ee7b7', dash: 'none', width: 2 },
  corridor: { color: '#fca5a5', dash: '4,3',  width: 2 },
  path:     { color: '#c4b5fd', dash: 'none', width: 2 },
  wireless: { color: '#fdba74', dash: '6,4',  width: 1.5 },
};

export const NetworkCanvas: React.FC<Props> = ({
  graph,
  explored,
  frontier,
  path,
  current,
  algorithm,
  blockedNodes,
  dynamicEvents,
  stepIndex,
  phaseLabel,
}) => {
  const al = getAlgorithm(algorithm);

  // Determine currently blocked nodes at this step
  const activeBlocked = useMemo(() => {
    const blocked = new Set<string>(blockedNodes);
    dynamicEvents.forEach((ev) => {
      if (ev.stepIndex <= stepIndex) {
        if (ev.blocked) blocked.add(ev.nodeId);
        else blocked.delete(ev.nodeId);
      }
    });
    return blocked;
  }, [blockedNodes, dynamicEvents, stepIndex]);

  const { nodes, edges, width, height } = graph;

  // Scale factor to fit in viewport
  const SVG_W = 960;
  const SVG_H = 680;
  const scaleX = SVG_W / width;
  const scaleY = SVG_H / height;

  const sx = (x: number) => x * scaleX;
  const sy = (y: number) => y * scaleY;

  function getNodeStyle(node: GraphNode) {
    const cfg = NODE_CONFIG[node.type] ?? { icon: '⬤', radius: 16, baseColor: '#374151', shape: 'circle' };
    const isBlocked = activeBlocked.has(node.id);
    const isCurrent = current === node.id;
    const isPath = path.has(node.id);
    const isExplored = explored.has(node.id);
    const isFrontier = frontier.has(node.id);
    const isSource = node.id === graph.sourceId;
    const isDest = graph.destinationIds.includes(node.id);

    let fillColor = cfg.baseColor;
    let strokeColor = '#374151';
    let strokeWidth = 1.5;
    let opacity = 1;
    let glowColor = 'none';

    if (isBlocked) {
      fillColor = '#450a0a';
      strokeColor = '#ef4444';
      strokeWidth = 2;
    } else if (isCurrent) {
      fillColor = '#fff';
      strokeColor = al.color;
      strokeWidth = 3;
      glowColor = al.color;
    } else if (isPath) {
      fillColor = al.color;
      strokeColor = '#fff';
      strokeWidth = 2;
    } else if (isExplored) {
      fillColor = al.color + '88';
      strokeColor = al.color;
      strokeWidth = 1.5;
    } else if (isFrontier) {
      fillColor = al.color + '44';
      strokeColor = al.color + 'aa';
      strokeWidth = 1.5;
    } else if (isSource) {
      fillColor = '#16a34a';
      strokeColor = '#4ade80';
      strokeWidth = 2.5;
    } else if (isDest) {
      fillColor = '#b91c1c';
      strokeColor = '#fca5a5';
      strokeWidth = 2;
    } else {
      opacity = 0.7;
    }

    return { fillColor, strokeColor, strokeWidth, opacity, glowColor, cfg, isBlocked, isCurrent };
  }

  function getEdgeStyle(fromId: string, toId: string, edgeType: string) {
    const isOnPath = path.has(fromId) && path.has(toId);
    const isExplored = explored.has(fromId) && explored.has(toId);
    const cfg = EDGE_CONFIG[edgeType] ?? EDGE_CONFIG.path;

    if (isOnPath) {
      return { color: al.color, width: 3.5, dash: 'none', opacity: 1 };
    }
    if (isExplored) {
      return { color: al.color + '88', width: 2, dash: cfg.dash, opacity: 0.9 };
    }
    return { color: cfg.color, width: cfg.width, dash: cfg.dash, opacity: 0.35 };
  }

  // Group nodes by buildingId for background panels
  const buildingGroups = useMemo(() => {
    const groups = new Map<string, GraphNode[]>();
    nodes.forEach((n) => {
      if (!n.buildingId) return;
      if (!groups.has(n.buildingId)) groups.set(n.buildingId, []);
      groups.get(n.buildingId)!.push(n);
    });
    return groups;
  }, [nodes]);

  return (
    <div className="relative w-full" style={{ background: '#0a0f1e' }}>
      {/* Phase label */}
      {phaseLabel && (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full z-10"
          style={{ backgroundColor: al.color + '33', color: al.color, border: `1px solid ${al.color}66` }}
        >
          {phaseLabel}
        </div>
      )}

      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width={SVG_W}
        height={SVG_H}
        style={{ maxWidth: '100%', display: 'block' }}
      >
        <defs>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-strong" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Arrow marker */}
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#475569" />
          </marker>
          <marker id="arrow-active" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill={al.color} />
          </marker>
        </defs>

        {/* Building group backgrounds */}
        {Array.from(buildingGroups.entries()).map(([bid, bNodes]) => {
          if (bNodes.length < 2) return null;
          const xs = bNodes.map((n) => sx(n.x));
          const ys = bNodes.map((n) => sy(n.y));
          const minX = Math.min(...xs) - 38;
          const minY = Math.min(...ys) - 28;
          const maxX = Math.max(...xs) + 38;
          const maxY = Math.max(...ys) + 28;
          return (
            <rect
              key={`bg-${bid}`}
              x={minX} y={minY}
              width={maxX - minX} height={maxY - minY}
              rx={12}
              fill="#ffffff08"
              stroke="#ffffff11"
              strokeWidth={1}
            />
          );
        })}

        {/* Edges */}
        {edges.map((edge) => {
          const fromNode = nodes.find((n) => n.id === edge.from);
          const toNode = nodes.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const style = getEdgeStyle(edge.from, edge.to, edge.type);
          const x1 = sx(fromNode.x);
          const y1 = sy(fromNode.y);
          const x2 = sx(toNode.x);
          const y2 = sy(toNode.y);

          // Midpoint for label
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;

          const isOnPath = path.has(edge.from) && path.has(edge.to);

          return (
            <g key={edge.id}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={style.color}
                strokeWidth={style.width}
                strokeDasharray={style.dash === 'none' ? undefined : style.dash}
                opacity={style.opacity}
                strokeLinecap="round"
                markerEnd={isOnPath ? 'url(#arrow-active)' : 'url(#arrow)'}
              />
              {/* Latency label — only on path or explored */}
              {(isOnPath || (explored.has(edge.from) && explored.has(edge.to))) && edge.label && (
                <text
                  x={mx} y={my - 5}
                  textAnchor="middle"
                  fontSize="9"
                  fill={isOnPath ? al.color : '#94a3b8'}
                  fontWeight={isOnPath ? 'bold' : 'normal'}
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const { fillColor, strokeColor, strokeWidth, opacity, glowColor, cfg, isBlocked, isCurrent } =
            getNodeStyle(node);
          const cx = sx(node.x);
          const cy = sy(node.y);
          const r = cfg.radius;

          return (
            <g key={node.id} opacity={opacity} style={{ cursor: 'default' }}>
              {/* Glow ring for current node */}
              {isCurrent && (
                <circle cx={cx} cy={cy} r={r + 10} fill={glowColor + '33'} filter="url(#glow-strong)" />
              )}
              {/* Main circle */}
              <circle
                cx={cx} cy={cy} r={r}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                filter={isCurrent ? 'url(#glow)' : undefined}
              />
              {/* Blocked X overlay */}
              {isBlocked && (
                <>
                  <line x1={cx - r * 0.6} y1={cy - r * 0.6} x2={cx + r * 0.6} y2={cy + r * 0.6}
                    stroke="#ef4444" strokeWidth={2} />
                  <line x1={cx + r * 0.6} y1={cy - r * 0.6} x2={cx - r * 0.6} y2={cy + r * 0.6}
                    stroke="#ef4444" strokeWidth={2} />
                </>
              )}
              {/* Icon */}
              <text
                x={cx} y={cy + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={r * 0.9}
                style={{ userSelect: 'none' }}
              >
                {isBlocked ? '💀' : cfg.icon}
              </text>
              {/* Label below */}
              <text
                x={cx} y={cy + r + 11}
                textAnchor="middle"
                fontSize={r > 20 ? '10' : '8'}
                fill="#cbd5e1"
                fontWeight={isCurrent ? 'bold' : 'normal'}
              >
                {node.label.split('\n')[0]}
              </text>
              {node.label.includes('\n') && (
                <text
                  x={cx} y={cy + r + 21}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#64748b"
                >
                  {node.label.split('\n')[1]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
