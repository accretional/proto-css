#!/usr/bin/env bash
# test.sh — Validate templates, screenshots, galleries, and smoke-test the project.
#
# This is the ONLY way to validate before committing. Never use bare `go test`
# as final validation — always run this script.
#
# Idempotent: safe to re-run at any time.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
FAILURES=0

echo "========================================="
echo "  test.sh — Test & Validate"
echo "========================================="

# ── Full pipeline build (setup -> gen_proto -> gallery data) ───────────────

echo ""
echo "--- Full pipeline build ---"
"$ROOT/build.sh"

fail() {
  echo "  [FAIL] $1" >&2
  FAILURES=$((FAILURES + 1))
}

pass() {
  echo "  [ok] $1"
}

# ── Codec round-trip (every walked gallery path must be faithful) ───────────

echo ""
echo "--- Codec round-trip ---"
CODEC_TSV="$ROOT/chrome-testing/generated/_codec_failures.tsv"
if [[ -f "$CODEC_TSV" ]]; then
  CODEC_ROWS=$(( $(wc -l <"$CODEC_TSV") - 1 ))
  if [[ "$CODEC_ROWS" -le 0 ]]; then
    pass "codec round-trip: every walked gallery path renders faithfully"
  else
    fail "codec round-trip: $CODEC_ROWS failing path(s) — see $CODEC_TSV"
  fi
else
  fail "codec failures report missing: $CODEC_TSV (build did not run the walk)"
fi

# ── Go vet ──────────────────────────────────────────────────────────────────

echo ""
echo "--- Go vet ---"

if [[ -f "$ROOT/go.mod" ]]; then
  if (cd "$ROOT" && go vet ./...); then
    pass "go vet passed"
  else
    fail "go vet found issues"
  fi
else
  echo "  [skip] No go.mod found yet"
fi

# ── Go test ─────────────────────────────────────────────────────────────────

echo ""
echo "--- Go test ---"

if [[ -f "$ROOT/go.mod" ]]; then
  if (cd "$ROOT" && go test -count=1 -race ./...); then
    pass "go test passed"
  else
    fail "go test failed"
  fi
else
  echo "  [skip] No go.mod found yet"
fi

# ── Go build check ─────────────────────────────────────────────────────────

echo ""
echo "--- Go build check ---"

if [[ -f "$ROOT/go.mod" ]]; then
  if (cd "$ROOT" && go build ./...); then
    pass "go build ./... succeeded"
  else
    fail "go build failed"
  fi
else
  echo "  [skip] No go.mod found yet"
fi

# ── Gallery app (the codex SPA) ─────────────────────────────────────────────

echo ""
echo "--- Gallery app ---"

GALLERY_DIR="$ROOT/chrome-testing/gallery"

check_nonempty() {
  local path="$1" name="$2"
  if [[ -s "$path" ]]; then
    pass "$name exists and is non-empty"
  else
    fail "$name missing or empty — run ./build.sh first"
  fi
}

check_nonempty "$GALLERY_DIR/index.html" "gallery/index.html"
check_nonempty "$GALLERY_DIR/codex.jsx" "gallery/codex.jsx"
check_nonempty "$GALLERY_DIR/data.jsx" "gallery/data.jsx"
check_nonempty "$GALLERY_DIR/styles.css" "gallery/styles.css"

# ── Generated gallery data (grammar walk output) ────────────────────────────

echo ""
echo "--- Generated gallery data ---"

GEN_DIR="$ROOT/chrome-testing/generated"

check_nonempty "$GEN_DIR/codex-data.jsx" "generated/codex-data.jsx"
check_nonempty "$GEN_DIR/manifest.tsv" "generated/manifest.tsv"
check_nonempty "$GEN_DIR/values.json" "generated/values.json"

# ── Screenshot validation (advisory) ────────────────────────────────────────

echo ""
echo "--- Screenshots (advisory) ---"

SCREENSHOTS_DIR="$ROOT/chrome-testing/screenshots"

if [[ -d "$SCREENSHOTS_DIR" ]]; then
  SCREENSHOT_COUNT=$(find "$SCREENSHOTS_DIR" -name '*.png' | wc -l | tr -d ' ')
  if [[ "$SCREENSHOT_COUNT" -gt 0 ]]; then
    pass "$SCREENSHOT_COUNT screenshot(s) found"
  else
    echo "  [warn] No screenshots in $SCREENSHOTS_DIR (run chrome-testing/shoot.sh)"
  fi
else
  echo "  [warn] Screenshots directory not found: $SCREENSHOTS_DIR (run chrome-testing/shoot.sh)"
fi

# ── Smoke test: serve the gallery and check HTTP response ───────────────────

echo ""
echo "--- Smoke test ---"

SMOKE_PORT=""
SMOKE_PID=""

smoke_cleanup() {
  [[ -n "$SMOKE_PID" ]] && kill "$SMOKE_PID" 2>/dev/null || true
}
trap smoke_cleanup EXIT

if [[ -f "$GALLERY_DIR/index.html" ]]; then
  SMOKE_PORT="$(python3 -c "import socket; s=socket.socket(); s.bind(('',0)); p=s.getsockname()[1]; s.close(); print(p)")"

  python3 -m http.server "$SMOKE_PORT" --directory "$ROOT/chrome-testing" &>/dev/null &
  SMOKE_PID=$!
  disown "$SMOKE_PID"

  # Wait for server
  for i in $(seq 1 20); do
    if bash -c ">/dev/tcp/localhost/$SMOKE_PORT" 2>/dev/null; then
      break
    fi
    sleep 0.25
  done

  # Check HTTP response
  HTTP_STATUS="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$SMOKE_PORT/gallery/index.html" 2>/dev/null || echo "000")"
  if [[ "$HTTP_STATUS" == "200" ]]; then
    pass "Smoke test: gallery/index.html served OK (HTTP $HTTP_STATUS)"
  else
    fail "Smoke test: gallery/index.html returned HTTP $HTTP_STATUS"
  fi

  kill "$SMOKE_PID" 2>/dev/null || true
  SMOKE_PID=""
else
  echo "  [skip] No gallery to smoke-test"
fi

# ── Summary ─────────────────────────────────────────────────────────────────

echo ""
echo "========================================="
if [[ $FAILURES -eq 0 ]]; then
  echo "  test.sh PASSED — all checks green"
else
  echo "  test.sh FAILED — $FAILURES failure(s)"
fi
echo "========================================="

exit "$FAILURES"
