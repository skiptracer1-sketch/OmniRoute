# Higgsfield + Codex Integration

OmniRoute can use the official `higgsfield-ai/skills` package to give Codex direct access to Higgsfield image/video generation workflows.

## Install

From the OmniRoute repository root:

```bash
bash scripts/skills/install-higgsfield.sh
```

The installer:

1. Installs the official Higgsfield agent skills with `npx skills add higgsfield-ai/skills`.
2. Installs the official Higgsfield CLI if it is missing.
3. Checks Higgsfield authentication and opens the login flow when needed.

The official skills package is designed for Codex, Claude Code, Cursor, and other agents that load skills from their agent-specific skills directory.

## Official Higgsfield capabilities

The upstream skills package currently includes:

- `higgsfield-generate` — image/video generation across 30+ models and Marketing Studio flows.
- `higgsfield-soul-id` — reusable face-faithful character identity.
- `higgsfield-product-photoshoot` — product imagery.
- `higgsfield-brandkit` — visual identity systems and brand assets.
- `higgsfield-marketplace-cards` — marketplace product cards.
- `higgsfield-websites` — website generation/editing/deployment.
- `higgsfield-video-explainer` — narrated explainer videos.
- `higgsfield-youtube-thumbnail` — YouTube thumbnails and vertical covers.
- `higgsfield-game-generation` — browser games plus 2D/3D/audio assets.

## Verify in Codex

After installation/authentication, ask Codex:

> Generate a minimal test image with Higgsfield.

The expected path is the `higgsfield-generate` skill invoking the Higgsfield CLI and returning the generated asset URL.

## Security

Do not commit Higgsfield credentials, tokens, cookies, or local auth state to this repository. Authentication remains local to the user/agent environment.
