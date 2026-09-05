import { expect, it } from 'vitest'; import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('rejects empty mission objectives', () => expect(() => new LumexusSwarmKernel().createMission({name:'x',objective:' ',scope:[{resource:'x',actions:['inspect']}]})).toThrow('required'));
