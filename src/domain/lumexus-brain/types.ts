export type BusinessUnitId =
  | "lumexus-ai"
  | "muscle-boulevard"
  | "cypher-biopeptides"
  | "real-peptide-news"
  | "repolife"
  | "omniroute"
  | "jarvis";

export type AutonomyLevel = 0 | 1 | 2 | 3 | 4;

export type MissionPhase =
  | "discover"
  | "analyze"
  | "design"
  | "build"
  | "test"
  | "verify"
  | "deploy"
  | "monitor"
  | "self-correct"
  | "optimize"
  | "scale";

export type MissionStatus = "queued" | "active" | "blocked" | "completed" | "failed" | "cancelled";

export type TaskStatus =
  | "queued"
  | "eligible"
  | "planning"
  | "awaiting_policy"
  | "awaiting_decision"
  | "running"
  | "testing"
  | "verifying"
  | "succeeded"
  | "failed"
  | "retry_scheduled"
  | "recovering"
  | "rolling_back"
  | "rolled_back"
  | "isolated"
  | "cancelled";

export type DecisionOutcome = "approved" | "rejected" | "modified" | "expired" | "withdrawn";
export type DecisionStatus = "pending" | DecisionOutcome;

export interface Mission {
  id: string;
  businessUnitId: BusinessUnitId;
  title: string;
  objective: string;
  priority: number;
  constraints: string[];
  budgetPolicyRef?: string;
  riskPolicyRef?: string;
  createdBy: string;
  createdAt: string;
  currentPhase: MissionPhase;
  status: MissionStatus;
  taskGraphId: string;
  decisionRequirements: string[];
  metadata?: Readonly<Record<string, unknown>>;
}

export interface BrainTask {
  id: string;
  missionId: string;
  businessUnitId: BusinessUnitId;
  assignedAgentId?: string;
  dependencies: string[];
  requiredCapabilities: string[];
  requiredTools: string[];
  autonomyLevel: AutonomyLevel;
  status: TaskStatus;
  attemptCount: number;
  maxAttempts: number;
  timeoutPolicy?: Readonly<Record<string, unknown>>;
  rollbackPolicy?: Readonly<Record<string, unknown>>;
  verificationPolicy?: Readonly<Record<string, unknown>>;
  inputRef?: string;
  outputRef?: string;
  evidenceRefs: string[];
  weight?: number;
}

export interface AgentDefinition {
  id: string;
  name: string;
  category: string;
  businessScopes: BusinessUnitId[];
  capabilities: string[];
  allowedTools: string[];
  autonomyCeiling: AutonomyLevel;
  modelRequirements?: Readonly<Record<string, unknown>>;
  verificationRequirements?: string[];
  enabled: boolean;
  version: string;
}

export interface Execution {
  id: string;
  taskId: string;
  agentId: string;
  status: TaskStatus;
  startedAt?: string;
  finishedAt?: string;
  modelRoute?: Readonly<{
    providerId?: string;
    modelId?: string;
    fallbackFrom?: string;
  }>;
  toolCalls: readonly unknown[];
  evidence: readonly unknown[];
  error?: Readonly<Record<string, unknown>> | string;
  retryOfExecutionId?: string;
  rollbackOfExecutionId?: string;
  verificationResultId?: string;
}

export interface VerificationCheck {
  name: string;
  passed: boolean;
  evidence?: unknown;
}

export interface VerificationResult {
  id: string;
  taskId: string;
  executionId: string;
  verifierType: string;
  checks: VerificationCheck[];
  passed: boolean;
  evidence: readonly unknown[];
  confidence?: number;
  verifiedAt: string;
}

export interface DecisionRequest {
  id: string;
  businessUnitId: BusinessUnitId;
  missionId: string;
  taskId?: string;
  category: string;
  title: string;
  problem: string;
  context: string;
  aiAnalysis: string;
  recommendedAction: string;
  alternatives: string[];
  upside: string;
  risk: string;
  estimatedCost?: number;
  reversibility: string;
  confidence?: number;
  requestedAt: string;
  expiresAt?: string;
  status: DecisionStatus;
  decision?: unknown;
  decisionBy?: string;
  decidedAt?: string;
}
