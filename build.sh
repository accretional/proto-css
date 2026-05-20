#!/usr/bin/env bash
# build.sh — Prepare embedded source, generate screenshots/gallery, and build the binary.
#
# Idempotent: safe to re-run at any time.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "========================================="
echo "  build.sh — Build"
echo "========================================="

# ── Generate screenshots and gallery (embedded source) ──────────────────────

echo ""
echo "--- Building visual assets ---"

CHROME_TESTING="$ROOT/chrome-testing"

if [[ -x "$CHROME_TESTING/run.sh" ]]; then
  echo "  Running chrome-testing/run.sh (screenshots + gallery)..."
  "$CHROME_TESTING/run.sh"
  echo "  [ok] Visual assets built"
else
  echo "  [skip] chrome-testing/run.sh not found or not executable"
fi

# ── Prepare embedded source ─────────────────────────────────────────────────

echo ""
echo "--- Preparing embedded source ---"

# Copy gallery and screenshots to an embed-ready location if needed
EMBED_DIR="$ROOT/embed"
if [[ -f "$CHROME_TESTING/gallery.html" ]]; then
  mkdir -p "$EMBED_DIR"
  cp "$CHROME_TESTING/gallery.html" "$EMBED_DIR/" 2>/dev/null || true
  if [[ -d "$CHROME_TESTING/screenshots" ]]; then
    mkdir -p "$EMBED_DIR/screenshots"
    cp "$CHROME_TESTING/screenshots/"*.png "$EMBED_DIR/screenshots/" 2>/dev/null || true
  fi
  echo "  [ok] Embedded assets staged in $EMBED_DIR"
else
  echo "  [skip] No gallery.html to embed yet"
fi

# ── Build Go binary ─────────────────────────────────────────────────────────

echo ""
echo "--- Building Go binary ---"

if [[ -f "$ROOT/go.mod" ]]; then
  echo "  Running go build..."
  (cd "$ROOT" && go build -o "$ROOT/bin/proto-css" ./...)
  echo "  [ok] Binary built: $ROOT/bin/proto-css"
else
  echo "  [skip] No go.mod found yet — skipping Go build"
fi

# ── Done ────────────────────────────────────────────────────────────────────

echo ""
echo "========================================="
echo "  build.sh complete"
echo "========================================="
