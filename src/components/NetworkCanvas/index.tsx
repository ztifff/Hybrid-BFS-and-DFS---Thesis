import React, { useMemo, useState, useEffect } from 'react';
import { NetworkCanvasProps } from './types';
import { useCanvasInteraction } from './useCanvasInteraction';
import { useCanvasAnimation } from './useCanvasAnimation';
import { CanvasControls } from './CanvasControls';
import { renderCanvas } from './renderer';
import { GraphNode, AlgorithmStep } from '../../types';

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
  mapId,
  autoFit,
  shelfBoxCounts,
  robotAssignments,
}) => {
  const { nodes, edges, width, height } = graph;

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
  } = useCanvasInteraction({ autoFit, width: drawnWidth, height: drawnHeight, onDeselect, highlightedNodeId });

  const { animateTo } = useCanvasAnimation({ setZoom, setPan });

  const [activeFloor, setActiveFloor] = useState<string>('L2');
  const [followAlgo, setFollowAlgo] = useState<'bfs' | 'dfs' | 'hybrid' | null>(null);
  const [visibleAlgos, setVisibleAlgos] = useState({ bfs: true, dfs: true, hybrid: true });
  const [isShowOpen, setIsShowOpen] = useState(false);
  const [isFollowOpen, setIsFollowOpen] = useState(false);

  const toggleAlgo = (algo: 'bfs' | 'dfs' | 'hybrid') => setVisibleAlgos(prev => ({ ...prev, [algo]: !prev[algo] }));

  // Environment checks
  const isDatacenter = scenario === 'network' && width > 100000;
  const uniqueFloors = useMemo(() => {
    const floors = new Set<string>();
    nodes.forEach(n => { if (n.buildingId) floors.add(n.buildingId); });
    return Array.from(floors).sort();
  }, [nodes]);
  const isLayeredMap = (scenario === 'network' && (mapId === 'campus' || mapId === 'companybusiness')) || (scenario === 'robotics' && mapId === 'clinic') || (scenario === 'evacuation' && mapId === 'building');
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

    const targetZoom = 3.5;
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
      followAlgo
    });
  }, [
    visibleNodes, visibleEdges, visibleNodeMap, pan, zoom, sets, activeBlocked, 
    width, height, scenario, isMassive, isDatacenter, scale, offsetX, offsetY, 
    windowDimensions, highlightedNodeId, visibleAlgos, mapId, wasHistoricallyBlocked,
    graph.sourceId, graph.destinationIds, activeSteps, followAlgo, canvasRef
  ]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !onNodeClick) return;
    if (hasDragged.current) return; // Ignore click if we were dragging

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const cw = rect.width;
    const ch = rect.height;

    // Reverse transform to find canvas coordinates
    const x = (mouseX - cw / 2) / zoom + cw / 2 - pan.x;
    const y = (mouseY - ch / 2) / zoom + ch / 2 - pan.y;

    const clickableNetworkNodes = ['mlt_sw1', 'main_router', 'college_router', 'hostel_router'];

    let clickedNodeId: string | null = null;
    let minDist = Infinity;

    for (const node of visibleNodes) {
      // If we're in network scenario, only allow clicking specific terminal nodes
      if (scenario === 'network' && !clickableNetworkNodes.includes(node.id)) {
        continue;
      }

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
      onDeselect?.();
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-hidden" 
      style={{ background: '#0a0f1e', cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
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
      />
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
};
