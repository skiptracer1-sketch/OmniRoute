import test from "node:test";
import assert from "node:assert/strict";

import { openaiProvider } from "../../../open-sse/config/providers/registry/openai/index.ts";
import {
  getNextFamilyFallback,
  isModelUnavailableError,
} from "../../../open-sse/services/modelFamilyFallback.ts";
import {
  LUMEXUS_ASTRA_CANDIDATE_MODEL,
  LUMEXUS_FALLBACK_MODEL,
  getLumexusAstraRuntimeStatus,
} from "../../../open-sse/services/lumexusAstraRouting.ts";

test("OpenAI registry exposes Astra without replacing the verified default ordering", () => {
  const ids = openaiProvider.models.map((model) => model.id);
  assert.equal(ids[0], "gpt-5.6");
  assert.ok(ids.includes(LUMEXUS_ASTRA_CANDIDATE_MODEL));
  assert.ok(ids.includes(LUMEXUS_FALLBACK_MODEL));
});

test("Astra model-unavailable errors fall through to GPT-5.6 Sol", () => {
  assert.equal(isModelUnavailableError(404, "model not found", "openai"), true);
  assert.equal(
    getNextFamilyFallback(LUMEXUS_ASTRA_CANDIDATE_MODEL, new Set(), "openai"),
    LUMEXUS_FALLBACK_MODEL
  );
});

test("Astra access-denied errors are treated as model availability failures", () => {
  assert.equal(
    isModelUnavailableError(403, "Your project does not have access to model gpt-6-astra", "openai"),
    true
  );
});

test("transient OpenAI throttling is not converted into a permanent Astra availability decision", () => {
  assert.equal(isModelUnavailableError(429, "rate limit exceeded", "openai"), false);
});

test("Runtime Pulse reports an unverified candidate without claiming API entitlement", () => {
  const status = getLumexusAstraRuntimeStatus([]);
  assert.equal(status.provider, "openai");
  assert.equal(status.candidateModel, LUMEXUS_ASTRA_CANDIDATE_MODEL);
  assert.equal(status.fallbackModel, LUMEXUS_FALLBACK_MODEL);
  assert.equal(status.apiModelIdVerified, false);
  assert.equal(status.state, "candidate_unverified");
  assert.equal(status.fallbackActive, false);
  assert.equal(status.lockoutReason, null);
});

test("Runtime Pulse surfaces exact-model cooldown without exposing credentials", () => {
  const status = getLumexusAstraRuntimeStatus([
    {
      provider: "openai",
      model: LUMEXUS_ASTRA_CANDIDATE_MODEL,
      reason: "not_found",
      remainingMs: 42_000,
      failureCount: 2,
      connectionId: "connection-1",
    },
  ]);

  assert.equal(status.state, "candidate_locked");
  assert.equal(status.fallbackActive, true);
  assert.equal(status.lockoutReason, "not_found");
  assert.equal(status.lockoutRemainingMs, 42_000);
  assert.equal(status.failureCount, 2);
  assert.equal("connectionId" in status, false);
  assert.equal("apiKey" in status, false);
});
