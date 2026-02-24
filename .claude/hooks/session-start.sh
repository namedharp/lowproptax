#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install uipro-cli globally if not already installed
if ! command -v uipro &>/dev/null; then
  echo "Installing uipro-cli..."
  npm install -g uipro-cli
fi

# Install Node.js dependencies for lpt-app if present
if [ -f "$CLAUDE_PROJECT_DIR/lpt-app/package.json" ]; then
  echo "Installing lpt-app dependencies..."
  npm install --prefix "$CLAUDE_PROJECT_DIR/lpt-app"
fi
