import { expect, it } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('initializes all seven agents as idle', () => { const k = new LumexusSwarmKernel(); const m = k.createMission({ name:'x', objective:'inspect', scope:[{resource:'sandbox.example',actions:['inspect']}]}); expect(k.pulse(m.id).agentCounts.idle).toBe(7); });
