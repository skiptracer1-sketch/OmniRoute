import { expect, it } from 'vitest'; import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('transitions mission to running',()=>{const k=new LumexusSwarmKernel();const m=k.createMission({name:'x',objective:'x',scope:[{resource:'x',actions:['inspect']}]});expect(k.startMission(m.id).status).toBe('running');});
