#!/usr/bin/env bash
# validate-deploy.sh — drive a representative user journey on a DEPLOYED Codex URL
# through the chromerpc bidi pool (a Cloud Run gRPC service), using chrome-proxy's
# long-lived interactive session. Proves the deployed static site actually works.
#
# Journey: load home → search a property → open the result → scroll →
#          open the Grammar drawer → Copy the live CSS (toast confirms).
#
# A gRPC bidi stream is one long-lived connection; chrome-proxy (in the chromerpc
# repo) holds it open and exposes POST /steps locally, so this script can drive a
# single live browser across discrete requests. Screenshots land in $SHOTS.
#
# Auth: a Google identity token via `gcloud auth print-identity-token`.
#
# Env vars:
#   DEPLOY_URL      (default https://css-demo.pages.dev) site under test
#   SEARCH_PROP     (default clip-path) property to search for + open
#   CHROMERPC_POOL  (default chromerpc-bidi-pool-873306079214.us-central1.run.app:443)
#   CHROMERPC_DIR   (default $HOME/Documents/chromerpc) accretional/chromerpc checkout
#   SHOTS           (default chrome-testing/_deploy-shots) per-frame scratch dir
#   GIF_OUT         (default chrome-testing/journey.gif) the committed journey GIF
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_URL="${DEPLOY_URL:-https://css-demo.pages.dev}"
SEARCH_PROP="${SEARCH_PROP:-clip-path}"
POOL="${CHROMERPC_POOL:-chromerpc-bidi-pool-873306079214.us-central1.run.app:443}"
CHROMERPC_DIR="${CHROMERPC_DIR:-$HOME/Documents/chromerpc}"
SHOTS="${SHOTS:-$ROOT/chrome-testing/_deploy-shots}"
LISTEN="127.0.0.1:8099"

[[ -d "$CHROMERPC_DIR" ]] || { echo "ERROR: set CHROMERPC_DIR to an accretional/chromerpc checkout" >&2; exit 1; }
command -v gcloud >/dev/null || { echo "ERROR: gcloud required (for the identity token)" >&2; exit 1; }
command -v go >/dev/null    || { echo "ERROR: go required (to build chrome-proxy)" >&2; exit 1; }

PROXY_PID=""
cleanup() {
  curl -s -m 5 -X POST "http://$LISTEN/close" >/dev/null 2>&1 || true
  [[ -n "$PROXY_PID" ]] && kill "$PROXY_PID" 2>/dev/null || true
}
trap cleanup EXIT

