import { expect, it } from 'vitest';
import { SwarmBlackboard } from '../../src/lumexus-swarm/blackboard';
it('isolates blackboard entries by mission', () => {
  const board = new SwarmBlackboard();
  board.put({ missionId: 'm1', key: 'surface', value: ['a'], sourceAgentId: 'a1' });
  board.put({ missionId: 'm2', key: 'surface', value: ['b'], sourceAgentId: 'a2' });
  expect(board.get('m1', 'surface')).toHaveLength(1);
  expect(board.get('m1', 'surface')[0]?.value).toEqual(['a']);
});
