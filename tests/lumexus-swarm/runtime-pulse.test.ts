import { expect, it, vi } from 'vitest';
import { SwarmRuntimePulseBridge } from '../../src/lumexus-swarm/runtime-pulse';
it('publishes swarm state to Runtime Pulse boundary', async () => {
  const publish = vi.fn();
  const bridge = new SwarmRuntimePulseBridge({ publish });
  const snapshot = { missionId: 'm1', status: 'running' as const, agentCounts: { idle: 7, running: 0, blocked: 0, completed: 0, failed: 0 }, findings: 0, approvalsPending: 0 };
  await bridge.publish(snapshot);
  expect(publish).toHaveBeenCalledWith(snapshot);
});
