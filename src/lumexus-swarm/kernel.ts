import { randomUUID } from 'node:crypto';
import {
  SECURITY_ROLES,
  type AgentRecord,
  type ApprovalRequest,
  type Finding,
  type RuntimePulseSnapshot,
  type SwarmEvent,
  type SwarmMission,
  type ToolPolicyDecision,
  type ToolRequest,
} from './types';

export class LumexusSwarmKernel {
  private readonly missions = new Map<string, SwarmMission>();
  private readonly agents = new Map<string, AgentRecord[]>();
  private readonly findings: Finding[] = [];
  private readonly approvals: ApprovalRequest[] = [];
  private readonly events: SwarmEvent[] = [];
  private killed = false;

  createMission(input: Pick<SwarmMission, 'name' | 'objective' | 'scope'>): SwarmMission {
    if (!input.name.trim() || !input.objective.trim()) throw new Error('mission name and objective are required');
    if (input.scope.length === 0) throw new Error('mission scope is required');
    const mission: SwarmMission = { ...input, id: randomUUID(), createdAt: new Date().toISOString(), status: 'created' };
    this.missions.set(mission.id, mission);
    this.agents.set(mission.id, SECURITY_ROLES.map(role => ({ id: randomUUID(), role, status: 'idle' })));
    this.emit(mission.id, 'mission.created', { name: mission.name });
    return mission;
  }

  startMission(missionId: string): SwarmMission {
    this.assertOperational();
    const mission = this.requireMission(missionId);
    mission.status = 'running';
    this.emit(missionId, 'mission.started', {});
    return mission;
  }

  evaluateTool(request: ToolRequest): ToolPolicyDecision {
    this.assertOperational();
    const mission = this.requireMission(request.missionId);
    const scoped = mission.scope.some(rule => rule.resource === request.resource && rule.actions.includes(request.action));
    if (!scoped) {
      this.emit(request.missionId, 'tool.denied', { resource: request.resource, action: request.action });
      return { outcome: 'deny', reason: 'request is outside mission scope' };
    }
    if (request.risk === 'high' || request.risk === 'critical') {
      const approval: ApprovalRequest = { ...request, id: randomUUID(), reason: 'high-risk action requires Crazy E Decision Queue approval', createdAt: new Date().toISOString() };
      this.approvals.push(approval);
      mission.status = 'waiting-approval';
      this.emit(request.missionId, 'tool.approval-required', { approvalId: approval.id });
      this.emit(request.missionId, 'mission.waiting-approval', { approvalId: approval.id });
      return { outcome: 'approval-required', reason: approval.reason };
    }
    return { outcome: 'allow', reason: 'request is in scope and below approval threshold' };
  }

  recordFinding(input: Omit<Finding, 'id' | 'createdAt'>): Finding {
    this.requireMission(input.missionId);
    const finding: Finding = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
    this.findings.push(finding);
    this.emit(input.missionId, 'finding.recorded', { findingId: finding.id, severity: finding.severity });
    return finding;
  }

  pulse(missionId: string): RuntimePulseSnapshot {
    const mission = this.requireMission(missionId);
    const agents = this.agents.get(missionId) ?? [];
    const agentCounts: RuntimePulseSnapshot['agentCounts'] = { idle: 0, running: 0, blocked: 0, completed: 0, failed: 0 };
    for (const agent of agents) agentCounts[agent.status] += 1;
    const missionEvents = this.events.filter(event => event.missionId === missionId);
    return {
      missionId,
      status: mission.status,
      agentCounts,
      findings: this.findings.filter(f => f.missionId === missionId).length,
      approvalsPending: this.approvals.filter(a => a.missionId === missionId).length,
      lastEventAt: missionEvents.at(-1)?.timestamp,
    };
  }

  kill(): void { this.killed = true; }
  isKilled(): boolean { return this.killed; }
  listEvents(missionId: string): SwarmEvent[] { return this.events.filter(event => event.missionId === missionId); }
  listApprovals(missionId: string): ApprovalRequest[] { return this.approvals.filter(a => a.missionId === missionId); }

  private requireMission(id: string): SwarmMission {
    const mission = this.missions.get(id);
    if (!mission) throw new Error(`unknown mission: ${id}`);
    return mission;
  }

  private assertOperational(): void {
    if (this.killed) throw new Error('swarm kill switch is active');
  }

  private emit(missionId: string, type: SwarmEvent['type'], payload: Record<string, unknown>): void {
    this.events.push({ id: randomUUID(), missionId, type, payload, timestamp: new Date().toISOString() });
  }
}
