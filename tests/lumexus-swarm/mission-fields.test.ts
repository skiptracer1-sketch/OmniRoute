import { expect, it } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('preserves mission objective and explicit scope', () => {
  const mission = new LumexusSwarmKernel().createMission({ name: 'sandbox', objective: 'authorized inspection', scope: [{ resource: 'sandbox.example', actions: ['inspect'] }] });
  expect(mission.objective).toBe('authorized inspection');
  expect(mission.scope[0]?.resource).toBe('sandbox.example');
});
