import test from "node:test";
import assert from "node:assert/strict";
import { calculateBackoffMs, nextRecoveryAction } from "../../../src/domain/lumexus-brain/recovery.ts";

test("recovery retries are bounded and use capped exponential backoff", () => {
  assert.equal(calculateBackoffMs(0, 1000, 8000), 1000);
  assert.equal(calculateBackoffMs(1, 1000, 8000), 2000);
  assert.equal(calculateBackoffMs(5, 1000, 8000), 8000);

  assert.equal(nextRecoveryAction({
    attemptCount: 1,
    maxAttempts: 3,
    safeRepairAvailable: true,
    safeRepairFailed: false,
    rollbackAvailable: true,
    rollbackFailed: false,
    isolated: false,
  }), "retry");
});

test("exhausted repair falls through rollback, isolation, then escalation", () => {
  assert.equal(nextRecoveryAction({
    attemptCount: 3,
    maxAttempts: 3,
    safeRepairAvailable: true,
    safeRepairFailed: true,
    rollbackAvailable: true,
    rollbackFailed: false,
    isolated: false,
  }), "rollback");

  assert.equal(nextRecoveryAction({
    attemptCount: 3,
    maxAttempts: 3,
    safeRepairAvailable: true,
    safeRepairFailed: true,
    rollbackAvailable: true,
    rollbackFailed: true,
    isolated: false,
  }), "isolate");

  assert.equal(nextRecoveryAction({
    attemptCount: 3,
    maxAttempts: 3,
    safeRepairAvailable: false,
    safeRepairFailed: true,
    rollbackAvailable: false,
    rollbackFailed: true,
    isolated: true,
  }), "escalate");
});
