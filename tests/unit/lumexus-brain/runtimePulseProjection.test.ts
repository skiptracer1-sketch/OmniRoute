import test from "node:test";
import assert from "node:assert/strict";
import { calculateMissionProgress } from "../../../src/domain/lumexus-brain/progress.ts";
import { buildRuntimePulseProjection } from "../../../src/server/services/lumexus-brain/runtimePulseProjection.ts";
import type { BrainTask, DecisionRequest, Mission } from "../../../src/domain/lumexus-brain/types.ts";

const mission: Mission = {
  id: "mission-1",
  businessUnitId: "lumexus-ai",
  title: "Brain Core",
  objective: "Ship v0.1",
  priority: 1,
  constraints: [],
  createdBy: "crazy-e",
  createdAt: "2026-09-03T19:40:00.000Z",
  currentPhase: "build",
  status: "active",
  taskGraphId: "graph-1",
  decisionRequirements: [],
};

function task(id: string, status: BrainTask["status"], weight?: number): BrainTask {
  return {
    id,
    missionId: mission.id,
    businessUnitId: "lumexus-ai",
    dependencies: [],
    requiredCapabilities: [],
    requiredTools: [],
    autonomyLevel: 1,
    status,
    attemptCount: 0,
    maxAttempts: 3,
    evidenceRefs: [],
    weight,
  };
}

test("weighted progress uses actual completed task weight", () => {
  const progress = calculateMissionProgress([
    task("a", "succeeded", 3),
    task("b", "running", 1),
  ]);
  assert.deepEqual(progress, { percentage: 75, completed: 1, total: 2 });
});

test("unweighted progress reports counts without invented precision", () => {
  const progress = calculateMissionProgress([task("a", "succeeded"), task("b", "running")]);
  assert.deepEqual(progress, { percentage: null, completed: 1, total: 2 });
});

test("Runtime Pulse exposes real blockers, failures, recoveries, and decisions", () => {
  const decision: DecisionRequest = {
    id: "decision-1",
    businessUnitId: "lumexus-ai",
    missionId: mission.id,
    taskId: "blocked",
    category: "policy",
    title: "Approve",
    problem: "Needs approval",
    context: "Production",
    aiAnalysis: "Protected",
    recommendedAction: "Approve or reject",
    alternatives: [],
    upside: "Ship",
    risk: "Regression",
    reversibility: "rollback",
    requestedAt: "2026-09-03T19:41:00.000Z",
    status: "pending",
  };

  const projection = buildRuntimePulseProjection({
    missions: [mission],
    tasks: [task("done", "succeeded", 1), task("blocked", "awaiting_decision", 1)],
    decisions: [decision],
    events: [
      { eventId: "1", eventType: "TASK_FAILED", occurredAt: "2026-09-03T19:42:00.000Z", businessUnitId: "lumexus-ai", severity: "error", source: "brain", correlationId: mission.id, payload: {}, schemaVersion: 1 },
      { eventId: "2", eventType: "RECOVERY_SUCCEEDED", occurredAt: "2026-09-03T19:43:00.000Z", businessUnitId: "lumexus-ai", severity: "info", source: "brain", correlationId: mission.id, payload: {}, schemaVersion: 1 },
    ],
  });

  assert.equal(projection.activeMissions, 1);
  assert.equal(projection.pendingDecisions, 1);
  assert.equal(projection.blockers, 1);
  assert.equal(projection.failures, 1);
  assert.equal(projection.recoveries, 1);
  assert.equal(projection.missions[0]?.progress.percentage, 50);
});
