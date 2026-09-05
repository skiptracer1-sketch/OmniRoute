# Lumexus Native Swarm Engine — Design Specification

Date: 2026-09-05
Status: Approved design baseline
Owner: Crazy E
Repository: skiptracer1-sketch/OmniRoute
Base branch: release/v3.8.50
Design branch: design/lumexus-native-swarm

## 1. Objective

Create a Lumexus-owned multi-agent swarm subsystem that extends the existing Lumexus Brain Core without replacing it. The first production swarm is Security Swarm. The architecture must be reusable for Engineering, QA, Research, DevOps, and Business swarms.

The implementation must remain proprietary-friendly. Pentest-Swarm-AI may inform architectural research, but its AGPL-licensed source code must not be copied into the OmniRoute core. Any future interoperability must occur through an explicit adapter/process boundary.

## 2. System Position

Crazy E → Lumexus Brain → Swarm Supervisor → Swarm Runtime → OmniRoute model routing → Specialized Agents → Tool/Worker Isolation → Shared Blackboard/Event Fabric → Verification/Evidence → Runtime Pulse → Crazy E Decision Queue.

The Lumexus Brain remains the authoritative control plane for mission policy, task state, approvals, recovery, escalation, and observability. The Swarm Engine is a subordinate execution subsystem.

## 3. Core Design Principles

1. Native Lumexus ownership: no AGPL source inside proprietary core.
2. Least privilege by default: each agent receives only the tools, credentials, scope, and data required for its task.
3. Policy before execution: all agent actions pass through explicit authorization gates.
4. Event-driven coordination: agents react to typed events and shared findings rather than relying on one fixed linear chain.
5. Verifiable outputs: findings require provenance, evidence, confidence, and optional second-agent verification.
6. Bounded autonomy: budgets, timeouts, tool limits, kill switches, and destructive-action approval gates are mandatory.
7. Observable by design: every swarm run must project health, state, cost, risk, and progress into Runtime Pulse.
8. Reusable swarm kernel: security-specific logic must be implemented as policies, roles, tools, and workflows on top of generic primitives.

## 4. Major Components

### 4.1 Swarm Supervisor

Responsibilities:
- Accept missions from Lumexus Brain.
- Expand missions into swarm objectives.
- Select swarm type and active agent roles.
- Apply execution budgets and risk policies.
- Start, pause, resume, cancel, or terminate runs.
- Escalate blocked/high-risk decisions to Crazy E Decision Queue.

The Supervisor does not directly perform security operations. It orchestrates policy-compliant work.

### 4.2 Swarm Runtime

Provides generic primitives:
- swarm_run
- swarm_task
- agent_instance
- finding
- evidence
- event
- approval_request
- tool_invocation
- budget
- checkpoint

The runtime schedules work, maintains state transitions, handles retries, and enforces concurrency limits.

### 4.3 Lumexus Blackboard

A structured shared-state layer for findings and inter-agent coordination.

Required fields for each finding:
- finding_id
- swarm_run_id
- source_agent
- type
- target/scope
- severity
- confidence
- evidence_refs
- status
- verification_status
- created_at
- updated_at
- ttl/priority_decay metadata

The blackboard must not become an unbounded chat log. It stores typed, queryable operational facts.

### 4.4 Event Fabric

Typed internal events include:
- mission.accepted
- task.created
- agent.started
- finding.created
- finding.updated
- finding.verification_requested
- finding.verified
- tool.requested
- tool.allowed
- tool.denied
- approval.requested
- approval.granted
- approval.denied
- budget.warning
- budget.exhausted
- agent.failed
- agent.recovered
- swarm.paused
- swarm.completed
- swarm.aborted

Events are append-only operational records and feed Runtime Pulse projections.

### 4.5 OmniRoute Integration

OmniRoute selects the best model per agent/task using policy inputs such as:
- required capability
- latency target
- cost ceiling
- context size
- reliability score
- tool-calling ability
- data sensitivity
- provider availability

Model selection is not hard-coded into agent roles. Agent definitions declare capability requirements; OmniRoute resolves the provider/model at runtime.

### 4.6 Tool Gateway / Worker Isolation

Agents never receive unrestricted shell/network access.

