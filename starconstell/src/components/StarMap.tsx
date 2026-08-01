import { useEffect, useRef, useCallback, useMemo } from 'react';
import type { Constellation } from '../types/constellation';
import { generateBackgroundStars } from '../data/backgroundStars';

interface StarMapProps {
  constellations: Constellation[];
  selectedConstellation: Constellation | null;
  hoveredConstellation: Constellation | null;
  viewState: { centerRa: number; centerDec: number; zoom: number };
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onConstellationClick: (constellation: Constellation) => void;
  onConstellationHover: (constellation: Constellation | null) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

const BACKGROUND_STARS = generateBackgroundStars(3000);

function raDecToXY(
  ra: number,
  dec: number,
  centerRa: number,
  centerDec: number,
  zoom: number,
  w: number,
  h: number
): { x: number; y: number } {
  let deltaRa = ra - centerRa;
  if (deltaRa > 180) deltaRa -= 360;
  if (deltaRa < -180) deltaRa += 360;

  const x = w / 2 + deltaRa * zoom * (w / 360);
  const y = h / 2 - (dec - centerDec) * zoom * (h / 180);
  return { x, y };
}

export default function StarMap({
  constellations,
  selectedConstellation,
  hoveredConstellation,
  viewState,
  canvasRef,
  onConstellationClick,
  onConstellationHover,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: StarMapProps) {
  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const shootingStarsRef = useRef<Array<{
    x: number; y: number; vx: number; vy: number;
    life: number; maxLife: number; length: number;
  }>>([]);
  const lastShootingStarTime = useRef<number>(0);

  const starMap = useMemo(() => {
    const map = new Map<string, { ra: number; dec: number }>();
    for (const c of constellations) {
      for (const s of c.stars) {
        map.set(`${c.id}:${s.id}`, { ra: s.ra, dec: s.dec });
      }
    }
    return map;
  }, [constellations]);

  const drawStar = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      magnitude: number,
      color: string,
      time: number,
      isTwinkling: boolean
    ) => {
      const baseRadius = Math.max(0.5, (6 - magnitude) * 0.8 * viewState.zoom ** 0.3);
      const twinkle = isTwinkling
        ? 0.85 + 0.15 * Math.sin(time * 0.003 + x * 0.1 + y * 0.1)
        : 1;
      const radius = baseRadius * twinkle;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 3);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.3, color + 'cc');
      gradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(x, y, radius * 3, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    },
    [viewState.zoom]
  );

  const drawConstellationLines = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      constellation: Constellation,
      isSelected: boolean,
      isHovered: boolean,
      w: number,
      h: number,
      time: number
    ) => {
      const { centerRa, centerDec, zoom } = viewState;
      const alpha = isSelected ? 0.9 : isHovered ? 0.7 : 0.25;
      const lineWidth = isSelected ? 2 : isHovered ? 1.5 : 0.8;
      const glowColor = isSelected
        ? 'rgba(100, 180, 255, 0.3)'
        : isHovered
        ? 'rgba(100, 180, 255, 0.15)'
        : 'transparent';

      for (const line of constellation.lines) {
        const fromKey = `${constellation.id}:${line.from}`;
        const toKey = `${constellation.id}:${line.to}`;
        const from = starMap.get(fromKey);
        const to = starMap.get(toKey);
        if (!from || !to) continue;

        const p1 = raDecToXY(from.ra, from.dec, centerRa, centerDec, zoom, w, h);
        const p2 = raDecToXY(to.ra, to.dec, centerRa, centerDec, zoom, w, h);

        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = glowColor;
          ctx.lineWidth = lineWidth * 4;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(150, 200, 255, ${alpha})`;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }

      if (isSelected) {
        const center = raDecToXY(
          constellation.centerRa,
          constellation.centerDec,
          centerRa,
          centerDec,
          zoom,
          w,
          h
        );
        const pulseRadius = 40 + 10 * Math.sin(time * 0.002);
        const gradient = ctx.createRadialGradient(
          center.x, center.y, 0,
          center.x, center.y, pulseRadius * zoom ** 0.3
        );
        gradient.addColorStop(0, 'rgba(70, 130, 255, 0.08)');
        gradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(center.x, center.y, pulseRadius * zoom ** 0.3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      if ((isSelected || isHovered) && zoom > 1.5) {
        const center = raDecToXY(
          constellation.centerRa,
          constellation.centerDec - 5 / zoom,
          centerRa,
          centerDec,
          zoom,
          w,
          h
        );
        ctx.font = `${Math.min(16, 12 * zoom ** 0.2)}px "SF Pro Display", -apple-system, sans-serif`;
        ctx.fillStyle = `rgba(200, 220, 255, ${isSelected ? 0.9 : 0.6})`;
        ctx.textAlign = 'center';
        ctx.fillText(constellation.name, center.x, center.y);
      }
    },
    [viewState, starMap]
  );

  const draw = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      const w = rect.width;
      const h = rect.height;
      timeRef.current = time;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, w, h);

      const { centerRa, centerDec, zoom } = viewState;

      const milkyWayCenters = [
        { ra: 266, dec: -29 },
        { ra: 280, dec: -20 },
        { ra: 300, dec: 0 },
        { ra: 310, dec: 20 },
        { ra: 80, dec: -10 },
      ];

      for (const mc of milkyWayCenters) {
        const pos = raDecToXY(mc.ra, mc.dec, centerRa, centerDec, zoom, w, h);
        if (pos.x < -200 || pos.x > w + 200 || pos.y < -200 || pos.y > h + 200) continue;
        const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 200 * zoom ** 0.3);
        gradient.addColorStop(0, 'rgba(180, 180, 220, 0.04)');
        gradient.addColorStop(0.5, 'rgba(140, 140, 180, 0.02)');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(pos.x - 300, pos.y - 300, 600, 600);
      }

      for (const star of BACKGROUND_STARS) {
        const pos = raDecToXY(star.ra, star.dec, centerRa, centerDec, zoom, w, h);
        if (pos.x < -10 || pos.x > w + 10 || pos.y < -10 || pos.y > h + 10) continue;
        drawStar(ctx, pos.x, pos.y, star.magnitude, star.color, time, true);
      }

      for (const constellation of constellations) {
        const isSelected = selectedConstellation?.id === constellation.id;
        const isHovered = hoveredConstellation?.id === constellation.id;
        drawConstellationLines(ctx, constellation, isSelected, isHovered, w, h, time);
      }

      for (const constellation of constellations) {
        const isSelected = selectedConstellation?.id === constellation.id;
        const isHovered = hoveredConstellation?.id === constellation.id;

        for (const star of constellation.stars) {
          const pos = raDecToXY(star.ra, star.dec, centerRa, centerDec, zoom, w, h);
          if (pos.x < -10 || pos.x > w + 10 || pos.y < -10 || pos.y > h + 10) continue;

          const color = star.color || '#ffffff';
          const mag = isSelected || isHovered ? star.magnitude - 0.5 : star.magnitude;
          drawStar(ctx, pos.x, pos.y, mag, color, time, false);

          if ((isSelected || isHovered) && zoom > 2) {
            ctx.font = `${Math.min(11, 9 * zoom ** 0.15)}px "SF Pro Text", -apple-system, sans-serif`;
            ctx.fillStyle = `rgba(200, 220, 255, ${isSelected ? 0.7 : 0.4})`;
            ctx.textAlign = 'center';
            ctx.fillText(star.name, pos.x, pos.y - 8 * zoom ** 0.2);
          }
        }
      }

      if (time - lastShootingStarTime.current > 8000 + Math.random() * 12000) {
        lastShootingStarTime.current = time;
        const angle = Math.random() * Math.PI * 2;
        shootingStarsRef.current.push({
          x: Math.random() * w,
          y: Math.random() * h * 0.6,
          vx: Math.cos(angle) * (3 + Math.random() * 4),
          vy: Math.sin(angle) * (3 + Math.random() * 4),
          life: 0,
          maxLife: 30 + Math.random() * 30,
          length: 40 + Math.random() * 60,
        });
      }

      shootingStarsRef.current = shootingStarsRef.current.filter((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.life++;
        const alpha = 1 - s.life / s.maxLife;
        if (alpha <= 0) return false;

        const gradient = ctx.createLinearGradient(
          s.x, s.y,
          s.x - s.vx * s.length / 5, s.y - s.vy * s.length / 5
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * s.length / 5, s.y - s.vy * s.length / 5);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        return true;
      });

      frameRef.current = requestAnimationFrame(draw);
    },
    [canvasRef, viewState, constellations, selectedConstellation, hoveredConstellation, drawStar, drawConstellationLines]
  );

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener('wheel', wheelHandler, { passive: false });
    return () => canvas.removeEventListener('wheel', wheelHandler);
  }, [canvasRef]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const { centerRa, centerDec, zoom } = viewState;

      let closest: Constellation | null = null;
      let closestDist = Infinity;

      for (const constellation of constellations) {
        for (const star of constellation.stars) {
          const pos = raDecToXY(star.ra, star.dec, centerRa, centerDec, zoom, rect.width, rect.height);
          const dist = Math.sqrt((pos.x - mx) ** 2 + (pos.y - my) ** 2);
          const hitRadius = Math.max(15, (6 - star.magnitude) * 3 * zoom ** 0.3);
          if (dist < hitRadius && dist < closestDist) {
            closestDist = dist;
            closest = constellation;
          }
        }
      }

      if (closest) {
        onConstellationClick(closest);
      }
    },
    [canvasRef, viewState, constellations, onConstellationClick]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      onMouseMove(e);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const { centerRa, centerDec, zoom } = viewState;

      let closest: Constellation | null = null;
      let closestDist = Infinity;

      for (const constellation of constellations) {
        for (const star of constellation.stars) {
          const pos = raDecToXY(star.ra, star.dec, centerRa, centerDec, zoom, rect.width, rect.height);
          const dist = Math.sqrt((pos.x - mx) ** 2 + (pos.y - my) ** 2);
          const hitRadius = Math.max(15, (6 - star.magnitude) * 3 * zoom ** 0.3);
          if (dist < hitRadius && dist < closestDist) {
            closestDist = dist;
            closest = constellation;
          }
        }
      }

      onConstellationHover(closest);
      canvas.style.cursor = closest ? 'pointer' : 'grab';
    },
    [canvasRef, viewState, constellations, onConstellationHover, onMouseMove]
  );

  return (
    <canvas
      ref={canvasRef}
      className="star-map-canvas"
      onClick={handleCanvasClick}
      onMouseDown={onMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    />
  );
}
