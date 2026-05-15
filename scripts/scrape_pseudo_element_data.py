#!/usr/bin/env python3
"""
Scrape comprehensive data from MDN pseudo-element pages and write a JSON file.

For each pseudo-element, extracts:
  - syntax               : first CSS/plain <pre> block under #syntax h2
  - formal_syntax        : <pre class="css-formal-syntax"> under #formal_syntax h2
  - parameters           : text of the h3#parameters section (if present)
  - intro                : <p> text from the page intro (before the first landmark h2)
  - description          : <p> text from the dedicated #description h2 (if present)
  - allowable_properties : list of full <li> text strings from #allowable_properties

Usage:
    python3 scripts/scrape_pseudo_element_data.py \
        docs/syntax/pseudo-elements.txt \
        docs/data/pseudo-elements.json

Input:  existing pseudo-elements.txt (to harvest URLs)
Output: docs/data/pseudo-elements.json
"""

import sys
import re
import json
import time
import urllib.request
import urllib.error
from html.parser import HTMLParser


# ── HTML parser ───────────────────────────────────────────────────────────────

# h2 section IDs that mark the start of a new landmark
LANDMARK_H2 = {
    "try_it", "allowable_properties", "syntax", "formal_syntax",
    "description", "examples", "specifications", "browser_compatibility",
    "see_also", "accessibility",
}


