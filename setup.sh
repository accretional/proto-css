#!/usr/bin/env bash
# setup.sh — prepare the development environment for proto-css.
#
# Steps:
#   1. Clone gluon (parse-changes branch) into ../gluon if not already present.
#   2. Download Go module dependencies for this repo.
#
# Safe to run multiple times — each step is idempotent.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GLUON_DIR="$(cd "$SCRIPT_DIR/.." && pwd)/gluon"
GLUON_REPO="https://github.com/accretional/gluon"
GLUON_BRANCH="parse-changes"

echo "=== proto-css setup ==="
echo

# ── 1. Clone gluon ────────────────────────────────────────────────────────────
if [ -d "$GLUON_DIR/.git" ]; then
    echo "gluon already present at $GLUON_DIR — skipping clone."
else
    echo "Cloning gluon ($GLUON_BRANCH) → $GLUON_DIR ..."
    git clone --branch "$GLUON_BRANCH" --single-branch "$GLUON_REPO" "$GLUON_DIR"
    echo "gluon cloned."
fi
echo

# ── 2. Go dependencies ────────────────────────────────────────────────────────
echo "Downloading Go module dependencies ..."
cd "$SCRIPT_DIR"
go mod download
echo "Dependencies ready."
echo

echo "=== Setup complete ==="
