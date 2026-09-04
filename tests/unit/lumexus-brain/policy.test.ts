import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateEffectiveAutonomy,
  evaluateActionPolicy,
} from "../../../src/domain/lumexus-brain/policy.ts";

test("effective autonomy is the minimum declared ceiling", () => {
  assert.equal(
    calculateEffectiveAutonomy({
      task: 3,
      agent: 2,
      business: 3,
      environment: 3,
      action: 3,
    }),
    2,
  );
});

test("irreversible actions require Crazy E decision approval", () => {
  const result = evaluateActionPolicy({
    requested: 3,
    ceilings: { agent: 3, business: 3, environment: 3, action: 4 },
    flags: { irreversible: true },
  });

  assert.equal(result.requiresDecision, true);
  assert.equal(result.allowed, false);
  assert.equal(result.effectiveLevel, 3);
});

test("high-risk action classes always enter the Decision Queue", () => {
  for (const flag of [
    "securitySensitive",
    "legalComplianceSensitive",
    "majorProductionDeployment",
    "highFinancialImpact",
  ] as const) {
    const result = evaluateActionPolicy({
      requested: 3,
      ceilings: { agent: 3, business: 3, environment: 3, action: 3 },
      flags: { [flag]: true },
    });

    assert.equal(result.requiresDecision, true, flag);
    assert.equal(result.allowed, false, flag);
  }
});

test("reversible actions may run only when every ceiling permits them", () => {
  const allowed = evaluateActionPolicy({
    requested: 2,
    ceilings: { agent: 2, business: 3, environment: 3, action: 2 },
    flags: {},
  });
  assert.equal(allowed.allowed, true);
  assert.equal(allowed.requiresDecision, false);
  assert.equal(allowed.effectiveLevel, 2);

  const blocked = evaluateActionPolicy({
    requested: 3,
    ceilings: { agent: 2, business: 3, environment: 3, action: 3 },
    flags: {},
  });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.requiresDecision, false);
  assert.equal(blocked.effectiveLevel, 2);
});
