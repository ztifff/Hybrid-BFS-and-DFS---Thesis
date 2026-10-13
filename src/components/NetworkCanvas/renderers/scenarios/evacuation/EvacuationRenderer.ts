import { BaseRenderer, RenderOptions } from '../../BaseRenderer';
import { drawClemensFloorPlan } from './clemensFloorPlan';
import { drawAyalaFloorPlan } from './ayalaFloorPlan';
import { drawSMRosaFloorPlan } from './smRosaFloorPlan';

export class EvacuationRenderer extends BaseRenderer {
  protected drawBackground(options: RenderOptions) {
    if (options.scenario === 'evacuation') {
      const sx = (x: number) => this.sx(x, options);
      const sy = (y: number) => this.sy(y, options);

      if (options.mapId === 'city' || options.mapId === 'ayala') {
        drawAyalaFloorPlan(options.ctx, sx, sy, options.zoom, options.visibleNodes, options.workspaceView, options.theme, options.activeFloor);
      } else if (options.mapId === 'building') {
        drawSMRosaFloorPlan(options.ctx, sx, sy, options.zoom, options.visibleNodes, options.workspaceView, options.theme, options.activeFloor);
      } else if (options.mapId === 'synthetic') {
        drawClemensFloorPlan(options.ctx, sx, sy, options.zoom, options.visibleNodes, options.workspaceView, options.theme);
      }
    }
  }
}
