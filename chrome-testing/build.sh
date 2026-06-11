#!/usr/bin/env bash
# build.sh — full chrome-testing pipeline: regenerate gallery data from the
# CSS grammar, then screenshot every property. Idempotent.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
"$HERE/gen.sh"
"$HERE/shoot.sh"
