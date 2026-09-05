import { LumexusSwarmKernel } from './kernel';
import type { ScopeRule } from './types';

export class LumexusSwarmCommandCenter {
  constructor(readonly kernel = new LumexusSwarmKernel()) {}

  createSecurityMission(input: { name: string; objective: string; scope: ScopeRule[] }) {
    return this.kernel.createMission(input);
  }

  start(missionId: string) { return this.kernel.startMission(missionId); }
  runtimePulse(missionId: string) { return this.kernel.pulse(missionId); }
  pendingDecisions(missionId: string) { return this.kernel.listApprovals(missionId); }
  emergencyStop() { this.kernel.kill(); }
}
