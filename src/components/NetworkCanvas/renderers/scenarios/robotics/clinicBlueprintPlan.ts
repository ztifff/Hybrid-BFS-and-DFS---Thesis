/**
 * Real-World Architectural Blueprint Renderer for Clinic Building (Open-RMF Clinic)
 * 
 * Supports:
 * - Multi-floor blueprint rendering: ClinicL1.png (Floor L1) & ClinicL2.png (Floor L2)
 * - Pixel-perfect affine alignment with clinicGraph nodes, corridors, and charger bays
 * - High-tech Dark Mode holographic/cyan inverted blueprint styling (matching the dark app theme)
 * - Clean classic drafting paper styling for Light Mode
 * - Pre-rendered offscreen caching for 60 FPS smooth zooming & panning
 * - Room / Department badges and architectural scale bar
 */

import { GraphNode } from '../../../../../types';

interface CachedBlueprint {
  img: HTMLImageElement;
  darkCanvas?: HTMLCanvasElement;
  loaded: boolean;
}

const blueprintCache: Record<string, CachedBlueprint> = {};

function getOrLoadBlueprint(floor: 'L1' | 'L2'): CachedBlueprint {
  const key = floor;
  if (blueprintCache[key]) return blueprintCache[key];

  const img = new Image();
  const cached: CachedBlueprint = { img, loaded: false };
  blueprintCache[key] = cached;

  img.src = `/RoboticsMaps/Clinic${floor}.png`;
  img.onload = () => {
    cached.loaded = true;

    // Pre-render inverted dark-mode version onto offscreen canvas for instantaneous 60 FPS draws
    const offscreen = document.createElement('canvas');
    offscreen.width = img.naturalWidth || img.width;
    offscreen.height = img.naturalHeight || img.height;
    const octx = offscreen.getContext('2d');
    if (octx) {
      // Invert grey background into dark navy/slate blueprint tone and black lines into luminous cyan
      octx.filter = 'invert(0.92) hue-rotate(185deg) contrast(1.2) brightness(0.9)';
      octx.drawImage(img, 0, 0);
      cached.darkCanvas = offscreen;
    }
  };

  return cached;
}

// Coordinate mapping constants calculated from Open-RMF reference vertices:
const TRANSFORM = {
  scaleX: 3.22497,
  scaleY: 3.25808,
  offsetX: -48.28,
  offsetY: -81.08,
};

