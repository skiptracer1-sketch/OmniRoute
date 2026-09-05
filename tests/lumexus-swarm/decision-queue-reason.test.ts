import { expect, it } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('records why an elevated action requires approval', () => {
  const kernel = new LumexusSwarmKernel();
  const mission = kernel.createMission({ name: 'sandbox', objective: 'verify', scope: [{ resource: 'sandbox.example', actions: ['verify'] }] });
  kernel.evaluateTool({ missionId: mission.id, agentId: 'verification', resource: 'sandbox.example', action: 'verify', risk: 'high' });
  expect(kernel.listApprovals(mission.id)[0]?.reason).toContain('Crazy E Decision Queue');
});
