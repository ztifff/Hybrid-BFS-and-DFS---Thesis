/**
 * Ayala Malls Solenad 1 — Atrium Building
 * Real-World Architectural Floor Plan Renderer
 *
 * Ground Floor (GL):
 *   Renders high-resolution blueprint map from /EvacMaps/AtriumL1.png
 *   Direct 100x pixel mapping: W = 67200, H = 53200 (from 672 x 532 px)
 *   Supports Dark Mode (pre-rendered high-tech inverted slate blueprint) & Light Mode
 *
 * Second Floor (L2):
 *   Renders high-resolution blueprint map from /EvacMaps/AtriumL2.png
 *   Calibrated mapping with 7px offset: drawX = 700, drawW = 65700, drawH = 53300
 *   Aligns stairwells and central escalators with GL vertical shafts
 *
 * 6 Emergency Exits (GL):
 *   North   → x:37600, y:1200
 *   South   → x:37800, y:52200
 *   West 1  → x:2100,  y:18300
 *   West 2  → x:2300,  y:36800
 *   East 1  → x:64500, y:18300
 *   East 2  --> x:64500, y:36800
 */

import { GraphNode } from '../../../../../types';

const W = 67200;
const H = 53200;

interface CachedBlueprint {
  img: HTMLImageElement;
  darkCanvas?: HTMLCanvasElement;
  loaded: boolean;
}

const blueprintCache: Record<string, CachedBlueprint> = {};

function getOrLoadBlueprint(floor: 'GL' | 'L2'): CachedBlueprint {
  if (blueprintCache[floor]) return blueprintCache[floor];

  const img = new Image();
  const cached: CachedBlueprint = { img, loaded: false };
  blueprintCache[floor] = cached;

  img.src = floor === 'GL' ? '/EvacMaps/AtriumL1.png' : '/EvacMaps/AtriumL2.png';
  img.onload = () => {
    cached.loaded = true;

    // Pre-render inverted dark-mode version onto offscreen canvas for 60 FPS performance
    try {
      const offscreen = document.createElement('canvas');
      offscreen.width = img.naturalWidth || img.width;
      offscreen.height = img.naturalHeight || img.height;
      const octx = offscreen.getContext('2d');
      if (octx) {
        octx.filter = 'invert(0.92) hue-rotate(185deg) contrast(1.15) brightness(0.95)';
        octx.drawImage(img, 0, 0);
        cached.darkCanvas = offscreen;
      }
    } catch {
      // Fallback to direct draw if offscreen fails
    }
  };

  return cached;
}

// ── Color palette for UI badges & accents ────────────────────────────────────
const C = {
  outdoor:    'rgba(6, 10, 22, 0.97)',
  storeFill:  'rgba(14, 24, 52, 0.90)',
  corridor:   'rgba(8, 14, 34, 0.92)',
  partitionH: 'rgba(80, 108, 168, 0.92)',
  partitionL: 'rgba(185, 100, 30, 0.65)',
  escalator:  '#c8a228',
  escDark:    '#7a5e10',
  restroom:   '#1898c8',
  restroomDk: '#0e6090',
  exitMark:   '#e05818',
  watermark:  'rgba(100, 130, 180, 0.20)',
};

// ── Helper Drawing Functions ──────────────────────────────────────────────────

function fillRect(ctx: CanvasRenderingContext2D, sx: (x:number)=>number, sy: (y:number)=>number, x: number, y: number, w: number, h: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.fillRect(sx(x), sy(y), sx(x+w)-sx(x), sy(y+h)-sy(y));
}

function strokeRect(ctx: CanvasRenderingContext2D, sx: (x:number)=>number, sy: (y:number)=>number, x: number, y: number, w: number, h: number, stroke: string, lw: number) {
  ctx.strokeStyle = stroke; ctx.lineWidth = lw;
  ctx.strokeRect(sx(x), sy(y), sx(x+w)-sx(x), sy(y+h)-sy(y));
}

