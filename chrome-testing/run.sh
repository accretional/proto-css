#!/usr/bin/env bash
# run.sh — Screenshot all CSS property templates and generate the gallery page.
#
# Usage:
#   ./run.sh                    # screenshot all templates + build gallery
#   ./run.sh --gallery-only     # just regenerate gallery.html from existing screenshots

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/templates"
SCREENSHOTS_DIR="$SCRIPT_DIR/screenshots"
GALLERY="$SCRIPT_DIR/gallery.html"

if [[ ! -d "$TEMPLATES_DIR" ]]; then
  echo "ERROR: templates/ directory not found." >&2
  exit 1
fi

# ── Screenshot all templates ─────────────────────────────────────────────────

if [[ "${1:-}" != "--gallery-only" ]]; then
  echo "=== Screenshotting all CSS property templates ==="
  mkdir -p "$SCREENSHOTS_DIR"
  "$SCRIPT_DIR/snap.sh" "$TEMPLATES_DIR/" "$SCREENSHOTS_DIR/"
  echo ""
fi

# ── Generate gallery page ────────────────────────────────────────────────────

echo "=== Generating gallery.html ==="

cat > "$GALLERY" <<'GALLERY_HEAD'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CSS Properties Visual Reference</title>
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
  <h1>CSS Properties Visual Reference</h1>
GALLERY_HEAD

# Count screenshots
count=$(ls -1 "$SCREENSHOTS_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ')
echo "  <p class=\"subtitle\">${count} properties</p>" >> "$GALLERY"
echo '  <div class="grid">' >> "$GALLERY"

# Sort screenshots alphabetically and add cards
for png in $(ls -1 "$SCREENSHOTS_DIR"/*.png 2>/dev/null | sort); do
  filename="$(basename "$png")"
  slug="${filename%.png}"
  # Convert slug to CSS property name (already kebab-case)
  property="$slug"
  echo "    <div class=\"card\">" >> "$GALLERY"
  echo "      <img src=\"screenshots/$filename\" alt=\"$property\" loading=\"lazy\">" >> "$GALLERY"
  echo "      <div class=\"label\">$property</div>" >> "$GALLERY"
  echo "    </div>" >> "$GALLERY"
done

cat >> "$GALLERY" <<'GALLERY_TAIL'
  </div>
</body>
</html>
GALLERY_TAIL

echo "Gallery generated: $GALLERY ($count properties)"
echo "Done."
