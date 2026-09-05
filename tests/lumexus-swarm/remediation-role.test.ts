import { expect, it } from 'vitest';
import { SECURITY_AGENT_REGISTRY } from '../../src/lumexus-swarm/security-registry';
it('keeps remediation role planning-only', () => expect(SECURITY_AGENT_REGISTRY['remediation-planning'].defaultActions).toEqual(['inspect', 'plan']));
