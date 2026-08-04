/**
 * Ayala Malls Solenad 1 — Atrium Building
 * 2D Floor Plan Renderer — GL + L2 only
 *
 * Canvas world: W=50000 (X)  ×  H=37000 (Y)
 *
 * 6 Exits (ONLY on GL):
 *   North   → x:25000, y:2000
 *   West 1  → x:2000,  y:12000
 *   West 2  → x:2000,  y:27000
 *   East 1  → x:48000, y:12000
 *   East 2  → x:48000, y:27000
 *   South   → x:25000, y:35000
 */

import { GraphNode } from '../../types';

const W = 50000;
const H = 37000;

// ── Color palette ─────────────────────────────────────────────────────────────
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
  watermark:  'rgba(100, 130, 180, 0.14)',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function hLine(ctx: CanvasRenderingContext2D, sx: (x:number)=>number, sy: (y:number)=>number, x1: number, x2: number, y: number, color: string, lw: number) {
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(sx(x1), sy(y)); ctx.lineTo(sx(x2), sy(y)); ctx.stroke();
}

function vLine(ctx: CanvasRenderingContext2D, sx: (x:number)=>number, sy: (y:number)=>number, x: number, y1: number, y2: number, color: string, lw: number) {
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(sx(x), sy(y1)); ctx.lineTo(sx(x), sy(y2)); ctx.stroke();
}

function label(ctx: CanvasRenderingContext2D, sx: (x:number)=>number, sy: (y:number)=>number, zoom: number, text: string, cx: number, cy: number, color = 'rgba(190,210,240,0.92)', sizePx = 7) {
  ctx.save();
  const lines = text.split('\n');
  ctx.font = `bold ${sizePx / zoom}px Arial, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  const lineH = (sizePx + 1) / zoom;
  lines.forEach((ln, i) => {
    ctx.fillText(ln, sx(cx), sy(cy) + (i - (lines.length - 1) / 2) * lineH);
  });
  ctx.restore();
}

function drawEscalatorPair(ctx: CanvasRenderingContext2D, sx: (x:number)=>number, sy: (y:number)=>number, zoom: number, cx: number, cy: number, ew = 800, eh = 1800) {
  const pw = sx(ew) - sx(0);
  const ph = sy(eh) - sy(0);
  const gap = sx(200) - sx(0);
  const x1 = sx(cx) - pw - gap / 2;
  const x2 = sx(cx) + gap / 2;
  const y1 = sy(cy) - ph / 2;
  [x1, x2].forEach(rx => {
    ctx.fillStyle = C.escalator;
    ctx.fillRect(rx, y1, pw, ph);
    ctx.strokeStyle = C.escDark; ctx.lineWidth = 0.5 / zoom;
    ctx.strokeRect(rx, y1, pw, ph);
    ctx.beginPath(); ctx.moveTo(rx, y1 + ph); ctx.lineTo(rx + pw, y1);
    ctx.strokeStyle = 'rgba(138,108,20,0.45)'; ctx.lineWidth = 0.8 / zoom; ctx.stroke();
  });
}

function drawStairs(ctx: CanvasRenderingContext2D, sx: (x:number)=>number, sy: (y:number)=>number, zoom: number, cx: number, cy: number, w = 1600, h = 2400) {
  const pw = sx(w) - sx(0);
  const ph = sy(h) - sy(0);
  const rx = sx(cx) - pw / 2;
  const ry = sy(cy) - ph / 2;
  
  ctx.fillStyle = '#b0b0b0';
  ctx.fillRect(rx, ry, pw, ph);
  ctx.strokeStyle = '#505050'; ctx.lineWidth = 1.5 / zoom;
  ctx.strokeRect(rx, ry, pw, ph);
  
  const steps = 10;
  ctx.lineWidth = 0.5 / zoom;
  for (let i = 1; i < steps; i++) {
    const sy_line = ry + (ph * i) / steps;
    ctx.beginPath(); ctx.moveTo(rx, sy_line); ctx.lineTo(rx + pw, sy_line); ctx.stroke();
  }
  ctx.lineWidth = 1.5 / zoom;
  ctx.beginPath(); ctx.moveTo(rx + pw/2, ry); ctx.lineTo(rx + pw/2, ry + ph); ctx.stroke();
}



function drawExitSign(ctx: CanvasRenderingContext2D, sx: (x:number)=>number, sy: (y:number)=>number, zoom: number, wx: number, wy: number, sublabel: string) {
  const cx = sx(wx); const cy = sy(wy);
  const bw = 52 / zoom; const bh = 24 / zoom;
  ctx.fillStyle = 'rgba(224,88,24,0.25)';
  ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
  ctx.strokeStyle = '#e05818'; ctx.lineWidth = 2 / zoom;
  ctx.strokeRect(cx - bw / 2, cy - bh / 2, bw, bh);
  ctx.fillStyle = '#e05818'; ctx.font = `bold ${8 / zoom}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', cx, cy - 3 / zoom);
  ctx.font = `${5.5 / zoom}px monospace`; ctx.fillStyle = 'rgba(224,88,24,0.8)';
  ctx.fillText(sublabel, cx, cy + 6 / zoom);
}

