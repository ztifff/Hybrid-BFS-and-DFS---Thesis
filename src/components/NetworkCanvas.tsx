import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ScenarioGraph, GraphNode, ScenarioType, DynamicEvent, GraphEdge, AlgorithmStep } from '../types';
import { ALGORITHMS } from '../config/scenarios';

interface Props {
  graph: ScenarioGraph;
  activeSteps: { bfs: AlgorithmStep | null, dfs: AlgorithmStep | null, hybrid: AlgorithmStep | null };
  scenario: ScenarioType;
  stepIndex: number;
  dynamicEvents: DynamicEvent[];
}

const NODE_CONFIG: Record<string, { icon: string; radius: number; baseColor: string }> = {
  datacenter:      { icon: '🖥️',  radius: 28, baseColor: '#16a34a' }, 
  building_router: { icon: '📡',  radius: 22, baseColor: '#1d4ed8' },
  router:          { icon: '📡',  radius: 22, baseColor: '#1d4ed8' },
  floor_router:    { icon: '🔀',  radius: 17, baseColor: '#2563eb' },
  switch:          { icon: '🔀',  radius: 17, baseColor: '#2563eb' },
  access_point:    { icon: '📶',  radius: 14, baseColor: '#dc2626' }, 
  server:          { icon: '📶',  radius: 14, baseColor: '#475569' }, 
  failed:          { icon: '💀',  radius: 17, baseColor: '#7f1d1d' },
  depot:  { icon: '🏭', radius: 28, baseColor: '#92400e' },
  zone:   { icon: '📦', radius: 22, baseColor: '#b45309' },
  aisle:  { icon: '🔧', radius: 17, baseColor: '#d97706' },
  shelf:  { icon: '📫', radius: 14, baseColor: '#f59e0b' },
  blocked:{ icon: '🚧', radius: 17, baseColor: '#7f1d1d' },
  origin:       { icon: '🏙️', radius: 28, baseColor: '#065f46' },
  highway:      { icon: '🛣️', radius: 22, baseColor: '#047857' },
  intersection: { icon: '🚦', radius: 17, baseColor: '#059669' },
  street:       { icon: '🚗', radius: 14, baseColor: '#10b981' },
  closed:       { icon: '🚫', radius: 17, baseColor: '#7f1d1d' },
  start:          { icon: '🧑', radius: 24, baseColor: '#991b1b' },
  emergency_exit: { icon: '🚪', radius: 22, baseColor: '#b91c1c' },
  corridor:       { icon: '🚶', radius: 17, baseColor: '#dc2626' },
  stairwell:      { icon: '🪜', radius: 17, baseColor: '#ef4444' },
  fire:           { icon: '🔥', radius: 17, baseColor: '#7f1d1d' },
  spawn:   { icon: '⚔️', radius: 28, baseColor: '#4c1d95' },
  portal:  { icon: '🌀', radius: 22, baseColor: '#6d28d9' },
  room:    { icon: '🏛️', radius: 17, baseColor: '#7c3aed' },
  enemy:   { icon: '👹', radius: 17, baseColor: '#7f1d1d' },
};

const EDGE_CONFIG: Record<string, { color: string; dash: string; width: number }> = {
  fiber:    { color: '#60a5fa', dash: 'none', width: 3 },
  ethernet: { color: '#94a3b8', dash: 'none', width: 2 },
  copper:   { color: '#fdba74', dash: 'none', width: 2 }, 
  road:     { color: '#6ee7b7', dash: 'none', width: 2 },
  corridor: { color: '#fca5a5', dash: '4,3',  width: 2 },
  path:     { color: '#c4b5fd', dash: 'none', width: 2 },
  wireless: { color: '#fdba74', dash: '6,4',  width: 1.5 },
};

