import { SECURITY_ROLES, type SecurityRole, type SwarmMission } from './types';
import type { SecuritySwarmRuntime } from './runtime';

export class SecuritySwarmSupervisor {
  constructor(private readonly runtime: SecuritySwarmRuntime) {}
  async plan(mission: SwarmMission): Promise<Array<{ role: SecurityRole; route: { provider: string; model: string } }>> {
    const planned = [] as Array<{ role: SecurityRole; route: { provider: string; model: string } }>;
    for (const role of SECURITY_ROLES) {
      const route = await this.runtime.routeAgent(mission, `${mission.id}:${role}`, role);
      planned.push({ role, route });
    }
    return planned;
  }
}
