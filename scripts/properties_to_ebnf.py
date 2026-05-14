#!/usr/bin/env python3
"""
properties_to_ebnf.py
Transform CSS Value Definition Syntax (VDS) from docs/syntax/properties.txt
into gluon-compatible EBNF, writing to lang/property.ebnf.

- CSS property `accent-color =` → EBNF rule `accent_color_prop`
- Inline sub-type `<content-distribution> =` → EBNF rule `content_distribution_type`
  (skipped if already defined in any existing EBNF file)
- Duplicate sub-type definitions (same CSS name appearing multiple times) are
  only generated once.

Usage:
    python scripts/properties_to_ebnf.py [--dry-run]

  --dry-run  Print generated EBNF to stdout without writing any files.
"""

import re
import sys
from pathlib import Path

ROOT          = Path(__file__).parent.parent
PROPS_TXT     = ROOT / "docs" / "syntax" / "properties.txt"
PROPERTY_EBNF = ROOT / "lang" / "property.ebnf"
KEYWORD_EBNF  = ROOT / "lang" / "keyword.ebnf"

# All existing EBNF files whose rule names must not be duplicated
EXISTING_EBNF = [
    ROOT / "lang" / "primitive.ebnf",
    ROOT / "lang" / "keyword.ebnf",
    ROOT / "lang" / "datatype.ebnf",
    ROOT / "lang" / "functions.ebnf",
]

DRY_RUN = "--dry-run" in sys.argv


# ── Naming helpers ──────────────────────────────────────────────────────────────

def css_prop_to_name(prop: str) -> str:
    """accent-color  →  accent_color_prop"""
    name = re.sub(r"[^a-zA-Z0-9]+", "_", prop).strip("_").lower()
    name = re.sub(r"_+", "_", name)
    return name + "_prop"


def css_ref_to_name(ref: str) -> str:
    """
    <color-mix()>        → color_mix_fn
    <number [0,∞]>       → number_type
    <color>              → color_type
    """
    inner = ref.strip("<>").strip()
    inner = re.sub(r"\s*\[[^\]]*\]", "", inner).strip()
    is_fn = inner.endswith("()")
    if is_fn:
        inner = inner[:-2]
    name = re.sub(r"[^a-zA-Z0-9]+", "_", inner).strip("_").lower()
    name = re.sub(r"_+", "_", name)
    if is_fn:
        name += "_fn"
    else:
        name += "_type"
    return name


# ── Load helpers ────────────────────────────────────────────────────────────────

def load_keywords(path: Path) -> dict:
    """Build {lowercase_literal: ebnf_name} from keyword.ebnf."""
    kw = {}
    for line in path.read_text().splitlines():
        m = re.match(r'^(\w+)\s*=\s*"([^"]+)"', line)
        if m:
            kw[m.group(2).lower()] = m.group(1)
    return kw


def load_implemented(paths: list) -> set:
    """
    Return set of EBNF rule names already defined across all given files.
    Also builds a lowercase→actual dict to handle camelCase rules like rotateX_fn.
    """
    impl = set()
    lower_map = {}   # lowercase name → actual name
    for path in paths:
        for line in path.read_text().splitlines():
            m = re.match(r'^([a-zA-Z_]\w*)\s*=', line)
            if m:
                name = m.group(1)
                impl.add(name)
                lower_map[name.lower()] = name
    return impl, lower_map


def is_implemented(name: str, impl: set, lower_map: dict) -> bool:
    """Check if name (or its lowercase equivalent) is already defined."""
    return name in impl or name.lower() in lower_map


# ── Parser (identical to vds_to_ebnf.py) ───────────────────────────────────────

