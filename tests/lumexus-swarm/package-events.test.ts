import { expect, it } from 'vitest'; import { SwarmEventFabric } from '../../src/lumexus-swarm/package'; it('exports event fabric through package surface',()=>expect(SwarmEventFabric).toBeDefined());
