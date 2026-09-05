import { expect, it } from 'vitest';
import { LUMEXUS_NATIVE_SWARM_VERSION } from '../../src/lumexus-swarm/version';
it('identifies Lumexus Native Swarm v0.1', () => expect(LUMEXUS_NATIVE_SWARM_VERSION).toBe('0.1.0'));
