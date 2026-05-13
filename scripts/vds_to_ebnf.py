#!/usr/bin/env python3
"""
Convert CSS Value Definition Syntax files to gluon EBNF.

Usage:
    # Single file
    python3 scripts/vds_to_ebnf.py docs/syntax/properties.txt lang/properties.ebnf

    # All files at once
    python3 scripts/vds_to_ebnf.py --all

CSS VDS operators and their EBNF approximations:
    a | b       → a | b          (exact)
    a || b      → a | b          (approx: any-order semantics lost)
    a && b      → a , b          (approx: order-independence lost)
    a b         → a , b          (exact: juxtaposition = concatenation)
    a , b       → a , "," , b    (exact: literal comma in CSS output)
    a /  b      → a , "/" , b    (exact: literal slash)
    a?          → [ a ]          (exact)
    a*          → { a }          (exact)
    a+          → a , { a }      (exact)
    a#          → a , { "," , a } (exact: comma-separated list)
    a{n,m}      → { a }          (approx: count bounds lost)
    [ a ]       → ( a )          (exact: CSS VDS group → EBNF group)
    <type>      → type            (nonterminal reference)
    <type [r]>  → type            (range qualifier stripped)
    <'prop'>    → prop_value      (property value reference)
    keyword     → "keyword"       (terminal string)
    func(args)  → "func(" , args , ")"  (literal function call)
"""

import re
import sys
import os
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

# ── Token types ────────────────────────────────────────────────────────────────

@dataclass
class Tok:
    kind: str   # TYPE_REF PROP_REF WORD NUM STRING
                # LGROUP RGROUP LPAREN RPAREN
                # PIPE DPIPE DAMP COMMA SLASH
                # MULT REPEAT BANG WS EOF
    value: str

_EOF = Tok('EOF', '')


# ── Tokenizer ─────────────────────────────────────────────────────────────────

def tokenize(s: str) -> List[Tok]:
    tokens: List[Tok] = []
    i, n = 0, len(s)

    while i < n:
        c = s[i]

        # whitespace
        if c.isspace():
            if tokens and tokens[-1].kind != 'WS':
                tokens.append(Tok('WS', ' '))
            while i < n and s[i].isspace():
                i += 1
            continue

        # type reference  <name>  or  <name [range]>  or  <'prop'>
        if c == '<':
            j = i + 1
            depth = 1
            while j < n and depth:
                if s[j] == '<':
                    depth += 1
                elif s[j] == '>':
                    depth -= 1
                j += 1
            inner = s[i+1:j-1]
            if inner.startswith("'") and inner.endswith("'"):
                tokens.append(Tok('PROP_REF', inner[1:-1]))
            else:
                # strip range qualifier like " [0,∞]"
                name = re.split(r'\s*\[', inner)[0].strip()
                tokens.append(Tok('TYPE_REF', name))
            i = j
            continue

        # CSS VDS grouping brackets
        if c == '[':
            tokens.append(Tok('LGROUP', '['))
            i += 1
            continue
        if c == ']':
            tokens.append(Tok('RGROUP', ']'))
            i += 1
            continue

        # two-char operators first
        two = s[i:i+2]
        if two == '||':
            tokens.append(Tok('DPIPE', '||'))
            i += 2
            continue
        if two == '&&':
            tokens.append(Tok('DAMP', '&&'))
            i += 2
            continue

        # single-char operators
        if c == '|':
            tokens.append(Tok('PIPE', '|'))
            i += 1
            continue
        if c in '?*+#':
            tokens.append(Tok('MULT', c))
            i += 1
            continue
        if c == '!':
            tokens.append(Tok('BANG', '!'))
            i += 1
            continue
        if c == ',':
            tokens.append(Tok('COMMA', ','))
            i += 1
            continue
        if c == '/':
            tokens.append(Tok('SLASH', '/'))
            i += 1
            continue

        # repetition {n} or {n,m}
        if c == '{':
            j = s.find('}', i)
            if j != -1:
                tokens.append(Tok('REPEAT', s[i:j+1]))
                i = j + 1
            else:
                i += 1
            continue

        # parentheses (literal in CSS — function call syntax)
        if c == '(':
            tokens.append(Tok('LPAREN', '('))
            i += 1
            continue
        if c == ')':
            tokens.append(Tok('RPAREN', ')'))
            i += 1
            continue

        # single-quoted literal CSS chars  e.g. '[' or ']'
        if c == "'":
            j = i + 1
            while j < n and s[j] != "'":
                j += 1
            tokens.append(Tok('STRING', s[i+1:j]))
            i = j + 1
            continue

        # word (keyword or identifier)
        if c.isalpha() or c == '_':
            j = i
            while j < n and (s[j].isalnum() or s[j] in '_-'):
                j += 1
            tokens.append(Tok('WORD', s[i:j]))
            i = j
            continue

        # number (including negative, decimal, An+B notation)
        if c.isdigit() or (c == '-' and i+1 < n and s[i+1].isdigit()):
            j = i
            if s[j] == '-':
                j += 1
            while j < n and (s[j].isdigit() or s[j] == '.'):
                j += 1
            if j < n and s[j] in 'nN':
                j += 1  # An+B
            tokens.append(Tok('NUM', s[i:j]))
            i = j
            continue

        # skip unrecognised chars (e.g. unicode symbols like ∞)
        i += 1

    tokens.append(_EOF)
    return tokens


