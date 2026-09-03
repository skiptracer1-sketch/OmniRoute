import test from "node:test";
import assert from "node:assert/strict";
import { BrainService } from "../../../src/server/services/lumexus-brain/brainService.ts";
import { AgentRegistry } from "../../../src/server/services/lumexus-brain/agentRegistry.ts";
import { DecisionQueue } from "../../../src/server/services/lumexus-brain/decisionQueue.ts";
import {
  InMemoryDecisionStore,
  InMemoryEventStore,
  InMemoryMissionStore,
  InMemoryTaskStore,
  InMemoryVerificationStore,
} from "../../../src/server/services/lumexus-brain/stores.ts";
import type { AgentDefinition, BrainTask, Mission, VerificationResult } from "../../../src/domain/lumexus-brain/types.ts";

function buildService() {
  const missionStore = new InMemoryMissionStore();
  const taskStore = new InMemoryTaskStore();
  const eventStore = new InMemoryEventStore();
  const verificationStore = new InMemoryVerificationStore();
  const decisionStore = new InMemoryDecisionStore();
  const registry = new AgentRegistry();
  const decisionQueue = new DecisionQueue(decisionStore);
  const service = new BrainService({ missionStore, taskStore, eventStore, verificationStore, registry, decisionQueue });
  return { service, missionStore, taskStore, eventStore, verificationStore, registry, decisionQueue };
}

const mission: Mission = {
  id: "mission-1",
  businessUnitId: "lumexus-ai",
  title: "Ship Brain",
  objective: "Build verified control plane",
  priority: 1,
  constraints: [],
  createdBy: "crazy-e",
  createdAt: "2026-09-03T19:30:00.000Z",
  currentPhase: "build",
  status: "active",
  taskGraphId: "graph-1",
  decisionRequirements: [],
};

const agent: AgentDefinition = {
  id: "engineering-1",
  name: "Engineering",
  category: "Engineering",
  businessScopes: ["lumexus-ai"],
  capabilities: ["code.write"],
  allowedTools: ["omniroute"],
  autonomyCeiling: 3,
  enabled: true,
  version: "1.0.0",
};

function task(id: string, autonomyLevel: 2 | 3 = 2): BrainTask {
  return {
    id,
    missionId: mission.id,
    businessUnitId: "lumexus-ai",
    assignedAgentId: agent.id,
    dependencies: [],
    requiredCapabilities: ["code.write"],
    requiredTools: ["omniroute"],
    autonomyLevel,
    status: "eligible",
    attemptCount: 0,
    maxAttempts: 3,
    evidenceRefs: [],
  };
}

test("reversible permitted task becomes runnable while risky task enters Decision Queue", () => {
  const { service, registry, decisionQueue } = buildService();
  registry.register(agent);
  service.createMission(mission);

  const runnable = service.evaluateTask(task("task-safe"), {
    ceilings: { agent: 3, business: 3, environment: 3, action: 3 },
    flags: {},
  });
  assert.equal(runnable.status, "running");

  const gated = service.evaluateTask(task("task-risky", 3), {
    ceilings: { agent: 3, business: 3, environment: 3, action: 3 },
    flags: { majorProductionDeployment: true },
  });
  assert.equal(gated.status, "awaiting_decision");
  assert.equal(decisionQueue.listPending().length, 1);
});

test("task cannot succeed until stored verification passes", () => {
  const { service, registry } = buildService();
  registry.register(agent);
  service.createMission(mission);
  const running = service.evaluateTask(task("task-verify"), {
    ceilings: { agent: 3, business: 3, environment: 3, action: 3 },
    flags: {},
  });
  service.recordExecutionResult({ ...running, status: "verifying" });

  const failed: VerificationResult = {
    id: "verification-fail",
    taskId: running.id,
    executionId: "execution-1",
    verifierType: "deterministic-test",
    checks: [{ name: "tests", passed: false }],
    passed: false,
    evidence: [],
    verifiedAt: "2026-09-03T19:31:00.000Z",
  };
  assert.equal(service.recordVerification(failed).status, "failed");
});
