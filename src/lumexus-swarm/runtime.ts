import { LumexusSwarmKernel } from './kernel';
import { SECURITY_AGENT_REGISTRY } from './security-registry';
import type { RiskLevel, SecurityRole, SwarmMission, ToolPolicyDecision } from './types';

export interface RoutedAgentTask {
  missionId: string;
  agentId: string;
  role: SecurityRole;
  objective: string;
  preferredCapabilities: readonly string[];
}

export interface OmniRouteAdapter {
  route(task: RoutedAgentTask): Promise<{ provider: string; model: string }>;
}

export class SecuritySwarmRuntime {
  constructor(
    readonly kernel: LumexusSwarmKernel,
    private readonly omniRoute: OmniRouteAdapter,
  ) {}

  async routeAgent(mission: SwarmMission, agentId: string, role: SecurityRole) {
    const definition = SECURITY_AGENT_REGISTRY[role];
    return this.omniRoute.route({
      missionId: mission.id,
      agentId,
      role,
      objective: mission.objective,
      preferredCapabilities: definition.defaultActions,
    });
  }

  requestTool(missionId: string, agentId: string, resource: string, action: string, risk: RiskLevel): ToolPolicyDecision {
    return this.kernel.evaluateTool({ missionId, agentId, resource, action, risk });
  }
}