# ── Name sanitisation ─────────────────────────────────────────────────────────

def sanitize(name: str) -> str:
    """CSS name → gluon EBNF identifier (snake_case, no hyphens)."""
    name = name.strip().lstrip('<').rstrip('>')
    name = re.split(r'\s*\[', name)[0].strip()   # drop range qualifier
    name = name.replace('-', '_').replace("'", '')
    name = re.sub(r'[^a-z0-9_]', '_', name.lower())
    return name.strip('_') or 'unknown'


# ── Recursive-descent CSS VDS → EBNF parser ──────────────────────────────────

class Parser:
    def __init__(self, tokens: List[Tok]):
        self.tokens = tokens
        self.pos = 0
        self.approx: List[str] = []   # notes on lossy conversions

    # ── token helpers ────────────────────────────────────────────────────────

    def _skip_ws(self):
        while self.pos < len(self.tokens) and self.tokens[self.pos].kind == 'WS':
            self.pos += 1

    def peek(self) -> Tok:
        p = self.pos
        while p < len(self.tokens) and self.tokens[p].kind == 'WS':
            p += 1
        return self.tokens[p] if p < len(self.tokens) else _EOF

    def consume(self) -> Tok:
        self._skip_ws()
        tok = self.tokens[self.pos] if self.pos < len(self.tokens) else _EOF
        self.pos += 1
        return tok

    def eat(self, kind: str) -> Optional[Tok]:
        if self.peek().kind == kind:
            return self.consume()
        return None

    # ── grammar levels ───────────────────────────────────────────────────────

    def parse(self) -> str:
        result = self.parse_alternation()
        return result or ''

    # Level 1 — |
    def parse_alternation(self) -> str:
        parts = [self.parse_any_order()]
        while self.peek().kind == 'PIPE':
            self.consume()
            parts.append(self.parse_any_order())
        parts = [p for p in parts if p]
        return ' | '.join(parts) if parts else ''

    # Level 2 — ||  (approximate as |)
    def parse_any_order(self) -> str:
        parts = [self.parse_conjunction()]
        while self.peek().kind == 'DPIPE':
            self.consume()
            parts.append(self.parse_conjunction())
        parts = [p for p in parts if p]
        if len(parts) > 1:
            self.approx.append('|| approximated as |')
        return ' | '.join(parts) if parts else ''

    # Level 3 — &&  (approximate as ,)
    def parse_conjunction(self) -> str:
        parts = [self.parse_concatenation()]
        while self.peek().kind == 'DAMP':
            self.consume()
            parts.append(self.parse_concatenation())
        parts = [p for p in parts if p]
        if len(parts) > 1:
            self.approx.append('&& approximated as ,')
        return ' , '.join(parts) if parts else ''

    # Level 4 — juxtaposition  (concatenation)
    def parse_concatenation(self) -> str:
        parts = []
        while True:
            tok = self.peek()
            if tok.kind in ('PIPE', 'DPIPE', 'DAMP', 'RGROUP', 'RPAREN', 'EOF'):
                break

            if tok.kind == 'COMMA':
                self.consume()
                parts.append('"," ')
                continue

            if tok.kind == 'SLASH':
                self.consume()
                parts.append('"/"')
                continue

            atom = self.parse_multiplied()
            if atom is None:
                break
            parts.append(atom)

        parts = [p for p in parts if p]
        return ' , '.join(parts) if parts else ''

    # Level 5 — atom + optional multiplier
    def parse_multiplied(self) -> Optional[str]:
        atom = self.parse_atom()
        if atom is None:
            return None

        tok = self.peek()
        if tok.kind == 'MULT':
            m = self.consume().value
            if m == '?':
                return f'[ {atom} ]'
            elif m == '*':
                return f'{{ {atom} }}'
            elif m == '+':
                return f'{atom} , {{ {atom} }}'
            elif m == '#':
                return f'{atom} , {{ "," , {atom} }}'
        elif tok.kind == 'REPEAT':
            self.consume()
            self.approx.append('{n,m} approximated as { }')
            return f'{{ {atom} }}'
        elif tok.kind == 'BANG':
            self.consume()   # required flag — no EBNF equivalent
        return atom

    # Level 6 — atom
    def parse_atom(self) -> Optional[str]:
        tok = self.peek()

        if tok.kind == 'TYPE_REF':
            self.consume()
            return sanitize(tok.value)

        if tok.kind == 'PROP_REF':
            self.consume()
            return sanitize(tok.value) + '_value'

        if tok.kind == 'WORD':
            self.consume()
            # function call?  word(
            if self.peek().kind == 'LPAREN':
                self.consume()   # consume (
                args = []
                while self.peek().kind not in ('RPAREN', 'EOF'):
                    prev = self.pos
                    part = self.parse_alternation()
                    if self.pos == prev:
                        break   # no progress — malformed input, bail out
                    if part:
                        args.append(part)
                self.eat('RPAREN')
                fname = tok.value
                if args:
                    return f'"{fname}(" , {" , ".join(args)} , ")"'
                return f'"{fname}()"'
            return f'"{tok.value}"'

        if tok.kind == 'NUM':
            self.consume()
            return f'"{tok.value}"'

        if tok.kind == 'STRING':
            self.consume()
            val = tok.value.replace('"', '\\"')
            return f'"{val}"'

        # CSS VDS group [ ... ]  →  EBNF group ( ... )
        if tok.kind == 'LGROUP':
            self.consume()
            inner = self.parse_alternation()
            self.eat('RGROUP')
            return f'( {inner} )' if inner else None

        # literal parentheses in CSS (function syntax)
        if tok.kind == 'LPAREN':
            self.consume()
            inner = self.parse_alternation()
            self.eat('RPAREN')
            return f'"(" , {inner} , ")"' if inner else '"()"'

        return None


