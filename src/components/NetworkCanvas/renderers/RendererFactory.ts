import { ScenarioType } from '../../../types';
import { BaseRenderer } from './BaseRenderer';
import { EvacuationRenderer } from './scenarios/evacuation/EvacuationRenderer';
import { GameAIRenderer } from './scenarios/gameai/GameAIRenderer';
import { NetworkRenderer } from './scenarios/network/NetworkRenderer';
import { RoboticsRenderer } from './scenarios/robotics/RoboticsRenderer';
import { TrafficRenderer } from './scenarios/traffic/TrafficRenderer';

export class RendererFactory {
  private static renderers = new Map<ScenarioType, BaseRenderer>([
    ['evacuation', new EvacuationRenderer()],
    ['gameai', new GameAIRenderer()],
    ['network', new NetworkRenderer()],
    ['robotics', new RoboticsRenderer()],
    ['traffic', new TrafficRenderer()],
  ]);

  // Fallback to a generic BaseRenderer if needed (Traffic acts as an empty default)
  private static defaultRenderer = new TrafficRenderer();

  static getRenderer(scenario: ScenarioType): BaseRenderer {
    return this.renderers.get(scenario) || this.defaultRenderer;
  }
}
