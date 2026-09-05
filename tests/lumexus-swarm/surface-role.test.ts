import { expect, it } from 'vitest';
import { SECURITY_AGENT_REGISTRY } from '../../src/lumexus-swarm/security-registry';
it('keeps surface analysis passive', () => expect(SECURITY_AGENT_REGISTRY['surface-analysis'].defaultActions).toEqual(['inspect']));
