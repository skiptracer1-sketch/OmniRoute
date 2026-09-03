# Lumexus Brain Core v0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first safe, typed, observable Lumexus Brain control-plane vertical slice on top of OmniRoute without duplicating OmniRoute provider routing.

**Architecture:** Pure TypeScript domain primitives live under `src/domain/lumexus-brain/`; orchestration and in-memory reference stores live under `src/server/services/lumexus-brain/`; minimal authenticated Next.js routes expose read projections and decision writes under `src/app/api/lumexus/brain/`. Runtime Pulse consumes a projection derived from real Brain state/events, while OmniRoute remains responsible for model/provider routing.

**Tech Stack:** TypeScript, Node.js >=22.22.2, Next.js route handlers, Node `node:test` + `assert/strict`, existing OmniRoute auth utilities, existing OmniRoute CI.

**Spec:** `docs/superpowers/specs/2026-09-03-lumexus-brain-core-design.md`

## Global Constraints

- Crazy E remains the final decision-maker for strategic, irreversible, security-sensitive, legal/compliance-sensitive, and high-financial-impact actions.
- Routine reversible actions execute only when explicitly permitted by policy.
- OmniRoute owns model/provider routing; Lumexus Brain must not duplicate provider routing logic.
- No prompt may override autonomy policy calculation.
- No task reaches `succeeded` until required verification passes.
- No hidden default approval or timeout-to-approval behavior.
- Progress is derived from actual task graph state, never elapsed time or model prose.
- Existing OmniRoute authentication/authorization patterns must be reused for write routes.
- No agent receives unrestricted production credentials.
- Node runtime remains `>=22.22.2 <23 || >=24.0.0 <27` as declared by the repository.

---

## File Structure

Create focused files with one responsibility each:

- `src/domain/lumexus-brain/types.ts` — IDs, enums, Mission/Task/Agent/Execution/Decision/Verification contracts.
- `src/domain/lumexus-brain/businessUnits.ts` — canonical business namespace registry and validation.
- `src/domain/lumexus-brain/policy.ts` — autonomy levels and effective-policy evaluation.
- `src/domain/lumexus-brain/taskState.ts` — legal task transitions.
- `src/domain/lumexus-brain/events.ts` — versioned event envelope, canonical event types, redaction helper.
- `src/domain/lumexus-brain/progress.ts` — task-graph progress projection.
- `src/domain/lumexus-brain/recovery.ts` — bounded retry/recovery/rollback state decisions.
- `src/server/services/lumexus-brain/agentRegistry.ts` — scoped agent registration/capability checks.
- `src/server/services/lumexus-brain/stores.ts` — store interfaces and deterministic in-memory implementations.
- `src/server/services/lumexus-brain/decisionQueue.ts` — decision creation and approve/reject/modify semantics.
- `src/server/services/lumexus-brain/brainService.ts` — vertical-slice orchestration and verification gating.
- `src/server/services/lumexus-brain/runtimePulseProjection.ts` — Brain state/events to System Pulse read model.
- `src/server/services/lumexus-brain/runtime.ts` — process-local reference runtime singleton for v0.1 API routes.
- `src/app/api/lumexus/brain/status/route.ts` — authenticated status read.
- `src/app/api/lumexus/brain/runtime-pulse/route.ts` — authenticated Brain pulse read.
- `src/app/api/lumexus/brain/decisions/route.ts` — authenticated queue read.
- `src/app/api/lumexus/brain/decisions/[id]/route.ts` — authenticated decision outcome write.
- `tests/unit/lumexus-brain/*.test.ts` — deterministic contracts for every core primitive.

---

### Task 1: Domain contracts and business namespaces

**Files:**
- Create: `src/domain/lumexus-brain/types.ts`
- Create: `src/domain/lumexus-brain/businessUnits.ts`
- Test: `tests/unit/lumexus-brain/domain.test.ts`

**Interfaces:**
- Produces: `BusinessUnitId`, `AutonomyLevel`, `TaskStatus`, `Mission`, `BrainTask`, `AgentDefinition`, `Execution`, `VerificationResult`, `DecisionRequest`.
- Produces: `BUSINESS_UNITS`, `isBusinessUnitId(value): value is BusinessUnitId`.

