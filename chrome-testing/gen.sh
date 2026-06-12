#!/usr/bin/env bash
# gen.sh — walk the CSS EBNF grammar (gluon v2 + proto reflection) and emit the
# gallery data file generated/codex-data.jsx. Idempotent.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f "$ROOT/chrome-testing/generated/descriptions.json" ]]; then "$ROOT/chrome-testing/docs.sh"; fi

echo "==> Generating gallery data from CSS grammar..."
go run ./chrome-testing/cmd/gen/ \
  -lang "$ROOT/lang" \
  -out "$ROOT/chrome-testing/generated"

echo "==> Done. Data at chrome-testing/generated/codex-data.jsx"

# Assemble the self-contained, deployable gallery bundle (dist/). Set
# SKIP_DIST=1 to regenerate only the data without rebundling.
if [[ -z "${SKIP_DIST:-}" ]]; then
  "$ROOT/chrome-testing/dist.sh"
fi
