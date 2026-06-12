#!/usr/bin/env python3
"""Inline keyword.ebnf and symbol.ebnf terminals into the rest of the grammar.

keyword.ebnf (1764 rules) and symbol.ebnf (36 rules) are flat tables of the form

    name = "literal" ;

They add a layer of indirection: every other rule references the keyword/symbol
by name instead of writing the literal. This script removes that layer — it
replaces every reference to a keyword/symbol rule, across all other lang/*.ebnf
files, with the rule's terminal literal (verbatim, so special quoting like '"',
"'", "\\", "--", "::" is preserved), then deletes the two table files.

Replacements happen only in *code* — never inside EBNF comments `(* ... *)` or
inside existing string terminals — and only on whole-word identifier boundaries,
so `row` is inlined but `row_reverse` and the `row` inside a `"arrow"` literal
are left alone.

Run from the repo root:  python3 tools/inline_keywords.py
"""

import os
import re
import sys

LANG = "lang"
TABLE_FILES = ["keyword.ebnf", "symbol.ebnf"]
# Files to rewrite (everything in lang/ except the tables being removed).
TARGET_FILES = [
    "css.ebnf", "primitive.ebnf", "combinator.ebnf", "datatype.ebnf",
    "functions.ebnf", "pseudo-class.ebnf", "pseudo-element.ebnf",
    "selector.ebnf", "property.ebnf", "atrule.ebnf",
]

RULE_RE = re.compile(r"""^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*('[^']*'|"[^"]*")\s*;""")


def parse_table(path):
    """Return {name: literal_verbatim} for a flat terminal table file.

    Errors out if any non-blank, non-comment line is not a simple
    `name = "literal" ;` rule, so we never silently drop a complex rule.
    """
    mapping = {}
    text = open(path, encoding="utf-8").read()
    # Strip comments so they don't confuse rule detection.
    code = strip_comments(text)
    for raw in code.splitlines():
        line = raw.strip()
        if not line:
            continue
        m = RULE_RE.match(line)
        if not m:
            sys.exit(f"ERROR: {path}: not a simple terminal rule: {raw!r}")
        name, literal = m.group(1), m.group(2)
        if name in mapping and mapping[name] != literal:
            sys.exit(f"ERROR: {path}: duplicate name {name} with different literal")
        mapping[name] = literal
    return mapping


def strip_comments(text):
    """Replace EBNF (* ... *) comments with equivalent-length blanks (keeps
    offsets stable; only used for rule scanning, not output)."""
    out = []
    i, n = 0, len(text)
    while i < n:
        if text[i] == "(" and i + 1 < n and text[i + 1] == "*":
            j = text.find("*)", i + 2)
            if j == -1:
                j = n
            else:
                j += 2
            out.append(re.sub(r"[^\n]", " ", text[i:j]))
            i = j
        else:
            out.append(text[i])
            i += 1
    return "".join(out)


def segments(text):
    """Yield (kind, chunk) where kind is 'code', 'comment', or 'string'.

    Only 'code' chunks are eligible for replacement; comments and string
    terminals pass through verbatim.
    """
    i, n = 0, len(text)
    buf = []

    def flush():
        if buf:
            seg = "".join(buf)
            buf.clear()
            return ("code", seg)
        return None

    while i < n:
        c = text[i]
        if c == "(" and i + 1 < n and text[i + 1] == "*":
            s = flush()
            if s:
                yield s
            j = text.find("*)", i + 2)
            j = n if j == -1 else j + 2
            yield ("comment", text[i:j])
            i = j
        elif c == '"' or c == "'":
            s = flush()
            if s:
                yield s
            q = c
            j = text.find(q, i + 1)
            j = n if j == -1 else j + 1
            yield ("string", text[i:j])
            i = j
        else:
            buf.append(c)
            i += 1
    s = flush()
    if s:
        yield s


def main():
    mapping = {}
    for f in TABLE_FILES:
        path = os.path.join(LANG, f)
        part = parse_table(path)
        overlap = set(part) & set(mapping)
        if overlap:
            sys.exit(f"ERROR: name(s) defined in multiple tables: {sorted(overlap)}")
        mapping.update(part)
    print(f"loaded {len(mapping)} terminal definitions from {', '.join(TABLE_FILES)}")

    # One regex over all names, longest first; the surrounding \b makes matches
    # whole-word so substrings (row in row_reverse) are never touched.
    names = sorted(mapping, key=len, reverse=True)
    word_re = re.compile(r"\b(" + "|".join(re.escape(x) for x in names) + r")\b")

    used = set()
    total = 0
    for f in TARGET_FILES:
        path = os.path.join(LANG, f)
        text = open(path, encoding="utf-8").read()
        count = 0
        out = []
        for kind, chunk in segments(text):
            if kind != "code":
                out.append(chunk)
                continue

            def repl(m):
                nonlocal count
                name = m.group(1)
                count += 1
                used.add(name)
                return mapping[name]

            out.append(word_re.sub(repl, chunk))
        open(path, "w", encoding="utf-8").write("".join(out))
        print(f"  {f}: {count} replacements")
        total += count

    print(f"total replacements: {total}")
    unused = sorted(set(mapping) - used)
    print(f"unused terminals (defined but never referenced): {len(unused)}")

    for f in TABLE_FILES:
        os.remove(os.path.join(LANG, f))
        print(f"removed {os.path.join(LANG, f)}")


if __name__ == "__main__":
    main()
