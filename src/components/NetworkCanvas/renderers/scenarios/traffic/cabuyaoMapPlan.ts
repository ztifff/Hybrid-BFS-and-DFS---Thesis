/**
 * OpenStreetMap Real-World Physical Workspace Cartography for Cabuyao City
 * 
 * Features:
 * - Laguna de Bay (Laguna Lake) shoreline & freshwater body with depth gradients & wave accents
 * - Inland water basins and reservoirs
 * - San Cristobal River, Niugan River, Cabuyao River, and tributary waterways
 * - Greenery: Sta. Elena Golf Club, Nuvali green belts, parks, agricultural meadows
 * - Industrial zones: Laguna Technopark (SEZ), Light Industry & Science Park (LISP I)
 * - SLEX Expressway corridor (Asian Highway 26 / Tollway E2)
 * - Real-world Barangay & Landmark badges with responsive zoom scaling
 * - Authentic OpenStreetMap attribution & cartographic scale bar
 */

import { CABUYAO_MAP_DATA, MapLandmark } from '../../../../../data/cabuyaoMapData';

let currentWorkspaceView: 'physical' | 'logical' | undefined = undefined;

export function drawCabuyaoMapPlan(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  workspaceView: 'physical' | 'logical' | undefined,
  theme: string
) {
  currentWorkspaceView = workspaceView;
  if (currentWorkspaceView === 'logical') return;

  const isLight = theme === 'light';

  ctx.save();

  // 1. Base City Terrain / Landmass Fill
  drawLandmassBase(ctx, sx, sy, isLight);

  // 2. Industrial / Economic Zones (Laguna Technopark, LISP)
  drawIndustrialZones(ctx, sx, sy, isLight);

  // 3. Parks, Golf Courses & Agricultural Greenery (Nuvali, Sta. Elena)
  drawGreenSpaces(ctx, sx, sy, isLight);

  // 4. Inland Water Ponds & Basins
  drawInlandWater(ctx, sx, sy, isLight);

  // 5. Laguna de Bay (Laguna Lake) - Massive Freshwater Lake on East
  drawLagunaDeBay(ctx, sx, sy, zoom, isLight);

  // 6. Rivers & Tributaries (San Cristobal River, Cabuyao River)
  drawRivers(ctx, sx, sy, zoom, isLight);

  // 7. SLEX Highway Corridor Bed
  drawSlexCorridor(ctx, sx, sy, zoom, isLight);

  // 8. OpenStreetMap Landmarks, Barangays & Infrastructure Badges
  drawLandmarks(ctx, sx, sy, zoom, isLight);

  // 9. Cartographic Elements: Scale Bar & OSM Watermark
  drawCartographicMetadata(ctx, sx, sy, zoom, isLight);

  ctx.restore();
}

/**
 * 1. Base Terrain
 */