mkdir -p "$SHOTS"
rm -f "$SHOTS"/*.png "$SHOTS"/*.gif 2>/dev/null || true   # only this run's frames feed the gif
echo "==> Building chrome-proxy from $CHROMERPC_DIR"
PROXY_BIN="$(mktemp -d)/chrome-proxy"
( cd "$CHROMERPC_DIR" && go build -o "$PROXY_BIN" ./chrome-proxy )

echo "==> Opening long-lived session to $POOL"
"$PROXY_BIN" -addr "$POOL" -tls -token "$(gcloud auth print-identity-token)" \
  -listen "$LISTEN" -shots "$SHOTS" >/tmp/chrome-proxy-validate.log 2>&1 &
PROXY_PID=$!
for _ in $(seq 1 40); do [[ "$(curl -s -m 2 "http://$LISTEN/health" 2>/dev/null)" == "ok" ]] && break; sleep 0.5; done
[[ "$(curl -s -m 2 "http://$LISTEN/health" 2>/dev/null)" == "ok" ]] || { echo "ERROR: proxy not healthy"; cat /tmp/chrome-proxy-validate.log; exit 1; }

# run a batch of AutomationSteps; fail if any step failed; print script_results.
run() {  # $1 = label  $2 = steps-json
  local label="$1" body="$2" resp
  resp="$(curl -s -m 90 "http://$LISTEN/steps" -d "$body")"
  echo "$resp" | python3 -c '
import sys, json
label = sys.argv[1]
d = json.load(sys.stdin)
results = d.get("results", [])
for r in results:
    sr = r.get("script_result")
    if sr:
        print("   [%s] => %s" % (label, sr[:160]))
    shot = r.get("screenshot")
    if shot:
        print("   [%s] shot %s" % (label, shot))
bad = [b.get("index") for b in results if not b.get("success")]
if bad:
    print("   [%s] FAILED steps: %s" % (label, bad))
    sys.exit(1)
' "$label"
}

# Each phase captures several frames (including mid-scroll) so the assembled GIF
# tells the whole story, not just six stills.
echo "==> [1/6] load home"
run home "{\"steps\":[
  {\"set_viewport\":{\"width\":1440,\"height\":900,\"device_scale_factor\":1}},
  {\"navigate\":{\"url\":\"$DEPLOY_URL/\",\"wait_until\":\"networkidle\"}},
  {\"wait\":{\"milliseconds\":4000}},
  {\"evaluate_script\":{\"expression\":\"JSON.stringify({codex:!!window.CODEX,rails:document.querySelectorAll('.rail-item').length})\"}},
  {\"screenshot\":{\"format\":\"png\"}},
  {\"wait\":{\"milliseconds\":3200}},
  {\"screenshot\":{\"format\":\"png\"}}]}"

echo "==> [2/6] search '$SEARCH_PROP'"
run search "{\"steps\":[
  {\"click\":{\"selector\":\".search-trigger\"}},
  {\"wait\":{\"milliseconds\":700}},
  {\"screenshot\":{\"format\":\"png\"}},
  {\"type_text\":{\"selector\":\".palette-input input\",\"text\":\"$SEARCH_PROP\"}},
  {\"wait\":{\"milliseconds\":900}},
  {\"evaluate_script\":{\"expression\":\"JSON.stringify({results:document.querySelectorAll('.pal-item').length})\"}},
  {\"screenshot\":{\"format\":\"png\"}}]}"

echo "==> [3/6] open result"
run open "{\"steps\":[
  {\"click\":{\"selector\":\".pal-item.sel\"}},
  {\"wait\":{\"milliseconds\":2500}},
  {\"evaluate_script\":{\"expression\":\"JSON.stringify({hash:location.hash,grammar:!!document.querySelector('.grammar-toggle'),play:!!document.querySelector('.playground')})\"}},
  {\"screenshot\":{\"format\":\"png\"}}]}"

echo "==> [4/6] scroll (multi-frame)"
run scroll "{\"steps\":[
  {\"scroll_to\":{\"x\":0,\"y\":240}},{\"wait\":{\"milliseconds\":450}},{\"screenshot\":{\"format\":\"png\"}},
  {\"scroll_to\":{\"x\":0,\"y\":500}},{\"wait\":{\"milliseconds\":450}},{\"screenshot\":{\"format\":\"png\"}},
  {\"scroll_to\":{\"x\":0,\"y\":780}},{\"wait\":{\"milliseconds\":450}},{\"screenshot\":{\"format\":\"png\"}}]}"

echo "==> [5/6] open grammar"
run grammar "{\"steps\":[
  {\"click\":{\"selector\":\".grammar-toggle\"}},
  {\"wait\":{\"milliseconds\":900}},
  {\"scroll_to\":{\"x\":0,\"y\":980}},
  {\"wait\":{\"milliseconds\":600}},
  {\"evaluate_script\":{\"expression\":\"JSON.stringify({grammarOpen:!!document.querySelector('.grammar.open')})\"}},
  {\"screenshot\":{\"format\":\"png\"}}]}"

echo "==> [6/6] copy the CSS"
# the Live-CSS block header has two .copy-btn buttons (Edit + Copy) with the same
# class, so target the Copy one by its text and click it, then confirm the toast.
run copy "{\"steps\":[
  {\"scroll_to\":{\"x\":0,\"y\":560}},{\"wait\":{\"milliseconds\":400}},
  {\"evaluate_script\":{\"expression\":\"(function(){var b=[].slice.call(document.querySelectorAll('.copy-btn')).filter(function(x){return /copy/i.test(x.textContent)})[0];if(!b)return'NO_COPY';b.click();return'CLICKED_COPY'})()\"}},
  {\"wait\":{\"milliseconds\":600}},
  {\"evaluate_script\":{\"expression\":\"JSON.stringify({toast:(document.querySelector('.toast')||{}).textContent||null})\"}},
  {\"screenshot\":{\"format\":\"png\"}}]}"

# ── assemble the captured frames into a GIF (needs Pillow, already a repo dep) ──
# The GIF is the committed artifact and lives in chrome-testing/ (outside the
# gitignored _deploy-shots/ frame scratch); override with GIF_OUT.
echo ""
GIF="${GIF_OUT:-$ROOT/chrome-testing/journey.gif}"
echo "==> Encoding $(ls -1 "$SHOTS"/*.png 2>/dev/null | wc -l | tr -d ' ') frames into $GIF"
python3 - "$SHOTS" "$GIF" <<'PY' || echo "  [warn] gif encode skipped (install Pillow: pip3 install pillow)"
import sys, glob, os
from PIL import Image
shots, out = sys.argv[1], sys.argv[2]
files = sorted(f for f in glob.glob(os.path.join(shots, "*.png")))
if not files:
    raise SystemExit("no frames")
frames, W = [], 960
for f in files:
    im = Image.open(f).convert("RGB")
    frames.append(im.resize((W, round(im.height * W / im.width))))
# hold the first/last frame a touch longer so the loop reads cleanly
durs = [1100] + [850] * (len(frames) - 2) + [1600] if len(frames) > 1 else [1200]
frames[0].save(out, save_all=True, append_images=frames[1:], duration=durs, loop=0, optimize=True)
print("  wrote %s (%d frames)" % (out, len(frames)))
PY

echo ""
echo "==> Journey complete. GIF: $GIF  (frame scratch in $SHOTS)"
[[ -f "$GIF" ]] && command -v open >/dev/null && open "$GIF" || true
