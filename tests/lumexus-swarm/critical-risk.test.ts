import { expect, it, vi } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
import { SwarmToolGateway } from '../../src/lumexus-swarm/tool-gateway';
it('does not execute critical actions without approval', async () => {
  const kernel = new LumexusSwarmKernel();
  const mission = kernel.createMission({ name: 'sandbox', objective: 'verify', scope: [{ resource: 'sandbox.example', actions: ['verify'] }] });
  const execute = vi.fn();
  const result = await new SwarmToolGateway(kernel, { execute }).execute({ missionId: mission.id, agentId: 'verification', resource: 'sandbox.example', action: 'verify', risk: 'critical' });
  expect(result.status).toBe('approval-required');
  expect(execute).not.toHaveBeenCalled();
});
