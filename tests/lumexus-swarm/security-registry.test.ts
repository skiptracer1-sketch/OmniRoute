import { describe, expect, it } from 'vitest';
import { SECURITY_ROLES } from '../../src/lumexus-swarm/types';
import { SECURITY_AGENT_REGISTRY } from '../../src/lumexus-swarm/security-registry';

describe('security agent registry', () => {
  it('defines every native security role', () => {
    expect(Object.keys(SECURITY_AGENT_REGISTRY).sort()).toEqual([...SECURITY_ROLES].sort());
  });

  it('keeps production mutation out of default capabilities', () => {
    for (const definition of Object.values(SECURITY_AGENT_REGISTRY)) {
      expect(definition.defaultActions).not.toContain('mutate-production');
      expect(definition.defaultActions).not.toContain('exploit');
    }
  });
});
