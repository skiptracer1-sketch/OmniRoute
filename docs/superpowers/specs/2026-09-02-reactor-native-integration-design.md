# Native Reactor Integration Design

**Date:** 2026-09-02
**Repository:** `skiptracer1-sketch/OmniRoute`
**Target branch:** `release/v3.8.50`

## Goal

Hardwire Reactor into OmniRoute as a first-class real-time generative media and world-model subsystem rather than treating Reactor as an external optional adapter. OmniRoute owns Reactor authentication, session creation, model capability metadata, media/control transport, observability, error normalization, usage accounting, and the public API consumed by Lumexus.ai.

## Architectural decision

Reactor is a native OmniRoute capability. The integration must not require Lumexus.ai to import Reactor SDKs directly, expose a Reactor API key, or understand Reactor token/session internals.

OmniRoute will expose stable Reactor-facing endpoints and session contracts while internally using Reactor's model SDKs and short-lived model-scoped session tokens. Real-time media still flows over Reactor's WebRTC transport because that is the model transport, but session creation, authorization, model selection, controls, metadata, and telemetry are owned by OmniRoute.

## Reactor capabilities to integrate

The subsystem must support Reactor's real-time model catalog as native OmniRoute capabilities, beginning with these currently documented model families:

- **LTX / `ltx2`** — portrait + script to synchronized voice and talking-head video. Output tracks: `main_video`, `main_audio`.
- **X2** — real-time video-to-video transformation with live prompt changes, reference-image conditioning, and interactive steering.
- **Helios** — continuous interactive real-time video generation.
- **LongLive 2** — real-time multi-shot video generation with shot and scene-cut controls.
- **SANA-Streaming** — streaming video editing from an input video/camera track.

The registry must allow Reactor models to be added without changing the external OmniRoute session contract.

## System components

### 1. Reactor configuration

Create a dedicated Reactor configuration module. It loads `REACTOR_API_KEY` only on the server and validates required runtime values at startup or first use. The API key must never be returned to clients or written to logs.

Environment documentation must add the Reactor variables to the repository's example environment configuration without a real key.

### 2. Native model registry

Create a Reactor model registry containing, for each supported model:

- OmniRoute model id
- Reactor model id/package
- human-readable name
- capability type
- accepted inputs
- output tracks
- supported commands
- whether input media tracks are required
- expected output media tracks
- session/token model scope
- pricing metadata when known and explicitly sourced

The registry is the canonical source for API validation and Lumexus capability discovery.

### 3. Token broker

OmniRoute will hold the Reactor API key and mint short-lived Reactor session tokens for authorized OmniRoute users.

The token broker must:

- accept only a model present in the native registry
- mint a token scoped to that Reactor model
- apply the minimum practical session limit
- return only the short-lived session token and safe session metadata
- prevent arbitrary model names from being proxied through OmniRoute
- normalize Reactor authentication errors into OmniRoute error types
- emit security-safe telemetry without token or API-key values

Reactor documentation currently states that session tokens may be valid for up to six hours and are model-scoped. OmniRoute should request the shortest lifetime compatible with the user session rather than defaulting to the maximum.

### 4. Session service

Add a Reactor session service responsible for the lifecycle state OmniRoute needs to track around a Reactor WebRTC session.

Session states:

`created -> token_issued -> connecting -> ready -> running -> paused -> completed/stopped/failed -> closed`

The service stores safe metadata only. Raw media is not persisted by default.

Tracked metadata should include:

- OmniRoute session id
- authenticated user/tenant id when the host application supplies it
- Reactor model id
- creation/start/end timestamps
- state
- command count
- failure code/category
- usage duration available to OmniRoute
- client correlation/request id

### 5. Public OmniRoute API

Expose a native Reactor API surface under the existing OmniRoute server conventions. Exact router placement must follow the repository's current API layout discovered during implementation.

Required logical operations:

- `GET /reactor/models` — list native Reactor capabilities
- `POST /reactor/sessions` — validate model and create an OmniRoute Reactor session plus short-lived Reactor token
- `GET /reactor/sessions/:id` — return safe session state/metadata
- `POST /reactor/sessions/:id/events` — record/normalize client lifecycle events required for telemetry and state tracking
- `DELETE /reactor/sessions/:id` — close OmniRoute's session record and revoke/terminate where Reactor's supported API permits

Media does not tunnel through ordinary HTTP endpoints. The browser/client uses the short-lived model-scoped token to establish Reactor's WebRTC connection.

### 6. Client contract

OmniRoute returns a provider-neutral-enough but Reactor-native session bootstrap payload containing:

- `sessionId`
- `provider: "reactor"`
- `modelId`
- `reactorModel`
- `token`
- `expiresAt` when available
- `tracks`
- `commands`
- `connection` metadata needed by the Reactor SDK

Lumexus uses this bootstrap payload to initialize the correct Reactor model SDK client. Lumexus never receives the long-lived Reactor API key.

### 7. LTX hardwired flow

LTX is the first complete vertical slice and must work end-to-end before the other model controllers are considered complete.

Expected flow:

