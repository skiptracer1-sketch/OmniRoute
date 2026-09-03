# Lumexus Brain Core v0.1 — Architecture Design

Date: 2026-09-03
Status: Proposed foundation approved in chat for specification
Branch: `feature/lumexus-brain-core`
Base: `release/v3.8.50`

## 1. Purpose

Lumexus Brain Core is the shared control-plane foundation for the Lumexus ecosystem. It sits above OmniRoute and below the business-facing applications, dashboards, agents, and interfaces.

The system exists to convert Crazy E's strategic direction into safe, observable, verifiable machine execution across Lumexus AI, Muscle Boulevard, Cypher Biopeptides, Real Peptide News, RepoLife, OmniRoute, Jarvis, and future businesses.

The operating hierarchy is:

Crazy E → Jarvis / Mission Control → Lumexus Brain → Specialized Agents → OmniRoute / Tool Routing → External Models / Tools / APIs / Databases / Infrastructure → Verification → Results → Decision Queue

Crazy E remains the final decision-maker for strategic, irreversible, security-sensitive, legal/compliance-sensitive, and high-financial-impact actions. Routine reversible actions may execute autonomously when explicitly permitted by policy.

## 2. Core lifecycle

Every Brain-managed mission follows the same stateful lifecycle:

DISCOVER → ANALYZE → DESIGN → BUILD → TEST → VERIFY → DEPLOY → MONITOR → SELF-CORRECT → OPTIMIZE → SCALE

This lifecycle is represented in code as explicit task and execution states rather than implied prompt behavior.

A mission may stop, branch, retry, roll back, or escalate at any phase. No phase transition is considered successful solely because an AI model says it succeeded. State transitions must be backed by machine-verifiable evidence whenever such evidence is technically available.

## 3. Architectural position of OmniRoute

OmniRoute remains the AI routing and provider abstraction layer. Lumexus Brain must not duplicate provider routing logic that OmniRoute already owns.

OmniRoute responsibilities:

- model/provider discovery
- provider authentication surfaces
- capability-aware routing
- latency/cost/reliability-aware routing
- fallback between models/providers
- OpenAI-compatible API compatibility
- MCP/A2A and related tool/provider connectivity
- provider telemetry
- quota and utilization telemetry
- model access for OpenAI, Anthropic/OpenClaude, Google, xAI, open-source/local models, Reactor, Hugging Face-backed inference, and future providers

Lumexus Brain responsibilities:

- missions
- task graphs
- agent registry
- business namespaces
- policy and autonomy levels
- execution orchestration
- event normalization
- verification
- recovery
- decision escalation
- organizational memory contracts
- cross-business operating state
- Jarvis/Mission Control data contracts
- Runtime Pulse/System Pulse data contracts

This separation preserves model independence and prevents Lumexus Brain from becoming a second AI router.

## 4. Initial scope

Lumexus Brain Core v0.1 establishes the control-plane contracts and runtime primitives required for later autonomous execution.

Included in v0.1:

1. typed Brain domain model
2. business namespace registry
3. specialized agent registry
4. mission and task graph contracts
5. event envelope and event taxonomy
6. autonomy/policy levels
7. execution lifecycle state machine
8. verification result contracts
9. recovery state machine
10. Crazy E Decision Queue contracts
11. Runtime Pulse event contracts
12. in-memory reference implementations where useful for tests
13. persistence interfaces without forcing a final database choice
14. focused unit/contract tests
15. API boundaries required by future dashboards and Jarvis

Not included in v0.1:

- unrestricted autonomous production deployment
- autonomous spending or purchasing
- permanent organizational-memory implementation
- final vector database selection
- full Jarvis voice runtime
- full cross-business CRM integration
- full finance ingestion
- live inventory automation
- legal/compliance decision automation
- direct secrets management implementation
- broad refactoring of unrelated OmniRoute internals

Those are later layers built on the core contracts.

## 5. Domain model

The core domain types are designed to be independently understandable and testable.

### 5.1 BusinessUnit

Represents the operating namespace that owns a mission, task, agent, decision, or event.

Initial identifiers:

- `lumexus-ai`
- `muscle-boulevard`
- `cypher-biopeptides`
- `real-peptide-news`
- `repolife`
- `omniroute`
- `jarvis`

Future businesses must be addable without changing Brain core logic.

### 5.2 Mission

Represents a strategic objective issued by Crazy E or an authorized upstream system.

Core fields:

- id
- businessUnitId
- title
- objective
- priority
- constraints
- budgetPolicy reference
- riskPolicy reference
- createdBy
- createdAt
- currentPhase
- status
- taskGraphId
- decisionRequirements
- metadata

### 5.3 Task

Represents one independently executable unit in a mission task graph.

Core fields:

