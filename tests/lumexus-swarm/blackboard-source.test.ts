import { expect, it } from 'vitest';
import { SwarmBlackboard } from '../../src/lumexus-swarm/blackboard';
it('preserves agent provenance on shared blackboard entries', () => {
  const entry = new SwarmBlackboard().put({ missionId: 'm1', key: 'finding', value: 'x', sourceAgentId: 'verification' });
  expect(entry.sourceAgentId).toBe('verification');
  expect(entry.recordedAt).toBeTruthy();
});
