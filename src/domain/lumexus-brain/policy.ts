import type { AutonomyLevel } from "./types.ts";

export interface AutonomyCeilings {
  agent: AutonomyLevel;
  business: AutonomyLevel;
  environment: AutonomyLevel;
  action: AutonomyLevel;
}

export interface EffectiveAutonomyInput {
  task: AutonomyLevel;
  agent: AutonomyLevel;
  business: AutonomyLevel;
  environment: AutonomyLevel;
  action: AutonomyLevel;
}

export interface ActionRiskFlags {
  irreversible?: boolean;
  destructive?: boolean;
  securitySensitive?: boolean;
  legalComplianceSensitive?: boolean;
  majorProductionDeployment?: boolean;
  highFinancialImpact?: boolean;
  strategicChange?: boolean;
}

export interface ActionPolicyInput {
  requested: AutonomyLevel;
  ceilings: AutonomyCeilings;
  flags: ActionRiskFlags;
}

export interface ActionPolicyResult {
  allowed: boolean;
  requiresDecision: boolean;
  effectiveLevel: AutonomyLevel;
  reason: string;
}

export function calculateEffectiveAutonomy(input: EffectiveAutonomyInput): AutonomyLevel {
  return Math.min(
    input.task,
    input.agent,
    input.business,
    input.environment,
    input.action,
  ) as AutonomyLevel;
}

function requiresCrazyEDecision(flags: ActionRiskFlags): boolean {
  return Boolean(
    flags.irreversible ||
      flags.destructive ||
      flags.securitySensitive ||
      flags.legalComplianceSensitive ||
      flags.majorProductionDeployment ||
      flags.highFinancialImpact ||
      flags.strategicChange,
  );
}

export function evaluateActionPolicy(input: ActionPolicyInput): ActionPolicyResult {
  const effectiveLevel = calculateEffectiveAutonomy({
    task: input.requested,
    agent: input.ceilings.agent,
    business: input.ceilings.business,
    environment: input.ceilings.environment,
    action: input.ceilings.action,
  });

  if (requiresCrazyEDecision(input.flags)) {
    return {
      allowed: false,
      requiresDecision: true,
      effectiveLevel,
      reason: "Action requires L4 Crazy E approval",
    };
  }

  if (effectiveLevel < input.requested) {
    return {
      allowed: false,
      requiresDecision: false,
      effectiveLevel,
      reason: `Requested autonomy L${input.requested} exceeds effective ceiling L${effectiveLevel}`,
    };
  }

  return {
    allowed: true,
    requiresDecision: false,
    effectiveLevel,
    reason: `Action permitted at L${effectiveLevel}`,
  };
}