function fillStroke(ctx: CanvasRenderingContext2D, sx: (x:number)=>number, sy: (y:number)=>number, x: number, y: number, w: number, h: number, fill: string, stroke: string, lw: number) {
  fillRect(ctx, sx, sy, x, y, w, h, fill);
  strokeRect(ctx, sx, sy, x, y, w, h, stroke, lw);
}

function drawExitSign(ctx: CanvasRenderingContext2D, sx: (x:number)=>number, sy: (y:number)=>number, zoom: number, wx: number, wy: number, sublabel: string) {
  const cx = sx(wx); const cy = sy(wy);
  const bw = 54 / zoom; const bh = 24 / zoom;
  ctx.fillStyle = 'rgba(224, 88, 24, 0.30)';
  ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
  ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2 / zoom;
  ctx.strokeRect(cx - bw / 2, cy - bh / 2, bw, bh);
  ctx.fillStyle = '#fb923c'; ctx.font = `bold ${8.5 / zoom}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', cx, cy - 3.5 / zoom);
  ctx.font = `bold ${5.5 / zoom}px monospace`; ctx.fillStyle = 'rgba(254, 215, 170, 0.95)';
  ctx.fillText(sublabel, cx, cy + 6.5 / zoom);
}

function drawAccessSign(ctx: CanvasRenderingContext2D, sx: (x:number)=>number, sy: (y:number)=>number, zoom: number, wx: number, wy: number, labelText: string, sublabel: string) {
  const cx = sx(wx); const cy = sy(wy);
  const bw = 64 / zoom; const bh = 24 / zoom;
  ctx.fillStyle = 'rgba(14, 165, 233, 0.28)';
  ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
  ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 1.5 / zoom;
  ctx.strokeRect(cx - bw / 2, cy - bh / 2, bw, bh);
  ctx.fillStyle = '#38bdf8'; ctx.font = `bold ${7.5 / zoom}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(labelText, cx, cy - 3.5 / zoom);
  ctx.font = `bold ${5.5 / zoom}px monospace`; ctx.fillStyle = 'rgba(186, 230, 253, 0.95)';
  ctx.fillText(sublabel, cx, cy + 6.5 / zoom);
}

