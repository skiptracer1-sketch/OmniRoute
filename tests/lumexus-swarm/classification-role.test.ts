import { expect, it } from 'vitest';
import { SECURITY_AGENT_REGISTRY } from '../../src/lumexus-swarm/security-registry';
it('keeps vulnerability classification analytical', () => expect(SECURITY_AGENT_REGISTRY['vulnerability-classification'].defaultActions).toEqual(['inspect']));
