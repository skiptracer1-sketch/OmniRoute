import { expect, it } from 'vitest'; import { SwarmBlackboard } from '../../src/lumexus-swarm/blackboard'; it('instantiates mission blackboard',()=>expect(new SwarmBlackboard()).toBeDefined());
