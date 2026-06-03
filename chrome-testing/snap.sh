#!/usr/bin/env bash
# snap.sh — takes HTML files (or URLs) and produces PNG screenshots via chromerpc.
#
# Usage:
#   ./snap.sh <input.html> <output.png>        # single HTML file → single PNG
#   ./snap.sh <input_dir/> <output_dir/>       # directory of HTML files → per-property folders
#   ./snap.sh <https://example.com> <out.png>  # external URL directly
#
# Options (directory mode only):
#   --manifest FILE     Tab-separated property→mode mapping (default: all static)
#   --modes-dir DIR     Directory containing mode textproto templates
#
# Output structure (directory mode):
#   output_dir/<property>/1.png              (static mode: single frame)
#   output_dir/<property>/1.png ... 5.png    (temporal mode: 5 frames)
#   output_dir/<property>/1.png ... 3.png    (scroll mode: 3 frames)
#   output_dir/<property>/1.png 2.png        (hover/focus/selection: 2 frames)

set -euo pipefail

CHROMERPC_PORT="${CHROMERPC_PORT:-}"  # empty = auto-assign a free port

# ── Parse arguments ──────────────────────────────────────────────────────────

INPUT=""
OUTPUT=""
MANIFEST=""
MODES_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --manifest)   MANIFEST="$2"; shift 2 ;;
    --modes-dir)  MODES_DIR="$2"; shift 2 ;;
    *)
      if [[ -z "$INPUT" ]]; then
        INPUT="$1"
      elif [[ -z "$OUTPUT" ]]; then
        OUTPUT="$1"
      fi
      shift ;;
  esac
done

if [[ -z "$INPUT" || -z "$OUTPUT" ]]; then
  echo "Usage:"
  echo "  $0 <input.html> <output.png>"
  echo "  $0 <input_dir/> <output_dir/> [--manifest FILE] [--modes-dir DIR]"
  echo "  $0 <https://url> <output.png>"
  exit 1
fi

# ── Cleanup ──────────────────────────────────────────────────────────────────

WORK_DIR=""
CHROMERPC_PID=""
HTTP_PID=""
HTTP_PORT=""
CHROMERPC_ADDR=""

cleanup() {
  [[ -n "$CHROMERPC_PID" ]] && kill "$CHROMERPC_PID" 2>/dev/null || true
  [[ -n "$HTTP_PID" ]]      && kill "$HTTP_PID"      2>/dev/null || true
  [[ -n "$WORK_DIR" ]]      && rm -rf "$WORK_DIR"
}
trap cleanup EXIT

# ── Chrome detection ──────────────────────────────────────────────────────────

find_chrome() {
  if command -v google-chrome &>/dev/null;       then command -v google-chrome; return; fi
  if command -v chromium-browser &>/dev/null;    then command -v chromium-browser; return; fi
  if command -v chromium &>/dev/null;            then command -v chromium; return; fi
  local mac_chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  if [[ -x "$mac_chrome" ]]; then echo "$mac_chrome"; return; fi
  echo ""
}

CHROME="$(find_chrome)"
if [[ -z "$CHROME" ]]; then
  echo "ERROR: Chrome not found. Install Google Chrome and try again." >&2
  exit 1
fi

# ── chromerpc setup ───────────────────────────────────────────────────────────

CACHE="/tmp/chromerpc-testing"
CHROMERPC_BIN="$CACHE/bin/chromerpc"
AUTOMATE_BIN="$CACHE/bin/automate"

setup_chromerpc() {
  if [[ ! -x "$CHROMERPC_BIN" ]]; then
    echo "Fetching chromerpc..."
    mkdir -p "$CACHE"
    if [[ -d "$CACHE/src/.git" ]]; then
      git -C "$CACHE/src" pull --quiet
    else
      git clone --quiet https://github.com/accretional/chromerpc "$CACHE/src"
    fi
    mkdir -p "$CACHE/bin"
    cd "$CACHE/src"
    go build -o "$CHROMERPC_BIN" ./cmd/chromerpc
    go build -o "$AUTOMATE_BIN"  ./cmd/automate
    echo "chromerpc ready."
  else
    echo "Using cached chromerpc: $CHROMERPC_BIN"
  fi
}

