import assert from "node:assert/strict";
import test from "node:test";
import { mintReactorToken } from "../../../../src/lib/reactor/tokenBroker";

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.REACTOR_API_KEY;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalApiKey === undefined) delete process.env.REACTOR_API_KEY;
  else process.env.REACTOR_API_KEY = originalApiKey;
});

test("token broker scopes token to the exact registered Reactor model", async () => {
  process.env.REACTOR_API_KEY = "secret-test-key";
  let capturedBody: unknown;
  let capturedHeader: string | null = null;

  globalThis.fetch = async (_input, init) => {
    capturedHeader = new Headers(init?.headers).get("Reactor-API-Key");
    capturedBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ jwt: "short-lived-jwt", expires_at: "2026-09-02T20:00:00Z" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const result = await mintReactorToken("ltx2", { maxSessions: 1 });
  assert.equal(capturedHeader, "secret-test-key");
  assert.deepEqual(capturedBody, {
    authorization_details: [
      {
        type: "session",
        resources: { models: { match: ["reactor/ltx2"] } },
        constraints: { max_sessions: 1 },
      },
    ],
  });
  assert.equal(result.token, "short-lived-jwt");
  assert.equal(result.reactorModel, "reactor/ltx2");
});

test("token broker rejects arbitrary model ids before calling upstream", async () => {
  process.env.REACTOR_API_KEY = "secret-test-key";
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return new Response("{}", { status: 200 });
  };

  await assert.rejects(() => mintReactorToken("not-registered"), /Unsupported Reactor model/);
  assert.equal(called, false);
});

test("upstream auth errors never include the API key", async () => {
  process.env.REACTOR_API_KEY = "do-not-leak-this";
  globalThis.fetch = async () => new Response("forbidden", { status: 403 });

  await assert.rejects(async () => {
    try {
      await mintReactorToken("ltx2");
    } catch (error) {
      assert.equal(String(error).includes("do-not-leak-this"), false);
      throw error;
    }
  }, /Reactor authentication failed/);
});
