import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCanvasInteractionProps {
  initialZoom?: number;
  autoFit?: boolean;
  width: number;
  height: number;
  onDeselect?: () => void;
  highlightedNodeId?: string | null;
}

export function useCanvasInteraction({ autoFit, width, height, onDeselect, highlightedNodeId }: UseCanvasInteractionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [windowDimensions, setWindowDimensions] = useState({ w: 0, h: 0 });
  
  // Track if we actually moved during a drag to prevent accidental clicks
  const hasDragged = useRef(false);

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

  // Auto-fit Logic
  useEffect(() => {
    if (autoFit && containerRef.current && width > 0 && height > 0) {
      const cw = containerRef.current.getBoundingClientRect().width;
      const ch = containerRef.current.getBoundingClientRect().height;
      if (width > cw || height > ch) {
        const targetZoom = Math.min(cw / width, ch / height) * 0.95;
        setZoom(targetZoom);
      }
    }
  }, [autoFit, width, height, windowDimensions.w, windowDimensions.h]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (highlightedNodeId) onDeselect?.();
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

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>, stopFollow: () => void) => {
    if (highlightedNodeId) onDeselect?.();
    stopFollow();
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  }, [highlightedNodeId, pan, onDeselect]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => setIsDragging(false), []);

  const resetZoom = useCallback(() => { 
    setZoom(1); 
    setPan({ x: 0, y: 0 }); 
  }, []);

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

