import { expect, it } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('rejects missions without explicit scope', () => {
  expect(() => new LumexusSwarmKernel().createMission({ name: 'unsafe', objective: 'scan everything', scope: [] })).toThrow('scope');
});
