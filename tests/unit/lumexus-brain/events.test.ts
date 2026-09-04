import test from "node:test";
import assert from "node:assert/strict";
import { createBrainEvent, redactEventPayload } from "../../../src/domain/lumexus-brain/events.ts";

test("Brain events preserve correlation and use schema version 1", () => {
  const event = createBrainEvent({
    eventType: "TASK_STARTED",
    occurredAt: "2026-09-03T19:10:00.000Z",
    businessUnitId: "lumexus-ai",
    missionId: "mission-1",
    taskId: "task-1",
    severity: "info",
    source: "brain-service",
    correlationId: "corr-1",
    causationId: "cause-1",
    payload: { providerId: "xai", modelId: "grok" },
  });

  assert.equal(event.schemaVersion, 1);
  assert.equal(event.correlationId, "corr-1");
  assert.equal(event.causationId, "cause-1");
  assert.equal(event.eventType, "TASK_STARTED");
  assert.ok(event.eventId.length > 0);
});

test("event payload redaction is recursive and non-mutating", () => {
  const original = {
    apiKey: "secret-key",
    nested: { authorization: "Bearer token", ok: true },
    array: [{ token: "abc" }, { safe: "value" }],
  };

  const redacted = redactEventPayload(original, ["apiKey", "authorization", "token", "secret"]);

  assert.deepEqual(redacted, {
    apiKey: "[REDACTED]",
    nested: { authorization: "[REDACTED]", ok: true },
    array: [{ token: "[REDACTED]" }, { safe: "value" }],
  });
  assert.equal(original.apiKey, "secret-key");
  assert.equal(original.nested.authorization, "Bearer token");
});
