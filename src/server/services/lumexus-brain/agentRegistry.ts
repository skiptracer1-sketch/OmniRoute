import type { AgentDefinition, BrainTask, BusinessUnitId } from "../../../domain/lumexus-brain/types.ts";

export interface AgentExecutionCheck {
  allowed: boolean;
  reason: string;
}

export class AgentRegistry {
  private readonly agents = new Map<string, AgentDefinition>();

  register(definition: AgentDefinition): AgentDefinition {
    const stored = structuredClone(definition);
    this.agents.set(stored.id, stored);
    return structuredClone(stored);
  }

  get(id: string): AgentDefinition | undefined {
    const agent = this.agents.get(id);
    return agent ? structuredClone(agent) : undefined;
  }

  list(businessUnitId?: BusinessUnitId): AgentDefinition[] {
    return [...this.agents.values()]
      .filter((agent) => !businessUnitId || agent.businessScopes.includes(businessUnitId))
      .map((agent) => structuredClone(agent));
  }

  canExecute(agentId: string, task: BrainTask): AgentExecutionCheck {
    const agent = this.agents.get(agentId);
    if (!agent) return { allowed: false, reason: "agent_not_found" };
    if (!agent.enabled) return { allowed: false, reason: "agent_disabled" };
    if (!agent.businessScopes.includes(task.businessUnitId)) {
      return { allowed: false, reason: "business_scope_denied" };
    }
    if (!task.requiredCapabilities.every((capability) => agent.capabilities.includes(capability))) {
      return { allowed: false, reason: "capability_denied" };
    }
    if (!task.requiredTools.every((tool) => agent.allowedTools.includes(tool))) {
      return { allowed: false, reason: "tool_denied" };
    }
    if (task.autonomyLevel > agent.autonomyCeiling) {
      return { allowed: false, reason: "autonomy_ceiling_exceeded" };
    }
    return { allowed: true, reason: "allowed" };
  }
}
