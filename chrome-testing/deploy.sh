#!/usr/bin/env bash
# deploy.sh — deploy the self-contained gallery bundle (dist/) to Cloudflare Pages.
#
# Two-part deploy (see DEPLOY.md for the why):
#   1. PROJECT creation goes through proto-cloudflare's gRPC Cloudflare API
#      (reflection-discovered cloudflare.pages.PagesProjectService) — optional,
#      only when a checkout is provided via PROTO_CLOUDFLARE_DIR.
#   2. ASSET UPLOAD goes through wrangler, because Cloudflare Pages direct-upload
#      needs the blake3-hashed JWT asset flow that proto-cloudflare's generated
#      REST wrapper doesn't expose (its CreateDeployment takes only a manifest).
#
# No secrets live in the repo — everything comes from the environment:
#   CLOUDFLARE_API_TOKEN   (required) Pages-edit-scoped API token
#   CLOUDFLARE_ACCOUNT_ID  (required) target account id
#   CF_PAGES_PROJECT       (default: css-demo)  project name (lowercase + hyphens)
#   CF_PAGES_BRANCH        (default: main)       production branch
#   PROTO_CLOUDFLARE_DIR   (optional) path to an accretional/proto-cloudflare
#                          checkout; when set, the project is created via gRPC.
#   SKIP_GEN=1             (optional) redeploy the existing dist/ without regenerating
#
# Idempotent: each run regenerates the bundle from the grammar (gen.sh) and
# redeploys; project creation tolerates "already exists".
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CT="$ROOT/chrome-testing"
DIST="${DIST:-$CT/dist}"
PROJECT="${CF_PAGES_PROJECT:-css-demo}"
BRANCH="${CF_PAGES_BRANCH:-main}"

: "${CLOUDFLARE_API_TOKEN:?set CLOUDFLARE_API_TOKEN (a Pages-edit-scoped Cloudflare API token)}"
: "${CLOUDFLARE_ACCOUNT_ID:?set CLOUDFLARE_ACCOUNT_ID (target account id; see: wrangler whoami)}"
command -v wrangler >/dev/null || { echo "ERROR: wrangler not found (npm i -g wrangler)" >&2; exit 1; }

SVPID=""
cleanup() { [[ -n "$SVPID" ]] && kill "$SVPID" 2>/dev/null || true; }
trap cleanup EXIT
free_port() { python3 -c "import socket;s=socket.socket();s.bind(('',0));print(s.getsockname()[1]);s.close()"; }

# 1. (re)generate gallery data from the grammar AND assemble the self-contained
#    bundle. gen.sh runs the generator + dist.sh, so every deploy ships a freshly
#    generated dist/ (idempotent). SKIP_GEN=1 redeploys the existing dist/ as-is.
if [[ -z "${SKIP_GEN:-}" ]]; then
  echo "==> Generating gallery data + self-contained bundle (gen.sh)"
  "$CT/gen.sh"
elif [[ ! -f "$DIST/index.html" ]]; then
  echo "==> SKIP_GEN set but no dist/ yet — assembling bundle (dist.sh)"
  "$CT/dist.sh"
fi

# 2. create the Pages project via proto-cloudflare gRPC (optional, idempotent)
if [[ -n "${PROTO_CLOUDFLARE_DIR:-}" && -d "$PROTO_CLOUDFLARE_DIR" ]]; then
  if command -v grpcurl >/dev/null 2>&1; then
    echo "==> Creating Pages project '$PROJECT' via proto-cloudflare gRPC"
    PORT="$(free_port)"
    BIN="$(mktemp -d)/pcf-serverd"
    ( cd "$PROTO_CLOUDFLARE_DIR" && go build -o "$BIN" ./cmd/serverd )
    # serverd reads CLOUDFLARE_API_TOKEN from the inherited environment (no secret
    # written to disk); -env /dev/null skips any stray key.env in the cwd.
    CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" "$BIN" -addr ":$PORT" -env /dev/null >/tmp/pcf-serverd-deploy.log 2>&1 &
    SVPID=$!
    for _ in $(seq 1 40); do bash -c ">/dev/tcp/localhost/$PORT" 2>/dev/null && break; sleep 0.5; done
    grpcurl -plaintext -d "{\"account_id\":\"$CLOUDFLARE_ACCOUNT_ID\",\"body\":{\"name\":\"$PROJECT\",\"production_branch\":\"$BRANCH\"}}" \
      "localhost:$PORT" cloudflare.pages.PagesProjectService.PagesProjectCreateProject 2>&1 \
      | grep -iE "\"name\"|\"subdomain\"|already|exists|error|message" | head -4 || true
    kill "$SVPID" 2>/dev/null || true; SVPID=""
  else
    echo "==> PROTO_CLOUDFLARE_DIR set but grpcurl missing — wrangler will create the project"
  fi
else
  echo "==> (no PROTO_CLOUDFLARE_DIR — wrangler will create '$PROJECT' on first deploy)"
fi

# 3. upload assets + create the deployment via wrangler
echo "==> Deploying $DIST to Cloudflare Pages project '$PROJECT' (branch $BRANCH)"
wrangler pages deploy "$DIST" --project-name "$PROJECT" --branch "$BRANCH" --commit-dirty=true

echo "==> Done. Production URL: https://$PROJECT.pages.dev/"