class PseudoElementParser(HTMLParser):
    """
    Extract intro, description, allowable_properties, syntax, formal_syntax,
    and parameters from a single MDN pseudo-element page.
    """

    def __init__(self):
        super().__init__()

        # section tracking
        self._section = None          # current h2 landmark id
        self._past_first_h2 = False   # True once we've seen any landmark h2

        # intro: paragraphs before the first landmark h2
        self._in_intro_p = False
        self._intro_buf = []
        self.intro_parts = []

        # description: paragraphs inside the #description h2 section
        self._in_desc_p = False
        self._desc_buf = []
        self.description_parts = []

        # allowable_properties: full text of each <li>
        self._in_ap_section = False
        self._ap_in_li = False
        self._ap_li_buf = []
        self.allowable_properties = []  # list of strings (one per <li>)

        # syntax pre block
        self._in_pre = False
        self._pre_buf = []
        self.syntax_blocks = []

        # formal syntax
        self.formal_syntax = None

        # parameters (h3 immediately after #syntax)
        self._in_parameters = False
        self._params_buf = []
        self.parameters = None

    # ── tag handlers ──────────────────────────────────────────────────────────

    def handle_starttag(self, tag, attrs):
        attr = dict(attrs)
        cls = attr.get("class", "")
        sid = attr.get("id", "")

        # ── h2 landmarks ──
        if tag == "h2":
            if self._in_parameters:
                self._flush_parameters()
            self._in_intro_p = False
            self._in_desc_p = False
            if sid in LANDMARK_H2:
                self._past_first_h2 = True
                self._section = sid
                self._in_ap_section = (sid == "allowable_properties")
            else:
                self._section = None
                self._in_ap_section = False
            return

        # ── h3 landmarks ──
        if tag == "h3":
            if self._section == "syntax" and sid in ("parameters", "parameter"):
                self._in_parameters = True
                self._params_buf = []
            elif self._in_parameters:
                self._flush_parameters()
            return

        # ── intro paragraphs (before first landmark h2) ──
        if tag == "p" and not self._past_first_h2:
            self._in_intro_p = True
            self._intro_buf = []
            return

        # ── description section paragraphs ──
        if tag == "p" and self._section == "description":
            self._in_desc_p = True
            self._desc_buf = []
            return

        # ── allowable_properties: collect full <li> text ──
        if self._in_ap_section and tag == "li":
            self._ap_in_li = True
            self._ap_li_buf = []
            return

        # ── syntax / formal_syntax pre blocks ──
        if tag == "pre":
            if self._section == "syntax":
                if ("brush: css" in cls or "brush: plain" in cls) and "interactive-example" not in cls:
                    self._in_pre = True
                    self._pre_buf = []
            elif self._section == "formal_syntax":
                if "css-formal-syntax" in cls:
                    self._in_pre = True
                    self._pre_buf = []
            return

        if tag == "br":
            if self._in_pre:
                self._pre_buf.append("\n")
            if self._in_parameters:
                self._params_buf.append("\n")

    def handle_endtag(self, tag):
        # ── intro paragraph ──
        if tag == "p" and self._in_intro_p:
            self._in_intro_p = False
            text = "".join(self._intro_buf).strip()
            if text:
                self.intro_parts.append(text)
            self._intro_buf = []
            return

        # ── description paragraph ──
        if tag == "p" and self._in_desc_p:
            self._in_desc_p = False
            text = "".join(self._desc_buf).strip()
            if text:
                self.description_parts.append(text)
            self._desc_buf = []
            return

        # ── allowable_properties li ──
        if self._in_ap_section and tag == "li" and self._ap_in_li:
            self._ap_in_li = False
            text = " ".join("".join(self._ap_li_buf).split()).strip()
            if text:
                self.allowable_properties.append(text)
            self._ap_li_buf = []
            return

        # ── pre block ──
        if tag == "pre" and self._in_pre:
            self._in_pre = False
            text = "".join(self._pre_buf).strip()
            if text:
                if self._section == "syntax":
                    self.syntax_blocks.append(text)
                elif self._section == "formal_syntax":
                    self.formal_syntax = text

    def handle_data(self, data):
        if self._in_intro_p:
            self._intro_buf.append(data)
        if self._in_desc_p:
            self._desc_buf.append(data)
        if self._in_pre:
            self._pre_buf.append(data)
        if self._in_parameters:
            self._params_buf.append(data)
        if self._ap_in_li:
            self._ap_li_buf.append(data)

    def handle_entityref(self, name):
        ents = {"lt": "<", "gt": ">", "amp": "&", "quot": '"', "apos": "'", "nbsp": " "}
        ch = ents.get(name, "")
        self._dispatch_char(ch)

    def handle_charref(self, name):
        ch = chr(int(name[1:], 16) if name.startswith("x") else int(name))
        self._dispatch_char(ch)

    def _dispatch_char(self, ch):
        if self._in_intro_p:
            self._intro_buf.append(ch)
        if self._in_desc_p:
            self._desc_buf.append(ch)
        if self._in_pre:
            self._pre_buf.append(ch)
        if self._in_parameters:
            self._params_buf.append(ch)
        if self._ap_in_li:
            self._ap_li_buf.append(ch)

    def _flush_parameters(self):
        self._in_parameters = False
        raw = "".join(self._params_buf)
        raw = raw.replace("\r\n", "\n").replace("\r", "\n")
        lines = [l.strip() for l in raw.split("\n")]
        if lines and lines[0].lower() in ("parameters", "parameter"):
            lines = lines[1:]
        result = []
        prev_blank = True
        for l in lines:
            if not l:
                if not prev_blank:
                    result.append("")
                prev_blank = True
            else:
                result.append(l)
                prev_blank = False
        while result and not result[0]:
            result.pop(0)
        while result and not result[-1]:
            result.pop()
        if result:
            self.parameters = "\n".join(result)


# ── helpers ───────────────────────────────────────────────────────────────────

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; proto-css-scraper/1.0; "
        "+https://github.com/accretional/proto-css)"
    )
}


def fetch_html(url, retries=3, delay=2):
    req = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return resp.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if attempt < retries - 1:
                time.sleep(delay)
            else:
                raise
        except Exception:
            if attempt < retries - 1:
                time.sleep(delay)
            else:
                raise
    return None


def name_from_url(url):
    return url.rstrip("/").split("/")[-1]