# ── Rule splitter ─────────────────────────────────────────────────────────────

# Matches rule headers like:  <display-outside> =   or   display-outside =
# Also matches function-type rules like:  <linear()> =  or  <steps()> =
# Does NOT match <length [0,∞]> because that contains spaces inside <>
_RULE_HEADER = re.compile(
    r'(?:(?:^|\s)(<[\w-]+(?:\(\))?>|[\w][\w-]*))\s*=\s'
)

def split_rules(syntax: str) -> List[Tuple[str, str]]:
    """Split a concatenated CSS VDS string into (name, rhs) pairs."""
    matches = list(_RULE_HEADER.finditer(syntax))
    if not matches:
        return []
    rules = []
    for i, m in enumerate(matches):
        raw_name = m.group(1)
        name = raw_name.strip('<>').strip()
        rhs_start = m.end()
        rhs_end = matches[i+1].start() if i+1 < len(matches) else len(syntax)
        rhs = syntax[rhs_start:rhs_end].strip()
        rules.append((name, rhs))
    return rules


# ── Convert one RHS string ────────────────────────────────────────────────────

def convert_rhs(rhs: str) -> Tuple[str, List[str]]:
    """Return (ebnf_string, [approximation_notes])."""
    tokens = tokenize(rhs)
    p = Parser(tokens)
    ebnf = p.parse()
    return ebnf, p.approx


