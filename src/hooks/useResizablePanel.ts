import { useState, useEffect, useCallback, useRef } from 'react';

interface UseResizablePanelProps {
  side: 'left' | 'right';
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  snapThreshold: number;
  storageKey: string;
}

export function useResizablePanel({
  side,
  defaultWidth,
  minWidth,
  maxWidth,
  snapThreshold,
  storageKey,
}: UseResizablePanelProps) {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(`${storageKey}_width`);
    return saved ? parseInt(saved, 10) : defaultWidth;
  });
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(`${storageKey}_collapsed`);
    return saved === 'true';
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startWidth: number } | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${storageKey}_width`, width.toString());
    localStorage.setItem(`${storageKey}_collapsed`, isCollapsed.toString());
  }, [width, isCollapsed, storageKey]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startWidth: width,
    };
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
  }, [width]);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragStartRef.current) return;
      
      const { startX, startWidth } = dragStartRef.current;
      const deltaX = e.clientX - startX;
      
      // If side is left, moving mouse right (positive deltaX) increases width.
      // If side is right, moving mouse left (negative deltaX) increases width.
      let newWidth = side === 'left' 
        ? startWidth + deltaX
        : startWidth - deltaX;
        
      if (newWidth < snapThreshold) {
        setIsCollapsed(true);
        setWidth(minWidth); // Reset underlying width to minWidth when collapsed
      } else {
        if (isCollapsed) setIsCollapsed(false);
        newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
        setWidth(newWidth);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      document.body.style.userSelect = '';
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, side, minWidth, maxWidth, snapThreshold, isCollapsed]);

  return {
    width,
    isCollapsed,
    isDragging,
    toggleCollapse,
    handlePointerDown
  };
}
