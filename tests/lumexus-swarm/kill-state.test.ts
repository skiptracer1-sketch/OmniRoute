import { expect, it } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('reports emergency stop state', () => { const kernel = new LumexusSwarmKernel(); expect(kernel.isKilled()).toBe(false); kernel.kill(); expect(kernel.isKilled()).toBe(true); });
