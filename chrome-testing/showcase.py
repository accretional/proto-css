#!/usr/bin/env python3
"""showcase.py — regenerate the screenshot showcase block in README.md.

Reads the screenshots/ directory and, for a curated list of well-rendered
properties grouped by theme, emits an HTML gallery (thumbnail <img> grids) into
README.md between the <!-- SHOWCASE:START --> and <!-- SHOWCASE:END --> markers.

For each property it prefers an animated GIF (temporal props) and otherwise picks
a spread of distinct value PNGs. Run after ./shoot.sh (or ./LET_IT_RIP.sh):

    python3 chrome-testing/showcase.py
"""
import os
import re
import glob

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, "screenshots")
README = os.path.join(HERE, "README.md")
THUMB = 250  # px width of each thumbnail

# Curated themes → properties. Per property: how many stills to show (the script
# spreads picks across the value set), or "gif" to prefer the animation.
THEMES = [
    ("Colour & paint", [
        ("color", 2), ("background-color", 2), ("opacity", 2),
        ("accent-color", "gif"), ("caret-color", "gif"),
    ]),
    ("Backgrounds", [
        ("background-image", 2), ("background-size", 2), ("background-position", 2),
        ("background-repeat", 2), ("background-clip", 2), ("background-blend-mode", 2),
        ("background-attachment", 2),
    ]),
    ("Typography — axes, features, palettes", [
        ("font-variation-settings", 3), ("font-feature-settings", 3),
        ("font-variant-caps", 2), ("font-variant-numeric", 2), ("font-palette", 2),
        ("font-weight", 2), ("font-style", 2), ("font-stretch", 2),
        ("font-kerning", 2), ("font-size", 2), ("letter-spacing", 2),
        ("word-spacing", 2), ("line-height", 2),
    ]),
    ("Text styling", [
        ("text-align", 2), ("text-transform", 2), ("text-decoration-line", 2),
        ("text-decoration-style", 2), ("text-shadow", 2), ("text-indent", 2),
        ("text-overflow", 2), ("white-space", 2), ("text-emphasis-style", 2),
    ]),
    ("Writing mode & direction", [
        ("writing-mode", 2), ("text-orientation", 2), ("direction", 2),
        ("text-combine-upright", 2),
    ]),
    ("Lists", [
        ("list-style-type", 3), ("list-style-position", 2),
    ]),
    ("Box model & borders", [
        ("padding", 2), ("margin", 2), ("border-width", 2), ("border-style", 3),
        ("border-radius", 2), ("border-color", 2), ("outline", 2),
        ("box-shadow", 2), ("box-sizing", 2),
    ]),
    ("Sizing & object fit", [
        ("width", 2), ("height", 2), ("aspect-ratio", 2),
        ("object-fit", 3), ("object-position", 2),
    ]),
    ("Flexbox", [
        ("flex-direction", 2), ("justify-content", 3), ("align-items", 3),
        ("flex-wrap", 2), ("gap", 2), ("order", 2), ("align-self", 2),
    ]),
    ("Grid", [
        ("grid-template-columns", 2), ("grid-auto-flow", 2),
        ("justify-items", 2), ("place-items", 2), ("grid-column", 2),
    ]),
    ("Positioning & display", [
        ("position", 2), ("z-index", 2), ("float", 2), ("clear", 2),
        ("display", 3), ("visibility", 2), ("overflow", 2),
    ]),
    ("Tables", [
        ("border-collapse", 2), ("table-layout", 2),
        ("caption-side", 2), ("vertical-align", 3),
    ]),
    ("Transforms", [
        ("transform", 3), ("rotate", 2), ("scale", 2), ("translate", 2),
        ("transform-origin", 2), ("perspective", 2), ("transform-style", 2),
        ("backface-visibility", 2),
    ]),
    ("Filters, blending & effects", [
        ("filter", 3), ("backdrop-filter", 2), ("mix-blend-mode", 3),
        ("background-blend-mode", 2),
    ]),
    ("Masking & clipping", [
        ("mask-image", 3), ("mask-type", 2), ("mask-composite", 3),
        ("mask-mode", 2), ("clip-path", 3),
    ]),
    ("SVG paint", [
        ("fill", 2), ("stroke", 2), ("stroke-width", 2),
        ("stroke-dasharray", 2), ("stroke-linecap", 2), ("paint-order", 2),
    ]),
    ("Shapes & motion path", [
        ("shape-outside", 2), ("offset-path", 2), ("offset-rotate", 2),
    ]),
    ("Multi-column", [
        ("column-count", 2), ("column-gap", 2), ("column-rule", 2),
    ]),
    ("Animation & transition (animated)", [
        ("animation-timing-function", "gif"), ("animation-direction", "gif"),
        ("animation-iteration-count", "gif"), ("animation-name", "gif"),
        ("transition-timing-function", "gif"), ("transition-property", "gif"),
    ]),
    ("Interaction (animated / native)", [
        ("touch-action", "gif"), ("user-select", "gif"), ("appearance", 3),
        ("resize", "gif"), ("pointer-events", "gif"),
    ]),
    ("Fragmentation — printed to PDF", [
        ("break-before", 2), ("break-inside", 2), ("page-break-before", 2),
        ("orphans", 2), ("widows", 2),
    ]),
    ("Scrolling", [
        ("scroll-snap-type", "gif"), ("scroll-behavior", "gif"),
        ("overscroll-behavior", "gif"),
    ]),
]