function drawBaseLayout(ctx: CanvasRenderingContext2D, sx: (x:number)=>number, sy: (y:number)=>number, zoom: number, wt: number, wp: number, floorId: string) {
  // ── Main building rectangle ──
  fillStroke(ctx, sx, sy, 2000, 2000, 46000, 33000, C.storeFill, C.partitionH, wt);

  // ── Corridors (`#` Grid Layout, exact proportions to images) ──
  fillRect(ctx, sx, sy, 2000, 10000, 46000, 4000, C.corridor); // Top Horizontal
  fillRect(ctx, sx, sy, 2000, 25000, 46000, 4000, C.corridor); // Bottom Horizontal
  fillRect(ctx, sx, sy, 13000, 14000, 4000, 11000, C.corridor); // Left Vertical
  fillRect(ctx, sx, sy, 33000, 14000, 4000, 11000, C.corridor); // Right Vertical
  fillRect(ctx, sx, sy, 23000, 2, 4000, 8000, C.corridor);  // North Vertical
  fillRect(ctx, sx, sy, 23000, 29000, 4000, 6000, C.corridor); // South Vertical

  // ── Green Atrium (Center) ──
  fillStroke(ctx, sx, sy, 17000, 14000, 16000, 11000, 'rgba(12,60,35,0.92)', 'rgba(20,180,80,0.60)', 2 / zoom);
  fillRect(ctx, sx, sy, 18000, 15000, 14000, 9000, 'rgba(8,45,25,0.96)');

  // ── Vertical Access ──
  drawStairs(ctx, sx, sy, zoom, 25000, 7000, 1000, 2400);            
  drawEscalatorPair(ctx, sx, sy, zoom, 25000, 31000, 400, 2400);    

  // ── Partitions ──
  // Shared Restroom block (cut out of top-left)
  fillRect(ctx, sx, sy, 13000, 5000, 4000, 5000, C.restroom);
  strokeRect(ctx, sx, sy, 13000, 5000, 4000, 5000, C.restroomDk, 1/zoom);
  hLine(ctx, sx, sy, 13000, 17000, 5000, C.partitionL, wp);
  vLine(ctx, sx, sy, 13000, 5000, 10000, C.partitionL, wp);
  ctx.fillStyle = '#000000';
  ctx.font = `bold ${6 / zoom}px Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Male|Female', sx(15000), sy(7500));

  if (floorId === 'GL') {
    // Top Blocks
    vLine(ctx, sx, sy,  7000, 2000, 10000, C.partitionL, wp); // Bacolod | Restroom/Savory
    hLine(ctx, sx, sy,  2000,  7000, 7000, C.partitionL, wp); // Exit Corridor
    vLine(ctx, sx, sy, 17000, 2000, 10000, C.partitionL, wp); // Restroom/Savory | NBS
    vLine(ctx, sx, sy, 23000, 2000, 10000, C.partitionL, wp); // NBS | N-Corridor
    vLine(ctx, sx, sy, 27000, 2000, 10000, C.partitionL, wp); // N-Corridor | Jamba
    vLine(ctx, sx, sy, 35000, 2000, 10000, C.partitionL, wp); // Jamba | Bonchon/Watsons
    hLine(ctx, sx, sy, 35000, 48000, 6000, C.partitionL, wp); // Bonchon / Watsons
    
    // Middle Blocks
    hLine(ctx, sx, sy,  2000, 13000, 19500, C.partitionL, wp); // Kuya J / Hap Chan
    hLine(ctx, sx, sy, 37000, 48000, 18000, C.partitionL, wp); // Beabi / Healthy Options
    hLine(ctx, sx, sy, 37000, 48000, 21500, C.partitionL, wp); // Healthy / Sarabia&Bow
    vLine(ctx, sx, sy, 42000, 21500, 25000, C.partitionL, wp); // Sarabia | Bow&Wow
    
    // Bottom Blocks
    vLine(ctx, sx, sy,  6000, 29000, 35000, C.partitionL, wp); // Bank | NBS2
    vLine(ctx, sx, sy, 10000, 29000, 35000, C.partitionL, wp); // NBS2 | Salad Stop
    vLine(ctx, sx, sy, 13000, 29000, 35000, C.partitionL, wp); // Salad Stop | Hokkaido/Katsu
    hLine(ctx, sx, sy, 13000, 23000, 32000, C.partitionL, wp); // Hokkaido / Katsu
    vLine(ctx, sx, sy, 23000, 29000, 35000, C.partitionL, wp); // Katsu | S-Corridor
    vLine(ctx, sx, sy, 27000, 29000, 35000, C.partitionL, wp); // S-Corridor | Kenny
    vLine(ctx, sx, sy, 34000, 29000, 35000, C.partitionL, wp); // Kenny | Breadtalk
    vLine(ctx, sx, sy, 41000, 29000, 35000, C.partitionL, wp); // Breadtalk | Starbucks
  } else if (floorId === 'L2') {
    // Top Blocks
    vLine(ctx, sx, sy, 17000, 2000, 10000, C.partitionL, wp); // Restroom/Furniture | Right-side of block
    vLine(ctx, sx, sy, 23000, 2000, 10000, C.partitionL, wp); // Right-side | N-Corridor
    vLine(ctx, sx, sy, 27000, 2000, 10000, C.partitionL, wp); // N-Corridor | Daiso
    hLine(ctx, sx, sy, 27000, 35000, 8000, C.partitionL, wp); // Daiso | Casa Romantica
    vLine(ctx, sx, sy, 35000, 2000, 10000, C.partitionL, wp); // Daiso | Blank
    
    // Middle Blocks
    vLine(ctx, sx, sy, 42000, 14000, 25000, C.partitionL, wp); // San Yang | Japan Home
    
    // Bottom Blocks
    vLine(ctx, sx, sy, 23000, 29000, 35000, C.partitionL, wp); // Ashley | S-Corridor
    vLine(ctx, sx, sy, 27000, 29000, 35000, C.partitionL, wp); // S-Corridor | Dogs
    vLine(ctx, sx, sy, 30000, 29000, 35000, C.partitionL, wp); // Dogs | Abenson
    vLine(ctx, sx, sy, 41000, 29000, 35000, C.partitionL, wp); // Abenson | Intellident/Bruno's
    hLine(ctx, sx, sy, 41000, 48000, 32000, C.partitionL, wp); // Intellident | Bruno's
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export function drawAyalaFloorPlan(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  visibleNodes: GraphNode[]
) {
  const floorId = visibleNodes.find(n => n.buildingId)?.buildingId ?? 'GL';

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const wt = 3.5 / zoom;  // thick perimeter wall
  const wp = 1.0 / zoom;  // thin interior partition

  // ── Outdoor background ──
  ctx.fillStyle = C.outdoor;
  ctx.fillRect(sx(0), sy(0), sx(W) - sx(0), sy(H) - sy(0));

  // ── Draw base layout (Corridors, Partitions, Stairs, Atrium) ──
  drawBaseLayout(ctx, sx, sy, zoom, wt, wp, floorId);

  // ══════════════════════════════════════════════════════════════════════════════
  //  GROUND FLOOR (GL)
  // ══════════════════════════════════════════════════════════════════════════════
  if (floorId === 'GL') {
    // ── Labels ──
    label(ctx, sx, sy, zoom, 'BACOLOD\nCHICKEN INASAL', 4500, 4500);
    label(ctx, sx, sy, zoom, 'CLASSIC SAVORY',          10000, 7500);
    label(ctx, sx, sy, zoom, 'NATIONAL\nBOOKSTORE',    19000, 6000, 'rgba(190,210,240,0.92)', 7);
    label(ctx, sx, sy, zoom, 'JAMBA JUICE',            31000, 6000);
    label(ctx, sx, sy, zoom, 'BONCHON CHICKEN',        41500, 4000);
    label(ctx, sx, sy, zoom, 'WATSONS',                41500, 8000);
    label(ctx, sx, sy, zoom, 'KUYA J\nRESTAURANT',      7500, 16500);
    label(ctx, sx, sy, zoom, 'HAP CHAN',                7500, 22000);
    label(ctx, sx, sy, zoom, 'BEABI\nCASA MUSICA',     42500, 16000);
    label(ctx, sx, sy, zoom, 'HEALTHY OPTIONS',        42500, 20000);
    label(ctx, sx, sy, zoom, 'SARABIA\nOPTICAL',       39500, 23500);
    label(ctx, sx, sy, zoom, 'BOW & WOW',              45000, 23500);
    label(ctx, sx, sy, zoom, 'BANK OF PH',              4000, 32000);
    label(ctx, sx, sy, zoom, 'NBS',                     8000, 32000, 'rgba(190,210,240,0.92)', 5);
    label(ctx, sx, sy, zoom, 'SALAD STOP',             11500, 32000);
    label(ctx, sx, sy, zoom, 'KATSU SORA',             18000, 33500);
    label(ctx, sx, sy, zoom, 'HOKKAIDO\nRAMEN',        18000, 30500);
    label(ctx, sx, sy, zoom, 'KENNY ROGERS',           30500, 31500);
    label(ctx, sx, sy, zoom, 'BREADTALK',              37500, 31500);
    label(ctx, sx, sy, zoom, 'STARBUCKS',              44500, 31500);

    // ── 6 Emergency Exits (ONLY ON GL) ──
    drawExitSign(ctx, sx, sy, zoom,   25000,  1000, 'NORTH');
    drawExitSign(ctx, sx, sy, zoom,    1000, 12000, 'WEST 1');
    drawExitSign(ctx, sx, sy, zoom,    1000, 27000, 'WEST 2');
    drawExitSign(ctx, sx, sy, zoom,   49000, 12000, 'EAST 1');
    drawExitSign(ctx, sx, sy, zoom,   49000, 27000, 'EAST 2');
    drawExitSign(ctx, sx, sy, zoom,   25000, 36000, 'SOUTH');
  }

  // ══════════════════════════════════════════════════════════════════════════════
  //  SECOND FLOOR (L2) - NO EXITS
  // ══════════════════════════════════════════════════════════════════════════════
  else if (floorId === 'L2') {
    // ── Labels (Match single large block text) ──
    label(ctx, sx, sy, zoom, 'FURNITURE REPUBLIC',       9000, 6000, 'rgba(190,210,240,0.92)', 8);
    label(ctx, sx, sy, zoom, 'DAISO\nJAPAN',             31000, 5000);
    label(ctx, sx, sy, zoom, 'CASA ROMANTICA',           31000, 9000);
    label(ctx, sx, sy, zoom, 'SAN-YANG\nFURNITURE',      39500, 19500);
    label(ctx, sx, sy, zoom, 'JAPAN HOME\nCENTRE',       45000, 19500);
    label(ctx, sx, sy, zoom, 'ASHLEY FURNITURE HOMESTORE',  12500, 32000, 'rgba(190,210,240,0.92)', 8);
    
    // Draw rotated text for Dogs And The City
    ctx.save();
    ctx.translate(sx(28500), sy(32000));
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#1e3a8a';
    ctx.font = `bold ${5 / zoom}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('DOGS AND THE CITY', 0, 0);
    ctx.restore();

    label(ctx, sx, sy, zoom, 'ABENSON',                  35500, 32000);
    label(ctx, sx, sy, zoom, 'INTELLIDENT DENTAL CLINIC', 44500, 30500);
  }

  // ── Floor watermark ──
  const floorLabels: Record<string, string> = {
    GL: 'GROUND FLOOR (GL)',
    L2: 'SECOND FLOOR (L2)',
  };
  ctx.save();
  ctx.fillStyle = C.watermark;
  ctx.font = `bold ${18 / zoom}px 'Courier New', monospace`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText(
    `AYALA MALLS SOLENAD NUVALI (ATRIUM) — ${floorLabels[floorId] ?? floorId}`,
    sx(2000), sy(H - 800)
  );
  ctx.restore();

  ctx.restore();
}
