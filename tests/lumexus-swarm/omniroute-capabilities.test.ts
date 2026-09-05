import { expect, it, vi } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
import { SecuritySwarmRuntime } from '../../src/lumexus-swarm/runtime';
it('passes role capabilities into OmniRoute routing', async () => {
  const kernel = new LumexusSwarmKernel();
  const mission = kernel.createMission({ name: 'sandbox', objective: 'inspect', scope: [{ resource: 'sandbox.example', actions: ['inspect'] }] });
  const route = vi.fn().mockResolvedValue({ provider: 'x', model: 'y' });
  await new SecuritySwarmRuntime(kernel, { route }).routeAgent(mission, 'a1', 'recon');
  expect(route).toHaveBeenCalledWith(expect.objectContaining({ preferredCapabilities: ['inspect'] }));
});
