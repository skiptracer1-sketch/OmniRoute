import { expect, it } from 'vitest';
import { requiresDecisionQueue } from '../../src/lumexus-swarm/tool-risk';
it('requires approval for high and critical risk only', () => {
  expect(requiresDecisionQueue('low')).toBe(false);
  expect(requiresDecisionQueue('medium')).toBe(false);
  expect(requiresDecisionQueue('high')).toBe(true);
  expect(requiresDecisionQueue('critical')).toBe(true);
});
