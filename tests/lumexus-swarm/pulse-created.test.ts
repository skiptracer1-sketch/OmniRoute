import { expect, it } from 'vitest'; import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('projects created status before mission start',()=>{const k=new LumexusSwarmKernel();const m=k.createMission({name:'x',objective:'x',scope:[{resource:'x',actions:['inspect']}]});expect(k.pulse(m.id).status).toBe('created');});
