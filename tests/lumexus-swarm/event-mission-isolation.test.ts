import { expect, it } from 'vitest'; import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('isolates event streams by mission', () => { const k=new LumexusSwarmKernel(); const s=[{resource:'x',actions:['inspect']}]; const a=k.createMission({name:'a',objective:'x',scope:s}); k.createMission({name:'b',objective:'x',scope:s}); expect(k.listEvents(a.id)).toHaveLength(1); });
