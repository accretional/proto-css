#!/usr/bin/env bash
# setup.sh — Check prerequisites, build chromerpc, and tidy Go modules.
#
# Idempotent: safe to re-run at any time.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "========================================="
echo "  setup.sh — Project Setup"
echo "========================================="

# ── Check prerequisites ─────────────────────────────────────────────────────

check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    echo "ERROR: $1 is not installed." >&2
    echo "  $2" >&2
    return 1
  fi
  echo "  [ok] $1 found: $(command -v "$1")"
}

echo ""
echo "--- Checking prerequisites ---"
MISSING=0
check_cmd go       "Install from https://go.dev/dl/"               || MISSING=1
check_cmd python3  "Install Python 3 from https://python.org"      || MISSING=1

# Chrome detection (same logic as snap.sh)
CHROME=""
if command -v google-chrome &>/dev/null; then
  CHROME="$(command -v google-chrome)"
elif command -v chromium-browser &>/dev/null; then
  CHROME="$(command -v chromium-browser)"
elif command -v chromium &>/dev/null; then
  CHROME="$(command -v chromium)"
elif [[ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]]; then
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
fi

if [[ -z "$CHROME" ]]; then
  echo "  [FAIL] Google Chrome not found." >&2
  MISSING=1
else
  echo "  [ok] Chrome found: $CHROME"
fi

if [[ $MISSING -ne 0 ]]; then
  echo ""
  echo "FATAL: Missing prerequisites. Install them and re-run." >&2
  exit 1
fi

# ── Deploy + validate + proto tooling (best-effort install, non-fatal) ──────
# Needed for: deploying dist/ to Cloudflare Pages (deploy.sh), validating a
# deployment via the chromerpc bidi pool (validate-deploy.sh), cloning the
# private accretional repos, and regenerating proto/ (the gRPC service).
# Idempotent: present tools are skipped; only missing ones are installed.

HAVE_BREW=0; command -v brew &>/dev/null && HAVE_BREW=1
HAVE_NPM=0;  command -v npm  &>/dev/null && HAVE_NPM=1
HAVE_GO=0;   command -v go   &>/dev/null && HAVE_GO=1
GOBIN_DIR="$( (go env GOPATH 2>/dev/null || echo "$HOME/go") )/bin"
brew_or() { [[ $HAVE_BREW -eq 1 ]] && printf '%s' "$1"; }
go_or()   { [[ $HAVE_GO   -eq 1 ]] && printf '%s' "$1"; }
npm_or()  { [[ $HAVE_NPM  -eq 1 ]] && printf '%s' "$1"; }

# ensure_cmd <name> <install-cmd (may be empty)> <manual-hint>  — never fatal
ensure_cmd() {
  local name="$1" install="$2" hint="$3"
  if command -v "$name" &>/dev/null; then echo "  [ok] $name: $(command -v "$name")"; return 0; fi
  if [[ -x "$GOBIN_DIR/$name" ]]; then echo "  [ok] $name: $GOBIN_DIR/$name (ensure on PATH)"; return 0; fi
  if [[ -n "$install" ]]; then
    echo "  [..] installing $name  ($install)"
    eval "$install" >/dev/null 2>&1 || true
    if command -v "$name" &>/dev/null || [[ -x "$GOBIN_DIR/$name" ]]; then
      echo "  [ok] $name installed (add $GOBIN_DIR to PATH if it is a go tool)"; return 0
    fi
  fi
  echo "  [warn] $name not available — $hint"
  return 0
}

echo ""
echo "--- Deploy + validate tooling ---"
ensure_cmd node     "$(brew_or 'brew install node')"                                            "install Node.js — https://nodejs.org"
ensure_cmd npm      "$(brew_or 'brew install node')"                                            "install Node.js — https://nodejs.org"
HAVE_NPM=0; command -v npm &>/dev/null && HAVE_NPM=1
ensure_cmd wrangler "$(npm_or 'npm install -g wrangler')"                                       "npm install -g wrangler"
ensure_cmd grpcurl  "$(go_or 'go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest')"  "go install github.com/fullstorydev/grpcurl/cmd/grpcurl@latest"
ensure_cmd gh       "$(brew_or 'brew install gh')"                                              "install GitHub CLI — https://cli.github.com (for the private accretional repos)"
ensure_cmd gcloud   "$(brew_or 'brew install --cask google-cloud-sdk')"                         "install Google Cloud SDK — https://cloud.google.com/sdk ; then: gcloud auth login"

echo ""
echo "--- Proto toolchain (for regenerating proto/) ---"
ensure_cmd protoc             "$(brew_or 'brew install protobuf')"                                            "install protobuf — https://grpc.io/docs/protoc-installation"
ensure_cmd protoc-gen-go      "$(go_or 'go install google.golang.org/protobuf/cmd/protoc-gen-go@latest')"     "go install google.golang.org/protobuf/cmd/protoc-gen-go@latest"
ensure_cmd protoc-gen-go-grpc "$(go_or 'go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest')"    "go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest"

# ── Build chromerpc (for screenshots) ──────────────────────────────────────

echo ""
echo "--- Setting up chromerpc ---"

CACHE="/tmp/chromerpc-testing"
CHROMERPC_BIN="$CACHE/bin/chromerpc"

if [[ -x "$CHROMERPC_BIN" ]]; then
  echo "  [ok] chromerpc already built: $CHROMERPC_BIN"
else
  echo "  Building chromerpc..."
  mkdir -p "$CACHE"
  if [[ -d "$CACHE/src/.git" ]]; then
    git -C "$CACHE/src" pull --quiet
  else
    git clone --quiet https://github.com/accretional/chromerpc "$CACHE/src"
  fi
  mkdir -p "$CACHE/bin"
  (cd "$CACHE/src" && go build -o "$CACHE/bin/chromerpc" ./cmd/chromerpc)
  (cd "$CACHE/src" && go build -o "$CACHE/bin/automate"  ./cmd/automate)
  echo "  [ok] chromerpc built"
fi

# ── Tidy Go modules ────────────────────────────────────────────────────────

echo ""
echo "--- Tidying Go modules ---"

if [[ -f "$ROOT/go.mod" ]]; then
  (cd "$ROOT" && go mod tidy)
  echo "  [ok] go mod tidy complete"
else
  echo "  [skip] No go.mod found yet"
fi

# ── Verify EBNF grammar files ─────────────────────────────────────────────

echo ""
echo "--- Checking EBNF grammar ---"

LANG_DIR="$ROOT/lang"
if [[ -d "$LANG_DIR" ]]; then
  EBNF_COUNT=$(find "$LANG_DIR" -name '*.ebnf' | wc -l | tr -d ' ')
  echo "  [ok] $EBNF_COUNT EBNF grammar files found in lang/"
else
  echo "  [warn] No lang/ directory found"
fi

# ── Verify Go generator builds ─────────────────────────────────────────────

echo ""
echo "--- Checking EBNF generator builds ---"

GEN_CMD="$ROOT/chrome-testing/cmd/gen"
if [[ -d "$GEN_CMD" ]]; then
  if (cd "$ROOT" && go build ./chrome-testing/cmd/gen/ ./chrome-testing/cmd/shoot/); then
    echo "  [ok] EBNF generator + shoot build successfully"
  else
    echo "  [FAIL] generator/shoot build failed" >&2
  fi
else
  echo "  [skip] No chrome-testing/cmd/gen/ directory found"
fi

# ── Done ────────────────────────────────────────────────────────────────────

echo ""
echo "========================================="
echo "  setup.sh complete"
echo "========================================="
