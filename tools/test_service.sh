#!/usr/bin/env bash
# test_service.sh — regenerate the proto schema from the grammar, then build and
# test the CssService (render + parse). Idempotent.
#
#   tools/test_service.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Regenerating proto schema (tools/gen_proto.sh)"
"$ROOT/tools/gen_proto.sh"

echo "==> go test ./service/..."
go test ./service/... -count=1 -timeout 180s

echo "==> done"
