import { describe, expect, it, vi } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
import { SwarmToolGateway } from '../../src/lumexus-swarm/tool-gateway';

describe('SwarmToolGateway', () => {
  it('never executes an out-of-scope action', async () => {
    const kernel = new LumexusSwarmKernel();
    const mission = kernel.createMission({ name: 'sandbox', objective: 'inspect', scope: [{ resource: 'sandbox.example', actions: ['inspect'] }] });
    const execute = vi.fn();
    const gateway = new SwarmToolGateway(kernel, { execute });
    const result = await gateway.execute({ missionId: mission.id, agentId: 'agent-1', resource: 'production.example', action: 'inspect', risk: 'low' });
    expect(result.status).toBe('denied');
    expect(execute).not.toHaveBeenCalled();
  });

  it('never executes a high-risk action before approval', async () => {
    const kernel = new LumexusSwarmKernel();
    const mission = kernel.createMission({ name: 'sandbox', objective: 'verify', scope: [{ resource: 'sandbox.example', actions: ['verify'] }] });
    const execute = vi.fn();
    const gateway = new SwarmToolGateway(kernel, { execute });
    const result = await gateway.execute({ missionId: mission.id, agentId: 'agent-1', resource: 'sandbox.example', action: 'verify', risk: 'high' });
    expect(result.status).toBe('approval-required');
    expect(execute).not.toHaveBeenCalled();
  });
});
