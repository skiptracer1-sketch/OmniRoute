import { expect, it, vi } from 'vitest';
import { SwarmEventFabric } from '../../src/lumexus-swarm/events';
it('publishes only to matching event subscribers', () => {
  const fabric = new SwarmEventFabric();
  const handler = vi.fn();
  fabric.subscribe('finding.recorded', handler);
  fabric.publish({ id: 'e1', missionId: 'm1', type: 'finding.recorded', timestamp: new Date().toISOString(), payload: {} });
  expect(handler).toHaveBeenCalledTimes(1);
});