def extract_urls_from_txt(path):
    """Read URLs from the pseudo-elements.txt file."""
    seen = set()
    urls = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("https://"):
                url = line.split()[0]
            elif line.startswith("# ") and " — https://" in line \
                    and not line.startswith("# Parameters") \
                    and not line.startswith("# Formal"):
                m = re.search(r"https://\S+", line)
                if not m:
                    continue
                url = m.group(0)
            else:
                continue
            if "#" in name_from_url(url):
                continue
            if url not in seen:
                seen.add(url)
                urls.append(url)
    return urls


def clean(text):
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [l.rstrip() for l in text.split("\n")]
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    return "\n".join(lines)


# Boilerplate paragraph patterns that MDN injects before the real intro text
_BOILERPLATE = re.compile(
    r'^(?:'
    r'This feature is (?:well established|not Baseline)[^\n]*'
    r"|It's been available across browsers[^\n]*"
    r'|Since \w+ \d{4}, this feature[^\n]*'
    r'|Experimental:[^\n]*'
    r'|Deprecated:[^\n]*'
    r'|\* Some parts of this feature[^\n]*'
    r'|Check the Browser compatibility[^\n]*'
    r'|This feature might not work in older[^\n]*'
    r')\n?', re.IGNORECASE
)


def clean_text(parts):
    """Join paragraphs, strip MDN nav boilerplate, collapse whitespace."""
    if not parts:
        return None
    joined = "\n\n".join(parts)

    # Cut at the known nav sentinel (only relevant for intro, harmless for desc)
    for sentinel in ("Get to know MDN better\n\n", "Discover our tools\n\n"):
        idx = joined.find(sentinel)
        if idx != -1:
            joined = joined[idx + len(sentinel):]
            break

    # Drop leading boilerplate paragraphs
    paragraphs = re.split(r'\n{2,}', joined)
    while paragraphs and _BOILERPLATE.match(paragraphs[0].strip()):
        paragraphs.pop(0)
    joined = "\n\n".join(paragraphs)

    joined = re.sub(r'[ \t]+', ' ', joined)
    joined = re.sub(r'\n{3,}', '\n\n', joined)
    return joined.strip() or None


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 3:
        print(f"usage: {sys.argv[0]} <pseudo-elements.txt> <output.json>", file=sys.stderr)
        sys.exit(1)

    txt_path  = sys.argv[1]
    json_path = sys.argv[2]

    urls = extract_urls_from_txt(txt_path)
    print(f"found {len(urls)} URLs in {txt_path}")

    data = {}

    for i, url in enumerate(urls, 1):
        name = name_from_url(url)
        print(f"  [{i}/{len(urls)}] {name} ...", end=" ", flush=True)

        try:
            html = fetch_html(url)
        except Exception as exc:
            print(f"ERROR ({exc})")
            data[name] = {"url": url, "error": str(exc)}
            continue

        if html is None:
            print("404")
            data[name] = {"url": url, "error": "404"}
            continue

        parser = PseudoElementParser()
        parser.feed(html)
        if parser._in_parameters:
            parser._flush_parameters()

        syntax  = clean(parser.syntax_blocks[0]) if parser.syntax_blocks else None
        formal  = clean(parser.formal_syntax)    if parser.formal_syntax  else None
        intro   = clean_text(parser.intro_parts)
        desc    = clean_text(parser.description_parts) if parser.description_parts else None
        params  = parser.parameters
        props   = parser.allowable_properties or None

        parts = []
        if syntax:  parts.append("syntax")
        if formal:  parts.append("formal")
        if intro:   parts.append("intro")
        if desc:    parts.append("desc")
        if params:  parts.append("params")
        if props:   parts.append(f"{len(props)} props")
        print(" + ".join(parts) if parts else "NO_DATA")

        data[name] = {
            "url":                  url,
            "syntax":               syntax,
            "formal_syntax":        formal,
            "intro":                intro,
            "description":          desc,
            "parameters":           params,
            "allowable_properties": props,
        }

        time.sleep(0.4)

    import os
    os.makedirs(os.path.dirname(json_path), exist_ok=True)

    with open(json_path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nwrote {json_path}  ({len(data)} entries)")


if __name__ == "__main__":
    main()
