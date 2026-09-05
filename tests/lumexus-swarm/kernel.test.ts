import { describe, expect, it } from 'vitest';
import { LumexusSwarmKernel, SECURITY_ROLES } from '../../src/lumexus-swarm';

describe('LumexusSwarmKernel', () => {
  const create = () => {
    const kernel = new LumexusSwarmKernel();
    const mission = kernel.createMission({
      name: 'sandbox security validation',
      objective: 'validate authorized sandbox surface',
      scope: [{ resource: 'sandbox.example', actions: ['inspect', 'verify'] }],
    });
    return { kernel, mission };
  };

  it('creates the complete security role roster and runtime pulse', () => {
    const { kernel, mission } = create();
    kernel.startMission(mission.id);
    const pulse = kernel.pulse(mission.id);
    expect(pulse.status).toBe('running');
    expect(pulse.agentCounts.idle).toBe(SECURITY_ROLES.length);
    expect(pulse.findings).toBe(0);
  });

  it('denies requests outside the authorized mission scope', () => {
    const { kernel, mission } = create();
    const decision = kernel.evaluateTool({ missionId: mission.id, agentId: 'agent-1', resource: 'production.example', action: 'inspect', risk: 'low' });
    expect(decision.outcome).toBe('deny');
    expect(kernel.listEvents(mission.id).some(e => e.type === 'tool.denied')).toBe(true);
  });

  it('routes high-risk in-scope actions to the Decision Queue instead of executing', () => {
    const { kernel, mission } = create();
    const decision = kernel.evaluateTool({ missionId: mission.id, agentId: 'agent-1', resource: 'sandbox.example', action: 'verify', risk: 'high' });
    expect(decision.outcome).toBe('approval-required');
    expect(kernel.listApprovals(mission.id)).toHaveLength(1);
    expect(kernel.pulse(mission.id).status).toBe('waiting-approval');
  });

  it('records evidence-backed findings in Runtime Pulse', () => {
    const { kernel, mission } = create();
    kernel.recordFinding({ missionId: mission.id, agentId: 'agent-1', title: 'Missing security header', severity: 'medium', evidence: ['response-header-capture'] });
    expect(kernel.pulse(mission.id).findings).toBe(1);
  });

  it('blocks tool evaluation after the global kill switch activates', () => {
    const { kernel, mission } = create();
    kernel.kill();
    expect(() => kernel.evaluateTool({ missionId: mission.id, agentId: 'agent-1', resource: 'sandbox.example', action: 'inspect', risk: 'low' })).toThrow('kill switch');
  });
});
