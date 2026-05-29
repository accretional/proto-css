#!/usr/bin/env bash
# run.sh — Screenshot all CSS property templates and generate the live gallery.
#
# Usage:
#   ./run.sh                    # screenshot all templates + build gallery
#   ./run.sh --gallery-only     # just regenerate gallery.html

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/html/template"
SCREENSHOTS_DIR="$SCRIPT_DIR/screenshots/template"
MODES_DIR="$SCRIPT_DIR/screenshots/textproto"
BLUEPRINTS_DIR="$SCRIPT_DIR/textproto/blueprints"
GALLERY_DIR="$SCRIPT_DIR/html"
TEMPLATE_GALLERY="$GALLERY_DIR/template_gallery.html"
MANIFEST="$TEMPLATES_DIR/screenshot_modes.txt"

if [[ ! -d "$TEMPLATES_DIR" ]]; then
  echo "ERROR: html/template/ directory not found." >&2
  exit 1
fi

# ── Generate manifest from blueprints ────────────────────────────────────────

generate_manifest() {
  echo "=== Generating screenshot modes manifest from blueprints ==="
  > "$MANIFEST"
  for html in "$TEMPLATES_DIR"/*.html; do
    slug="$(basename "$html" .html)"
    bp="$BLUEPRINTS_DIR/${slug}.textproto"
    mode="static"
    if [[ -f "$bp" ]]; then
      m="$(grep -m1 'screenshot_textproto:' "$bp" 2>/dev/null | sed 's/.*"\(.*\)"/\1/' || true)"
      [[ -n "$m" ]] && mode="$m"
    fi
    printf '%s\t%s\n' "$slug" "$mode" >> "$MANIFEST"
  done
  echo "  Wrote $(wc -l < "$MANIFEST" | tr -d ' ') entries to $MANIFEST"
}

# ── Screenshot all templates ─────────────────────────────────────────────────

if [[ "${1:-}" != "--gallery-only" ]]; then
  echo "=== Screenshotting all CSS property templates ==="
  generate_manifest
  mkdir -p "$SCREENSHOTS_DIR"
  "$SCRIPT_DIR/snap.sh" "$TEMPLATES_DIR/" "$SCREENSHOTS_DIR/" \
    --manifest "$MANIFEST" \
    --modes-dir "$MODES_DIR"
  echo ""
fi

# ── Generate template iframe gallery ────────────────────────────────────────

mkdir -p "$GALLERY_DIR"

echo "=== Generating template_gallery.html ==="

cat > "$TEMPLATE_GALLERY" <<'TGALLERY_HEAD'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CSS Properties Live Template Gallery</title>
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
      grid-template-columns: repeat(5, 1fr);
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
    .card iframe {
      width: 100%;
      aspect-ratio: 16/10;
      border: none;
      display: block;
      background: #1a1a2e;
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
      background: rgba(0,0,0,0.8);
      z-index: 1000;
      align-items: center;
      justify-content: center;
    }
    .overlay.active { display: flex; }
    .overlay-box {
      position: relative;
      width: 90vw;
      height: 85vh;
      max-width: 1400px;
      background: #1a1a2e;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #444;
    }
    .overlay-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background: #111;
      border-bottom: 1px solid #333;
    }
    .overlay-title {
      font-size: 14px;
      font-family: "SF Mono", "Fira Code", monospace;
      color: #a0cfff;
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
    .overlay-box iframe {
      width: 100%;
      height: calc(100% - 44px);
      border: none;
    }
    @media (max-width: 1200px) { .grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 768px)  { .grid { grid-template-columns: repeat(2, 1fr); } }
  </style>
</head>
<body>
  <h1>CSS Properties Live Template Gallery</h1>
TGALLERY_HEAD

tcount=$(ls -1 "$TEMPLATES_DIR"/*.html 2>/dev/null | wc -l | tr -d ' ')
echo "  <p class=\"subtitle\">${tcount} properties (live iframes)</p>" >> "$TEMPLATE_GALLERY"
echo '  <div class="grid">' >> "$TEMPLATE_GALLERY"

for html in $(ls -1 "$TEMPLATES_DIR"/*.html 2>/dev/null | sort); do
  filename="$(basename "$html")"
  slug="${filename%.html}"
  property="$slug"
  echo "    <div class=\"card\" onclick=\"openOverlay('../html/template/$filename', '$property')\">" >> "$TEMPLATE_GALLERY"
  echo "      <iframe src=\"../html/template/$filename\" loading=\"lazy\" sandbox=\"allow-same-origin allow-scripts\"></iframe>" >> "$TEMPLATE_GALLERY"
  echo "      <div class=\"label\">$property</div>" >> "$TEMPLATE_GALLERY"
  echo "    </div>" >> "$TEMPLATE_GALLERY"
done

cat >> "$TEMPLATE_GALLERY" <<'TGALLERY_TAIL'
  </div>
  <div class="overlay" id="overlay" onclick="if(event.target===this)closeOverlay()">
    <div class="overlay-box">
      <div class="overlay-header">
        <span class="overlay-title" id="overlay-title"></span>
        <button class="overlay-close" onclick="closeOverlay()">&times;</button>
      </div>
      <iframe id="overlay-iframe" sandbox="allow-same-origin allow-scripts"></iframe>
    </div>
  </div>
  <script>
    function openOverlay(src, title) {
      document.getElementById('overlay-title').textContent = title;
      document.getElementById('overlay-iframe').src = src;
      document.getElementById('overlay').classList.add('active');
    }
    function closeOverlay() {
      document.getElementById('overlay').classList.remove('active');
      document.getElementById('overlay-iframe').src = '';
    }
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeOverlay();
    });
  </script>
</body>
</html>
TGALLERY_TAIL

echo "Template gallery generated: $TEMPLATE_GALLERY ($tcount properties)"
echo "Done."
