#!/usr/bin/env bash
# gen.sh — Generate HTML and build gallery pages. No screenshots.
#
# Usage:
#   ./chrome-testing/gen.sh                              # both template + generated
#   ./chrome-testing/gen.sh --template                   # template gallery only
#   ./chrome-testing/gen.sh --generated                  # generated HTML + gallery
#   ./chrome-testing/gen.sh --gallery-only               # rebuild galleries only (skip EBNF gen)
#   ./chrome-testing/gen.sh --template --gallery-only    # rebuild template gallery only
#   ./chrome-testing/gen.sh --generated --gallery-only   # rebuild generated gallery only
#
# Env vars (generated pipeline):
#   START=0 COUNT=20 ./chrome-testing/gen.sh --generated
#
# Idempotent: safe to re-run at any time.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Parse flags ────────────────────────────────────────────────────────────

DO_TEMPLATE=false
DO_GENERATED=false
GALLERY_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --template)     DO_TEMPLATE=true ;;
    --generated)    DO_GENERATED=true ;;
    --gallery-only) GALLERY_ONLY=true ;;
    *) echo "Unknown flag: $arg" >&2; exit 1 ;;
  esac
done

# Default: do both
if ! $DO_TEMPLATE && ! $DO_GENERATED; then
  DO_TEMPLATE=true
  DO_GENERATED=true
fi

# ── Directories ────────────────────────────────────────────────────────────

TEMPLATES_DIR="$SCRIPT_DIR/html/template"
GEN_DIR="$SCRIPT_DIR/html/generated"
GALLERY_DIR="$SCRIPT_DIR/html"

# ── Gallery builder ────────────────────────────────────────────────────────
# Usage: build_gallery <src_dir> <output_file> <title> <subtitle> <iframe_prefix>

