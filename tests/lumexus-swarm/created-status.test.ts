import { expect, it } from 'vitest'; import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('creates missions in created state',()=>{const m=new LumexusSwarmKernel().createMission({name:'x',objective:'x',scope:[{resource:'x',actions:['inspect']}]}); expect(m.status).toBe('created');});
