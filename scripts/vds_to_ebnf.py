#!/usr/bin/env python3
"""
vds_to_ebnf.py
Transform CSS Value Definition Syntax (VDS) from docs/syntax/datatypes.txt
into gluon-compatible EBNF, appending to lang/datatype.ebnf.

See docs/vds-to-ebnf.md for the full transformation rationale.

Usage:
    python scripts/vds_to_ebnf.py [--dry-run]

  --dry-run  Print generated EBNF without modifying any files.
"""

import re
import sys
import random
from pathlib import Path

ROOT         = Path(__file__).parent.parent
DATATYPES_TXT = ROOT / "docs" / "syntax" / "datatypes.txt"
DATATYPE_EBNF = ROOT / "lang" / "datatype.ebnf"
KEYWORD_EBNF  = ROOT / "lang" / "keyword.ebnf"
PRIMITIVE_EBNF = ROOT / "lang" / "primitive.ebnf"

DRY_RUN = "--dry-run" in sys.argv

# ── Types already implemented in existing EBNF files (by CSS name) ─────────────
DONE_CSS = {"<number>", "<integer>", "<percentage>", "<length>"}

# ── Naming helpers ──────────────────────────────────────────────────────────────

def css_ref_to_name(ref: str) -> str:
    """
    Convert a CSS VDS reference to a gluon EBNF rule name.

    <color-mix()>        → color_mix_fn
    <number [0,∞]>       → number
    <color>              → color
    """
    inner = ref.strip("<>").strip()
    # Strip range annotations like [0,100] or [0,∞]
    inner = re.sub(r"\s*\[[^\]]*\]", "", inner).strip()
    is_fn = inner.endswith("()")
    if is_fn:
        inner = inner[:-2]
    name = re.sub(r"[^a-zA-Z0-9]+", "_", inner).strip("_").lower()
    name = re.sub(r"_+", "_", name)
    if is_fn:
        name += "_fn"
    return name


def load_keywords(path: Path) -> dict:
    """
    Build {lowercase_literal: ebnf_name} from keyword.ebnf.

    Handles both:
        name = "value" ;
        name = "v1" | "v2" ;   (takes only the first literal)
    """
    kw = {}
    for line in path.read_text().splitlines():
        m = re.match(r'^(\w+)\s*=\s*"([^"]+)"', line)
        if m:
            kw[m.group(2).lower()] = m.group(1)
    return kw


def load_implemented(path: Path) -> set:
    """Return set of EBNF rule names already defined in a .ebnf file."""
    impl = set()
    for line in path.read_text().splitlines():
        m = re.match(r"^([a-zA-Z_]\w*)\s*=", line)
        if m:
            impl.add(m.group(1))
    return impl


# ── Parse datatypes.txt into definition blocks ──────────────────────────────────

def parse_blocks(text: str) -> list:
    """
    Return [(css_name, body_str, line_no), ...] – one tuple per definition.

    body_str is the joined, stripped RHS of the definition.
    line_no is the 0-based index of the definition header line.
    """
    blocks = []
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        m = re.match(r"^(<[^>]+>)\s*=\s*(.*)", lines[i])
        if m:
            css_name   = m.group(1).strip()
            first_rest = m.group(2).strip()
            line_no    = i
            body_parts = [first_rest] if first_rest else []
            i += 1
            # Collect continuation lines until empty line or new definition
            while i < len(lines):
                stripped = lines[i].strip()
                if not stripped:
                    break
                if re.match(r"^<[^>]+>\s*=", lines[i]):
                    break
                body_parts.append(stripped)
                i += 1
            body = " ".join(body_parts).strip()
            blocks.append((css_name, body, line_no))
        else:
            i += 1
    return blocks


# ── Tokenizer ───────────────────────────────────────────────────────────────────

_TOKEN_SPECS = [
    # Angle-bracket references; may contain spaces, range annotations, ()
    ("REF",           r"<[a-zA-Z0-9][a-zA-Z0-9\s,∞.\-\[\]]*(?:\(\))?>"),
    ("STRING",        r'"[^"]*"'),
    ("UNORDERED",     r"\|\|"),          # || before |
    ("ALL",           r"&&"),
    ("ALT",           r"\|"),
    ("LBRACKET",      r"\["),
    ("RBRACKET",      r"\]"),
    ("LPAREN",        r"\("),
    ("RPAREN",        r"\)"),
    ("MULT_HASH_OPT", r"#\?"),           # #? before #
    ("MULT_HASH",     r"#"),
    ("MULT_OPT",      r"\?"),
    ("MULT_STAR",     r"\*"),
    ("MULT_PLUS",     r"\+"),
    ("MULT_RANGE",    r"\{[0-9]+(?:,[0-9]*)?\}"),
    ("BANG",          r"!"),
    ("COMMA",         r","),
    ("SLASH",         r"/"),             # literal / in e.g. <ratio>
    ("KEYWORD",       r"-?[a-zA-Z][a-zA-Z0-9\-]*"),  # bare keywords, may start with -
    ("SPACE",         r"\s+"),
    ("SKIP",          r"."),             # absorb unknown chars
]
_MASTER = re.compile(
    "|".join(f"(?P<{n}>{p})" for n, p in _TOKEN_SPECS)
)


