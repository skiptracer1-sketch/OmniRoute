# Reactor Native Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Reactor a first-class OmniRoute subsystem with model discovery, secure scoped token minting, session lifecycle tracking, and stable API endpoints consumed by Lumexus.ai.

**Architecture:** Keep the Reactor long-lived API key server-only. OmniRoute owns the Reactor registry, validates allowed models, mints model-scoped short-lived tokens through Reactor's official `https://api.reactor.inc/tokens` endpoint, and returns a stable bootstrap contract while WebRTC media flows directly between the authorized client and Reactor. Session metadata is tracked by OmniRoute without persisting media.

**Tech Stack:** TypeScript, Next.js App Router, native `fetch`, Node test runner already used by OmniRoute.

**Spec:** `docs/superpowers/specs/2026-09-02-reactor-native-integration-design.md`

## Global Constraints

- `REACTOR_API_KEY` remains server-only and must never appear in responses or logs.
- Reactor tokens are minted only for models in the native registry.
- No live paid Reactor generation is required by CI tests.
- Lumexus consumes OmniRoute's stable Reactor contracts, not the long-lived Reactor credential.
- WebRTC media is not proxied through ordinary OmniRoute HTTP endpoints.

---

### Task 1: Native Reactor registry and configuration

**Files:**
- Create: `src/lib/reactor/models.ts`
- Create: `src/lib/reactor/config.ts`
- Create: `src/lib/reactor/errors.ts`
- Create: `src/lib/reactor/index.ts`

**Interfaces:**
- Produces `REACTOR_MODELS`, `getReactorModel`, `getReactorConfig`, and `ReactorError`.

- [ ] Define the supported Reactor model metadata for LTX2, X2, Helios, LongLive 2, and SANA-Streaming.
- [ ] Validate `REACTOR_API_KEY` only when Reactor operations are invoked.
- [ ] Add normalized error codes with no secret-bearing upstream payloads.

### Task 2: Token broker

**Files:**
- Create: `src/lib/reactor/tokenBroker.ts`

**Interfaces:**
- Consumes `getReactorModel`, `getReactorConfig`, `ReactorError`.
- Produces `mintReactorToken(modelId, options)` returning `{ token, reactorModel, expiresAt? }`.

- [ ] POST to `https://api.reactor.inc/tokens` with `Reactor-API-Key` header.
- [ ] Scope authorization details to the exact model registry wire id.
- [ ] Set a small `max_sessions` constraint and reject arbitrary model names.
- [ ] Normalize upstream failure status without logging credentials or returned token values.

### Task 3: Session lifecycle service

**Files:**
- Create: `src/lib/reactor/sessions.ts`

**Interfaces:**
- Produces `createReactorSession`, `getReactorSession`, `recordReactorEvent`, `closeReactorSession`.

- [ ] Track safe in-memory session metadata and explicit state transitions.
- [ ] Reject invalid transitions and unknown session ids.
- [ ] Never persist raw media or Reactor API keys/tokens.

### Task 4: Public Reactor API

**Files:**
- Create: `src/app/api/reactor/models/route.ts`
- Create: `src/app/api/reactor/sessions/route.ts`
- Create: `src/app/api/reactor/sessions/[id]/route.ts`
- Create: `src/app/api/reactor/sessions/[id]/events/route.ts`

**Interfaces:**
- `GET /api/reactor/models`
- `POST /api/reactor/sessions`
- `GET /api/reactor/sessions/:id`
- `POST /api/reactor/sessions/:id/events`
- `DELETE /api/reactor/sessions/:id`

- [ ] Return safe model metadata only.
- [ ] Session creation returns the native bootstrap contract including scoped token, tracks, commands, and Reactor model id.
- [ ] Session state endpoints never return the long-lived API key.

### Task 5: Tests and environment docs

**Files:**
- Create: `tests/unit/lib/reactor/models.test.ts`
- Create: `tests/unit/lib/reactor/sessions.test.ts`
- Create: `tests/unit/lib/reactor/tokenBroker.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Tests use mocked `fetch`; no paid generation.

- [ ] Verify registry shape and unsupported-model rejection.
- [ ] Verify token request is scoped and secrets are absent from thrown errors.
- [ ] Verify lifecycle transitions and terminal close behavior.
- [ ] Add `REACTOR_API_KEY=` to the example environment file with no real secret.

### Task 6: Verification

- [ ] Run scoped Reactor unit tests.
- [ ] Run TypeScript/lint checks for touched files.
- [ ] Review diff for API-key/token leakage and unstable public contract changes.
