#!/usr/bin/env python3
"""
Scrape syntax from MDN pseudo-class and pseudo-element pages.

Extracts three sections from each page:
  - #syntax      — the first CSS/plain pre block (selector usage syntax)
  - #parameters  — the h3 section immediately after #syntax, if present
  - #formal_syntax — the css-formal-syntax pre block, if present

Usage:
    python3 scripts/scrape_pseudo.py pseudo-classes  docs/syntax/pseudo-classes.txt
    python3 scripts/scrape_pseudo.py pseudo-elements docs/syntax/pseudo-elements.txt

Output format (per entry):
    # :nth-child — https://...
    :nth-child([ <An+B> | even | odd ] [of <complex-selector-list>]?) { /* ... */ }
    # Parameters:
    # :nth-child() takes a single argument that describes a pattern for matching
    # element indices in a list of siblings. ...

Entries with no syntax found are written as:
    # NO_SYNTAX :name (reason) — https://...
"""

import sys
import re
import time
import urllib.request
import urllib.error
from html.parser import HTMLParser


# ---------------------------------------------------------------------------
# HTML parser
# ---------------------------------------------------------------------------

class PseudoSyntaxParser(HTMLParser):
    """
    Extract #syntax, #parameters, and #formal_syntax sections from an MDN page.

    #syntax section:     first <pre class="brush: css|plain ..."> that is not
                         an interactive example.
    #parameters section: the h3 with id="parameters" (or id="parameter"),
                         collected as plain text until the next h3/h2.
    #formal_syntax:      the <pre class="css-formal-syntax"> block.
    """

    def __init__(self):
        super().__init__()
        self._section = None      # 'syntax' | 'parameters' | 'formal_syntax' | None
        self._in_pre = False
        self._collecting_text = False
        self._buf = []
        self._text_buf = []
        self.syntax_blocks = []
        self.parameters = None
        self.formal_syntax = None

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        cls = attr_dict.get("class", "")
        section_id = attr_dict.get("id", "")

        # h2 landmarks
        if tag == "h2":
            if section_id == "syntax":
                self._section = "syntax"
            elif section_id == "formal_syntax":
                self._section = "formal_syntax"
            else:
                # Any new h2 ends parameter collection
                if self._section == "parameters" and self._collecting_text:
                    self._flush_parameters()
                self._section = None
            return

        # h3 landmarks
        if tag == "h3":
            if section_id in ("parameters", "parameter") and self._section == "syntax":
                self._section = "parameters"
                self._collecting_text = True
                self._text_buf = []
            elif self._section == "parameters":
                # Next h3 ends the parameters block
                self._flush_parameters()
                self._section = None
            return

        if tag == "br":
            if self._in_pre:
                self._buf.append("\n")
            if self._collecting_text:
                self._text_buf.append("\n")
            return

        if tag == "pre":
            if self._section == "syntax":
                if ("brush: css" in cls or "brush: plain" in cls) and "interactive-example" not in cls:
                    self._in_pre = True
                    self._buf = []
            elif self._section == "formal_syntax":
                if "css-formal-syntax" in cls:
                    self._in_pre = True
                    self._buf = []

    def handle_endtag(self, tag):
        if tag == "pre" and self._in_pre:
            self._in_pre = False
            text = "".join(self._buf).strip()
            if text:
                if self._section == "syntax":
                    self.syntax_blocks.append(text)
                elif self._section == "formal_syntax":
                    self.formal_syntax = text

    def handle_data(self, data):
        if self._in_pre:
            self._buf.append(data)
        elif self._collecting_text:
            self._text_buf.append(data)

    def handle_entityref(self, name):
        ents = {"lt": "<", "gt": ">", "amp": "&", "quot": '"', "apos": "'", "nbsp": " "}
        ch = ents.get(name, "")
        if self._in_pre:
            self._buf.append(ch)
        elif self._collecting_text:
            self._text_buf.append(ch)

    def handle_charref(self, name):
        ch = chr(int(name[1:], 16) if name.startswith("x") else int(name))
        if self._in_pre:
            self._buf.append(ch)
        elif self._collecting_text:
            self._text_buf.append(ch)

    def _flush_parameters(self):
        self._collecting_text = False
        raw = "".join(self._text_buf)
        raw = raw.replace("\r\n", "\n").replace("\r", "\n")
        lines = [l.strip() for l in raw.split("\n")]
        # Drop the literal "Parameters" heading line that MDN includes as text
        if lines and lines[0].lower() == "parameters":
            lines = lines[1:]
        # Collapse multiple blank lines, strip leading/trailing blanks
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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

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
    """
    Extract URLs from an existing syntax txt file. Reads:
      - bare https:// lines
      - # NO_SYNTAX name (note) — https://... lines
      - # name — https://... entry header lines
    Returns deduplicated list, skipping fragment URLs.
    """
    seen = set()
    urls = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("https://"):
                url = line.split()[0]
            elif line.startswith("# ") and " — https://" in line and not line.startswith("# Parameters") and not line.startswith("# Formal"):
                # "# NO_SYNTAX ..." or "# name — url" entry headers
                m = re.search(r"https://\S+", line)
                if not m:
                    continue
                url = m.group(0)
            else:
                continue
            name = name_from_url(url)
            if "#" in name:
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


