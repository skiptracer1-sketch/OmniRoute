import { expect, it } from 'vitest'; import { LumexusSwarmCommandCenter } from '../../src/lumexus-swarm/api';
it('exposes Runtime Pulse for command-center consumers',()=>{const c=new LumexusSwarmCommandCenter();const m=c.createSecurityMission({name:'x',objective:'x',scope:[{resource:'x',actions:['inspect']}]});expect(c.runtimePulse(m.id).missionId).toBe(m.id);});
