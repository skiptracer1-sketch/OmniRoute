import { describe, expect, it } from 'vitest';
import { LumexusSwarmCommandCenter } from '../../src/lumexus-swarm/api';

describe('LumexusSwarmCommandCenter', () => {
  it('creates starts and projects a security mission', () => {
    const command = new LumexusSwarmCommandCenter();
    const mission = command.createSecurityMission({ name: 'authorized sandbox', objective: 'inspect', scope: [{ resource: 'sandbox.example', actions: ['inspect'] }] });
    command.start(mission.id);
    expect(command.runtimePulse(mission.id).status).toBe('running');
  });
});
