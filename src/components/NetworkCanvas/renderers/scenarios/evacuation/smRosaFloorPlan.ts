import { GraphNode } from '../../../../../types';

let currentWorkspaceView: 'physical' | 'logical' | undefined = undefined;

const C = {
  outdoor: 'rgba(6, 10, 22, 0.97)',
  storeFill: 'rgba(14, 24, 52, 0.90)',
  corridor: 'rgba(8, 14, 34, 0.92)',
  partitionH: 'rgba(80, 108, 168, 0.92)',
  escalator: '#c8a228',
  escDark: '#7a5e10',
  exitMark: '#e05818',
  cinema: '#1d4ed8',
  supermarket: '#0f766e',
  deptStore: '#7e22ce',
  cyberzone: '#4338ca',
  food: '#9a3412',
};

function fillRectCenter(ctx: CanvasRenderingContext2D, sx: (x: number) => number, sy: (y: number) => number, cx: number, cy: number, w: number, h: number, fill: string, isLight = false) {
  ctx.fillStyle = fill;
  const x1 = sx(cx - w / 2);
  const y1 = sy(cy - h / 2);
  const x2 = sx(cx + w / 2);
  const y2 = sy(cy + h / 2);
  ctx.fillRect(x1, y1, x2 - x1, y2 - y1);

  // Draw stroke for individual room feel
  ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
}

