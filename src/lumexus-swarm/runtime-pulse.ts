import type { RuntimePulseSnapshot } from './types';

export interface RuntimePulseAdapter {
  publish(snapshot: RuntimePulseSnapshot): Promise<void> | void;
}

export class SwarmRuntimePulseBridge {
  constructor(private readonly adapter: RuntimePulseAdapter) {}
  publish(snapshot: RuntimePulseSnapshot) { return this.adapter.publish(snapshot); }
}
