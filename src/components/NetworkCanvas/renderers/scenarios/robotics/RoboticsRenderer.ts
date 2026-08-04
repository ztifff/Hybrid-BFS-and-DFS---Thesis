import { BaseRenderer, RenderOptions } from '../../BaseRenderer';

export class RoboticsRenderer extends BaseRenderer {
  protected drawBackground(options: RenderOptions) {
    const { ctx, scenario, mapId, scale, zoom, visibleNodes, activeSteps, visibleAlgos } = options;
    const isSimultaneousMode = [visibleAlgos.bfs, visibleAlgos.dfs, visibleAlgos.hybrid].filter(Boolean).length > 1 && !options.disableSimultaneousMode;

    if (scenario === 'robotics' && (mapId === 'clinic' || mapId === 'aws' || mapId === 'awsWarehouse') && options.graph?.walls) {
      ctx.save();
      ctx.strokeStyle = '#334155'; // Slate 700 for blueprint lines
      ctx.lineWidth = 4 / zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const activeFloor = visibleNodes.length > 0 ? (visibleNodes[0].buildingId || 'L1') : 'L1';
      
      options.graph.walls.forEach(wall => {
        if (!wall.level || wall.level === activeFloor || wall.level === 'warehouse' || wall.level === 'all') {
          ctx.beginPath();
          ctx.moveTo(this.sx(wall.x1, options), this.sy(wall.y1, options));
          ctx.lineTo(this.sx(wall.x2, options), this.sy(wall.y2, options));
          ctx.stroke();
        }
      });
      ctx.restore();
    }

    if (scenario === 'robotics' && options.shelfBoxCounts) {
      ctx.save();
      const AWS_SHELF_NODES = new Set([
        'shelf_a1','shelf_a2','shelf_b1','shelf_b2','shelf_d1','shelf_d2','shelf_e1','shelf_e2','shelf_e3','shelf_e4','shelf_f1','shelf_f2'
      ]);
      const PACKING_DESK_NODES = new Set(['dest_desk_a', 'dest_desk_b', 'clutter_a', 'clutter_b', 'pallet_jack', 'trash_cans']);

      const cellW_world = 2500;
      const cellH_world = 1666.67;

      visibleNodes.forEach(node => {
        const isStorageShelf = AWS_SHELF_NODES.has(node.id) || (node.id.startsWith('shelf_') && !node.id.startsWith('dest_'));
        if (isStorageShelf) {
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

              const screenX1 = this.sx(worldX1, options);
              const screenX2 = this.sx(worldX2, options);
              const screenY1 = this.sy(worldY1, options);
              const screenY2 = this.sy(worldY2, options);

              const cellW = screenX2 - screenX1;
              const cellH = screenY2 - screenY1;

              const padX = cellW * 0.12;
              const padY = cellH * 0.12;

              const bx = screenX1 + padX;
              const by = screenY1 + padY;
              const bw = Math.max(1, cellW - 2 * padX);
              const bh = Math.max(1, cellH - 2 * padY);

              ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
              ctx.lineWidth = Math.max(0.5, 1 / zoom);
              ctx.strokeRect(bx, by, bw, bh);

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

        const isDestinationNode = PACKING_DESK_NODES.has(node.id) || node.id.startsWith('dest_');
        if (isDestinationNode) {
          const requiredCount = options.shelfBoxCounts!.get(node.id) ?? 6;

          const algos = [
            {
              id: 'bfs',
              name: 'BFS',
              color: '#4ade80',
              fillColor: '#22c55e',
              strokeColor: '#14532d',
              emptyStroke: 'rgba(34, 197, 94, 0.35)',
              xOffset: -2500,
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
              xOffset: 2500,
              delivered: activeSteps.hybrid?.deliveredBoxCounts?.[node.id] ?? 0
            }
          ];

          const activeAlgos = algos.filter(a => {
            if (a.id === 'bfs') return visibleAlgos.bfs;
            if (a.id === 'dfs') return visibleAlgos.dfs;
            if (a.id === 'hybrid') return visibleAlgos.hybrid;
            return false;
          });

          const totalWidthWorld = 2000 * activeAlgos.length;
          const startX = node.x - (totalWidthWorld / 2) + 1000;

          activeAlgos.forEach((algo, idx) => {
            const currentX = startX + (idx * 2000);
            const slotSizeWorld = 1600;
            const slotScreenSize = slotSizeWorld * scale;
            const screenX = this.sx(currentX, options) - slotScreenSize / 2;
            const screenY = this.sy(node.y + 2000, options) - slotScreenSize / 2;

            for (let i = 0; i < requiredCount; i++) {
              const px = screenX + (i % 3) * (slotScreenSize / 3);
              const py = screenY + Math.floor(i / 3) * (slotScreenSize / 3);
              const pSize = (slotScreenSize / 3) * 0.8;

              if (i < algo.delivered) {
                ctx.fillStyle = algo.fillColor;
                ctx.fillRect(px, py, pSize, pSize);
                ctx.strokeStyle = algo.strokeColor;
                ctx.lineWidth = Math.max(0.5, 1 / zoom);
                ctx.strokeRect(px, py, pSize, pSize);
              } else {
                ctx.strokeStyle = algo.emptyStroke;
                ctx.lineWidth = Math.max(0.5, 1 / zoom);
                ctx.strokeRect(px, py, pSize, pSize);
              }
            }
          });
        }
      });
      ctx.restore();
    }
  }
}
