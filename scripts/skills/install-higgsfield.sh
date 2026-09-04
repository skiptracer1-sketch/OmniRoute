#!/usr/bin/env bash
set -euo pipefail

# Installs the official Higgsfield agent skills for Codex/Claude/Cursor and
# ensures the Higgsfield CLI is available. Safe to re-run.

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required before installing Higgsfield skills." >&2
  exit 1
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required before installing Higgsfield skills." >&2
  exit 1
fi

echo "Installing official Higgsfield agent skills..."
npx --yes skills add higgsfield-ai/skills

if ! command -v higgsfield >/dev/null 2>&1; then
  echo "Installing Higgsfield CLI..."
  curl -fsSL https://raw.githubusercontent.com/higgsfield-ai/cli/main/install.sh | sh
fi

echo
if higgsfield auth status >/dev/null 2>&1; then
  echo "Higgsfield CLI is already authenticated."
else
  echo "Higgsfield authentication is required. Opening login flow..."
  higgsfield auth login
fi

echo
echo "Higgsfield skills installed."
echo "Verification prompt for Codex: Generate a minimal test image with Higgsfield."
