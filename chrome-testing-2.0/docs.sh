#!/usr/bin/env bash
# docs.sh — download MDN property doc pages and extract, per property, the
# summary paragraph (inner HTML, links kept) plus the experimental / nonstandard
# / deprecated / warning status notecards, into generated/descriptions.json
# (HTML cached under generated/mdn-cache; safe to re-run offline).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
echo "==> Fetching MDN property descriptions..."
go run ./chrome-testing-2.0/cmd/mdndesc/ "$ROOT/docs/reference/mdnproperties-reference.md"
