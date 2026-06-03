#!/usr/bin/env bash
# run.sh — Full pipeline: generate HTML, take screenshots, build galleries.
#
# Calls gen.sh for HTML generation/galleries, then snap.sh for screenshots.
#
# Usage:
#   ./chrome-testing/run.sh                              # both template + generated
#   ./chrome-testing/run.sh --template                   # template only
#   ./chrome-testing/run.sh --generated                  # generated only
#   ./chrome-testing/run.sh --gallery-only               # rebuild galleries only (no screenshots)
#   ./chrome-testing/run.sh --template --gallery-only    # rebuild template gallery only
#   ./chrome-testing/run.sh --generated --gallery-only   # rebuild generated gallery only
#
# Env vars (generated pipeline):
#   START=0 COUNT=20 ./chrome-testing/run.sh --generated
#
# Idempotent: safe to re-run at any time.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Parse flags ────────────────────────────────────────────────────────────

DO_TEMPLATE=false
DO_GENERATED=false
GALLERY_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --template)     DO_TEMPLATE=true ;;
    --generated)    DO_GENERATED=true ;;
    --gallery-only) GALLERY_ONLY=true ;;
    *) echo "Unknown flag: $arg" >&2; exit 1 ;;
  esac
done

# Default: do both
if ! $DO_TEMPLATE && ! $DO_GENERATED; then
  DO_TEMPLATE=true
  DO_GENERATED=true
fi

# ── Step 1: Generate HTML + galleries ──────────────────────────────────────

"$SCRIPT_DIR/gen.sh" "$@"

# ── Step 2: Take screenshots (unless gallery-only) ────────────────────────

if $GALLERY_ONLY; then
  echo "Done (gallery-only mode, no screenshots)."
  exit 0
fi

TEMPLATES_DIR="$SCRIPT_DIR/html/template"
GEN_DIR="$SCRIPT_DIR/html/generated"
TEMPLATE_SCREENSHOTS="$SCRIPT_DIR/screenshots/template"
GEN_SCREENSHOTS="$SCRIPT_DIR/screenshots/generated"
MODES_DIR="$SCRIPT_DIR/screenshots/textproto"
BLUEPRINTS_DIR="$SCRIPT_DIR/textproto/blueprints"
TEMPLATE_MANIFEST="$TEMPLATES_DIR/screenshot_modes.txt"

if $DO_TEMPLATE; then
  echo "=== Screenshotting hand-written templates ==="

  # Generate manifest from blueprints
  echo "  Generating screenshot modes manifest from blueprints..."
  > "$TEMPLATE_MANIFEST"
  for html in "$TEMPLATES_DIR"/*.html; do
    slug="$(basename "$html" .html)"
    bp="$BLUEPRINTS_DIR/${slug}.textproto"
    mode="static"
    if [[ -f "$bp" ]]; then
      m="$(grep -m1 'screenshot_textproto:' "$bp" 2>/dev/null | sed 's/.*"\(.*\)"/\1/' || true)"
      [[ -n "$m" ]] && mode="$m"
    fi
    printf '%s\t%s\n' "$slug" "$mode" >> "$TEMPLATE_MANIFEST"
  done
  echo "  Wrote $(wc -l < "$TEMPLATE_MANIFEST" | tr -d ' ') entries"

  mkdir -p "$TEMPLATE_SCREENSHOTS"
  "$SCRIPT_DIR/snap.sh" "$TEMPLATES_DIR/" "$TEMPLATE_SCREENSHOTS/" \
    --manifest "$TEMPLATE_MANIFEST" \
    --modes-dir "$MODES_DIR"
  echo ""
fi

if $DO_GENERATED; then
  echo "=== Screenshotting generated HTML ==="
  mkdir -p "$GEN_SCREENSHOTS"
  "$SCRIPT_DIR/snap.sh" "$GEN_DIR/" "$GEN_SCREENSHOTS/" \
    --manifest "$GEN_DIR/screenshot_modes.txt" \
    --modes-dir "$MODES_DIR"
  echo ""
fi

echo "Done."
