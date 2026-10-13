/**
 * Real-World Architectural Blueprint Renderer for AWS Fulfillment Center (Logistics / Robotics)
 *
 * Implements a high-precision 2D CAD architectural blueprint floor plan matching
 * real-world automated logistics fulfillment center facilities (Amazon Kiva/AMR grid).
 *
 * Features:
 * - 4 Inbound Truck Loading Docks with hydraulic dock levelers, rollup doors, and trailer silhouettes
 * - High-voltage Automated Guided Vehicle (AGV/AMR) inductive fast-charging & maintenance depot
 * - Industrial pallet rack framing with upright column posts, cross-bracing ties, and dashed bay boundaries
 * - Chemical / hazardous drum staging area with blue barrels on spill containment pallets (matching reference)
 * - Bulk wooden pallet overflow & shrink-wrap staging zone
 * - Forklift and manual hydraulic pallet jack parking stall with safety hatching
 * - Industrial cardboard recycling and waste containment station
 * - Outbound dispatch packing workstations with roller conveyor tables and secondary fleet buffer depot
 * - Two-way AMR highway centerlines, floor directional chevrons, and optical fiducial ground markers
 * - Structural concrete perimeter walls with cast-in-place pilasters and steel I-beam column grid
 * - High-tech cyber/navy luminous blueprint styling for Dark Mode & technical drafting paper for Light Mode
 * - Complete adherence to Logical Workspace toggle (cleanly hidden in logical view)
 */

import { GraphNode } from '../../../../../types';

interface DockBay {
  id: string;
  label: string;
  cx: number;
}

interface RackInfo {
  id: string;
  name: string;
  category: string;
  cx: number;
  cy: number;
}

const WAREHOUSE_BOUNDS = {
  xMin: -6000,
  xMax: 55000,
  yMin: -3600,
  yMax: 47000,
  width: 61000,
  height: 50600,
};

const TRUCK_DOCKS: DockBay[] = [
  { id: 'dock_1', label: 'DOCK 01 · INBOUND', cx: 8500 },
  { id: 'dock_2', label: 'DOCK 02 · INBOUND', cx: 16500 },
  { id: 'dock_3', label: 'DOCK 03 · INBOUND', cx: 33500 },
  { id: 'dock_4', label: 'DOCK 04 · INBOUND', cx: 41500 },
];

const RACK_CONFIGS: RackInfo[] = [
  // Tier 1 (y = 4000)
  { id: 'shelf_a1', name: 'BAY A-01', category: 'ELECTRONICS', cx: 10000, cy: 4000 },
  { id: 'shelf_a2', name: 'BAY A-02', category: 'APPAREL', cx: 20000, cy: 4000 },
  { id: 'shelf_b1', name: 'BAY B-01', category: 'HOME & KITCHEN', cx: 30000, cy: 4000 },
  { id: 'shelf_b2', name: 'BAY B-02', category: 'BOOKS & MEDIA', cx: 40000, cy: 4000 },
  // Tier 2 (y = 12000)
  { id: 'shelf_d1', name: 'BAY D-01', category: 'ELECTRONICS', cx: 10000, cy: 12000 },
  { id: 'shelf_e1', name: 'BAY E-01', category: 'APPAREL', cx: 20000, cy: 12000 },
  { id: 'shelf_e3', name: 'BAY E-03', category: 'TOYS & GAMES', cx: 30000, cy: 12000 },
  { id: 'shelf_f1', name: 'BAY F-01', category: 'HEAVY GOODS', cx: 40000, cy: 12000 },
  // Tier 3 (y = 20000)
  { id: 'shelf_d2', name: 'BAY D-02', category: 'TOOLS & HARDWARE', cx: 10000, cy: 20000 },
  { id: 'shelf_e2', name: 'BAY E-02', category: 'HOME GOODS', cx: 20000, cy: 20000 },
  { id: 'shelf_e4', name: 'BAY E-04', category: 'BOOKS & PRINT', cx: 30000, cy: 20000 },
  { id: 'shelf_f2', name: 'BAY F-02', category: 'AUTOMOTIVE', cx: 40000, cy: 20000 },
  // Tier 4 (y = 28000)
  { id: 'shelf_g1', name: 'BAY G-01', category: 'ELECTRONICS', cx: 10000, cy: 28000 },
  { id: 'shelf_g2', name: 'BAY G-02', category: 'APPAREL', cx: 20000, cy: 28000 },
  { id: 'shelf_g3', name: 'BAY G-03', category: 'HOME GOODS', cx: 30000, cy: 28000 },
  { id: 'shelf_g4', name: 'BAY G-04', category: 'HARDWARE', cx: 40000, cy: 28000 },
  // Tier 5 (y = 36000)
  { id: 'shelf_h1', name: 'BAY H-01', category: 'BOOKS & MEDIA', cx: 10000, cy: 36000 },
  { id: 'shelf_h2', name: 'BAY H-02', category: 'HOME & KITCHEN', cx: 20000, cy: 36000 },
  { id: 'shelf_h3', name: 'BAY H-03', category: 'TOYS & GAMES', cx: 30000, cy: 36000 },
  { id: 'shelf_h4', name: 'BAY H-04', category: 'HEAVY GOODS', cx: 40000, cy: 36000 },
];

// Structural steel column grid coordinates
const GRID_COLS = [
  { label: 'A', x: 5000 },
  { label: 'B', x: 15000 },
  { label: 'C', x: 25000 },
  { label: 'D', x: 35000 },
  { label: 'E', x: 45000 },
];

const GRID_ROWS = [
  { label: '1', y: -2500 },
  { label: '2', y: 6000 },
  { label: '3', y: 14000 },
  { label: '4', y: 22000 },
  { label: '5', y: 30000 },
  { label: '6', y: 38000 },
  { label: '7', y: 46000 },
];

export function drawAWSBlueprintPlan(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  scale: number,
  _visibleNodes: GraphNode[],
  _walls: { x1: number; y1: number; x2: number; y2: number; level: string }[] | undefined,
  workspaceView: 'physical' | 'logical' | undefined,
  theme: string
): void {
  if (workspaceView === 'logical') return;

  const isLight = theme === 'light';
  // Open up the building's horizontal bays while keeping the row spacing and
  // node centers aligned with the wider AWS graph.
  const planSx = (x: number) => sx(25000 + (x - 25000) * 1.25);

  ctx.save();
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';

  // 1. Concrete floor slab and optical navigation fiducial grid
  drawFloorSlabAndGrid(ctx, planSx, sy, zoom, scale, isLight);

  // 2. Inbound truck loading docks (exterior apron + hydraulic dock bays)
  drawInboundTruckDocks(ctx, planSx, sy, zoom, scale, isLight);

  // 3. Automated AMR fast-charging & maintenance depot (depot_main)
  drawChargingDepot(ctx, planSx, sy, zoom, scale, isLight);

  // 4. Industrial pallet racking modules with structural frames
  drawStorageRacks(ctx, planSx, sy, zoom, scale, isLight);

  // 5. Peripheral utility zones (chemical drums, pallet overflow, forklift stall, trash)
  drawUtilityZones(ctx, planSx, sy, zoom, scale, isLight);

  // 6. Outbound dispatch workstations, roller conveyors, and secondary fleet depot
  drawOutboundDispatchAndDesks(ctx, planSx, sy, zoom, scale, isLight);

  // 7. AMR highway lane markings, direction chevrons & crosswalks
  drawHighwayMarkings(ctx, planSx, sy, zoom, scale, isLight);

  // 8. Reinforced concrete perimeter walls & structural steel I-beam column grid
  drawPerimeterWallsAndColumns(ctx, planSx, sy, zoom, scale, isLight);

  // 9. Engineering title block, metric scale bar, and True North compass
  drawEngineeringTitleBlock(ctx, planSx, sy, zoom, scale, isLight);

  ctx.restore();
}

