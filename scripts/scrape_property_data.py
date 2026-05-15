#!/usr/bin/env python3
"""
Scrape constituent-property sections from MDN for CSS shorthand properties,
cross-reference with formal-syntax data from properties.txt, and write JSON.

For each shorthand property, extracts:
  - constituent_properties : list from MDN #constituent_properties h2 section
  - formal_syntax_refs     : list of <'property'> refs parsed from properties.txt

Usage:
    python3 scripts/scrape_property_data.py \
        docs/syntax/properties.txt \
        docs/data/properties.json
"""

import sys
import re
import json
import time
import urllib.request
import urllib.error
from html.parser import HTMLParser

MDN_BASE = "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; proto-css-scraper/1.0; "
        "+https://github.com/accretional/proto-css)"
    )
}


# ── Parse properties.txt for formal-syntax constituent refs ──────────────────

def parse_formal_syntax_constituents(txt_path):
    """
    Return {property-name: [constituent-property, ...]} for every property
    whose formal syntax contains <'property-name'> references.
    """
    with open(txt_path) as f:
        content = f.read()

    entries = re.split(r'\n(?=[a-z][a-z0-9-]+ =\n)', content)
    shorthands = {}
    for entry in entries:
        lines = entry.strip().split('\n')
        if not lines:
            continue
        header = lines[0].strip()
        if not re.match(r'^[a-z][a-z0-9-]+ =$', header):
            continue
        prop_name = header[:-2].strip()
        body = '\n'.join(lines[1:])
        refs = re.findall(r"<'([a-z][a-z0-9-]+)'>", body)
        if refs:
            seen, unique = set(), []
            for r in refs:
                if r not in seen:
                    seen.add(r)
                    unique.append(r)
            shorthands[prop_name] = unique
    return shorthands


# ── HTML parser for MDN property pages ───────────────────────────────────────

class PropertyPageParser(HTMLParser):
    """Extract constituent_properties list from a MDN property page."""

    def __init__(self):
        super().__init__()
        self._section = None
        self._in_cp = False      # inside #constituent_properties section
        self._in_li = False
        self._in_code = False
        self._code_buf = []
        self.constituent_properties = []

    def handle_starttag(self, tag, attrs):
        attr = dict(attrs)
        sid = attr.get("id", "")

        if tag == "h2":
            self._in_cp = (sid == "constituent_properties")
            if sid and sid != "constituent_properties":
                self._in_cp = False
            return

        if self._in_cp:
            if tag == "li":
                self._in_li = True
            if tag == "code" and self._in_li:
                self._in_code = True
                self._code_buf = []

    def handle_endtag(self, tag):
        if self._in_cp:
            if tag == "code" and self._in_code:
                self._in_code = False
                name = "".join(self._code_buf).strip()
                if name and re.match(r'^[a-z][a-z0-9-]*$', name):
                    self.constituent_properties.append(name)
                self._code_buf = []
            if tag == "li":
                self._in_li = False

    def handle_data(self, data):
        if self._in_code:
            self._code_buf.append(data)

    def handle_entityref(self, name):
        ents = {"lt": "<", "gt": ">", "amp": "&", "quot": '"', "apos": "'", "nbsp": " "}
        if self._in_code:
            self._code_buf.append(ents.get(name, ""))

    def handle_charref(self, name):
        ch = chr(int(name[1:], 16) if name.startswith("x") else int(name))
        if self._in_code:
            self._code_buf.append(ch)


# ── HTTP helpers ──────────────────────────────────────────────────────────────

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


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 3:
        print(f"usage: {sys.argv[0]} <properties.txt> <output.json>", file=sys.stderr)
        sys.exit(1)

    txt_path  = sys.argv[1]
    json_path = sys.argv[2]

    formal = parse_formal_syntax_constituents(txt_path)
    print(f"found {len(formal)} shorthand properties in {txt_path}")

    data = {}

    for i, (prop, formal_refs) in enumerate(sorted(formal.items()), 1):
        url = f"{MDN_BASE}/{prop}"
        print(f"  [{i}/{len(formal)}] {prop} ...", end=" ", flush=True)

        try:
            html = fetch_html(url)
        except Exception as exc:
            print(f"ERROR ({exc})")
            data[prop] = {
                "url": url,
                "constituent_properties": None,
                "formal_syntax_refs": formal_refs,
                "error": str(exc),
            }
            continue

        if html is None:
            print("404")
            data[prop] = {
                "url": url,
                "constituent_properties": None,
                "formal_syntax_refs": formal_refs,
                "error": "404",
            }
            continue

        parser = PropertyPageParser()
        parser.feed(html)
        cp = parser.constituent_properties or None

        if cp:
            print(f"ok ({len(cp)} constituents: {cp})")
        else:
            print("no constituent_properties section")

        data[prop] = {
            "url": url,
            "constituent_properties": cp,
            "formal_syntax_refs": formal_refs,
        }

        time.sleep(0.4)

    import os
    os.makedirs(os.path.dirname(json_path), exist_ok=True)

    with open(json_path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    with_cp = sum(1 for v in data.values() if v.get("constituent_properties"))
    print(f"\nwrote {json_path}  ({len(data)} entries, {with_cp} with constituent_properties)")


if __name__ == "__main__":
    main()
