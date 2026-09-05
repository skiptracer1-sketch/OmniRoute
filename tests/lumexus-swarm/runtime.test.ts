import { describe, expect, it, vi } from 'vitest';
import { LumexusSwarmKernel } from '../../src/lumexus-swarm/kernel';
import { SecuritySwarmRuntime } from '../../src/lumexus-swarm/runtime';

describe('SecuritySwarmRuntime', () => {
  it('routes agent intelligence through an OmniRoute adapter', async () => {
    const kernel = new LumexusSwarmKernel();
    const mission = kernel.createMission({ name: 'sandbox', objective: 'map authorized surface', scope: [{ resource: 'sandbox.example', actions: ['inspect'] }] });
    const route = vi.fn().mockResolvedValue({ provider: 'test', model: 'test-model' });
    const runtime = new SecuritySwarmRuntime(kernel, { route });
    const result = await runtime.routeAgent(mission, 'agent-1', 'recon');
    expect(result.model).toBe('test-model');
    expect(route).toHaveBeenCalledWith(expect.objectContaining({ missionId: mission.id, role: 'recon' }));
  });
});
