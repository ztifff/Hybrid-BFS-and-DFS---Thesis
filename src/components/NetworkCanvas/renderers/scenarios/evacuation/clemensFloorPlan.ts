/**
 * Clemens Hall – 2D CAD Architectural Floor Plan Renderer
 *
 * Draws a realistic building floor plan as a background layer beneath the graph network.
 * Based on Thill et al. (2011) 3DCityNet indoor spatial data model.
 *
 * Coordinate space: 0–58000 (X) × 0–36000 (Y), matching evacuation.clemens.ts nodes.
 * All drawing uses sx()/sy() transforms already applied via ctx.setTransform in renderer.ts.
 */

import { GraphNode } from '../../types';

// ─── Architectural Constants ──────────────────────────────────────────────────

const W = 58000;  // Building width
const H = 36000;  // Building height

// Horizontal zone boundaries (Y values)
const ZONE = {
  northRoomBottom:   5500,   // Bottom of north room row
  northCorrTop:      5500,   // Top of north corridor
  northCorrBottom:   11000,  // Bottom of north corridor
  transitionTop:     11000,  // Top of stairwell transition zone
  spineTop:          14000,  // Top of main spine corridor
  spineBottom:       20000,  // Bottom of main spine corridor
  transitionBottom:  23000,  // Bottom of stairwell transition zone
  southCorrTop:      23000,  // Top of south corridor
  southCorrBottom:   28500,  // Bottom of south corridor
  southRoomTop:      28500,  // Top of south room row
};

// Vertical column dividers (X values) for room partitions
const COL_DIVIDERS = [0, 6500, 13000, 19000, 25500, 32500, 39000, 45500, 52000, 58000];

// Column center X values for room labels (approx centroid between dividers)
const COL_CENTERS = COL_DIVIDERS.slice(0, -1).map((x, i) => (x + COL_DIVIDERS[i + 1]) / 2);

// Stairwell positions (matches node positions in evacuation.clemens.ts)
const STAIRWELLS = [
  { cx: 4000,  cy: 12000, label: 'W\nSTAIR' },  // West Fire Stairs
  { cx: 56000, cy: 12000, label: 'E\nSTAIR' },  // East Fire Stairs
  { cx: 29000, cy: 21500, label: 'MAIN\nSTAIR' }, // Main Central Staircase
];

// Elevator positions
const ELEVATORS = [
  { cx: 16000, cy: 3000,  label: 'ELEV' },  // North Elevator Bank
  { cx: 42000, cy: 31000, label: 'ELEV' },  // South Elevator Bank
];

// Emergency exit positions (on the building perimeter)
const EXIT_DOORS = [
  { x: 29000, y: 36000, side: 'S' },  // Main Entrance South Exit
  { x: 29000, y: 0,     side: 'N' },  // North Gate Exit
  { x: 0,     y: 17000, side: 'W' },  // West Fire Exit
  { x: 58000, y: 17000, side: 'E' },  // East Fire Exit
];

// Per-floor room label arrays (north-row then south-row, skipping stair alcoves)
// Index 0 = col 1 (x≈3250) — stair alcove, leave blank
// Index 1 = col 2 (x≈9750)
// Index 2 = col 3 (x≈16000) — elevator alcove, leave blank for north
// Index 3 = col 4 (x≈22250)
// Index 4 = col 5 (x≈29000)
// Index 5 = col 6 (x≈35750)
// Index 6 = col 7 (x≈42250)
// Index 7 = col 8 (x≈48750)
// Index 8 = col 9 (x≈55000) — east stair alcove, leave blank

