#!/usr/bin/env bash
# test.sh — set up the environment, fetch testdata if needed, then run Go tests.
#
# Usage:
#   ./test.sh              # full run
#   ./test.sh -v           # verbose (PASS/FAIL per file)
#   ./test.sh -count N     # sample N URLs per reference page (default: all)
#
# Environment:
#   CSS_TESTDATA   override the testdata directory passed to go test
#                  (defaults to lang/testdata)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTDATA_DIR="${CSS_TESTDATA:-$SCRIPT_DIR/lang/testdata}"
FETCH_SCRIPT="$SCRIPT_DIR/scripts/fetch-examples.py"

# ── Parse optional flags ──────────────────────────────────────────────────────
VERBOSE=""
FETCH_COUNT=1000   # effectively "all"
while [[ $# -gt 0 ]]; do
    case "$1" in
        -v) VERBOSE="-v"; shift ;;
        -count) FETCH_COUNT="$2"; shift 2 ;;
        *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
done

# ── Step 1: setup ─────────────────────────────────────────────────────────────
echo "=== Step 1: setup ==="
"$SCRIPT_DIR/setup.sh"
echo

# ── Step 2: fetch testdata if absent ──────────────────────────────────────────
echo "=== Step 2: testdata ==="
# Count existing CSS files across all subdirectories.
existing=$(find "$TESTDATA_DIR" -name "*.css" 2>/dev/null | wc -l | tr -d ' ')

if [ "$existing" -gt 0 ]; then
    echo "testdata already present ($existing .css files in $TESTDATA_DIR) — skipping fetch."
else
    echo "No testdata found — fetching examples from MDN ..."
    python3 "$FETCH_SCRIPT" --count "$FETCH_COUNT" --out lang/testdata
    fetched=$(find "$TESTDATA_DIR" -name "*.css" 2>/dev/null | wc -l | tr -d ' ')
    echo "Fetched $fetched .css files into $TESTDATA_DIR."
fi
echo

# ── Step 3: run tests ─────────────────────────────────────────────────────────
echo "=== Step 3: go test ==="
cd "$SCRIPT_DIR/lang"
CSS_TESTDATA="$TESTDATA_DIR" go test $VERBOSE -run TestCSSFiles .
