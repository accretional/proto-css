#!/usr/bin/env python3
"""
Fetch WebKit's CSSProperties.json and CSSValueKeywords.in, then:

1. Compare parser-grammar fields against our docs/syntax/properties.txt
   — writes temp/webkit_compare.json with match/mismatch/missing per property

2. Generate lang/keyword.ebnf from CSSValueKeywords.in
   — a flat enumeration of all CSS value keywords

Usage:
    python3 scripts/compare_webkit.py
"""

import json
import re
import time
import urllib.request
import urllib.error

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (compatible; proto-css-scraper/1.0; '
        '+https://github.com/accretional/proto-css)'
    )
}

WEBKIT_PROPERTIES_URL = (
    'https://raw.githubusercontent.com/WebKit/WebKit/main'
    '/Source/WebCore/css/CSSProperties.json'
)
WEBKIT_KEYWORDS_URL = (
    'https://raw.githubusercontent.com/WebKit/WebKit/main'
    '/Source/WebCore/css/CSSValueKeywords.in'
)


# ---------------------------------------------------------------------------
# Fetch
# ---------------------------------------------------------------------------

def fetch(url, retries=3, delay=3):
    req = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return resp.read().decode('utf-8', errors='replace')
        except Exception as exc:
            if attempt < retries - 1:
                time.sleep(delay)
            else:
                raise RuntimeError(f'Failed to fetch {url}: {exc}')


# ---------------------------------------------------------------------------
# Parse our properties.txt
# ---------------------------------------------------------------------------

def parse_our_properties(path):
    """Return dict of name -> normalised grammar string."""
    props = {}
    current_name = None
    current_lines = []

    def flush():
        if current_name:
            raw = ' '.join(current_lines)
            # strip the leading "name =" and normalise whitespace
            grammar = re.sub(r'\s+', ' ', raw).strip()
            props[current_name] = grammar

    with open(path) as f:
        for line in f:
            line = line.rstrip()
            if not line:
                flush()
                current_name = None
                current_lines = []
                continue
            if line.startswith('# '):
                continue
            # Top-level property: line like "accent-color ="
            # (no leading whitespace, no < prefix)
            if not line.startswith(' ') and not line.startswith('\t') and not line.startswith('<'):
                m = re.match(r'^([\w-]+)\s*=\s*(.*)', line)
                if m:
                    flush()
                    current_name = m.group(1)
                    current_lines = [m.group(2)] if m.group(2) else []
                    continue
            # Continuation or sub-rule line — append to current block
            if current_name is not None:
                current_lines.append(line.strip())

    flush()
    return props


# ---------------------------------------------------------------------------
# Parse WebKit CSSProperties.json
# ---------------------------------------------------------------------------

def parse_webkit_properties(raw_json):
    """Return dict of name -> parser-grammar string (or None if absent).

    Structure: data['properties'] is a dict keyed by property name.
    parser-grammar lives at data['properties'][name]['codegen-properties']['parser-grammar'].
    """
    data = json.loads(raw_json)
    props = {}
    for name, prop in data.get('properties', {}).items():
        codegen = prop.get('codegen-properties', {})
        # codegen-properties can be a dict or a list of dicts
        if isinstance(codegen, dict):
            codegen = [codegen]
        grammar = None
        for entry in codegen:
            g = entry.get('parser-grammar')
            if g is not None:
                grammar = g
                break
        if grammar is not None:
            props[name] = re.sub(r'\s+', ' ', str(grammar)).strip()
        else:
            props[name] = None
    return props


# ---------------------------------------------------------------------------
# Normalise a VDS/grammar string for loose comparison
# ---------------------------------------------------------------------------

def normalise(s):
    """Strip angle brackets from type refs, normalise whitespace/punctuation."""
    if not s:
        return ''
    s = re.sub(r'\s+', ' ', s).strip()
    # remove trailing semicolons
    s = s.rstrip(';').strip()
    return s


def grammars_match(ours, webkit):
    """Loose structural comparison — strips formatting differences."""
    return normalise(ours) == normalise(webkit)


