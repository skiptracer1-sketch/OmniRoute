import { randomUUID } from "node:crypto";
import type { ActionPolicyInput } from "../../../domain/lumexus-brain/policy.ts";
import { evaluateActionPolicy } from "../../../domain/lumexus-brain/policy.ts";
import { createBrainEvent } from "../../../domain/lumexus-brain/events.ts";
import { transitionTask } from "../../../domain/lumexus-brain/taskState.ts";
import type { BrainTask, DecisionRequest, Mission, VerificationResult } from "../../../domain/lumexus-brain/types.ts";
import type { AgentRegistry } from "./agentRegistry.ts";
import type { DecisionQueue } from "./decisionQueue.ts";
import type { EventStore, MissionStore, TaskStore, VerificationStore } from "./stores.ts";

export interface BrainServiceDependencies {
  missionStore: MissionStore;
  taskStore: TaskStore;
  eventStore: EventStore;
  verificationStore: VerificationStore;
  registry: AgentRegistry;
  decisionQueue: DecisionQueue;
}

export class BrainService {
  constructor(private readonly deps: BrainServiceDependencies) {}

  createMission(mission: Mission): Mission {
    const stored = this.deps.missionStore.put(mission);
    this.deps.eventStore.append(createBrainEvent({
      eventType: "MISSION_CREATED",
      occurredAt: mission.createdAt,
      businessUnitId: mission.businessUnitId,
      missionId: mission.id,
      severity: "info",
      source: "lumexus-brain",
      correlationId: mission.id,
      payload: { title: mission.title, objective: mission.objective },
    }));
    return stored;
  }

  evaluateTask(task: BrainTask, policyInput: Omit<ActionPolicyInput, "requested">): BrainTask {
    if (!task.assignedAgentId) throw new Error(`task_missing_agent:${task.id}`);
    const capability = this.deps.registry.canExecute(task.assignedAgentId, task);
    if (!capability.allowed) throw new Error(`agent_execution_denied:${capability.reason}`);

    this.deps.taskStore.put(task);
    const policy = evaluateActionPolicy({ requested: task.autonomyLevel, ...policyInput });

    if (policy.requiresDecision) {
      const awaitingPolicy = transitionTask(task, "awaiting_policy", {});
      const gated = transitionTask(awaitingPolicy, "awaiting_decision", {});
      this.deps.taskStore.put(gated);
      const decision = this.buildDecisionRequest(gated, policy.reason);
      this.deps.decisionQueue.request(decision);
      this.deps.eventStore.append(createBrainEvent({
        eventType: "DECISION_REQUIRED",
        occurredAt: decision.requestedAt,
        businessUnitId: task.businessUnitId,
        missionId: task.missionId,
        taskId: task.id,
        agentId: task.assignedAgentId,
        severity: "warning",
        source: "lumexus-brain",
        correlationId: task.missionId,
        causationId: task.id,
        payload: { decisionId: decision.id, reason: policy.reason },
      }));
      return gated;
    }

    if (!policy.allowed) throw new Error(`policy_denied:${policy.reason}`);
    const running = transitionTask(task, "running", {});
    this.deps.taskStore.put(running);
    this.deps.eventStore.append(createBrainEvent({
      eventType: "TASK_STARTED",
      occurredAt: new Date().toISOString(),
      businessUnitId: task.businessUnitId,
      missionId: task.missionId,
      taskId: task.id,
      agentId: task.assignedAgentId,
      severity: "info",
      source: "lumexus-brain",
      correlationId: task.missionId,
      causationId: task.id,
      payload: { autonomyLevel: task.autonomyLevel },
    }));
    return running;
  }

  recordExecutionResult(task: BrainTask): BrainTask {
    const current = this.deps.taskStore.get(task.id);
    if (!current) throw new Error(`task_not_found:${task.id}`);
    const next = transitionTask(current, task.status, {});
    return this.deps.taskStore.put(next);
  }

  recordVerification(result: VerificationResult): BrainTask {
    const task = this.deps.taskStore.get(result.taskId);
    if (!task) throw new Error(`task_not_found:${result.taskId}`);
    if (task.status !== "verifying") throw new Error(`task_not_verifying:${task.id}`);
    this.deps.verificationStore.put(result);

    const next = result.passed
      ? transitionTask(task, "succeeded", { verificationPassed: true })
      : transitionTask(task, "failed", { verificationPassed: false });
    this.deps.taskStore.put(next);
    this.deps.eventStore.append(createBrainEvent({
      eventType: result.passed ? "VERIFICATION_PASSED" : "VERIFICATION_FAILED",
      occurredAt: result.verifiedAt,
      businessUnitId: task.businessUnitId,
      missionId: task.missionId,
      taskId: task.id,
      agentId: task.assignedAgentId,
      severity: result.passed ? "info" : "error",
      source: "lumexus-brain-verifier",
      correlationId: task.missionId,
      causationId: result.executionId,
      payload: { verificationId: result.id, verifierType: result.verifierType, passed: result.passed },
    }));
    return next;
  }

  private buildDecisionRequest(task: BrainTask, reason: string): DecisionRequest {
    return {
      id: randomUUID(),
      businessUnitId: task.businessUnitId,
      missionId: task.missionId,
      taskId: task.id,
      category: "autonomy-policy",
      title: `Approval required for task ${task.id}`,
      problem: reason,
      context: `Agent ${task.assignedAgentId ?? "unassigned"} requested L${task.autonomyLevel} execution.`,
      aiAnalysis: "Lumexus Brain policy classified this task as requiring explicit executive approval.",
      recommendedAction: "Review and explicitly approve, reject, or modify the task scope.",
      alternatives: ["Reject", "Modify scope", "Keep pending"],
      upside: "Allows controlled execution after explicit approval.",
      risk: "Execution may mutate a high-impact or protected scope.",
      reversibility: "policy-dependent",
      requestedAt: new Date().toISOString(),
      status: "pending",
    };
  }
}
