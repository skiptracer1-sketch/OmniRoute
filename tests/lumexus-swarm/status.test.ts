import { expect, it } from 'vitest';
import { LUMEXUS_SWARM_V01_CAPABILITIES } from '../../src/lumexus-swarm/status';
it('keeps exploit and production mutation disabled', () => {
  expect(LUMEXUS_SWARM_V01_CAPABILITIES.autonomousExploit).toBe(false);
  expect(LUMEXUS_SWARM_V01_CAPABILITIES.productionMutation).toBe(false);
  expect(LUMEXUS_SWARM_V01_CAPABILITIES.securityRoles).toBe(7);
});