# ---------------------------------------------------------------------------
# Parse CSSValueKeywords.in → list of keywords
# ---------------------------------------------------------------------------

def parse_keywords(raw):
    """Extract keyword identifiers from CSSValueKeywords.in.

    The file format is:
      - Lines starting with // are comments
      - Lines starting with # are preprocessor directives (skip)
      - Blank lines are separators
      - Everything else is a keyword name (possibly followed by whitespace/alias)
    """
    keywords = []
    seen = set()
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith('//') or line.startswith('#') or line.startswith('/*'):
            continue
        # Take the first token (keyword name); ignore alias or comment after it
        token = line.split()[0] if line.split() else ''
        if not token:
            continue
        # Must look like a CSS identifier
        if re.match(r'^-?[a-zA-Z][a-zA-Z0-9-]*$', token):
            if token not in seen:
                seen.add(token)
                keywords.append(token)
    return keywords


# ---------------------------------------------------------------------------
# Generate keyword.ebnf
# ---------------------------------------------------------------------------

def write_keyword_ebnf(keywords, path):
    """Write one named production per keyword: inherit = "inherit" ; """
    lines = [
        '(* CSS value keywords — generated from WebKit CSSValueKeywords.in *)',
        '(* Each keyword is its own named production so other EBNF files    *)',
        '(* can reference it by name rather than repeating the string.      *)',
        '',
    ]
    for kw in keywords:
        # EBNF identifiers can't start with a digit or contain hyphens;
        # map hyphens to underscores for the production name.
        ident = kw.replace('-', '_')
        lines.append(f'{ident} = "{kw}" ;')
    with open(path, 'w') as f:
        f.write('\n'.join(lines) + '\n')


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print('Fetching WebKit CSSProperties.json ...')
    raw_props = fetch(WEBKIT_PROPERTIES_URL)
    print(f'  {len(raw_props):,} bytes')

    print('Fetching WebKit CSSValueKeywords.in ...')
    raw_keywords = fetch(WEBKIT_KEYWORDS_URL)
    print(f'  {len(raw_keywords):,} bytes')

    print('Parsing our properties.txt ...')
    ours = parse_our_properties('docs/syntax/properties.txt')
    print(f'  {len(ours)} properties')

    print('Parsing WebKit properties ...')
    webkit = parse_webkit_properties(raw_props)
    webkit_with_grammar = {k: v for k, v in webkit.items() if v is not None}
    print(f'  {len(webkit)} total, {len(webkit_with_grammar)} with parser-grammar')

    # Compare
    results = []
    all_names = sorted(set(ours) | set(webkit_with_grammar))

    match_count = 0
    mismatch_count = 0
    only_ours = 0
    only_webkit = 0

    for name in all_names:
        our_g = ours.get(name)
        wk_g = webkit_with_grammar.get(name)

        if our_g and wk_g:
            matched = grammars_match(our_g, wk_g)
            status = 'match' if matched else 'mismatch'
            if matched:
                match_count += 1
            else:
                mismatch_count += 1
        elif our_g:
            status = 'only_ours'
            only_ours += 1
        else:
            status = 'only_webkit'
            only_webkit += 1

        results.append({
            'property': name,
            'status': status,
            'ours': our_g,
            'webkit': wk_g,
        })

    out_path = 'temp/webkit_compare.json'
    with open(out_path, 'w') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f'\nComparison written to {out_path}')
    print(f'  match:        {match_count}')
    print(f'  mismatch:     {mismatch_count}')
    print(f'  only ours:    {only_ours}')
    print(f'  only webkit:  {only_webkit}')

    # Keywords
    keywords = parse_keywords(raw_keywords)
    print(f'\nParsed {len(keywords)} keywords from CSSValueKeywords.in')

    kw_path = 'lang/keyword.ebnf'
    write_keyword_ebnf(keywords, kw_path)
    print(f'Wrote {kw_path}')


if __name__ == '__main__':
    main()
