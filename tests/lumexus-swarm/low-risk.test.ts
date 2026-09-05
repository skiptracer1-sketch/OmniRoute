import { expect, it } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('allows low-risk authorized requests', () => {
  const kernel = new LumexusSwarmKernel();
  const mission = kernel.createMission({ name: 'sandbox', objective: 'inspect', scope: [{ resource: 'sandbox.example', actions: ['inspect'] }] });
  expect(kernel.evaluateTool({ missionId: mission.id, agentId: 'recon', resource: 'sandbox.example', action: 'inspect', risk: 'low' }).outcome).toBe('allow');
});
