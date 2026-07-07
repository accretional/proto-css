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
CT="$ROOT/chrome-testing"
SCREENS="$CT/screenshots"
CHROMERPC_SRC="${CHROMERPC_SRC:-$HOME/Documents/chromerpc}"
CACHE="/tmp/chromerpc-ct2"
BIN="$CACHE/bin"
ONLY="${ONLY:-}"
RESUME="${RESUME:-}"
RESTART_EVERY="${RESTART_EVERY:-40}"   # relaunch chromerpc every N chunks (Chrome leaks)
# RUN_TAG namespaces the per-run sequence chunks so several shoots can run in
# PARALLEL (e.g. one per family) without clobbering each other's textproto files.
# Screenshot output dirs are per-property, so disjoint ONLY sets never collide.
RUN_TAG="${RUN_TAG:-}"
SEQDIR="$CT/generated/_seq${RUN_TAG:+-$RUN_TAG}"
SEQ="$SEQDIR/shots.textproto"

HTTP_PID=""
RPC_PID=""
RPC_PORT=""
cleanup() {
  [[ -n "$HTTP_PID" ]] && kill "$HTTP_PID" 2>/dev/null || true
  [[ -n "$RPC_PID" ]] && kill "$RPC_PID" 2>/dev/null || true
  rm -rf "$SEQDIR" 2>/dev/null || true
}
trap cleanup EXIT

free_port() { python3 -c "import socket;s=socket.socket();s.bind(('',0));print(s.getsockname()[1]);s.close()"; }

# start (or restart) the headless chromerpc server on a fresh port
start_rpc() {
  [[ -n "$RPC_PID" ]] && kill "$RPC_PID" 2>/dev/null || true
  RPC_PORT="$(free_port)"
  # HEADLESS=0 runs a visible browser — the in-browser Babel/React SPA paints its
  # route-change embed views reliably headed, where headless can drop the frame.
  local _hl="--headless"; [[ "${HEADLESS:-1}" == "0" ]] && _hl=""
  "$BIN/chromerpc" $_hl --addr ":$RPC_PORT" &>"$CACHE/chromerpc.log" &
  RPC_PID=$!
  for i in $(seq 1 40); do
    if bash -c ">/dev/tcp/localhost/$RPC_PORT" 2>/dev/null; then return 0; fi
    sleep 0.5
  done
  echo "ERROR: chromerpc not ready"; cat "$CACHE/chromerpc.log"; return 1
}

# warm up: load the SPA once so later chunks need only set the hash (no reload).
# The gallery compiles its JSX in-browser via Babel, which is slow, so we give it
# a generous fixed settle plus an embed-route render pass, then a second settle —
# this ensures Babel has finished and the embed view is mounted before captures.
warmup() {
  cat > "$CACHE/warmup.textproto" <<EOF
name: "warmup"
steps { set_viewport { width: 1280 height: 900 device_scale_factor: 2 } }
steps { navigate { url: "$BASE" } }
steps { wait { milliseconds: 9000 } }
steps { evaluate_script { expression: "location.hash='#/embed/color-opacity/color/0';void 0" } }
steps { wait { milliseconds: 2500 } }
steps { evaluate_script { expression: "location.hash='#/';void 0" } }
steps { wait { milliseconds: 1500 } }
EOF
  "$BIN/automate" -addr "localhost:$RPC_PORT" -input "$CACHE/warmup.textproto" -timeout 90s >/dev/null 2>&1
}

# ── build chromerpc + automate ────────────────────────────────────────────────
mkdir -p "$BIN"
if [[ ! -x "$BIN/chromerpc" || ! -x "$BIN/automate" || -n "${REBUILD:-}" ]]; then
  echo "==> Building chromerpc + automate from $CHROMERPC_SRC ..."
  ( cd "$CHROMERPC_SRC" && go build -o "$BIN/chromerpc" ./cmd/chromerpc && go build -o "$BIN/automate" ./cmd/automate )
fi
echo "==> chromerpc binaries ready in $BIN"

# ── serve gallery (serve CT so /gallery and /generated are both reachable) ───
SERVE_PORT="$(free_port)"
echo "==> Serving $CT on :$SERVE_PORT"
python3 -m http.server "$SERVE_PORT" --directory "$CT" &>/dev/null &
HTTP_PID=$!

# ── build the automation sequence (chunked to keep gRPC responses small) ──────
BASE="http://localhost:$SERVE_PORT/gallery/index.html"
mkdir -p "$SCREENS" "$SEQDIR"
rm -f "$SEQDIR"/shots-*.textproto

# Clean the target property dirs first so screenshots for values that no longer
# exist (e.g. after a grammar change removes invalid values) don't linger as
# stale files. ONLY → just those props; otherwise every property in values.json.
if [[ -n "$ONLY" ]]; then
  IFS=',' read -ra _clean_props <<< "$ONLY"
  for _p in "${_clean_props[@]}"; do _p="${_p// /}"; [[ -n "$_p" ]] && rm -rf "$SCREENS/$_p"; done
else
  python3 -c "import json;[print(k) for k in json.load(open('$CT/generated/values.json'))]" \
    | while IFS= read -r _p; do [[ -n "$_p" ]] && rm -rf "$SCREENS/$_p"; done
fi

# Emit ROOT-relative output_path values in the textprotos (not machine-specific
# absolute paths). chromerpc + automate are launched below from $ROOT (this
# script cd'd there), so a relative path resolves to the same screenshots dir.
REL_SCREENS="${SCREENS#$ROOT/}"
go run ./chrome-testing/cmd/shoot/ \
  -values "$CT/generated/values.json" \
  -manifest "$CT/generated/manifest.tsv" \
  -base "$BASE" -outdir "$REL_SCREENS" -seq "$SEQ" \
  ${ONLY:+-only "$ONLY"}

# ── start headless chromerpc + warm up the SPA once ───────────────────────────
echo "==> Starting chromerpc (headless)"
start_rpc || exit 1
warmup
echo "==> chromerpc ready on :$RPC_PORT (SPA warmed)"

# ── run each chunk; recycle + re-warm the browser periodically and on failure ─
echo "==> Capturing screenshots (this can take a while) ..."
chunks=( "$SEQDIR"/shots-*.textproto )
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
# Scope the post-processing (PDF→PNG, frames→GIF) to just this run's properties
# so parallel family shoots don't reprocess or race on each other's output dirs.
scope_dirs=()
if [[ -n "$ONLY" ]]; then
  IFS=',' read -ra _scope_props <<< "$ONLY"
  for _p in "${_scope_props[@]}"; do _p="${_p// /}"; [[ -n "$_p" && -d "$SCREENS/$_p" ]] && scope_dirs+=("$SCREENS/$_p"); done
else
  scope_dirs=("$SCREENS")
fi

# ── Rasterise paged-media PDFs (printToPDF output) into stacked PNGs ──────────
if [[ ${#scope_dirs[@]} -gt 0 ]] && find "${scope_dirs[@]}" -name '*.pdf' -print -quit | grep -q .; then
  echo "==> Rasterising paged-media PDFs to PNG..."
  for _sd in "${scope_dirs[@]}"; do
  python3 - "$_sd" <<'PY'
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
  done
fi

echo "==> Encoding temporal frame sequences into GIFs..."
for _sd in "${scope_dirs[@]}"; do
  go run ./chrome-testing/cmd/gifenc/ -dir "$_sd"
done

echo "==> Screenshots under $SCREENS"
find "$SCREENS" -name '*.png' | wc -l | xargs echo "Total PNGs:"
find "$SCREENS" -name '*.gif' | wc -l | xargs echo "Total GIFs:"
