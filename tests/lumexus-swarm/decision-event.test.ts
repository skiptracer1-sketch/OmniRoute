import { expect, it } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('emits approval and waiting events for elevated actions', () => {
  const kernel = new LumexusSwarmKernel();
  const mission = kernel.createMission({ name: 'sandbox', objective: 'verify', scope: [{ resource: 'sandbox.example', actions: ['verify'] }] });
  kernel.evaluateTool({ missionId: mission.id, agentId: 'verification', resource: 'sandbox.example', action: 'verify', risk: 'high' });
  const types = kernel.listEvents(mission.id).map(e => e.type);
  expect(types).toContain('tool.approval-required');
  expect(types).toContain('mission.waiting-approval');
});