- id
- missionId
- businessUnitId
- assignedAgentId
- dependencies
- requiredCapabilities
- requiredTools
- autonomyLevel
- status
- attemptCount
- maxAttempts
- timeoutPolicy
- rollbackPolicy
- verificationPolicy
- input reference
- output reference
- evidence references

### 5.4 AgentDefinition

Defines a specialized role and its permitted capabilities.

Initial agent categories:

- CEO Intelligence
- Engineering
- Architecture
- Research
- Cybersecurity
- DevOps
- Database
- QA / Testing
- Finance Intelligence
- Marketing
- Sales
- Customer Intelligence
- Operations
- Competitive Intelligence
- Content
- Compliance
- Inventory
- Infrastructure
- AI Model Router

Business-specific sub-agents may extend this registry without gaining permissions beyond their declared policy scope.

Core fields:

- id
- name
- category
- businessScopes
- capabilities
- allowedTools
- autonomyCeiling
- modelRequirements
- verificationRequirements
- enabled
- version

### 5.5 Execution

Represents one concrete attempt to perform one Task.

Core fields:

- id
- taskId
- agentId
- status
- startedAt
- finishedAt
- modelRoute metadata
- toolCalls
- evidence
- error
- retryOfExecutionId
- rollbackOfExecutionId
- verificationResultId

### 5.6 BrainEvent

Every meaningful change is emitted as a normalized event.

Envelope fields:

- eventId
- eventType
- occurredAt
- businessUnitId
- missionId optional
- taskId optional
- executionId optional
- agentId optional
- severity
- source
- correlationId
- causationId
- payload
- schemaVersion

Events are append-oriented and intended to support future persistent audit trails and event-driven consumers.

### 5.7 DecisionRequest

Represents an action requiring Crazy E's approval or modification.

Core fields:

- id
- businessUnitId
- missionId
- taskId optional
- category
- title
- problem
- context
- aiAnalysis
- recommendedAction
- alternatives
- upside
- risk
- estimatedCost
- reversibility
- confidence
- requestedAt
- expiresAt optional
- status
- decision
- decisionBy
- decidedAt

Supported decision outcomes:

- approved
- rejected
- modified
- expired
- withdrawn

## 6. Autonomy and policy model

Lumexus Brain must never infer unrestricted authority from a successful prior task.

Autonomy levels:

### L0 — Observe

Read-only inspection, health checks, telemetry, research retrieval, and analysis.

### L1 — Recommend

May produce recommendations, plans, code diffs, remediation proposals, and decision cards. No external mutation.

### L2 — Execute Reversible

May perform explicitly pre-authorized, reversible actions with audit evidence. Examples include retrying a failed job, restarting a noncritical isolated service, creating a branch, preparing a draft, or toggling a reversible feature flag where policy explicitly allows it.

### L3 — Controlled Production

May execute production mutations only inside narrow pre-authorized scopes with rollback, verification, bounded blast radius, and strong audit logging.

### L4 — Crazy E Approval Required

Required for strategic changes, irreversible actions, destructive operations, high-financial-impact actions, security-sensitive changes, legal/compliance-sensitive decisions, major production deployments, or anything outside explicit policy.

An agent's effective autonomy is the minimum of:

- task-requested autonomy
- agent autonomy ceiling
- business policy ceiling
- environment policy ceiling
- action-specific policy ceiling

No prompt may override this calculation.

## 7. Execution lifecycle

Task execution uses an explicit state machine.

Primary states:

- `queued`
- `eligible`
- `planning`
- `awaiting_policy`
- `awaiting_decision`
- `running`
- `testing`
- `verifying`
- `succeeded`
- `failed`
- `retry_scheduled`
- `recovering`
- `rolling_back`
- `rolled_back`
- `isolated`
- `cancelled`

Illegal transitions must be rejected.

A task may only reach `succeeded` after its required verification policy passes.

## 8. Event taxonomy

The first stable event names include:

- `MISSION_CREATED`
- `MISSION_UPDATED`
- `MISSION_COMPLETED`
- `TASK_CREATED`
- `TASK_READY`
- `TASK_STARTED`
- `TASK_COMPLETED`
- `TASK_FAILED`
- `AGENT_STARTED`
- `AGENT_COMPLETED`
- `AGENT_FAILED`
- `MODEL_ROUTE_SELECTED`
- `MODEL_FALLBACK`
- `TOOL_CALL_STARTED`
- `TOOL_CALL_COMPLETED`
- `TOOL_CALL_FAILED`
- `TEST_STARTED`
- `TEST_PASSED`
- `TEST_FAILED`
- `VERIFICATION_PASSED`
- `VERIFICATION_FAILED`
- `DEPLOY_STARTED`
- `DEPLOY_SUCCEEDED`
- `DEPLOY_FAILED`
- `SERVICE_DEGRADED`
- `SERVICE_FAILED`
- `RECOVERY_STARTED`
- `RECOVERY_SUCCEEDED`
- `RECOVERY_FAILED`
- `ROLLBACK_STARTED`
- `ROLLBACK_SUCCEEDED`
- `ROLLBACK_FAILED`
- `SECURITY_ALERT`
- `DECISION_REQUIRED`
- `DECISION_APPROVED`
- `DECISION_REJECTED`
- `DECISION_MODIFIED`
- `OPPORTUNITY_DETECTED`
- `CUSTOMER_CREATED`
- `PAYMENT_RECEIVED`
- `INVENTORY_LOW`