function drawLandmassBase(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  isLight: boolean
) {
  const x0 = sx(-60);
  const y0 = sy(-60);
  const x1 = sx(1260);
  const y1 = sy(960);
  const w = x1 - x0;
  const h = y1 - y0;

  // Gentle gradient for subtle topography feel
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  if (isLight) {
    grad.addColorStop(0, '#f1f5f9');
    grad.addColorStop(0.5, '#f8fafc');
    grad.addColorStop(1, '#e2e8f0');
  } else {
    // Rich dark slate/charcoal matching OpenStreetMap dark cartography
    grad.addColorStop(0, '#111622');
    grad.addColorStop(0.4, '#141a29');
    grad.addColorStop(1, '#0f1420');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(x0, y0, w, h);

  // City territory subtle border
  ctx.strokeStyle = isLight ? 'rgba(148, 163, 184, 0.4)' : 'rgba(51, 65, 85, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(x0, y0, w, h);
  ctx.setLineDash([]);
}

/**
 * 2. Industrial Zones (Laguna Technopark, LISP I)
 */
function drawIndustrialZones(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  isLight: boolean
) {
  const fill = isLight ? 'rgba(199, 210, 254, 0.35)' : 'rgba(99, 102, 241, 0.08)';
  const stroke = isLight ? 'rgba(129, 140, 248, 0.5)' : 'rgba(129, 140, 248, 0.2)';

  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;

  CABUYAO_MAP_DATA.industrialPolygons.forEach(ind => {
    if (ind.points.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(sx(ind.points[0].x), sy(ind.points[0].y));
    for (let i = 1; i < ind.points.length; i++) {
      ctx.lineTo(sx(ind.points[i].x), sy(ind.points[i].y));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
}

/**
 * 3. Parks, Golf Courses & Greenery (Sta. Elena, Nuvali)
 */
function drawGreenSpaces(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  isLight: boolean
) {
  const fill = isLight ? 'rgba(167, 243, 208, 0.5)' : 'rgba(16, 185, 129, 0.12)';
  const stroke = isLight ? 'rgba(52, 211, 153, 0.6)' : 'rgba(16, 185, 129, 0.25)';

  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 0.8;

  CABUYAO_MAP_DATA.greenPolygons.forEach(g => {
    if (g.points.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(sx(g.points[0].x), sy(g.points[0].y));
    for (let i = 1; i < g.points.length; i++) {
      ctx.lineTo(sx(g.points[i].x), sy(g.points[i].y));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
}

/**
 * 4. Inland Water Basins
 */
function drawInlandWater(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  isLight: boolean
) {
  const fill = isLight ? 'rgba(147, 197, 253, 0.7)' : 'rgba(30, 58, 138, 0.4)';
  const stroke = isLight ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.5)';

  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;

  CABUYAO_MAP_DATA.inlandWater.forEach(w => {
    if (w.points.length < 3) return;
    ctx.beginPath();
    ctx.moveTo(sx(w.points[0].x), sy(w.points[0].y));
    for (let i = 1; i < w.points.length; i++) {
      ctx.lineTo(sx(w.points[i].x), sy(w.points[i].y));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
}

/**
 * 5. Laguna de Bay (Laguna Lake)
 */
function drawLagunaDeBay(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  isLight: boolean
) {
  const pts = CABUYAO_MAP_DATA.lagunaDeBay;
  if (!pts || pts.length < 3) return;

  const xWest = sx(700);
  const xEast = sx(1350);

  // Deep oceanic gradient for lake water
  const grad = ctx.createLinearGradient(xWest, sy(300), xEast, sy(500));
  if (isLight) {
    grad.addColorStop(0, '#bae6fd'); // Sky blue near shore
    grad.addColorStop(0.5, '#93c5fd');
    grad.addColorStop(1, '#60a5fa');
  } else {
    grad.addColorStop(0, '#172554'); // Deep midnight navy near shore
    grad.addColorStop(0.4, '#1e3a8a');
    grad.addColorStop(1, '#0f172a');
  }

  // Draw lake polygon
  ctx.beginPath();
  ctx.moveTo(sx(pts[0].x), sy(pts[0].y));
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(sx(pts[i].x), sy(pts[i].y));
  }
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Shoreline glow and border
  ctx.beginPath();
  const shore = CABUYAO_MAP_DATA.shoreline;
  if (shore && shore.length > 1) {
    ctx.moveTo(sx(shore[0].x), sy(shore[0].y));
    for (let i = 1; i < shore.length; i++) {
      ctx.lineTo(sx(shore[i].x), sy(shore[i].y));
    }
    ctx.strokeStyle = isLight ? '#0284c7' : '#38bdf8';
    ctx.lineWidth = Math.max(1.5, 2.5 * Math.min(1.2, zoom));
    ctx.shadowColor = isLight ? 'rgba(2, 132, 199, 0.4)' : 'rgba(56, 189, 248, 0.6)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Atmospheric Water Body Typography
  const lx = sx(1060);
  const ly = sy(280);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Major Water Name
  const titleSize = Math.max(14, 22 * Math.min(1.4, zoom));
  ctx.font = `bold italic ${titleSize}px "Inter", "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = isLight ? 'rgba(3, 105, 161, 0.85)' : 'rgba(147, 197, 253, 0.75)';
  ctx.fillText('🌊 LAGUNA DE BAY', lx, ly);

  // Subtitle
  const subSize = Math.max(9, 12 * Math.min(1.2, zoom));
  ctx.font = `italic ${subSize}px "Inter", "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = isLight ? 'rgba(3, 105, 161, 0.6)' : 'rgba(147, 197, 253, 0.45)';
  ctx.fillText('Freshwater Lake • Eastern Basin', lx, ly + titleSize * 1.05);

  // Subtle decorative wave contours in the lake
  const waveColor = isLight ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.08)';
  ctx.strokeStyle = waveColor;
  ctx.lineWidth = 1;
  const waveOffsets = [
    { x: 1020, y: 380, len: 120 },
    { x: 1100, y: 440, len: 90 },
    { x: 1050, y: 520, len: 140 },
    { x: 1160, y: 590, len: 100 },
    { x: 1120, y: 700, len: 110 },
  ];
  waveOffsets.forEach(wv => {
    ctx.beginPath();
    const wx1 = sx(wv.x);
    const wy = sy(wv.y);
    const wx2 = sx(wv.x + wv.len);
    ctx.moveTo(wx1, wy);
    ctx.bezierCurveTo(
      (wx1 * 2 + wx2) / 3, wy - 4 * zoom,
      (wx1 + wx2 * 2) / 3, wy + 4 * zoom,
      wx2, wy
    );
    ctx.stroke();
  });

  ctx.restore();
}

/**
 * 6. Rivers & Waterways (San Cristobal, Cabuyao River)
 */
function drawRivers(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  isLight: boolean
) {
  const riverColor = isLight ? '#0284c7' : '#38bdf8';
  const riverOpacity = isLight ? 0.75 : 0.65;
  const riverLw = Math.max(1.2, 2.2 * Math.min(1.2, zoom));

  ctx.save();
  ctx.strokeStyle = riverColor;
  ctx.globalAlpha = riverOpacity;
  ctx.lineWidth = riverLw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  CABUYAO_MAP_DATA.rivers.forEach(r => {
    if (r.points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(sx(r.points[0].x), sy(r.points[0].y));
    for (let i = 1; i < r.points.length; i++) {
      ctx.lineTo(sx(r.points[i].x), sy(r.points[i].y));
    }
    ctx.stroke();
  });

  ctx.globalAlpha = 1.0;
  ctx.restore();
}

/**
 * 7. SLEX Highway Corridor Bed
 * Renders an underlying asphalt & embankment ribbon matching South Luzon Expressway
 */
function drawSlexCorridor(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  isLight: boolean
) {
  // Approximate SLEX arterial path from North (Santa Rosa entry) to South (Calamba entry)
  const slexPath = [
    { x: 30, y: 160 },
    { x: 120, y: 260 },
    { x: 260, y: 380 },
    { x: 420, y: 520 },
    { x: 580, y: 730 },
    { x: 670, y: 840 },
    { x: 710, y: 890 }
  ];

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(sx(slexPath[0].x), sy(slexPath[0].y));
  for (let i = 1; i < slexPath.length; i++) {
    ctx.lineTo(sx(slexPath[i].x), sy(slexPath[i].y));
  }

  // Outer corridor road bed
  const corridorWidth = Math.max(6, 12 * Math.min(1.5, zoom));
  ctx.strokeStyle = isLight ? '#cbd5e1' : '#1e293b';
  ctx.lineWidth = corridorWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Highway casing line
  ctx.strokeStyle = isLight ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.25)';
  ctx.lineWidth = corridorWidth * 0.7;
  ctx.stroke();

  ctx.restore();
}

/**
 * 8. OpenStreetMap Landmarks & Barangay Badges
 */
function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  isLight: boolean
) {
  // Filter landmarks that fit comfortable zoom threshold so canvas isn't overcrowded
  const showSuburbs = zoom >= 0.25;
  const showMinor = zoom >= 0.45;

  CABUYAO_MAP_DATA.landmarks.forEach(lm => {
    if (lm.type === 'water') return; // Handled separately in drawLagunaDeBay
    if ((lm.type === 'barangay' || lm.type === 'river') && !showSuburbs) return;
    if (lm.type === 'toll' && !showMinor) return;

    drawLandmarkBadge(ctx, sx(lm.x), sy(lm.y), lm, zoom, isLight);
  });
}

function drawLandmarkBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  lm: MapLandmark,
  zoom: number,
  isLight: boolean
) {
  ctx.save();

  // Determine styling based on landmark category
  let icon = '📍';
  let badgeBg = isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(15, 23, 42, 0.88)';
  let textColor = isLight ? '#0f172a' : '#f8fafc';
  let borderColor = isLight ? 'rgba(203, 213, 225, 0.8)' : 'rgba(51, 65, 85, 0.7)';

  if (lm.type === 'civic') {
    icon = '🏛️';
    badgeBg = isLight ? 'rgba(240, 253, 244, 0.95)' : 'rgba(6, 78, 59, 0.85)';
    borderColor = '#10b981';
    textColor = isLight ? '#065f46' : '#ecfdf5';
  } else if (lm.type === 'highway') {
    icon = '🛣️';
    borderColor = 'rgba(239, 68, 68, 0.6)';
  } else if (lm.type === 'toll') {
    icon = '🎫';
    borderColor = 'rgba(245, 158, 11, 0.6)';
  } else if (lm.type === 'industrial') {
    icon = '🏭';
    borderColor = 'rgba(139, 92, 246, 0.5)';
  } else if (lm.type === 'leisure') {
    icon = '⛳';
    borderColor = 'rgba(16, 185, 129, 0.5)';
  } else if (lm.type === 'district') {
    icon = '🏢';
    borderColor = 'rgba(6, 182, 212, 0.5)';
  } else if (lm.type === 'river') {
    icon = '💧';
    borderColor = 'rgba(2, 132, 199, 0.4)';
  }

  const baseFontPx = Math.max(9, Math.min(13, 11 * Math.sqrt(zoom)));
  ctx.font = `600 ${baseFontPx}px "Inter", "Segoe UI", system-ui, sans-serif`;
  const textWidth = ctx.measureText(`${icon} ${lm.name}`).width;

  const padX = 8;
  const padY = 4;
  const w = textWidth + padX * 2;
  const h = baseFontPx * 1.5 + padY * 2;
  const rx = cx - w / 2;
  const ry = cy - h / 2;

  // Glassmorphic rounded rectangle badge
  ctx.fillStyle = badgeBg;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.shadowColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 6;

  ctx.beginPath();
  const radius = 6;
  ctx.roundRect ? ctx.roundRect(rx, ry, w, h, radius) : ctx.rect(rx, ry, w, h);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Text inside badge
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;
  ctx.fillText(`${icon} ${lm.name}`, cx, cy);

  ctx.restore();
}

/**
 * 9. Cartographic Metadata (Scale bar & OpenStreetMap attribution)
 */
function drawCartographicMetadata(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  isLight: boolean
) {
  // Bottom-right watermark in graph space
  const xBr = sx(1180);
  const yBr = sy(880);

  ctx.save();
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';

  // OpenStreetMap Attribution badge
  const textSize = Math.max(9, 11 * Math.min(1.2, zoom));
  ctx.font = `bold ${textSize}px "Inter", "Segoe UI", system-ui, sans-serif`;
  ctx.fillStyle = isLight ? 'rgba(51, 65, 85, 0.7)' : 'rgba(148, 163, 184, 0.6)';
  ctx.fillText('🗺️ © OpenStreetMap contributors • Cabuyao GIS Network', xBr, yBr);

  // Compass Rose (North Arrow) at Top-Left
  const xN = sx(30);
  const yN = sy(30);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${textSize * 1.3}px sans-serif`;
  ctx.fillStyle = isLight ? '#dc2626' : '#f87171';
  ctx.fillText('🧭 N', xN, yN);

  ctx.restore();
}
