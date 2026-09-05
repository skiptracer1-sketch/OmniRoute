import { expect, it } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('emits an audit event when a finding is recorded', () => {
  const kernel = new LumexusSwarmKernel();
  const mission = kernel.createMission({ name: 'sandbox', objective: 'inspect', scope: [{ resource: 'sandbox.example', actions: ['inspect'] }] });
  kernel.recordFinding({ missionId: mission.id, agentId: 'recon', title: 'header', severity: 'low', evidence: ['capture'] });
  expect(kernel.listEvents(mission.id).at(-1)?.type).toBe('finding.recorded');
});
