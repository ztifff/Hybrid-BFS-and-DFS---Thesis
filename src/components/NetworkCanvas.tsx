import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ScenarioGraph, GraphNode, ScenarioType, DynamicEvent, AlgorithmStep } from '../types';
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
  depot:           { icon: '🏭', radius: 28, baseColor: '#92400e' },
  zone:            { icon: '📦', radius: 22, baseColor: '#b45309' },
  aisle:           { icon: '🔧', radius: 17, baseColor: '#d97706' },
  shelf:           { icon: '📫', radius: 14, baseColor: '#f59e0b' },
  blocked:         { icon: '🚧', radius: 17, baseColor: '#7f1d1d' },
  origin:          { icon: '🏙️', radius: 28, baseColor: '#065f46' },
  highway:         { icon: '🛣️', radius: 22, baseColor: '#047857' },
  intersection:    { icon: '🚦', radius: 17, baseColor: '#059669' },
  street:          { icon: '🚗', radius: 14, baseColor: '#10b981' },
  closed:          { icon: '🚫', radius: 17, baseColor: '#7f1d1d' },
  start:           { icon: '🧑', radius: 24, baseColor: '#991b1b' },
  emergency_exit:  { icon: '🚪', radius: 22, baseColor: '#b91c1c' },
  corridor:        { icon: '🚶', radius: 17, baseColor: '#dc2626' },
  stairwell:       { icon: '🪜', radius: 17, baseColor: '#ef4444' },
  fire:            { icon: '🔥', radius: 17, baseColor: '#7f1d1d' },
  spawn:           { icon: '♟️', radius: 28, baseColor: '#4c1d95' },
  portal:          { icon: '🏁', radius: 22, baseColor: '#6d28d9' },
  room:            { icon: '▣', radius: 17, baseColor: '#7c3aed' },
  enemy:           { icon: '✖', radius: 17, baseColor: '#7f1d1d' },
};