def tokenize(text: str) -> list:
    toks = []
    for m in _MASTER.finditer(text):
        k = m.lastgroup
        if k in ("SPACE", "SKIP"):
            continue
        toks.append((k, m.group()))
    return toks


# ── Recursive-descent parser → AST ─────────────────────────────────────────────

_STOP_KINDS = frozenset({"ALT", "UNORDERED", "ALL", "RBRACKET", "RPAREN"})


class Parser:
    def __init__(self, toks):
        self.toks = toks
        self.pos  = 0

    def peek(self):
        return self.toks[self.pos] if self.pos < len(self.toks) else None

    def consume(self):
        t = self.toks[self.pos]
        self.pos += 1
        return t

    def done(self):
        return self.pos >= len(self.toks)

    # grammar: alt > unordered > all_combo > concat > unit > atom + multiplier

    def parse(self):
        return self.alt()

    def alt(self):
        parts = [self.unordered()]
        while self.peek() and self.peek()[0] == "ALT":
            self.consume()
            parts.append(self.unordered())
        return ("alt", parts) if len(parts) > 1 else parts[0]

    def unordered(self):
        parts = [self.all_combo()]
        while self.peek() and self.peek()[0] == "UNORDERED":
            self.consume()
            parts.append(self.all_combo())
        return ("unordered", parts) if len(parts) > 1 else parts[0]

    def all_combo(self):
        parts = [self.concat()]
        while self.peek() and self.peek()[0] == "ALL":
            self.consume()
            parts.append(self.concat())
        return ("all_combo", parts) if len(parts) > 1 else parts[0]

    def concat(self):
        units = []
        while self.peek() and self.peek()[0] not in _STOP_KINDS:
            units.append(self.unit())
        if not units:
            return ("empty",)
        return ("concat", units) if len(units) > 1 else units[0]

    def unit(self):
        p = self.peek()
        if p is None:
            return ("empty",)
        k, v = p

        if k == "REF":
            self.consume()
            node = ("ref", v)
        elif k == "KEYWORD":
            self.consume()
            node = ("kw", v)
        elif k == "STRING":
            self.consume()
            node = ("string", v[1:-1])
        elif k == "COMMA":
            self.consume()
            node = ("literal_comma",)
        elif k == "SLASH":
            self.consume()
            node = ("slash",)
        elif k == "LBRACKET":
            self.consume()
            inner = self.alt()
            if self.peek() and self.peek()[0] == "RBRACKET":
                self.consume()
            node = ("group", inner)
        elif k == "LPAREN":
            self.consume()
            inner = self.alt()
            if self.peek() and self.peek()[0] == "RPAREN":
                self.consume()
            node = ("fn_args", inner)
        else:
            self.consume()
            node = ("skip", v)

        return self._multiplier(node)

    def _multiplier(self, node):
        p = self.peek()
        if p is None:
            return node
        k, v = p
        if k == "MULT_OPT":      self.consume(); return ("opt",      node)
        if k == "MULT_STAR":     self.consume(); return ("rep",      node)
        if k == "MULT_PLUS":     self.consume(); return ("plus",     node)
        if k == "MULT_HASH_OPT": self.consume(); return ("hash_opt", node)
        if k == "MULT_HASH":
            self.consume()
            # #{n} or #{m,n} — hash with exact/range count
            if self.peek() and self.peek()[0] == "MULT_RANGE":
                rv = self.consume()[1]
                lo, hi = self._parse_range(rv)
                return ("hash_range", node, lo, hi)
            return ("hash", node)
        if k == "MULT_RANGE":
            self.consume()
            lo, hi = self._parse_range(v)
            return ("range", node, lo, hi)
        if k == "BANG":
            self.consume(); return ("bang", node)
        return node

    @staticmethod
    def _parse_range(v: str):
        """Parse '{n}' → (n, n)  or  '{m,n}' → (m, n)  or  '{m,}' → (m, None)."""
        inner = v[1:-1]
        parts = inner.split(",")
        if len(parts) == 1:
            n = int(parts[0].strip())
            return n, n          # {n} = exactly n
        lo = int(parts[0].strip()) if parts[0].strip() else 0
        hi = int(parts[1].strip()) if parts[1].strip() else None
        return lo, hi


