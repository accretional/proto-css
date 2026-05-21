#!/usr/bin/env bash
# setup.sh — Check prerequisites, build chromerpc, and tidy Go modules.
#
# Idempotent: safe to re-run at any time.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "========================================="
echo "  setup.sh — Project Setup"
echo "========================================="

# ── Check prerequisites ─────────────────────────────────────────────────────

check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    echo "ERROR: $1 is not installed." >&2
    echo "  $2" >&2
    return 1
  fi
  echo "  [ok] $1 found: $(command -v "$1")"
}

echo ""
echo "--- Checking prerequisites ---"
MISSING=0
check_cmd go       "Install from https://go.dev/dl/"               || MISSING=1
check_cmd python3  "Install Python 3 from https://python.org"      || MISSING=1

# Chrome detection (same logic as snap.sh)
CHROME=""
if command -v google-chrome &>/dev/null; then
  CHROME="$(command -v google-chrome)"
elif command -v chromium-browser &>/dev/null; then
  CHROME="$(command -v chromium-browser)"
elif command -v chromium &>/dev/null; then
  CHROME="$(command -v chromium)"
elif [[ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]]; then
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
fi

if [[ -z "$CHROME" ]]; then
  echo "  [FAIL] Google Chrome not found." >&2
  MISSING=1
else
  echo "  [ok] Chrome found: $CHROME"
fi

if [[ $MISSING -ne 0 ]]; then
  echo ""
  echo "FATAL: Missing prerequisites. Install them and re-run." >&2
  exit 1
fi

# ── Build chromerpc (for screenshots) ──────────────────────────────────────

echo ""
echo "--- Setting up chromerpc ---"

CACHE="/tmp/chromerpc-testing"
CHROMERPC_BIN="$CACHE/bin/chromerpc"

if [[ -x "$CHROMERPC_BIN" ]]; then
  echo "  [ok] chromerpc already built: $CHROMERPC_BIN"
else
  echo "  Building chromerpc..."
  mkdir -p "$CACHE"
  if [[ -d "$CACHE/src/.git" ]]; then
    git -C "$CACHE/src" pull --quiet
  else
    git clone --quiet https://github.com/accretional/chromerpc "$CACHE/src"
  fi
  mkdir -p "$CACHE/bin"
  (cd "$CACHE/src" && go build -o "$CACHE/bin/chromerpc" ./cmd/chromerpc)
  (cd "$CACHE/src" && go build -o "$CACHE/bin/automate"  ./cmd/automate)
  echo "  [ok] chromerpc built"
fi

# ── Tidy Go modules ────────────────────────────────────────────────────────

echo ""
echo "--- Tidying Go modules ---"

if [[ -f "$ROOT/go.mod" ]]; then
  (cd "$ROOT" && go mod tidy)
  echo "  [ok] go mod tidy complete"
else
  echo "  [skip] No go.mod found yet"
fi

# ── Verify EBNF grammar files ─────────────────────────────────────────────

echo ""
echo "--- Checking EBNF grammar ---"

LANG_DIR="$ROOT/lang"
if [[ -d "$LANG_DIR" ]]; then
  EBNF_COUNT=$(find "$LANG_DIR" -name '*.ebnf' | wc -l | tr -d ' ')
  echo "  [ok] $EBNF_COUNT EBNF grammar files found in lang/"
else
  echo "  [warn] No lang/ directory found"
fi

# ── Verify Go generator builds ─────────────────────────────────────────────

echo ""
echo "--- Checking EBNF generator builds ---"

GEN_CMD="$ROOT/chrome-testing/cmd/generate"
if [[ -d "$GEN_CMD" ]]; then
  if (cd "$ROOT" && go build ./chrome-testing/cmd/generate/); then
    echo "  [ok] EBNF generator builds successfully"
  else
    echo "  [FAIL] EBNF generator build failed" >&2
  fi
else
  echo "  [skip] No chrome-testing/cmd/generate/ directory found"
fi

# ── Done ────────────────────────────────────────────────────────────────────

echo ""
echo "========================================="
echo "  setup.sh complete"
echo "========================================="
