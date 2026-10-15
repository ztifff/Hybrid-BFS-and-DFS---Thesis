import React, { useMemo, useState, useEffect, useRef } from 'react';
import { NetworkCanvasProps, NODE_CONFIG } from './types';
import { useCanvasInteraction } from './useCanvasInteraction';
import { useCanvasAnimation } from './useCanvasAnimation';
import { CanvasControls } from './CanvasControls';
import { renderCanvas } from './renderer';
import { GraphNode, AlgorithmStep } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { onCiscoIconsChange } from '../../utils/ciscoIcons';
import { onSMRosaBlueprintChange } from './renderers/scenarios/evacuation/smRosaFloorPlan';
import { onEvacuationIconsChange } from './evacuationNodeIcons';

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
  isMoveMode,
  placementModeType,
  onNodeMoveEnd,
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
  const [iconRevision, setIconRevision] = useState(0);

  // Node movement and hover states
  const [draggedNodePos, setDraggedNodePos] = useState<{ id: string; x: number; y: number } | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const nodeDragRef = useRef<{
    nodeId: string;
    initialNodeX: number;
    initialNodeY: number;
    offsetNodeX: number;
    offsetNodeY: number;
    hasMoved: boolean;
  } | null>(null);

  useEffect(() => {
    const unsubIcons = onCiscoIconsChange(() => setIconRevision(r => r + 1));
    const unsubBlueprint = onSMRosaBlueprintChange(() => setIconRevision(r => r + 1));
    const unsubEvacuationIcons = onEvacuationIconsChange(() => setIconRevision(r => r + 1));
    return () => {
      unsubIcons();
      unsubBlueprint();
      unsubEvacuationIcons();
    };
  }, []);

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
      const hasAnotherVisibleAlgo = (['bfs', 'dfs', 'hybrid'] as const).some(
        candidate => candidate !== algo && prev[candidate] && (activeAlgorithms ? activeAlgorithms[candidate] : true),
      );
      // Keep at least one enabled algorithm visible on the canvas.
      if (willBeHidden && !hasAnotherVisibleAlgo) return prev;
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

  const baseVisibleNodes = useMemo(() => {
    if (!isLayeredMap) return nodes;
    // Keep stairwells visible across floors so users can see the vertical
    // connections, while hiding rooms, exits, and corridors belonging to the
    // other floor. Nodes without a floor assignment remain shared/global.
    return nodes.filter(n => !n.buildingId || n.buildingId === activeFloor || n.type === 'stairwell');
  }, [nodes, activeFloor, isLayeredMap]);

  const visibleNodes = useMemo(() => {
    if (!draggedNodePos) return baseVisibleNodes;
    return baseVisibleNodes.map(n => n.id === draggedNodePos.id ? { ...n, x: draggedNodePos.x, y: draggedNodePos.y } : n);
  }, [baseVisibleNodes, draggedNodePos]);

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
      activeFloor,
      isDatacenter,
      isMassive,
      visibleNodes,
      visibleEdges,
      visibleNodeMap,
      activeBlocked,
      wasHistoricallyBlocked,
      highlightedNodeId: draggedNodePos 
        ? draggedNodePos.id 
        : (hoveredNodeId && (isMoveMode || placementModeType === 'rename') ? hoveredNodeId : highlightedNodeId),
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
    workspaceView, isSimulationFinished, showHopBadges, currentTheme, iconRevision, activeFloor,
    draggedNodePos, hoveredNodeId, isMoveMode, placementModeType
  ]);

  // Coordinate helper
  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    return {
      x: (mouseX - pan.x) / zoom,
      y: (mouseY - pan.y) / zoom,
    };
  };

  // Zoom-aware Node hit test helper (guarantees minimum screen hit target)
  const findNodeAtCoords = (x: number, y: number) => {
    let hitNode: GraphNode | null = null;
    let minDist = Infinity;
    const minScreenHitPx = 36;
    const effectiveMinRadius = minScreenHitPx / Math.max(zoom, 0.1);

    for (const node of visibleNodes) {
      const cx = (node.x * scale) + offsetX;
      const cy = (node.y * scale) + offsetY;
      const dx = cx - x;
      const dy = cy - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const nodeCfgRadius = (NODE_CONFIG[node.type]?.radius || 20) * 1.5;
      const hitRadius = Math.max(effectiveMinRadius, nodeCfgRadius);
      if (dist < hitRadius && dist < minDist) {
        minDist = dist;
        hitNode = node;
      }
    }
    return hitNode;
  };

  // Global mouseup listener to guarantee drag release anywhere on screen
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (nodeDragRef.current) {
        const { nodeId, hasMoved } = nodeDragRef.current;
        const currentPos = draggedNodePos;
        nodeDragRef.current = null;
        setDraggedNodePos(null);

        if (hasMoved && currentPos && onNodeMoveEnd) {
          onNodeMoveEnd(nodeId, currentPos.x, currentPos.y);
        }
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [draggedNodePos, onNodeMoveEnd]);

  // Drag & Move Mouse Handlers
  const onMouseDownWrapper = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (coords && isMoveMode) {
      const hitNode = findNodeAtCoords(coords.x, coords.y);
      if (hitNode) {
        setFollowAlgo(null);
        nodeDragRef.current = {
          nodeId: hitNode.id,
          initialNodeX: hitNode.x,
          initialNodeY: hitNode.y,
          offsetNodeX: hitNode.x - ((coords.x - offsetX) / scale),
          offsetNodeY: hitNode.y - ((coords.y - offsetY) / scale),
          hasMoved: false
        };
        setDraggedNodePos({ id: hitNode.id, x: hitNode.x, y: hitNode.y });
        return;
      }
    }
    handleMouseDown(e, () => setFollowAlgo(null));
  };

  const onMouseMoveWrapper = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);

    // Dynamic hover feedback in move or rename mode
    if (coords && !nodeDragRef.current && (isMoveMode || placementModeType === 'rename')) {
      const hitNode = findNodeAtCoords(coords.x, coords.y);
      setHoveredNodeId(hitNode ? hitNode.id : null);
    } else if (hoveredNodeId && !nodeDragRef.current && !isMoveMode && placementModeType !== 'rename') {
      setHoveredNodeId(null);
    }

    if (nodeDragRef.current && coords) {
      const { nodeId, offsetNodeX, offsetNodeY, initialNodeX, initialNodeY } = nodeDragRef.current;
      const rawX = ((coords.x - offsetX) / scale) + offsetNodeX;
      const rawY = ((coords.y - offsetY) / scale) + offsetNodeY;
      const clampedX = Math.round(Math.max(20, Math.min(width - 20, rawX)));
      const clampedY = Math.round(Math.max(20, Math.min(height - 20, rawY)));

      if (Math.abs(clampedX - initialNodeX) > 2 || Math.abs(clampedY - initialNodeY) > 2) {
        nodeDragRef.current.hasMoved = true;
        hasDragged.current = true;
      }

      setDraggedNodePos({ id: nodeId, x: clampedX, y: clampedY });
      return;
    }

    handleMouseMove(e);
  };

  const onMouseUpWrapper = () => {
    if (nodeDragRef.current) {
      const { nodeId, hasMoved } = nodeDragRef.current;
      const currentPos = draggedNodePos;
      nodeDragRef.current = null;
      setDraggedNodePos(null);

      if (hasMoved && currentPos && onNodeMoveEnd) {
        onNodeMoveEnd(nodeId, currentPos.x, currentPos.y);
      }
      return;
    }

    handleMouseUp();
  };

  const onMouseLeaveWrapper = () => {
    if (nodeDragRef.current) {
      const { nodeId, hasMoved } = nodeDragRef.current;
      const currentPos = draggedNodePos;
      nodeDragRef.current = null;
      setDraggedNodePos(null);

      if (hasMoved && currentPos && onNodeMoveEnd) {
        onNodeMoveEnd(nodeId, currentPos.x, currentPos.y);
      }
    }
    setHoveredNodeId(null);
    handleMouseLeave();
  };

  // Drag & Move Touch Handlers
  const onTouchStartWrapper = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && isMoveMode) {
      const coords = getCanvasCoords(e.touches[0].clientX, e.touches[0].clientY);
      if (coords) {
        const hitNode = findNodeAtCoords(coords.x, coords.y);
        if (hitNode) {
          setFollowAlgo(null);
          nodeDragRef.current = {
            nodeId: hitNode.id,
            initialNodeX: hitNode.x,
            initialNodeY: hitNode.y,
            offsetNodeX: hitNode.x - ((coords.x - offsetX) / scale),
            offsetNodeY: hitNode.y - ((coords.y - offsetY) / scale),
            hasMoved: false
          };
          setDraggedNodePos({ id: hitNode.id, x: hitNode.x, y: hitNode.y });
          return;
        }
      }
    }
    handleTouchStart(e, () => setFollowAlgo(null));
  };

  const onTouchMoveWrapper = (e: React.TouchEvent<HTMLDivElement>) => {
    if (nodeDragRef.current && e.touches.length === 1) {
      const coords = getCanvasCoords(e.touches[0].clientX, e.touches[0].clientY);
      if (coords) {
        const { nodeId, offsetNodeX, offsetNodeY, initialNodeX, initialNodeY } = nodeDragRef.current;
        const rawX = ((coords.x - offsetX) / scale) + offsetNodeX;
        const rawY = ((coords.y - offsetY) / scale) + offsetNodeY;
        const clampedX = Math.round(Math.max(20, Math.min(width - 20, rawX)));
        const clampedY = Math.round(Math.max(20, Math.min(height - 20, rawY)));

        if (Math.abs(clampedX - initialNodeX) > 2 || Math.abs(clampedY - initialNodeY) > 2) {
          nodeDragRef.current.hasMoved = true;
          hasDragged.current = true;
        }

        setDraggedNodePos({ id: nodeId, x: clampedX, y: clampedY });
        return;
      }
    }
    handleTouchMove(e);
  };

  const onTouchEndWrapper = () => {
    if (nodeDragRef.current) {
      const { nodeId, hasMoved } = nodeDragRef.current;
      const currentPos = draggedNodePos;
      nodeDragRef.current = null;
      setDraggedNodePos(null);

      if (hasMoved && currentPos && onNodeMoveEnd) {
        onNodeMoveEnd(nodeId, currentPos.x, currentPos.y);
      }
      return;
    }
    handleTouchEnd();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !onNodeClick) return;
    if (hasDragged.current) return; // Ignore click if we were dragging

    const coords = getCanvasCoords(e.clientX, e.clientY);
    if (!coords) return;
    const { x, y } = coords;

    const hitNode = findNodeAtCoords(x, y);

    if (hitNode) {
      onNodeClick(hitNode.id);
    } else {
      let clickedEdgeId: string | null = null;
      if (placementModeType === 'delete') {
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
      }

      if (clickedEdgeId && onEdgeClick) {
        onEdgeClick(clickedEdgeId);
      } else {
        onDeselect?.();
        const nodeX = (x - offsetX) / scale;
        const nodeY = (y - offsetY) / scale;
        onCanvasClick?.(nodeX, nodeY, activeFloor);
      }
    }
  };

  const effectiveCursor = useMemo(() => {
    if (isMoveMode) {
      if (draggedNodePos) return 'grabbing';
      if (hoveredNodeId) return 'grab';
      return 'move';
    }
    if (placementModeType === 'rename') {
      if (hoveredNodeId) return 'pointer';
      return 'default';
    }
    if (cursor) return cursor;
    return isDragging ? 'grabbing' : 'grab';
  }, [isMoveMode, draggedNodePos, hoveredNodeId, placementModeType, cursor, isDragging]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-hidden transition-colors duration-200" 
      style={{ background: currentTheme === 'light' ? '#f8fafc' : '#0a0f1e', cursor: effectiveCursor, touchAction: 'none' }}
      onWheel={handleWheel} 
      onMouseDown={onMouseDownWrapper} 
      onMouseMove={onMouseMoveWrapper} 
      onMouseUp={onMouseUpWrapper} 
      onMouseLeave={onMouseLeaveWrapper}
      onClick={handleCanvasClick}
      onTouchStart={onTouchStartWrapper}
      onTouchMove={onTouchMoveWrapper}
      onTouchEnd={onTouchEndWrapper}
      onTouchCancel={onTouchEndWrapper}
    >
      <CanvasControls
        zoom={zoom} setZoom={setZoom} resetZoom={resetZoom}
        isLayeredMap={isLayeredMap} activeFloor={activeFloor} setActiveFloor={setActiveFloor} uniqueFloors={uniqueFloors}
        visibleAlgos={visibleAlgos} toggleAlgo={toggleAlgo}
        followAlgo={followAlgo} setFollowAlgo={setFollowAlgo}
        activeAlgorithms={activeAlgorithms}
      />

      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
};
