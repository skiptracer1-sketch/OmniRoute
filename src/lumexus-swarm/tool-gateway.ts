import type { RiskLevel, ToolPolicyDecision } from './types';
import { LumexusSwarmKernel } from './kernel';

export interface ToolExecutor {
  execute(input: { resource: string; action: string; payload?: unknown }): Promise<unknown>;
}

export type GatewayResult =
  | { status: 'executed'; output: unknown }
  | { status: 'denied' | 'approval-required'; decision: ToolPolicyDecision };

export class SwarmToolGateway {
  constructor(private readonly kernel: LumexusSwarmKernel, private readonly executor: ToolExecutor) {}

  async execute(input: { missionId: string; agentId: string; resource: string; action: string; risk: RiskLevel; payload?: unknown }): Promise<GatewayResult> {
    const decision = this.kernel.evaluateTool(input);
    if (decision.outcome !== 'allow') return { status: decision.outcome, decision };
    const output = await this.executor.execute({ resource: input.resource, action: input.action, payload: input.payload });
    return { status: 'executed', output };
  }
}
