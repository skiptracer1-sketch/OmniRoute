# OpenClaude integration

OmniRoute can launch the pinned OpenClaude runtime and route its OpenAI-compatible traffic through OmniRoute.

## Setup

Clone OmniRoute with submodules, or initialize the OpenClaude submodule after cloning:

```bash
git submodule update --init --recursive
npm ci
```

OpenClaude is included as a pinned git submodule under `integrations/openclaude`. Its source build requires Bun. If `integrations/openclaude/dist/cli.mjs` is missing, the OmniRoute bridge will attempt to run `bun run build` inside the submodule automatically.

For a deterministic manual build:

```bash
cd integrations/openclaude
bun install --frozen-lockfile
bun run build
cd ../..
```

## Start OmniRoute

Start the local OmniRoute gateway on the normal port:

```bash
npm run dev
```

The default OpenClaude bridge target is:

```text
http://localhost:20128/v1
```

The default model is `auto`, so OpenClaude inherits OmniRoute routing and provider selection instead of maintaining a separate routing stack.

## Launch OpenClaude through OmniRoute

```bash
node bin/omniroute.mjs openclaude
```

Pass arguments through to OpenClaude after `--`:

```bash
node bin/omniroute.mjs openclaude -- --continue
node bin/omniroute.mjs openclaude -- --version
```

Override the bridge target or model when needed:

```bash
node bin/omniroute.mjs openclaude --base-url http://localhost:20128/v1 --model auto
```

Equivalent environment variables are:

- `OMNIROUTE_OPENCLAUDE_BASE_URL`
- `OMNIROUTE_OPENCLAUDE_MODEL`
- `OMNIROUTE_OPENCLAUDE_API_KEY`

If the gateway requires authentication, provide `--api-key <key>` or `OMNIROUTE_OPENCLAUDE_API_KEY`. Local keyless OmniRoute mode does not require one.

Use `--skip-health-check` only when intentionally bypassing the pre-launch gateway health probe, such as version-only CI checks.

## Verification

Run the focused contract tests:

```bash
node --test \
  tests/unit/runtime/openclaudeBridge.test.mjs \
  tests/unit/runtime/openclaudeSmoke.test.mjs \
  tests/unit/cli/openclaudeCommand.test.mjs
```

With OmniRoute running, verify a real OpenAI-compatible completion through the gateway:

```bash
node scripts/integrations/openclaude-smoke.mjs
```

The smoke helper checks `/api/monitoring/health` and then sends a non-streaming request to `/v1/chat/completions`.

## Upstream pinning and updates

The integration intentionally pins a specific OpenClaude commit. Updating OpenClaude should be handled as an explicit dependency update: advance the submodule gitlink, rebuild it, rerun the focused tests, run the live gateway smoke, and review upstream license/security changes before merging.

## Legal and security notice

OpenClaude's upstream LICENSE states that the project contains code derived from Anthropic's Claude Code CLI, that the underlying derived code remains subject to Anthropic copyright, and that the project does not have Anthropic authorization to distribute that proprietary source. The OmniRoute integration keeps OpenClaude isolated as a submodule, but that does not remove the upstream legal/commercial risk. Review the upstream LICENSE and obtain appropriate legal advice before redistribution or commercial deployment.

OpenClaude has also published security advisories involving sandbox and OAuth behavior. Keep the submodule pinned, review upstream advisories before updating, avoid enabling dangerous sandbox-bypass settings by default, and treat OpenClaude as an external runtime with its own security boundary.