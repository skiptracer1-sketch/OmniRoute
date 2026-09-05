import { expect, it } from 'vitest';
import { SECURITY_AGENT_REGISTRY } from '../../src/lumexus-swarm/security-registry';
it('keeps reporting role read/report only', () => expect(SECURITY_AGENT_REGISTRY.reporting.defaultActions).toEqual(['inspect', 'report']));
