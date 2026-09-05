import { describe, expect, it, vi } from 'vitest';
import { SwarmApprovalBridge } from '../../src/lumexus-swarm/approval';

describe('SwarmApprovalBridge', () => {
  it('submits approval records to the external Decision Queue boundary', async () => {
    const submit = vi.fn().mockResolvedValue({ decisionId: 'decision-1' });
    const bridge = new SwarmApprovalBridge({ submit });
    const request = { id: 'approval-1', missionId: 'mission-1', agentId: 'agent-1', resource: 'sandbox.example', action: 'verify', risk: 'high' as const, reason: 'approval required', createdAt: new Date().toISOString() };
    await expect(bridge.submit(request)).resolves.toEqual({ decisionId: 'decision-1' });
    expect(submit).toHaveBeenCalledWith(request);
  });
});
