import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCanvasInteractionProps {
  initialZoom?: number;
  autoFit?: boolean;
  width: number;
  height: number;
  mapId?: string;
  scenario?: string;
  onDeselect?: () => void;
  highlightedNodeId?: string | null;
}

export function useCanvasInteraction({
  autoFit = true,
  width,
  height,
  mapId,
  scenario,
  onDeselect,
  highlightedNodeId
}: UseCanvasInteractionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [windowDimensions, setWindowDimensions] = useState({ w: 0, h: 0 });
  
  // Track if we actually moved during a drag to prevent accidental clicks
  const hasDragged = useRef(false);

  // Compute and apply full graph auto-fit
  const fitToGraph = useCallback(() => {
    if (!containerRef.current || width <= 0 || height <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;
    if (cw <= 0 || ch <= 0) return;

    if (scenario === 'gameai') {
      // The game board (Dama / Checkers) is a ~400-440px cluster centered at (width/2, height/2).
      // Standard full-canvas auto-fit treats the entire 1600x1200 arena as content,
      // resulting in a tiny 0.3x zoom where the board is barely visible.
      // Fit directly to the ~440px board bounds with comfortable margins.
      const boardContentSize = 440;
      const targetZoom = Math.min(
        (cw * 0.82) / boardContentSize,
        (ch * 0.82) / boardContentSize
      );
      const clampedZoom = Math.max(0.65, Math.min(targetZoom, 1.25));

      // Pan that puts the center of the drawn graph exactly at the canvas center
      const panX = (cw / 2) * (1 - clampedZoom);
      const panY = (ch / 2) * (1 - clampedZoom);

      setZoom(clampedZoom);
      setPan({ x: panX, y: panY });
      return;
    }

    // Use 88% of container dimensions to ensure comfortable breathing margins
    const targetZoom = Math.min(
      (cw * 0.88) / width,
      (ch * 0.88) / height
    );

    // Clamp zoom to [0.1, 1.05] so huge graphs fit completely and small graphs aren't oversized
    const clampedZoom = Math.max(0.1, Math.min(targetZoom, 1.05));

    // Pan that puts the center of the drawn graph exactly at the canvas center
    const panX = (cw / 2) * (1 - clampedZoom);
    const panY = (ch / 2) * (1 - clampedZoom);

    setZoom(clampedZoom);
    setPan({ x: panX, y: panY });
  }, [width, height, scenario]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => setWindowDimensions({ w: window.innerWidth, h: window.innerHeight });
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent Page Scroll when wheeling over canvas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventPageScroll = (e: WheelEvent) => { e.preventDefault(); };
    container.addEventListener('wheel', preventPageScroll, { passive: false });
    return () => container.removeEventListener('wheel', preventPageScroll);
  }, []);

  // Auto-fit whenever scenario, map, or dimensions change
  useEffect(() => {
    if (!autoFit) return;
    // Short timeout allows containerRef to have its rendered geometry
    const timer = setTimeout(() => {
      fitToGraph();
    }, 60);
    return () => clearTimeout(timer);
  }, [autoFit, width, height, mapId, scenario, fitToGraph]);

  // Also auto-fit on window resize if dimensions change
  useEffect(() => {
    if (!autoFit) return;
    fitToGraph();
  }, [autoFit, windowDimensions.w, windowDimensions.h, fitToGraph]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (highlightedNodeId) onDeselect?.();
    const scaleAdjust = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(zoom * scaleAdjust, 30)); 
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setPan(prev => ({
      x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
      y: mouseY - (mouseY - prev.y) * (newZoom / zoom)
    }));
    setZoom(newZoom);
  }, [highlightedNodeId, zoom, onDeselect]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, stopFollow: () => void) => {
    if (highlightedNodeId) onDeselect?.();
    stopFollow();
    setIsDragging(true);
    hasDragged.current = false;
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [highlightedNodeId, pan, onDeselect]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const dx = e.clientX - pan.x - dragStart.x;
    const dy = e.clientY - pan.y - dragStart.y;
    // Only count as a drag if moved more than 3 pixels
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDragged.current = true;
    }
    
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, dragStart, pan]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);
  const handleMouseLeave = useCallback(() => setIsDragging(false), []);

  const [initialPinchDist, setInitialPinchDist] = useState<number | null>(null);
  const [initialPinchZoom, setInitialPinchZoom] = useState<number>(1);

  const getPinchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>, stopFollow: () => void) => {
    if (highlightedNodeId) onDeselect?.();
    stopFollow();
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      setInitialPinchDist(getPinchDistance(e.touches));
      setInitialPinchZoom(zoom);
    }
  }, [highlightedNodeId, pan, onDeselect, zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && isDragging) {
      setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    } else if (e.touches.length === 2 && initialPinchDist !== null) {
      const currentDist = getPinchDistance(e.touches);
      const scaleAdjust = currentDist / initialPinchDist;
      const newZoom = Math.max(0.1, Math.min(initialPinchZoom * scaleAdjust, 30));
      
      // Calculate center of pinch for smooth zooming
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = centerX - rect.left;
      const mouseY = centerY - rect.top;
      
      setPan(prev => ({
        x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
        y: mouseY - (mouseY - prev.y) * (newZoom / zoom)
      }));
      setZoom(newZoom);
    }
  }, [isDragging, dragStart, initialPinchDist, initialPinchZoom, zoom]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setInitialPinchDist(null);
  }, []);

  const resetZoom = useCallback(() => { 
    fitToGraph();
  }, [fitToGraph]);

  return {
    containerRef,
    canvasRef,
    zoom,
    setZoom,
    pan,
    setPan,
    isDragging,
    windowDimensions,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetZoom,
    hasDragged,
  };
}