# ── EBNF emitter ────────────────────────────────────────────────────────────────

class Emitter:
    """
    Walk an AST node and produce a gluon-compatible EBNF string.

    Complex `+` / `#` inner expressions are promoted to helper rules whose
    names are based on the parent rule name.
    """

    def __init__(self, keywords: dict, rule_name: str):
        self.kw        = keywords      # {lowercase_literal: ebnf_name}
        self.rule      = rule_name
        self.helpers   = []            # [(helper_name, helper_body_str)]
        self._hcnt     = 0

    # ── internal helpers ───────────────────────────────────────────────────────

    def _kw_ref(self, word: str) -> str:
        lu = self.kw.get(word.lower())
        return lu if lu else f'"{word}"'

    def _helper_name(self, suffix: str = "item") -> str:
        self._hcnt += 1
        base = f"{self.rule}_{suffix}"
        return base if self._hcnt == 1 else f"{base}_{self._hcnt}"

    def _wrap_if_alt(self, node, s: str) -> str:
        """Add EBNF grouping parens if node is alternation (prevents precedence bugs)."""
        if node[0] in ("alt", "unordered", "all_combo"):
            return f"( {s} )"
        return s

    def _inner_str(self, inner) -> str:
        """Emit inner, promoting to a helper rule if complex (for use in + / # / range)."""
        if inner[0] in ("ref", "kw", "string"):
            return self.emit(inner)
        hn = self._helper_name()
        self.helpers.append((hn, self.emit(inner)))
        return hn

    # ── main emit ──────────────────────────────────────────────────────────────

    def emit(self, node) -> str:
        t = node[0]

        # ── terminals ──────────────────────────────────────────────────────────
        if t == "ref":
            return css_ref_to_name(node[1])

        if t == "kw":
            return self._kw_ref(node[1])

        if t == "string":
            lu = self.kw.get(node[1].lower())
            return lu if lu else f'"{node[1]}"'

        if t == "literal_comma":
            return '","'

        if t == "slash":
            return '"/"'

        if t == "empty":
            return "(* empty *)"

        if t == "skip":
            return f"(* skip: {node[1]} *)"

        # ── combinators ────────────────────────────────────────────────────────

        if t == "alt":
            # | → oneof in proto
            return " | ".join(self.emit(c) for c in node[1])

        if t == "unordered":
            # || → each operand optional; any non-empty subset valid.
            # Proto: flat message with all-optional message fields.
            # See docs/vds-to-ebnf.md for rationale.
            return " , ".join(f"[ {self.emit(c)} ]" for c in node[1])

        if t == "all_combo":
            # && → all required; canonical order in proto.
            parts = []
            for c in node[1]:
                s = self.emit(c)
                parts.append(self._wrap_if_alt(c, s))
            return " , ".join(parts)

        if t == "concat":
            parts = []
            for c in node[1]:
                s = self.emit(c)
                parts.append(self._wrap_if_alt(c, s))
            return " , ".join(parts)

        # ── grouping ───────────────────────────────────────────────────────────

        if t == "group":
            # CSS [ expr ] is a grouping bracket, not optional.
            inner, s = node[1], self.emit(node[1])
            # Alt inside a group needs EBNF parens; other forms are transparent.
            if inner[0] in ("alt", "unordered", "all_combo"):
                return f"( {s} )"
            return s

        if t == "fn_args":
            # The content of a CSS function's ( ... ) — emit as literal parens.
            inner = node[1]
            s     = self.emit(inner)
            s     = self._wrap_if_alt(inner, s)
            return f'"(" , {s} , ")"'

        # ── multipliers ────────────────────────────────────────────────────────

        if t == "opt":
            return f"[ {self.emit(node[1])} ]"

        if t == "rep":
            return f"{{ {self.emit(node[1])} }}"

        if t == "plus":
            s = self._inner_str(node[1])
            return f"{s} , {{ {s} }}"

        if t == "hash":
            s = self._inner_str(node[1])
            return f'{s} , {{ "," , {s} }}'

        if t == "hash_opt":
            s = self._inner_str(node[1])
            return f'[ {s} , {{ "," , {s} }} ]'

        if t == "hash_range":
            # #{n} or #{m,n} — comma-separated list of exactly n (or m..n) items
            inner, lo, hi = node[1], node[2], node[3]
            s = self._inner_str(inner)
            if lo == hi:
                # Exactly n items: s , "," , s , "," , s  (n times)
                return ' , "," , '.join([s] * lo) if lo > 0 else s
            else:
                required = [s] * lo
                optional = [f'[ "," , {s} ]'] * ((hi or lo) - lo)
                parts = required + optional
                return ' , '.join(parts)

        if t == "range":
            inner, lo, hi = node[1], node[2], node[3]
            s = self._inner_str(inner)
            if lo == 0 and hi is None:
                return f"{{ {s} }}"
            parts = [s] * lo
            if hi is None:
                parts.append(f"{{ {s} }}")
            elif hi > lo:
                parts += [f"[ {s} ]"] * (hi - lo)
            return " , ".join(parts) if parts else "(* empty range *)"

        if t == "bang":
            # ! = at-least-one constraint — noted in comment, not enforced in grammar
            return f"(* ! at-least-one *) {self.emit(node[1])}"

        return f"(* unhandled node: {t} *)"


