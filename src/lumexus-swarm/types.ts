export const SECURITY_ROLES = [
  'recon',
  'surface-analysis',
  'vulnerability-classification',
  'verification',
  'remediation-planning',
  'regression',
  'reporting',
] as const;

export type SecurityRole = (typeof SECURITY_ROLES)[number];

export type SwarmStatus =
  | 'created'
  | 'running'
  | 'waiting-approval'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type AgentStatus = 'idle' | 'running' | 'blocked' | 'completed' | 'failed';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ScopeRule {
  resource: string;
  actions: string[];
}

export interface SwarmMission {
  id: string;
  name: string;
  objective: string;
  scope: ScopeRule[];
  createdAt: string;
  status: SwarmStatus;
}

export interface AgentRecord {
  id: string;
  role: SecurityRole;
  status: AgentStatus;
  startedAt?: string;
  completedAt?: string;
}

export interface Finding {
  id: string;
  missionId: string;
  agentId: string;
  title: string;
  severity: RiskLevel;
  evidence: string[];
  createdAt: string;
}

export type SwarmEventType =
  | 'mission.created'
  | 'mission.started'
  | 'mission.waiting-approval'
  | 'mission.completed'
  | 'mission.failed'
  | 'mission.cancelled'
  | 'agent.started'
  | 'agent.completed'
  | 'agent.failed'
  | 'finding.recorded'
  | 'tool.denied'
  | 'tool.approval-required';

export interface SwarmEvent<TPayload = Record<string, unknown>> {
  id: string;
  missionId: string;
  type: SwarmEventType;
  timestamp: string;
  payload: TPayload;
}

export interface ToolRequest {
  missionId: string;
  agentId: string;
  resource: string;
  action: string;
  risk: RiskLevel;
}

export type ToolPolicyDecision =
  | { outcome: 'allow'; reason: string }
  | { outcome: 'deny'; reason: string }
  | { outcome: 'approval-required'; reason: string };

export interface ApprovalRequest {
  id: string;
  missionId: string;
  agentId: string;
  resource: string;
  action: string;
  risk: RiskLevel;
  reason: string;
  createdAt: string;
}

export interface RuntimePulseSnapshot {
  missionId: string;
  status: SwarmStatus;
  agentCounts: Record<AgentStatus, number>;
  findings: number;
  approvalsPending: number;
  lastEventAt?: string;
}
