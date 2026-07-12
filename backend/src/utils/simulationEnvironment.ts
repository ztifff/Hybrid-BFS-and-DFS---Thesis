import { DynamicEvent, AlgorithmStep } from '../types';

export interface DynamicEventPayload {
  nodeId: string;
  blocked: boolean;
  stepIndex: number;
}

export interface PathfinderObserver {
  update(event: DynamicEventPayload): void;
}

export class SimulationEnvironment {
  private observers: PathfinderObserver[] = [];
  private currentFrame = 1;
  private dynamicEvents: DynamicEvent[];
  public stepCallback?: (step: AlgorithmStep) => void;

  constructor(dynamicEvents: DynamicEvent[], stepCallback?: (step: AlgorithmStep) => void) {
    this.dynamicEvents = dynamicEvents;
    this.stepCallback = stepCallback;
  }

  public registerObserver(observer: PathfinderObserver) {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  public removeObserver(observer: PathfinderObserver) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  private notifyObservers(event: DynamicEventPayload) {
    for (const obs of this.observers) {
      obs.update(event);
    }
  }

  public tick(step: AlgorithmStep) {
    // 1. Check for events that occur exactly at this frame
    for (const event of this.dynamicEvents) {
      if (event.stepIndex > 0 && event.stepIndex === this.currentFrame) {
        this.notifyObservers({
          nodeId: event.nodeId,
          blocked: event.blocked,
          stepIndex: event.stepIndex
        });
      }
    }
    
    this.currentFrame++;
    if (this.stepCallback) {
      this.stepCallback(step);
    }
  }
}
