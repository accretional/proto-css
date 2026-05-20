#!/usr/bin/env bash
# setup.sh — Install proto plugins, download third-party protos, tidy modules,
#             and ensure the local toolchain is ready.
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

# ── Install / update proto plugins ──────────────────────────────────────────

echo ""
echo "--- Installing proto toolchain ---"

install_go_tool() {
  local pkg="$1"
  local bin_name
  bin_name="$(basename "$pkg")"
  if command -v "$bin_name" &>/dev/null; then
    echo "  [ok] $bin_name already installed"
  else
    echo "  Installing $bin_name ..."
    go install "$pkg"
    echo "  [ok] $bin_name installed"
  fi
}

# protoc-gen-go and gRPC plugins
install_go_tool "google.golang.org/protobuf/cmd/protoc-gen-go@latest"
install_go_tool "google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest"

# grpc-gateway and OpenAPI plugins
install_go_tool "github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@latest"
install_go_tool "github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2@latest"

# buf (proto linter/builder) — optional but recommended
if command -v buf &>/dev/null; then
  echo "  [ok] buf already installed"
else
  echo "  Installing buf ..."
  go install github.com/bufbuild/buf/cmd/buf@latest
  echo "  [ok] buf installed"
fi

# ── Download third-party protos ─────────────────────────────────────────────

echo ""
echo "--- Downloading third-party protos ---"

THIRD_PARTY="$ROOT/third_party"
mkdir -p "$THIRD_PARTY"

# Google API protos (googleapis) — needed for grpc-gateway annotations
GOOGLEAPIS_DIR="$THIRD_PARTY/googleapis"
if [[ -d "$GOOGLEAPIS_DIR/.git" ]]; then
  echo "  Updating googleapis..."
  git -C "$GOOGLEAPIS_DIR" pull --quiet 2>/dev/null || true
  echo "  [ok] googleapis updated"
else
  echo "  Cloning googleapis..."
  rm -rf "$GOOGLEAPIS_DIR"
  git clone --quiet --depth 1 https://github.com/googleapis/googleapis.git "$GOOGLEAPIS_DIR"
  echo "  [ok] googleapis cloned"
fi

# protoc-gen-openapiv2 proto definitions
OPENAPIV2_DIR="$THIRD_PARTY/protoc-gen-openapiv2"
if [[ -d "$OPENAPIV2_DIR/.git" ]]; then
  echo "  Updating protoc-gen-openapiv2 protos..."
  git -C "$OPENAPIV2_DIR" pull --quiet 2>/dev/null || true
  echo "  [ok] protoc-gen-openapiv2 updated"
else
  echo "  Cloning grpc-gateway (for openapiv2 protos)..."
  rm -rf "$OPENAPIV2_DIR"
  git clone --quiet --depth 1 https://github.com/grpc-ecosystem/grpc-gateway.git "$OPENAPIV2_DIR"
  echo "  [ok] protoc-gen-openapiv2 cloned"
fi

# ── Build chromerpc (for screenshot testing) ────────────────────────────────

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

# ── Done ────────────────────────────────────────────────────────────────────

echo ""
echo "========================================="
echo "  setup.sh complete"
echo "========================================="
