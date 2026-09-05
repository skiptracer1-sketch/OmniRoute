import { expect, it } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
it('preserves evidence attached to a finding', () => {
  const kernel = new LumexusSwarmKernel();
  const mission = kernel.createMission({ name: 'sandbox', objective: 'inspect', scope: [{ resource: 'sandbox.example', actions: ['inspect'] }] });
  const finding = kernel.recordFinding({ missionId: mission.id, agentId: 'recon', title: 'header', severity: 'low', evidence: ['capture-001'] });
  expect(finding.evidence).toEqual(['capture-001']);
});
