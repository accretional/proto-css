#!/usr/bin/env bash
# build.sh — Generate HTML from EBNF, screenshot, and build gallery.
#
# Runs the generated pipeline via chrome-testing/run.sh --generated:
#   EBNF grammar → generated HTML → screenshots → gallery
#
# To also build hand-written template screenshots:
#   chrome-testing/run.sh --template
#
# Idempotent: safe to re-run at any time.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "========================================="
echo "  build.sh — Build"
echo "========================================="

CHROME_TESTING="$ROOT/chrome-testing"

if [[ -x "$CHROME_TESTING/run.sh" ]]; then
  "$CHROME_TESTING/run.sh" --generated
else
  echo "ERROR: chrome-testing/run.sh not found or not executable" >&2
  exit 1
fi

echo ""
echo "========================================="
echo "  build.sh complete"
echo "========================================="