def stills(prop):
    d = os.path.join(SHOTS, prop)
    if not os.path.isdir(d):
        return []
    return sorted(f for f in os.listdir(d) if f.endswith(".png"))


def gifs(prop):
    d = os.path.join(SHOTS, prop)
    if not os.path.isdir(d):
        return []
    return sorted(f for f in os.listdir(d) if f.endswith(".gif"))


def pick_spread(items, n):
    """Pick n items spread across the list, skipping a leading no-op baseline
    (normal/none/auto/visible) when there are enough alternatives."""
    if not items:
        return []
    baseline = re.compile(r"^\d+-(normal|none|auto|visible|static|start)\b")
    body = [x for x in items if not baseline.match(x)] or items
    if len(body) <= n:
        return body
    step = len(body) / n
    return [body[int(i * step)] for i in range(n)]


def img(prop, fname):
    rel = f"screenshots/{prop}/{fname}"
    return f'<img src="{rel}" width="{THUMB}" alt="{prop}">'


def render():
    out = []
    shown = 0
    for title, props in THEMES:
        cells = []
        for prop, spec in props:
            if spec == "gif":
                gs = gifs(prop)
                picks = pick_spread(gs, 2) if gs else pick_spread(stills(prop), 2)
            else:
                picks = pick_spread(stills(prop), spec)
            if not picks:
                continue
            imgs = "".join(img(prop, p) for p in picks)
            cells.append(f"<tr><td><code>{prop}</code></td><td>{imgs}</td></tr>")
            shown += 1
        if cells:
            out.append(f"\n### {title}\n")
            out.append("<table>")
            out.extend(cells)
            out.append("</table>")
    return "\n".join(out), shown


def main():
    block, shown = render()
    with open(README) as f:
        text = f.read()
    start, end = "<!-- SHOWCASE:START -->", "<!-- SHOWCASE:END -->"
    new = f"{start}\n*Auto-generated by `showcase.py` — {shown} properties below.*\n{block}\n{end}"
    if start in text and end in text:
        text = re.sub(re.escape(start) + r".*?" + re.escape(end), new, text, flags=re.S)
    else:
        text = text.rstrip() + "\n\n## Showcase\n\n" + new + "\n"
    with open(README, "w") as f:
        f.write(text)
    print(f"showcase.py: wrote {shown} properties into README.md")


if __name__ == "__main__":
    main()