# ── Process a single file ─────────────────────────────────────────────────────

def convert_file(in_path: str, out_path: str) -> dict:
    """Convert a .txt syntax file to a .ebnf file.

    Returns stats dict.
    """
    rules: dict[str, str] = {}    # name → ebnf rhs  (deduplicated)
    approx_log: list[str] = []
    errors: list[str] = []
    skipped: list[str] = []

    with open(in_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue

            entry_name, _, syntax = line.partition(': ')
            if not syntax:
                continue

            sub_rules = split_rules(syntax)
            if not sub_rules:
                skipped.append(entry_name)
                continue

            for name, rhs in sub_rules:
                ident = sanitize(name)
                if not ident or ident in rules:
                    continue
                try:
                    ebnf, approx = convert_rhs(rhs)
                    if ebnf:
                        rules[ident] = ebnf
                        for note in approx:
                            approx_log.append(f'{ident}: {note}')
                    else:
                        errors.append(f'{ident}: empty conversion from {rhs[:60]!r}')
                except Exception as e:
                    errors.append(f'{ident}: {e}')

    os.makedirs(os.path.dirname(out_path) or '.', exist_ok=True)
    with open(out_path, 'w') as f:
        for name, rhs in sorted(rules.items()):
            f.write(f'{name} = {rhs}\n\n')

    return {
        'rules': len(rules),
        'approx': approx_log,
        'errors': errors,
        'skipped': skipped,
    }


# ── All-files mode ────────────────────────────────────────────────────────────

FILE_MAP = [
    ('docs/syntax/properties.txt',    'lang/properties.ebnf'),
    ('docs/syntax/datatypes.txt',     'lang/datatypes.ebnf'),
    ('docs/syntax/functions.txt',     'lang/functions.ebnf'),
    ('docs/syntax/atrules.txt',       'lang/atrules.ebnf'),
    ('docs/syntax/selectors.txt',     'lang/selectors.ebnf'),
    ('docs/syntax/pseudo-classes.txt','lang/pseudo_classes.ebnf'),
    ('docs/syntax/pseudo-elements.txt','lang/pseudo_elements.ebnf'),
    ('docs/syntax/combinators.txt',   'lang/combinators.ebnf'),
    ('docs/syntax/miscvalues.txt',    'lang/miscvalues.ebnf'),
]


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) == 2 and sys.argv[1] == '--all':
        total_rules = 0
        all_approx: list[str] = []
        all_errors: list[str] = []

        for in_path, out_path in FILE_MAP:
            if not os.path.exists(in_path):
                print(f'  skip (not found): {in_path}')
                continue
            stats = convert_file(in_path, out_path)
            total_rules += stats['rules']
            all_approx.extend(stats['approx'])
            all_errors.extend(stats['errors'])
            print(
                f'  {out_path}: {stats["rules"]} rules'
                + (f', {len(stats["errors"])} errors' if stats['errors'] else '')
            )

        print(f'\ntotal rules: {total_rules}')
        print(f'approximations used: {len(all_approx)}')
        print(f'errors: {len(all_errors)}')

        if all_errors:
            print('\nerrors:')
            for e in all_errors[:20]:
                print(f'  {e}')

    elif len(sys.argv) == 3:
        in_path, out_path = sys.argv[1], sys.argv[2]
        stats = convert_file(in_path, out_path)
        print(f'wrote {stats["rules"]} rules to {out_path}')
        if stats['errors']:
            print(f'errors ({len(stats["errors"])}):')
            for e in stats['errors']:
                print(f'  {e}')
        if stats['approx']:
            print(f'approximations ({len(stats["approx"])}):')
            for a in stats['approx'][:10]:
                print(f'  {a}')
            if len(stats['approx']) > 10:
                print(f'  ... and {len(stats["approx"])-10} more')
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == '__main__':
    main()
