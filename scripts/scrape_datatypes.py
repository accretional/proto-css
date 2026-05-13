#!/usr/bin/env python3
"""
Scrape missing datatype pages from MDN.

Reads the ## datatypes section of temp/todo-syntax.md, fetches each URL,
extracts all content under div.layout__body.reference-layout__body, and
writes temp/datatypes.json with one entry per type:

  {
    "type": "<name>",
    "url": "https://...",
    "sections": [
      { "id": "syntax", "heading": "Syntax", "level": 2, "text": "..." },
      ...
    ]
  }
"""

import json
import re
import sys
import time
import urllib.request
import urllib.error
from html.parser import HTMLParser


# ---------------------------------------------------------------------------
# HTML parser
# ---------------------------------------------------------------------------

class PageParser(HTMLParser):
    """Extract sections from div.layout__body.reference-layout__body."""

    def __init__(self):
        super().__init__()
        # State
        self._in_body = False
        self._body_depth = 0          # div nesting depth inside body div

        self._in_section = False
        self._section_depth = 0       # element depth inside current section
        self._current_section = None  # {"id": ..., "heading": ..., "level": ..., "text": ...}
        self._in_heading = False
        self._heading_level = 0

        self._buf = []                # text buffer for current section
        self._heading_buf = []        # text buffer for current heading

        self.sections = []

    # -- helpers --

    def _flush_section(self):
        if self._current_section is not None:
            text = re.sub(r'\n{3,}', '\n\n', ''.join(self._buf)).strip()
            self._current_section['text'] = text
            self.sections.append(self._current_section)
        self._current_section = None
        self._buf = []

    # -- tag handlers --

    def handle_starttag(self, tag, attrs):
        attr = dict(attrs)
        classes = attr.get('class', '')

        # Detect entry into the body div
        if not self._in_body:
            if tag == 'div' and 'layout__body' in classes and 'reference-layout__body' in classes:
                self._in_body = True
                self._body_depth = 1
            return

        # Track body div nesting so we know when we've left it
        if tag == 'div':
            self._body_depth += 1

        # Detect a new content-section
        if tag == 'section' and 'content-section' in classes:
            self._flush_section()
            self._in_section = True
            self._section_depth = 1
            self._current_section = {
                'id': attr.get('aria-labelledby', ''),
                'heading': '',
                'level': 2,
                'text': '',
            }
            return

        if not self._in_section:
            return

        # Track section nesting depth
        if tag in ('section', 'div', 'article'):
            self._section_depth += 1

        # Detect headings
        if tag in ('h1', 'h2', 'h3', 'h4') and self._current_section:
            heading_id = attr.get('id', '')
            if heading_id == self._current_section['id'] or not self._current_section['heading']:
                self._in_heading = True
                self._heading_level = int(tag[1])
                self._current_section['level'] = self._heading_level
                self._heading_buf = []

        # Newline hints for block elements
        if tag in ('p', 'li', 'dt', 'dd', 'h1', 'h2', 'h3', 'h4', 'h5', 'tr'):
            self._buf.append('\n')
        if tag == 'br':
            self._buf.append('\n')

    def handle_endtag(self, tag):
        if not self._in_body:
            return

        if tag == 'div':
            self._body_depth -= 1
            if self._body_depth == 0:
                self._flush_section()
                self._in_body = False
                return

        if not self._in_section:
            return

        if tag in ('h1', 'h2', 'h3', 'h4') and self._in_heading:
            self._in_heading = False
            heading_text = ''.join(self._heading_buf).strip()
            if not self._current_section['heading']:
                self._current_section['heading'] = heading_text

        if tag == 'section':
            self._section_depth -= 1
            if self._section_depth == 0:
                self._in_section = False
                self._flush_section()

        if tag in ('p', 'li', 'dt', 'dd', 'h1', 'h2', 'h3', 'h4', 'h5', 'tr'):
            self._buf.append('\n')

    def handle_data(self, data):
        if self._in_heading:
            self._heading_buf.append(data)
        if self._in_section:
            self._buf.append(data)

    def handle_entityref(self, name):
        entities = {'lt': '<', 'gt': '>', 'amp': '&', 'quot': '"', 'apos': "'",
                    'nbsp': ' ', 'ndash': '–', 'mdash': '—', 'times': '×'}
        ch = entities.get(name, '')
        if self._in_heading:
            self._heading_buf.append(ch)
        if self._in_section:
            self._buf.append(ch)

    def handle_charref(self, name):
        try:
            ch = chr(int(name[1:], 16) if name.startswith('x') else int(name))
        except ValueError:
            ch = ''
        if self._in_heading:
            self._heading_buf.append(ch)
        if self._in_section:
            self._buf.append(ch)


# ---------------------------------------------------------------------------
# URL / name extraction from todo-syntax.md
# ---------------------------------------------------------------------------

def parse_todo(md_path):
    """Return list of (name, url) from the ## datatypes section."""
    entries = []
    in_datatypes = False
    with open(md_path) as f:
        for line in f:
            line = line.rstrip()
            if line.startswith('## '):
                in_datatypes = line.strip() == '## datatypes'
                continue
            if not in_datatypes:
                continue
            # Lines like: - [ ] name — url
            m = re.match(r'-\s*\[[ x]\]\s+(.+?)\s+—\s+(https?://\S+)', line)
            if m:
                name, url = m.group(1).strip(), m.group(2).strip()
                entries.append((name, url))
    return entries


# ---------------------------------------------------------------------------
# Fetch
# ---------------------------------------------------------------------------

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (compatible; proto-css-scraper/1.0; '
        '+https://github.com/accretional/proto-css)'
    )
}

def fetch_html(url, retries=3, delay=2):
    req = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return resp.read().decode('utf-8', errors='replace')
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


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    md_path = 'temp/todo-syntax.md'
    out_path = 'temp/datatypes.json'

    entries = parse_todo(md_path)
    print(f'Found {len(entries)} datatype entries to scrape')

    results = []

    for i, (name, url) in enumerate(entries, 1):
        print(f'  [{i}/{len(entries)}] {name} ...', end=' ', flush=True)

        try:
            html = fetch_html(url)
        except Exception as exc:
            print(f'ERROR ({exc})')
            results.append({'type': name, 'url': url, 'error': str(exc), 'sections': []})
            continue

        if html is None:
            print('404')
            results.append({'type': name, 'url': url, 'error': '404', 'sections': []})
            continue

        parser = PageParser()
        parser.feed(html)

        if parser.sections:
            print(f'ok ({len(parser.sections)} sections)')
        else:
            print('no sections found')

        results.append({
            'type': name,
            'url': url,
            'sections': parser.sections,
        })

        time.sleep(0.3)

    with open(out_path, 'w') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f'\nWrote {out_path}')
    ok = sum(1 for r in results if r['sections'])
    print(f'  {ok} with sections, {len(results) - ok} empty')


if __name__ == '__main__':
    main()
