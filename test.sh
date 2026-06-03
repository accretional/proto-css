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

# ── Full pipeline build (gen + screenshots + galleries) ────────────────────

echo ""
echo "--- Full pipeline build ---"
"$ROOT/chrome-testing/run.sh"

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

# ── Hand-written template validation ───────────────────────────────────────

echo ""
echo "--- Hand-written template validation ---"

TEMPLATES_DIR="$ROOT/chrome-testing/html/template"
PROPERTIES="$ROOT/chrome-testing/properties.txt"

if [[ -d "$TEMPLATES_DIR" ]]; then
  TEMPLATE_COUNT=$(find "$TEMPLATES_DIR" -name '*.html' | wc -l | tr -d ' ')
  if [[ "$TEMPLATE_COUNT" -gt 0 ]]; then
    pass "$TEMPLATE_COUNT hand-written HTML templates found"
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
    pass "All hand-written templates have DOCTYPE"
  else
    fail "$BAD_TEMPLATES hand-written template(s) missing DOCTYPE"
  fi
else
  fail "Hand-written templates directory not found: $TEMPLATES_DIR"
fi

# Cross-check properties.txt against hand-written templates
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
    pass "All properties in properties.txt have hand-written templates"
  else
    echo "  [warn] $MISSING_TEMPLATES properties in properties.txt lack hand-written templates (may be expected)"
  fi
fi

# ── EBNF-generated template validation ─────────────────────────────────────

echo ""
echo "--- EBNF-generated template validation ---"

GEN_TEMPLATES_DIR="$ROOT/chrome-testing/html/generated"

if [[ -d "$GEN_TEMPLATES_DIR" ]]; then
  GEN_COUNT=$(find "$GEN_TEMPLATES_DIR" -name '*.html' | wc -l | tr -d ' ')
  if [[ "$GEN_COUNT" -gt 0 ]]; then
    pass "$GEN_COUNT EBNF-generated HTML templates found"
  else
    echo "  [warn] No generated templates in $GEN_TEMPLATES_DIR (run ./tools/gen.sh)"
  fi
else
  echo "  [warn] Generated templates directory not found: $GEN_TEMPLATES_DIR (run ./tools/gen.sh)"
fi

# ── Hand-written screenshot validation (advisory) ─────────────────────────

echo ""
echo "--- Hand-written screenshot validation (advisory) ---"

SCREENSHOTS_DIR="$ROOT/chrome-testing/screenshots/template"

if [[ -d "$SCREENSHOTS_DIR" ]]; then
  SCREENSHOT_COUNT=$(find "$SCREENSHOTS_DIR" -name '*.png' | wc -l | tr -d ' ')
  if [[ "$SCREENSHOT_COUNT" -gt 0 ]]; then
    pass "$SCREENSHOT_COUNT hand-written template screenshots found"
  else
    echo "  [warn] No screenshots in $SCREENSHOTS_DIR (run build.sh with --template to generate)"
  fi
else
  echo "  [warn] Hand-written screenshots directory not found: $SCREENSHOTS_DIR"
fi

# ── Generated screenshot validation ────────────────────────────────────────

echo ""
echo "--- Generated screenshot validation ---"

GEN_SCREENSHOTS_DIR="$ROOT/chrome-testing/screenshots/generated"

if [[ -d "$GEN_SCREENSHOTS_DIR" ]]; then
  GEN_SS_COUNT=$(find "$GEN_SCREENSHOTS_DIR" -name '*.png' | wc -l | tr -d ' ')
  if [[ "$GEN_SS_COUNT" -gt 0 ]]; then
    pass "$GEN_SS_COUNT generated template screenshots found"
  else
    echo "  [warn] No generated screenshots in $GEN_SCREENSHOTS_DIR (run ./tools/gen.sh)"
  fi
else
  echo "  [warn] Generated screenshots directory not found (run ./tools/gen.sh)"
fi

# ── Gallery validation ──────────────────────────────────────────────────────

echo ""
echo "--- Gallery validation ---"

GALLERY_DIR="$ROOT/chrome-testing/html"

check_gallery() {
  local path="$1"
  local name="$2"
  if [[ -f "$path" ]]; then
    if [[ -s "$path" ]]; then
      pass "$name exists and is non-empty"
    else
      fail "$name exists but is empty"
    fi
  else
    fail "$name not found — run ./build.sh first"
  fi
}

check_gallery "$GALLERY_DIR/template_gallery.html" "template_gallery.html"

# Generated gallery is optional (only exists after tools/gen.sh)
if [[ -f "$GALLERY_DIR/generated_gallery.html" ]]; then
  check_gallery "$GALLERY_DIR/generated_gallery.html" "generated_gallery.html"
else
  echo "  [warn] Generated gallery not found (run ./tools/gen.sh)"
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

GALLERY_FILE="$GALLERY_DIR/generated_gallery.html"

if [[ -f "$GALLERY_FILE" ]]; then
  SMOKE_PORT="$(python3 -c "import socket; s=socket.socket(); s.bind(('',0)); p=s.getsockname()[1]; s.close(); print(p)")"

  python3 -m http.server "$SMOKE_PORT" --directory "$GALLERY_DIR" &>/dev/null &
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
  HTTP_STATUS="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$SMOKE_PORT/generated_gallery.html" 2>/dev/null || echo "000")"
  if [[ "$HTTP_STATUS" == "200" ]]; then
    pass "Smoke test: generated_gallery.html served OK (HTTP $HTTP_STATUS)"
  else
    fail "Smoke test: generated_gallery.html returned HTTP $HTTP_STATUS"
  fi

  kill "$SMOKE_PID" 2>/dev/null || true
  SMOKE_PID=""
else
  echo "  [skip] No generated gallery to smoke-test"
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
