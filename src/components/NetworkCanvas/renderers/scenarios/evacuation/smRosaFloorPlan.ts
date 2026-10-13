/**
 * Real-World Architectural Blueprint Renderer for SM City Santa Rosa
 * 
 * Supports:
 * - High-resolution architectural floor plans:
 *     GL: /EvacMaps/SMstarosaL1.png (1800 x 1265)
 *     L2: /EvacMaps/SMstarosaL2.png (1800 x 1066, aligned at Y-offset +199)
 * - 1:1 affine alignment with graph nodes (Scale: 100 graph units = 1 px)
 * - High-tech Dark Mode holographic/cyan inverted blueprint styling
 * - Clean architectural drafting style for Light Mode
 * - Pre-rendered offscreen canvas caching for smooth 60 FPS zoom & pan
 * - Architectural title block and scale bar
 */

import { GraphNode } from '../../../../../types';

interface CachedBlueprint {
  img: HTMLImageElement;
  darkCanvas?: HTMLCanvasElement;
  loaded: boolean;
}

const blueprintCache: Record<string, CachedBlueprint> = {};
const blueprintListeners: (() => void)[] = [];

export function onSMRosaBlueprintChange(callback: () => void) {
  blueprintListeners.push(callback);
  return () => {
    const idx = blueprintListeners.indexOf(callback);
    if (idx !== -1) blueprintListeners.splice(idx, 1);
  };
}

function notifyListeners() {
  blueprintListeners.forEach(fn => {
    try { fn(); } catch (e) { console.error(e); }
  });
}

function getOrLoadBlueprint(floor: 'GL' | 'L2'): CachedBlueprint {
  const key = floor;
  if (blueprintCache[key]) return blueprintCache[key];

  const img = new Image();
  const cached: CachedBlueprint = { img, loaded: false };
  blueprintCache[key] = cached;

  img.src = floor === 'GL' ? '/EvacMaps/SMstarosaL1.png' : '/EvacMaps/SMstarosaL2.png';
  img.onload = () => {
    cached.loaded = true;

    try {
      const offscreen = document.createElement('canvas');
      offscreen.width = img.naturalWidth || img.width;
      offscreen.height = img.naturalHeight || img.height;
      const octx = offscreen.getContext('2d');
      if (octx) {
        // High-tech emergency command center dark blueprint filter
        octx.filter = 'invert(0.92) hue-rotate(185deg) contrast(1.18) brightness(0.90)';
        octx.drawImage(img, 0, 0);
        cached.darkCanvas = offscreen;
      }
    } catch (e) {
      console.warn('Could not create offscreen dark canvas for SM Santa Rosa:', e);
    }

    notifyListeners();
  };

  return cached;
}

// Preload both floors immediately on module initialization
getOrLoadBlueprint('GL');
getOrLoadBlueprint('L2');

// Map dimensions and floor offsets:
const MAP_CONFIG = {
  W: 180000,
  H: 126500,
  GL: {
    offsetX: 0,
    offsetY: 0,
    width: 180000,
    height: 126500,
  },
  L2: {
    offsetX: 0,
    offsetY: 19900, // +199 px to align bottom with GL
    width: 180000,
    height: 106600,
  },
};