export const NetworkCanvas: React.FC<Props> = ({
  graph,
  activeSteps,
  scenario,
  dynamicEvents,
  stepIndex,
}) => {
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
  
  const isMassive = nodes.length > 200;
  const isDatacenter = scenario === 'network' && width > 100000;
  const isLayeredMap = useMemo(() => nodes.some(n => n.buildingId === 'GL' || n.buildingId === 'L2'), [nodes]);

  const SVG_W = 960;
  const SVG_H = 680;

  const scale = Math.min(SVG_W / width, SVG_H / height) * 0.95;
  const offsetX = (SVG_W - (width * scale)) / 2;
  const offsetY = (SVG_H - (height * scale)) / 2;

  const sx = (x: number) => (x * scale) + offsetX;
  const sy = (y: number) => (y * scale) + offsetY;

  const cBFS = ALGORITHMS.find(a => a.id === 'bfs')?.color || '#4ade80';
  const cDFS = ALGORITHMS.find(a => a.id === 'dfs')?.color || '#c084fc';
  const cHYB = ALGORITHMS.find(a => a.id === 'hybrid')?.color || '#fb923c';

  const sets = useMemo(() => {
      const extract = (step: AlgorithmStep | null) => ({
          explored: new Set(step?.explored || []),
          path: new Set(step?.path || []),
          current: step?.current || null
      });
      return {
          bfs: extract(activeSteps.bfs),
          dfs: extract(activeSteps.dfs),
          hyb: extract(activeSteps.hybrid)
      };
  }, [activeSteps]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
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
    if (!isFollowing || !svgRef.current) return;

    let sumX = 0, sumY = 0, count = 0;
    let targetFloor = activeFloor;

    [sets.bfs.current, sets.dfs.current, sets.hyb.current].forEach(curr => {
        if (curr) {
            const node = nodes.find(n => n.id === curr);
            if (node) {
                sumX += sx(node.x); sumY += sy(node.y); count++;
                if (isLayeredMap && node.buildingId && node.buildingId !== targetFloor) {
                    if (node.buildingId === 'GL' || node.buildingId === 'L2') targetFloor = node.buildingId;
                }
            }
        }
    });

    if (count === 0) return;
    if (targetFloor !== activeFloor) setActiveFloor(targetFloor);

    const centerX = svgRef.current.getBoundingClientRect().width / 2;
    const centerY = svgRef.current.getBoundingClientRect().height / 2;
    setPan({ x: centerX - ((sumX / count) * zoom), y: centerY - ((sumY / count) * zoom) });
  }, [sets, isFollowing, zoom, nodes, activeFloor, isLayeredMap, scale, offsetX, offsetY]);

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
  const resetZoom = () => { setIsFollowing(false); setZoom(1); setPan({ x: 0, y: 0 }); };

  const activeBlocked = useMemo(() => {
    const blocked = new Set<string>();
    dynamicEvents.forEach((ev) => {
      if (ev.stepIndex <= stepIndex) {
        if (ev.blocked) blocked.add(ev.nodeId);
        else blocked.delete(ev.nodeId);
      }
    });
    return blocked;
  }, [dynamicEvents, stepIndex]);

  const visibleNodes = useMemo(() => {
    if (!isLayeredMap) return nodes;
    return nodes.filter(n => !n.buildingId || n.buildingId === activeFloor);
  }, [nodes, activeFloor, isLayeredMap]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);
  const visibleEdges = useMemo(() => edges.filter(e => visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to)), [edges, visibleNodeIds]);

  const renderEdge = (edge: GraphEdge) => {
    const fromNode = visibleNodes.find((n) => n.id === edge.from);
    const toNode = visibleNodes.find((n) => n.id === edge.to);
    if (!fromNode || !toNode) return null;

    const x1 = sx(fromNode.x), y1 = sy(fromNode.y), x2 = sx(toNode.x), y2 = sy(toNode.y);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;

    const pBFS = sets.bfs.path.has(edge.from) && sets.bfs.path.has(edge.to);
    const pDFS = sets.dfs.path.has(edge.from) && sets.dfs.path.has(edge.to);
    const pHYB = sets.hyb.path.has(edge.from) && sets.hyb.path.has(edge.to);

    const expAny = sets.bfs.explored.has(edge.from) || sets.dfs.explored.has(edge.from) || sets.hyb.explored.has(edge.from);
    const cfg = EDGE_CONFIG[edge.type] ?? EDGE_CONFIG.path;

    const baseOpacity = isDatacenter ? 0.2 : (isMassive ? 0.25 : 0.35);
    const baseWidth = isDatacenter ? 0.25 : (isMassive ? 0.4 : cfg.width);

    return (
        <g key={edge.id} style={{ pointerEvents: 'none' }}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={expAny ? '#94a3b8' : cfg.color} strokeWidth={baseWidth} strokeDasharray={cfg.dash !== 'none' ? cfg.dash : undefined} opacity={expAny ? 0.6 : baseOpacity} />
            
            {/* THICKER MAIN PATH LINES */}
            {pBFS && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={cBFS} strokeWidth={isMassive ? 3.5 : 8} opacity={0.9} strokeLinecap="round" />}
            {pDFS && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={cDFS} strokeWidth={isMassive ? 2.5 : 5} opacity={0.95} strokeLinecap="round" />}
            {pHYB && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={cHYB} strokeWidth={isMassive ? 1.5 : 3} opacity={1} strokeLinecap="round" />}

            {!isMassive && edge.label && (pBFS || pDFS || pHYB || expAny) && (
                <text x={mx} y={my - 5} textAnchor="middle" fontSize="9" fill={pHYB ? cHYB : pDFS ? cDFS : pBFS ? cBFS : '#94a3b8'} fontWeight={(pBFS || pDFS || pHYB) ? 'bold' : 'normal'} style={{ userSelect: 'none' }}>
                    {edge.label}
                </text>
            )}
        </g>
    );
  };

  const renderNode = (node: GraphNode) => {
    const cfg = NODE_CONFIG[node.type] ?? { icon: '⬤', radius: 16, baseColor: '#374151' };
    const cx = sx(node.x), cy = sy(node.y);
    const isBlocked = activeBlocked.has(node.id);
    const isSource = node.id === graph.sourceId;
    const isDest = graph.destinationIds.includes(node.id);

    const currBFS = sets.bfs.current === node.id;
    const currDFS = sets.dfs.current === node.id;
    const currHYB = sets.hyb.current === node.id;
    const isImportant = isSource || isDest || currBFS || currDFS || currHYB;
    
    // Check exploration status
    const expBFS = sets.bfs.explored.has(node.id);
    const expDFS = sets.dfs.explored.has(node.id);
    const expHYB = sets.hyb.explored.has(node.id);
    
    // ✅ NEW: Stack algorithms visually. Outermost ring is the first one in the list.
    const activeExplorations = [
      { id: 'bfs', active: expBFS, color: cBFS },
      { id: 'dfs', active: expDFS, color: cDFS },
      { id: 'hyb', active: expHYB, color: cHYB }
    ].filter(e => e.active);

    let r = isMassive ? (isImportant ? 5 : 2.2) : cfg.radius;
    if (isDatacenter) r = isImportant ? 8 : 4.5;
    
    const showLabels = !isMassive || isImportant;

    // Define bead rendering scales
    const radiiMassive = [3.5, 2.2, 1.0];
    const radiiNormal = [r * 0.85, r * 0.55, r * 0.25];
    const strokesMassive = [0.8, 0.5, 0.3];
    const strokesNormal = [2, 1.5, 1];

    const currentRadii = isMassive ? radiiMassive : radiiNormal;
    const currentStrokes = isMassive ? strokesMassive : strokesNormal;

    let fillColor = cfg.baseColor;
    let opacity = (isMassive && !isImportant) ? 0.4 : 1;

    if (isBlocked) { 
      fillColor = '#450a0a'; 
      opacity = 1; 
    } else if (isSource) { 
      fillColor = '#16a34a'; 
    } else if (isDest) { 
      fillColor = '#b91c1c'; 
    }

    return (
        <g key={node.id} opacity={opacity} style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {/* Active Current Node Outer Halos */}
            {currBFS && <circle cx={cx} cy={cy} r={r + (isMassive?3:8)} fill="none" stroke={cBFS} strokeWidth={2} filter="url(#glow)" />}
            {currDFS && <circle cx={cx} cy={cy} r={r + (isMassive?5:12)} fill="none" stroke={cDFS} strokeWidth={2} filter="url(#glow)" />}
            {currHYB && <circle cx={cx} cy={cy} r={r + (isMassive?7:16)} fill="none" stroke={cHYB} strokeWidth={2} filter="url(#glow)" />}

            {/* ✅ NEW: If Blocked or Important (Source/Dest) or NOT explored, draw base circle. 
                      Otherwise, ONLY draw the solid colored "beads" with white strokes */}
            {isBlocked || isSource || isDest || activeExplorations.length === 0 ? (
               <circle cx={cx} cy={cy} r={r} fill={fillColor} stroke={isBlocked ? '#ef4444' : '#374151'} strokeWidth={isBlocked ? 2 : 1} />
            ) : (
               activeExplorations.map((exp, index) => (
                 <circle 
                    key={exp.id} 
                    cx={cx} 
                    cy={cy} 
                    r={currentRadii[index]} 
                    fill={exp.color} 
                    stroke="#ffffff" 
                    strokeWidth={currentStrokes[index]} 
                 />
               ))
            )}
            
            {isBlocked && (
                <>
                <line x1={cx - r*0.6} y1={cy - r*0.6} x2={cx + r*0.6} y2={cy + r*0.6} stroke="#ef4444" strokeWidth={isMassive ? 1 : 2} />
                <line x1={cx + r*0.6} y1={cy - r*0.6} x2={cx - r*0.6} y2={cy + r*0.6} stroke="#ef4444" strokeWidth={isMassive ? 1 : 2} />
                </>
            )}
            
            {showLabels && !isDatacenter && (
                <>
                <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={r * 0.9}>{isBlocked ? '💀' : cfg.icon}</text>
                <text x={cx} y={cy + r + 11} textAnchor="middle" fontSize={r > 15 ? '10' : '7'} fill="#cbd5e1" fontWeight={isImportant ? 'bold' : 'normal'}>
                    {node.label.split('\n')[0]}
                </text>
                </>
            )}

            {showLabels && isDatacenter && (
                <>
                <text x={cx} y={cy + 0.5} textAnchor="middle" dominantBaseline="middle" fontSize={r * 1.2}>{isBlocked ? '💀' : cfg.icon}</text>
                <text x={cx} y={cy + r + 5} textAnchor="middle" fontSize={isImportant ? '3.5' : '3'} fill="#f8fafc" paintOrder="stroke" stroke="#0f172a" strokeWidth="0.6">
                    {node.label.split('\n')[0]}
                </text>
                </>
            )}
        </g>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ background: '#0a0f1e' }}>
      
      {isLayeredMap && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-900/90 p-1.5 rounded-xl border border-gray-700 backdrop-blur-sm z-20 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)]">
          <button onClick={() => setActiveFloor('GL')} className={`px-8 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${activeFloor === 'GL' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>GL (Ground)</button>
          <button onClick={() => setActiveFloor('L2')} className={`px-8 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${activeFloor === 'L2' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>L2 (Second)</button>
        </div>
      )}

      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
        <button onClick={toggleFullscreen} className="w-8 h-8 bg-gray-800 border border-gray-600 rounded text-white flex items-center justify-center hover:bg-gray-700 cursor-pointer text-lg transition-colors" title="Toggle Fullscreen">{isFullscreen ? '✖' : '⛶'}</button>
        <button onClick={() => setIsFollowing(!isFollowing)} className={`w-8 h-8 border rounded flex items-center justify-center cursor-pointer text-lg transition-colors ${isFollowing ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="Follow Algorithms">🎯</button>
        <button onClick={() => { setIsFollowing(false); setZoom(z => Math.min(z * 1.5, 30)); }} className="w-8 h-8 bg-gray-800 border border-gray-600 rounded text-white flex items-center justify-center hover:bg-gray-700 cursor-pointer text-xl font-bold transition-colors">+</button>
        <button onClick={() => { setIsFollowing(false); setZoom(z => Math.max(z / 1.5, 0.2)); }} className="w-8 h-8 bg-gray-800 border border-gray-600 rounded text-white flex items-center justify-center hover:bg-gray-700 cursor-pointer text-xl font-bold transition-colors">-</button>
        <button onClick={resetZoom} className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs font-bold text-gray-300 hover:bg-gray-700 cursor-pointer transition-colors">Reset</button>
      </div>

      <svg
        ref={svgRef} viewBox={`0 0 ${SVG_W} ${SVG_H}`} width="100%" height="100%"
        style={{ display: 'block', cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none', userSelect: 'none' }}
        onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseLeave}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {visibleEdges.map(renderEdge)}
            {visibleNodes.map(renderNode)}
        </g>
      </svg>
    </div>
  );
};