- [ ] **Step 1: Write the failing domain test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { BUSINESS_UNITS, isBusinessUnitId } from "../../../src/domain/lumexus-brain/businessUnits.ts";

test("Lumexus Brain registers canonical business namespaces", () => {
  assert.deepEqual(BUSINESS_UNITS, [
    "lumexus-ai", "muscle-boulevard", "cypher-biopeptides",
    "real-peptide-news", "repolife", "omniroute", "jarvis",
  ]);
  assert.equal(isBusinessUnitId("repolife"), true);
  assert.equal(isBusinessUnitId("unknown-company"), false);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --import tsx/esm --test tests/unit/lumexus-brain/domain.test.ts`
Expected: FAIL because the Lumexus Brain modules do not exist.

- [ ] **Step 3: Implement the minimal typed contracts**

Define the exact canonical union:

```ts
export type BusinessUnitId =
  | "lumexus-ai" | "muscle-boulevard" | "cypher-biopeptides"
  | "real-peptide-news" | "repolife" | "omniroute" | "jarvis";
export type AutonomyLevel = 0 | 1 | 2 | 3 | 4;
```

Define the spec fields for Mission, BrainTask, AgentDefinition, Execution, VerificationResult, and DecisionRequest. Keep payload/input/output fields `unknown` or reference IDs instead of coupling the domain to provider SDKs.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --import tsx/esm --test tests/unit/lumexus-brain/domain.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/lumexus-brain/types.ts src/domain/lumexus-brain/businessUnits.ts tests/unit/lumexus-brain/domain.test.ts
git commit -m "feat: add Lumexus Brain domain contracts"
```

---

### Task 2: Autonomy policy engine

**Files:**
- Create: `src/domain/lumexus-brain/policy.ts`
- Test: `tests/unit/lumexus-brain/policy.test.ts`

**Interfaces:**
- Consumes: `AutonomyLevel`.
- Produces: `calculateEffectiveAutonomy(input): AutonomyLevel`.
- Produces: `evaluateActionPolicy(input): { allowed: boolean; requiresDecision: boolean; effectiveLevel: AutonomyLevel; reason: string }`.

- [ ] **Step 1: Write failing tests for minimum-ceiling behavior and L4 escalation**

```ts
assert.equal(calculateEffectiveAutonomy({ task: 3, agent: 2, business: 3, environment: 3, action: 3 }), 2);
const result = evaluateActionPolicy({ requested: 3, ceilings: { agent: 3, business: 3, environment: 3, action: 4 }, flags: { irreversible: true } });
assert.equal(result.requiresDecision, true);
assert.equal(result.allowed, false);
```

Also assert that `securitySensitive`, `legalComplianceSensitive`, `majorProductionDeployment`, and `highFinancialImpact` force Decision Queue handling.

- [ ] **Step 2: Run and verify RED**

Run: `node --import tsx/esm --test tests/unit/lumexus-brain/policy.test.ts`
Expected: FAIL because policy functions do not exist.

- [ ] **Step 3: Implement pure policy functions**

Use `Math.min()` across requested/agent/business/environment/action ceilings. Treat risk flags as an L4 approval requirement regardless of a numerically higher preauthorization. Never accept a prompt-provided override field.

- [ ] **Step 4: Run and verify GREEN**

Run the focused policy test; expected PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/lumexus-brain/policy.ts tests/unit/lumexus-brain/policy.test.ts
git commit -m "feat: enforce Lumexus Brain autonomy policy"
```

---

### Task 3: Task execution and verification state machine

**Files:**
- Create: `src/domain/lumexus-brain/taskState.ts`
- Test: `tests/unit/lumexus-brain/taskState.test.ts`

**Interfaces:**
- Produces: `canTransitionTask(from, to): boolean`.
- Produces: `transitionTask(task, next, context): BrainTask`.
- `context.verificationPassed` is required for `verifying -> succeeded`.

- [ ] **Step 1: Write failing legal/illegal transition tests**

Assert `queued -> eligible` is legal, `queued -> succeeded` is illegal, `awaiting_decision -> running` is legal only with approved decision context, and `verifying -> succeeded` throws unless `verificationPassed === true`.

- [ ] **Step 2: Run and verify RED**

Run: `node --import tsx/esm --test tests/unit/lumexus-brain/taskState.test.ts`.

- [ ] **Step 3: Implement an explicit transition adjacency map**

Do not infer transitions by ordinal status. Throw an `Error` containing both source and destination for illegal transitions. Apply the verification and approval guards after adjacency validation.

- [ ] **Step 4: Run and verify GREEN**

Focused state-machine test must PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/lumexus-brain/taskState.ts tests/unit/lumexus-brain/taskState.test.ts
git commit -m "feat: add verified Brain task state machine"
```

---

### Task 4: Versioned Brain events and safe redaction

**Files:**
- Create: `src/domain/lumexus-brain/events.ts`
- Test: `tests/unit/lumexus-brain/events.test.ts`

**Interfaces:**
- Produces: `BrainEventType`, `BrainEvent`, `createBrainEvent(input): BrainEvent`.
- Produces: `redactEventPayload(payload, sensitiveKeys): unknown`.

- [ ] **Step 1: Write failing event tests**

Assert schema version `1`, correlation/causation preservation, canonical `TASK_STARTED` creation, and recursive redaction of keys such as `apiKey`, `authorization`, `token`, and `secret` to `"[REDACTED]"`.

- [ ] **Step 2: Run and verify RED**

Run the focused events test.

- [ ] **Step 3: Implement immutable event construction and recursive redaction**

Generate IDs with `crypto.randomUUID()` from the Node runtime. Copy payloads before redaction; never mutate caller-owned objects.

- [ ] **Step 4: Run and verify GREEN**

Focused events test must PASS.

- [ ] **Step 5: Commit**

Commit event files with message `feat: add Lumexus Brain event contracts`.

---

### Task 5: Agent registry and capability enforcement

**Files:**
- Create: `src/server/services/lumexus-brain/agentRegistry.ts`
- Test: `tests/unit/lumexus-brain/agentRegistry.test.ts`

**Interfaces:**
- Produces: `AgentRegistry.register(definition)`, `.get(id)`, `.list(businessUnitId?)`, `.canExecute(agentId, task)`.

- [ ] **Step 1: Write failing tests**

Register an Engineering agent scoped to `lumexus-ai` with `code.write`; assert it may execute a matching Lumexus task and is rejected for a `cypher-biopeptides` task or undeclared tool/capability.

- [ ] **Step 2: Run and verify RED**

Run the focused registry test.

- [ ] **Step 3: Implement registry checks**

Require enabled agent, matching business scope, every required capability, every required tool, and task autonomy not exceeding the agent ceiling.

- [ ] **Step 4: Run and verify GREEN**

Focused registry test must PASS.

- [ ] **Step 5: Commit**

Commit with `feat: add scoped Lumexus agent registry`.

---

### Task 6: Stores and Decision Queue

**Files:**
- Create: `src/server/services/lumexus-brain/stores.ts`
- Create: `src/server/services/lumexus-brain/decisionQueue.ts`
- Test: `tests/unit/lumexus-brain/decisionQueue.test.ts`

**Interfaces:**
- Produces store interfaces: `MissionStore`, `TaskStore`, `AgentRegistryStore`, `EventStore`, `DecisionStore`, `ExecutionStore`, `VerificationStore`.
- Produces deterministic `InMemory*Store` implementations.
- Produces `DecisionQueue.request()`, `.resolve(id, outcome)`, `.listPending()`.

- [ ] **Step 1: Write failing queue tests**

Create a pending request; assert pending list contains it. Resolve separately with `approved`, `rejected`, and `modified`; assert status, decisionBy, decidedAt. Assert expired requests never auto-approve.

- [ ] **Step 2: Run and verify RED**

Run the focused Decision Queue test.

- [ ] **Step 3: Implement stores and queue**

Stores return copies or immutable values so tests cannot mutate internal state accidentally. `resolve` rejects unknown IDs and terminal requests.

- [ ] **Step 4: Run and verify GREEN**

Focused queue test must PASS.

- [ ] **Step 5: Commit**

Commit with `feat: add Crazy E Decision Queue core`.

---

### Task 7: Recovery and retry budget state machine

**Files:**
- Create: `src/domain/lumexus-brain/recovery.ts`
- Test: `tests/unit/lumexus-brain/recovery.test.ts`

**Interfaces:**
- Produces: `nextRecoveryAction(input): "retry" | "recover" | "rollback" | "isolate" | "escalate"`.
- Produces: `calculateBackoffMs(attempt, baseMs, maxMs): number`.

- [ ] **Step 1: Write failing tests**

Assert retries stay below `maxAttempts`, backoff is bounded, exhausted safe repair selects rollback when available, failed rollback selects isolation/escalation, and no input can create an infinite retry result after exhaustion.

- [ ] **Step 2: Run and verify RED**

Run focused recovery tests.

- [ ] **Step 3: Implement deterministic recovery policy**

Use bounded exponential backoff `Math.min(maxMs, baseMs * 2 ** attempt)`. Recovery decisions depend only on declared attempts, repair safety, rollback availability, and isolation state.

- [ ] **Step 4: Run and verify GREEN**

Focused recovery tests must PASS.

- [ ] **Step 5: Commit**

Commit with `feat: add bounded Brain recovery policy`.

---

### Task 8: Brain orchestration vertical slice

**Files:**
- Create: `src/server/services/lumexus-brain/brainService.ts`
- Test: `tests/unit/lumexus-brain/brainService.test.ts`

**Interfaces:**
- Consumes: stores, `AgentRegistry`, policy, state machine, event creation, Decision Queue.
- Produces: `BrainService.createMission()`, `.evaluateTask()`, `.recordExecutionResult()`, `.recordVerification()`.

- [ ] **Step 1: Write failing end-to-end domain test**

Build one mission and task. Assert an L2 reversible task with valid agent scope becomes runnable, an L4 task enters `awaiting_decision`, failed verification prevents success, and passed verification allows `succeeded`. Assert emitted events share mission/task correlation IDs.

- [ ] **Step 2: Run and verify RED**

Run focused BrainService test.

- [ ] **Step 3: Implement minimal orchestration**

Keep model calls out of BrainService. It coordinates policy/state/stores/events only. Provider execution remains an adapter boundary for later work and will ultimately call OmniRoute.

- [ ] **Step 4: Run and verify GREEN**

Focused BrainService test must PASS.

- [ ] **Step 5: Commit**

Commit with `feat: orchestrate Lumexus Brain mission lifecycle`.

---

### Task 9: Real task-graph progress and Runtime Pulse projection

**Files:**
- Create: `src/domain/lumexus-brain/progress.ts`
- Create: `src/server/services/lumexus-brain/runtimePulseProjection.ts`
- Test: `tests/unit/lumexus-brain/runtimePulseProjection.test.ts`

**Interfaces:**
- Produces: `calculateMissionProgress(tasks): { percentage: number | null; completed: number; total: number }`.
- Produces: `buildRuntimePulseProjection(snapshot)` with active missions/tasks, blockers, retries, verification, failures, recoveries, decisions, route metadata, and queue depth.

- [ ] **Step 1: Write failing projection tests**

Assert weighted completed tasks produce the mathematically correct percentage. Assert no weights returns `percentage: null` and accurate counts. Assert pending decisions appear as blockers and failed/recovered events are separately counted.

- [ ] **Step 2: Run and verify RED**

Run focused projection test.

- [ ] **Step 3: Implement projection from stored state only**

Do not estimate based on timestamps. Do not invent provider health. Provider/model metadata is included only when present on actual executions/events.

- [ ] **Step 4: Run and verify GREEN**

Focused projection test must PASS.

- [ ] **Step 5: Commit**

Commit with `feat: project Brain state into Runtime Pulse`.

---

### Task 10: Minimal authenticated Brain APIs

**Files:**
- Create: `src/server/services/lumexus-brain/runtime.ts`
- Create: `src/app/api/lumexus/brain/status/route.ts`
- Create: `src/app/api/lumexus/brain/runtime-pulse/route.ts`
- Create: `src/app/api/lumexus/brain/decisions/route.ts`
- Create: `src/app/api/lumexus/brain/decisions/[id]/route.ts`
- Test: `tests/unit/lumexus-brain/api.test.ts`

**Interfaces:**
- Reuses: `isAuthenticated` from `@/shared/utils/apiAuth` following existing route conventions.
- GET status returns schema version plus mission/task/agent/decision counts.
- GET runtime-pulse returns the projection from Task 9.
- GET decisions returns pending decisions.
- PUT decision `[id]` accepts only `{ outcome: "approved" | "rejected" | "modified", decisionBy: string, modification?: unknown }`.

- [ ] **Step 1: Write failing route contract tests**

Assert unauthenticated write is rejected using the repository's auth test pattern. Assert invalid decision outcomes return 400. Assert valid reads return JSON with explicit `schemaVersion: 1`.

- [ ] **Step 2: Run and verify RED**

Run focused API test.

- [ ] **Step 3: Implement process-local v0.1 runtime and routes**

The singleton wires in-memory stores, AgentRegistry, DecisionQueue, and BrainService. This is a reference runtime only; no claim of durable persistence. Follow the same NextResponse/auth style used by existing OmniRoute API routes.

- [ ] **Step 4: Run and verify GREEN**

Focused API test must PASS.

- [ ] **Step 5: Commit**

Commit with `feat: expose authenticated Lumexus Brain APIs`.

---

### Task 11: Regression, security, and repository verification

**Files:**
- Modify only if a verified failure is caused by Brain Core.
- Verify: existing Runtime Pulse, monitoring health, lint/type/quality gates.

**Interfaces:**
- Produces no new public API; this is the release gate.

- [ ] **Step 1: Run all Brain tests together**

Run: `node --import tsx/esm --test "tests/unit/lumexus-brain/**/*.test.ts"`
Expected: all PASS.

- [ ] **Step 2: Run scoped repository tests**

Run: `npm run test:scoped`
Expected: PASS for changed files. If repository tooling cannot map new files, run the exact focused tests plus the relevant API/auth suites and document that fact.

- [ ] **Step 3: Run lint on changed code**

Run: `npx eslint src/domain/lumexus-brain src/server/services/lumexus-brain src/app/api/lumexus/brain tests/unit/lumexus-brain`
Expected: zero new errors.

- [ ] **Step 4: Run security-sensitive checks**

Run the repository security tests/checks applicable to API/auth and secret leakage. Verify event-redaction tests explicitly pass.

- [ ] **Step 5: Verify Runtime Pulse regression**

Run the existing Runtime Pulse-focused tests from the merged feature and verify `/api/monitoring/health` contract is unchanged by Brain Core.

- [ ] **Step 6: Inspect branch diff**

Confirm no provider routing implementation was duplicated, no secrets were added, no unrelated refactor landed, and no L4 action can execute without an explicit decision.

- [ ] **Step 7: Commit any test-only corrections**

```bash
git add -A
git commit -m "test: verify Lumexus Brain Core vertical slice"
```

- [ ] **Step 8: Open PR**

Open a PR from `feature/lumexus-brain-core` to `release/v3.8.50` titled `feat: add Lumexus Brain Core v0.1`. The PR body must list the spec, architecture boundaries, tests actually run, known repository-wide failures if any, and explicitly state that v0.1 uses process-local reference stores rather than claiming durable persistence.

---

## Plan Self-Review

- Spec coverage: domain, namespaces, agents, policy, lifecycle, events, verification, Decision Queue, recovery, stores, Runtime Pulse projection, APIs, security/redaction, failure isolation, and CI are each mapped to a task.
- Provider routing remains exclusively an OmniRoute responsibility.
- Jarvis voice, durable organizational memory, CRM/finance/inventory integrations, and unrestricted production autonomy remain outside v0.1 as required by the spec.
- No timeout path can approve a decision.
- No task-success path bypasses verification.
- No progress path fabricates percentages when task weights are unavailable.