Business-specific events may be added, while shared infrastructure events should use canonical names whenever possible.

## 9. Self-healing and recovery

The recovery path is:

DETECT → DIAGNOSE → ATTEMPT SAFE REPAIR → TEST → VERIFY → RESTORE SERVICE

If safe repair fails:

ROLL BACK → ISOLATE FAILURE → KEEP REMAINING SYSTEMS RUNNING → ESCALATE

Every recovery action must declare:

- trigger
- diagnosis evidence
- blast radius
- safety classification
- permitted autonomy level
- repair action
- verification action
- rollback action
- max attempts
- escalation path

Automated recovery must be idempotent where practical. Repeated failure must not produce infinite retry storms.

Circuit breakers, retry budgets, exponential backoff, isolation boundaries, and failure counters are part of the runtime policy layer rather than hidden implementation details.

## 10. Verification model

Verification is separate from generation and execution.

The agent that performs a task may propose success evidence, while Brain policy determines whether that evidence is sufficient.

VerificationResult includes:

- id
- taskId
- executionId
- verifier type
- checks
- passed
- evidence
- confidence
- verifiedAt

Verifier types may include:

- deterministic test suite
- health endpoint
- schema validation
- static analysis
- security scan
- deployment status
- checksum/artifact comparison
- API contract probe
- database invariant check
- second-model review
- human approval

Model self-report alone is not sufficient verification for mutations with external side effects.

## 11. Decision Queue

The Crazy E Decision Queue is a first-class Brain domain, not merely dashboard UI.

A task enters `awaiting_decision` when policy requires L4 approval.

Decision cards must expose enough context to make a fast executive decision:

- Problem
- Context
- AI analysis
- Recommended action
- Alternatives
- Upside
- Risk
- Cost
- Reversibility
- Confidence
- Approve / Reject / Modify

No hidden default approval or timeout-to-approval behavior is allowed.

## 12. Runtime Pulse / System Pulse integration

Runtime Pulse evolves from a health screen into a consumer of Brain events and execution state.

The Brain will expose stable read contracts for:

- active missions
- active tasks
- agent status
- current execution phase
- completed tasks
- remaining tasks
- blockers
- retries
- verification state
- failures
- recovered failures
- decision blockers
- provider/model route metadata
- latency
- queue depth
- infrastructure status
- security events

Progress percentages must be derived from actual task graph state, not fabricated from elapsed time or model prose.

A first acceptable calculation is weighted task completion using explicit task weights plus partial credit only for states whose policy allows measurable progress. If task weights are unavailable, the UI should show task counts and phase state instead of pretending precision.

## 13. Persistence and organizational memory boundaries

v0.1 defines interfaces rather than committing the Brain to a final persistence technology.

Required persistence abstractions:

- MissionStore
- TaskStore
- AgentRegistryStore
- EventStore
- DecisionStore
- ExecutionStore
- VerificationStore

Future organizational memory will persist decisions, architecture, projects, experiments, failures, fixes, customers, business rules, prompts, agent behavior, infrastructure changes, research, competitive intelligence, and lessons learned.

Critical business rules must be versioned and explicitly changed. Learning systems may propose policy modifications; they may not silently rewrite protected rules.

## 14. Jarvis integration boundary

Jarvis is the primary human interface to Lumexus Brain, not the Brain itself.

Jarvis consumes Brain APIs/events to answer executive questions such as:

"What's happening?"

The Brain should support a Mission Control briefing projection containing:

1. changes since last briefing
2. failures
3. self-healed incidents
4. pending decisions
5. opportunities
6. risks
7. revenue movement where data exists
8. customer activity where data exists
9. development progress
10. infrastructure health
11. competitive developments where data exists
12. relevant AI industry developments where data exists
13. recommended actions
14. top three priorities

The briefing layer must distinguish verified facts from analysis, inference, and unavailable data.

## 15. API boundary

The first implementation should expose Brain functionality through internal service interfaces first, with HTTP/API routes added only where the dashboard or Jarvis needs them.

Candidate read endpoints for the first vertical slice:

