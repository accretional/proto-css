#!/usr/bin/env bash
# tools/gen.sh — Regenerate all generated code: proto (Go, gRPC, gateway, OpenAPI).
#
# Idempotent: safe to re-run at any time. Overwrites previously generated files.
#
# Usage:
#   ./tools/gen.sh              # regenerate everything
#   ./tools/gen.sh --proto      # only proto codegen
#   ./tools/gen.sh --openapi    # only OpenAPI spec generation

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "========================================="
echo "  tools/gen.sh — Code Generation"
echo "========================================="

MODE="${1:-all}"

# ── Proto code generation ───────────────────────────────────────────────────

gen_proto() {
  echo ""
  echo "--- Proto code generation ---"

  PROTO_DIR="$ROOT/proto"
  THIRD_PARTY="$ROOT/third_party"
  GEN_GO_DIR="$ROOT/gen/go"

  if [[ ! -d "$PROTO_DIR" ]]; then
    echo "  [skip] No proto/ directory found. Create proto files and re-run."
    return 0
  fi

  # Ensure output directories exist
  mkdir -p "$GEN_GO_DIR"

  # Check for required tools
  for tool in protoc protoc-gen-go protoc-gen-go-grpc protoc-gen-grpc-gateway protoc-gen-openapiv2; do
    if ! command -v "$tool" &>/dev/null; then
      echo "  ERROR: $tool not found. Run ./setup.sh first." >&2
      exit 1
    fi
  done

  # Collect all .proto files
  PROTO_FILES=()
  while IFS= read -r -d '' f; do
    PROTO_FILES+=("$f")
  done < <(find "$PROTO_DIR" -name '*.proto' -print0)

  if [[ ${#PROTO_FILES[@]} -eq 0 ]]; then
    echo "  [skip] No .proto files found in $PROTO_DIR"
    return 0
  fi

  echo "  Found ${#PROTO_FILES[@]} proto file(s)"

  # Include paths
  INCLUDES=(
    -I "$PROTO_DIR"
    -I "$THIRD_PARTY/googleapis"
    -I "$THIRD_PARTY/protoc-gen-openapiv2"
  )

  # Add third-party includes only if directories exist
  [[ -d "$THIRD_PARTY/googleapis" ]]           || INCLUDES=("${INCLUDES[@]:0:2}")
  [[ -d "$THIRD_PARTY/protoc-gen-openapiv2" ]] || INCLUDES=("${INCLUDES[@]:0:4}")

  echo "  Generating Go + gRPC + gateway + OpenAPI..."

  protoc "${INCLUDES[@]}" \
    --go_out="$GEN_GO_DIR"       --go_opt=paths=source_relative \
    --go-grpc_out="$GEN_GO_DIR"  --go-grpc_opt=paths=source_relative \
    --grpc-gateway_out="$GEN_GO_DIR" --grpc-gateway_opt=paths=source_relative \
    --openapiv2_out="$ROOT/gen/openapi" \
    "${PROTO_FILES[@]}"

  echo "  [ok] Proto codegen complete"
  echo "  Generated Go code:   $GEN_GO_DIR"
  echo "  Generated OpenAPI:   $ROOT/gen/openapi"
}

# ── Buf-based generation (alternative) ──────────────────────────────────────

gen_buf() {
  echo ""
  echo "--- Buf-based generation ---"

  if [[ ! -f "$ROOT/buf.gen.yaml" ]]; then
    echo "  [skip] No buf.gen.yaml found. Using protoc directly."
    return 0
  fi

  if ! command -v buf &>/dev/null; then
    echo "  ERROR: buf not found. Run ./setup.sh first." >&2
    exit 1
  fi

  echo "  Running buf generate..."
  (cd "$ROOT" && buf generate)
  echo "  [ok] buf generate complete"
}

# ── Dispatch ────────────────────────────────────────────────────────────────

case "$MODE" in
  all|--all)
    # Prefer buf if buf.gen.yaml exists, otherwise use raw protoc
    if [[ -f "$ROOT/buf.gen.yaml" ]]; then
      gen_buf
    else
      gen_proto
    fi
    ;;
  --proto)
    gen_proto
    ;;
  --openapi)
    gen_proto  # OpenAPI is generated as part of proto step
    ;;
  *)
    echo "Usage: $0 [--all|--proto|--openapi]" >&2
    exit 1
    ;;
esac

echo ""
echo "========================================="
echo "  tools/gen.sh complete"
echo "========================================="
