#!/usr/bin/env bash
# dist.sh — assemble a SELF-CONTAINED, deployable static gallery into dist/.
#
# The source gallery (chrome-testing/gallery/) is served from the chrome-testing
# root during local dev, so its index.html reaches OUT to ../generated/… and is
# NOT deployable on its own. This script copies everything the page needs —
# code, generated grammar data, styles, fonts, image assets, and (best-effort)
# vendored React + Babel — into a single folder with deploy-correct relative
# paths. Drop that folder onto any static host (GitHub Pages, Netlify, S3, …)
# and it just works.
#
#   ./chrome-testing/dist.sh                 # build chrome-testing/dist/
#   DIST=/tmp/codex ./chrome-testing/dist.sh # custom output dir
#   VENDOR_OFFLINE=0 ./chrome-testing/dist.sh # keep React/Babel on the CDN
#
# Idempotent: wipes and rebuilds DIST each run.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"            # chrome-testing
GALLERY="$HERE/gallery"
GEN="$HERE/generated"
DIST="${DIST:-$HERE/dist}"
VENDOR_OFFLINE="${VENDOR_OFFLINE:-1}"            # 1 = vendor react/babel locally

[[ -f "$GEN/codex-data.jsx" ]] || { echo "ERROR: no generated data — run ./chrome-testing/gen.sh first." >&2; exit 1; }

echo "==> Assembling self-contained gallery in $DIST"
rm -rf "$DIST"
mkdir -p "$DIST/generated"

# 1. page code + styles + image/font assets (assets already live inside gallery/)
cp "$GALLERY"/*.jsx "$DIST"/
cp "$GALLERY"/styles.css "$DIST"/
cp -R "$GALLERY"/assets "$DIST"/assets

# 2. the grammar-generated data the page loads at runtime
cp "$GEN/codex-data.jsx" "$DIST/generated/"
[[ -f "$GEN/unimplemented.js" ]] && cp "$GEN/unimplemented.js" "$DIST/generated/"

# 3. (best-effort) vendor React + ReactDOM + Babel so the bundle needs no CDN.
#    Use production React builds for a deployed site; fall back to CDN per-lib if
#    a download fails (e.g. offline build host).
# (bash 3.2 on macOS has no associative arrays — use plain flags)
R_OK=""; RD_OK=""; B_OK=""
VENDOR_CACHE="${VENDOR_CACHE:-$HERE/.vendor-cache}"   # downloaded once, reused across rebuilds
if [[ "$VENDOR_OFFLINE" == "1" ]]; then
  mkdir -p "$DIST/vendor" "$VENDOR_CACHE"
  fetch() { # url localname -> 0 on success (cache-first so rebuilds are instant)
    local cached="$VENDOR_CACHE/$2"
    [[ -s "$cached" ]] || curl -fsSL "$1" -o "$cached" 2>/dev/null || true
    if [[ -s "$cached" ]]; then
      cp "$cached" "$DIST/vendor/$2"; echo "    vendored $2"; return 0
    fi
    rm -f "$cached"; echo "    ! could not fetch $2 — leaving on CDN" >&2; return 1
  }
  echo "==> Vendoring React + Babel (set VENDOR_OFFLINE=0 to skip)"
  if fetch "https://unpkg.com/react@18.3.1/umd/react.production.min.js"         react.production.min.js;     then R_OK=1;  fi
  if fetch "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" react-dom.production.min.js; then RD_OK=1; fi
  if fetch "https://unpkg.com/@babel/standalone@7.29.0/babel.min.js"           babel.min.js;                then B_OK=1;  fi
  rmdir "$DIST/vendor" 2>/dev/null || true   # drop empty vendor/ if nothing fetched
fi

# 4. rewrite index.html with deploy-correct paths (../generated -> generated) and
#    swap CDN script srcs for the libs we actually vendored.
python3 - "$GALLERY/index.html" "$DIST/index.html" "$R_OK" "$RD_OK" "$B_OK" <<'PY'
import sys
src, dst, r_ok, rd_ok, b_ok = sys.argv[1:6]
html = open(src, encoding="utf-8").read()
# data path: gallery is served from CT root in dev (../generated); in the bundle
# the data sits in a sibling generated/ folder.
html = html.replace("../generated/", "generated/")
# vendored libs (production React) replace the unpkg CDN tags when present
if r_ok:
    html = html.replace("https://unpkg.com/react@18.3.1/umd/react.development.js",
                        "vendor/react.production.min.js")
if rd_ok:
    html = html.replace("https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js",
                        "vendor/react-dom.production.min.js")
if b_ok:
    html = html.replace("https://unpkg.com/@babel/standalone@7.29.0/babel.min.js",
                        "vendor/babel.min.js")
open(dst, "w", encoding="utf-8").write(html)
PY

echo "==> Self-contained gallery ready: $DIST"
echo "    Deploy: upload the folder as-is, or preview with"
echo "      python3 -m http.server -d \"$DIST\" 8000   # then open http://localhost:8000/"
