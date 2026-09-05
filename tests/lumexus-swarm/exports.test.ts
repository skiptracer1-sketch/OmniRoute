import { describe, expect, it } from 'vitest';
import { LumexusSwarmKernel, SECURITY_AGENT_REGISTRY, SECURITY_ROLES } from '../../src/lumexus-swarm/exports';

describe('native swarm exports', () => {
  it('exposes kernel and complete security registry', () => {
    expect(new LumexusSwarmKernel()).toBeInstanceOf(LumexusSwarmKernel);
    expect(Object.keys(SECURITY_AGENT_REGISTRY)).toHaveLength(SECURITY_ROLES.length);
  });
});
