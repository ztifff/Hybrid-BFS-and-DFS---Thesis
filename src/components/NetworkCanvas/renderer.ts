import { GraphNode, GraphEdge, ScenarioType, AlgorithmStep } from '../../types';
import { NODE_CONFIG, EDGE_CONFIG } from './types';
import { ALGORITHMS } from '../../config/scenarios';

export interface RenderOptions {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  pan: { x: number; y: number };
  scale: number;
  offsetX: number;
  offsetY: number;
  scenario: ScenarioType;
  mapId?: string;
  isDatacenter: boolean;
  isMassive: boolean;
  visibleNodes: GraphNode[];
  visibleEdges: GraphEdge[];
  visibleNodeMap: Map<string, GraphNode>;
  activeBlocked: Set<string>;
  wasHistoricallyBlocked: Set<string>;
  highlightedNodeId?: string | null;
  sourceId: string;
  sourceIds?: string[];
  destinationIds: string[];
  visibleAlgos: { bfs: boolean; dfs: boolean; hybrid: boolean };
  sets: {
    bfs: { explored: Set<string>; path: Set<string>; current: string | null };
    dfs: { explored: Set<string>; path: Set<string>; current: string | null };
    hyb: { explored: Set<string>; path: Set<string>; current: string | null };
  };
  activeSteps: { bfs: AlgorithmStep | null; dfs: AlgorithmStep | null; hybrid: AlgorithmStep | null };
  graph?: import('../../types').ScenarioGraph;
  shelfBoxCounts?: Map<string, number>; // nodeId → remaining box count (0–6) for AWS Warehouse
  robotAssignments?: import('../../types').RobotAssignment[]; // per-robot rack allocation
  followAlgo?: 'bfs' | 'dfs' | 'hybrid' | null;
}

