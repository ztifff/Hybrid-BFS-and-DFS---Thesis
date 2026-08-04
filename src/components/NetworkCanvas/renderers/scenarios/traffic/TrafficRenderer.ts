import { BaseRenderer, RenderOptions } from '../../BaseRenderer';

export class TrafficRenderer extends BaseRenderer {
  protected drawBackground(options: RenderOptions) {
    // Traffic scenario doesn't have a specific background overlay yet,
    // but this class allows for future expansion (e.g. drawing city blocks).
  }
}