def as_comment(text):
    """Prefix every line with '# '."""
    return "\n".join(f"# {l}" if l else "#" for l in text.split("\n"))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) < 3:
        print(f"usage: {sys.argv[0]} <category> <output.txt>", file=sys.stderr)
        sys.exit(1)

    out_path = sys.argv[2]
    urls = extract_urls_from_txt(out_path)
    print(f"found {len(urls)} unique URLs in {out_path}")

    results = []  # (name, syntax|None, parameters|None, formal|None, url, note)

    for i, url in enumerate(urls, 1):
        name = name_from_url(url)
        print(f"  [{i}/{len(urls)}] {name} ...", end=" ", flush=True)

        try:
            html = fetch_html(url)
        except Exception as exc:
            print(f"ERROR ({exc})")
            results.append((name, None, None, None, url, f"fetch error: {exc}"))
            continue

        if html is None:
            print("404")
            results.append((name, None, None, None, url, "404"))
            continue

        parser = PseudoSyntaxParser()
        parser.feed(html)
        # Flush parameters if page ended while still collecting
        if parser._collecting_text:
            parser._flush_parameters()

        syntax = clean(parser.syntax_blocks[0]) if parser.syntax_blocks else None
        params = parser.parameters
        formal = clean(parser.formal_syntax) if parser.formal_syntax else None

        parts = []
        if syntax:
            parts.append(f"syntax({len(syntax)}ch)")
        if params:
            parts.append("params")
        if formal:
            parts.append("formal")
        print("ok " + " + ".join(parts) if parts else "NO_SYNTAX")

        results.append((name, syntax, params, formal, url,
                        None if (syntax or formal) else "no syntax block found"))

        time.sleep(0.4)

    ok = [r for r in results if r[1] or r[3]]
    missing = [r for r in results if not r[1] and not r[3]]

    with open(out_path, "w") as f:
        for j, (name, syntax, params, formal, url, _) in enumerate(ok):
            if j > 0:
                f.write("\n")
            f.write(f"# {name} — {url}\n")
            if syntax:
                f.write(f"{syntax}\n")
            if params:
                f.write(f"\n# Parameters:\n{as_comment(params)}\n")
            if formal:
                f.write(f"\n# Formal syntax:\n{formal}\n")

        if missing:
            if ok:
                f.write("\n")
            for name, _, __, ___, url, note in missing:
                f.write(f"# NO_SYNTAX {name} ({note}) — {url}\n")

    print(f"\nwrote {out_path}")
    print(f"  {len(ok)} with syntax, {len(missing)} missing")
    if missing:
        print("  missing:")
        for name, _, __, ___, url, note in missing:
            print(f"    {name}: {note}")


if __name__ == "__main__":
    main()
