import { expect, it } from 'vitest';
import { SECURITY_AGENT_REGISTRY } from '../../src/lumexus-swarm/security-registry';
it('marks verification as approval-capable rather than autonomous', () => { expect(SECURITY_AGENT_REGISTRY.verification.defaultActions).toContain('verify'); expect(SECURITY_AGENT_REGISTRY.verification.canRequestHighRisk).toBe(true); });