const EDGE_CONFIG: Record<string, { color: string; dash: number[]; width: number }> = {
  fiber:    { color: '#60a5fa', dash: [], width: 3 },
  ethernet: { color: '#94a3b8', dash: [], width: 2 },
  copper:   { color: '#fdba74', dash: [], width: 2 }, 
  road:     { color: '#6ee7b7', dash: [], width: 2 },
  corridor: { color: '#fca5a5', dash: [4, 3], width: 2 },
  path:     { color: '#c4b5fd', dash: [], width: 2 },
  wireless: { color: '#fdba74', dash: [6, 4], width: 1.5 },
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
  
  // Force re-render on resize to prevent canvas stretching
  const [windowDimensions, setWindowDimensions] = useState({ w: 0, h: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { nodes, edges, width, height } = graph;
  
  const isMassive = nodes.length > 200;
  const isDatacenter = scenario === 'network' && width > 100000;
  const isLayeredMap = useMemo(() => nodes.some(n => n.buildingId === 'GL' || n.buildingId === 'L2'), [nodes]);

  const SVG_W = 960;
  const SVG_H = 680;

  const scale = Math.min(SVG_W / width, SVG_H / height) * 1.05;
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

  // Setup Resize and Fullscreen Listeners
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    const handleResize = () => setWindowDimensions({ w: window.innerWidth, h: window.innerHeight });

    // Initialize dimensions
    handleResize();

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('resize', handleResize);
    
    return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Follow Algorithm Logic
  useEffect(() => {
    if (!isFollowing || !containerRef.current) return;

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

    const centerX = containerRef.current.getBoundingClientRect().width / 2;
    const centerY = containerRef.current.getBoundingClientRect().height / 2;
    setPan({ x: centerX - ((sumX / count) * zoom), y: centerY - ((sumY / count) * zoom) });
  }, [sets, isFollowing, zoom, nodes, activeFloor, isLayeredMap, scale, offsetX, offsetY]);

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

  const visibleNodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    visibleNodes.forEach(node => map.set(node.id, node));
    return map;
  }, [visibleNodes]);

  const visibleEdges = useMemo(() => {
    return edges.filter(e => visibleNodeMap.has(e.from) && visibleNodeMap.has(e.to));
  }, [edges, visibleNodeMap]);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.scale(dpr, dpr);
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const getRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const baseOpacity = isDatacenter ? 0.2 : (isMassive ? 0.15 : 0.35);
    ctx.lineCap = 'round';

    if (scenario === 'gameai') {
      const boardNodes = visibleNodes.filter(node => typeof node.metadata?.board === 'string' && node.metadata.board !== 'arena');
      const boards = Array.from(new Set(boardNodes.map(node => node.metadata?.board as string)));

      boards.forEach(board => {
        const group = boardNodes.filter(node => node.metadata?.board === board);
        if (group.length === 0) return;

        const xs = group.map(node => sx(node.x));
        const ys = group.map(node => sy(node.y));
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const uniqueX = Array.from(new Set(xs.map(value => Math.round(value)))).sort((a, b) => a - b);
        const uniqueY = Array.from(new Set(ys.map(value => Math.round(value)))).sort((a, b) => a - b);
        const dx = uniqueX.length > 1 ? uniqueX[1] - uniqueX[0] : 38;
        const dy = uniqueY.length > 1 ? uniqueY[1] - uniqueY[0] : 38;
        const tileSize = Math.min(dx, dy) * 0.92;

        ctx.save();
        ctx.globalAlpha = 0.78;
        group.forEach(node => {
          const row = Number(node.metadata?.row ?? 0);
          const col = Number(node.metadata?.col ?? 0);
          const cx = sx(node.x);
          const cy = sy(node.y);

          if (board === 'chess') {
            ctx.fillStyle = (row + col) % 2 === 0 ? '#e5e7eb' : '#334155';
          } else if (board === 'checkers') {
            ctx.fillStyle = (row + col) % 2 === 0 ? '#111827' : '#991b1b';
          } else {
            const palette = ['#14532d', '#0f766e', '#1d4ed8', '#7c2d12'];
            ctx.fillStyle = palette[(row + col) % palette.length];
          }

          ctx.fillRect(cx - tileSize / 2, cy - tileSize / 2, tileSize, tileSize);
        });
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = board === 'checkers' ? '#f87171' : board === 'chess' ? '#cbd5e1' : '#fde68a';
        ctx.lineWidth = 1.5 / zoom;
        ctx.strokeRect(
          minX - tileSize / 2,
          minY - tileSize / 2,
          (maxX - minX) + tileSize,
          (maxY - minY) + tileSize
        );

        ctx.font = `bold ${14 / zoom}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3 / zoom;
        ctx.strokeStyle = '#0a0f1e';
        ctx.fillStyle = '#f8fafc';
        const boardTitle = board === 'snakes' ? 'Snakes & Ladders' : board[0].toUpperCase() + board.slice(1);
        const titleX = minX + ((maxX - minX) / 2);
        const titleY = minY - (tileSize * 0.9);
        ctx.strokeText(boardTitle, titleX, titleY);
        ctx.fillText(boardTitle, titleX, titleY);
        ctx.restore();
      });
    }

    // 1. Draw Edges
    visibleEdges.forEach(edge => {
      const fromNode = visibleNodeMap.get(edge.from);
      const toNode = visibleNodeMap.get(edge.to);
      if (!fromNode || !toNode) return;

      const x1 = sx(fromNode.x), y1 = sy(fromNode.y), x2 = sx(toNode.x), y2 = sy(toNode.y);
      const expAny = sets.bfs.explored.has(edge.from) || sets.dfs.explored.has(edge.from) || sets.hyb.explored.has(edge.from);
      const cfg = EDGE_CONFIG[edge.type] ?? EDGE_CONFIG.path;
      const baseWidth = isDatacenter ? 0.25 : (isMassive ? 0.3 : cfg.width);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = expAny ? getRgba('#64748b', 0.4) : getRgba(cfg.color, baseOpacity);
      ctx.lineWidth = baseWidth;
      ctx.setLineDash(cfg.dash.length > 0 ? cfg.dash : []);
      ctx.stroke();
    });

    // 2. Draw Active Paths
    ctx.setLineDash([]);
    visibleEdges.forEach(edge => {
      const fromNode = visibleNodeMap.get(edge.from);
      const toNode = visibleNodeMap.get(edge.to);
      if (!fromNode || !toNode) return;

      const pBFS = sets.bfs.path.has(edge.from) && sets.bfs.path.has(edge.to);
      const pDFS = sets.dfs.path.has(edge.from) && sets.dfs.path.has(edge.to);
      const pHYB = sets.hyb.path.has(edge.from) && sets.hyb.path.has(edge.to);

      if (pBFS || pDFS || pHYB) {
        const x1 = sx(fromNode.x), y1 = sy(fromNode.y), x2 = sx(toNode.x), y2 = sy(toNode.y);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        
        if (pBFS) { ctx.strokeStyle = getRgba(cBFS, 0.9); ctx.lineWidth = isMassive ? 2.5 : 8; ctx.stroke(); }
        if (pDFS) { ctx.strokeStyle = getRgba(cDFS, 0.95); ctx.lineWidth = isMassive ? 1.8 : 5; ctx.stroke(); }
        if (pHYB) { ctx.strokeStyle = getRgba(cHYB, 1); ctx.lineWidth = isMassive ? 1.2 : 3; ctx.stroke(); }
      }
    });

    // 2.5. Draw Visited Edges (Low Opacity - Algorithm Specific, Stacked)
    ctx.setLineDash([]);
    visibleEdges.forEach(edge => {
      const fromNode = visibleNodeMap.get(edge.from);
      const toNode = visibleNodeMap.get(edge.to);
      if (!fromNode || !toNode) return;

      const x1 = sx(fromNode.x), y1 = sy(fromNode.y), x2 = sx(toNode.x), y2 = sy(toNode.y);
      const cfg = EDGE_CONFIG[edge.type] ?? EDGE_CONFIG.path;
      const baseWidth = isDatacenter ? 0.25 : (isMassive ? 0.3 : cfg.width);

      // Check if either endpoint is visited by each algorithm
      const vBFS = (sets.bfs.explored.has(edge.from) || sets.bfs.explored.has(edge.to)) && !(sets.bfs.path.has(edge.from) && sets.bfs.path.has(edge.to));
      const vDFS = (sets.dfs.explored.has(edge.from) || sets.dfs.explored.has(edge.to)) && !(sets.dfs.path.has(edge.from) && sets.dfs.path.has(edge.to));
      const vHYB = (sets.hyb.explored.has(edge.from) || sets.hyb.explored.has(edge.to)) && !(sets.hyb.path.has(edge.from) && sets.hyb.path.has(edge.to));

      if (vBFS || vDFS || vHYB) {
        // Calculate perpendicular offset for stacking
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const perpX = -dy / len, perpY = dx / len;
        const stackOffset = baseWidth * 1.5;
        
        const algoLines = [
          { active: vBFS, color: cBFS, offset: -stackOffset },
          { active: vDFS, color: cDFS, offset: 0 },
          { active: vHYB, color: cHYB, offset: stackOffset }
        ];

        algoLines.forEach(algo => {
          if (algo.active) {
            const offsetX = perpX * algo.offset;
            const offsetY = perpY * algo.offset;
            ctx.beginPath();
            ctx.moveTo(x1 + offsetX, y1 + offsetY);
            ctx.lineTo(x2 + offsetX, y2 + offsetY);
            ctx.strokeStyle = getRgba(algo.color, 0.3);
            ctx.lineWidth = baseWidth * 1.2;
            ctx.stroke();
          }
        });
      }
    });

    // Spatial tracker array to prevent text elements bumping into each other
    const renderedTextPositions: { x: number; y: number; radius: number }[] = [];

    // 3. Draw Nodes & Non-Overlapping Text
    visibleNodes.forEach(node => {
      const cfg = NODE_CONFIG[node.type] ?? { icon: '⬤', radius: 16, baseColor: '#374151' };
      const cx = sx(node.x), cy = sy(node.y);
      const isBlocked = activeBlocked.has(node.id);
      const isSource = node.id === graph.sourceId;
      const isDest = graph.destinationIds.includes(node.id);

      const currBFS = sets.bfs.current === node.id;
      const currDFS = sets.dfs.current === node.id;
      const currHYB = sets.hyb.current === node.id;
      const isImportant = isSource || isDest || currBFS || currDFS || currHYB;
      
      const expBFS = sets.bfs.explored.has(node.id);
      const expDFS = sets.dfs.explored.has(node.id);
      const expHYB = sets.hyb.explored.has(node.id);
      
      const activeExplorations = [
        { id: 'bfs', active: expBFS, color: cBFS },
        { id: 'dfs', active: expDFS, color: cDFS },
        { id: 'hyb', active: expHYB, color: cHYB }
      ].filter(e => e.active);

      let r = isMassive ? (isImportant ? 4.5 : 1.2) : cfg.radius;
      if (isDatacenter) r = isImportant ? 8 : 4.5;
      
      const radiiMassive = [2.2, 1.2, 0.6];
      const radiiNormal = [r * 0.85, r * 0.55, r * 0.25];
      const strokesMassive = [0.5, 0.3, 0.1];
      const strokesNormal = [2, 1.5, 1];

      const currentRadii = isMassive ? radiiMassive : radiiNormal;
      const currentStrokes = isMassive ? strokesMassive : strokesNormal;

      let fillColor = cfg.baseColor;
      let opacity = (isMassive && !isImportant) ? 0.3 : 1;
      const blockedIcon = scenario === 'gameai' ? '✖' : '💀';

      if (isBlocked) { fillColor = '#450a0a'; opacity = 1; } 
      else if (isSource) { fillColor = '#16a34a'; } 
      else if (isDest) { fillColor = '#b91c1c'; }

      // Outer active search rings
      if (currBFS || currDFS || currHYB) {
        ctx.shadowBlur = 6;
        ctx.lineWidth = 1.5;
        if (currBFS) { ctx.beginPath(); ctx.arc(cx, cy, r + (isMassive ? 2 : 8), 0, Math.PI * 2); ctx.strokeStyle = cBFS; ctx.shadowColor = cBFS; ctx.stroke(); }
        if (currDFS) { ctx.beginPath(); ctx.arc(cx, cy, r + (isMassive ? 4 : 12), 0, Math.PI * 2); ctx.strokeStyle = cDFS; ctx.shadowColor = cDFS; ctx.stroke(); }
        if (currHYB) { ctx.beginPath(); ctx.arc(cx, cy, r + (isMassive ? 6 : 16), 0, Math.PI * 2); ctx.strokeStyle = cHYB; ctx.shadowColor = cHYB; ctx.stroke(); }
        ctx.shadowBlur = 0; 
      }

      // Base node point geometry
      if (isBlocked || isSource || isDest || activeExplorations.length === 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = getRgba(fillColor, opacity);
        ctx.fill();
        if (!isMassive || isImportant) {
          ctx.lineWidth = isBlocked ? 2 : 1;
          ctx.strokeStyle = isBlocked ? '#ef4444' : '#374151';
          ctx.stroke();
        }
      } else {
        activeExplorations.forEach((exp, index) => {
          ctx.beginPath();
          ctx.arc(cx, cy, currentRadii[index], 0, Math.PI * 2);
          ctx.fillStyle = exp.color;
          ctx.fill();
          ctx.lineWidth = currentStrokes[index];
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        });
      }
      
      // Text Typography Rendering Controls
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const displayLabel = node.label ? node.label.split('\n')[0].trim() : '';
      const isGenericLink = displayLabel.toLowerCase().includes('local link section') || 
                            displayLabel.toLowerCase().includes('node/') || 
                            displayLabel.includes('#');
      const isKnownPlace = displayLabel && !isGenericLink;

      const shouldShowStreetLabel = isMassive && isKnownPlace && zoom >= 1.5;
      const shouldShowNormalLabel = (!isMassive && isKnownPlace) || isImportant;

      if (shouldShowStreetLabel) {
        const screenX = (cx * zoom) + pan.x;
        const screenY = (cy * zoom) + pan.y;

        const separationThreshold = Math.max(50 / (zoom * 0.15), 35); 

        const isOverlapping = renderedTextPositions.some(pos => {
          const distance = Math.hypot(pos.x - screenX, pos.y - screenY);
          return distance < separationThreshold;
        });

        if (!isOverlapping || isImportant) {
          // Standard inverse scaling keeps text size perfectly locked on your screen
          const baseFontSize = isImportant ? 16 : 14; 
          const dynamicFontSize = baseFontSize / zoom; 
          ctx.font = `${isImportant ? 'bold' : '600'} ${dynamicFontSize}px sans-serif`;
          
          ctx.lineJoin = 'round';
          ctx.lineWidth = 3 / zoom;
          ctx.strokeStyle = '#0a0f1e'; 
          
          const labelOffsetY = r + (10 / zoom);
          ctx.strokeText(displayLabel, cx, cy - labelOffsetY);
          
          ctx.fillStyle = isImportant ? '#fb923c' : '#f1f5f9'; 
          ctx.fillText(displayLabel, cx, cy - labelOffsetY);

          renderedTextPositions.push({ x: screenX, y: screenY, radius: separationThreshold });
        }
      } else if (shouldShowNormalLabel && displayLabel) {
        if (isMassive && isImportant) {
          const dynamicFontSize = 16 / zoom;
          ctx.font = `bold ${dynamicFontSize}px sans-serif`;
          ctx.strokeStyle = '#0a0f1e';
          ctx.lineWidth = 3 / zoom;
          
          const labelOffsetY = r + (10 / zoom);
          ctx.strokeText(displayLabel, cx, cy - labelOffsetY);
          
          ctx.fillStyle = isSource ? '#4ade80' : isDest ? '#f87171' : '#fb923c';
          ctx.fillText(displayLabel, cx, cy - labelOffsetY);
        } else if (!isMassive) {
          if (!isDatacenter) {
            // Inner icon size locked strictly to node radius (no zoom division math)
            const iconSize = r * 1.1; 
            ctx.font = `${iconSize}px sans-serif`;
            ctx.fillText(isBlocked ? blockedIcon : cfg.icon, cx, cy);
            
            // Labels stay a readable constant size on screen
            const baseLabelSize = isImportant ? 14 : 12;
            const labelSize = baseLabelSize / zoom;
            ctx.font = `${isImportant ? 'bold ' : ''}${labelSize}px sans-serif`;
            ctx.fillStyle = '#cbd5e1';
            
            const labelOffsetY = r + (12 / zoom);
            ctx.fillText(displayLabel, cx, cy + labelOffsetY);
          } else {
            const iconSize = r * 1.3;
            ctx.font = `${iconSize}px sans-serif`;
            ctx.fillText(isBlocked ? blockedIcon : cfg.icon, cx, cy);
            
            const baseLabelSize = isImportant ? 12 : 10;
            const labelSize = baseLabelSize / zoom;
            const labelY = cy + r + (8 / zoom);
            
            ctx.font = `${labelSize}px sans-serif`;
            ctx.lineWidth = 2 / zoom;
            ctx.strokeStyle = '#0f172a';
            ctx.strokeText(displayLabel, cx, labelY);
            
            ctx.fillStyle = '#f8fafc';
            ctx.fillText(displayLabel, cx, labelY);
          }
        }
      }
    });

  // Adding windowDimensions to the dependency array ensures resizing updates the canvas visually
  }, [visibleNodes, visibleEdges, visibleNodeMap, pan, zoom, sets, activeBlocked, width, height, scenario, isMassive, isDatacenter, cBFS, cDFS, cHYB, scale, offsetX, offsetY, windowDimensions]);

  // Mouse Handlers
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFollowing) setIsFollowing(false);
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);
  
  // Touch Handlers for Mobile Support
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isFollowing) setIsFollowing(false);
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
  };
  const handleTouchEnd = () => setIsDragging(false);

  const resetZoom = () => { setIsFollowing(false); setZoom(1); setPan({ x: 0, y: 0 }); };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-hidden" 
      style={{ background: '#0a0f1e', cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
      onWheel={handleWheel} 
      onMouseDown={handleMouseDown} 
      onMouseMove={handleMouseMove} 
      onMouseUp={handleMouseUp} 
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      
      {isLayeredMap && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-900/90 p-1.5 rounded-xl border border-gray-700 backdrop-blur-sm z-20 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)]">
          <button onClick={() => setActiveFloor('GL')} className={`px-8 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${activeFloor === 'GL' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>GL (Ground)</button>
          <button onClick={() => setActiveFloor('L2')} className={`px-8 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${activeFloor === 'L2' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>L2 (Second)</button>
        </div>
      )}

      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
        <div className="bg-gray-900/80 border border-gray-700 rounded px-2 py-1 text-[10px] font-mono text-gray-400 select-none text-center">
          Zoom: {zoom.toFixed(1)}x
        </div>
        <button onClick={toggleFullscreen} className="w-8 h-8 bg-gray-800 border border-gray-600 rounded text-white flex items-center justify-center hover:bg-gray-700 cursor-pointer text-lg transition-colors" title="Toggle Fullscreen">{isFullscreen ? '✖' : '⛶'}</button>
        <button onClick={() => setIsFollowing(!isFollowing)} className={`w-8 h-8 border rounded flex items-center justify-center cursor-pointer text-lg transition-colors ${isFollowing ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="Follow Algorithms">🎯</button>
        <button onClick={() => { setIsFollowing(false); setZoom(z => Math.min(z * 1.5, 30)); }} className="w-8 h-8 bg-gray-800 border border-gray-600 rounded text-white flex items-center justify-center hover:bg-gray-700 cursor-pointer text-xl font-bold transition-colors">+</button>
        <button onClick={() => { setIsFollowing(false); setZoom(z => Math.max(z / 1.5, 0.2)); }} className="w-8 h-8 bg-gray-800 border border-gray-600 rounded text-white flex items-center justify-center hover:bg-gray-700 cursor-pointer text-xl font-bold transition-colors">-</button>
        <button onClick={resetZoom} className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs font-bold text-gray-300 hover:bg-gray-700 cursor-pointer transition-colors">Reset</button>
      </div>

      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
};