export function renderCanvas(options: RenderOptions) {
  const {
    ctx, canvasWidth, canvasHeight, zoom, pan, scale, offsetX, offsetY,
    scenario, mapId, isDatacenter, isMassive,
    visibleNodes, visibleEdges, visibleNodeMap,
    activeBlocked, wasHistoricallyBlocked, highlightedNodeId,
    sourceId, sourceIds, destinationIds, visibleAlgos, sets, activeSteps, followAlgo,
    robotAssignments
  } = options;

  const visibleCount = [visibleAlgos.bfs, visibleAlgos.dfs, visibleAlgos.hybrid].filter(Boolean).length;
  const isSimultaneousMode = visibleCount > 1;

  // Determine active step based on active follow selection or single active tab
  const currentActiveStep = (followAlgo === 'dfs' && activeSteps.dfs) ? activeSteps.dfs
    : (followAlgo === 'hybrid' && activeSteps.hybrid) ? activeSteps.hybrid
    : (followAlgo === 'bfs' && activeSteps.bfs) ? activeSteps.bfs
    : (visibleAlgos.hybrid && !visibleAlgos.bfs && !visibleAlgos.dfs) ? activeSteps.hybrid
    : (visibleAlgos.dfs && !visibleAlgos.bfs && !visibleAlgos.hybrid) ? activeSteps.dfs
    : (visibleAlgos.bfs && !visibleAlgos.dfs && !visibleAlgos.hybrid) ? activeSteps.bfs
    : (activeSteps.hybrid || activeSteps.bfs || activeSteps.dfs);

  const getCombinedDelivered = (nodeId: string): number => {
    let max = 0;
    if (visibleAlgos.bfs && activeSteps.bfs?.deliveredBoxCounts?.[nodeId]) max = Math.max(max, activeSteps.bfs.deliveredBoxCounts[nodeId]);
    if (visibleAlgos.dfs && activeSteps.dfs?.deliveredBoxCounts?.[nodeId]) max = Math.max(max, activeSteps.dfs.deliveredBoxCounts[nodeId]);
    if (visibleAlgos.hybrid && activeSteps.hybrid?.deliveredBoxCounts?.[nodeId]) max = Math.max(max, activeSteps.hybrid.deliveredBoxCounts[nodeId]);
    return max;
  };

  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  
  ctx.scale(dpr, dpr);
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);

  const getRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const sx = (x: number) => (x * scale) + offsetX;
  const sy = (y: number) => (y * scale) + offsetY;

  const baseOpacity = isDatacenter ? 0.2 : (isMassive ? 0.15 : 0.35);
  ctx.lineCap = 'round';

  const cBFS = ALGORITHMS.find(a => a.id === 'bfs')?.color || '#4ade80';
  const cDFS = ALGORITHMS.find(a => a.id === 'dfs')?.color || '#c084fc';
  const cHYB = ALGORITHMS.find(a => a.id === 'hybrid')?.color || '#fb923c';

  // --- Backgrounds ---
  if (scenario === 'gameai') {
    const boardNodes = visibleNodes.filter(node => typeof node.metadata?.board === 'string' && node.metadata.board !== 'arena');
    const boards = Array.from(new Set(boardNodes.map(node => node.metadata?.board as string)));

    boards.forEach(board => {
      const group = boardNodes.filter(node => node.metadata?.board === board);
      if (group.length === 0) return;

      const xs = group.map(node => sx(node.x));
      const ys = group.map(node => sy(node.y));
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const uniqueX = Array.from(new Set(xs.map(value => Math.round(value)))).sort((a, b) => a - b);
      const uniqueY = Array.from(new Set(ys.map(value => Math.round(value)))).sort((a, b) => a - b);
      const dx = uniqueX.length > 1 ? uniqueX[1] - uniqueX[0] : 38;
      const dy = uniqueY.length > 1 ? uniqueY[1] - uniqueY[0] : 38;
      const tileSize = Math.min(dx, dy) * 0.92;

      ctx.save();
      ctx.globalAlpha = 0.78;

      if (board === 'checkers') {
        const stepX = uniqueX.length > 1 ? uniqueX[1] - uniqueX[0] : tileSize;
        const stepY = uniqueY.length > 1 ? uniqueY[1] - uniqueY[0] : tileSize;
        const startX = minX - tileSize / 2;
        const startY = minY - tileSize / 2;

        const boardSize = Math.max(uniqueX.length, uniqueY.length, 1);

        for (let row = 0; row < boardSize; row++) {
          for (let col = 0; col < boardSize; col++) {
            ctx.fillStyle = (row + col) % 2 === 0 ? '#111827' : '#991b1b';
            ctx.fillRect(startX + col * stepX, startY + row * stepY, tileSize, tileSize);
          }
        }
      } else {
        group.forEach(node => {
          const row = Number(node.metadata?.row ?? 0);
          const col = Number(node.metadata?.col ?? 0);
          const cx = sx(node.x);
          const cy = sy(node.y);

          if (board === 'dama') {
            ctx.fillStyle = (row + col) % 2 === 0 ? '#d4a96a' : '#6b3a1f';
          } else {
            const palette = ['#14532d', '#0f766e', '#1d4ed8', '#7c2d12'];
            ctx.fillStyle = palette[(row + col) % palette.length];
          }

          ctx.fillRect(cx - tileSize / 2, cy - tileSize / 2, tileSize, tileSize);
        });
      }
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = board === 'checkers' ? '#f87171' : board === 'dama' ? '#d4a96a' : '#fde68a';
      ctx.lineWidth = 1.5 / zoom;
      ctx.strokeRect(
        minX - tileSize / 2,
        minY - tileSize / 2,
        (maxX - minX) + tileSize,
        (maxY - minY) + tileSize
      );

      ctx.font = `bold ${14 / zoom}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3 / zoom;
      ctx.strokeStyle = '#0a0f1e';
      ctx.fillStyle = '#f8fafc';
      const boardTitle = board === 'snakes' ? 'Snakes & Ladders' : board[0].toUpperCase() + board.slice(1);
      const titleX = minX + ((maxX - minX) / 2);
      const titleY = minY - (tileSize * 0.9);
      ctx.strokeText(boardTitle, titleX, titleY);
      ctx.fillText(boardTitle, titleX, titleY);
      ctx.restore();
    });
  }

  // --- Cisco Packet Tracer Floor Overlays ---
  if (scenario === 'network' && mapId === 'companybusiness') {
    ctx.save();
    const layers = [
      { label: 'Core Layer', color: '#db2777', cx: 1300, cy: 220, rx: 450, ry: 70 },
      { label: 'Distribution Layer', color: '#06b6d4', cx: 1300, cy: 400, rx: 750, ry: 110 }
    ];

    layers.forEach(layer => {
      ctx.fillStyle = getRgba(layer.color, 0.15);
      ctx.strokeStyle = getRgba(layer.color, 0.4);
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.ellipse(sx(layer.cx), sy(layer.cy), layer.rx * scale, layer.ry * scale, 0, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      const boxWidth = 140;
      const boxHeight = 30;
      const labelX = sx(layer.cx + layer.rx) - boxWidth; 
      const labelY = sy(layer.cy);

      ctx.fillStyle = '#991b1b'; 
      ctx.fillRect(labelX, labelY - boxHeight / 2, boxWidth, boxHeight);
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(labelX, labelY - boxHeight / 2, boxWidth, boxHeight);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 14px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(layer.label, labelX + boxWidth / 2, labelY);
    });
    ctx.restore();

    const floors = [
      { label: 'FIRST FLOOR (Sales & HR)', color: '#0f766e', rect: [100, 550, 800, 450] as const }, 
      { label: 'SECOND FLOOR (Finance & Admin)', color: '#1d4ed8', rect: [950, 550, 800, 450] as const }, 
      { label: 'THIRD FLOOR (ICT & Server Room)', color: '#7e22ce', rect: [1800, 550, 700, 450] as const }, 
    ];

    ctx.save();
    floors.forEach(floor => {
      const [x, y, w, h] = floor.rect;
      ctx.fillStyle = getRgba(floor.color, 0.15);
      ctx.strokeStyle = getRgba(floor.color, 0.4);
      ctx.lineWidth = 2; 
      
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(sx(x), sy(y), w * scale, h * scale, 16);
      } else {
        ctx.rect(sx(x), sy(y), w * scale, h * scale);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = getRgba(floor.color, 0.9);
      ctx.font = `bold 16px monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(floor.label, sx(x + 20), sy(y + 20));
    });
    ctx.restore();
  }

  if (scenario === 'network' && mapId === 'campus') {
    ctx.save();
    const serverCenter = { label: 'Server Center', color: '#3b82f6', cx: 1300, cy: 300, rx: 280, ry: 150 };

    ctx.fillStyle = getRgba(serverCenter.color, 0.15);
    ctx.strokeStyle = getRgba(serverCenter.color, 0.4);
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.ellipse(sx(serverCenter.cx), sy(serverCenter.cy), serverCenter.rx * scale, serverCenter.ry * scale, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    const boxWidth = 140;
    const boxHeight = 30;
    const labelX = sx(serverCenter.cx) - boxWidth / 2; 
    const labelY = sy(serverCenter.cy - serverCenter.ry);

    ctx.fillStyle = '#1e3a8a'; 
    ctx.fillRect(labelX, labelY - boxHeight / 2, boxWidth, boxHeight);
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(labelX, labelY - boxHeight / 2, boxWidth, boxHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 14px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(serverCenter.label, labelX + boxWidth / 2, labelY);
    ctx.restore();

    const blocks = [
      { label: 'BOYS BLOCK', color: '#ea580c', rect: [250, 100, 550, 350] as const }, 
      { label: 'GIRLS BLOCK', color: '#ea580c', rect: [250, 750, 550, 350] as const }, 
      { label: 'AB1', color: '#ea580c', rect: [1600, 100, 550, 350] as const }, 
      { label: 'AB2', color: '#ea580c', rect: [2250, 100, 550, 350] as const }, 
      { label: 'IT CONSULTING', color: '#eab308', rect: [1450, 750, 400, 350] as const }, 
      { label: 'LIBRARY', color: '#eab308', rect: [1900, 750, 400, 350] as const }, 
      { label: 'DOME AREA', color: '#eab308', rect: [2350, 750, 500, 350] as const }, 
    ];

    ctx.save();
    blocks.forEach(block => {
      const [x, y, w, h] = block.rect;
      ctx.fillStyle = getRgba(block.color, 0.15);
      ctx.strokeStyle = getRgba(block.color, 0.4);
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(sx(x), sy(y), w * scale, h * scale, 16);
      } else {
        ctx.rect(sx(x), sy(y), w * scale, h * scale);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = getRgba(block.color, 0.9);
      ctx.font = `bold 16px monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(block.label, sx(x + 20), sy(y + 20));
    });
    ctx.restore();
  }

  // --- Architectural Walls (Clinic & AWS Warehouse) ---
  if (scenario === 'robotics' && (mapId === 'clinic' || mapId === 'aws' || mapId === 'awsWarehouse') && options.graph?.walls) {
    ctx.save();
    ctx.strokeStyle = '#334155'; // Slate 700 for blueprint lines
    ctx.lineWidth = 4 / zoom;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Determine active floor (or default for single level maps like AWS)
    const activeFloor = visibleNodes.length > 0 ? (visibleNodes[0].buildingId || 'L1') : 'L1';
    
    options.graph.walls.forEach(wall => {
      if (!wall.level || wall.level === activeFloor || wall.level === 'warehouse' || wall.level === 'all') {
        ctx.beginPath();
        ctx.moveTo(sx(wall.x1), sy(wall.y1));
        ctx.lineTo(sx(wall.x2), sy(wall.y2));
        ctx.stroke();
      }
    });
    ctx.restore();
  }

  // --- AWS Warehouse Shelf & Packing Desk Box Visualization ---
  if (scenario === 'robotics' && (mapId === 'aws' || mapId === 'awsWarehouse') && options.shelfBoxCounts) {
    ctx.save();
    // Only the 8 main storage shelf nodes in the middle aisles have 6-box racks
    const AWS_SHELF_NODES = new Set([
      'shelf_a1','shelf_a2','shelf_b1','shelf_b2','shelf_d1','shelf_d2','shelf_e1','shelf_e2','shelf_e3','shelf_e4','shelf_f1','shelf_f2'
    ]);
    const PACKING_DESK_NODES = new Set(['dest_desk_a', 'dest_desk_b', 'clutter_a', 'clutter_b', 'pallet_jack', 'trash_cans']);

    const cellW_world = 2500;
    const cellH_world = 1666.67;

    visibleNodes.forEach(node => {
      // 1. Storage Shelves (Middle Aisles)
      if (AWS_SHELF_NODES.has(node.id)) {
        const bfsPicked = activeSteps.bfs?.pickedUpBoxCounts?.[node.id] ?? 0;
        const dfsPicked = activeSteps.dfs?.pickedUpBoxCounts?.[node.id] ?? 0;
        const hybPicked = activeSteps.hybrid?.pickedUpBoxCounts?.[node.id] ?? 0;

        let boxIndex = 0;
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 2; col++) {
            boxIndex++;
            const worldX1 = node.x - 2500 + col * cellW_world;
            const worldX2 = node.x - 2500 + (col + 1) * cellW_world;
            const worldY1 = node.y - 2500 + row * cellH_world;
            const worldY2 = node.y - 2500 + (row + 1) * cellH_world;

            const screenX1 = sx(worldX1);
            const screenX2 = sx(worldX2);
            const screenY1 = sy(worldY1);
            const screenY2 = sy(worldY2);

            const cellW = screenX2 - screenX1;
            const cellH = screenY2 - screenY1;

            const padX = cellW * 0.12;
            const padY = cellH * 0.12;

            const bx = screenX1 + padX;
            const by = screenY1 + padY;
            const bw = Math.max(1, cellW - 2 * padX);
            const bh = Math.max(1, cellH - 2 * padY);

            // Outer slot cell frame
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = Math.max(0.5, 1 / zoom);
            ctx.strokeRect(bx, by, bw, bh);

            // Multi-color layered pillars for BFS (Green), DFS (Purple), and HYBRID (Orange)
            const algosInSlot = [
              { key: 'bfs', color: '#22c55e', stroke: '#14532d', remaining: boxIndex <= (6 - bfsPicked), visible: visibleAlgos.bfs },
              { key: 'dfs', color: '#a855f7', stroke: '#581c87', remaining: boxIndex <= (6 - dfsPicked), visible: visibleAlgos.dfs },
              { key: 'hybrid', color: '#f97316', stroke: '#7c2d12', remaining: boxIndex <= (6 - hybPicked), visible: visibleAlgos.hybrid }
            ].filter(a => a.visible || isSimultaneousMode);

            const numPillars = algosInSlot.length || 1;
            const pillarGap = Math.max(0.5, 1 / zoom);
            const pillarW = (bw - (numPillars - 1) * pillarGap) / numPillars;

            algosInSlot.forEach((algo, idx) => {
              const px = bx + idx * (pillarW + pillarGap);
              const py = by;
              const pw = Math.max(1, pillarW);
              const ph = bh;

              if (algo.remaining) {
                ctx.fillStyle = algo.color;
                ctx.fillRect(px, py, pw, ph);
                ctx.strokeStyle = algo.stroke;
                ctx.lineWidth = Math.max(0.5, 1 / zoom);
                ctx.strokeRect(px, py, pw, ph);
              } else {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
                ctx.lineWidth = Math.max(0.5, 0.8 / zoom);
                ctx.strokeRect(px, py, pw, ph);
              }
            });
          }
        }
      }

      // 2. Packing Desks (3 Independent Mini Storage Grids Below for BFS, DFS, and HYBRID)
      if (PACKING_DESK_NODES.has(node.id)) {
        const requiredCount = options.shelfBoxCounts!.get(node.id) ?? 6;

        const algos = [
          {
            id: 'bfs',
            name: 'BFS',
            color: '#4ade80',
            fillColor: '#22c55e',
            strokeColor: '#14532d',
            emptyStroke: 'rgba(34, 197, 94, 0.35)',
            xOffset: -4600,
            delivered: activeSteps.bfs?.deliveredBoxCounts?.[node.id] ?? 0
          },
          {
            id: 'dfs',
            name: 'DFS',
            color: '#c084fc',
            fillColor: '#a855f7',
            strokeColor: '#581c87',
            emptyStroke: 'rgba(168, 85, 247, 0.35)',
            xOffset: 0,
            delivered: activeSteps.dfs?.deliveredBoxCounts?.[node.id] ?? 0
          },
          {
            id: 'hybrid',
            name: 'HYBRID',
            color: '#fb923c',
            fillColor: '#f97316',
            strokeColor: '#7c2d12',
            emptyStroke: 'rgba(249, 115, 22, 0.35)',
            xOffset: 4600,
            delivered: activeSteps.hybrid?.deliveredBoxCounts?.[node.id] ?? 0
          }
        ];

        const isLeftSideNode = node.x <= 6000;
        const isRightSideNode = node.x >= 44000;
        const isSideNode = isLeftSideNode || isRightSideNode;

        const baseCenterX = isLeftSideNode ? 1700 : isRightSideNode ? 48300 : node.x;

        // Determine number of assigned robot racks
        const assignedRobots = (robotAssignments ?? []).filter(a =>
          a.destinations.includes(node.id)
        );

        // Hide storage grids when destination is not selected for any active robot
        if (assignedRobots.length === 0) return;

        const numRacks = assignedRobots.length;

        // Side destination nodes use 3 columns x 2 rows (rotated landscape); Bottom desks use 2 columns x 3 rows (portrait)
        const gridCols = isSideNode ? 3 : 2;
        const gridRows = isSideNode ? 2 : 3;
        const pCellW = isSideNode ? 1000 : 1400;
        const pCellH = 950;
        const rackGap = 400;
        const rackSpanX = (gridCols * pCellW + 600); // 3600 units horizontal shift per robot rack

        algos.forEach(algo => {
          const isAlgoVisible = visibleAlgos[algo.id as keyof typeof visibleAlgos];
          if (!isAlgoVisible && !isSimultaneousMode) return;

          let centerX = baseCenterX;
          let gridBaseY = node.y;

          if (isSideNode) {
            const algoYOffset = isSimultaneousMode
              ? (algo.id === 'bfs' ? -2800 : algo.id === 'dfs' ? 0 : 2800)
              : 0;
            gridBaseY = node.y + algoYOffset;
          } else {
            centerX = baseCenterX + (isSimultaneousMode ? algo.xOffset : 0);
          }

          const delCount = Math.min(requiredCount, algo.delivered);
          const isFull = delCount >= requiredCount;

          // Header Label (e.g. "BFS: 4/12")
          const labelY = sy(isSideNode ? gridBaseY - 200 : node.y + 1100);
          ctx.font = `bold ${Math.max(9, 11 / zoom)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.lineWidth = Math.max(2, 2.5 / zoom);
          ctx.strokeStyle = '#090d16';

          const labelText = isFull ? `✅ ${algo.name} (${requiredCount}/${requiredCount})` : `${algo.name}: ${delCount}/${requiredCount}`;
          ctx.strokeText(labelText, sx(centerX), labelY);
          ctx.fillStyle = isFull ? '#4ade80' : algo.color;
          ctx.fillText(labelText, sx(centerX), labelY);

          // Build per-robot rack allocation: each robot owns one rack (6 cells each)
          const rackAllocations: { allocated: number; robotDelivered: number }[] = [];
          let cumulativeFill = delCount;
          assignedRobots.forEach(robot => {
            const robotAlloc = robot.boxCounts?.[node.id] ?? 6;
            const robotFill = Math.min(robotAlloc, Math.max(0, cumulativeFill));
            rackAllocations.push({ allocated: robotAlloc, robotDelivered: robotFill });
            cumulativeFill -= robotAlloc;
          });

          for (let rackIdx = 0; rackIdx < numRacks; rackIdx++) {
            // For side nodes, extend robot racks (R1, R2, R3...) horizontally
            const rackCenterX = isSideNode
              ? (isLeftSideNode ? baseCenterX - rackIdx * rackSpanX : baseCenterX + rackIdx * rackSpanX)
              : centerX;
            const gridTopY = isSideNode
              ? gridBaseY + 100
              : node.y + 1500 + rackIdx * (gridRows * pCellH + rackGap);

            // Rack label (R1, R2, ...)
            if (rackAllocations.length > 1) {
              const rackLabelY = sy(gridTopY - 300);
              ctx.font = `bold ${Math.max(7, 9 / zoom)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillStyle = 'rgba(200, 200, 220, 0.7)';
              ctx.fillText(`R${rackIdx + 1}`, sx(rackCenterX), rackLabelY);
            }

            const rack = rackAllocations[rackIdx];
            const rackCapacity = rack ? rack.allocated : 6;
            const rackFilled = rack ? rack.robotDelivered : Math.max(0, delCount - rackIdx * 6);

            let cellIdx = 0;
            for (let row = 0; row < gridRows; row++) {
              for (let col = 0; col < gridCols; col++) {
                cellIdx++;
                if (cellIdx > rackCapacity) break;

                const halfGridW = (gridCols / 2) * pCellW;
                const wX1 = rackCenterX - halfGridW + col * pCellW;
                const wX2 = rackCenterX - halfGridW + (col + 1) * pCellW;
                const wY1 = gridTopY + row * pCellH;
                const wY2 = gridTopY + (row + 1) * pCellH;

                const sX1 = sx(wX1), sX2 = sx(wX2);
                const sY1 = sy(wY1), sY2 = sy(wY2);

                const cW = sX2 - sX1;
                const cH = sY2 - sY1;

                const pX = cW * 0.12;
                const pY = cH * 0.12;

                const dbx = sX1 + pX;
                const dby = sY1 + pY;
                const dbw = Math.max(1, cW - 2 * pX);
                const dbh = Math.max(1, cH - 2 * pY);

                // Outer cell border
                ctx.strokeStyle = algo.emptyStroke;
                ctx.lineWidth = Math.max(1, 1.2 / zoom);
                ctx.strokeRect(sX1, sY1, cW, cH);

                const isFilled = cellIdx <= rackFilled;
                if (isFilled) {
                  ctx.fillStyle = algo.fillColor;
                  ctx.fillRect(dbx, dby, dbw, dbh);
                  ctx.strokeStyle = algo.strokeColor;
                  ctx.lineWidth = Math.max(1, 1.5 / zoom);
                  ctx.strokeRect(dbx, dby, dbw, dbh);
                } else {
                  ctx.strokeStyle = algo.emptyStroke;
                  ctx.lineWidth = Math.max(0.5, 1 / zoom);
                  ctx.strokeRect(dbx, dby, dbw, dbh);
                }
              }
            }

            // Draw subtle rack separator line between racks
            if (rackIdx < numRacks - 1) {
              const sepY = sy(gridTopY + 3 * pCellH + rackGap / 2);
              ctx.beginPath();
              ctx.strokeStyle = 'rgba(100, 120, 180, 0.25)';
              ctx.lineWidth = Math.max(0.5, 1 / zoom);
              ctx.setLineDash([3, 3]);
              ctx.moveTo(sx(centerX - pCellW * 1.2), sepY);
              ctx.lineTo(sx(centerX + pCellW * 1.2), sepY);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        });
      }
    });
    ctx.restore();
  }

  const drawPath = (edge: GraphEdge, x1: number, y1: number, x2: number, y2: number, ox: number = 0, oy: number = 0) => {
    ctx.beginPath();
    if (edge.type === 'serial') {
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const perpX = -dy / len, perpY = dx / len;
      const midX = x1 + dx * 0.5, midY = y1 + dy * 0.5;
      const zigzagSize = 14 * scale; 
      
      ctx.moveTo(x1 + ox, y1 + oy);
      ctx.lineTo(midX - (dx * 0.1) + perpX * zigzagSize + ox, midY - (dy * 0.1) + perpY * zigzagSize + oy);
      ctx.lineTo(midX + (dx * 0.1) - perpX * zigzagSize + ox, midY + (dy * 0.1) - perpY * zigzagSize + oy);
      ctx.lineTo(x2 + ox, y2 + oy);
    } else {
      ctx.moveTo(x1 + ox, y1 + oy);
      ctx.lineTo(x2 + ox, y2 + oy);
    }
  };

  // --- Edges ---
  visibleEdges.forEach(edge => {
    const fromNode = visibleNodeMap.get(edge.from);
    const toNode = visibleNodeMap.get(edge.to);
    if (!fromNode || !toNode) return;

    const x1 = sx(fromNode.x), y1 = sy(fromNode.y), x2 = sx(toNode.x), y2 = sy(toNode.y);
    const isExplored = (id: string) => sets.bfs.explored.has(id) || sets.dfs.explored.has(id) || sets.hyb.explored.has(id);
    const expAny = isExplored(edge.from) && isExplored(edge.to);
    const cfg = EDGE_CONFIG[edge.type] ?? EDGE_CONFIG.path;
    const baseWidth = isDatacenter ? 0.25 : (isMassive ? 0.3 : cfg.width);

    drawPath(edge, x1, y1, x2, y2);
    ctx.strokeStyle = expAny ? getRgba('#64748b', 0.4) : getRgba(cfg.color, baseOpacity);
    ctx.lineWidth = baseWidth;
    ctx.setLineDash(cfg.dash.length > 0 ? cfg.dash : []);
    ctx.stroke();
  });

  // --- Active Paths ---
  ctx.setLineDash([]);
  visibleEdges.forEach(edge => {
    const fromNode = visibleNodeMap.get(edge.from);
    const toNode = visibleNodeMap.get(edge.to);
    if (!fromNode || !toNode) return;

    const pBFS = sets.bfs.path.has(edge.from) && sets.bfs.path.has(edge.to);
    const pDFS = sets.dfs.path.has(edge.from) && sets.dfs.path.has(edge.to);
    const pHYB = sets.hyb.path.has(edge.from) && sets.hyb.path.has(edge.to);

    if (pBFS || pDFS || pHYB) {
      const x1 = sx(fromNode.x), y1 = sy(fromNode.y), x2 = sx(toNode.x), y2 = sy(toNode.y);
      drawPath(edge, x1, y1, x2, y2);
      
      if (pBFS && visibleAlgos.bfs) { ctx.strokeStyle = getRgba(cBFS, 0.9); ctx.lineWidth = isMassive ? 2.5 : 8; ctx.stroke(); }
      if (pDFS && visibleAlgos.dfs) { ctx.strokeStyle = getRgba(cDFS, 0.95); ctx.lineWidth = isMassive ? 1.8 : 5; ctx.stroke(); }
      if (pHYB && visibleAlgos.hybrid) { ctx.strokeStyle = getRgba(cHYB, 1); ctx.lineWidth = isMassive ? 1.2 : 3; ctx.stroke(); }
    }
  });

  // --- Visited Edges (Stacked/Offset) ---
  ctx.setLineDash([]);
  visibleEdges.forEach(edge => {
    const fromNode = visibleNodeMap.get(edge.from);
    const toNode = visibleNodeMap.get(edge.to);
    if (!fromNode || !toNode) return;

    const x1 = sx(fromNode.x), y1 = sy(fromNode.y), x2 = sx(toNode.x), y2 = sy(toNode.y);
    const cfg = EDGE_CONFIG[edge.type] ?? EDGE_CONFIG.path;
    const baseWidth = isDatacenter ? 0.25 : (isMassive ? 0.3 : cfg.width);

    const vBFS = (sets.bfs.explored.has(edge.from) || sets.bfs.explored.has(edge.to)) && !(sets.bfs.path.has(edge.from) && sets.bfs.path.has(edge.to));
    const vDFS = (sets.dfs.explored.has(edge.from) || sets.dfs.explored.has(edge.to)) && !(sets.dfs.path.has(edge.from) && sets.dfs.path.has(edge.to));
    const vHYB = (sets.hyb.explored.has(edge.from) || sets.hyb.explored.has(edge.to)) && !(sets.hyb.path.has(edge.from) && sets.hyb.path.has(edge.to));

    if (vBFS || vDFS || vHYB) {
      if (isMassive || isDatacenter) {
        const opacity = 0.55;
        if (vBFS && visibleAlgos.bfs) { drawPath(edge, x1, y1, x2, y2); ctx.strokeStyle = getRgba(cBFS, opacity); ctx.lineWidth = baseWidth * 8.0; ctx.stroke(); }
        if (vDFS && visibleAlgos.dfs) { drawPath(edge, x1, y1, x2, y2); ctx.strokeStyle = getRgba(cDFS, opacity + 0.1); ctx.lineWidth = baseWidth * 5.0; ctx.stroke(); }
        if (vHYB && visibleAlgos.hybrid) { drawPath(edge, x1, y1, x2, y2); ctx.strokeStyle = getRgba(cHYB, opacity + 0.2); ctx.lineWidth = baseWidth * 2.0; ctx.stroke(); }
      } else {
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const perpX = -dy / len, perpY = dx / len;
        
        const stackOffset = baseWidth * 1.5; 
        const algoLines = [
          { active: vBFS && visibleAlgos.bfs, color: cBFS, offset: -stackOffset },
          { active: vDFS && visibleAlgos.dfs, color: cDFS, offset: 0 },
          { active: vHYB && visibleAlgos.hybrid, color: cHYB, offset: stackOffset }
        ];

        algoLines.forEach(algo => {
          if (algo.active) {
            drawPath(edge, x1, y1, x2, y2, perpX * algo.offset, perpY * algo.offset);
            ctx.strokeStyle = getRgba(algo.color, 0.35); 
            ctx.lineWidth = baseWidth * 1.2; 
            ctx.stroke();
          }
        });
      }
    }
  });

  const renderedTextPositions: { x: number; y: number; radius: number }[] = [];

  // --- Nodes & Labels ---
  visibleNodes.forEach(node => {
    const isRealWorldPlace = scenario === 'evacuation' && !['start', 'emergency_exit', 'corridor', 'stairwell', 'fire'].includes(node.type);
    const cfg = NODE_CONFIG[node.type] ?? { icon: '🏪', radius: 18, baseColor: '#0e7490' };
    const cx = sx(node.x), cy = sy(node.y);
    const isBlocked = activeBlocked.has(node.id);
    const isSource = node.id === sourceId || (sourceIds && sourceIds.includes(node.id));
    const isDest = destinationIds.includes(node.id);

    const currBFS = visibleAlgos.bfs && sets.bfs.current === node.id;
    const currDFS = visibleAlgos.dfs && sets.dfs.current === node.id;
    const currHYB = visibleAlgos.hybrid && sets.hyb.current === node.id;
    const isImportant = isSource || isDest || currBFS || currDFS || currHYB;
    
    const expBFS = visibleAlgos.bfs && sets.bfs.explored.has(node.id);
    const expDFS = visibleAlgos.dfs && sets.dfs.explored.has(node.id);
    const expHYB = visibleAlgos.hybrid && sets.hyb.explored.has(node.id);
    
    const ringTint = isRealWorldPlace ? cfg.baseColor : null;
    const activeExplorations = [
      { id: 'bfs', active: expBFS, color: ringTint ?? cBFS },
      { id: 'dfs', active: expDFS, color: ringTint ?? cDFS },
      { id: 'hyb', active: expHYB, color: ringTint ?? cHYB }
    ].filter(e => e.active);

    const isBlockedImportant = isBlocked;
    let r = isMassive ? (isImportant || isBlockedImportant ? 4.5 : 1.2) : cfg.radius;
    if (isDatacenter) r = (isImportant || isBlockedImportant) ? 8 : 4.5;
    
    const currentRadii = isMassive ? [2.2, 1.2, 0.6] : [r * 0.85, r * 0.55, r * 0.25];
    const currentStrokes = isMassive ? [0.5, 0.3, 0.1] : [2, 1.5, 1];

    let fillColor = cfg.baseColor;
    let opacity = (isMassive && !isImportant && !isBlockedImportant) ? 0.3 : 1;
    
    const BLOCKED_ICONS: Record<string, string> = {
      traffic:    '\uD83D\uDEAB', 
      evacuation: '\uD83D\uDD25', 
      robotics:   '\uD83D\uDEA7', 
      network:    '\uD83D\uDCA5', 
      gameai:     mapId === 'dama' ? '\uD83D\uDD3B' : '\uD83D\uDD34', 
    };
    const blockedIcon = BLOCKED_ICONS[scenario] ?? '\uD83D\uDCA5';

    if (isBlocked) { 
      fillColor = scenario === 'evacuation' ? '#c2410c' : '#dc2626'; 
      opacity = 1; 
    } else if (wasHistoricallyBlocked.has(node.id)) { 
      fillColor = scenario === 'evacuation' ? '#ea580c' : '#ef4444'; 
      opacity = 1; 
    }
    const bfsFound = !visibleAlgos.bfs || (activeSteps.bfs?.foundDestinations?.includes(node.id) ?? false);
    const dfsFound = !visibleAlgos.dfs || (activeSteps.dfs?.foundDestinations?.includes(node.id) ?? false);
    const hybFound = !visibleAlgos.hybrid || (activeSteps.hybrid?.foundDestinations?.includes(node.id) ?? false);
    const isReachedDest = isDest && bfsFound && dfsFound && hybFound;

    if (isSource) { fillColor = '#16a34a'; } 
    else if (isReachedDest) { fillColor = '#22c55e'; }
    else if (isDest) { fillColor = '#b91c1c'; }

    if (isBlocked && (isMassive || isDatacenter)) {
      ctx.beginPath();
      ctx.arc(cx, cy, r + (isDatacenter ? 4 : 2.5), 0, Math.PI * 2);
      ctx.strokeStyle = scenario === 'evacuation' ? 'rgba(194, 65, 12, 0.7)' : 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = isDatacenter ? 1.5 : 1;
      ctx.stroke();
    }

    if (wasHistoricallyBlocked.has(node.id) && !isBlocked) {
      ctx.beginPath();
      ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = scenario === 'evacuation' ? 'rgba(234, 88, 12, 0.5)' : 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (currBFS || currDFS || currHYB) {
      const rBFS = ringTint ?? cBFS;
      const rDFS = ringTint ?? cDFS;
      const rHYB = ringTint ?? cHYB;
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1.5;
      if (currBFS) { ctx.beginPath(); ctx.arc(cx, cy, r + (isMassive ? 2 : 8), 0, Math.PI * 2); ctx.strokeStyle = rBFS; ctx.shadowColor = rBFS; ctx.stroke(); }
      if (currDFS) { ctx.beginPath(); ctx.arc(cx, cy, r + (isMassive ? 4 : 12), 0, Math.PI * 2); ctx.strokeStyle = rDFS; ctx.shadowColor = rDFS; ctx.stroke(); }
      if (currHYB) { ctx.beginPath(); ctx.arc(cx, cy, r + (isMassive ? 6 : 16), 0, Math.PI * 2); ctx.strokeStyle = rHYB; ctx.shadowColor = rHYB; ctx.stroke(); }
      ctx.shadowBlur = 0; 
    }

    if (isBlocked || isSource || isDest || activeExplorations.length === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = getRgba(fillColor, opacity);
      ctx.fill();
      if (!isMassive || isImportant) {
        ctx.lineWidth = isBlocked ? 2 : (isSource || isDest ? 3 : 1);
        ctx.strokeStyle = isBlocked ? (scenario === 'evacuation' ? '#c2410c' : '#ef4444') : 
                          isSource ? '#4ade80' : 
                          isDest ? '#f87171' : '#374151';
        ctx.stroke();
      }
    } else {
      activeExplorations.forEach((exp, index) => {
        ctx.beginPath();
        ctx.arc(cx, cy, currentRadii[index], 0, Math.PI * 2);
        ctx.fillStyle = exp.color;
        ctx.fill();
        ctx.lineWidth = currentStrokes[index];
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      });
    }
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const displayLabel = node.label ? node.label.split('\n')[0].trim() : '';
    const isGenericLink = displayLabel.toLowerCase().includes('local link section') || 
                          displayLabel.toLowerCase().includes('node/') || 
                          displayLabel.includes('#');
    const isKnownPlace = displayLabel && !isGenericLink;
    const shouldShowStreetLabel = isMassive && isKnownPlace && zoom >= 1.5;
    const shouldShowNormalLabel = (!isMassive && isKnownPlace) || isImportant;
    const textAlpha = isImportant ? 1 : Math.max(0, Math.min(1, (zoom - 0.6) * 2.5));

    if (textAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = textAlpha;

      if (shouldShowStreetLabel) {
        const screenX = (cx * zoom) + pan.x;
        const screenY = (cy * zoom) + pan.y;
        const separationThreshold = Math.max(50 / (zoom * 0.15), 35); 
        const isOverlapping = renderedTextPositions.some(pos => Math.hypot(pos.x - screenX, pos.y - screenY) < separationThreshold);

        if (!isOverlapping || isImportant) {
          const dynamicFontSize = (isImportant ? 16 : 14) / zoom; 
          ctx.font = `${isImportant ? 'bold' : '600'} ${dynamicFontSize}px sans-serif`;
          ctx.lineJoin = 'round';
          ctx.lineWidth = (scenario === 'gameai' ? 5 : 3) / zoom;
          ctx.strokeStyle = scenario === 'gameai' ? '#000000' : '#0a0f1e'; 
          
          const labelOffsetY = r + (10 / zoom);
          ctx.strokeText(displayLabel, cx, cy - labelOffsetY);
          ctx.fillStyle = isImportant ? '#fb923c' : (scenario === 'gameai' ? '#fde68a' : '#f1f5f9'); 
          ctx.fillText(displayLabel, cx, cy - labelOffsetY);
          renderedTextPositions.push({ x: screenX, y: screenY, radius: separationThreshold });
        }
      } else if (shouldShowNormalLabel && displayLabel) {
        let textY = cy;
        // Collision avoidance for important labels on all scales
        if (isImportant) {
          const screenX = (cx * zoom) + pan.x;
          let screenY = (textY * zoom) + pan.y;
          let attempts = 0;
          while (attempts < 5 && renderedTextPositions.some(pos => Math.abs(pos.x - screenX) < 70 && Math.abs(pos.y - screenY) < 25)) {
            screenY += 20;
            textY += 20 / zoom;
            attempts++;
          }
          renderedTextPositions.push({ x: screenX, y: screenY, radius: 25 });
        }

        if (isMassive && isImportant) {
          ctx.font = `bold ${16 / zoom}px sans-serif`;
          ctx.strokeStyle = '#0a0f1e';
          ctx.lineWidth = 3 / zoom;
          const labelOffsetY = r + (10 / zoom);
          ctx.strokeText(displayLabel, cx, textY - labelOffsetY);
          ctx.fillStyle = isSource ? '#4ade80' : isDest ? '#f87171' : '#fb923c';
          ctx.fillText(displayLabel, cx, textY - labelOffsetY);
        } else if (!isMassive) {
          if (!isDatacenter) {
            const labelSize = (isImportant ? 14 : 12) / zoom;
            ctx.font = `${isImportant ? 'bold ' : ''}${labelSize}px sans-serif`;
            
            if (scenario === 'gameai') {
              ctx.lineJoin = 'round';
              ctx.lineWidth = 4 / zoom;
              ctx.strokeStyle = '#000000';
              const labelOffsetY = r + (12 / zoom);
              ctx.strokeText(displayLabel, cx, textY + labelOffsetY);
              ctx.fillStyle = isImportant ? '#fb923c' : '#fde68a';
              ctx.fillText(displayLabel, cx, textY + labelOffsetY);
            } else {
              // Add stroke for readability
              ctx.lineJoin = 'round';
              ctx.lineWidth = 3 / zoom;
              ctx.strokeStyle = '#0a0f1e';
              const labelOffsetY = r + (12 / zoom);
              ctx.strokeText(displayLabel, cx, textY + labelOffsetY);
              
              // Color sources green, destinations red, other important orange
              if (isImportant) {
                ctx.fillStyle = isSource ? '#4ade80' : isDest ? '#f87171' : '#fb923c';
              } else {
                ctx.fillStyle = '#cbd5e1';
              }
              ctx.fillText(displayLabel, cx, textY + labelOffsetY);
            }
          } else {
            const labelSize = (isImportant ? 12 : 10) / zoom;
            const labelY = textY + r + (8 / zoom);
            ctx.font = `${labelSize}px sans-serif`;
            ctx.lineWidth = 2 / zoom;
            ctx.strokeStyle = '#0f172a';
            ctx.strokeText(displayLabel, cx, labelY);
            ctx.fillStyle = isImportant ? (isSource ? '#4ade80' : isDest ? '#f87171' : '#fb923c') : '#f8fafc';
            ctx.fillText(displayLabel, cx, labelY);
          }
        }
      }
      ctx.restore();
    }
    
    if (!isMassive) {
      const iconSize = r * 1.1;
      ctx.font = `${iconSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let displayIcon = cfg.icon;
      if (scenario === 'gameai' && isSource) {
        displayIcon = mapId === 'dama' ? '🔷' : '🔵';
      }
      ctx.fillText((isBlocked || wasHistoricallyBlocked.has(node.id)) ? blockedIcon : displayIcon, cx, cy);

      // Render carried package badge on active robot node ONLY after picking up from a shelf
      if (scenario === 'robotics' && (sets.bfs.current === node.id || sets.dfs.current === node.id || sets.hyb.current === node.id)) {
        const AWS_SHELVES = new Set(['shelf_a1','shelf_a2','shelf_b1','shelf_b2','shelf_d1','shelf_d2','shelf_e1','shelf_e2','shelf_e3','shelf_e4','shelf_f1','shelf_f2']);
        const checkCarrying = (step: AlgorithmStep | null) => {
          if (!step || !step.path) return false;
          const currentIdx = step.path.indexOf(node.id);
          if (currentIdx <= 0) return false;
          const pathBeforeCurrent = step.path.slice(0, currentIdx + 1);
          const passedShelf = pathBeforeCurrent.some(id => AWS_SHELVES.has(id));
          const isAtDeskOrDepot = destinationIds.includes(node.id) || sourceIds?.includes(node.id) || sourceId === node.id;
          return passedShelf && !isAtDeskOrDepot;
        };

        const isCarrying = checkCarrying(activeSteps.bfs) || checkCarrying(activeSteps.dfs) || checkCarrying(activeSteps.hybrid);
        if (isCarrying) {
          ctx.font = `${r * 0.9}px sans-serif`;
          ctx.fillText('📦', cx + r * 0.75, cy - r * 0.75);
        }
      }
    }
  });

  if (!isMassive && zoom >= 0.7 && scenario !== 'gameai') {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, (zoom - 0.7) * 3));
    ctx.font = `${Math.max(8, 12 / zoom)}px sans-serif`;
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2 / zoom;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    visibleEdges.forEach(edge => {
      const fromNode = visibleNodeMap.get(edge.from);
      const toNode = visibleNodeMap.get(edge.to);
      if (!fromNode || !toNode) return;

      const x1 = sx(fromNode.x), y1 = sy(fromNode.y);
      const x2 = sx(toNode.x), y2 = sy(toNode.y);
      const midX = (x1 + x2) / 2;
      const mi = (y1 + y2) / 2;

      const unit = scenario === 'evacuation' ? 's' : scenario === 'network' ? 'ms' : 'm';
      const label = edge.label || `${edge.latency}${unit}`;
      ctx.strokeText(label, midX, mi);
      ctx.fillText(label, midX, mi);
    });
    ctx.restore();
  }

  // Highlight completed packing desks (6/6 delivered) in bright green
  destinationIds.forEach(deskId => {
    const requiredCount = options.shelfBoxCounts?.get(deskId) ?? 6;
    const delCount = isSimultaneousMode
      ? getCombinedDelivered(deskId)
      : (currentActiveStep?.deliveredBoxCounts?.[deskId] ?? 0);
    if (delCount >= requiredCount) {
      const dNode = visibleNodeMap.get(deskId);
      if (dNode) {
        const cx = sx(dNode.x), cy = sy(dNode.y);
        const cfg = NODE_CONFIG[dNode.type] || NODE_CONFIG['place'];
        const r = (cfg.radius / scale) * zoom;
        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#22c55e';
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3 / zoom;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 6 / zoom, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }
  });

  if (highlightedNodeId) {
    const hNode = visibleNodeMap.get(highlightedNodeId);
    if (hNode) {
      const cx = sx(hNode.x), cy = sy(hNode.y);
      const cfg = NODE_CONFIG[hNode.type] || NODE_CONFIG['place'];
      const r = (cfg.radius / scale) * zoom;
      const pulseR = r + 8 / zoom;
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#facc15';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3 / zoom;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(250,204,21,0.4)';
      ctx.lineWidth = 6 / zoom;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR + 5 / zoom, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
