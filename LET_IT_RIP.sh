#!/usr/bin/env bash
# LET_IT_RIP.sh — Full pipeline: setup + gen + build + test + serve + browser open.
#
# CRITICAL: Run this before EVERY git commit and git push. No exceptions.
#
# Idempotent: kills old servers on its ports, cleans up on exit,
# and works correctly when re-run without manual intervention.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "############################################"
echo "#                                          #"
echo "#           LET IT RIP                     #"
echo "#                                          #"
echo "#  setup + gen + build + test + serve      #"
echo "#                                          #"
echo "############################################"
echo ""

# ── Kill any old servers on our serving port ────────────────────────────────

SERVE_PORT="${SERVE_PORT:-8888}"

kill_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti :"$port" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "Killing old process(es) on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 0.5
  fi
}

kill_port "$SERVE_PORT"

# ── Cleanup on exit ─────────────────────────────────────────────────────────

SERVER_PID=""

cleanup() {
  echo ""
  echo "Cleaning up..."
  [[ -n "$SERVER_PID" ]] && kill "$SERVER_PID" 2>/dev/null || true
  kill_port "$SERVE_PORT"
  echo "Done."
}
trap cleanup EXIT

# ── Step 1: Setup ───────────────────────────────────────────────────────────

echo "============ Step 1/4: Setup ============"
"$ROOT/setup.sh"
echo ""

# ── Step 2: Build (screenshots + galleries for both template sets) ─────────

echo "============ Step 2/4: Build ============"
"$ROOT/build.sh"
echo ""

# ── Step 3: Test ────────────────────────────────────────────────────────────

echo "============ Step 3/4: Test ============"
"$ROOT/test.sh"
echo ""

# ── Step 4: Serve + Open Browser ────────────────────────────────────────────

echo "============ Step 4/4: Serve + Browser ============"

GALLERY_DIR="$ROOT/chrome-testing/html"
GALLERY_FILE="$GALLERY_DIR/generated_screenshots_gallery.html"

if [[ ! -f "$GALLERY_FILE" ]]; then
  echo "WARNING: Gallery not found. Skipping serve step."
  echo ""
  echo "############################################"
  echo "#  LET IT RIP complete (no gallery to serve)"
  echo "############################################"
  exit 0
fi

# Serve the entire chrome-testing directory so relative paths to screenshots work
SERVE_DIR="$ROOT/chrome-testing"

echo "Starting HTTP server on port $SERVE_PORT..."
python3 -m http.server "$SERVE_PORT" --directory "$SERVE_DIR" &>/dev/null &
SERVER_PID=$!
disown "$SERVER_PID"

# Wait for server to be ready
for i in $(seq 1 20); do
  if bash -c ">/dev/tcp/localhost/$SERVE_PORT" 2>/dev/null; then
    break
  fi
  sleep 0.25
done

GALLERY_URL="http://localhost:$SERVE_PORT/html/generated_screenshots_gallery.html"
echo "Gallery serving at: $GALLERY_URL"

# Open in browser (macOS: open, Linux: xdg-open)
if command -v open &>/dev/null; then
  open "$GALLERY_URL"
elif command -v xdg-open &>/dev/null; then
  xdg-open "$GALLERY_URL"
else
  echo "Open this URL in your browser: $GALLERY_URL"
fi

echo ""
echo "############################################"
echo "#                                          #"
echo "#  LET IT RIP complete                     #"
echo "#                                          #"
echo "#  Gallery: $GALLERY_URL"
echo "#  Server PID: $SERVER_PID"
echo "#                                          #"
echo "#  Other galleries:                        #"
echo "#  - /html/generated_gallery.html                #"
echo "#  - /html/template_screenshots_gallery.html    #"
echo "#  - /html/template_gallery.html                #"
echo "#                                          #"
echo "#  Press Ctrl+C to stop the server.        #"
echo "#                                          #"
echo "############################################"

# Keep server running until user hits Ctrl+C
wait "$SERVER_PID" 2>/dev/null || true
