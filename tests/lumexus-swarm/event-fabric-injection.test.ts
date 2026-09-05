import { expect, it } from 'vitest'; import { SwarmEventFabric } from '../../src/lumexus-swarm/events'; it('instantiates event fabric',()=>expect(new SwarmEventFabric()).toBeDefined());
