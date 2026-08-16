import { useCallback, useRef, useState, useEffect } from 'react';
import type { Constellation } from '../types/constellation';

interface ViewState {
  centerRa: number;
  centerDec: number;
  zoom: number;
}

interface UseStarMapReturn {
  viewState: ViewState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  handleWheel: (e: WheelEvent) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  resetView: () => void;
  centerOn: (ra: number, dec: number, targetZoom?: number) => void;
  raDecToCanvas: (ra: number, dec: number) => { x: number; y: number };
  canvasToRaDec: (x: number, y: number) => { ra: number; dec: number };
  hoveredConstellation: Constellation | null;
  setHoveredConstellation: (c: Constellation | null) => void;
}

const DEFAULT_VIEW: ViewState = {
  centerRa: 180,
  centerDec: 20,
  zoom: 1,
};

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 8;

export function useStarMap(_constellations: Constellation[]): UseStarMapReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewState, setViewState] = useState<ViewState>(DEFAULT_VIEW);
  const [hoveredConstellation, setHoveredConstellation] = useState<Constellation | null>(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  const raDecToCanvas = useCallback(
    (ra: number, dec: number): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const w = canvas.width;
      const h = canvas.height;
      const scale = viewState.zoom;

      let deltaRa = ra - viewState.centerRa;
      if (deltaRa > 180) deltaRa -= 360;
      if (deltaRa < -180) deltaRa += 360;

      const x = w / 2 + deltaRa * scale * (w / 360);
      const y = h / 2 - (dec - viewState.centerDec) * scale * (h / 180);

      return { x, y };
    },
    [viewState]
  );

  const canvasToRaDec = useCallback(
    (x: number, y: number): { ra: number; dec: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { ra: 0, dec: 0 };

      const w = canvas.width;
      const h = canvas.height;
      const scale = viewState.zoom;

      let ra = viewState.centerRa + ((x - w / 2) / (scale * (w / 360)));
      const dec = viewState.centerDec - ((y - h / 2) / (scale * (h / 180)));

      if (ra < 0) ra += 360;
      if (ra >= 360) ra -= 360;

      return { ra, dec };
    },
    [viewState]
  );

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setViewState((prev) => {
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.zoom * zoomFactor));
      return { ...prev, zoom: newZoom };
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      const w = canvas.width;
      const h = canvas.height;
      const scale = viewState.zoom;

      setViewState((prev) => {
        let newRa = prev.centerRa - dx / (scale * (w / 360));
        const newDec = Math.max(-90, Math.min(90, prev.centerDec + dy / (scale * (h / 180))));

        if (newRa < 0) newRa += 360;
        if (newRa >= 360) newRa -= 360;

        return { ...prev, centerRa: newRa, centerDec: newDec };
      });
    },
    [viewState.zoom]
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging.current) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dx = e.touches[0].clientX - lastMouse.current.x;
        const dy = e.touches[0].clientY - lastMouse.current.y;
        lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        const w = canvas.width;
        const h = canvas.height;
        const scale = viewState.zoom;

        setViewState((prev) => {
          let newRa = prev.centerRa - dx / (scale * (w / 360));
          const newDec = Math.max(-90, Math.min(90, prev.centerDec + dy / (scale * (h / 180))));
          if (newRa < 0) newRa += 360;
          if (newRa >= 360) newRa -= 360;
          return { ...prev, centerRa: newRa, centerDec: newDec };
        });
      } else if (e.touches.length === 2 && lastTouchDist.current !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const scale = dist / lastTouchDist.current;
        lastTouchDist.current = dist;

        setViewState((prev) => ({
          ...prev,
          zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.zoom * scale)),
        }));
      }
    },
    [viewState.zoom]
  );

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    lastTouchDist.current = null;
  }, []);

  const resetView = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    const start = { ...viewState };
    const target = DEFAULT_VIEW;
    const duration = 600;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - t, 3);

      let deltaRa = target.centerRa - start.centerRa;
      if (deltaRa > 180) deltaRa -= 360;
      if (deltaRa < -180) deltaRa += 360;

      let ra = start.centerRa + deltaRa * ease;
      if (ra < 0) ra += 360;
      if (ra >= 360) ra -= 360;

      setViewState({
        centerRa: ra,
        centerDec: start.centerDec + (target.centerDec - start.centerDec) * ease,
        zoom: start.zoom + (target.zoom - start.zoom) * ease,
      });

      if (t < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [viewState]);

  const centerOn = useCallback(
    (ra: number, dec: number, targetZoom = 3) => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);

      const start = { ...viewState };
      const duration = 800;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - t, 3);

        let deltaRa = ra - start.centerRa;
        if (deltaRa > 180) deltaRa -= 360;
        if (deltaRa < -180) deltaRa += 360;

        let newRa = start.centerRa + deltaRa * ease;
        if (newRa < 0) newRa += 360;
        if (newRa >= 360) newRa -= 360;

        setViewState({
          centerRa: newRa,
          centerDec: start.centerDec + (dec - start.centerDec) * ease,
          zoom: start.zoom + (targetZoom - start.zoom) * ease,
        });

        if (t < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [viewState]
  );

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return {
    viewState,
    canvasRef,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetView,
    centerOn,
    raDecToCanvas,
    canvasToRaDec,
    hoveredConstellation,
    setHoveredConstellation,
  };
}
