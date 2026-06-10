#!/usr/bin/env bash
# LET_IT_RIP.sh — Full chrome-testing-2.0 pipeline:
#   setup → generate gallery data from the CSS grammar → screenshot every
#   property (static PNGs, temporal GIFs, paged-media PDFs rasterised to PNG) →
#   serve the gallery in a browser.
#
# CRITICAL: Run this before EVERY git commit and git push. No exceptions.
#
# Idempotent: each step kills old servers on its ports and cleans up on exit.
# Set SKIP_SERVE=1 to regenerate everything without opening the viewer.
# Set REBUILD=1 to force a rebuild of the chromerpc/automate binaries.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
CT2="$ROOT/chrome-testing-2.0"

echo ""
echo "############################################"
echo "#               LET IT RIP                 #"
echo "#  setup · gen · shoot · serve (ct 2.0)    #"
echo "############################################"
echo ""

echo "============ Step 1/4: Setup ============"
"$ROOT/setup.sh"
echo ""

echo "============ Step 2/4: Generate gallery data ============"
"$CT2/gen.sh"
echo ""

echo "============ Step 3/4: Screenshot every property ============"
"$CT2/shoot.sh"
echo ""

if [[ -n "${SKIP_SERVE:-}" ]]; then
  echo "############################################"
  echo "#  LET IT RIP complete (serve skipped)     #"
  echo "############################################"
  exit 0
fi

echo "============ Step 4/4: Serve + Browser ============"
exec "$CT2/serve.sh"
