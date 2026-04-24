import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ScenarioGraph, GraphNode, AlgorithmType, ScenarioType, DynamicEvent, GraphEdge } from '../types';
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

const NODE_CONFIG: Record<string, { icon: string; radius: number; baseColor: string; shape: 'circle' | 'rect' | 'diamond' }> = {
  datacenter:      { icon: '🖥️',  radius: 28, baseColor: '#16a34a', shape: 'circle' }, // ✅ Green (Source)
  building_router: { icon: '📡',  radius: 22, baseColor: '#1d4ed8', shape: 'circle' },
  router:          { icon: '📡',  radius: 22, baseColor: '#1d4ed8', shape: 'circle' },
  floor_router:    { icon: '🔀',  radius: 17, baseColor: '#2563eb', shape: 'circle' },
  switch:          { icon: '🔀',  radius: 17, baseColor: '#2563eb', shape: 'circle' },
  access_point:    { icon: '📶',  radius: 14, baseColor: '#dc2626', shape: 'circle' }, // ✅ Red (Actual Exit)
  server:          { icon: '📶',  radius: 14, baseColor: '#475569', shape: 'circle' }, // ✅ Gray (Regular Node)
  failed:          { icon: '💀',  radius: 17, baseColor: '#7f1d1d', shape: 'circle' },
  depot:  { icon: '🏭', radius: 28, baseColor: '#92400e', shape: 'circle' },
  zone:   { icon: '📦', radius: 22, baseColor: '#b45309', shape: 'circle' },
  aisle:  { icon: '🔧', radius: 17, baseColor: '#d97706', shape: 'circle' },
  shelf:  { icon: '📫', radius: 14, baseColor: '#f59e0b', shape: 'circle' },
  blocked:{ icon: '🚧', radius: 17, baseColor: '#7f1d1d', shape: 'circle' },
  origin:       { icon: '🏙️', radius: 28, baseColor: '#065f46', shape: 'circle' },
  highway:      { icon: '🛣️', radius: 22, baseColor: '#047857', shape: 'circle' },
  intersection: { icon: '🚦', radius: 17, baseColor: '#059669', shape: 'circle' },
  street:       { icon: '🚗', radius: 14, baseColor: '#10b981', shape: 'circle' },
  closed:       { icon: '🚫', radius: 17, baseColor: '#7f1d1d', shape: 'circle' },
  start:          { icon: '🧑', radius: 24, baseColor: '#991b1b', shape: 'circle' },
  emergency_exit: { icon: '🚪', radius: 22, baseColor: '#b91c1c', shape: 'circle' },
  corridor:       { icon: '🚶', radius: 17, baseColor: '#dc2626', shape: 'circle' },
  stairwell:      { icon: '🪜', radius: 17, baseColor: '#ef4444', shape: 'circle' },
  fire:           { icon: '🔥', radius: 17, baseColor: '#7f1d1d', shape: 'circle' },
  spawn:   { icon: '⚔️', radius: 28, baseColor: '#4c1d95', shape: 'circle' },
  portal:  { icon: '🌀', radius: 22, baseColor: '#6d28d9', shape: 'circle' },
  room:    { icon: '🏛️', radius: 17, baseColor: '#7c3aed', shape: 'circle' },
  enemy:   { icon: '👹', radius: 17, baseColor: '#7f1d1d', shape: 'circle' },
};

