import { expect, it, vi } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
import { SwarmToolGateway } from '../../src/lumexus-swarm/tool-gateway';
it('allows in-scope medium-risk actions through the bounded executor', async () => {
  const kernel = new LumexusSwarmKernel();
  const mission = kernel.createMission({ name: 'sandbox', objective: 'inspect', scope: [{ resource: 'sandbox.example', actions: ['inspect'] }] });
  const execute = vi.fn().mockResolvedValue('ok');
  const result = await new SwarmToolGateway(kernel, { execute }).execute({ missionId: mission.id, agentId: 'recon', resource: 'sandbox.example', action: 'inspect', risk: 'medium' });
  expect(result.status).toBe('executed');
  expect(execute).toHaveBeenCalledTimes(1);
});
