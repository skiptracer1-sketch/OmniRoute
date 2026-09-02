import { test } from "node:test";
import assert from "node:assert/strict";

import { smokeOpenClaudeGateway } from "../../../scripts/integrations/openclaude-smoke.mjs";

test("smokeOpenClaudeGateway verifies health and an OpenAI-compatible completion", async () => {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, init });
    if (url.endsWith("/api/monitoring/health")) {
      return { ok: true, status: 200, json: async () => ({ status: "ok" }) };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: "pong" } }] }),
    };
  };

  const result = await smokeOpenClaudeGateway({
    baseUrl: "http://localhost:20128/v1",
    model: "auto",
    apiKey: "test-key",
    fetchImpl,
  });

  assert.equal(result.ok, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, "http://localhost:20128/v1/chat/completions");
  assert.equal(JSON.parse(calls[1].init.body).model, "auto");
  assert.equal(calls[1].init.headers.Authorization, "Bearer test-key");
});

test("smokeOpenClaudeGateway reports gateway failures", async () => {
  const result = await smokeOpenClaudeGateway({
    fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({}) }),
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /health/i);
});
