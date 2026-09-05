import { expect, it } from 'vitest'; import { SECURITY_AGENT_REGISTRY } from '../../src/lumexus-swarm/security-registry';
it('contains no production mutation default action',()=>expect(Object.values(SECURITY_AGENT_REGISTRY).flatMap(x=>[...x.defaultActions])).not.toContain('mutate-production'));