function label(ctx: CanvasRenderingContext2D, sx: (x: number) => number, sy: (y: number) => number, _zoom: number, text: string, cx: number, cy: number, color = 'rgba(255,255,255,0.92)', sizePx = 16) {
  if (currentWorkspaceView === 'logical') return;
  ctx.save();
  const lines = text.split('\n');
  
  ctx.font = `bold ${sizePx}px Arial, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  
  const lineH = sizePx * 1.2;
  lines.forEach((ln, i) => {
    ctx.fillText(ln, sx(cx), sy(cy) + (i - (lines.length - 1) / 2) * lineH);
  });
  ctx.restore();
}

function drawRoom(ctx: CanvasRenderingContext2D, sx: (x: number) => number, sy: (y: number) => number, zoom: number, cx: number, cy: number, w: number, h: number, fill: string, text: string, fontSize = 14, isLight = false) {
  fillRectCenter(ctx, sx, sy, cx, cy, w, h, fill, isLight);
  if (text) {
    label(ctx, sx, sy, zoom, text, cx, cy, isLight ? '#0f172a' : '#ffffff', fontSize);
  }
}

export function drawSMRosaFloorPlan(
  ctx: CanvasRenderingContext2D,
  sx: (x: number) => number,
  sy: (y: number) => number,
  zoom: number,
  visibleNodes: GraphNode[],
  workspaceView?: 'physical' | 'logical',
  theme?: 'dark' | 'light'
) {
  currentWorkspaceView = workspaceView;
  const isLight = theme === 'light';
  const isL2 = visibleNodes.some(n => n.buildingId === 'L2');

  const defaultStoreFill = isLight ? '#f1f5f9' : C.storeFill;

  // Helper to dynamically draw a room centered perfectly on the actual node's coordinates
  const getNode = (id: string) => visibleNodes.find(n => n.id === id);
  const drawNodeRoom = (id: string, w: number, h: number, fill: string, labelText: string, fontSize?: number) => {
    const node = getNode(id);
    if (node) {
      const finalFill = (fill === C.storeFill && isLight) ? defaultStoreFill : fill;
      drawRoom(ctx, sx, sy, zoom, node.x, node.y, w, h, finalFill, labelText, fontSize, isLight);
    }
  };

  // Base building outline
  ctx.fillStyle = isLight ? '#e2e8f0' : 'rgba(30, 35, 50, 0.6)';
  ctx.beginPath();
  const bx1 = sx(10000), by1 = sy(10000), bw = sx(190000) - sx(10000), bh = sy(130000) - sy(10000);
  if (ctx.roundRect) {
    ctx.roundRect(bx1, by1, bw, bh, 20);
  } else {
    ctx.rect(bx1, by1, bw, bh);
  }
  ctx.fill();
  if (isLight) {
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw Corridors (as walkways centered around nodes)
  const drawWalkway = (x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = isLight ? '#ffffff' : C.corridor;
    ctx.fillRect(sx(x), sy(y), sx(x + w) - sx(x), sy(y + h) - sy(y));
    if (isLight) {
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx(x), sy(y), sx(x + w) - sx(x), sy(y + h) - sy(y));
    }
  };

  // Adjusted massive corridors (width 12000, height 12000)
  drawWalkway(54000, 20000, 12000, 80000); // West Corridor (Centered on 60k)
  drawWalkway(134000, 20000, 12000, 80000); // East Corridor (Centered on 140k)
  drawWalkway(54000, 24000, 98000, 12000); // North Corridor (Centered on 30k)
  drawWalkway(10000, 84000, 180000, 12000); // South Corridor (Centered on 90k)

  if (!isL2) {
    // GROUND FLOOR STORES
    drawNodeRoom("gl_supermarket", 26000, 26000, C.supermarket, "SM SUPERMARKET", 24);
    drawNodeRoom("gl_tgif", 12000, 12000, C.storeFill, "TGI Fridays", 16);
    drawNodeRoom("gl_sumo", 12000, 12000, C.storeFill, "Sumo Niku", 16);

    drawNodeRoom("gl_kultura", 16000, 16000, C.storeFill, "KULTURA", 22);
    drawNodeRoom("gl_watsons", 16000, 16000, C.storeFill, "WATSONS", 22);

    drawNodeRoom("gl_smstore", 30000, 24000, C.deptStore, "THE SM STORE\n(Ground Floor)", 24);
    drawNodeRoom("gl_ace", 12000, 9000, C.storeFill, "ACE HARDWARE", 16);
    drawNodeRoom("gl_uniqlo", 12000, 12000, C.storeFill, "Uniqlo", 16);
    drawNodeRoom("gl_ourhome", 10000, 12000, C.storeFill, "Our Home", 16);

    // South Strip
    drawNodeRoom("gl_giligans", 14000, 14000, C.storeFill, "Giligans", 16);
    drawNodeRoom("gl_maxs", 14000, 14000, C.storeFill, "Max's", 16);
    drawNodeRoom("gl_pizzahut", 14000, 14000, C.storeFill, "Pizza Hut", 16);
    drawNodeRoom("gl_jollibee", 14000, 14000, C.storeFill, "Jollibee", 16);
    drawNodeRoom("gl_kfc", 14000, 14000, C.storeFill, "KFC", 16);
    drawNodeRoom("gl_manginasal", 14000, 14000, C.storeFill, "Mang Inasal", 16);
    drawNodeRoom("gl_nbs", 14000, 14000, C.storeFill, "National\nBookstore", 16);

    // Above South Corridor
    drawNodeRoom("gl_burgerking", 12000, 12000, C.storeFill, "Burger King", 14);
    drawNodeRoom("gl_starbucks", 10000, 9000, C.storeFill, "Starbucks", 14);

  } else {
    // SECOND FLOOR STORES
    drawNodeRoom("l2_cinema1", 16000, 16000, C.cinema, "SM Cinema 1", 20);
    drawNodeRoom("l2_cinema2", 16000, 16000, C.cinema, "SM Cinema 2", 20);
    drawNodeRoom("l2_cinema3", 16000, 16000, C.cinema, "SM Cinema 3", 20);
    drawNodeRoom("l2_cinema4", 16000, 16000, C.cinema, "SM Cinema 4", 20);

    drawNodeRoom("l2_dental", 16000, 16000, C.storeFill, "DENTAL CLINIC", 18);
    drawNodeRoom("l2_vikings", 16000, 16000, C.storeFill, "VIKINGS", 18);

    drawNodeRoom("l2_smstore", 30000, 24000, C.deptStore, "THE SM STORE\n(Second Floor)", 24);
    drawNodeRoom("l2_cyberzone", 30000, 20000, C.cyberzone, "CYBERZONE", 24);
    drawNodeRoom("l2_powermac", 12000, 12000, C.storeFill, "Power Mac", 14);
    drawNodeRoom("l2_octagon", 12000, 12000, C.storeFill, "Octagon", 14);

    drawNodeRoom("l2_cabalen", 16000, 16000, C.storeFill, "Cabalen", 18);
    drawNodeRoom("l2_bingo", 16000, 16000, C.storeFill, "Market Bingo", 18);
    drawNodeRoom("l2_watsons", 16000, 16000, C.storeFill, "Watsons L2", 18);
  }

  // Draw Atrium void (Centered around 100000, 60000)
  if (isL2) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(sx(70000), sy(40000), sx(130000) - sx(70000), sy(80000) - sy(40000), 20);
    } else {
      ctx.rect(sx(70000), sy(40000), sx(130000) - sx(70000), sy(80000) - sy(40000));
    }
    ctx.fill();
    label(ctx, sx, sy, zoom, "GRAND ATRIUM\n(Open to Below)", 100000, 60000, 'rgba(255,255,255,0.3)');
  }
}