/**
 * 1. Base floor slab with subtle grid and optical AMR calibration crosshairs
 */
function drawFloorSlabAndGrid(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  scale: number,
  isLight: boolean
) {
  const { xMin, xMax, yMin, yMax } = WAREHOUSE_BOUNDS;
  const screenX1 = sx(xMin);
  const screenY1 = sy(yMin);
  const screenW = sx(xMax) - screenX1;
  const screenH = sy(yMax) - screenY1;

  // Concrete floor slab fill
  ctx.fillStyle = isLight ? '#f8fafc' : '#080d1a';
  ctx.fillRect(screenX1, screenY1, screenW, screenH);

  // Subtle interior floor expansion joint grid (2500 world units)
  ctx.strokeStyle = isLight ? 'rgba(203, 213, 225, 0.45)' : 'rgba(30, 58, 138, 0.18)';
  ctx.lineWidth = Math.max(0.5, 0.8 / zoom);

  const step = 2500;
  for (let x = xMin + step; x < xMax; x += step) {
    ctx.beginPath();
    ctx.moveTo(sx(x), screenY1);
    ctx.lineTo(sx(x), sy(yMax));
    ctx.stroke();
  }

  for (let y = yMin + step; y < yMax; y += step) {
    ctx.beginPath();
    ctx.moveTo(screenX1, sy(y));
    ctx.lineTo(sx(xMax), sy(y));
    ctx.stroke();
  }

  // Optical AMR ground fiducial markers (tiny '+' crosshairs at 5000 unit intervals)
  ctx.strokeStyle = isLight ? 'rgba(100, 116, 139, 0.35)' : 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = Math.max(0.6, 1 / zoom);
  const markSize = 400;

  for (let x = 5000; x <= 45000; x += 5000) {
    for (let y = 1000; y <= 27000; y += 4000) {
      const cx = sx(x);
      const cy = sy(y);
      const ms = (markSize * scale) / 2;
      ctx.beginPath();
      ctx.moveTo(cx - ms, cy);
      ctx.lineTo(cx + ms, cy);
      ctx.moveTo(cx, cy - ms);
      ctx.lineTo(cx, cy + ms);
      ctx.stroke();
    }
  }
}

/**
 * 2. Inbound truck loading docks (exterior apron + parked semi-trucks + hydraulic levelers)
 */
