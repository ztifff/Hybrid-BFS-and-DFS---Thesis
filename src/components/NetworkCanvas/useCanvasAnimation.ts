import { useCallback, useEffect, useRef } from 'react';

interface UseCanvasAnimationProps {
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setPan: React.Dispatch<React.SetStateAction<{ x: number, y: number }>>;
}

export function useCanvasAnimation({ setZoom, setPan }: UseCanvasAnimationProps) {
  const animFrameRef = useRef<number | null>(null);

  const animateTo = useCallback((targetZoom: number, targetPanX: number, targetPanY: number) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const DURATION = 500; // ms
    const startTime = performance.now();

    const startZoomRef = { z: 0, px: 0, py: 0 };
    setZoom(z => { startZoomRef.z = z; return z; });
    setPan(p => { startZoomRef.px = p.x; startZoomRef.py = p.y; return p; });

    requestAnimationFrame(() => {
      const fromZ  = startZoomRef.z  || 1;
      const fromPx = startZoomRef.px || 0;
      const fromPy = startZoomRef.py || 0;

      const tick = (now: number) => {
        const t = Math.min((now - startTime) / DURATION, 1);
        const ease = 1 - Math.pow(1 - t, 3); // Ease-out cubic
        
        setZoom(fromZ  + (targetZoom  - fromZ)  * ease);
        setPan({
          x: fromPx + (targetPanX - fromPx) * ease,
          y: fromPy + (targetPanY - fromPy) * ease,
        });
        
        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(tick);
        }
      };
      animFrameRef.current = requestAnimationFrame(tick);
    });
  }, [setPan, setZoom]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return { animateTo };
}
