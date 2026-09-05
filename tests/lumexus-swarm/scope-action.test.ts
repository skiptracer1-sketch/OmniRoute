import { expect, it } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('denies an unapproved action even on an approved resource', () => {
  const kernel = new LumexusSwarmKernel();
  const mission = kernel.createMission({ name: 'sandbox', objective: 'inspect', scope: [{ resource: 'sandbox.example', actions: ['inspect'] }] });
  expect(kernel.evaluateTool({ missionId: mission.id, agentId: 'recon', resource: 'sandbox.example', action: 'verify', risk: 'low' }).outcome).toBe('deny');
});
