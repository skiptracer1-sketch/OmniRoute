import { expect, it } from 'vitest';
import { LumexusSwarmKernel, SwarmRuntimePulseBridge } from '../../src/lumexus-swarm/complete';
it('exports the kernel and Runtime Pulse bridge', () => {
  expect(LumexusSwarmKernel).toBeDefined();
  expect(SwarmRuntimePulseBridge).toBeDefined();
});
