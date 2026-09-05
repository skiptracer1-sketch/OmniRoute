import { describe, expect, it } from 'vitest';
import { LumexusSwarmCommandCenter, SECURITY_ROLES } from '../../src/lumexus-swarm/v0';

describe('Lumexus Native Swarm v0.1', () => {
  it('boots through the consolidated module surface', () => {
    const command = new LumexusSwarmCommandCenter();
    expect(command).toBeDefined();
    expect(SECURITY_ROLES).toContain('verification');
  });
});
