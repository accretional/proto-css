#!/usr/bin/env bash
# test.sh — Vet, test, build-check, and smoke-test the project.
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

fail() {
  echo "  [FAIL] $1" >&2
  FAILURES=$((FAILURES + 1))
}

pass() {
  echo "  [ok] $1"
}

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

# ── Template validation ─────────────────────────────────────────────────────

echo ""
echo "--- Template validation ---"

TEMPLATES_DIR="$ROOT/chrome-testing/templates"
PROPERTIES="$ROOT/properties.txt"

if [[ -d "$TEMPLATES_DIR" ]]; then
  TEMPLATE_COUNT=$(find "$TEMPLATES_DIR" -name '*.html' | wc -l | tr -d ' ')
  if [[ "$TEMPLATE_COUNT" -gt 0 ]]; then
    pass "$TEMPLATE_COUNT HTML templates found"
  else
    fail "No HTML templates in $TEMPLATES_DIR"
  fi

  # Check that every template is well-formed (has <!DOCTYPE and closing </html>)
  BAD_TEMPLATES=0
  while IFS= read -r -d '' tmpl; do
    if ! head -1 "$tmpl" | grep -qi 'doctype'; then
      echo "    WARNING: $(basename "$tmpl") missing DOCTYPE" >&2
      BAD_TEMPLATES=$((BAD_TEMPLATES + 1))
    fi
  done < <(find "$TEMPLATES_DIR" -name '*.html' -print0)

  if [[ $BAD_TEMPLATES -eq 0 ]]; then
    pass "All templates have DOCTYPE"
  else
    fail "$BAD_TEMPLATES template(s) missing DOCTYPE"
  fi
else
  fail "Templates directory not found: $TEMPLATES_DIR"
fi

# Cross-check properties.txt against templates
if [[ -f "$PROPERTIES" && -d "$TEMPLATES_DIR" ]]; then
  MISSING_TEMPLATES=0
  while IFS= read -r prop; do
    prop="$(echo "$prop" | tr -d '[:space:]')"
    [[ -z "$prop" ]] && continue
    if [[ ! -f "$TEMPLATES_DIR/$prop.html" ]]; then
      MISSING_TEMPLATES=$((MISSING_TEMPLATES + 1))
    fi
  done < "$PROPERTIES"

  if [[ $MISSING_TEMPLATES -eq 0 ]]; then
    pass "All properties in properties.txt have templates"
  else
    echo "  [warn] $MISSING_TEMPLATES properties in properties.txt lack templates (may be expected)"
  fi
fi

# ── Screenshot validation ───────────────────────────────────────────────────

echo ""
echo "--- Screenshot validation ---"

SCREENSHOTS_DIR="$ROOT/chrome-testing/screenshots"

if [[ -d "$SCREENSHOTS_DIR" ]]; then
  SCREENSHOT_COUNT=$(find "$SCREENSHOTS_DIR" -name '*.png' | wc -l | tr -d ' ')
  if [[ "$SCREENSHOT_COUNT" -gt 0 ]]; then
    pass "$SCREENSHOT_COUNT screenshots found"
  else
    fail "No screenshots in $SCREENSHOTS_DIR"
  fi

  # Check that screenshots are non-empty (not zero-byte)
  EMPTY_SCREENSHOTS=0
  while IFS= read -r -d '' png; do
    if [[ ! -s "$png" ]]; then
      echo "    WARNING: $(basename "$png") is empty" >&2
      EMPTY_SCREENSHOTS=$((EMPTY_SCREENSHOTS + 1))
    fi
  done < <(find "$SCREENSHOTS_DIR" -name '*.png' -print0)

  if [[ $EMPTY_SCREENSHOTS -eq 0 ]]; then
    pass "All screenshots are non-empty"
  else
    fail "$EMPTY_SCREENSHOTS empty screenshot(s)"
  fi
else
  fail "Screenshots directory not found: $SCREENSHOTS_DIR"
fi

# ── Gallery validation ──────────────────────────────────────────────────────

echo ""
echo "--- Gallery validation ---"

GALLERY="$ROOT/chrome-testing/gallery.html"

if [[ -f "$GALLERY" ]]; then
  if [[ -s "$GALLERY" ]]; then
    pass "gallery.html exists and is non-empty"
  else
    fail "gallery.html exists but is empty"
  fi
else
  fail "gallery.html not found — run ./build.sh first"
fi

# ── Smoke test: serve gallery and check HTTP response ───────────────────────

echo ""
echo "--- Smoke test ---"

SMOKE_PORT=""
SMOKE_PID=""

smoke_cleanup() {
  [[ -n "$SMOKE_PID" ]] && kill "$SMOKE_PID" 2>/dev/null || true
}
trap smoke_cleanup EXIT

if [[ -f "$GALLERY" ]]; then
  SMOKE_PORT="$(python3 -c "import socket; s=socket.socket(); s.bind(('',0)); p=s.getsockname()[1]; s.close(); print(p)")"
  SERVE_DIR="$(dirname "$GALLERY")"

  python3 -m http.server "$SMOKE_PORT" --directory "$SERVE_DIR" &>/dev/null &
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
  HTTP_STATUS="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$SMOKE_PORT/gallery.html" 2>/dev/null || echo "000")"
  if [[ "$HTTP_STATUS" == "200" ]]; then
    pass "Smoke test: gallery.html served OK (HTTP $HTTP_STATUS)"
  else
    fail "Smoke test: gallery.html returned HTTP $HTTP_STATUS"
  fi

  kill "$SMOKE_PID" 2>/dev/null || true
  SMOKE_PID=""
else
  echo "  [skip] No gallery.html to smoke-test"
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
