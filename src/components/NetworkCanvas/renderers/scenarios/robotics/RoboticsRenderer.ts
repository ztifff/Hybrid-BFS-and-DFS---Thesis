import { BaseRenderer, RenderOptions } from '../../BaseRenderer';
import { drawClinicBlueprintPlan } from './clinicBlueprintPlan';
import { drawAWSBlueprintPlan } from './awsBlueprintPlan';
import { getCiscoIconCanvas } from '../../../../../utils/ciscoIcons';

export class RoboticsRenderer extends BaseRenderer {
  protected drawBackground(options: RenderOptions) {
    const { ctx, scenario, mapId, scale, zoom, visibleNodes, activeSteps, visibleAlgos, workspaceView } = options;

    if (scenario === 'robotics' && mapId === 'clinic') {
      const sx = (x: number) => this.sx(x, options);
      const sy = (y: number) => this.sy(y, options);
      drawClinicBlueprintPlan(
        ctx,
        sx,
        sy,
        zoom,
        visibleNodes,
        options.graph?.walls,
        options.workspaceView,
        options.theme || 'dark'
      );
    } else if (scenario === 'robotics' && (mapId === 'aws' || mapId === 'awsWarehouse')) {
      const sx = (x: number) => this.sx(x, options);
      const sy = (y: number) => this.sy(y, options);
      drawAWSBlueprintPlan(
        ctx,
        sx,
        sy,
        zoom,
        scale,
        visibleNodes,
        options.graph?.walls,
        options.workspaceView,
        options.theme || 'dark'
      );
    }

    if (scenario === 'robotics' && options.shelfBoxCounts) {
      ctx.save();
      const AWS_SHELF_NODES = new Set([
        'shelf_a1','shelf_a2','shelf_b1','shelf_b2','shelf_d1','shelf_d2','shelf_e1','shelf_e2','shelf_e3','shelf_e4','shelf_f1','shelf_f2'
      ]);

      // Match the widened three-bay × two-level rack modules in the AWS plan.
      // Match the actual 7.5 m × 5 m rack slots drawn by the AWS blueprint.
      const cellW_world = 7500;
      const cellH_world = 2500;
      const boxIcon = workspaceView === 'logical' ? null : getCiscoIconCanvas('/RoboticsMaps/icons/box.png');

      visibleNodes.forEach(node => {
        const isStorageShelf = mapId !== 'clinic' && (AWS_SHELF_NODES.has(node.id) || (node.id.startsWith('shelf_') && !node.id.startsWith('dest_')) || node.type === 'shelf' || node.type === 'aisle');
        if (isStorageShelf) {
          const rackCenterX = node.x;
          const rackCenterY = node.y;
          const bfsPicked = activeSteps.bfs?.pickedUpBoxCounts?.[node.id] ?? 0;
          const dfsPicked = activeSteps.dfs?.pickedUpBoxCounts?.[node.id] ?? 0;
          const hybPicked = activeSteps.hybrid?.pickedUpBoxCounts?.[node.id] ?? 0;

          for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 3; col++) {
              const slotW = cellW_world / 3;
              const slotH = cellH_world;
              const worldX1 = rackCenterX - cellW_world / 2 + col * slotW;
              const worldX2 = rackCenterX - cellW_world / 2 + (col + 1) * slotW;
              const worldY1 = rackCenterY - cellH_world + row * slotH;
              const worldY2 = rackCenterY - cellH_world + (row + 1) * slotH;

              const screenX1 = this.sx(worldX1, options);
              const screenX2 = this.sx(worldX2, options);
              const screenY1 = this.sy(worldY1, options);
              const screenY2 = this.sy(worldY2, options);

              const cellW = screenX2 - screenX1;
              const cellH = screenY2 - screenY1;

              // Match the carton footprint to the full rack slot, leaving a
              // narrow clearance so adjacent boxes remain visually distinct.
              const padX = cellW * 0.025;
              const padY = cellH * 0.025;

              const bx = screenX1 + padX;
              const by = screenY1 + padY;
              const bw = Math.max(1, cellW - 2 * padX);
              const bh = Math.max(1, cellH - 2 * padY);

              ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
              ctx.lineWidth = Math.max(0.5, 1 / zoom);
              ctx.strokeRect(bx, by, bw, bh);

              const algo = col === 0
                ? { color: '#22c55e', stroke: '#14532d', picked: bfsPicked, visible: visibleAlgos.bfs }
                : col === 1
                  ? { color: '#a855f7', stroke: '#581c87', picked: dfsPicked, visible: visibleAlgos.dfs }
                  : { color: '#f97316', stroke: '#7c2d12', picked: hybPicked, visible: visibleAlgos.hybrid };
              // Each rack is exactly 3 columns × 2 rows: two packages per
              // algorithm, with one algorithm color assigned to each column.
              const isRemaining = algo.visible && row >= Math.min(2, algo.picked);
              if (isRemaining) {
                const packSize = Math.min(bw * 0.9, bh * 0.9);
                const packX = bx + (bw - packSize) / 2;
                const packY = by + (bh - packSize) / 2;
                // Logical view uses a solid color tile. Physical view uses a
                // white carton and places the algorithm color beneath it.
                ctx.fillStyle = boxIcon ? '#fff' : algo.color;
                ctx.fillRect(packX, packY, packSize, packSize);
                ctx.strokeStyle = algo.stroke;
                ctx.lineWidth = Math.max(0.75, 1 / zoom);
                ctx.strokeRect(packX, packY, packSize, packSize);
                if (boxIcon) {
                  const bandH = Math.max(2 / zoom, packSize * 0.16);
                  const iconSize = packSize * 0.74;
                  ctx.drawImage(boxIcon, packX + (packSize - iconSize) / 2, packY + (packSize - bandH - iconSize) / 2, iconSize, iconSize);
                  ctx.fillStyle = algo.color;
                  ctx.fillRect(packX, packY + packSize - bandH, packSize, bandH);
                }
              }
            }
          }
        }

        const isDestinationNode = node.type === 'delivery_bay' && mapId !== 'clinic';
        if (isDestinationNode) {
          const requiredCount = options.shelfBoxCounts?.get(node.id);
          if (!requiredCount) return; // Skip if this destination is not selected

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

          // Layout settings
          const isLeftSide = node.id === 'clutter_a' || node.id === 'pallet_jack';
          const isRightSide = node.id === 'clutter_b' || node.id === 'trash_cans';
          const isSideNode = isLeftSide || isRightSide;
          
          const cols = 3;
          const rows = Math.ceil(requiredCount / 3);
          
          // Keep all three algorithm batches inside the widened outbound desk.
          const algoSpacing = 2000;
          const slotSizeWorldW = 1800;
          const slotSizeWorldH = 1400;
          const slotScreenSizeW = slotSizeWorldW * scale;
          const slotScreenSizeH = slotSizeWorldH * scale;

          let startX = 0;
          let startY = 0;

          if (isSideNode) {
            // Stack vertically
            const totalHeightWorld = algoSpacing * activeAlgos.length;
            startX = isLeftSide ? node.x - 3000 : node.x + 3000;
            startY = node.y - (totalHeightWorld / 2) + (algoSpacing / 2);
          } else {
            // Stack horizontally below (for Finish Lines, Packing Desks, etc.)
            const totalWidthWorld = algoSpacing * activeAlgos.length;
            startX = node.x - (totalWidthWorld / 2) + (algoSpacing / 2);
            startY = node.y + 2000; // Offset below
          }

          activeAlgos.forEach((algo, idx) => {
            const currentX = isSideNode ? startX : startX + (idx * algoSpacing);
            const currentY = isSideNode ? startY + (idx * algoSpacing) : startY;
            
            const screenX = this.sx(currentX, options) - slotScreenSizeW / 2;
            const screenY = this.sy(currentY, options) - slotScreenSizeH / 2;

            // Draw algorithm label above the boxes
            ctx.fillStyle = algo.fillColor;
            ctx.font = `bold ${Math.max(10, 14 / zoom)}px monospace`;
            ctx.textAlign = 'center';
            // Slight adjustment to label position if side node to align nicely
            ctx.fillText(algo.name, screenX + slotScreenSizeW / 2, screenY - (10 / zoom));

            for (let i = 0; i < requiredCount; i++) {
              const px = screenX + (i % cols) * (slotScreenSizeW / cols);
              const py = screenY + Math.floor(i / cols) * (slotScreenSizeH / rows);
              
              // Make the boxes a bit bigger by using a larger percentage of the cell
              const pSize = Math.min(slotScreenSizeW / cols, slotScreenSizeH / rows) * 0.9;

              if (i < algo.delivered) {
                ctx.fillStyle = boxIcon ? '#fff' : algo.fillColor;
                ctx.fillRect(px, py, pSize, pSize);
                ctx.strokeStyle = algo.strokeColor;
                ctx.lineWidth = Math.max(0.5, 1 / zoom);
                ctx.strokeRect(px, py, pSize, pSize);
                if (boxIcon) {
                  const bandH = Math.max(2 / zoom, pSize * 0.18);
                  const iconSize = pSize * 0.7;
                  ctx.drawImage(boxIcon, px + (pSize - iconSize) / 2, py + (pSize - bandH - iconSize) / 2, iconSize, iconSize);
                  ctx.fillStyle = algo.fillColor;
                  ctx.fillRect(px, py + pSize - bandH, pSize, bandH);
                }
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
