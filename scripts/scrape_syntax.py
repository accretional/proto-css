#!/usr/bin/env python3
"""
Scrape formal syntax from MDN pages.

Usage:
    python3 scripts/scrape_syntax.py <reference-md-file> <output-txt-file>

Example:
    python3 scripts/scrape_syntax.py \
        docs/reference/mdnproperties-reference.md \
        docs/syntax/properties.txt

Reads URLs from the reference markdown file, fetches each MDN page,
extracts the <pre><code class="language-css"> block that follows
<h2 id="formal_syntax">, and writes:

    <name>: <syntax, whitespace-collapsed to one line>

Missing-syntax entries are written as:

    # NO_SYNTAX <name> (<url>)
"""

import sys
import re
import time
import urllib.request
import urllib.error
from html.parser import HTMLParser


# --- HTML parser -----------------------------------------------------------

class FormalSyntaxParser(HTMLParser):
    """Extract the formal syntax block from an MDN CSS reference page.

    MDN renders the formal syntax as:
        <h2 id="formal_syntax">...</h2>
        <pre class="notranslate css-formal-syntax">
            <span ...>property = </span>
            <br>
            <a href="..."><span ...>&lt;value&gt;</span></a>
            ...
        </pre>

    We look for the <pre class="css-formal-syntax"> that follows the h2,
    collect all text content (span text + entity decoding), and normalise.
    """

    def __init__(self):
        super().__init__()
        self._in_formal_syntax_section = False
        self._in_pre = False
        self._found = False
        self._buf = []
        self.syntax = None

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)

        if tag == "h2" and attr_dict.get("id") == "formal_syntax":
            self._in_formal_syntax_section = True
            return

        if not self._in_formal_syntax_section or self._found:
            return

        # Another section started before we found the <pre> — give up
        if tag == "h2":
            self._in_formal_syntax_section = False
            return

        if tag == "pre":
            classes = attr_dict.get("class", "")
            if "css-formal-syntax" in classes:
                self._in_pre = True
                self._buf = []

    def handle_endtag(self, tag):
        if tag == "pre" and self._in_pre:
            self._in_pre = False
            self._found = True
            self._in_formal_syntax_section = False
            self.syntax = "".join(self._buf)

    def handle_data(self, data):
        if self._in_pre:
            self._buf.append(data)

    def handle_entityref(self, name):
        entities = {"lt": "<", "gt": ">", "amp": "&", "quot": '"', "apos": "'"}
        if self._in_pre:
            self._buf.append(entities.get(name, f"&{name};"))

    def handle_charref(self, name):
        if self._in_pre:
            if name.startswith("x"):
                char = chr(int(name[1:], 16))
            else:
                char = chr(int(name))
            self._buf.append(char)


# --- URL extraction --------------------------------------------------------

def extract_urls(md_path):
    """Return deduplicated list of URLs from the reference markdown file."""
    seen = set()
    urls = []
    with open(md_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("https://"):
                url = line.split()[0]   # ignore anything after whitespace
                if url not in seen:
                    seen.add(url)
                    urls.append(url)
    return urls


# --- Name extraction -------------------------------------------------------

def name_from_url(url):
    """Last path segment of the URL, lowercased."""
    return url.rstrip("/").split("/")[-1]


# --- Syntax normalisation --------------------------------------------------

def normalise(raw):
    """Collapse runs of whitespace to single spaces, strip outer whitespace."""
    return re.sub(r"\s+", " ", raw).strip()


# --- Fetch with retry ------------------------------------------------------

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
                return None     # definitive miss
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


# --- Main ------------------------------------------------------------------

def main():
    if len(sys.argv) != 3:
        print(f"usage: {sys.argv[0]} <reference.md> <output.txt>", file=sys.stderr)
        sys.exit(1)

    md_path, out_path = sys.argv[1], sys.argv[2]
    urls = extract_urls(md_path)
    print(f"found {len(urls)} unique URLs in {md_path}")

    results = []        # (name, syntax_or_None, url, note)

    for i, url in enumerate(urls, 1):
        name = name_from_url(url)
        print(f"  [{i}/{len(urls)}] {name} ...", end=" ", flush=True)

        try:
            html = fetch_html(url)
        except Exception as exc:
            print(f"ERROR ({exc})")
            results.append((name, None, url, f"fetch error: {exc}"))
            continue

        if html is None:
            print("404")
            results.append((name, None, url, "404"))
            continue

        parser = FormalSyntaxParser()
        parser.feed(html)

        if parser.syntax:
            syntax = normalise(parser.syntax)
            print(f"ok ({len(syntax)} chars)")
            results.append((name, syntax, url, None))
        else:
            print("NO_SYNTAX")
            results.append((name, None, url, "no formal_syntax block found"))

        # polite delay — avoid hammering MDN
        time.sleep(0.3)

    # Write output
    with open(out_path, "w") as f:
        ok = [r for r in results if r[1]]
        missing = [r for r in results if not r[1]]

        for name, syntax, url, _ in ok:
            f.write(f"{name}: {syntax}\n")

        if missing:
            f.write("\n")
            for name, _, url, note in missing:
                f.write(f"# NO_SYNTAX {name} ({note}) — {url}\n")

    print(f"\nwrote {out_path}")
    print(f"  {len(ok)} with syntax, {len(missing)} missing")
    if missing:
        print("  missing:")
        for name, _, url, note in missing:
            print(f"    {name}: {note}")


if __name__ == "__main__":
    main()
