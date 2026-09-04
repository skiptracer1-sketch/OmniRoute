import test from "node:test";
import assert from "node:assert/strict";

import type { BrainTask } from "../../../src/domain/lumexus-brain/types.ts";
import {
  canTransitionTask,
  transitionTask,
} from "../../../src/domain/lumexus-brain/taskState.ts";

const baseTask: BrainTask = {
  id: "task-1",
  missionId: "mission-1",
  businessUnitId: "lumexus-ai",
  dependencies: [],
  requiredCapabilities: [],
  requiredTools: [],
  autonomyLevel: 2,
  status: "queued",
  attemptCount: 0,
  maxAttempts: 3,
  evidenceRefs: [],
};

test("task state machine allows legal transitions and rejects illegal jumps", () => {
  assert.equal(canTransitionTask("queued", "eligible"), true);
  assert.equal(canTransitionTask("queued", "succeeded"), false);
  assert.throws(
    () => transitionTask(baseTask, "succeeded", {}),
    /Illegal task transition: queued -> succeeded/,
  );
});

test("Decision Queue approval is required before an awaiting task can run", () => {
  const awaiting = { ...baseTask, status: "awaiting_decision" as const };
  assert.throws(
    () => transitionTask(awaiting, "running", {}),
    /approved decision/,
  );

  const running = transitionTask(awaiting, "running", { decisionApproved: true });
  assert.equal(running.status, "running");
});

test("verification is mandatory before succeeded", () => {
  const verifying = { ...baseTask, status: "verifying" as const };
  assert.throws(
    () => transitionTask(verifying, "succeeded", {}),
    /verification/,
  );

  const succeeded = transitionTask(verifying, "succeeded", { verificationPassed: true });
  assert.equal(succeeded.status, "succeeded");
});