const EDGE_CONFIG: Record<string, { color: string; dash: string; width: number }> = {
  fiber:    { color: '#60a5fa', dash: 'none', width: 3 },
  ethernet: { color: '#94a3b8', dash: 'none', width: 2 },
  copper:   { color: '#fdba74', dash: 'none', width: 2 }, // ✅ Added
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
  scenario,
  blockedNodes,
  dynamicEvents,
  stepIndex,
  phaseLabel,
}) => {
  const al = getAlgorithm(algorithm);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [activeFloor, setActiveFloor] = useState<string>('L2');

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { nodes, edges, width, height } = graph;
  
  // ORIGINAL FLAG (Untouched)
  const isMassive = nodes.length > 200;
  
  // ✅ NEW ISOLATED FLAG: Strict check for the huge Real-World Datacenter
  const isDatacenter = scenario === 'network' && width > 100000;

  const isLayeredMap = useMemo(() => {
    return nodes.some(n => n.buildingId === 'GL' || n.buildingId === 'L2');
  }, [nodes]);

  const SVG_W = 960;
  const SVG_H = 680;

  const scale = Math.min(SVG_W / width, SVG_H / height) * 0.95;
  const offsetX = (SVG_W - (width * scale)) / 2;
  const offsetY = (SVG_H - (height * scale)) / 2;

  const sx = (x: number) => (x * scale) + offsetX;
  const sy = (y: number) => (y * scale) + offsetY;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isFollowing || !current || !svgRef.current) return;

    const currentNode = nodes.find(n => n.id === current);
    if (!currentNode) return;

    if (isLayeredMap && currentNode.buildingId && currentNode.buildingId !== activeFloor) {
      if (currentNode.buildingId === 'GL' || currentNode.buildingId === 'L2') {
        setActiveFloor(currentNode.buildingId);
      }
    }

    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const targetPanX = centerX - (sx(currentNode.x) * zoom);
    const targetPanY = centerY - (sy(currentNode.y) * zoom);

    setPan({ x: targetPanX, y: targetPanY });
  }, [current, isFollowing, zoom, nodes, activeFloor, isLayeredMap]);

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    if (isFollowing) setIsFollowing(false);
    const scaleAdjust = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.2, Math.min(zoom * scaleAdjust, 30)); 
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    setPan(prev => ({
      x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
      y: mouseY - (mouseY - prev.y) * (newZoom / zoom)
    }));
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isFollowing) setIsFollowing(false);
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const resetZoom = () => { 
    setIsFollowing(false);
    setZoom(1); 
    setPan({ x: 0, y: 0 }); 
  };

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

  const visibleNodes = useMemo(() => {
    if (!isLayeredMap) return nodes;
    return nodes.filter(n => !n.buildingId || n.buildingId === activeFloor);
  }, [nodes, activeFloor, isLayeredMap]);

  const visibleNodeIds = useMemo(() => {
    return new Set(visibleNodes.map(n => n.id));
  }, [visibleNodes]);

  const visibleEdges = useMemo(() => {
    return edges.filter(e => visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to));
  }, [edges, visibleNodeIds]);


  // ── ORIGINAL STYLE METHODS (Untouched) ──────────────────────────────────
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
    let strokeWidth = isMassive ? 0.4 : 1.5;
    let opacity = isMassive ? 0.9 : 1;
    let glowColor = 'none';

    if (isBlocked) {
      fillColor = '#450a0a';
      strokeColor = '#ef4444';
      strokeWidth = isMassive ? 1 : 2;
    } else if (isCurrent) {
      fillColor = '#fff';
      strokeColor = al.color;
      strokeWidth = isMassive ? 1 : 3;
      glowColor = al.color;
    } else if (isPath) {
      fillColor = al.color;
      strokeColor = '#fff';
      strokeWidth = isMassive ? 1 : 2;
    } else if (isExplored) {
      fillColor = al.color + '88';
      strokeColor = al.color;
      strokeWidth = isMassive ? 0.4 : 1.5;
    } else if (isFrontier) {
      fillColor = al.color + '44';
      strokeColor = al.color + 'aa';
      strokeWidth = isMassive ? 0.4 : 1.5;
    } else if (isSource) {
      fillColor = '#16a34a';
      strokeColor = '#4ade80';
      strokeWidth = isMassive ? 1.5 : 2.5;
    } else if (isDest) {
      fillColor = '#b91c1c';
      strokeColor = '#fca5a5';
      strokeWidth = isMassive ? 1.5 : 2;
    } else {
      opacity = isMassive ? 0.4 : 0.7;
    }

    return { fillColor, strokeColor, strokeWidth, opacity, glowColor, cfg, isBlocked, isCurrent, isSource, isDest };
  }

  function getEdgeStyle(fromId: string, toId: string, edgeType: string) {
    const isOnPath = path.has(fromId) && path.has(toId);
    const isExplored = explored.has(fromId) && explored.has(toId);
    const cfg = EDGE_CONFIG[edgeType] ?? EDGE_CONFIG.path;

    if (isOnPath) {
      return { color: al.color, width: isMassive ? 1.5 : 3.5, dash: 'none', opacity: 1 };
    }
    if (isExplored) {
      return { color: al.color + '88', width: isMassive ? 0.8 : 2, dash: cfg.dash, opacity: isMassive ? 0.8 : 0.9 };
    }
    return { color: cfg.color, width: isMassive ? 0.4 : cfg.width, dash: cfg.dash, opacity: isMassive ? 0.25 : 0.35 }; 
  }


  // ── ISOLATED DATACENTER STYLES ──────────────────────────────────────────
  function getDatacenterEdgeStyle(fromId: string, toId: string, edgeType: string) {
    const isOnPath = path.has(fromId) && path.has(toId);
    const isExplored = explored.has(fromId) && explored.has(toId);
    const cfg = EDGE_CONFIG[edgeType] ?? EDGE_CONFIG.path;

    if (isOnPath) return { color: al.color, width: 1.5, dash: 'none', opacity: 1 };
    if (isExplored) return { color: al.color + '88', width: 0.8, dash: cfg.dash, opacity: 0.8 };
    // Extremely thin un-explored lines to prevent visual clutter
    return { color: cfg.color, width: 0.25, dash: cfg.dash, opacity: 0.2 }; 
  }


  // ── RENDER FUNCTIONS ─────────────────────────────────────────────────────

  // 1. Standard Edge
  const renderStandardEdge = (edge: GraphEdge) => {
    const fromNode = visibleNodes.find((n) => n.id === edge.from);
    const toNode = visibleNodes.find((n) => n.id === edge.to);
    if (!fromNode || !toNode) return null;

    const style = getEdgeStyle(edge.from, edge.to, edge.type);
    const x1 = sx(fromNode.x);
    const y1 = sy(fromNode.y);
    const x2 = sx(toNode.x);
    const y2 = sy(toNode.y);
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const isOnPath = path.has(edge.from) && path.has(edge.to);

    return (
        <g key={edge.id} style={{ pointerEvents: 'none' }}>
            <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={style.color} strokeWidth={style.width} strokeDasharray={style.dash === 'none' ? undefined : style.dash} opacity={style.opacity} strokeLinecap="round"
                markerEnd={isOnPath && !isMassive ? 'url(#arrow-active)' : !isMassive ? 'url(#arrow)' : undefined}
            />
            {!isMassive && (isOnPath || (explored.has(edge.from) && explored.has(edge.to))) && edge.label && (
                <text x={mx} y={my - 5} textAnchor="middle" fontSize="9" fill={isOnPath ? al.color : '#94a3b8'} fontWeight={isOnPath ? 'bold' : 'normal'} style={{ userSelect: 'none', pointerEvents: 'none' }}>
                    {edge.label}
                </text>
            )}
        </g>
    );
  };

  // 2. Standard Node
  const renderStandardNode = (node: GraphNode) => {
    const { fillColor, strokeColor, strokeWidth, opacity, glowColor, cfg, isBlocked, isCurrent, isSource, isDest } = getNodeStyle(node);
    const cx = sx(node.x);
    const cy = sy(node.y);
    const isImportant = isSource || isDest || isCurrent;
    const r = isMassive ? (isImportant ? 5 : 2.2) : cfg.radius;
    const showLabels = !isMassive || isImportant;

    return (
        <g key={node.id} opacity={opacity} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {isCurrent && <circle cx={cx} cy={cy} r={r + (isMassive ? 4 : 10)} fill={glowColor + '33'} filter="url(#glow-strong)" />}
            <circle cx={cx} cy={cy} r={r} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} filter={isCurrent ? 'url(#glow)' : undefined} />
            
            {isBlocked && (
                <>
                <line x1={cx - r * 0.6} y1={cy - r * 0.6} x2={cx + r * 0.6} y2={cy + r * 0.6} stroke="#ef4444" strokeWidth={isMassive ? 1 : 2} />
                <line x1={cx + r * 0.6} y1={cy - r * 0.6} x2={cx - r * 0.6} y2={cy + r * 0.6} stroke="#ef4444" strokeWidth={isMassive ? 1 : 2} />
                </>
            )}
            
            {showLabels && (
                <>
                <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={r * 0.9} style={{ userSelect: 'none', pointerEvents: 'none' }}>
                    {isBlocked ? '💀' : cfg.icon}
                </text>
                <text x={cx} y={cy + r + 11} textAnchor="middle" fontSize={r > 15 ? '10' : '7'} fill="#cbd5e1" fontWeight={isCurrent ? 'bold' : 'normal'} style={{ userSelect: 'none', pointerEvents: 'none' }}>
                    {node.label.split('\n')[0]}
                </text>
                {node.label.includes('\n') && (
                    <text x={cx} y={cy + r + 21} textAnchor="middle" fontSize="8" fill="#64748b" style={{ userSelect: 'none', pointerEvents: 'none' }}>
                    {node.label.split('\n')[1]}
                    </text>
                )}
                </>
            )}
        </g>
    );
  };

  // 3. EXCLUSIVE Datacenter Edge
  const renderDatacenterEdge = (edge: GraphEdge) => {
    const fromNode = visibleNodes.find((n) => n.id === edge.from);
    const toNode = visibleNodes.find((n) => n.id === edge.to);
    if (!fromNode || !toNode) return null;

    const style = getDatacenterEdgeStyle(edge.from, edge.to, edge.type);
    return (
        <line
            key={edge.id}
            x1={sx(fromNode.x)} y1={sy(fromNode.y)} x2={sx(toNode.x)} y2={sy(toNode.y)}
            stroke={style.color} strokeWidth={style.width} strokeDasharray={style.dash === 'none' ? undefined : style.dash} opacity={style.opacity} strokeLinecap="round"
            style={{ pointerEvents: 'none' }}
        />
    );
  };

  // 4. EXCLUSIVE Datacenter Node (Tiny Disks, Shrunken Text)
  const renderDatacenterNode = (node: GraphNode) => {
    const { fillColor, strokeColor, strokeWidth, opacity, glowColor, cfg, isBlocked, isCurrent, isSource, isDest } = getNodeStyle(node);
    const cx = sx(node.x);
    const cy = sy(node.y);
    const isImportant = isSource || isDest || isCurrent;
    
    const r = isImportant ? 8 : 4.5; // Scales down heavily for the massive Trident map

    return (
        <g key={node.id} opacity={opacity} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {isCurrent && <circle cx={cx} cy={cy} r={r + 10} fill={glowColor + '33'} filter="url(#glow-strong)" />}
            <circle cx={cx} cy={cy} r={r} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} filter={isCurrent ? 'url(#glow)' : undefined} />
            
            {isBlocked && (
                <>
                <line x1={cx - r * 0.6} y1={cy - r * 0.6} x2={cx + r * 0.6} y2={cy + r * 0.6} stroke="#ef4444" strokeWidth={1} />
                <line x1={cx + r * 0.6} y1={cy - r * 0.6} x2={cx - r * 0.6} y2={cy + r * 0.6} stroke="#ef4444" strokeWidth={1} />
                </>
            )}
            
            {/* Always show emojis, completely scaled perfectly for this map */}
            <text x={cx} y={cy + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize={r * 1.2} style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {isBlocked ? '💀' : cfg.icon}
            </text>

            <text 
                x={cx} y={cy + r + 5} textAnchor="middle" fontSize={isImportant ? '3.5' : '3'} fill="#f8fafc" fontWeight={isCurrent ? 'bold' : 'normal'}
                paintOrder="stroke" stroke="#0f172a" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
            >
                {node.label.split('\n')[0]}
            </text>
            
            {node.label.includes('\n') && (
                <text x={cx} y={cy + r + 9} textAnchor="middle" fontSize="2.5" fill="#94a3b8" paintOrder="stroke" stroke="#0f172a" strokeWidth="0.5" style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {node.label.split('\n')[1]}
                </text>
            )}
        </g>
    );
  };


  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ background: '#0a0f1e' }}>
      
      {isLayeredMap && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-900/90 p-1.5 rounded-xl border border-gray-700 backdrop-blur-sm z-20 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)]">
          <button
            onClick={() => setActiveFloor('GL')}
            className={`px-8 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
              activeFloor === 'GL' 
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            GL (Ground Level)
          </button>
          <button
            onClick={() => setActiveFloor('L2')}
            className={`px-8 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
              activeFloor === 'L2' 
                ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            L2 (Second Level)
          </button>
        </div>
      )}

      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
        <button 
          onClick={toggleFullscreen} 
          className="w-8 h-8 bg-gray-800 border border-gray-600 rounded text-white flex items-center justify-center hover:bg-gray-700 cursor-pointer text-lg transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? '✖' : '⛶'}
        </button>

        <button 
          onClick={() => setIsFollowing(!isFollowing)} 
          className={`w-8 h-8 border rounded flex items-center justify-center cursor-pointer text-lg transition-colors ${
            isFollowing 
              ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' 
              : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white'
          }`}
          title="Follow Algorithm"
        >
          🎯
        </button>

        <button onClick={() => { setIsFollowing(false); setZoom(z => Math.min(z * 1.5, 30)); }} className="w-8 h-8 bg-gray-800 border border-gray-600 rounded text-white flex items-center justify-center hover:bg-gray-700 cursor-pointer text-xl font-bold transition-colors">+</button>
        <button onClick={() => { setIsFollowing(false); setZoom(z => Math.max(z / 1.5, 0.2)); }} className="w-8 h-8 bg-gray-800 border border-gray-600 rounded text-white flex items-center justify-center hover:bg-gray-700 cursor-pointer text-xl font-bold transition-colors">-</button>
        <button onClick={resetZoom} className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs font-bold text-gray-300 hover:bg-gray-700 cursor-pointer transition-colors">Reset</button>
      </div>

      {phaseLabel && !isFullscreen && (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full z-10 pointer-events-none"
          style={{ backgroundColor: al.color + '33', color: al.color, border: `1px solid ${al.color}66` }}
        >
          {phaseLabel}
        </div>
      )}

      {isFullscreen && (
        <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur border border-gray-700 px-4 py-2 rounded-lg z-10 pointer-events-none flex flex-col gap-1">
          <div className="text-sm font-bold" style={{ color: al.color }}>{al.name} · Step {stepIndex}</div>
          {phaseLabel && <div className="text-xs text-gray-300">{phaseLabel}</div>}
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        height="100%"
        style={{ 
            display: 'block', 
            cursor: isDragging ? 'grabbing' : 'grab', 
            touchAction: 'none',
            userSelect: 'none'
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
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
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#475569" />
          </marker>
          <marker id="arrow-active" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill={al.color} />
          </marker>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            
            {visibleEdges.map((edge) => 
                isDatacenter ? renderDatacenterEdge(edge) : renderStandardEdge(edge)
            )}
            
            {visibleNodes.map((node) => 
                isDatacenter ? renderDatacenterNode(node) : renderStandardNode(node)
            )}

        </g>
      </svg>
    </div>
  );
};