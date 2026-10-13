import { BaseRenderer, RenderOptions } from '../../BaseRenderer';
import { drawCabuyaoMapPlan } from './cabuyaoMapPlan';

export class TrafficRenderer extends BaseRenderer {
  protected drawBackground(options: RenderOptions) {
    if (options.scenario === 'traffic' && (options.mapId === 'cabuyao' || options.mapId === 'cabuyaoCity')) {
      const sx = (x: number) => this.sx(x, options);
      const sy = (y: number) => this.sy(y, options);
      drawCabuyaoMapPlan(options.ctx, sx, sy, options.zoom, options.workspaceView, options.theme || 'dark');
    }
  }
}

