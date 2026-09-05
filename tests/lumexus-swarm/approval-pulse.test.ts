import { expect, it } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('projects pending approval count into Runtime Pulse', () => {
  const kernel = new LumexusSwarmKernel();
  const mission = kernel.createMission({ name: 'sandbox', objective: 'verify', scope: [{ resource: 'sandbox.example', actions: ['verify'] }] });
  kernel.evaluateTool({ missionId: mission.id, agentId: 'verification', resource: 'sandbox.example', action: 'verify', risk: 'high' });
  expect(kernel.pulse(mission.id).approvalsPending).toBe(1);
});