# ── Transform a single VDS block ────────────────────────────────────────────────

def transform(css_name: str, body: str, keywords: dict) -> list:
    """
    Return a list of EBNF lines for css_name.
    First element is the main rule; remaining are any helper rules.
    """
    ebnf_name = css_ref_to_name(css_name)
    if not body:
        return [f"{ebnf_name} = (* no body *) ;"]
    try:
        toks    = tokenize(body)
        ast     = Parser(toks).parse()
        emitter = Emitter(keywords, ebnf_name)
        body_str = emitter.emit(ast)
        lines = [f"{ebnf_name} = {body_str} ;"]
        for hn, hb in emitter.helpers:
            lines.append(f"{hn} = {hb} ;")
        return lines
    except Exception as exc:
        return [f"{ebnf_name} = (* ERROR: {exc} *) ;"]


# ── Main ────────────────────────────────────────────────────────────────────────

def main():
    keywords    = load_keywords(KEYWORD_EBNF)
    implemented = (load_implemented(DATATYPE_EBNF) |
                   load_implemented(PRIMITIVE_EBNF))

    raw    = DATATYPES_TXT.read_text()
    blocks = parse_blocks(raw)

    # ── Determine which blocks are new vs already-done ─────────────────────────
    # Track first occurrence of each CSS name (for deduplication)
    first_line_of: dict = {}
    for css_name, _, line_no in blocks:
        if css_name not in first_line_of:
            first_line_of[css_name] = line_no

    done_line_nos: set = set()   # line numbers to annotate with [done]
    new_rules:    list = []      # [(css_name, orig_body, ebnf_lines)]

    for css_name, body, line_no in blocks:
        ebnf_name  = css_ref_to_name(css_name)
        is_done    = css_name in DONE_CSS or ebnf_name in implemented
        is_dup     = first_line_of[css_name] != line_no

        if is_done or is_dup:
            done_line_nos.add(line_no)
            continue

        ebnf_lines = transform(css_name, body, keywords)
        new_rules.append((css_name, body, ebnf_lines))

    # ── Build EBNF output block ────────────────────────────────────────────────
    out_lines = [
        "",
        "",
        "(* ═══════════════════════════════════════════════════════════════════",
        "   Generated from docs/syntax/datatypes.txt by scripts/vds_to_ebnf.py",
        "   See docs/vds-to-ebnf.md for transformation rationale.",
        "   ═══════════════════════════════════════════════════════════════════ *)",
    ]
    for css_name, _, ebnf_lines in new_rules:
        out_lines.append(f"\n(* {css_name} *)")
        out_lines.extend(ebnf_lines)

    ebnf_block = "\n".join(out_lines) + "\n"

    # ── Build annotated datatypes.txt ─────────────────────────────────────────
    txt_lines = raw.splitlines()
    for ln in done_line_nos:
        if "(* [done] *)" not in txt_lines[ln]:
            txt_lines[ln] = txt_lines[ln].rstrip() + "  (* [done] *)"
    new_txt = "\n".join(txt_lines)

    # ── Write or print ─────────────────────────────────────────────────────────
    if DRY_RUN:
        print(ebnf_block)
    else:
        with open(DATATYPE_EBNF, "a") as f:
            f.write(ebnf_block)
        DATATYPES_TXT.write_text(new_txt)
        print(f"Appended {len(new_rules)} rules to {DATATYPE_EBNF}")
        print(f"Marked {len(done_line_nos)} blocks in {DATATYPES_TXT}")

    # ── Verification: 10 random types ─────────────────────────────────────────
    random.seed(42)
    sample = random.sample(new_rules, min(10, len(new_rules)))

    print()
    print("=" * 70)
    print(f"Verification — {len(sample)} random types")
    print("=" * 70)
    for css_name, orig_body, ebnf_lines in sample:
        preview = orig_body[:100].replace("\n", " ")
        ellipsis = "…" if len(orig_body) > 100 else ""
        print(f"\n  CSS: {css_name} =")
        print(f"       {preview}{ellipsis}")
        print(f"  EBNF:")
        for line in ebnf_lines:
            print(f"       {line}")


if __name__ == "__main__":
    main()
