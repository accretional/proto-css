#!/usr/bin/env bash
# build.sh — Screenshot all templates and generate gallery pages.
#
# Runs both pipelines via chrome-testing/run.sh:
#   1. Hand-written templates → screenshots → gallery
#   2. EBNF-generated templates → screenshots → gallery
#
# Idempotent: safe to re-run at any time.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "========================================="
echo "  build.sh — Build"
echo "========================================="

CHROME_TESTING="$ROOT/chrome-testing"

if [[ -x "$CHROME_TESTING/run.sh" ]]; then
  "$CHROME_TESTING/run.sh"
else
  echo "ERROR: chrome-testing/run.sh not found or not executable" >&2
  exit 1
fi

echo ""
echo "========================================="
echo "  build.sh complete"
echo "========================================="