- `/api/lumexus/brain/status`
- `/api/lumexus/brain/missions`
- `/api/lumexus/brain/agents`
- `/api/lumexus/brain/events`
- `/api/lumexus/brain/decisions`
- `/api/lumexus/brain/runtime-pulse`

Candidate write endpoints:

- create mission
- submit decision outcome
- request task cancellation

Write routes must use existing OmniRoute authentication/authorization patterns and must not introduce a parallel auth system.

## 16. Security boundaries

Brain code must follow least privilege.

Requirements:

- no agent receives unrestricted production credentials
- secrets are referenced through existing secret-management patterns, never embedded in prompts or event payloads
- high-risk writes require policy evaluation before execution
- audit events are emitted for security-relevant actions
- sensitive payload fields must support redaction before logging
- business namespaces must not leak private data across business boundaries without explicit policy
- external tool adapters receive minimum required scope
- production recovery actions require bounded blast radius
- rollback paths are defined before L3 autonomous actions are permitted
- security events may immediately reduce autonomy or isolate an agent/tool

## 17. Failure isolation

One business, agent, provider, or integration failure must not unnecessarily stop the ecosystem.

Isolation boundaries:

- business unit
- mission
- task
- agent
- provider
- external tool
- deployment target

A failed provider should trigger OmniRoute fallback where permitted. A failed tool should fail or defer the dependent task, not crash unrelated missions. A security anomaly may isolate the affected scope while leaving unaffected systems operational.

## 18. Suggested code organization

The implementation plan should adapt to existing OmniRoute patterns after code inspection. The target logical boundaries are:

- `src/domain/lumexus-brain/`
  - types
  - mission
  - task
  - agent
  - event
  - decision
  - execution
  - verification
  - recovery
  - policy
- `src/server/services/lumexus-brain/`
  - orchestration services
  - stores/adapters
  - projections
- `src/app/api/lumexus/brain/` or repository-equivalent API location
  - read projections
  - decision writes
- `tests/unit/lumexus-brain/`
  - state machines
  - policy
  - event contracts
  - decision queue
  - recovery

Exact paths may be adjusted to match repository conventions discovered during implementation planning, while domain boundaries should remain intact.

## 19. Testing strategy

v0.1 requires focused tests before feature expansion.

Minimum test coverage areas:

- business namespace registration
- agent capability enforcement
- autonomy ceiling calculation
- forbidden policy escalation
- legal and illegal task state transitions
- event envelope validation
- correlation/causation propagation
- decision-required transitions
- approve/reject/modify decision behavior
- success blocked until verification passes
- retry budget enforcement
- recovery transition behavior
- rollback transition behavior
- isolation after repeated recovery failure
- progress calculation from task graph state
- redaction behavior for sensitive event payloads

Tests should prefer deterministic state machines and pure policy functions where possible.

## 20. First vertical slice acceptance criteria

Brain Core v0.1 is complete when all of the following are true:

1. A mission can be represented with business scope, constraints, risk/autonomy requirements, and a task graph.
2. Specialized agents can be registered with capabilities, business scopes, tool permissions, and autonomy ceilings.
3. Brain policy can decide whether a task may run automatically or must enter the Crazy E Decision Queue.
4. A task execution can move through legal lifecycle states and reject illegal transitions.
5. A successful execution cannot become a successful task until required verification passes.
6. Failures can enter bounded retry/recovery paths and escalate after exhaustion.
7. Brain events use one versioned envelope and can drive Runtime Pulse projections.
8. Decision requests expose the full executive decision contract.
9. Progress state is calculated from real task graph state rather than invented percentages.
10. Focused tests pass in the repository's normal CI environment.
11. Existing OmniRoute provider routing remains intact and is reused rather than duplicated.
12. Existing Runtime Pulse behavior is not broken.

## 21. Build order after this specification

Recommended implementation sequence:

1. domain types and schema contracts
2. autonomy/policy engine
3. task execution state machine
4. event envelope and event bus abstraction
5. agent registry
6. decision queue service
7. verification service contracts
8. recovery state machine
9. in-memory stores for deterministic tests
10. Runtime Pulse projection
11. minimal Brain read APIs
12. minimal decision write API
13. CI verification

Persistent production storage, cross-business integrations, Jarvis voice, finance/customer/inventory ingestion, and higher autonomy follow in later phases.

## 22. Architectural rules for future Lumexus features

Every future Lumexus feature should be evaluated against this question:

Does it increase the intelligence, autonomy, reliability, speed, profitability, or scalability of the Lumexus Brain?

If yes, it should integrate through shared Brain contracts instead of becoming an isolated dashboard or one-off agent.

If no, its architectural value should be challenged before it is added.

The long-term target is a continuously operating digital organization capable of thinking, building, testing, deploying, monitoring, repairing, learning, optimizing, and scaling 24/7 while Crazy E remains at the strategic decision layer.
