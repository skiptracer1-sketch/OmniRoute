import { expect, it } from 'vitest'; import { LumexusSwarmCommandCenter } from '../../src/lumexus-swarm/api';
it('activates kernel kill switch from command center',()=>{const c=new LumexusSwarmCommandCenter();c.emergencyStop();expect(c.kernel.isKilled()).toBe(true);});
