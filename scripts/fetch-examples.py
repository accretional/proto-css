#!/usr/bin/env python3
"""
fetch-examples.py

Reads each docs/reference/*.md file, picks a random sample of MDN URLs,
fetches the page, extracts CSS code blocks from the Examples section, and
writes them as .css files under lang/testdata/.

Usage:
    python3 scripts/fetch-examples.py [--count N] [--seed S] [--out DIR]

Options:
    --count N   URLs to sample per reference file (default: 5)
    --seed  S   Random seed for reproducibility (default: 42)
    --out   DIR Output directory (default: lang/testdata)
"""

import os
import re
import sys
import time
import random
import argparse
import urllib.request
import urllib.error
from html.parser import HTMLParser
from pathlib import Path


# ── Argument parsing ──────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--count", type=int, default=5, metavar="N",
                   help="URLs to sample per reference file (default: 5)")
    p.add_argument("--seed",  type=int, default=42, metavar="S",
                   help="Random seed (default: 42)")
    p.add_argument("--out",   default="lang/testdata", metavar="DIR",
                   help="Output directory (default: lang/testdata)")
    return p.parse_args()


# ── URL extraction ─────────────────────────────────────────────────────────────

MDN_PATTERN = re.compile(r'https://developer\.mozilla\.org/[^\s`\)\"\']+')

def extract_mdn_urls(md_text: str) -> list[str]:
    """Return all MDN URLs found in a markdown file."""
    urls = MDN_PATTERN.findall(md_text)
    # Strip trailing punctuation that may have been captured.
    cleaned = []
    for u in urls:
        u = u.rstrip(".,;)'\"")
        # Skip anchor-only fragments; keep full page URLs.
        if u not in cleaned:
            cleaned.append(u)
    return cleaned


# ── MDN CSS extraction ─────────────────────────────────────────────────────────

# MDN's structure: id="examples" appears on the <h2> heading.
# CSS blocks appear anywhere on the page as:
#   <pre class="brush: css ..."><code>...</code></pre>
# We collect all CSS blocks that appear after the examples h2 and before
# the next same-level h2 (identified by a bare <h2 not containing "examples").

_EXAMPLES_H2 = re.compile(r'id=["\']examples["\']', re.IGNORECASE)
_NEXT_H2     = re.compile(r'<h2[\s>]', re.IGNORECASE)
_CSS_BLOCK   = re.compile(
    r'<pre[^>]*class=["\'][^"\']*brush:\s*css[^"\']*["\'][^>]*>'   # <pre class="brush: css ...">
    r'\s*<code[^>]*>(.*?)</code>\s*</pre>',                         # <code>...</code></pre>
    re.DOTALL | re.IGNORECASE,
)
_HTML_ENTITY = re.compile(r'&([a-zA-Z]+);|&#(\d+);|&#x([0-9a-fA-F]+);')


def _decode_entities(s: str) -> str:
    NAMED = {"lt": "<", "gt": ">", "amp": "&", "quot": '"', "apos": "'",
             "nbsp": " ", "copy": "©", "mdash": "—", "ndash": "–"}
    def replace(m):
        name, dec, hexn = m.group(1), m.group(2), m.group(3)
        if name:
            return NAMED.get(name.lower(), m.group(0))
        try:
            return chr(int(hexn, 16) if hexn else int(dec))
        except (ValueError, OverflowError):
            return m.group(0)
    return _HTML_ENTITY.sub(replace, s)


def extract_css_from_mdn(html: str) -> list[str]:
    """
    Return CSS blocks found in the 'Examples' section of an MDN page.
    Returns an empty list if the page has no Examples section.

    MDN structure:
      <section aria-labelledby="examples"><h2 id="examples">…</h2></section>
      <section aria-labelledby="example-name"><h3>…</h3>  ← actual code here
      …more example sub-sections…
      <section aria-labelledby="specifications"><h2 id="specifications">…</h2></section>

    The h2#examples tag itself comes BEFORE the code; the first <h2 found
    after id="examples" belongs to the *next* top-level section (Specifications),
    so we slice up to that point.
    """
    m = _EXAMPLES_H2.search(html)
    if not m:
        return []

    section_html = html[m.start():]
    # The first <h2 we encounter is the start of the next top-level section.
    h2s = list(_NEXT_H2.finditer(section_html))
    end = len(section_html)
    if h2s:
        end = h2s[0].start()
    section_html = section_html[:end]

    blocks = []
    for match in _CSS_BLOCK.finditer(section_html):
        code = _decode_entities(match.group(1)).strip()
        if code:
            blocks.append(code)
    return blocks


