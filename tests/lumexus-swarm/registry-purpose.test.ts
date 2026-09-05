import { expect, it } from 'vitest';
import { SECURITY_AGENT_REGISTRY } from '../../src/lumexus-swarm/security-registry';
it('documents a purpose for every security role', () => {
  for (const definition of Object.values(SECURITY_AGENT_REGISTRY)) expect(definition.purpose.length).toBeGreaterThan(10);
});
