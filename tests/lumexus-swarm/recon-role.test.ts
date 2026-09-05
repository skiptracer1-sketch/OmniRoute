import { expect, it } from 'vitest';
import { SECURITY_AGENT_REGISTRY } from '../../src/lumexus-swarm/security-registry';
it('keeps recon passive by default', () => { expect(SECURITY_AGENT_REGISTRY.recon.defaultActions).toEqual(['inspect']); expect(SECURITY_AGENT_REGISTRY.recon.canRequestHighRisk).toBe(false); });
