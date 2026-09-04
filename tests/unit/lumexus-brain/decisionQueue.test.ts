import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryDecisionStore } from "../../../src/server/services/lumexus-brain/stores.ts";
import { DecisionQueue } from "../../../src/server/services/lumexus-brain/decisionQueue.ts";
import type { DecisionRequest } from "../../../src/domain/lumexus-brain/types.ts";

function request(id: string): DecisionRequest {
  return {
    id,
    businessUnitId: "lumexus-ai",
    missionId: "mission-1",
    taskId: "task-1",
    category: "production",
    title: "Deploy Brain change",
    problem: "Production mutation requires approval",
    context: "Verified candidate is ready",
    aiAnalysis: "Deployment is reversible and tested",
    recommendedAction: "Approve deployment",
    alternatives: ["Reject", "Modify scope"],
    upside: "Faster rollout",
    risk: "Production regression",
    estimatedCost: 0,
    reversibility: "rollback_available",
    confidence: 0.93,
    requestedAt: "2026-09-03T19:20:00.000Z",
    status: "pending",
  };
}

test("Decision Queue records and resolves explicit outcomes", () => {
  const queue = new DecisionQueue(new InMemoryDecisionStore());
  queue.request(request("decision-1"));
  assert.equal(queue.listPending().length, 1);

  const approved = queue.resolve("decision-1", {
    outcome: "approved",
    decisionBy: "crazy-e",
    decidedAt: "2026-09-03T19:21:00.000Z",
  });
  assert.equal(approved.status, "approved");
  assert.equal(approved.decisionBy, "crazy-e");
  assert.equal(queue.listPending().length, 0);
});

test("Decision Queue supports reject and modify without timeout auto-approval", () => {
  const queue = new DecisionQueue(new InMemoryDecisionStore());
  queue.request(request("reject-me"));
  queue.request(request("modify-me"));

  assert.equal(queue.resolve("reject-me", { outcome: "rejected", decisionBy: "crazy-e" }).status, "rejected");
  const modified = queue.resolve("modify-me", {
    outcome: "modified",
    decisionBy: "crazy-e",
    modification: { scope: "staging-only" },
  });
  assert.equal(modified.status, "modified");
  assert.deepEqual(modified.decision, { scope: "staging-only" });
});

test("terminal or unknown requests cannot be silently re-resolved", () => {
  const queue = new DecisionQueue(new InMemoryDecisionStore());
  queue.request(request("decision-1"));
  queue.resolve("decision-1", { outcome: "approved", decisionBy: "crazy-e" });
  assert.throws(() => queue.resolve("decision-1", { outcome: "rejected", decisionBy: "other" }));
  assert.throws(() => queue.resolve("missing", { outcome: "approved", decisionBy: "other" }));
});
