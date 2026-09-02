import assert from "node:assert/strict";
import test from "node:test";
import {
  closeReactorSession,
  createReactorSession,
  getReactorSession,
  recordReactorEvent,
  transitionReactorSession,
} from "../../../../src/lib/reactor/sessions";

test("Reactor session follows the native lifecycle", () => {
  const created = createReactorSession({ modelId: "ltx2", tenantId: "tenant-a" });
  assert.equal(created.state, "created");

  transitionReactorSession(created.id, "token_issued");
  transitionReactorSession(created.id, "connecting");
  transitionReactorSession(created.id, "ready");
  recordReactorEvent(created.id, { state: "running", command: "start" });

  const running = getReactorSession(created.id);
  assert.equal(running.state, "running");
  assert.equal(running.commandCount, 1);
  assert.ok(running.startedAt);

  const closed = closeReactorSession(created.id);
  assert.equal(closed.state, "closed");
  assert.ok(closed.endedAt);
});

test("Reactor session rejects invalid transitions", () => {
  const created = createReactorSession({ modelId: "x2" });
  assert.throws(() => transitionReactorSession(created.id, "running"), /Invalid Reactor session transition/);
});
