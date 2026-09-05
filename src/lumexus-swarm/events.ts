import type { SwarmEvent, SwarmEventType } from './types';

export class SwarmEventFabric {
  private readonly subscribers = new Map<SwarmEventType, Set<(event: SwarmEvent) => void>>();
  subscribe(type: SwarmEventType, handler: (event: SwarmEvent) => void): () => void {
    const set = this.subscribers.get(type) ?? new Set();
    set.add(handler);
    this.subscribers.set(type, set);
    return () => set.delete(handler);
  }
  publish(event: SwarmEvent): void {
    for (const handler of this.subscribers.get(event.type) ?? []) handler(event);
  }
}
