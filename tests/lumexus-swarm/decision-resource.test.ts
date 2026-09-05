import { expect, it } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('preserves approval resource and action', () => {
  const kernel = new LumexusSwarmKernel(); const mission = kernel.createMission({ name: 'sandbox', objective: 'verify', scope: [{ resource: 'sandbox.example', actions: ['verify'] }] });
  kernel.evaluateTool({ missionId: mission.id, agentId: 'verification', resource: 'sandbox.example', action: 'verify', risk: 'critical' });
  expect(kernel.listApprovals(mission.id)[0]).toEqual(expect.objectContaining({ resource: 'sandbox.example', action: 'verify', risk: 'critical' }));
});
