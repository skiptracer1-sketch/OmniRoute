import { expect, it, vi } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
import { SecuritySwarmRuntime } from '../../src/lumexus-swarm/runtime';
import { SecuritySwarmSupervisor } from '../../src/lumexus-swarm/supervisor';
import { SECURITY_ROLES } from '../../src/lumexus-swarm/types';
it('plans every security role through OmniRoute', async () => {
  const kernel = new LumexusSwarmKernel();
  const mission = kernel.createMission({ name: 'sandbox', objective: 'inspect', scope: [{ resource: 'sandbox.example', actions: ['inspect'] }] });
  const route = vi.fn().mockResolvedValue({ provider: 'test', model: 'test' });
  const supervisor = new SecuritySwarmSupervisor(new SecuritySwarmRuntime(kernel, { route }));
  expect(await supervisor.plan(mission)).toHaveLength(SECURITY_ROLES.length);
  expect(route).toHaveBeenCalledTimes(SECURITY_ROLES.length);
});
