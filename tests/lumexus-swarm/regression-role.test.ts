import { expect, it } from 'vitest';
import { SECURITY_AGENT_REGISTRY } from '../../src/lumexus-swarm/security-registry';
it('marks regression verification as approval-capable', () => { expect(SECURITY_AGENT_REGISTRY.regression.defaultActions).toContain('verify'); expect(SECURITY_AGENT_REGISTRY.regression.canRequestHighRisk).toBe(true); });
