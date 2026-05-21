#!/usr/bin/env bash
# tools/gen.sh — Generate HTML from EBNF grammar, screenshot, and build galleries.
#
# Wraps chrome-testing/run_gen.sh with optional batching.
#
# Idempotent: safe to re-run at any time. Overwrites previously generated files.
#
# Usage:
#   ./tools/gen.sh                        # generate all properties
#   ./tools/gen.sh --gallery-only         # just rebuild gallery from existing screenshots
#   START=0 COUNT=20 ./tools/gen.sh       # first 20 properties only

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "========================================="
echo "  tools/gen.sh — EBNF HTML Generation"
echo "========================================="

CHROME_TESTING="$ROOT/chrome-testing"

if [[ ! -x "$CHROME_TESTING/run_gen.sh" ]]; then
  echo "ERROR: chrome-testing/run_gen.sh not found or not executable." >&2
  exit 1
fi

# Pass through arguments and env vars
"$CHROME_TESTING/run_gen.sh" "${@}"

echo ""
echo "========================================="
echo "  tools/gen.sh complete"
echo "========================================="
