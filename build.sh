#!/usr/bin/env bash
# build.sh — The EBNF → proto → gallery build for proto-css.
#
# Pipeline (the grammar is the source of truth):
#   1. ./setup.sh               — prereqs + go mod tidy (idempotent)
#   2. ./tools/gen_proto.sh     — compile lang/*.ebnf via gluon genproto into
#                                 proto/css.proto, proto/css.fdset, and the
#                                 codec tables in proto/pb/css/
#   3. chrome-testing/gen.sh    — walk the grammar, emit the gallery data
#                                 (codex-data.jsx + _codec_failures.tsv) and
#                                 bundle the deployable gallery (dist/)
#
# Screenshots are a separate, long-running flow: chrome-testing/shoot.sh.
#
# Idempotent: safe to re-run; regenerates committed artifacts in place.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "========================================="
echo "  build.sh — EBNF -> proto -> gallery"
echo "========================================="

echo ""
echo "--- Step 1/3: setup ---"
"$ROOT/setup.sh"

echo ""
echo "--- Step 2/3: grammar -> proto (gen_proto) ---"
"$ROOT/tools/gen_proto.sh"

echo ""
echo "--- Step 3/3: gallery data (chrome-testing/gen.sh) ---"
"$ROOT/chrome-testing/gen.sh"

echo ""
echo "========================================="
echo "  build.sh complete"
echo "========================================="
