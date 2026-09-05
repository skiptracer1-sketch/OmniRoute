import { expect, it } from 'vitest';
import { LUMEXUS_SWARM_V01_CAPABILITIES } from '../../src/lumexus-swarm/status';
it('ships Lumexus-owned bounded capabilities only', () => {
  expect(LUMEXUS_SWARM_V01_CAPABILITIES.toolGateway).toBe(true);
  expect(LUMEXUS_SWARM_V01_CAPABILITIES.autonomousExploit).toBe(false);
});
