import { expect, it } from 'vitest';
import { LUMEXUS_SWARM_V01_CAPABILITIES, LumexusSwarmKernel, requiresDecisionQueue } from '../../src/lumexus-swarm/package';
it('loads the release facade with safe defaults', () => {
  expect(LumexusSwarmKernel).toBeDefined();
  expect(requiresDecisionQueue('critical')).toBe(true);
  expect(LUMEXUS_SWARM_V01_CAPABILITIES.autonomousExploit).toBe(false);
});
