#!/usr/bin/env bash
# gen.sh — walk the CSS EBNF grammar (gluon v2 + proto reflection) and emit the
# gallery data file generated/codex-data.jsx. Idempotent.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f "$ROOT/chrome-testing-2.0/generated/descriptions.json" ]]; then "$ROOT/chrome-testing-2.0/docs.sh"; fi

echo "==> Generating gallery data from CSS grammar..."
go run ./chrome-testing-2.0/cmd/gen/ \
  -lang "$ROOT/lang" \
  -out "$ROOT/chrome-testing-2.0/generated"

echo "==> Done. Data at chrome-testing-2.0/generated/codex-data.jsx"
