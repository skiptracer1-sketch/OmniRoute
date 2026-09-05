import { expect, it } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('creates auditable mission lifecycle events', () => {
  const kernel = new LumexusSwarmKernel();
  const mission = kernel.createMission({ name: 'sandbox', objective: 'inspect', scope: [{ resource: 'sandbox.example', actions: ['inspect'] }] });
  kernel.startMission(mission.id);
  expect(kernel.listEvents(mission.id).map(e => e.type)).toEqual(['mission.created', 'mission.started']);
});