build_gallery() {
  local src_dir="$1"
  local output="$2"
  local title="$3"
  local subtitle="$4"
  local iframe_prefix="$5"

  mkdir -p "$(dirname "$output")"

  cat > "$output" <<'GALLERY_HEAD'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GALLERY_TITLE_PLACEHOLDER</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f0f0f;
      color: #e0e0e0;
      padding: 24px;
    }
    h1 {
      text-align: center;
      font-size: 28px;
      margin-bottom: 8px;
      color: #fff;
    }
    .subtitle {
      text-align: center;
      font-size: 14px;
      color: #888;
      margin-bottom: 32px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      max-width: 1800px;
      margin: 0 auto;
    }
    .card {
      background: #1a1a1a;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #333;
      transition: border-color 0.2s;
      cursor: pointer;
    }
    .card:hover {
      border-color: #666;
    }
    .card .preview {
      position: relative;
      overflow: hidden;
      aspect-ratio: 16/10;
      background: #1a1a2e;
    }
    .card .preview iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 1280px;
      height: 800px;
      transform-origin: 0 0;
      border: none;
      display: block;
      pointer-events: none;
    }
    .card .label {
      padding: 8px 12px;
      font-size: 12px;
      font-family: "SF Mono", "Fira Code", monospace;
      color: #a0cfff;
      background: #111;
      border-top: 1px solid #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.85);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }
    .overlay.active { display: flex; }
    .overlay-box {
      position: relative;
      background: #1a1a2e;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #444;
      display: flex;
      flex-direction: column;
      width: 95vw;
      height: 95vh;
      max-width: 1400px;
      max-height: 95vh;
    }
    .overlay-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background: #111;
      border-bottom: 1px solid #333;
      flex-shrink: 0;
    }
    .overlay-title {
      font-size: 14px;
      font-family: "SF Mono", "Fira Code", monospace;
      color: #a0cfff;
      text-decoration: none;
    }
    .overlay-title:hover {
      text-decoration: underline;
    }
    .overlay-close {
      width: 32px;
      height: 32px;
      border: none;
      background: none;
      color: #888;
      font-size: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
    }
    .overlay-close:hover { background: #333; color: #fff; }
    .overlay-content {
      flex: 1;
      overflow: hidden;
      min-height: 0;
    }
    .overlay-content iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    @media (max-width: 1200px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px)  { .grid { grid-template-columns: repeat(1, 1fr); } }
  </style>
</head>
<body>
  <h1>GALLERY_TITLE_PLACEHOLDER</h1>
GALLERY_HEAD

  # Patch title into the generated HTML
  sed -i '' "s/GALLERY_TITLE_PLACEHOLDER/$title/g" "$output"

  local count
  count=$(ls -1 "$src_dir"/*.html 2>/dev/null | wc -l | tr -d ' ')
  echo "  <p class=\"subtitle\">${subtitle/COUNT/$count}</p>" >> "$output"
  echo '  <div class="grid">' >> "$output"

  for html in $(ls -1 "$src_dir"/*.html 2>/dev/null | sort); do
    local filename
    filename="$(basename "$html")"
    local property="${filename%.html}"
    echo "    <div class=\"card\" onclick=\"openOverlay('${iframe_prefix}/$filename', '$property')\">" >> "$output"
    echo "      <div class=\"preview\"><iframe src=\"${iframe_prefix}/$filename?static=1\" loading=\"lazy\" sandbox=\"allow-same-origin allow-scripts\" scrolling=\"no\"></iframe></div>" >> "$output"
    echo "      <div class=\"label\">$property</div>" >> "$output"
    echo "    </div>" >> "$output"
  done

  cat >> "$output" <<'GALLERY_TAIL'
  </div>
  <div class="overlay" id="overlay" onclick="if(event.target===this)closeOverlay()">
    <div class="overlay-box">
      <div class="overlay-header">
        <a class="overlay-title" id="overlay-title" target="_blank"></a>
        <button class="overlay-close" onclick="closeOverlay()">&times;</button>
      </div>
      <div class="overlay-content" id="overlay-content">
        <iframe id="overlay-iframe" sandbox="allow-same-origin allow-scripts"></iframe>
      </div>
    </div>
  </div>
  <script>
    function scaleIframes() {
      document.querySelectorAll('.card .preview').forEach(function(p) {
        var s = p.offsetWidth / 1280;
        p.querySelector('iframe').style.transform = 'scale(' + s + ')';
      });
    }
    function scaleOverlay() {
      var iframe = document.getElementById('overlay-iframe');
      if (!iframe) return;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.transform = 'none';
    }
    function openOverlay(src, title) {
      var titleEl = document.getElementById('overlay-title');
      titleEl.textContent = title;
      titleEl.href = src;
      document.getElementById('overlay-iframe').src = src;
      document.getElementById('overlay').classList.add('active');
      requestAnimationFrame(scaleOverlay);
    }
    function closeOverlay() {
      document.getElementById('overlay').classList.remove('active');
      document.getElementById('overlay-iframe').src = '';
    }
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeOverlay();
    });
    window.addEventListener('load', scaleIframes);
    window.addEventListener('resize', function() { scaleIframes(); scaleOverlay(); });
  </script>
</body>
</html>
GALLERY_TAIL

  echo "Gallery generated: $output ($count properties)"
}

# ── Template pipeline ──────────────────────────────────────────────────────

if $DO_TEMPLATE; then
  if [[ ! -d "$TEMPLATES_DIR" ]]; then
    echo "ERROR: html/template/ directory not found." >&2
    exit 1
  fi

  echo "=== Building template gallery ==="
  build_gallery "$TEMPLATES_DIR" \
    "$GALLERY_DIR/template_gallery.html" \
    "CSS Properties Live Template Gallery" \
    "COUNT properties (live iframes)" \
    "../html/template"
fi

# ── Generated pipeline ─────────────────────────────────────────────────────

if $DO_GENERATED; then
  if ! $GALLERY_ONLY; then
    echo "=== Generating HTML from EBNF grammar ==="
    cd "$REPO_ROOT"

    ARGS=()
    [[ -n "${START:-}" ]] && ARGS+=(--start "$START")
    [[ -n "${COUNT:-}" ]] && ARGS+=(--count "$COUNT")

    go run ./chrome-testing/cmd/generate/ ${ARGS[@]+"${ARGS[@]}"}
    echo ""

    if [[ ! -d "$GEN_DIR" ]] || [[ -z "$(ls -A "$GEN_DIR"/*.html 2>/dev/null)" ]]; then
      echo "ERROR: No generated HTML files found in $GEN_DIR" >&2
      exit 1
    fi
  fi

  echo "=== Building generated gallery ==="
  build_gallery "$GEN_DIR" \
    "$GALLERY_DIR/generated_gallery.html" \
    "CSS Properties — Generated from EBNF Grammar (Live)" \
    "COUNT properties — values generated from parsed EBNF rules (live iframes)" \
    "../html/generated"
fi

echo "Done."
