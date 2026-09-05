import { expect, it } from 'vitest';
import { SECURITY_AGENT_REGISTRY } from '../../src/lumexus-swarm/security-registry';
it('gives elevated request ability only to verification-style roles', () => {
  const elevated = Object.values(SECURITY_AGENT_REGISTRY).filter(x => x.canRequestHighRisk).map(x => x.role).sort();
  expect(elevated).toEqual(['regression', 'verification']);
});