_TOKEN_SPECS = [
    ("REF",           r"<[a-zA-Z0-9][a-zA-Z0-9\s,∞.\-\[\]]*(?:\(\))?>"),
    ("STRING",        r'"[^"]*"'),
    ("UNORDERED",     r"\|\|"),
    ("ALL",           r"&&"),
    ("ALT",           r"\|"),
    ("LBRACKET",      r"\["),
    ("RBRACKET",      r"\]"),
    ("LPAREN",        r"\("),
    ("RPAREN",        r"\)"),
    ("MULT_HASH_OPT", r"#\?"),
    ("MULT_HASH",     r"#"),
    ("MULT_OPT",      r"\?"),
    ("MULT_STAR",     r"\*"),
    ("MULT_PLUS",     r"\+"),
    ("MULT_RANGE",    r"\{[0-9]+(?:,[0-9]*)?\}"),
    ("BANG",          r"!"),
    ("COMMA",         r","),
    ("SLASH",         r"/"),
    ("KEYWORD",       r"-?[a-zA-Z][a-zA-Z0-9\-]*"),
    ("SPACE",         r"\s+"),
    ("SKIP",          r"."),
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


_STOP_KINDS = frozenset({"ALT", "UNORDERED", "ALL", "RBRACKET", "RPAREN"})


class Parser:
    def __init__(self, toks):
        self.toks = toks
        self.pos  = 0

    def peek(self):
        return self.toks[self.pos] if self.pos < len(self.toks) else None

    def consume(self):
        t = self.toks[self.pos]; self.pos += 1; return t

    def done(self):
        return self.pos >= len(self.toks)

    def parse(self):
        return self.alt()

    def alt(self):
        parts = [self.unordered()]
        while self.peek() and self.peek()[0] == "ALT":
            self.consume(); parts.append(self.unordered())
        return ("alt", parts) if len(parts) > 1 else parts[0]

    def unordered(self):
        parts = [self.all_combo()]
        while self.peek() and self.peek()[0] == "UNORDERED":
            self.consume(); parts.append(self.all_combo())
        return ("unordered", parts) if len(parts) > 1 else parts[0]

    def all_combo(self):
        parts = [self.concat()]
        while self.peek() and self.peek()[0] == "ALL":
            self.consume(); parts.append(self.concat())
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
            self.consume(); node = ("ref", v)
        elif k == "KEYWORD":
            self.consume(); node = ("kw", v)
        elif k == "STRING":
            self.consume(); node = ("string", v[1:-1])
        elif k == "COMMA":
            self.consume(); node = ("literal_comma",)
        elif k == "SLASH":
            self.consume(); node = ("slash",)
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
            self.consume(); node = ("skip", v)
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
        inner = v[1:-1]
        parts = inner.split(",")
        if len(parts) == 1:
            n = int(parts[0].strip()); return n, n
        lo = int(parts[0].strip()) if parts[0].strip() else 0
        hi = int(parts[1].strip()) if parts[1].strip() else None
        return lo, hi


# ── EBNF emitter ────────────────────────────────────────────────────────────────

class Emitter:
    def __init__(self, keywords: dict, rule_name: str, lower_map: dict):
        self.kw        = keywords
        self.rule      = rule_name
        self.lower_map = lower_map
        self.helpers   = []
        self._hcnt     = 0

    def _kw_ref(self, word: str) -> str:
        lu = self.kw.get(word.lower())
        return lu if lu else f'"{word}"'

    def _helper_name(self, suffix: str = "item") -> str:
        self._hcnt += 1
        base = f"{self.rule}_{suffix}"
        return base if self._hcnt == 1 else f"{base}_{self._hcnt}"

    def _wrap_if_alt(self, node, s: str) -> str:
        if node[0] in ("alt", "unordered", "all_combo"):
            return f"( {s} )"
        return s

    def _inner_str(self, inner) -> str:
        if inner[0] in ("ref", "kw", "string"):
            return self.emit(inner)
        hn = self._helper_name()
        self.helpers.append((hn, self.emit(inner)))
        return hn

    def _resolve_ref(self, ref_str: str) -> str:
        """
        Convert a CSS VDS <ref> to an EBNF rule name, using actual casing
        from lower_map when available (handles rotateX_fn vs rotatex_fn).
        """
        name = css_ref_to_name(ref_str)
        actual = self.lower_map.get(name.lower())
        return actual if actual else name

    def emit(self, node) -> str:
        t = node[0]
        if t == "ref":
            return self._resolve_ref(node[1])
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
        if t == "alt":
            return " | ".join(self.emit(c) for c in node[1])
        if t == "unordered":
            return " , ".join(f"[ {self.emit(c)} ]" for c in node[1])
        if t == "all_combo":
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
        if t == "group":
            inner, s = node[1], self.emit(node[1])
            if inner[0] in ("alt", "unordered", "all_combo"):
                return f"( {s} )"
            return s
        if t == "fn_args":
            inner = node[1]; s = self.emit(inner)
            s = self._wrap_if_alt(inner, s)
            return f'"(" , {s} , ")"'
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
            inner, lo, hi = node[1], node[2], node[3]
            s = self._inner_str(inner)
            if lo == hi:
                return ' , "," , '.join([s] * lo) if lo > 0 else s
            required = [s] * lo
            optional = [f'[ "," , {s} ]'] * ((hi or lo) - lo)
            return ' , '.join(required + optional)
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
            return f"(* ! at-least-one *) {self.emit(node[1])}"
        return f"(* unhandled: {t} *)"


# ── Transform a single VDS block ────────────────────────────────────────────────

def transform(ebnf_name: str, body: str, keywords: dict, lower_map: dict) -> list:
    if not body:
        return [f"{ebnf_name} = (* no body *) ;"]
    try:
        toks     = tokenize(body)
        ast      = Parser(toks).parse()
        emitter  = Emitter(keywords, ebnf_name, lower_map)
        body_str = emitter.emit(ast)
        lines    = [f"{ebnf_name} = {body_str} ;"]
        for hn, hb in emitter.helpers:
            lines.append(f"{hn} = {hb} ;")
        return lines
    except Exception as exc:
        return [f"{ebnf_name} = (* ERROR: {exc} *) ;"]


# ── Parse properties.txt ────────────────────────────────────────────────────────

def parse_blocks(text: str) -> list:
    """
    Return [(kind, css_name, body_str), ...]
    kind = 'prop'    for  `property-name =`
    kind = 'subtype' for  `<type-name> =`
    """
    blocks = []
    lines  = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        # Sub-type definition: <name> =
        m = re.match(r"^(<[^>]+>)\s*=\s*(.*)", line)
        if m:
            css_name   = m.group(1).strip()
            first_rest = m.group(2).strip()
            body_parts = [first_rest] if first_rest else []
            i += 1
            while i < len(lines):
                stripped = lines[i].strip()
                if not stripped:
                    break
                if re.match(r"^(<[^>]+>|[a-zA-Z][a-zA-Z0-9-]*)\s*=", lines[i]):
                    break
                body_parts.append(stripped)
                i += 1
            blocks.append(("subtype", css_name, " ".join(body_parts).strip()))
            continue

        # Property definition: property-name =
        m = re.match(r"^([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*(.*)", line)
        if m:
            css_name   = m.group(1).strip()
            first_rest = m.group(2).strip()
            body_parts = [first_rest] if first_rest else []
            i += 1
            while i < len(lines):
                stripped = lines[i].strip()
                if not stripped:
                    break
                if re.match(r"^(<[^>]+>|[a-zA-Z][a-zA-Z0-9-]*)\s*=", lines[i]):
                    break
                body_parts.append(stripped)
                i += 1
            blocks.append(("prop", css_name, " ".join(body_parts).strip()))
            continue

        i += 1
    return blocks


# ── Main ────────────────────────────────────────────────────────────────────────

def main():
    keywords          = load_keywords(KEYWORD_EBNF)
    impl, lower_map   = load_implemented(EXISTING_EBNF)

    raw    = PROPS_TXT.read_text()
    blocks = parse_blocks(raw)

    # Track first occurrence of each css_name to deduplicate repeated sub-types
    first_seen: dict = {}
    for kind, css_name, body in blocks:
        if css_name not in first_seen:
            first_seen[css_name] = True

    generated_names: set = set()   # track names we emit in this run (avoid duplicates)
    prop_rules:    list  = []
    subtype_rules: list  = []

    seen_css: set = set()

    for kind, css_name, body in blocks:
        if css_name in seen_css:
            continue   # skip duplicate sub-type definitions
        seen_css.add(css_name)

        if kind == "prop":
            ebnf_name = css_prop_to_name(css_name)
            if ebnf_name in impl or ebnf_name in generated_names:
                continue
            generated_names.add(ebnf_name)
            ebnf_lines = transform(ebnf_name, body, keywords, lower_map)
            # Register any helper names generated
            for l in ebnf_lines:
                hm = re.match(r'^([a-zA-Z_]\w*)\s*=', l)
                if hm:
                    generated_names.add(hm.group(1))
            prop_rules.append((css_name, ebnf_lines))

        else:  # subtype
            ebnf_name = css_ref_to_name(css_name)
            # Check against existing impl (case-insensitive for camelCase rules)
            if is_implemented(ebnf_name, impl, lower_map):
                continue
            if ebnf_name in generated_names:
                continue
            generated_names.add(ebnf_name)
            ebnf_lines = transform(ebnf_name, body, keywords, lower_map)
            for l in ebnf_lines:
                hm = re.match(r'^([a-zA-Z_]\w*)\s*=', l)
                if hm:
                    generated_names.add(hm.group(1))
            subtype_rules.append((css_name, ebnf_lines))

    # ── Build _expr rules ────────────────────────────────────────────────────────
    # Each expr rule: accent_color_expr = accent_color , ":" , accent_color_prop , ";" ;
    expr_rules: list = []
    for css_name, lines in prop_rules:
        # Extract the prop ebnf name from the first generated line
        m = re.match(r'^([a-zA-Z_]\w*)\s*=', lines[0])
        if not m:
            continue
        prop_ebnf_name = m.group(1)
        expr_ebnf_name = prop_ebnf_name[:-5] + "_expr"  # replace _prop → _expr
        # Property name token: use keyword reference if available, else string literal
        kw_name = keywords.get(css_name.lower())
        prop_name_token = kw_name if kw_name else f'"{css_name}"'
        expr_line = f'{expr_ebnf_name} = {prop_name_token} , ":" , {prop_ebnf_name} , ";" ;'
        expr_rules.append((css_name, expr_line))

    # ── Build output ────────────────────────────────────────────────────────────
    header = """\
(* CSS Property value definitions
   Generated from docs/syntax/properties.txt by scripts/properties_to_ebnf.py

   Each property is named <property_name>_prop.
   Inline sub-types not already defined in other EBNF files are also included here.
*)
"""

    out_lines = [header]

    if expr_rules:
        out_lines.append(
            "(* ── CSS Property declarations (name : value ;) ─────────────────────────── *)\n"
        )
        for css_name, expr_line in expr_rules:
            out_lines.append(f"(* {css_name} *)")
            out_lines.append(expr_line)
            out_lines.append("")

    if subtype_rules:
        out_lines.append(
            "(* ── Property-specific sub-types ──────────────────────────────────────── *)\n"
        )
        for css_name, lines in subtype_rules:
            out_lines.append(f"(* {css_name} *)")
            out_lines.extend(lines)
            out_lines.append("")

    out_lines.append(
        "\n(* ── CSS Properties ────────────────────────────────────────────────────── *)\n"
    )
    for css_name, lines in prop_rules:
        out_lines.append(f"(* {css_name} *)")
        out_lines.extend(lines)
        out_lines.append("")

    output = "\n".join(out_lines) + "\n"

    if DRY_RUN:
        print(output[:3000])
        print(f"\n... (truncated) ...")
        print(f"\nWould write {len(expr_rules)} expr rules, {len(prop_rules)} property rules and {len(subtype_rules)} sub-type rules.")
        print(f"Total new rules (incl. helpers): {len(generated_names)}")
    else:
        PROPERTY_EBNF.write_text(output)
        print(f"Written {len(expr_rules)} expr rules, {len(prop_rules)} property rules and {len(subtype_rules)} sub-type rules to {PROPERTY_EBNF}")
        print(f"Total new rule names generated: {len(generated_names)}")


if __name__ == "__main__":
    main()
