import { calculateMissionProgress } from "../../../domain/lumexus-brain/progress.ts";
import type { BrainEvent } from "../../../domain/lumexus-brain/events.ts";
import type { BrainTask, DecisionRequest, Mission } from "../../../domain/lumexus-brain/types.ts";

export interface RuntimePulseSnapshotInput {
  missions: readonly Mission[];
  tasks: readonly BrainTask[];
  decisions: readonly DecisionRequest[];
  events: readonly BrainEvent[];
}

export function buildRuntimePulseProjection(input: RuntimePulseSnapshotInput) {
  const activeMissions = input.missions.filter((mission) => mission.status === "active");
  const pendingDecisions = input.decisions.filter((decision) => decision.status === "pending");
  const blockerTasks = input.tasks.filter((task) =>
    ["awaiting_policy", "awaiting_decision", "failed", "isolated"].includes(task.status),
  );
  const failures = input.events.filter((event) =>
    ["TASK_FAILED", "AGENT_FAILED", "TOOL_CALL_FAILED", "TEST_FAILED", "VERIFICATION_FAILED", "DEPLOY_FAILED", "SERVICE_FAILED", "RECOVERY_FAILED", "ROLLBACK_FAILED"].includes(event.eventType),
  ).length;
  const recoveries = input.events.filter((event) => event.eventType === "RECOVERY_SUCCEEDED").length;

  return {
    schemaVersion: 1 as const,
    activeMissions: activeMissions.length,
    activeTasks: input.tasks.filter((task) => !["succeeded", "cancelled", "rolled_back"].includes(task.status)).length,
    pendingDecisions: pendingDecisions.length,
    blockers: blockerTasks.length,
    failures,
    recoveries,
    queueDepth: input.tasks.filter((task) => ["queued", "eligible", "retry_scheduled"].includes(task.status)).length,
    missions: input.missions.map((mission) => ({
      id: mission.id,
      businessUnitId: mission.businessUnitId,
      title: mission.title,
      phase: mission.currentPhase,
      status: mission.status,
      progress: calculateMissionProgress(input.tasks.filter((task) => task.missionId === mission.id)),
    })),
    decisions: pendingDecisions.map((decision) => ({
      id: decision.id,
      missionId: decision.missionId,
      taskId: decision.taskId,
      title: decision.title,
      requestedAt: decision.requestedAt,
    })),
  };
}