# ── CSS block post-processing ──────────────────────────────────────────────────

# A block is a "bare value" (no selector) if it looks like a single
# declaration: "property: value" with no { } braces.
BARE_DECL_RE = re.compile(r'^[\w-]+\s*:')

def wrap_if_bare(css: str) -> str:
    """
    If the CSS block has no braces (it's a bare declaration or value),
    wrap it in a minimal rule so the grammar's css_style_sheet rule can
    parse it as a complete stylesheet.
    """
    stripped = css.strip()
    if "{" not in stripped and "}" not in stripped:
        if BARE_DECL_RE.match(stripped):
            # Single declaration → wrap in a selector block.
            return f".example {{\n  {stripped}\n}}"
        # Otherwise it's probably just a value snippet — skip it.
        return ""
    return stripped


def is_useful(css: str) -> bool:
    """Reject empty blocks or blocks that only contain comments."""
    code = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL).strip()
    return len(code) > 10


# ── HTTP fetch ────────────────────────────────────────────────────────────────

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}

def fetch_url(url: str) -> str | None:
    """Fetch a URL and return its HTML body, or None on error."""
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            charset = "utf-8"
            ct = resp.headers.get_content_charset()
            if ct:
                charset = ct
            return resp.read().decode(charset, errors="replace")
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {url}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"  Error fetching {url}: {e}", file=sys.stderr)
        return None


# ── Slug generation ───────────────────────────────────────────────────────────

def url_to_slug(url: str) -> str:
    """Turn an MDN URL into a safe filename stem (last path segment only)."""
    path = re.sub(r'^https?://[^/]+', '', url)
    parts = [p for p in path.split("/") if p]
    slug = parts[-1] if parts else "unknown"
    slug = re.sub(r'[^a-zA-Z0-9_-]', '_', slug)
    return slug[:80]


def ref_to_subfolder(md_filename: str) -> str:
    """Derive a subfolder name from a reference markdown filename.

    E.g. 'mdnproperties-reference.md' → 'mdnproperties'
         'pseudo-classes-reference.md' → 'pseudo-classes'
    """
    name = re.sub(r'-?reference\.md$', '', md_filename, flags=re.IGNORECASE)
    return name or "misc"


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    args = parse_args()
    random.seed(args.seed)

    # Find the project root (parent of scripts/).
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    ref_dir = project_root / "docs" / "reference"
    out_dir = project_root / args.out

    out_dir.mkdir(parents=True, exist_ok=True)

    md_files = sorted(ref_dir.glob("*.md"))
    if not md_files:
        print(f"No .md files found in {ref_dir}", file=sys.stderr)
        sys.exit(1)

    total_saved = 0
    total_checked = 0

    for md_file in md_files:
        text = md_file.read_text(encoding="utf-8")
        urls = extract_mdn_urls(text)
        if not urls:
            continue

        subfolder = ref_to_subfolder(md_file.name)
        sub_dir = out_dir / subfolder
        sub_dir.mkdir(parents=True, exist_ok=True)

        sample = random.sample(urls, min(args.count, len(urls)))
        print(f"\n── {md_file.name}  ({len(urls)} URLs, sampling {len(sample)}) ──")
        print(f"   → {sub_dir}")

        for url in sample:
            total_checked += 1
            print(f"  fetch  {url}")
            html = fetch_url(url)
            if html is None:
                continue

            blocks = extract_css_from_mdn(html)
            if not blocks:
                print(f"    no CSS examples found")
                continue

            slug = url_to_slug(url)
            saved = 0
            for i, block in enumerate(blocks):
                css = wrap_if_bare(block)
                if not css or not is_useful(css):
                    continue

                suffix = f"_{i}" if i > 0 else ""
                filename = f"{slug}{suffix}.css"
                out_path = sub_dir / filename

                out_path.write_text(css + "\n", encoding="utf-8")
                print(f"    saved  {subfolder}/{filename}  ({len(css)} bytes)")
                saved += 1
                total_saved += 1

            if saved == 0:
                print(f"    no usable CSS examples found")

            # Be polite to MDN servers.
            time.sleep(0.5)

    print(f"\n── Done: {total_saved} files saved from {total_checked} URLs ──")


if __name__ == "__main__":
    main()