All tools execute through a gateway that enforces:
- allowlisted tool identity
- authorized targets
- read/write/destructive classification
- timeout
- CPU/memory/runtime limits where applicable
- network egress policy
- credential scope
- audit logging
- result capture

Potentially destructive security tooling must execute only inside isolated workers/sandboxes against explicitly authorized targets.

## 5. Security Swarm v1

Initial roles:

### Recon Agent
Passive discovery and authorized attack-surface inventory.

### Surface Analysis Agent
Normalizes discovered assets/services and identifies areas requiring investigation.

### Vulnerability Classification Agent
Maps observations to candidate weaknesses, prioritizes by severity, confidence, exploitability, and business impact.

### Verification Agent
Independently validates findings using safe techniques and evidence review. It reduces false positives and can downgrade confidence.

### Remediation Agent
Produces mitigation guidance, configuration/code recommendations, and patch candidates. It does not deploy fixes without policy authorization.

### Regression Agent
Re-tests remediated findings in an approved test environment and records pass/fail evidence.

### Reporting Agent
Produces executive and technical summaries from verified findings only, clearly separating confirmed, suspected, and rejected findings.

## 6. Authorization Model

Actions are classified into policy tiers:

Tier 0 — Read-only internal reasoning: autonomous.
Tier 1 — Passive external discovery on authorized assets: autonomous if mission scope permits.
Tier 2 — Active non-destructive validation: requires explicit policy allowance for the target/run.
Tier 3 — Potentially disruptive/destructive action: requires Crazy E Decision Queue approval and isolated execution.
Tier 4 — Production-changing remediation/deployment: separate change approval path; never implied by a pentest mission.

A target outside the declared scope is always denied regardless of agent request.

## 7. Agent Lifecycle

States:
created → queued → routing → running → waiting → verifying → completed

Exceptional states:
blocked, denied, failed, retrying, paused, cancelled, terminated

Each state transition emits an event. Retry policy is bounded and centrally controlled.

## 8. Data Flow

1. Lumexus Brain creates a swarm mission with scope, objective, risk policy, and budget.
2. Swarm Supervisor creates a swarm run and initial tasks.
3. OmniRoute selects models for active agent roles.
4. Agents read scoped blackboard facts and request tool actions through Tool Gateway.
5. Tool Gateway authorizes/denies the request and records an audit event.
6. Agents write typed findings and evidence references to the blackboard.
7. Findings above configured thresholds trigger verification or downstream tasks.
8. High-risk actions trigger Decision Queue approval requests.
9. Runtime Pulse receives projections for run state, agent health, cost, risk, findings, queue depth, and failures.
10. Completion produces a signed/immutable run summary and verification status.

## 9. Runtime Pulse Integration

Expose at minimum:
- active swarm runs
- swarm type
- mission owner
- agents active/queued/failed
- task queue depth
- findings by severity/status
- verification backlog
- approvals waiting
- cost/token budget used vs remaining
- tool error rate
- model/provider fallback count
- recovery attempts
- run elapsed time
- risk state

The dashboard must allow safe pause/cancel controls for authorized administrators.

## 10. Decision Queue Integration

Decision Queue entries created by Swarm Engine include:
- requested action
- requester agent
- swarm run
- target
- justification
- risk tier
- expected impact
- rollback/containment plan when applicable
- evidence references
- expiration/timeout

Approval is narrowly scoped to the requested action. It must not become standing permission for future actions.

## 11. Failure Handling and Self-Recovery

Supported recovery behavior:
- model/provider failure → OmniRoute fallback within policy
- agent crash → bounded restart from last checkpoint
- malformed agent output → schema rejection + repair attempt
- tool timeout → retry only if idempotent and within budget
- blackboard write conflict → transactional retry
- worker isolation failure → hard stop for affected task
- scope/policy denial → no retry unless policy changes
- repeated systemic failure → pause swarm and escalate to Runtime Pulse/Decision Queue

No recovery path may weaken authorization controls.

## 12. Security Boundaries

- No shared unrestricted API keys between agents.
- Secrets are referenced through scoped handles; never placed in prompts/events/logs.
- External content is treated as untrusted and must not override system policy.
- Tool results are data, not authority.
- Prompt injection defense applies to web/content-consuming agents.
- Cross-business data access is denied unless explicitly authorized by Lumexus Brain policy.
- Audit logs must be tamper-evident or append-only.
- Destructive tools require explicit approval and sandboxing.

