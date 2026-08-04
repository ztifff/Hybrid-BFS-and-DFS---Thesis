import { RenderOptions } from './renderers/BaseRenderer';
import { RendererFactory } from './renderers/RendererFactory';

export function renderCanvas(options: RenderOptions) {
  const renderer = RendererFactory.getRenderer(options.scenario);
  renderer.render(options);
}
