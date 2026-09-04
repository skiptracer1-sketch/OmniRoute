import test from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";
import { GET as getStatus } from "../../../src/app/api/lumexus/brain/status/route.ts";
import { GET as getDecisions } from "../../../src/app/api/lumexus/brain/decisions/route.ts";
import { PUT as putDecision } from "../../../src/app/api/lumexus/brain/decisions/[id]/route.ts";

const TEST_JWT_SECRET = "lumexus-brain-api-contract-test-secret-2026";

async function authenticatedRequest(url: string, init: RequestInit = {}): Promise<Request> {
  const token = await new SignJWT({ sub: "lumexus-api-test", role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(TEST_JWT_SECRET));

  const headers = new Headers(init.headers);
  headers.set("cookie", `auth_token=${token}`);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");

  return new Request(url, { ...init, headers });
}

async function withRequiredAuth<T>(fn: () => Promise<T>): Promise<T> {
  const previousJwtSecret = process.env.JWT_SECRET;
  const previousInitialPassword = process.env.INITIAL_PASSWORD;
  process.env.JWT_SECRET = TEST_JWT_SECRET;
  process.env.INITIAL_PASSWORD = "lumexus-api-test-password";
  try {
    return await fn();
  } finally {
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
    if (previousInitialPassword === undefined) delete process.env.INITIAL_PASSWORD;
    else process.env.INITIAL_PASSWORD = previousInitialPassword;
  }
}

test("Lumexus Brain decision writes reject unauthenticated requests", async () => {
  await withRequiredAuth(async () => {
    const request = new Request("http://example.test/api/lumexus/brain/decisions/missing", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ outcome: "approved", decisionBy: "api-contract-test" }),
    });

    const response = await putDecision(request, {
      params: Promise.resolve({ id: "missing" }),
    });

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "Authentication required" });
  });
});

test("Lumexus Brain decision writes reject invalid outcomes", async () => {
  await withRequiredAuth(async () => {
    const request = await authenticatedRequest(
      "http://example.test/api/lumexus/brain/decisions/missing",
      {
        method: "PUT",
        body: JSON.stringify({ outcome: "auto_approve", decisionBy: "api-contract-test" }),
      }
    );

    const response = await putDecision(request, {
      params: Promise.resolve({ id: "missing" }),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "Invalid outcome" });
  });
});

test("Lumexus Brain authenticated status read exposes schema version 1", async () => {
  await withRequiredAuth(async () => {
    const request = await authenticatedRequest("http://example.test/api/lumexus/brain/status");
    const response = await getStatus(request);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.schemaVersion, 1);
    assert.equal(payload.persistence, "process-local-reference");
    assert.equal(typeof payload.missions, "number");
    assert.equal(typeof payload.tasks, "number");
    assert.equal(typeof payload.pendingDecisions, "number");
  });
});

test("Lumexus Brain authenticated decision read exposes schema version 1", async () => {
  await withRequiredAuth(async () => {
    const request = await authenticatedRequest("http://example.test/api/lumexus/brain/decisions");
    const response = await getDecisions(request);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.schemaVersion, 1);
    assert.ok(Array.isArray(payload.decisions));
  });
});
