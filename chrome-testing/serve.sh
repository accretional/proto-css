#!/usr/bin/env bash
# serve.sh — serve the SELF-CONTAINED, deployable gallery bundle (dist/) locally
# and open it. This is exactly what gets deployed, so previewing it here catches
# any path/bundling issues before shipping.
#
# The bundle is (re)assembled from the gallery source + generated data by
# dist.sh; run ./gen.sh first if there is no generated data yet.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
DIST="${DIST:-$HERE/dist}"
PORT="${SERVE_PORT:-8888}"
URL="http://localhost:$PORT/"

# Rebuild the bundle so we always serve the current source (dist.sh is idempotent
# and caches the vendored libs, so this is fast).
"$HERE/dist.sh"

# Free a stale server on this port (e.g. a previous gallery server) so we never
# accidentally serve the previous site.
if lsof -ti tcp:"$PORT" >/dev/null 2>&1; then
  echo "==> Port $PORT busy — stopping the process holding it"
  lsof -ti tcp:"$PORT" | xargs kill 2>/dev/null || true
  sleep 1
fi

echo "==> Serving the self-contained Codex bundle on $URL"
echo "    (if you still see an old build, hard-refresh: Cmd+Shift+R)"
( sleep 1; command -v open >/dev/null && open "$URL" || true ) &
python3 -m http.server "$PORT" --directory "$DIST"
