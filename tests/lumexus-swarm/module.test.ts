import { expect, it } from 'vitest';
import { LUMEXUS_NATIVE_SWARM_VERSION, LumexusSwarmKernel, SecuritySwarmSupervisor, SwarmBlackboard } from '../../src/lumexus-swarm/module';
it('loads the complete native swarm module', () => {
  expect(LUMEXUS_NATIVE_SWARM_VERSION).toBe('0.1.0');
  expect(LumexusSwarmKernel).toBeDefined();
  expect(SecuritySwarmSupervisor).toBeDefined();
  expect(SwarmBlackboard).toBeDefined();
});