1. Lumexus requests an LTX Reactor session from OmniRoute.
2. OmniRoute validates authorization/model and mints a model-scoped short-lived token.
3. Lumexus creates `Ltx2Model` using the Reactor package and connects with the short-lived token.
4. Lumexus uploads the portrait through Reactor's upload protocol.
5. Lumexus calls `setAvatarImage` and `setScript`.
6. Lumexus subscribes to `main_video` and `main_audio`.
7. Lumexus calls `start`.
8. Reactor streams WebRTC tracks to the client.
9. Lumexus reports relevant state/failure lifecycle events to OmniRoute telemetry.
10. OmniRoute closes/ages out the session record.

Supported LTX controls should include the documented command set where exposed by the installed SDK: start, stop, pause, resume, reset, script, avatar image, prompt, WPM, seed, and duration.

### 8. X2/Helios/LongLive/SANA controllers

After the shared session/token layer and LTX vertical slice are verified, implement model-specific controller metadata and validation for X2, Helios, LongLive 2, and SANA-Streaming.

The controllers must use the same session bootstrap contract while exposing their model-specific command and track capabilities from the registry.

### 9. Error normalization

Normalize Reactor failures into stable OmniRoute categories such as:

- `REACTOR_AUTH_FAILED`
- `REACTOR_MODEL_UNSUPPORTED`
- `REACTOR_SESSION_LIMIT`
- `REACTOR_SESSION_EXPIRED`
- `REACTOR_CONNECTION_FAILED`
- `REACTOR_COMMAND_REJECTED`
- `REACTOR_UPLOAD_FAILED`
- `REACTOR_GENERATION_FAILED`
- `REACTOR_UPSTREAM_UNAVAILABLE`

Raw upstream details can be retained server-side only when safe. No token, API key, or sensitive media reference may be logged.

### 10. Observability and usage

Add Reactor-specific metrics to OmniRoute's existing observability system rather than creating a separate monitoring stack.

Minimum metrics:

- session creation attempts/success/failure
- model used
- time to token issuance
- time from session creation to ready when reported
- generation start/completion/failure
- active session count
- estimated/known generation duration
- upstream error category

Pricing/cost calculations must be based only on verified Reactor pricing metadata. LTX's public model page currently lists 300 credits/second and $108/hour; do not assume the same pricing for other models.

### 11. Security

- Reactor long-lived API credentials are server-only.
- Short-lived tokens are model-scoped.
- Do not place tokens in URLs, analytics payloads, exception strings, or persisted logs.
- Enforce OmniRoute authentication/authorization before minting a token.
- Add rate limiting/session quotas using existing OmniRoute mechanisms.
- Validate model ids and supported commands against the registry.
- Do not provide a generic arbitrary Reactor proxy endpoint.
- Add secret-scanning coverage through the repository's existing gitleaks/security tooling.

### 12. Testing

Tests must cover:

- config validation without exposing secret values
- model registry correctness
- rejection of unknown model ids
- token broker request shape and error normalization with Reactor mocked
- no API-key leakage in API responses/loggable errors
- session lifecycle transitions
- session authorization/tenant isolation where applicable
- public models endpoint
- session creation endpoint
- expiration/failure paths
- LTX bootstrap contract
- controller metadata for X2, Helios, LongLive 2, and SANA-Streaming

No CI test may require a live paid Reactor generation. A separate opt-in integration/smoke test may run only when a Reactor test credential is explicitly configured.

## Dependency strategy

Use Reactor's official JavaScript packages where they fit OmniRoute's runtime and package-management conventions. Current public documentation identifies `@reactor-team/js-sdk` as the transport dependency and model-specific packages including `@reactor-models/ltx2`, `@reactor-models/x2`, `@reactor-models/helios`, `@reactor-models/longlive-v2`, and `@reactor-models/sana-streaming`.

Do not install browser-only model packages into a server runtime unless they are actually required there. The server token broker may use direct Reactor HTTP calls if that is the supported official authentication path and keeps the server bundle smaller; the implementation plan must verify the exact current Reactor token endpoint and package APIs before coding.

## External contract stability

Lumexus should depend on OmniRoute's `/reactor/models` and `/reactor/sessions` contracts, not on hard-coded pricing or server credential behavior. Reactor model SDK details that necessarily execute in the browser are represented in the bootstrap contract, but OmniRoute remains the authority for access, model availability, quotas, and observability.

## Rollout order

1. Repository mapping and existing API/auth/telemetry pattern identification.
2. Reactor config + registry.
3. Token broker with mocked tests.
4. Session lifecycle service and API endpoints.
5. LTX end-to-end bootstrap and controller contract.
6. X2 controller.
7. Helios controller.
8. LongLive 2 controller.
9. SANA-Streaming controller.
10. Usage/cost telemetry, quotas, security tests, and opt-in live smoke test.

## Success criteria

The integration is complete when:

- Reactor appears as a native OmniRoute capability.
- Lumexus can discover supported Reactor models through OmniRoute.
- An authorized Lumexus user can create an LTX session without receiving the Reactor API key.
- The client can connect to LTX with the OmniRoute-issued short-lived token, provide a portrait/script, and receive synchronized video/audio tracks.
- X2, Helios, LongLive 2, and SANA-Streaming have validated session/bootstrap contracts and model-specific capability metadata.
- OmniRoute records safe session/usage telemetry and normalized failures.
- Automated tests pass without requiring paid live inference.
- No Reactor long-lived secret is exposed to the browser, API response, repository, or logs.
