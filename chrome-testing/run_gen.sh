#!/usr/bin/env bash
# run_gen.sh — Generate HTML from EBNF grammar, screenshot, and build gallery.
#
# Usage:
#   ./chrome-testing/run_gen.sh                        # all properties
#   START=0 COUNT=20 ./chrome-testing/run_gen.sh       # first 20 properties
#   ./chrome-testing/run_gen.sh --gallery-only         # just rebuild gallery from existing screenshots
#
# Idempotent: safe to re-run at any time.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

GEN_DIR="$SCRIPT_DIR/html/generated"
SCREENSHOTS_DIR="$SCRIPT_DIR/screenshots/generated"
GALLERY_DIR="$SCRIPT_DIR/gallery"
GALLERY="$GALLERY_DIR/gen_screenshots_gallery.html"
GEN_TEMPLATE_GALLERY="$GALLERY_DIR/gen_gallery.html"

# ── Generate HTML from EBNF grammar ─────────────────────────────────────────

if [[ "${1:-}" != "--gallery-only" ]]; then
  echo "=== Generating HTML from EBNF grammar ==="
  cd "$REPO_ROOT"

  ARGS=()
  [[ -n "${START:-}" ]] && ARGS+=(--start "$START")
  [[ -n "${COUNT:-}" ]] && ARGS+=(--count "$COUNT")

  go run ./chrome-testing/cmd/generate/ ${ARGS[@]+"${ARGS[@]}"}
  echo ""
fi

# ── Screenshot generated files ──────────────────────────────────────────────

if [[ "${1:-}" != "--gallery-only" ]]; then
  if [[ ! -d "$GEN_DIR" ]] || [[ -z "$(ls -A "$GEN_DIR"/*.html 2>/dev/null)" ]]; then
    echo "ERROR: No generated HTML files found in $GEN_DIR" >&2
    exit 1
  fi

  echo "=== Screenshotting generated HTML ==="
  mkdir -p "$SCREENSHOTS_DIR"
  "$SCRIPT_DIR/snap.sh" "$GEN_DIR/" "$SCREENSHOTS_DIR/"
  echo ""
fi

# ── Generate gallery page ──────────────────────────────────────────────────

mkdir -p "$GALLERY_DIR"

echo "=== Generating gen_screenshots_gallery.html ==="

cat > "$GALLERY" <<'GALLERY_HEAD'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CSS Properties — Generated from EBNF Grammar</title>
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
    }
    .card:hover {
      border-color: #666;
    }
    .card img {
      width: 100%;
      aspect-ratio: 16/10;
      object-fit: cover;
      object-position: top left;
      display: block;
      background: #222;
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
    @media (max-width: 1200px) { .grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 768px)  { .grid { grid-template-columns: repeat(2, 1fr); } }
  </style>
</head>
<body>
  <h1>CSS Properties — Generated from EBNF Grammar</h1>
GALLERY_HEAD

# Count screenshots
count=$(ls -1 "$SCREENSHOTS_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ')
echo "  <p class=\"subtitle\">${count} properties — values generated from parsed EBNF rules</p>" >> "$GALLERY"
echo '  <div class="grid">' >> "$GALLERY"

# Sort screenshots alphabetically and add cards
for png in $(ls -1 "$SCREENSHOTS_DIR"/*.png 2>/dev/null | sort); do
  filename="$(basename "$png")"
  slug="${filename%.png}"
  property="$slug"
  echo "    <div class=\"card\">" >> "$GALLERY"
  echo "      <img src=\"../screenshots/generated/$filename\" alt=\"$property\" loading=\"lazy\">" >> "$GALLERY"
  echo "      <div class=\"label\">$property</div>" >> "$GALLERY"
  echo "    </div>" >> "$GALLERY"
done

cat >> "$GALLERY" <<'GALLERY_TAIL'
  </div>
</body>
</html>
GALLERY_TAIL

echo "Screenshots gallery generated: $GALLERY ($count properties)"

# ── Generate template iframe gallery ────────────────────────────────────────

echo "=== Generating gen_gallery.html ==="

cat > "$GEN_TEMPLATE_GALLERY" <<'TGALLERY_HEAD'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CSS Properties — Generated from EBNF Grammar (Live)</title>
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
  <h1>CSS Properties — Generated from EBNF Grammar (Live)</h1>
TGALLERY_HEAD

tcount=$(ls -1 "$GEN_DIR"/*.html 2>/dev/null | wc -l | tr -d ' ')
echo "  <p class=\"subtitle\">${tcount} properties — values generated from parsed EBNF rules (live iframes)</p>" >> "$GEN_TEMPLATE_GALLERY"
echo '  <div class="grid">' >> "$GEN_TEMPLATE_GALLERY"

for html in $(ls -1 "$GEN_DIR"/*.html 2>/dev/null | sort); do
  filename="$(basename "$html")"
  slug="${filename%.html}"
  property="$slug"
  echo "    <div class=\"card\" onclick=\"openOverlay('../html/generated/$filename', '$property')\">" >> "$GEN_TEMPLATE_GALLERY"
  echo "      <iframe src=\"../html/generated/$filename\" loading=\"lazy\" sandbox=\"allow-same-origin allow-scripts\"></iframe>" >> "$GEN_TEMPLATE_GALLERY"
  echo "      <div class=\"label\">$property</div>" >> "$GEN_TEMPLATE_GALLERY"
  echo "    </div>" >> "$GEN_TEMPLATE_GALLERY"
done

cat >> "$GEN_TEMPLATE_GALLERY" <<'TGALLERY_TAIL'
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

echo "Template gallery generated: $GEN_TEMPLATE_GALLERY ($tcount properties)"
echo "Done."