export function drawClinicBlueprintPlan(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  visibleNodes: GraphNode[],
  walls: { x1: number; y1: number; x2: number; y2: number; level: string }[] | undefined,
  workspaceView: 'physical' | 'logical' | undefined,
  theme: string
) {
  if (workspaceView === 'logical') return;

  const isLight = theme === 'light';
  const activeFloor = (visibleNodes.length > 0 && visibleNodes[0].buildingId === 'L2') ? 'L2' : 'L1';
  const blueprint = getOrLoadBlueprint(activeFloor);

  ctx.save();

  // 1. Draw Blueprint Background (Raster Architectural Drawing)
  if (blueprint.loaded) {
    const rawWidth = activeFloor === 'L1' ? 486 : 493;
    const rawHeight = activeFloor === 'L1' ? 407 : 413;

    const drawX = TRANSFORM.offsetX;
    const drawY = TRANSFORM.offsetY;
    const drawW = TRANSFORM.scaleX * rawWidth;
    const drawH = TRANSFORM.scaleY * rawHeight;

    const screenX1 = sx(drawX);
    const screenY1 = sy(drawY);
    const screenX2 = sx(drawX + drawW);
    const screenY2 = sy(drawY + drawH);

    const sw = screenX2 - screenX1;
    const sh = screenY2 - screenY1;

    // Ambient glow / drop-shadow behind blueprint
    ctx.shadowColor = isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(14, 165, 233, 0.25)';
    ctx.shadowBlur = 16;

    if (isLight) {
      // In Light Theme: Draw original crisp architectural paper drafting
      ctx.drawImage(blueprint.img, screenX1, screenY1, sw, sh);
    } else {
      // In Dark Theme: Draw pre-rendered inverted dark cyan blueprint
      if (blueprint.darkCanvas) {
        ctx.drawImage(blueprint.darkCanvas, screenX1, screenY1, sw, sh);
      } else {
        ctx.drawImage(blueprint.img, screenX1, screenY1, sw, sh);
      }
    }
    ctx.shadowBlur = 0;

    // Blueprint framing border
    ctx.strokeStyle = isLight ? 'rgba(148, 163, 184, 0.5)' : 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = Math.max(1, 1.5 * Math.min(1.2, zoom));
    ctx.strokeRect(screenX1, screenY1, sw, sh);
  }

  // 2. Vector Wall Structural Accents
  if (walls && walls.length > 0) {
    ctx.save();
    ctx.strokeStyle = isLight ? 'rgba(30, 41, 59, 0.4)' : 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = Math.max(1.2, 2.5 / zoom);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    walls.forEach(wall => {
      if (!wall.level || wall.level === activeFloor || wall.level === 'all') {
        ctx.beginPath();
        ctx.moveTo(sx(wall.x1), sy(wall.y1));
        ctx.lineTo(sx(wall.x2), sy(wall.y2));
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  // 3. Clinical Department Badges & Architectural POIs
  drawClinicLabels(ctx, sx, sy, zoom, activeFloor, isLight);

  // 4. Architectural Title Block & Scale
  drawTitleBlock(ctx, sx, sy, zoom, activeFloor, isLight);

  ctx.restore();
}

/**
 * Department and Room labels scaled with zoom
 */
function drawClinicLabels(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  floor: 'L1' | 'L2',
  isLight: boolean
) {
  if (zoom < 0.28) return; // Keep clean when heavily zoomed out

  const labels = [
    { text: 'Consultation Suites (West Wing)', x: 420, y: 550, size: 10, type: 'wing' },
    { text: 'Consultation Suites (East Wing)', x: 1050, y: 550, size: 10, type: 'wing' },
    { text: 'Central Waiting Lounge', x: 770, y: 560, size: 11, type: 'hall' },
    { text: 'Main Reception & Casual Waiting', x: 860, y: 980, size: 11, type: 'hall' },
    { text: 'Clinic A Entrance', x: 380, y: 1120, size: 10, type: 'door' },
    { text: 'Clinic B Entrance', x: 920, y: 1120, size: 10, type: 'door' },
    { text: '⚡ Delivery Robot Charger Bay', x: 268, y: 960, size: 11, type: 'charger', showL1: true },
    { text: '⚡ Tiny Robot Charger Bay', x: 1425, y: 160, size: 11, type: 'charger', showL2: true },
    { text: 'North AHU & Utility', x: 650, y: 120, size: 9, type: 'service' },
    { text: 'Stairwell / Vertical Core', x: 1150, y: 90, size: 9, type: 'stair' },
  ];

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  labels.forEach(lb => {
    if (lb.showL1 && floor !== 'L1') return;
    if (lb.showL2 && floor !== 'L2') return;

    const cx = sx(lb.x);
    const cy = sy(lb.y);

    const fontSize = Math.max(9, Math.min(13, lb.size * Math.sqrt(zoom)));
    ctx.font = `600 ${fontSize}px "Inter", "Segoe UI", system-ui, sans-serif`;

    const textWidth = ctx.measureText(lb.text).width;
    const padX = 6;
    const padY = 3;
    const w = textWidth + padX * 2;
    const h = fontSize * 1.4 + padY * 2;

    // Glassmorphic pill badge
    let bg = isLight ? 'rgba(255, 255, 255, 0.88)' : 'rgba(15, 23, 42, 0.85)';
    let textCol = isLight ? '#0f172a' : '#f8fafc';
    let borderCol = isLight ? 'rgba(203, 213, 225, 0.7)' : 'rgba(56, 189, 248, 0.4)';

    if (lb.type === 'charger') {
      bg = isLight ? 'rgba(240, 253, 244, 0.95)' : 'rgba(6, 78, 59, 0.9)';
      borderCol = '#10b981';
      textCol = isLight ? '#047857' : '#a7f3d0';
    } else if (lb.type === 'hall') {
      borderCol = isLight ? 'rgba(59, 130, 246, 0.6)' : 'rgba(56, 189, 248, 0.5)';
    }

    ctx.fillStyle = bg;
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 1;
    ctx.shadowColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 4;

    const rx = cx - w / 2;
    const ry = cy - h / 2;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(rx, ry, w, h, 4) : ctx.rect(rx, ry, w, h);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = textCol;
    ctx.fillText(lb.text, cx, cy);
  });

  ctx.restore();
}

/**
 * Architectural Title Block
 */
function drawTitleBlock(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  floor: 'L1' | 'L2',
  isLight: boolean
) {
  const x = sx(720);
  const y = sy(1220);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const titleSize = Math.max(10, 13 * Math.min(1.2, zoom));
  ctx.font = `bold ${titleSize}px "Inter", "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = isLight ? 'rgba(30, 41, 59, 0.85)' : 'rgba(224, 242, 254, 0.85)';
  ctx.fillText(
    `CLINIC A & B ARCHITECTURAL BLUEPRINT — LEVEL ${floor} • SCALE 1:150`,
    x,
    y
  );

  const subSize = Math.max(8, 10 * Math.min(1.2, zoom));
  ctx.font = `italic ${subSize}px "Inter", "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = isLight ? 'rgba(100, 116, 139, 0.75)' : 'rgba(148, 163, 184, 0.65)';
  ctx.fillText(
    `Open-RMF Multi-Agent Hospital Fleet Topology • ${floor === 'L1' ? 'Ground Floor Consultation & Triage' : 'Level 2 Specialized Clinical Wings'}`,
    x,
    y + titleSize * 1.2
  );

  ctx.restore();
}
