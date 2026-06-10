#!/usr/bin/env bash
# shoot.sh — serve the gallery, start headless chromerpc, and screenshot every
# property's specimen view. Idempotent: kills its servers on exit, rebuilds the
# chromerpc/automate binaries into a cache.
#
#   ONLY="flex-direction,display"  ./shoot.sh   # limit to some properties
#   RESUME=1 ./shoot.sh                          # skip properties already shot
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"   # go-run paths below are repo-root-relative; be CWD-independent
CT2="$ROOT/chrome-testing-2.0"
SCREENS="$CT2/screenshots"
SEQ="$CT2/generated/shots.textproto"
CHROMERPC_SRC="${CHROMERPC_SRC:-$HOME/Documents/chromerpc}"
CACHE="/tmp/chromerpc-ct2"
BIN="$CACHE/bin"
ONLY="${ONLY:-}"
RESUME="${RESUME:-}"
RESTART_EVERY="${RESTART_EVERY:-40}"   # relaunch chromerpc every N chunks (Chrome leaks)

HTTP_PID=""
RPC_PID=""
RPC_PORT=""
cleanup() {
  [[ -n "$HTTP_PID" ]] && kill "$HTTP_PID" 2>/dev/null || true
  [[ -n "$RPC_PID" ]] && kill "$RPC_PID" 2>/dev/null || true
}
trap cleanup EXIT

free_port() { python3 -c "import socket;s=socket.socket();s.bind(('',0));print(s.getsockname()[1]);s.close()"; }

# start (or restart) the headless chromerpc server on a fresh port
start_rpc() {
  [[ -n "$RPC_PID" ]] && kill "$RPC_PID" 2>/dev/null || true
  RPC_PORT="$(free_port)"
  "$BIN/chromerpc" --headless --addr ":$RPC_PORT" &>"$CACHE/chromerpc.log" &
  RPC_PID=$!
  for i in $(seq 1 40); do
    if bash -c ">/dev/tcp/localhost/$RPC_PORT" 2>/dev/null; then return 0; fi
    sleep 0.5
  done
  echo "ERROR: chromerpc not ready"; cat "$CACHE/chromerpc.log"; return 1
}

# warm up: load the SPA once so later chunks need only set the hash (no reload)
warmup() {
  cat > "$CACHE/warmup.textproto" <<EOF
name: "warmup"
steps { set_viewport { width: 1280 height: 900 device_scale_factor: 2 } }
steps { navigate { url: "$BASE" } }
steps { wait { milliseconds: 3000 } }
EOF
  "$BIN/automate" -addr "localhost:$RPC_PORT" -input "$CACHE/warmup.textproto" -timeout 60s >/dev/null 2>&1
}

# ── build chromerpc + automate ────────────────────────────────────────────────
mkdir -p "$BIN"
if [[ ! -x "$BIN/chromerpc" || ! -x "$BIN/automate" || -n "${REBUILD:-}" ]]; then
  echo "==> Building chromerpc + automate from $CHROMERPC_SRC ..."
  ( cd "$CHROMERPC_SRC" && go build -o "$BIN/chromerpc" ./cmd/chromerpc && go build -o "$BIN/automate" ./cmd/automate )
fi
echo "==> chromerpc binaries ready in $BIN"

# ── serve gallery (serve CT2 so /gallery and /generated are both reachable) ───
SERVE_PORT="$(free_port)"
echo "==> Serving $CT2 on :$SERVE_PORT"
python3 -m http.server "$SERVE_PORT" --directory "$CT2" &>/dev/null &
HTTP_PID=$!

# ── build the automation sequence (chunked to keep gRPC responses small) ──────
BASE="http://localhost:$SERVE_PORT/gallery/index.html"
mkdir -p "$SCREENS"
rm -f "$CT2"/generated/shots-*.textproto
go run ./chrome-testing-2.0/cmd/shoot/ \
  -values "$CT2/generated/values.json" \
  -manifest "$CT2/generated/manifest.tsv" \
  -base "$BASE" -outdir "$SCREENS" -seq "$SEQ" \
  ${ONLY:+-only "$ONLY"}

# ── start headless chromerpc + warm up the SPA once ───────────────────────────
echo "==> Starting chromerpc (headless)"
start_rpc || exit 1
warmup
echo "==> chromerpc ready on :$RPC_PORT (SPA warmed)"

# ── run each chunk; recycle + re-warm the browser periodically and on failure ─
echo "==> Capturing screenshots (this can take a while) ..."
chunks=( "$CT2"/generated/shots-*.textproto )
total=${#chunks[@]}
[[ $total -eq 0 ]] && { echo "Nothing to capture (all present?)."; exit 0; }
i=0
for c in "${chunks[@]}"; do
  i=$((i+1))
  printf "\r    chunk %d/%d   " "$i" "$total"
  if (( i % RESTART_EVERY == 0 )); then start_rpc && warmup || exit 1; fi
  if ! "$BIN/automate" -addr "localhost:$RPC_PORT" -input "$c" -timeout 180s >/dev/null 2>&1; then
    echo " (chunk $i failed — restarting chromerpc and retrying)"
    start_rpc && warmup || exit 1
    "$BIN/automate" -addr "localhost:$RPC_PORT" -input "$c" -timeout 180s >/dev/null 2>&1 \
      || echo " (chunk $i failed again — skipping)"
  fi
done
echo ""

echo ""
# ── Rasterise paged-media PDFs (printToPDF output) into stacked PNGs ──────────
if find "$SCREENS" -name '*.pdf' -print -quit | grep -q .; then
  echo "==> Rasterising paged-media PDFs to PNG..."
  python3 - "$SCREENS" <<'PY'
import sys, os, glob, subprocess, tempfile
from PIL import Image
root = sys.argv[1]
for pdf in glob.glob(os.path.join(root, "**", "*.pdf"), recursive=True):
    base = pdf[:-4]
    try:
        with tempfile.TemporaryDirectory() as td:
            subprocess.run(["pdftoppm", "-png", "-r", "96", pdf, os.path.join(td, "pg")],
                           check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            pages = sorted(glob.glob(os.path.join(td, "pg*.png")))[:3]  # first 3 pages
            if not pages:
                continue
            imgs = [Image.open(p).convert("RGB") for p in pages]
            gap, bg = 18, (12, 13, 16)
            w = max(i.width for i in imgs)
            h = sum(i.height for i in imgs) + gap * (len(imgs) - 1)
            canvas = Image.new("RGB", (w, h), bg)
            y = 0
            for im in imgs:
                canvas.paste(im, ((w - im.width) // 2, y))
                y += im.height + gap
            canvas.save(base + ".png")
        os.remove(pdf)
    except Exception as e:
        print(f"  ! {pdf}: {e}", file=sys.stderr)
PY
fi

echo "==> Encoding temporal frame sequences into GIFs..."
go run ./chrome-testing-2.0/cmd/gifenc/ -dir "$SCREENS"

echo "==> Screenshots under $SCREENS"
find "$SCREENS" -name '*.png' | wc -l | xargs echo "Total PNGs:"
find "$SCREENS" -name '*.gif' | wc -l | xargs echo "Total GIFs:"