function drawInboundTruckDocks(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  _scale: number,
  isLight: boolean
) {
  const { xMin, xMax, yMin } = WAREHOUSE_BOUNDS;

  // Exterior truck docking apron (asphalt tarmac)
  const apronTop = yMin - 4200;
  const screenApronX1 = sx(xMin - 500);
  const screenApronY1 = sy(apronTop);
  const screenApronW = sx(xMax + 500) - screenApronX1;
  const screenApronH = sy(yMin) - screenApronY1;

  ctx.fillStyle = isLight ? '#e2e8f0' : '#040711';
  ctx.fillRect(screenApronX1, screenApronY1, screenApronW, screenApronH);

  // Exterior guide lanes for trucks (yellow dashed lines)
  ctx.strokeStyle = isLight ? '#cbd5e1' : 'rgba(245, 158, 11, 0.25)';
  ctx.lineWidth = Math.max(1, 1.5 / zoom);
  ctx.setLineDash([8 / zoom, 8 / zoom]);
  [6000, 14000, 21000, 29000, 36000, 44000].forEach(lx => {
    ctx.beginPath();
    ctx.moveTo(sx(lx), sy(apronTop));
    ctx.lineTo(sx(lx), sy(yMin));
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Draw 4 Inbound Truck Loading Bays
  TRUCK_DOCKS.forEach((dock, idx) => {
    const bayW = 4200;
    const x1 = dock.cx - bayW / 2;
    const x2 = dock.cx + bayW / 2;

    // A. Parked Semi-Truck Trailer Silhouette (Top-Down CAD View)
    const truckW = 3400;
    const truckH = 4600;
    const tx = dock.cx - truckW / 2;
    const ty = yMin - truckH - 200;

    // Trailer body (White/Blue Logistics theme matching reference image)
    ctx.fillStyle = isLight ? '#ffffff' : '#0f172a';
    ctx.strokeStyle = isLight ? '#94a3b8' : '#38bdf8';
    ctx.lineWidth = Math.max(1, 1.5 / zoom);
    ctx.fillRect(sx(tx), sy(ty), sx(tx + truckW) - sx(tx), sy(ty + truckH) - sy(ty));
    ctx.strokeRect(sx(tx), sy(ty), sx(tx + truckW) - sx(tx), sy(ty + truckH) - sy(ty));

    // Logistics blue livery stripe on trailer roof
    ctx.fillStyle = isLight ? '#2563eb' : '#0284c7';
    const stripeH = 800;
    ctx.fillRect(sx(tx + 400), sy(ty + truckH * 0.4), sx(tx + truckW - 400) - sx(tx + 400), sy(ty + truckH * 0.4 + stripeH) - sy(ty + truckH * 0.4));

    // Trailer rear bumper and rubber dock compression pads
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(sx(tx + 200), sy(yMin - 350), sx(tx + 900) - sx(tx + 200), sy(yMin) - sy(yMin - 350));
    ctx.fillRect(sx(tx + truckW - 900), sy(yMin - 350), sx(tx + truckW - 200) - sx(tx + truckW - 900), sy(yMin) - sy(yMin - 350));

    // Truck cab aerodynamic nose
    ctx.fillStyle = isLight ? '#0284c7' : '#0369a1';
    ctx.fillRect(sx(tx + 300), sy(ty - 900), sx(tx + truckW - 300) - sx(tx + 300), sy(ty) - sy(ty - 900));
    // Windshield
    ctx.fillStyle = isLight ? '#38bdf8' : '#38bdf8';
    ctx.fillRect(sx(tx + 600), sy(ty - 750), sx(tx + truckW - 600) - sx(tx + 600), sy(ty - 350) - sy(ty - 750));

    // Truck trailer label
    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.font = `bold ${Math.max(8, 10 / zoom)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (zoom >= 0.45) ctx.fillText(`FLEET TRUCK T-0${idx + 1}`, sx(dock.cx), sy(ty + 1200));

    // B. Indoor Hydraulic Dock Leveler Pit & Rollup Sectional Door
    const pitDepth = 2200;
    const pitW = 2800;
    const px = dock.cx - pitW / 2;
    const py = yMin;

    // Pit opening
    ctx.fillStyle = isLight ? '#e2e8f0' : 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(sx(px), sy(py), sx(px + pitW) - sx(px), sy(py + pitDepth) - sy(py));

    // Hydraulic ramp steel plate with diagonal slip-resistant hatch
    drawDiagonalHatch(
      ctx,
      sx(px + 200),
      sy(py + 200),
      sx(px + pitW - 200) - sx(px + 200),
      sy(py + pitDepth - 200) - sy(py + 200),
      12 / zoom,
      isLight ? 'rgba(71, 85, 105, 0.4)' : 'rgba(56, 189, 248, 0.4)'
    );

    // Roll-up sectional overhead door threshold
    ctx.fillStyle = isLight ? '#64748b' : '#38bdf8';
    ctx.fillRect(sx(x1), sy(yMin - 150), sx(x2) - sx(x1), sy(yMin + 150) - sy(yMin - 150));

    // Safety yellow/black hazard hatching around dock pit
    drawHazardStripes(
      ctx,
      sx(px - 300),
      sy(py),
      sx(300) - sx(0),
      sy(py + pitDepth) - sy(py),
      8 / zoom
    );
    drawHazardStripes(
      ctx,
      sx(px + pitW),
      sy(py),
      sx(300) - sx(0),
      sy(py + pitDepth) - sy(py),
      8 / zoom
    );

    // Dock bay badge label
    ctx.save();
    ctx.fillStyle = isLight ? '#0f172a' : '#38bdf8';
    ctx.font = `bold ${Math.max(9, 11 / zoom)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    if (zoom >= 0.45) ctx.fillText(dock.label, sx(dock.cx), sy(py + pitDepth + 350));
    ctx.restore();
  });
}

/**
 * 3. Automated AMR high-voltage fast charging and maintenance depot (depot_main)
 */
function drawChargingDepot(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  scale: number,
  isLight: boolean
) {
  const cx = 25000;
  const cy = -1500;
  const depotW = 7600;
  const depotH = 3400;

  const dx1 = cx - depotW / 2;
  const dy1 = cy - depotH / 2;
  const dx2 = cx + depotW / 2;
  const dy2 = cy + depotH / 2;

  // Staging floor pad with safety boundary
  ctx.fillStyle = isLight ? 'rgba(240, 253, 244, 0.85)' : 'rgba(6, 78, 59, 0.2)';
  ctx.strokeStyle = isLight ? '#16a34a' : '#10b981';
  ctx.lineWidth = Math.max(1.2, 2 / zoom);
  ctx.fillRect(sx(dx1), sy(dy1), sx(dx2) - sx(dx1), sy(dy2) - sy(dy1));
  ctx.strokeRect(sx(dx1), sy(dy1), sx(dx2) - sx(dx1), sy(dy2) - sy(dy1));

  // Yellow hazard chevron perimeter border
  drawHazardStripes(ctx, sx(dx1), sy(dy2 - 250), sx(dx2) - sx(dx1), sy(dy2) - sy(dy2 - 250), 10 / zoom);

  // Wireless inductive fast-charging coil plates (3 charging pads)
  [-2200, 0, 2200].forEach((xOff, pIdx) => {
    const padX = cx + xOff;
    const padY = cy;
    const padR = 1100 * scale;

    ctx.save();
    // Concentric copper induction rings
    ctx.strokeStyle = isLight ? '#d97706' : '#f59e0b';
    ctx.lineWidth = Math.max(1, 1.8 / zoom);
    ctx.beginPath();
    ctx.arc(sx(padX), sy(padY), padR, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.strokeStyle = isLight ? '#16a34a' : '#10b981';
    ctx.lineWidth = Math.max(0.8, 1.2 / zoom);
    ctx.beginPath();
    ctx.arc(sx(padX), sy(padY), padR * 0.65, 0, 2 * Math.PI);
    ctx.stroke();

    // High-voltage lightning bolt glyph in center
    ctx.fillStyle = isLight ? '#ca8a04' : '#fbbf24';
    ctx.font = `bold ${Math.max(12, 16 / zoom)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (zoom >= 0.45) ctx.fillText('⚡', sx(padX), sy(padY));

    // Pad ID
    ctx.fillStyle = isLight ? '#15803d' : '#34d399';
    ctx.font = `bold ${Math.max(8, 9 / zoom)}px monospace`;
    if (zoom >= 0.45) ctx.fillText(`PAD 0${pIdx + 1}`, sx(padX), sy(padY + 1300));
    ctx.restore();
  });

  // Battery swap cabinet & technician diagnostic terminal silhouettes
  const cabW = 1800;
  const cabH = 700;
  ctx.fillStyle = isLight ? '#334155' : '#1e293b';
  ctx.fillRect(sx(dx1 + 400), sy(dy1 + 400), sx(dx1 + 400 + cabW) - sx(dx1 + 400), sy(dy1 + 400 + cabH) - sy(dy1 + 400));
  ctx.fillRect(sx(dx2 - 400 - cabW), sy(dy1 + 400), sx(cabW) - sx(0), sy(cabH) - sy(0));

  // Safety protective steel bollards (yellow circles with center anchor)
  [
    { x: dx1 + 300, y: dy1 + 300 },
    { x: dx2 - 300, y: dy1 + 300 },
    { x: dx1 + 300, y: dy2 - 400 },
    { x: dx2 - 300, y: dy2 - 400 },
  ].forEach(b => {
    drawBollard(ctx, sx(b.x), sy(b.y), 400 * scale, zoom, isLight);
  });

  // Depot title badge
  ctx.save();
  ctx.fillStyle = isLight ? '#166534' : '#4ade80';
  ctx.font = `bold ${Math.max(9, 12 / zoom)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  if (zoom >= 0.45) ctx.fillText('⚡ HIGH-VOLTAGE FAST-CHARGING FLEET DEPOT', sx(cx), sy(dy1 - 250));
  ctx.restore();
}

/**
 * 4. Industrial pallet racking modules with structural frames and dashed boundary markings
 */
function drawStorageRacks(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  scale: number,
  isLight: boolean
) {
  const rackW = 7500;
  const rackH = 5000;
  const hw = rackW / 2;
  const hh = rackH / 2;

  RACK_CONFIGS.forEach(rack => {
    const rx1 = rack.cx - hw;
    const ry1 = rack.cy - hh;
    const rx2 = rack.cx + hw;
    const ry2 = rack.cy + hh;

    const screenX1 = sx(rx1);
    const screenY1 = sy(ry1);
    const screenW = sx(rx2) - screenX1;
    const screenH = sy(ry2) - screenY1;

    // A. Dashed blue/cyan aisle perimeter zone boundary (matching user's reference image!)
    const pad = 450;
    ctx.save();
    ctx.strokeStyle = isLight ? 'rgba(37, 99, 235, 0.55)' : 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = Math.max(1, 1.8 / zoom);
    ctx.setLineDash([10 / zoom, 8 / zoom]);
    ctx.strokeRect(sx(rx1 - pad), sy(ry1 - pad), sx(rx2 + pad) - sx(rx1 - pad), sy(ry2 + pad) - sy(ry1 - pad));
    ctx.setLineDash([]);
    ctx.restore();

    // B. Structural steel rack background bay fill
    ctx.fillStyle = isLight ? 'rgba(241, 245, 249, 0.75)' : 'rgba(15, 23, 42, 0.65)';
    ctx.fillRect(screenX1, screenY1, screenW, screenH);

    // C. Heavy industrial steel upright columns and horizontal cross-dividers
    ctx.strokeStyle = isLight ? '#64748b' : '#38bdf8';
    ctx.lineWidth = Math.max(1.2, 2 / zoom);
    ctx.strokeRect(screenX1, screenY1, screenW, screenH);

    // Three storage bays with two horizontal pick levels.
    ctx.beginPath();
    ctx.moveTo(sx(rx1 + rackW / 3), screenY1);
    ctx.lineTo(sx(rx1 + rackW / 3), sy(ry2));
    ctx.moveTo(sx(rx1 + (rackW * 2) / 3), screenY1);
    ctx.lineTo(sx(rx1 + (rackW * 2) / 3), sy(ry2));
    ctx.stroke();

    // Horizontal shelf level beam divider (two box rows)
    const hy1 = ry1 + rackH / 2;
    ctx.beginPath();
    ctx.moveTo(screenX1, sy(hy1));
    ctx.lineTo(sx(rx2), sy(hy1));
    ctx.stroke();

    // D. Steel diagonal X-bracing truss lines across rack compartments
    ctx.strokeStyle = isLight ? 'rgba(148, 163, 184, 0.35)' : 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = Math.max(0.6, 1 / zoom);
    for (let r = 0; r < 2; r++) {
      const by1 = ry1 + (rackH * r) / 2;
      const by2 = ry1 + (rackH * (r + 1)) / 2;
      // Three box bays per level
      ctx.beginPath();
      for (let col = 0; col < 3; col++) {
        const bayX1 = rx1 + (rackW * col) / 3;
        const bayX2 = rx1 + (rackW * (col + 1)) / 3;
        ctx.moveTo(sx(bayX1), sy(by1));
        ctx.lineTo(sx(bayX2), sy(by2));
        ctx.moveTo(sx(bayX2), sy(by1));
        ctx.lineTo(sx(bayX1), sy(by2));
      }
      ctx.stroke();
    }

    // E. Heavy-duty yellow end-of-row impact crash guards / deflector bollards
    [
      { x: rx1 - pad, y: ry1 - pad },
      { x: rx2 + pad, y: ry1 - pad },
      { x: rx1 - pad, y: ry2 + pad },
      { x: rx2 + pad, y: ry2 + pad },
    ].forEach(pt => {
      drawBollard(ctx, sx(pt.x), sy(pt.y), 320 * scale, zoom, isLight);
    });

    // F. Technical CAD Rack Identification Tag & Category Badge
    ctx.save();
    ctx.fillStyle = isLight ? '#0f172a' : '#38bdf8';
    ctx.font = `bold ${Math.max(8.5, 10.5 / zoom)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    if (zoom >= 0.45) ctx.fillText(`${rack.name} · ${rack.category}`, sx(rack.cx), screenY1 - (8 / zoom));
    ctx.restore();
  });
}

/**
 * 5. Peripheral utility zones (Chemical drums, Pallet overflow, Forklift stall, Recycling trash)
 */
function drawUtilityZones(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  scale: number,
  isLight: boolean
) {
  // ── Zone A: clutter_a (5000, 12000) -> Blue Chemical Drum & Hazmat Staging ──────
  {
    const cx = -2500;
    const cy = 12000;
    const w = 4600;
    const h = 4200;
    const x1 = cx - w / 2;
    const y1 = cy - h / 2;

    // Yellow/black diagonal safety boundary
    ctx.strokeStyle = isLight ? '#d97706' : '#f59e0b';
    ctx.lineWidth = Math.max(1, 1.8 / zoom);
    ctx.strokeRect(sx(x1), sy(y1), sx(x1 + w) - sx(x1), sy(y1 + h) - sy(y1));
    drawHazardStripes(ctx, sx(x1), sy(y1 + h - 300), sx(w) - sx(0), sy(300) - sy(0), 8 / zoom);

    // Spill containment pallet base (wood/composite tint)
    ctx.fillStyle = isLight ? 'rgba(217, 119, 6, 0.12)' : 'rgba(245, 158, 11, 0.12)';
    ctx.fillRect(sx(x1 + 400), sy(y1 + 400), sx(w - 800) - sx(0), sy(h - 1100) - sy(0));

    // Blue 55-Gallon Chemical Drums (Exact match to blue barrels in user reference image!)
    const drumPositions = [
      { dx: -1000, dy: -800 },
      { dx: 0,     dy: -800 },
      { dx: 1000,  dy: -800 },
      { dx: -500,  dy: 400 },
      { dx: 500,   dy: 400 },
    ];

    drumPositions.forEach(dp => {
      const dX = sx(cx + dp.dx);
      const dY = sy(cy + dp.dy);
      const dR = 520 * scale;

      // Outer drum body (Steel blue)
      ctx.fillStyle = isLight ? '#2563eb' : '#0284c7';
      ctx.strokeStyle = isLight ? '#1e40af' : '#38bdf8';
      ctx.lineWidth = Math.max(0.8, 1.2 / zoom);
      ctx.beginPath();
      ctx.arc(dX, dY, dR, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Drum lid rim ring
      ctx.strokeStyle = isLight ? '#93c5fd' : '#7dd3fc';
      ctx.lineWidth = Math.max(0.5, 0.8 / zoom);
      ctx.beginPath();
      ctx.arc(dX, dY, dR * 0.75, 0, 2 * Math.PI);
      ctx.stroke();

      // Bung hole caps (small dots)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(dX - dR * 0.35, dY - dR * 0.2, Math.max(1, 1.5 / zoom), 0, 2 * Math.PI);
      ctx.arc(dX + dR * 0.35, dY + dR * 0.2, Math.max(0.8, 1.2 / zoom), 0, 2 * Math.PI);
      ctx.fill();
    });

    // Hazmat symbol & badge
    ctx.save();
    ctx.fillStyle = isLight ? '#b45309' : '#f59e0b';
    ctx.font = `bold ${Math.max(8, 10 / zoom)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    if (zoom >= 0.45) ctx.fillText('⚠ HAZMAT / CHEMICAL DRUMS', sx(cx), sy(y1 - 150));
    ctx.restore();
  }

  // ── Zone B: clutter_b (45000, 12000) -> Bulk Pallet Staging & Overflow ────────
  {
    const cx = 52500;
    const cy = 12000;
    const w = 4600;
    const h = 4200;
    const x1 = cx - w / 2;
    const y1 = cy - h / 2;

    // Floor demarcation box
    ctx.strokeStyle = isLight ? '#64748b' : '#38bdf8';
    ctx.lineWidth = Math.max(1, 1.5 / zoom);
    ctx.strokeRect(sx(x1), sy(y1), sx(x1 + w) - sx(x1), sy(y1 + h) - sy(y1));

    // Stacked wooden pallets (top-down view of slats and cardboard boxes)
    const pallets = [
      { x: cx - 1100, y: cy - 900, w: 1800, h: 1400 },
      { x: cx + 1100, y: cy - 900, w: 1800, h: 1400 },
      { x: cx - 1100, y: cy + 700, w: 1800, h: 1400 },
      { x: cx + 1100, y: cy + 700, w: 1800, h: 1400 },
    ];

    pallets.forEach(p => {
      // Wood pallet base
      ctx.fillStyle = isLight ? '#d97706' : '#92400e';
      ctx.fillRect(sx(p.x - p.w / 2), sy(p.y - p.h / 2), sx(p.w) - sx(0), sy(p.h) - sy(0));

      // Wood slats
      ctx.strokeStyle = isLight ? '#92400e' : '#451a03';
      ctx.lineWidth = Math.max(0.6, 1 / zoom);
      const slats = 4;
      for (let s = 1; s < slats; s++) {
        const syVal = p.y - p.h / 2 + (p.h * s) / slats;
        ctx.beginPath();
        ctx.moveTo(sx(p.x - p.w / 2), sy(syVal));
        ctx.lineTo(sx(p.x + p.w / 2), sy(syVal));
        ctx.stroke();
      }

      // Cardboard box stack on top (tan/kraft paper box)
      const bw = p.w * 0.75;
      const bh = p.h * 0.75;
      ctx.fillStyle = isLight ? '#fde68a' : '#b45309';
      ctx.strokeStyle = isLight ? '#d97706' : '#d97706';
      ctx.fillRect(sx(p.x - bw / 2), sy(p.y - bh / 2), sx(bw) - sx(0), sy(bh) - sy(0));
      ctx.strokeRect(sx(p.x - bw / 2), sy(p.y - bh / 2), sx(bw) - sx(0), sy(bh) - sy(0));
    });

    // Label
    ctx.save();
    ctx.fillStyle = isLight ? '#334155' : '#94a3b8';
    ctx.font = `bold ${Math.max(8, 10 / zoom)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    if (zoom >= 0.45) ctx.fillText('📦 BULK PALLET OVERFLOW', sx(cx), sy(y1 - 150));
    ctx.restore();
  }

  // ── Zone C: pallet_jack (5000, 20000) -> Forklift & Pallet Truck Parking Stall ─
  {
    const cx = -2500;
    const cy = 20000;
    const w = 4600;
    const h = 4200;
    const x1 = cx - w / 2;
    const y1 = cy - h / 2;

    // Yellow stall outline with 45° diagonal hatching
    ctx.strokeStyle = isLight ? '#ca8a04' : '#eab308';
    ctx.lineWidth = Math.max(1, 1.8 / zoom);
    ctx.strokeRect(sx(x1), sy(y1), sx(x1 + w) - sx(x1), sy(y1 + h) - sy(y1));

    drawDiagonalHatch(
      ctx,
      sx(x1),
      sy(y1),
      sx(x1 + w) - sx(x1),
      sy(y1 + h) - sy(y1),
      16 / zoom,
      isLight ? 'rgba(202, 138, 4, 0.2)' : 'rgba(234, 179, 8, 0.15)'
    );

    // Realistic Forklift Silhouette (Top-Down CAD View)
    // Counterweight body + Roll cage + Front Mast & 2 Tines
    const flW = 2000;
    const flH = 3000;
    const fx = cx - 400;
    const fy = cy - 200;

    // Forklift rear chassis & counterweight
    ctx.fillStyle = isLight ? '#0284c7' : '#0369a1';
    ctx.strokeStyle = isLight ? '#0f172a' : '#38bdf8';
    ctx.lineWidth = Math.max(0.8, 1.4 / zoom);
    ctx.fillRect(sx(fx - flW / 2), sy(fy - flH / 4), sx(flW) - sx(0), sy(flH / 2) - sy(0));
    ctx.strokeRect(sx(fx - flW / 2), sy(fy - flH / 4), sx(flW) - sx(0), sy(flH / 2) - sy(0));

    // Operator roll cage (ROPS overhead guard)
    ctx.fillStyle = isLight ? '#1e293b' : '#0f172a';
    ctx.fillRect(sx(fx - flW / 3), sy(fy - flH / 6), sx((flW * 2) / 3) - sx(0), sy(flH / 3) - sy(0));

    // Front mast carriage & fork tines extending forward
    ctx.fillStyle = '#64748b';
    const forkLen = 1400;
    const forkW = 220;
    ctx.fillRect(sx(fx - flW / 2 - forkLen), sy(fy - 500), sx(forkLen) - sx(0), sy(forkW) - sy(0));
    ctx.fillRect(sx(fx - flW / 2 - forkLen), sy(fy + 500 - forkW), sx(forkLen) - sx(0), sy(forkW) - sy(0));

    // Label
    ctx.save();
    ctx.fillStyle = isLight ? '#854d0e' : '#facc15';
    ctx.font = `bold ${Math.max(8, 10 / zoom)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    if (zoom >= 0.45) ctx.fillText('🚜 FORKLIFT & MHE STAGING', sx(cx), sy(y1 - 150));
    ctx.restore();
  }

  // ── Zone D: trash_cans (45000, 20000) -> Cardboard Recycling & Waste Station ───
  {
    const cx = 52500;
    const cy = 20000;
    const w = 4600;
    const h = 4200;
    const x1 = cx - w / 2;
    const y1 = cy - h / 2;

    // Concrete containment curb
    ctx.strokeStyle = isLight ? '#475569' : '#64748b';
    ctx.lineWidth = Math.max(1, 1.5 / zoom);
    ctx.strokeRect(sx(x1), sy(y1), sx(x1 + w) - sx(x1), sy(y1 + h) - sy(y1));

    // 3 Industrial roll-off dumpsters / recycling bins
    const bins = [
      { x: cx - 1100, y: cy, color: isLight ? '#15803d' : '#16a34a', label: 'CARDBOARD' },
      { x: cx,        y: cy, color: isLight ? '#0284c7' : '#0284c7', label: 'PLASTICS' },
      { x: cx + 1100, y: cy, color: isLight ? '#475569' : '#475569', label: 'REFUSE' },
    ];

    bins.forEach(b => {
      const bw = 1400;
      const bh = 2200;
      ctx.fillStyle = b.color;
      ctx.strokeStyle = isLight ? '#0f172a' : '#cbd5e1';
      ctx.lineWidth = Math.max(0.8, 1.2 / zoom);
      ctx.fillRect(sx(b.x - bw / 2), sy(b.y - bh / 2), sx(bw) - sx(0), sy(bh) - sy(0));
      ctx.strokeRect(sx(b.x - bw / 2), sy(b.y - bh / 2), sx(bw) - sx(0), sy(bh) - sy(0));

      // Bin lid hinge line
      ctx.beginPath();
      ctx.moveTo(sx(b.x - bw / 2), sy(b.y));
      ctx.lineTo(sx(b.x + bw / 2), sy(b.y));
      ctx.stroke();
    });

    // Label
    ctx.save();
    ctx.fillStyle = isLight ? '#166534' : '#4ade80';
    ctx.font = `bold ${Math.max(8, 10 / zoom)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    if (zoom >= 0.45) ctx.fillText('♻ RECYCLING & WASTE DISPOSAL', sx(cx), sy(y1 - 150));
    ctx.restore();
  }
}

/**
 * 6. Outbound dispatch workstations, roller conveyors, and secondary fleet depot
 */
function drawOutboundDispatchAndDesks(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  scale: number,
  isLight: boolean
) {
  // A. Packing Desk A (10000, 44000) & Packing Desk B (40000, 44000)
  [
    { id: 'dest_desk_a', cx: 10000, cy: 44000, label: 'PACKING WORKSTATION 01 (OUTBOUND)' },
    { id: 'dest_desk_b', cx: 40000, cy: 44000, label: 'PACKING WORKSTATION 02 (OUTBOUND)' },
  ].forEach(desk => {
    const tableW = 4600;
    const tableH = 1800;
    const tx = desk.cx - tableW / 2;
    const ty = desk.cy - tableH / 2;

    // Workstation boundary & floor demarcation
    ctx.strokeStyle = isLight ? '#2563eb' : '#38bdf8';
    ctx.lineWidth = Math.max(1, 1.5 / zoom);
    ctx.strokeRect(sx(tx), sy(ty), sx(tx + tableW) - sx(tx), sy(ty + tableH) - sy(ty));

    // Roller Conveyor Table (series of parallel rollers)
    ctx.fillStyle = isLight ? '#e2e8f0' : 'rgba(30, 41, 59, 0.7)';
    ctx.fillRect(sx(tx + 200), sy(ty + 200), sx(tableW - 400) - sx(0), sy(tableH - 400) - sy(0));

    ctx.strokeStyle = isLight ? '#94a3b8' : '#38bdf8';
    ctx.lineWidth = Math.max(0.6, 1 / zoom);
    const rollerCount = 10;
    for (let r = 0; r < rollerCount; r++) {
      const rx = tx + 400 + (r * (tableW - 800)) / rollerCount;
      ctx.beginPath();
      ctx.moveTo(sx(rx), sy(ty + 300));
      ctx.lineTo(sx(rx), sy(ty + tableH - 300));
      ctx.stroke();
    }

    // Workstation label
    ctx.save();
    ctx.fillStyle = isLight ? '#1e40af' : '#38bdf8';
    ctx.font = `bold ${Math.max(8.5, 10 / zoom)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    if (zoom >= 0.45) ctx.fillText(desk.label, sx(desk.cx), sy(ty - 150));
    ctx.restore();
  });

  // B. Secondary Robot Depot (depot_secondary at 25000, 44000)
  {
    const cx = 25000;
    const cy = 44000;
    const dw = 5000;
    const dh = 2400;
    const dx = cx - dw / 2;
    const dy = cy - dh / 2;

    ctx.fillStyle = isLight ? 'rgba(240, 253, 244, 0.7)' : 'rgba(6, 78, 59, 0.18)';
    ctx.strokeStyle = isLight ? '#16a34a' : '#10b981';
    ctx.lineWidth = Math.max(1, 1.8 / zoom);
    ctx.fillRect(sx(dx), sy(dy), sx(dw) - sx(0), sy(dh) - sy(0));
    ctx.strokeRect(sx(dx), sy(dy), sx(dw) - sx(0), sy(dh) - sy(0));

    // Dual induction coils
    [-1200, 1200].forEach(ox => {
      const padR = 800 * scale;
      ctx.strokeStyle = isLight ? '#ca8a04' : '#fbbf24';
      ctx.lineWidth = Math.max(0.8, 1.2 / zoom);
      ctx.beginPath();
      ctx.arc(sx(cx + ox), sy(cy), padR, 0, 2 * Math.PI);
      ctx.stroke();
    });

    // Secondary depot label
    ctx.save();
    ctx.fillStyle = isLight ? '#15803d' : '#34d399';
    ctx.font = `bold ${Math.max(8.5, 10.5 / zoom)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    if (zoom >= 0.45) ctx.fillText('⚡ SECONDARY FLEET RETURN DEPOT', sx(cx), sy(dy - 150));
    ctx.restore();
  }

  // C. Outbound Shipping Staging Lanes (at y = 46000)
  const outY = 46200;
  ctx.strokeStyle = isLight ? '#cbd5e1' : 'rgba(245, 158, 11, 0.35)';
  ctx.lineWidth = Math.max(0.8, 1.2 / zoom);
  ctx.setLineDash([8 / zoom, 8 / zoom]);
  [7000, 13000, 22000, 28000, 37000, 43000].forEach(lx => {
    ctx.beginPath();
    ctx.moveTo(sx(lx), sy(outY));
    ctx.lineTo(sx(lx), sy(WAREHOUSE_BOUNDS.yMax - 500));
    ctx.stroke();
  });
  ctx.setLineDash([]);
}

/**
 * 7. AMR highway lane markings, direction chevrons & crosswalks
 */
function drawHighwayMarkings(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  scale: number,
  isLight: boolean
) {
  // Main Cross-Aisles (Horizontal lines)
  const crossAisles = [
    { y: 1000, label: 'INBOUND INTAKE · TOP AISLE' },
    { y: 8000, label: 'FRONT CROSS-AISLE · TIER TRANSFER' },
    { y: 16000, label: 'MAIN LOGISTICS SPINE AISLE' },
    { y: 24000, label: 'BACK CROSS-AISLE · OUTBOUND STAGING' },
    { y: 32000, label: 'LOWER STORAGE CROSS-AISLE' },
    { y: 40000, label: 'OUTBOUND TRANSFER AISLE' },
  ];

  crossAisles.forEach(aisle => {
    // Two-way dashed lane centerline
    ctx.strokeStyle = isLight ? 'rgba(30, 41, 59, 0.2)' : 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = Math.max(0.8, 1.2 / zoom);
    ctx.setLineDash([12 / zoom, 12 / zoom]);
    ctx.beginPath();
    ctx.moveTo(sx(8000), sy(aisle.y));
    ctx.lineTo(sx(42000), sy(aisle.y));
    ctx.stroke();
    ctx.setLineDash([]);

    // Watermark aisle designation label (subtle floor stencil)
    ctx.save();
    ctx.fillStyle = isLight ? 'rgba(100, 116, 139, 0.22)' : 'rgba(56, 189, 248, 0.16)';
    ctx.font = `bold ${Math.max(8.5, 11 / zoom)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (zoom >= 0.45) ctx.fillText(`── ${aisle.label} ──`, sx(25000), sy(aisle.y + 1100));
    ctx.restore();
  });

  // Longitudinal Aisles (Vertical lanes along x = 10000, 20000, 30000, 40000)
  [10000, 20000, 30000, 40000].forEach(lx => {
    ctx.strokeStyle = isLight ? 'rgba(30, 41, 59, 0.18)' : 'rgba(56, 189, 248, 0.16)';
    ctx.lineWidth = Math.max(0.6, 1 / zoom);
    ctx.setLineDash([10 / zoom, 10 / zoom]);
    ctx.beginPath();
    ctx.moveTo(sx(lx), sy(1000));
    ctx.lineTo(sx(lx), sy(27000));
    ctx.stroke();
    ctx.setLineDash([]);

    // Painted floor directional navigation chevrons
    [6000, 14000, 22000].forEach(cy => {
      drawFloorChevron(ctx, sx(lx), sy(cy), 400 * scale, zoom, isLight);
    });
  });

  // Pedestrian safety zebra crosswalks connecting side aisles
  [
    { x: 7500, y: 16000, w: 1800, h: 2200 },
    { x: 42500, y: 16000, w: 1800, h: 2200 },
  ].forEach(cw => {
    drawZebraCrosswalk(ctx, sx(cw.x - cw.w / 2), sy(cw.y - cw.h / 2), sx(cw.w) - sx(0), sy(cw.h) - sy(0), 12 / zoom, isLight);
  });
}

/**
 * 8. Reinforced concrete perimeter walls & structural steel I-beam column grid
 */
function drawPerimeterWallsAndColumns(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  scale: number,
  isLight: boolean
) {
  const { xMin, xMax, yMin, yMax } = WAREHOUSE_BOUNDS;

  const screenX1 = sx(xMin);
  const screenY1 = sy(yMin);
  const screenX2 = sx(xMax);
  const screenY2 = sy(yMax);
  const sw = screenX2 - screenX1;
  const sh = screenY2 - screenY1;

  // Concrete foundation perimeter wall (thick double line with structural thickness)
  const wallThick = 400 * scale;

  ctx.strokeStyle = isLight ? '#1e293b' : '#38bdf8';
  ctx.lineWidth = Math.max(2, 3.5 / zoom);
  ctx.strokeRect(screenX1, screenY1, sw, sh);

  // Inner foundation setback line
  ctx.strokeStyle = isLight ? '#64748b' : 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = Math.max(1, 1.5 / zoom);
  ctx.strokeRect(screenX1 + wallThick, screenY1 + wallThick, sw - 2 * wallThick, sh - 2 * wallThick);

  // Structural Steel I-Beam Columns at column grid intersections
  GRID_COLS.forEach(col => {
    GRID_ROWS.forEach(row => {
      drawIBeamColumn(ctx, sx(col.x), sy(row.y), 650 * scale, zoom, isLight);
    });
  });

  // Alphanumeric Column Grid Line Bubbles (CAD drafting standard)
  ctx.save();
  ctx.font = `bold ${Math.max(9, 11 / zoom)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Columns A–E along top and bottom
  GRID_COLS.forEach(col => {
    const cx = sx(col.x);
    // Dashed grid line
    ctx.strokeStyle = isLight ? 'rgba(148, 163, 184, 0.3)' : 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = Math.max(0.6, 0.8 / zoom);
    ctx.setLineDash([4 / zoom, 4 / zoom]);
    ctx.beginPath();
    ctx.moveTo(cx, screenY1);
    ctx.lineTo(cx, screenY2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Grid bubble at top
    drawGridBubble(ctx, cx, screenY1 - (18 / zoom), col.label, zoom, isLight);
    // Grid bubble at bottom
    drawGridBubble(ctx, cx, screenY2 + (18 / zoom), col.label, zoom, isLight);
  });

  // Rows 1–7 along left and right
  GRID_ROWS.forEach(row => {
    const cy = sy(row.y);
    // Dashed grid line
    ctx.strokeStyle = isLight ? 'rgba(148, 163, 184, 0.3)' : 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = Math.max(0.6, 0.8 / zoom);
    ctx.setLineDash([4 / zoom, 4 / zoom]);
    ctx.beginPath();
    ctx.moveTo(screenX1, cy);
    ctx.lineTo(screenX2, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Grid bubble at left
    drawGridBubble(ctx, screenX1 - (18 / zoom), cy, row.label, zoom, isLight);
    // Grid bubble at right
    drawGridBubble(ctx, screenX2 + (18 / zoom), cy, row.label, zoom, isLight);
  });
  ctx.restore();
}

/**
 * 9. Engineering Title Block, Metric Scale Bar, and True North Compass Rose
 */
function drawEngineeringTitleBlock(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  scale: number,
  isLight: boolean
) {
  const { xMin, xMax, yMin, yMax } = WAREHOUSE_BOUNDS;

  // Title Block in Top-Left Corner (cleanly inside building, completely clear of docks and nodes)
  const blockW = 4600;
  const blockH = 2600;
  const bx = xMin + 400;
  const by = yMin + 300;

  const screenBX = sx(bx);
  const screenBY = sy(by);
  const screenBW = sx(bx + blockW) - screenBX;
  const screenBH = sy(by + blockH) - screenBY;

  // Solid background with technical double border
  ctx.fillStyle = isLight ? '#ffffff' : '#070f24';
  ctx.fillRect(screenBX, screenBY, screenBW, screenBH);

  ctx.strokeStyle = isLight ? '#1e293b' : '#38bdf8';
  ctx.lineWidth = Math.max(1.2, 2 / zoom);
  ctx.strokeRect(screenBX, screenBY, screenBW, screenBH);

  // Inner border
  const innerPad = 4 / zoom;
  ctx.strokeRect(screenBX + innerPad, screenBY + innerPad, screenBW - 2 * innerPad, screenBH - 2 * innerPad);

  // Title Block Content
  ctx.save();
  const tx = screenBX + 10 / zoom;
  let ty = screenBY + 10 / zoom;

  ctx.fillStyle = isLight ? '#0f172a' : '#38bdf8';
  ctx.font = `bold ${Math.max(9, 11 / zoom)}px monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  if (zoom >= 0.45) ctx.fillText('AWS FULFILLMENT CENTER', tx, ty);

  ty += 14 / zoom;
  ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
  ctx.font = `bold ${Math.max(7.5, 9 / zoom)}px monospace`;
  if (zoom >= 0.45) ctx.fillText('FACILITY: BFI4 · LEVEL 1', tx, ty);

  ty += 12 / zoom;
  if (zoom >= 0.45) ctx.fillText('AMR SWARM LOGISTICS GRID', tx, ty);

  ty += 12 / zoom;
  ctx.fillStyle = isLight ? '#2563eb' : '#0284c7';
  if (zoom >= 0.45) ctx.fillText('SCALE 1:100 · REV 4.2', tx, ty);
  ctx.restore();

  // Metric Architectural Scale Bar (0m - 10m - 20m) in Bottom-Left Corner
  const scaleX = xMin + 1200;
  const scaleY = yMax - 1200;
  drawMetricScaleBar(ctx, sx, sy, scaleX, scaleY, zoom, scale, isLight);

  // True North Compass Indicator in Top-Right Corner
  const compassX = xMax - 2200;
  const compassY = yMin + 2200;
  drawNorthCompass(ctx, sx(compassX), sy(compassY), 900 * scale, zoom, isLight);
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Drawing Primitives & CAD Glyphs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Structural I-beam profile (H-beam) in CAD blueprint
 */
function drawIBeamColumn(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  zoom: number,
  isLight: boolean
) {
  const hw = size / 2;
  const flangeT = size * 0.22;
  const webT = size * 0.2;

  ctx.save();
  ctx.fillStyle = isLight ? '#334155' : '#38bdf8';
  ctx.strokeStyle = isLight ? '#0f172a' : '#0284c7';
  ctx.lineWidth = Math.max(0.6, 1 / zoom);

  ctx.beginPath();
  // Top flange
  ctx.rect(cx - hw, cy - hw, size, flangeT);
  // Bottom flange
  ctx.rect(cx - hw, cy + hw - flangeT, size, flangeT);
  // Central web
  ctx.rect(cx - webT / 2, cy - hw + flangeT, webT, size - 2 * flangeT);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Safety steel bollard (yellow circle with center dot)
 */
function drawBollard(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  zoom: number,
  isLight: boolean
) {
  ctx.save();
  ctx.fillStyle = isLight ? '#eab308' : '#f59e0b';
  ctx.strokeStyle = isLight ? '#713f12' : '#78350f';
  ctx.lineWidth = Math.max(0.6, 1 / zoom);

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // Center anchor pin
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(1, r * 0.25), 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}

/**
 * 45° safety hazard stripes (yellow & black industrial warning pattern)
 */
function drawHazardStripes(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  spacing: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = spacing * 0.55;

  for (let i = -h; i < w + h; i += spacing) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i - h, y + h);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Diagonal hatch pattern (e.g. for steel floor grating, dock levelers)
 */
function drawDiagonalHatch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  spacing: number,
  strokeColor: string
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 0.8;

  for (let i = -h; i < w + h; i += spacing) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i - h, y + h);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Painted floor directional navigation chevron (▲)
 */
function drawFloorChevron(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  zoom: number,
  isLight: boolean
) {
  ctx.save();
  ctx.strokeStyle = isLight ? 'rgba(30, 41, 59, 0.35)' : 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = Math.max(0.8, 1.4 / zoom);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const hs = size / 2;
  ctx.beginPath();
  ctx.moveTo(cx - hs, cy + hs);
  ctx.lineTo(cx, cy - hs);
  ctx.lineTo(cx + hs, cy + hs);
  ctx.stroke();
  ctx.restore();
}

/**
 * Pedestrian zebra crosswalk stripes
 */
function drawZebraCrosswalk(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  stripeW: number,
  isLight: boolean
) {
  ctx.save();
  ctx.fillStyle = isLight ? 'rgba(100, 116, 139, 0.4)' : 'rgba(255, 255, 255, 0.35)';
  for (let cy = y; cy < y + h; cy += stripeW * 2) {
    ctx.fillRect(x, cy, w, stripeW);
  }
  ctx.restore();
}

/**
 * CAD Column grid circle bubble with alphanumeric identifier
 */
function drawGridBubble(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  label: string,
  zoom: number,
  isLight: boolean
) {
  // Grid references are useful in close-up drafting views, but become a
  // distracting ring of circles around the whole facility at overview zoom.
  if (zoom < 0.45) return;

  const r = 9 / zoom;
  ctx.save();
  ctx.fillStyle = isLight ? '#ffffff' : '#070f24';
  ctx.strokeStyle = isLight ? '#475569' : '#38bdf8';
  ctx.lineWidth = Math.max(0.8, 1.2 / zoom);

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isLight ? '#0f172a' : '#38bdf8';
  ctx.font = `bold ${Math.max(8, 9.5 / zoom)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (zoom >= 0.45) ctx.fillText(label, cx, cy);
  ctx.restore();
}

/**
 * Metric architectural scale bar (0m - 10m - 20m)
 */
function drawMetricScaleBar(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  worldX: number,
  worldY: number,
  zoom: number,
  scale: number,
  isLight: boolean
) {
  // 10 meters in world units = 10,000 units
  // The warehouse is stretched 1.25x horizontally; keep the drawn scale bar true to 10 m.
  const len10m = 8000;
  const barH = 350 * scale;

  const x0 = sx(worldX);
  const x10 = sx(worldX + len10m);
  const x20 = sx(worldX + len10m * 2);
  const y0 = sy(worldY);

  ctx.save();
  // Segment 1 (0 to 10m) - Filled
  ctx.fillStyle = isLight ? '#1e293b' : '#38bdf8';
  ctx.fillRect(x0, y0, x10 - x0, barH);

  // Segment 2 (10m to 20m) - Outline
  ctx.strokeStyle = isLight ? '#1e293b' : '#38bdf8';
  ctx.lineWidth = Math.max(1, 1.5 / zoom);
  ctx.strokeRect(x10, y0, x20 - x10, barH);

  // Labels
  ctx.fillStyle = isLight ? '#0f172a' : '#94a3b8';
  ctx.font = `bold ${Math.max(8, 10 / zoom)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  if (zoom >= 0.45) ctx.fillText('0m', x0, y0 - (4 / zoom));
  if (zoom >= 0.45) ctx.fillText('10m', x10, y0 - (4 / zoom));
  if (zoom >= 0.45) ctx.fillText('20m', x20, y0 - (4 / zoom));

  ctx.textAlign = 'left';
  if (zoom >= 0.45) ctx.fillText('SCALE 1:100 METRIC', x0, y0 + barH + (12 / zoom));
  ctx.restore();
}

/**
 * True North architectural orientation compass rose
 */
function drawNorthCompass(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  zoom: number,
  isLight: boolean
) {
  ctx.save();
  ctx.strokeStyle = isLight ? '#334155' : '#38bdf8';
  ctx.lineWidth = Math.max(0.8, 1.2 / zoom);

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.stroke();

  // North needle arrow
  ctx.fillStyle = isLight ? '#dc2626' : '#ef4444';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.9);
  ctx.lineTo(cx - r * 0.35, cy);
  ctx.lineTo(cx, cy - r * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = isLight ? '#1e293b' : '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.9);
  ctx.lineTo(cx + r * 0.35, cy);
  ctx.lineTo(cx, cy - r * 0.2);
  ctx.closePath();
  ctx.fill();

  // 'N' label
  ctx.fillStyle = isLight ? '#dc2626' : '#ef4444';
  ctx.font = `bold ${Math.max(9, 12 / zoom)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  if (zoom >= 0.45) ctx.fillText('N', cx, cy - r - (3 / zoom));
  ctx.restore();
}