const FLOOR_LABELS: Record<string, { north: string[]; south: string[] }> = {
  L1: {
    north: ['', 'Registrar', '', 'Admissions', 'Lobby', 'Room 101', 'Restroom N', 'L1 Office', ''],
    south: ['', 'Cafeteria', '', 'Bookstore', '', 'Room 102', 'Restroom S', 'Guard Post', ''],
  },
  L2: {
    north: ['', 'Rm 201\nEnglish', '', 'Rm 202\nFilipino', 'N Annex', 'Rm 203\nSoc.Sci', 'Restroom N', 'Rm 204\nHuman.', ''],
    south: ['', 'Rm 205\nNSTP', '', 'Rm 206\nGuidance', '', 'Council\nOffice', 'Restroom S', 'Faculty', ''],
  },
  L3: {
    north: ['', 'Rm 301\nEng. Math', '', 'Rm 302\nCalculus', 'N Annex', 'Rm 303\nDiff. Eq.', 'Restroom N', 'Rm 304\nStatistics', ''],
    south: ['', 'Rm 305\nArch. Lab', '', 'Rm 306\nDrafting', '', 'Rm 307\nEng. Lab', 'Restroom S', 'Faculty', ''],
  },
  L4: {
    north: ['', 'Rm 401\nData Struct.', '', 'Rm 402\nAlgorithms', 'N Annex', 'Rm 403\nOS Lab', 'Restroom N', 'Rm 404\nComputer Lab', ''],
    south: ['', 'Rm 405\nNetworking', '', 'Rm 406\nDatabase', '', 'Rm 407\nResearch', 'Restroom S', 'Faculty', ''],
  },
  L5: {
    north: ['', 'Rm 501\nBoard Rm A', '', 'Rm 502\nBoard Rm B', 'Exec Hall', 'Rm 503\nVP Academic', 'Restroom N', 'Rm 504\nPresident', ''],
    south: ['', 'Rm 505\nConf. Hall A', '', 'Rm 506\nConf. Hall B', '', "Dean's\nOffice", 'Restroom S', 'Faculty', ''],
  },
};


// ─── Helper: draw hatch pattern for stairwells ───────────────────────────────
function drawHatch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, spacing: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.4;
  // Clip to box
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  // Draw diagonal lines
  for (let i = -h; i < w + h; i += spacing) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i - h, y + h);
    ctx.stroke();
  }
  ctx.restore();
}

// ─── Main Drawing Function ────────────────────────────────────────────────────

