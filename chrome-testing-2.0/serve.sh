#!/usr/bin/env bash
# serve.sh — serve the generated gallery locally and open it.
# The gallery reads generated/codex-data.jsx (run ./gen.sh first).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
PORT="${SERVE_PORT:-8888}"
URL="http://localhost:$PORT/gallery/index.html"

# Free a stale server on this port (e.g. the old chrome-testing gallery) so we
# never accidentally serve the previous site.
if lsof -ti tcp:"$PORT" >/dev/null 2>&1; then
  echo "==> Port $PORT busy — stopping the process holding it"
  lsof -ti tcp:"$PORT" | xargs kill 2>/dev/null || true
  sleep 1
fi

echo "==> Serving the generated Codex on $URL"
echo "    (if you still see the old template, hard-refresh: Cmd+Shift+R)"
( sleep 1; command -v open >/dev/null && open "$URL" || true ) &
python3 -m http.server "$PORT" --directory "$HERE"
