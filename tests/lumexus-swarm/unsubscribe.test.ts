import { expect, it, vi } from 'vitest';
import { SwarmEventFabric } from '../../src/lumexus-swarm/events';
it('supports event subscriber removal', () => {
  const fabric = new SwarmEventFabric(); const handler = vi.fn(); const off = fabric.subscribe('finding.recorded', handler); off();
  fabric.publish({ id: 'e1', missionId: 'm1', type: 'finding.recorded', timestamp: new Date().toISOString(), payload: {} });
  expect(handler).not.toHaveBeenCalled();
});
