import React, { useMemo, useState, useEffect } from 'react';
import { NetworkCanvasProps } from './types';
import { useCanvasInteraction } from './useCanvasInteraction';
import { useCanvasAnimation } from './useCanvasAnimation';
import { CanvasControls } from './CanvasControls';
import { renderCanvas } from './renderer';
import { GraphNode, AlgorithmStep } from '../../types';
import { useTheme } from '../../context/ThemeContext';

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  graph,
  activeSteps,
  scenario,
  dynamicEvents,
  stepIndex,
  historicalBlockedNodeIds,
  highlightedNodeId,
  onDeselect,
  onNodeClick,
  onEdgeClick,
  onCanvasClick,
  mapId,
  autoFit,
  shelfBoxCounts,
  robotAssignments,
  activeAlgorithms,
  workspaceView,
  cursor,
  isFinished,
  showHopBadges = true,
  theme: propTheme,
}) => {
  const { theme: ctxTheme } = useTheme();
  const currentTheme = propTheme || ctxTheme;
  const { nodes, edges, width, height } = graph;

  const isSimulationFinished = Boolean(isFinished);

  // Pre-scale massive maps down to ~2000x2000 so the zoom baseline is around 1.0 (to avoid hitting minZoom bounds)
  const maxMapSize = 2000;
  const needsPreScale = width > maxMapSize || height > maxMapSize;
  const preScale = needsPreScale ? Math.min(maxMapSize / width, maxMapSize / height) : 1;
  const drawnWidth = width * preScale;
  const drawnHeight = height * preScale;

  const {
    containerRef, canvasRef,
    zoom, setZoom, pan, setPan, isDragging, windowDimensions,
    handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave,
    handleTouchStart, handleTouchMove, handleTouchEnd, resetZoom, hasDragged
  } = useCanvasInteraction({ autoFit, width: drawnWidth, height: drawnHeight, mapId, scenario, onDeselect, highlightedNodeId });

  const { animateTo } = useCanvasAnimation({ setZoom, setPan });

  const [activeFloor, setActiveFloor] = useState<string>('L1');
  const [followAlgo, setFollowAlgo] = useState<'bfs' | 'dfs' | 'hybrid' | null>(null);
  const [visibleAlgos, setVisibleAlgos] = useState({ bfs: true, dfs: true, hybrid: true });
  const [isShowOpen, setIsShowOpen] = useState(false);
  const [isFollowOpen, setIsFollowOpen] = useState(false);

  // Sync header pill toggles → canvas visibility
  useEffect(() => {
    if (!activeAlgorithms) return;
    setVisibleAlgos(prev => {
      const next = {
        bfs: activeAlgorithms.bfs ? prev.bfs : false,
        dfs: activeAlgorithms.dfs ? prev.dfs : false,
        hybrid: activeAlgorithms.hybrid ? prev.hybrid : false,
      };
      // If an algo was just re-enabled, restore it to visible
      if (activeAlgorithms.bfs && !prev.bfs) next.bfs = true;
      if (activeAlgorithms.dfs && !prev.dfs) next.dfs = true;
      if (activeAlgorithms.hybrid && !prev.hybrid) next.hybrid = true;
      return next;
    });
  }, [activeAlgorithms?.bfs, activeAlgorithms?.dfs, activeAlgorithms?.hybrid]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAlgo = (algo: 'bfs' | 'dfs' | 'hybrid') => {
    setVisibleAlgos(prev => {
      const willBeHidden = prev[algo];
      if (willBeHidden && followAlgo === algo) {
        setFollowAlgo(null);
      }
      return { ...prev, [algo]: !prev[algo] };
    });
  };

  // Environment checks
  const isDatacenter = scenario === 'network' && width > 100000;
  const uniqueFloors = useMemo(() => {
    const floors = new Set<string>();
    nodes.forEach(n => { if (n.buildingId) floors.add(n.buildingId); });
    return Array.from(floors).sort();
  }, [nodes]);

  // Reset active floor to first available floor when the map changes
  useEffect(() => {
    if (uniqueFloors.length > 0 && !uniqueFloors.includes(activeFloor)) {
      setActiveFloor(uniqueFloors[0]);
    }
  }, [uniqueFloors]); // eslint-disable-line react-hooks/exhaustive-deps

  const isLayeredMap = (scenario === 'network' && (mapId === 'campus' || mapId === 'companybusiness')) || (scenario === 'robotics' && mapId === 'clinic') || (scenario === 'evacuation' && (mapId === 'building' || mapId === 'city' || mapId === 'synthetic'));
  const isDenseProcedural = nodes.length > 500 && width <= 100000 && !isLayeredMap && (scenario === 'network' || scenario === 'evacuation');
  const isMassive = nodes.length > 500 || isDenseProcedural;

  const cw = containerRef.current?.getBoundingClientRect().width || windowDimensions.w;
  const ch = containerRef.current?.getBoundingClientRect().height || windowDimensions.h;

  const scale = preScale;

  const offsetX = (cw - drawnWidth) / 2;
  const offsetY = (ch - drawnHeight) / 2;

  // Process data for renderer
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

  const wasHistoricallyBlocked = historicalBlockedNodeIds ?? new Set<string>();

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

  // Handle highlighted node animateTo
  useEffect(() => {
    if (!highlightedNodeId || !containerRef.current) return;
    const node = nodes.find(n => n.id === highlightedNodeId);
    if (!node) return;

    if (isLayeredMap && node.buildingId) {
      setActiveFloor(node.buildingId);
    }

    const targetZoom = Math.max(zoom, 3.5);
    const nodeScreenX = (node.x * scale) + offsetX;
    const nodeScreenY = (node.y * scale) + offsetY;
    const containerW = containerRef.current.getBoundingClientRect().width;
    const containerH = containerRef.current.getBoundingClientRect().height;
    animateTo(targetZoom, containerW / 2 - nodeScreenX * targetZoom, containerH / 2 - nodeScreenY * targetZoom);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedNodeId]);

  // Handle follow algorithm animateTo
  useEffect(() => {
    if (!followAlgo || !containerRef.current) return;
    const currentNodeId = followAlgo === 'hybrid'
      ? activeSteps.hybrid?.current
      : followAlgo === 'bfs'
        ? activeSteps.bfs?.current
        : activeSteps.dfs?.current;

    if (!currentNodeId) return;
    const node = nodes.find(n => n.id === currentNodeId);
    if (!node) return;

    if (isLayeredMap && node.buildingId) {
      setActiveFloor(node.buildingId);
    }

    const nodeScreenX = (node.x * scale) + offsetX;
    const nodeScreenY = (node.y * scale) + offsetY;
    const containerW = containerRef.current.getBoundingClientRect().width;
    const containerH = containerRef.current.getBoundingClientRect().height;
    animateTo(zoom, containerW / 2 - nodeScreenX * zoom, containerH / 2 - nodeScreenY * zoom);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followAlgo, stepIndex]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    renderCanvas({
      ctx,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      zoom,
      pan,
      scale,
      offsetX,
      offsetY,
      scenario,
      mapId,
      isDatacenter,
      isMassive,
      visibleNodes,
      visibleEdges,
      visibleNodeMap,
      activeBlocked,
      wasHistoricallyBlocked,
      highlightedNodeId,
      sourceId: graph.sourceId,
      sourceIds: graph.sourceIds,
      destinationIds: graph.destinationIds,
      visibleAlgos,
      sets,
      activeSteps,
      graph,
      shelfBoxCounts,
      robotAssignments,
      followAlgo,
      workspaceView,
      isFinished: isSimulationFinished,
      showHopBadges,
      theme: currentTheme
    });
  }, [
    visibleNodes, visibleEdges, visibleNodeMap, pan, zoom, sets, activeBlocked, 
    width, height, scenario, isMassive, isDatacenter, scale, offsetX, offsetY, 
    windowDimensions, highlightedNodeId, visibleAlgos, mapId, wasHistoricallyBlocked,
    graph.sourceId, graph.destinationIds, activeSteps, followAlgo, canvasRef,
    workspaceView, isSimulationFinished, showHopBadges, currentTheme
  ]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !onNodeClick) return;
    if (hasDragged.current) return; // Ignore click if we were dragging

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Reverse transform to find canvas coordinates (matches BaseRenderer.ts: translate(pan), then scale(zoom))
    const x = (mouseX - pan.x) / zoom;
    const y = (mouseY - pan.y) / zoom;

    let clickedNodeId: string | null = null;
    let minDist = Infinity;

    for (const node of visibleNodes) {
      const cx = (node.x * scale) + offsetX;
      const cy = (node.y * scale) + offsetY;
      
      const dx = cx - x;
      const dy = cy - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 30 && dist < minDist) {
        minDist = dist;
        clickedNodeId = node.id;
      }
    }

    if (clickedNodeId) {
      onNodeClick(clickedNodeId);
    } else {
      let clickedEdgeId: string | null = null;
      let minEdgeDistSq = 100; // within 10 virtual pixels distance squared
      
      for (const edge of visibleEdges) {
        const fromNode = visibleNodeMap.get(edge.from);
        const toNode = visibleNodeMap.get(edge.to);
        if (!fromNode || !toNode) continue;
        
        const cx1 = (fromNode.x * scale) + offsetX;
        const cy1 = (fromNode.y * scale) + offsetY;
        const cx2 = (toNode.x * scale) + offsetX;
        const cy2 = (toNode.y * scale) + offsetY;
        
        const l2 = (cx2 - cx1)**2 + (cy2 - cy1)**2;
        if (l2 === 0) continue;
        let t = ((x - cx1) * (cx2 - cx1) + (y - cy1) * (cy2 - cy1)) / l2;
        t = Math.max(0, Math.min(1, t));
        const projX = cx1 + t * (cx2 - cx1);
        const projY = cy1 + t * (cy2 - cy1);
        const distSq = (x - projX)**2 + (y - projY)**2;
        
        if (distSq < minEdgeDistSq) {
          minEdgeDistSq = distSq;
          clickedEdgeId = edge.id;
        }
      }

      if (clickedEdgeId && onEdgeClick) {
        onEdgeClick(clickedEdgeId);
      } else {
        onDeselect?.();
        const nodeX = (x - offsetX) / scale;
        const nodeY = (y - offsetY) / scale;
        onCanvasClick?.(nodeX, nodeY);
      }
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-hidden transition-colors duration-200" 
      style={{ background: currentTheme === 'light' ? '#f8fafc' : '#0a0f1e', cursor: cursor || (isDragging ? 'grabbing' : 'grab'), touchAction: 'none' }}
      onWheel={handleWheel} 
      onMouseDown={(e) => handleMouseDown(e, () => setFollowAlgo(null))} 
      onMouseMove={handleMouseMove} 
      onMouseUp={handleMouseUp} 
      onMouseLeave={handleMouseLeave}
      onClick={handleCanvasClick}
      onTouchStart={(e) => handleTouchStart(e, () => setFollowAlgo(null))}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <CanvasControls
        zoom={zoom} setZoom={setZoom} resetZoom={resetZoom}
        isLayeredMap={isLayeredMap} activeFloor={activeFloor} setActiveFloor={setActiveFloor} uniqueFloors={uniqueFloors}
        isShowOpen={isShowOpen} setIsShowOpen={setIsShowOpen} visibleAlgos={visibleAlgos} toggleAlgo={toggleAlgo}
        isFollowOpen={isFollowOpen} setIsFollowOpen={setIsFollowOpen} followAlgo={followAlgo} setFollowAlgo={setFollowAlgo}
        activeAlgorithms={activeAlgorithms}
      />

      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
};