export function drawSMRosaFloorPlan(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  visibleNodes: GraphNode[],
  workspaceView?: 'physical' | 'logical',
  theme?: 'dark' | 'light',
  activeFloor?: string
) {
  // In logical workspace, display only the raw topological network graph
  if (workspaceView === 'logical') return;

  const isLight = theme === 'light';
  const isL2 = activeFloor ? activeFloor === 'L2' : visibleNodes.some(n => n.buildingId === 'L2');
  const activeFloorKey: 'GL' | 'L2' = isL2 ? 'L2' : 'GL';
  const cfg = MAP_CONFIG[activeFloorKey];
  const blueprint = getOrLoadBlueprint(activeFloorKey);

  ctx.save();

  // 1. Draw Architectural Floor Plan Image
  if (blueprint.loaded) {
    const screenX1 = sx(cfg.offsetX);
    const screenY1 = sy(cfg.offsetY);
    const screenX2 = sx(cfg.offsetX + cfg.width);
    const screenY2 = sy(cfg.offsetY + cfg.height);

    const sw = screenX2 - screenX1;
    const sh = screenY2 - screenY1;

    // Ambient blueprint glow
    ctx.shadowColor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(37, 99, 235, 0.25)';
    ctx.shadowBlur = Math.min(24, 20 * zoom);

    if (isLight) {
      // Light Mode: Original architectural floor map
      ctx.drawImage(blueprint.img, screenX1, screenY1, sw, sh);
    } else {
      // Dark Mode: Pre-rendered dark cyan holographic command-center style
      if (blueprint.darkCanvas) {
        ctx.drawImage(blueprint.darkCanvas, screenX1, screenY1, sw, sh);
      } else {
        ctx.drawImage(blueprint.img, screenX1, screenY1, sw, sh);
      }
    }
    ctx.shadowBlur = 0;

    // Subtle framing border around the mall
    ctx.strokeStyle = isLight ? 'rgba(148, 163, 184, 0.45)' : 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = Math.max(1, 1.5 * Math.min(1.2, zoom));
    ctx.strokeRect(screenX1, screenY1, sw, sh);
  } else {
    // Clean loading placeholder while image decodes
    const screenX1 = sx(0);
    const screenY1 = sy(0);
    const sw = sx(MAP_CONFIG.W) - screenX1;
    const sh = sy(MAP_CONFIG.H) - screenY1;

    ctx.fillStyle = isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(screenX1, screenY1, sw, sh);
    ctx.fillStyle = isLight ? '#64748b' : '#38bdf8';
    ctx.font = `600 ${14 / zoom}px "Inter", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Loading SM City Santa Rosa Floor Plan...', sx(MAP_CONFIG.W / 2), sy(MAP_CONFIG.H / 2));
  }

  // 2. Architectural Title Block & Scale Watermark
  drawTitleBlock(ctx, sx, sy, zoom, activeFloorKey, isLight);

  ctx.restore();
}

/**
 * Architectural Title Block & Level Watermark
 */
function drawTitleBlock(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  floor: 'GL' | 'L2',
  isLight: boolean
) {
  if (zoom < 0.15) return;

  const floorTitle = floor === 'GL' ? 'GROUND LEVEL (GL)' : 'LEVEL 2 (SECOND FLOOR)';
  const subtitle = floor === 'GL'
    ? 'SM SUPERMARKET · SM STORE · DINING STRIP · MAIN EXITS'
    : 'SM CINEMAS (1-4) · SM STORE L2 · CYBERZONE · FOOD COURT';

  const tx = sx(10000);
  const ty = sy(floor === 'GL' ? 14000 : 25000);

  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const fontSizeTitle = Math.max(10, Math.min(18, 14 * Math.sqrt(zoom)));
  const fontSizeSub = Math.max(8, Math.min(12, 9 * Math.sqrt(zoom)));

  // Title badge background
  const pad = 8;
  const boxW = Math.max(220, 280 * Math.sqrt(zoom));
  const boxH = (fontSizeTitle + fontSizeSub) * 1.5 + pad * 2;

  ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.88)' : 'rgba(11, 19, 43, 0.82)';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(tx, ty, boxW, boxH, 6);
  } else {
    ctx.rect(tx, ty, boxW, boxH);
  }
  ctx.fill();

  ctx.strokeStyle = isLight ? 'rgba(203, 213, 225, 0.7)' : 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Primary text
  ctx.font = `700 ${fontSizeTitle}px "Inter", "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = isLight ? '#0f172a' : '#38bdf8';
  ctx.fillText(`SM CITY SANTA ROSA — ${floorTitle}`, tx + pad, ty + pad);

  // Subtitle
  ctx.font = `500 ${fontSizeSub}px "Inter", "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
  ctx.fillText(subtitle, tx + pad, ty + pad + fontSizeTitle * 1.25);

  ctx.restore();
}
