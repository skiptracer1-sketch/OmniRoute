import { expect, it } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('fails closed for unknown mission ids', () => {
  expect(() => new LumexusSwarmKernel().pulse('missing')).toThrow('unknown mission');
});
