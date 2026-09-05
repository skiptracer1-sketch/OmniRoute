import { expect, it, vi } from 'vitest';
import { LumexusSwarmKernel, SecuritySwarmRuntime, SecuritySwarmSupervisor, SwarmToolGateway } from '../../src/lumexus-swarm/module';

it('runs a bounded security-swarm vertical slice', async () => {
  const kernel = new LumexusSwarmKernel();
  const mission = kernel.createMission({ name: 'sandbox', objective: 'authorized validation', scope: [{ resource: 'sandbox.example', actions: ['inspect', 'verify'] }] });
  kernel.startMission(mission.id);
  const route = vi.fn().mockResolvedValue({ provider: 'omniroute-test', model: 'safe-test-model' });
  const runtime = new SecuritySwarmRuntime(kernel, { route });
  await new SecuritySwarmSupervisor(runtime).plan(mission);
  const execute = vi.fn().mockResolvedValue({ ok: true });
  const gateway = new SwarmToolGateway(kernel, { execute });
  expect((await gateway.execute({ missionId: mission.id, agentId: 'recon', resource: 'sandbox.example', action: 'inspect', risk: 'low' })).status).toBe('executed');
  expect((await gateway.execute({ missionId: mission.id, agentId: 'verification', resource: 'sandbox.example', action: 'verify', risk: 'high' })).status).toBe('approval-required');
  expect(execute).toHaveBeenCalledTimes(1);
  expect(kernel.pulse(mission.id).approvalsPending).toBe(1);
});
