import { expect, it } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('generates unique mission identifiers', () => {
  const kernel = new LumexusSwarmKernel(); const scope = [{ resource: 'sandbox.example', actions: ['inspect'] }];
  const a = kernel.createMission({ name: 'a', objective: 'inspect', scope }); const b = kernel.createMission({ name: 'b', objective: 'inspect', scope });
  expect(a.id).not.toBe(b.id);
});