setup_chromerpc

# ── Determine mode ────────────────────────────────────────────────────────────

is_url=false
[[ "$INPUT" == http://* || "$INPUT" == https://* ]] && is_url=true

is_dir=false
[[ -d "$INPUT" ]] && is_dir=true

# ── Free port helper ──────────────────────────────────────────────────────────

find_free_port() {
  python3 -c "import socket; s=socket.socket(); s.bind(('',0)); p=s.getsockname()[1]; s.close(); print(p)"
}

# ── Start local HTTP server (only for local HTML inputs) ──────────────────────

HTML_SERVE_DIR=""
URL_PREFIX=""

if [[ "$is_url" == false ]]; then
  if [[ "$is_dir" == true ]]; then
    # Serve from the parent directory so ../interactive.js resolves correctly
    local_input_dir="$(cd "$INPUT" && pwd)"
    HTML_SERVE_DIR="$(dirname "$local_input_dir")"
    URL_PREFIX="$(basename "$local_input_dir")"
  else
    HTML_SERVE_DIR="$(cd "$(dirname "$INPUT")" && pwd)"
  fi

  HTTP_PORT="$(find_free_port)"
  echo "Starting HTTP server on port $HTTP_PORT (serving $HTML_SERVE_DIR)..."
  python3 -m http.server "$HTTP_PORT" --directory "$HTML_SERVE_DIR" &>/dev/null &
  HTTP_PID=$!
  disown "$HTTP_PID"
fi

# ── Start chromerpc ───────────────────────────────────────────────────────────

CHROMERPC_PORT="$(find_free_port)"
CHROMERPC_ADDR="localhost:$CHROMERPC_PORT"

echo "Starting chromerpc on :$CHROMERPC_PORT ..."
"$CHROMERPC_BIN" --headless --addr ":$CHROMERPC_PORT" &>/dev/null &
CHROMERPC_PID=$!
disown "$CHROMERPC_PID"

echo "Waiting for chromerpc to be ready..."
for i in $(seq 1 40); do
  if bash -c ">/dev/tcp/localhost/$CHROMERPC_PORT" 2>/dev/null; then
    echo "chromerpc is ready."
    break
  fi
  sleep 0.5
  if [[ $i -eq 40 ]]; then
    echo "ERROR: chromerpc did not become ready in time." >&2
    exit 1
  fi
done

# ── Load manifest ────────────────────────────────────────────────────────────

WORK_DIR="$(mktemp -d)"

if [[ -n "$MANIFEST" ]] && [[ -f "$MANIFEST" ]]; then
  echo "Loaded manifest: $(wc -l < "$MANIFEST" | tr -d ' ') entries"
fi

# Lookup mode for a property from the manifest file
get_mode() {
  local slug="$1"
  if [[ -n "$MANIFEST" ]] && [[ -f "$MANIFEST" ]]; then
    local mode
    mode="$(grep "^${slug}	" "$MANIFEST" 2>/dev/null | head -1 | cut -f2)"
    echo "${mode:-static}"
  else
    echo "static"
  fi
}

# ── Resize helper ────────────────────────────────────────────────────────────

resize_if_needed() {
  local png="$1"
  [[ -f "$png" ]] || return 0
  local h w max_dim
  h="$(sips -g pixelHeight "$png" | awk '/pixelHeight/{print $2}')"
  w="$(sips -g pixelWidth  "$png" | awk '/pixelWidth/{print $2}')"
  max_dim=$h
  [[ "$w" -gt "$max_dim" ]] && max_dim=$w
  if [[ "$max_dim" -gt 2000 ]]; then
    echo "  Resizing $png from ${w}x${h} to fit within 2000px"
    sips --resampleHeightWidthMax 2000 "$png" --out "$png" &>/dev/null
  fi
}

# ── Screenshot with mode template ────────────────────────────────────────────

take_screenshot_with_mode() {
  local url="$1"
  local out_dir="$2"
  local slug="$3"
  local mode="$4"

  mkdir -p "$out_dir"
  local abs_out_dir
  abs_out_dir="$(cd "$out_dir" && pwd)"

  local template=""
  if [[ -n "$MODES_DIR" ]] && [[ -f "$MODES_DIR/${mode}.textproto" ]]; then
    template="$MODES_DIR/${mode}.textproto"
  fi

  local textproto="$WORK_DIR/${slug}.textproto"

  if [[ -n "$template" ]]; then
    # Use mode template with placeholder substitution
    sed -e "s|{{URL}}|${url}|g" \
        -e "s|{{OUTPUT_DIR}}|${abs_out_dir}|g" \
        -e "s|{{SLUG}}|${slug}|g" \
        "$template" > "$textproto"
  else
    # Inline static fallback (no modes-dir provided)
    cat > "$textproto" <<PROTO
name: "screenshot_${slug}"
steps: {
  label: "set_viewport"
  set_viewport: {
    width: 1280
    height: 800
    device_scale_factor: 2
  }
}
steps: {
  label: "navigate"
  navigate: {
    url: "$url"
  }
}
steps: {
  label: "wait_for_render"
  wait: {
    milliseconds: 500
  }
}
steps: {
  label: "capture"
  screenshot: {
    output_path: "$abs_out_dir/1.png"
    format: "png"
  }
}
PROTO
  fi

  echo "Screenshotting ($mode): $url -> $abs_out_dir/"
  "$AUTOMATE_BIN" -addr "$CHROMERPC_ADDR" -input "$textproto"

  # Resize all PNGs in the output directory
  for png in "$abs_out_dir"/*.png; do
    resize_if_needed "$png"
  done
}

# ── Legacy single-file screenshot (backward compat) ──────────────────────────

take_screenshot_single() {
  local url="$1"
  local out_file="$2"

  mkdir -p "$(dirname "$out_file")"
  local abs_out
  abs_out="$(cd "$(dirname "$out_file")" && pwd)/$(basename "$out_file")"

  local slug
  slug="$(basename "$out_file" .png | tr ' /' '_-')"
  local textproto="$WORK_DIR/${slug}.textproto"

  cat > "$textproto" <<PROTO
name: "screenshot_${slug}"
steps: {
  label: "set_viewport"
  set_viewport: {
    width: 1280
    height: 800
    device_scale_factor: 2
  }
}
steps: {
  label: "navigate"
  navigate: {
    url: "$url"
  }
}
steps: {
  label: "wait_for_render"
  wait: {
    milliseconds: 500
  }
}
steps: {
  label: "capture"
  screenshot: {
    output_path: "$abs_out"
    format: "png"
  }
}
PROTO

  echo "Screenshotting: $url -> $abs_out"
  "$AUTOMATE_BIN" -addr "$CHROMERPC_ADDR" -input "$textproto"

  resize_if_needed "$abs_out"
}

# ── Run ───────────────────────────────────────────────────────────────────────

if [[ "$is_url" == true ]]; then
  # Direct URL mode — single file output
  take_screenshot_single "$INPUT" "$OUTPUT"

elif [[ "$is_dir" == true ]]; then
  # Directory mode — per-property folders
  mkdir -p "$OUTPUT"
  shopt -s nullglob
  html_files=("$INPUT"/*.html)
  if [[ ${#html_files[@]} -eq 0 ]]; then
    echo "ERROR: No .html files found in $INPUT" >&2
    exit 1
  fi
  for html in "${html_files[@]}"; do
    filename="$(basename "$html")"
    slug="${filename%.html}"
    mode="$(get_mode "$slug")"
    # Modes that need direct DOM access (evaluate_script) use ?static=1.
    # Modes driven by interactive.js simulation use ?screenshot=1.
    case "$mode" in
      static|focus|selection)
        url="http://localhost:$HTTP_PORT/${URL_PREFIX}/${filename}?static=1" ;;
      *)
        url="http://localhost:$HTTP_PORT/${URL_PREFIX}/${filename}?screenshot=1" ;;
    esac
    outdir="$OUTPUT/${slug}"
    take_screenshot_with_mode "$url" "$outdir" "$slug" "$mode"
  done

else
  # Single HTML file mode — single file output
  filename="$(basename "$INPUT")"
  url="http://localhost:$HTTP_PORT/${filename}"
  take_screenshot_single "$url" "$OUTPUT"
fi

echo ""
echo "Done. Screenshots are ready."