## 13. Clean-Room / License Boundary

Pentest-Swarm-AI is an architectural reference only.

Rules:
- Do not copy source files, functions, class names, internal schemas, prompts, tests, or documentation text into Lumexus core.
- Re-implement concepts independently from this specification and public high-level behavior.
- Record third-party dependencies and licenses through normal dependency review.
- If Pentest-Swarm-AI interoperability is later desired, implement it as an optional external adapter/process with a documented AGPL boundary and legal review before production exposure.

## 14. API Surface (Initial)

Proposed internal endpoints/services:
- POST /api/lumexus/swarms
- GET /api/lumexus/swarms/:id
- POST /api/lumexus/swarms/:id/pause
- POST /api/lumexus/swarms/:id/resume
- POST /api/lumexus/swarms/:id/cancel
- GET /api/lumexus/swarms/:id/findings
- GET /api/lumexus/swarms/:id/events
- POST /api/lumexus/swarms/:id/approvals

All routes inherit the existing authenticated API architecture and server-side role enforcement.

## 15. Suggested Internal Modules

Exact paths should follow current repo conventions discovered during implementation, but responsibilities should remain separated:
- swarm domain types/schemas
- swarm repository/state store
- supervisor/orchestrator
- scheduler
- policy engine integration
- agent registry
- OmniRoute adapter
- blackboard service
- event service
- tool gateway
- evidence service
- Runtime Pulse projector
- Decision Queue adapter
- Security Swarm role definitions

Avoid a monolithic swarm service.

## 16. Testing Strategy

### Unit tests
- state machine transitions
- policy tier enforcement
- target scope enforcement
- budget enforcement
- event emission
- finding schema validation
- priority/TTL behavior
- approval binding
- retry rules

### Integration tests
- Lumexus Brain → swarm mission creation
- OmniRoute model assignment/fallback
- agent → Tool Gateway authorization
- blackboard coordination
- finding → verification trigger
- Tier 3 action → Decision Queue
- Runtime Pulse projections
- cancellation/pause/recovery

### Security tests
- out-of-scope target denial
- privilege escalation attempts
- prompt injection from external content
- secret leakage attempts
- unauthorized admin route access
- replayed approval token/action
- tool invocation tampering

### Acceptance test
A fully simulated Security Swarm run against a local intentionally vulnerable sandbox target must complete discovery, classify a known issue, independently verify it, produce evidence, generate remediation guidance, update Runtime Pulse, and finish without any unauthorized network target or destructive action.

## 17. Initial Delivery Sequence

Phase 1: Generic Swarm Kernel — domain model, state machine, event fabric, blackboard, supervisor skeleton.

Phase 2: Control Plane Integration — Lumexus Brain policies, Decision Queue, Runtime Pulse, authenticated APIs.

Phase 3: OmniRoute + Agent Registry — capability-based model routing and agent lifecycle.

Phase 4: Tool Gateway + Isolation — scoped tool execution, audit events, safe local workers.

Phase 5: Security Swarm v1 — Recon, Surface Analysis, Vulnerability Classification, Verification, Remediation, Regression, Reporting.

Phase 6: End-to-End Sandbox Validation — intentionally vulnerable local target, adversarial tests, failure/recovery tests, documentation.

## 18. Explicit Non-Goals for v1

- unrestricted autonomous exploitation
- production network attack automation
- self-modifying authorization policy
- autonomous production remediation/deployment
- copying AGPL implementation code
- building every future swarm type in the first release

## 19. Success Criteria

The first release is successful when:
- the generic swarm kernel can run multiple typed agents concurrently;
- OmniRoute can route models per agent/task;
- agents coordinate through typed findings/events;
- every tool invocation is policy-checked and audited;
- high-risk actions cannot execute without explicit approval;
- Runtime Pulse accurately reports run/agent/risk state;
- Decision Queue receives scoped high-risk requests;
- a complete Security Swarm sandbox run passes without escaping its authorized scope;
- no AGPL source is incorporated into the proprietary Lumexus core.