// ── L2 Fallback Layout (while image loads) ────────────────────────────────────
function drawL2Fallback(ctx: CanvasRenderingContext2D, sx: (x:number)=>number, sy: (y:number)=>number, zoom: number, isLight = false) {
  fillStroke(ctx, sx, sy, 2200, 1300, 63100, 50900, isLight ? '#f1f5f9' : C.storeFill, isLight ? '#cbd5e1' : C.partitionH, 2/zoom);
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN EXPORT: drawAyalaFloorPlan
// ─────────────────────────────────────────────────────────────────────────────
export function drawAyalaFloorPlan(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  visibleNodes: GraphNode[],
  workspaceView?: 'physical' | 'logical',
  theme?: 'dark' | 'light',
  activeFloor?: string
) {
  // In logical view, don't draw architectural floor plan
  if (workspaceView === 'logical') return;

  const isLight = theme === 'light';
  const floorId = (activeFloor ?? visibleNodes.find(n => n.buildingId)?.buildingId ?? 'GL') as 'GL' | 'L2';

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // ── Outdoor / Canvas Background ──
  ctx.fillStyle = isLight ? '#f8fafc' : C.outdoor;
  ctx.fillRect(sx(0), sy(0), sx(W) - sx(0), sy(H) - sy(0));

  // ══════════════════════════════════════════════════════════════════════════════
  //  GROUND FLOOR (GL) — Real Blueprint Drawing (/EvacMaps/AtriumL1.png)
  // ══════════════════════════════════════════════════════════════════════════════
  if (floorId === 'GL') {
    const blueprint = getOrLoadBlueprint('GL');

    if (blueprint.loaded) {
      const screenX1 = sx(0);
      const screenY1 = sy(0);
      const screenX2 = sx(W);
      const screenY2 = sy(H);
      const sw = screenX2 - screenX1;
      const sh = screenY2 - screenY1;

      ctx.shadowColor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(14, 165, 233, 0.20)';
      ctx.shadowBlur = 12;

      if (isLight) {
        ctx.drawImage(blueprint.img, screenX1, screenY1, sw, sh);
      } else {
        if (blueprint.darkCanvas) {
          ctx.drawImage(blueprint.darkCanvas, screenX1, screenY1, sw, sh);
        } else {
          ctx.drawImage(blueprint.img, screenX1, screenY1, sw, sh);
        }
      }
      ctx.shadowBlur = 0;

      // Outer blueprint framing border
      ctx.strokeStyle = isLight ? 'rgba(148, 163, 184, 0.4)' : 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = Math.max(1, 1.5 / zoom);
      ctx.strokeRect(screenX1, screenY1, sw, sh);
    } else {
      fillRect(ctx, sx, sy, 2200, 1300, 63100, 50900, isLight ? '#f1f5f9' : C.storeFill);
    }

    // ── 6 Emergency Exit Badges ──
    drawExitSign(ctx, sx, sy, zoom, 37600,  1200, 'NORTH');
    drawExitSign(ctx, sx, sy, zoom,  2100, 18300, 'WEST 1');
    drawExitSign(ctx, sx, sy, zoom,  2300, 36800, 'WEST 2');
    drawExitSign(ctx, sx, sy, zoom, 64500, 18300, 'EAST 1');
    drawExitSign(ctx, sx, sy, zoom, 64500, 36800, 'EAST 2');
    drawExitSign(ctx, sx, sy, zoom, 37800, 52200, 'SOUTH');
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  SECOND FLOOR (L2) — Real Blueprint Drawing (/EvacMaps/AtriumL2.png)
  // ══════════════════════════════════════════════════════════════════════════════
  else if (floorId === 'L2') {
    const blueprint = getOrLoadBlueprint('L2');

    if (blueprint.loaded) {
      // 7px horizontal crop offset calibrated to align stairwells & shafts with GL
      const drawX = 700;
      const drawY = 0;
      const drawW = 65700;
      const drawH = 53300;

      const screenX1 = sx(drawX);
      const screenY1 = sy(drawY);
      const screenX2 = sx(drawX + drawW);
      const screenY2 = sy(drawY + drawH);
      const sw = screenX2 - screenX1;
      const sh = screenY2 - screenY1;

      ctx.shadowColor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(14, 165, 233, 0.20)';
      ctx.shadowBlur = 12;

      if (isLight) {
        ctx.drawImage(blueprint.img, screenX1, screenY1, sw, sh);
      } else {
        if (blueprint.darkCanvas) {
          ctx.drawImage(blueprint.darkCanvas, screenX1, screenY1, sw, sh);
        } else {
          ctx.drawImage(blueprint.img, screenX1, screenY1, sw, sh);
        }
      }
      ctx.shadowBlur = 0;

      // Outer blueprint framing border
      ctx.strokeStyle = isLight ? 'rgba(148, 163, 184, 0.4)' : 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = Math.max(1, 1.5 / zoom);
      ctx.strokeRect(screenX1, screenY1, sw, sh);
    } else {
      drawL2Fallback(ctx, sx, sy, zoom, isLight);
    }

    // ── Vertical Access Direction Badges (Connecting to GL) ──
    drawAccessSign(ctx, sx, sy, zoom, 37500, 13800, 'STAIRS', 'DOWN TO GL');
    drawAccessSign(ctx, sx, sy, zoom, 37600, 40800, 'ESCALATOR', 'DOWN TO GL');
  }

  // ── Floor Watermark ──
  const floorLabels: Record<string, string> = {
    GL: 'GROUND FLOOR (GL)',
    L2: 'SECOND FLOOR (L2)',
  };
  ctx.save();
  ctx.fillStyle = C.watermark;
  ctx.font = `bold ${16 / zoom}px 'Courier New', monospace`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText(
    `AYALA MALLS SOLENAD NUVALI (ATRIUM) — ${floorLabels[floorId] ?? floorId}`,
    sx(2500), sy(H - 800)
  );
  ctx.restore();

  ctx.restore();
}
