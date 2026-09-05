import { expect, it } from 'vitest'; import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('rejects empty mission names', () => expect(() => new LumexusSwarmKernel().createMission({name:' ',objective:'inspect',scope:[{resource:'x',actions:['inspect']}]})).toThrow('required'));
