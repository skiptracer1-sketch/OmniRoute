# Lumexus Native Swarm v0.1 — Implementation Plan

## Goal
Deliver the first production-oriented vertical slice of a Lumexus-owned swarm runtime, beginning with a defensive Security Swarm, without importing AGPL source into the proprietary OmniRoute core.

## Guardrails
- Defensive/authorized use only.
- No unrestricted autonomous exploitation.
- Destructive or production-changing operations remain approval-gated through the Lumexus Brain Decision Queue.
- Least-privilege tool access, explicit scopes, auditability, timeouts, budgets, and kill-switch semantics.
- Clean-room implementation: architecture concepts may inform design; no copied Pentest-Swarm-AI source.

## Vertical Slice
1. Swarm domain types and lifecycle states.
2. Typed blackboard with append-only evidence/events.
3. Swarm supervisor that accepts a scoped mission and dispatches eligible agents.
4. Security role registry: recon, surface-analysis, vulnerability-classification, verification, remediation-planning, regression, reporting.
5. Tool Gateway policy contract with allow/deny/approval-required outcomes.
6. Runtime Pulse projection for swarm status, agent status, findings, errors, and approvals.
7. Decision Queue handoff contract for high-risk actions.
8. Unit tests covering lifecycle, policy gates, event flow, and fail-closed behavior.

## Execution Order
- RED: add focused tests for lifecycle and fail-closed policy behavior.
- GREEN: implement minimum swarm kernel/domain required for tests.
- RED/GREEN: blackboard/event fabric.
- RED/GREEN: Security Swarm registry and supervisor.
- RED/GREEN: policy/Decision Queue adapter and Runtime Pulse projection.
- REFACTOR: stabilize public interfaces and documentation.
- VERIFY: run targeted tests, typecheck/lint where available, then CI.

## Acceptance Criteria
- A scoped defensive mission can be created and transitions through deterministic swarm states.
- Only registered security roles can be dispatched.
- Tool requests outside declared scope fail closed.
- High-risk tool requests become approval-required records rather than executing automatically.
- Every state transition and finding is represented as an auditable event.
- Runtime Pulse can project swarm/agent health from events.
- Existing Brain Core behavior remains unchanged.
- No AGPL code or dependency is introduced into OmniRoute core.
