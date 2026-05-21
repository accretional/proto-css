#!/usr/bin/env bash
# build.sh — Screenshot all templates and generate gallery pages.
#
# Runs both pipelines:
#   1. Hand-written templates → screenshots → galleries (run.sh)
#   2. EBNF-generated templates → screenshots → galleries (run_gen.sh)
#
# Idempotent: safe to re-run at any time.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "========================================="
echo "  build.sh — Build"
echo "========================================="

CHROME_TESTING="$ROOT/chrome-testing"

# ── Hand-written template screenshots + galleries ─────────────────────────

echo ""
echo "--- Building hand-written template assets ---"

if [[ -x "$CHROME_TESTING/run.sh" ]]; then
  echo "  Running chrome-testing/run.sh (screenshots + galleries)..."
  "$CHROME_TESTING/run.sh"
  echo "  [ok] Hand-written template assets built"
else
  echo "  [skip] chrome-testing/run.sh not found or not executable"
fi

# ── EBNF-generated template screenshots + galleries ───────────────────────

echo ""
echo "--- Building EBNF-generated template assets ---"

if [[ -x "$CHROME_TESTING/run_gen.sh" ]]; then
  echo "  Running chrome-testing/run_gen.sh (generate + screenshots + galleries)..."
  "$CHROME_TESTING/run_gen.sh"
  echo "  [ok] EBNF-generated template assets built"
else
  echo "  [skip] chrome-testing/run_gen.sh not found or not executable"
fi

# ── Done ────────────────────────────────────────────────────────────────────

echo ""
echo "========================================="
echo "  build.sh complete"
echo "========================================="