export function drawClemensFloorPlan(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  visibleNodes: GraphNode[],
) {
  // Detect active floor from visible nodes
  const floorId = visibleNodes.find(n => n.buildingId)?.buildingId ?? 'L1';
  const labels = FLOOR_LABELS[floorId] ?? FLOOR_LABELS['L1'];

  ctx.save();
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';

  // ── 1. Building interior base fill ──────────────────────────────────────────
  ctx.fillStyle = 'rgba(16, 22, 45, 0.82)';
  ctx.fillRect(sx(0), sy(0), sx(W) - sx(0), sy(H) - sy(0));

  // ── 2. Corridor band fills (slightly darker / tinted) ───────────────────────
  const corridorFill = 'rgba(8, 12, 30, 0.88)';
  const corridorBands = [
    { y1: ZONE.northCorrTop,   y2: ZONE.northCorrBottom },
    { y1: ZONE.spineTop,       y2: ZONE.spineBottom },
    { y1: ZONE.southCorrTop,   y2: ZONE.southCorrBottom },
  ];
  ctx.fillStyle = corridorFill;
  corridorBands.forEach(band => {
    ctx.fillRect(sx(0), sy(band.y1), sx(W) - sx(0), sy(band.y2) - sy(band.y1));
  });

  // ── 3. Stairwell transition alcoves (blue tint) ─────────────────────────────
  const stairZones = [
    { x1: 0,     x2: 8500,  y1: ZONE.transitionTop, y2: ZONE.spineTop },     // West upper
    { x1: 49500, x2: W,     y1: ZONE.transitionTop, y2: ZONE.spineTop },     // East upper
    { x1: 0,     x2: 8500,  y1: ZONE.spineBottom,   y2: ZONE.transitionBottom }, // West lower
    { x1: 49500, x2: W,     y1: ZONE.spineBottom,   y2: ZONE.transitionBottom }, // East lower
    { x1: 24000, x2: 34000, y1: ZONE.spineBottom,   y2: ZONE.transitionBottom }, // Main stair lower
  ];
  stairZones.forEach(z => {
    ctx.fillStyle = 'rgba(30, 58, 138, 0.13)';
    ctx.fillRect(sx(z.x1), sy(z.y1), sx(z.x2) - sx(z.x1), sy(z.y2) - sy(z.y1));
  });

  // ── 4. Room zone fills (north & south room rows) ────────────────────────────
  // Skip stair alcove columns (col 0: x=0→6500, col 8: x=52000→58000)
  // and elevator alcove column (col 2: x=13000→19000 for north, col 6: x=39000→45500 for south)
  const SKIP_NORTH = new Set([0, 2, 8]);  // column indices that are alcoves
  const SKIP_SOUTH = new Set([0, 6, 8]);

  COL_DIVIDERS.slice(0, -1).forEach((x1, colIdx) => {
    const x2 = COL_DIVIDERS[colIdx + 1];

    // North room row
    if (!SKIP_NORTH.has(colIdx)) {
      ctx.fillStyle = 'rgba(22, 32, 64, 0.72)';
      ctx.fillRect(sx(x1), sy(0), sx(x2) - sx(x1), sy(ZONE.northRoomBottom) - sy(0));
    }

    // South room row
    if (!SKIP_SOUTH.has(colIdx)) {
      ctx.fillStyle = 'rgba(22, 32, 64, 0.72)';
      ctx.fillRect(sx(x1), sy(ZONE.southRoomTop), sx(x2) - sx(x1), sy(H) - sy(ZONE.southRoomTop));
    }
  });

  // ── 5. Outer building shell ──────────────────────────────────────────────────
  ctx.strokeStyle = '#4A5568';
  ctx.lineWidth = 3.5 / zoom;
  ctx.strokeRect(sx(0), sy(0), sx(W) - sx(0), sy(H) - sy(0));

  // ── 6. Horizontal wall lines (zone boundaries) with doorway gaps ─────────────
  const hWalls = [
    { y: ZONE.northRoomBottom, label: 'northRoomWall' },
    { y: ZONE.northCorrBottom, label: 'northCorrWall' },
    { y: ZONE.spineTop,        label: 'spineTopWall' },
    { y: ZONE.spineBottom,     label: 'spineBottomWall' },
    { y: ZONE.southCorrTop,    label: 'southCorrTopWall' },
    { y: ZONE.southCorrBottom, label: 'southRoomWall' },
  ];

  // Doorway gap width (units in world space, centered on corridor/room connection node X)
  const DOOR_GAP = 2800;
  // X positions where doorways exist (column center x values for non-alcove columns)
  const DOORWAY_X_NORTH = [9750, 22250, 29000, 35750, 42250];   // room-to-north-corridor
  const DOORWAY_X_SOUTH = [9750, 22250, 29000, 35750, 42250];   // room-to-south-corridor
  // Spine corridor connections at every column (but corridors are open bands, no wall needed per se)

  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1.5 / zoom;

  hWalls.forEach(({ y }) => {
    const cy = sy(y);
    let cursor = sx(0);

    // Which doorway set applies at this y level?
    const isDoorWall = (
      y === ZONE.northRoomBottom || y === ZONE.northCorrBottom ||
      y === ZONE.southCorrTop    || y === ZONE.southCorrBottom
    );
    const doorXs = (y === ZONE.northRoomBottom || y === ZONE.northCorrBottom)
      ? DOORWAY_X_NORTH
      : DOORWAY_X_SOUTH;

    if (isDoorWall) {
      // Draw wall with gaps at doorway positions
      const right = sx(W);
      const gapHalf = (sx(DOOR_GAP) - sx(0));

      const sortedDoors = doorXs.map(dx => sx(dx)).sort((a, b) => a - b);
      sortedDoors.forEach(doorCenter => {
        const gapLeft  = doorCenter - gapHalf / 2;
        const gapRight = doorCenter + gapHalf / 2;
        // Draw wall segment up to gap
        if (cursor < gapLeft) {
          ctx.beginPath();
          ctx.moveTo(cursor, cy);
          ctx.lineTo(gapLeft, cy);
          ctx.stroke();
        }
        // Draw doorway indicator (orange tick)
        ctx.save();
        ctx.strokeStyle = 'rgba(221, 107, 32, 0.6)';
        ctx.lineWidth = 2 / zoom;
        ctx.beginPath();
        ctx.moveTo(gapLeft,  cy);
        ctx.lineTo(gapRight, cy);
        ctx.stroke();
        ctx.restore();
        cursor = gapRight;
      });
      // Draw remaining wall after last door
      if (cursor < right) {
        ctx.beginPath();
        ctx.moveTo(cursor, cy);
        ctx.lineTo(right, cy);
        ctx.stroke();
      }
    } else {
      // Solid horizontal wall (spine boundaries — open corridor zone, just a visual divider)
      ctx.save();
      ctx.strokeStyle = '#4A5568';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([8 / zoom, 6 / zoom]);
      ctx.beginPath();
      ctx.moveTo(sx(0), cy);
      ctx.lineTo(sx(W), cy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  });

  // ── 7. Vertical partition walls (room column dividers) ───────────────────────
  ctx.strokeStyle = '#2D3748';
  ctx.lineWidth = 1.5 / zoom;
  ctx.setLineDash([]);

  // Draw vertical partition in north room zone only (not in corridors)
  COL_DIVIDERS.slice(1, -1).forEach(x => {
    const cx = sx(x);
    // North room zone
    ctx.beginPath();
    ctx.moveTo(cx, sy(0));
    ctx.lineTo(cx, sy(ZONE.northRoomBottom));
    ctx.stroke();
    // South room zone
    ctx.beginPath();
    ctx.moveTo(cx, sy(ZONE.southRoomTop));
    ctx.lineTo(cx, sy(H));
    ctx.stroke();
    // Transition zones (thin dashed)
    ctx.save();
    ctx.strokeStyle = '#1e2d4a';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([4 / zoom, 6 / zoom]);
    ctx.beginPath();
    ctx.moveTo(cx, sy(ZONE.northCorrBottom));
    ctx.lineTo(cx, sy(ZONE.spineTop));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, sy(ZONE.spineBottom));
    ctx.lineTo(cx, sy(ZONE.southCorrTop));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  });

  // ── 8. Stairwell boxes (hatched rectangles) ───────────────────────────────────
  STAIRWELLS.forEach(stair => {
    const size = 4500;
    const x1 = sx(stair.cx - size / 2);
    const y1 = sy(stair.cy - size / 2);
    const w  = sx(stair.cx + size / 2) - x1;
    const h  = sy(stair.cy + size / 2) - y1;

    // Fill
    ctx.fillStyle = 'rgba(30, 58, 138, 0.18)';
    ctx.fillRect(x1, y1, w, h);

    // Hatch
    drawHatch(ctx, x1, y1, w, h, 6 / zoom, '#6366f1');

    // Border
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(x1, y1, w, h);

    // Label
    ctx.save();
    ctx.fillStyle = 'rgba(165, 180, 252, 0.75)';
    ctx.font = `bold ${9 / zoom}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    stair.label.split('\n').forEach((line, i) => {
      ctx.fillText(line, sx(stair.cx), sy(stair.cy) + (i - 0.5) * 11 / zoom);
    });
    ctx.restore();
  });

  // ── 9. Elevator boxes ────────────────────────────────────────────────────────
  ELEVATORS.forEach(elev => {
    const ew = 4000;
    const eh = 2500;
    const x1 = sx(elev.cx - ew / 2);
    const y1 = sy(elev.cy - eh / 2);
    const w  = sx(elev.cx + ew / 2) - x1;
    const h  = sy(elev.cy + eh / 2) - y1;

    ctx.fillStyle = 'rgba(59, 130, 246, 0.18)';
    ctx.fillRect(x1, y1, w, h);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5 / zoom;
    ctx.strokeRect(x1, y1, w, h);

    // Elevator door symbol (two vertical lines)
    ctx.save();
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.6)';
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    ctx.moveTo(sx(elev.cx), y1 + 2 / zoom);
    ctx.lineTo(sx(elev.cx), y1 + h - 2 / zoom);
    ctx.stroke();

    ctx.fillStyle = 'rgba(147, 197, 253, 0.8)';
    ctx.font = `bold ${8 / zoom}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(elev.label, sx(elev.cx), sy(elev.cy));
    ctx.restore();
  });

  // ── 10. Exit door markers on building perimeter ──────────────────────────────
  EXIT_DOORS.forEach(exit => {
    const markerSize = 4000;
    const cx = sx(exit.x);
    const cy = sy(exit.y);

    ctx.save();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 2 / zoom;

    if (exit.side === 'S' || exit.side === 'N') {
      ctx.fillRect(cx - sx(markerSize / 2) + sx(0), cy - sy(500) + sy(0), sx(markerSize) - sx(0), sy(1500) - sy(0));
      ctx.strokeRect(cx - sx(markerSize / 2) + sx(0), cy - sy(500) + sy(0), sx(markerSize) - sx(0), sy(1500) - sy(0));
    } else {
      ctx.fillRect(cx - sx(500) + sx(0), cy - sx(markerSize / 2) + sx(0), sx(1500) - sx(0), sx(markerSize) - sx(0));
      ctx.strokeRect(cx - sx(500) + sx(0), cy - sx(markerSize / 2) + sx(0), sx(1500) - sx(0), sx(markerSize) - sx(0));
    }
    // Exit arrow indicator
    ctx.fillStyle = 'rgba(252, 165, 165, 0.6)';
    ctx.font = `bold ${10 / zoom}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const arrows: Record<string, string> = { N: '↑', S: '↓', W: '←', E: '→' };
    ctx.fillText(arrows[exit.side] ?? '⬛', cx, cy);
    ctx.restore();
  });

  // ── 11. Room labels (pinned to top of room zone, underlined) ────────────────
  // Positioned near y=1200 from top of each room zone so nodes don't cover them
  const NORTH_LABEL_Y = 1200;  // world-space Y from building top
  const SOUTH_LABEL_Y = ZONE.southRoomTop + 1200;
  const LINE_H = 12; // px gap between multi-line rows

  COL_CENTERS.forEach((cx, colIdx) => {
    const northLabel = labels.north[colIdx] ?? '';
    const southLabel = labels.south[colIdx] ?? '';
    if (!northLabel && !southLabel) return;

    ctx.save();
    ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
    ctx.font = `${8.5 / zoom}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const drawLabelWithUnderline = (label: string, worldX: number, worldY: number) => {
      const lines = label.split('\n');
      lines.forEach((line, i) => {
        if (!line) return;
        const tx = sx(worldX);
        const ty = sy(worldY) + i * LINE_H / zoom;
        ctx.fillText(line, tx, ty);
        // Underline: measure text width and draw a rect below the text
        const textW = ctx.measureText(line).width;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.fillRect(tx - textW / 2, ty + 9 / zoom, textW, 0.8 / zoom);
        ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
      });
    };

    // North room label
    if (northLabel && !SKIP_NORTH.has(colIdx)) {
      drawLabelWithUnderline(northLabel, cx, NORTH_LABEL_Y);
    }

    // South room label
    if (southLabel && !SKIP_SOUTH.has(colIdx)) {
      drawLabelWithUnderline(southLabel, cx, SOUTH_LABEL_Y);
    }

    ctx.restore();
  });

  // ── 12. Corridor spine label ─────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = 'rgba(100, 116, 139, 0.3)';
  ctx.font = `bold ${11 / zoom}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('── MAIN CORRIDOR ──', sx(W / 2), sy((ZONE.spineTop + ZONE.spineBottom) / 2));
  ctx.fillText('── NORTH HALLWAY ──', sx(W / 2), sy((ZONE.northCorrTop + ZONE.northCorrBottom) / 2));
  ctx.fillText('── SOUTH HALLWAY ──', sx(W / 2), sy((ZONE.southCorrTop + ZONE.southCorrBottom) / 2));
  ctx.restore();

  // ── 13. Floor ID watermark (bottom-left corner of floor plan) ────────────────
  ctx.save();
  ctx.fillStyle = 'rgba(100, 116, 139, 0.25)';
  ctx.font = `bold ${28 / zoom}px monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`CLEMENS HALL — ${floorId}`, sx(800), sy(H - 800));
  ctx.restore();

  ctx.restore(); // Restore from main save
}
