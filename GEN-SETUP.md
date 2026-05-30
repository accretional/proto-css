# EBNF-Driven CSS HTML Generation

Generate HTML pages with CSS values derived directly from parsed EBNF grammar rules. Each page preserves the structure of its hand-written template — only CSS property values are swapped with grammar-generated ones.

## Architecture

```
lang/*.ebnf  ──►  gluon v2 parser  ──►  GrammarDescriptor
                                              │
chrome-testing/templates/*.html               ▼
        │                            Grammar walker
        │                            (grammargen.go)
        ▼                                    │
  Template cloner  ◄─── generated values ────┘
  (main.go)
        │
        ▼
chrome-testing/generated/*.html  ──►  chromerpc  ──►  gen-screenshots/*.png
                                                              │
                                                              ▼
                                                   generated-gallery.html
```

**Only dependency**: gluon v2 (EBNF parser). No proto-css dependency.

## Quick Start

```bash
# Full pipeline: generate HTML → screenshot → gallery
./chrome-testing/run.sh --generated

# First 20 properties only
START=0 COUNT=20 ./chrome-testing/run.sh --generated

# Rebuild gallery from existing screenshots
./chrome-testing/run.sh --generated --gallery-only
```

## How It Works

### 1. Grammar Parsing

12 EBNF files in `lang/` are concatenated and parsed by gluon v2's `metaparser.ParseEBNF()`, yielding a `GrammarDescriptor` with ~3900 rules. Rules ending in `Expr` (e.g., `AccentColorExpr`) correspond to CSS property value expressions — 528 total.

### 2. CSS Value Generation (`grammargen.go`)

The `Grammar` type walks rule trees to produce random CSS values:

- **Alternation**: splits `Production` list by `ALTERNATION` delimiters, picks one randomly
- **Concatenation**: evaluates items sequentially
- **Terminal**: emits literal string
- **Nonterminal**: recursively evaluates referenced rule
- **Optional/Repetition**: 50% chance to include
- **Group**: evaluates body
- **Range**: picks random character in range

Cycle detection via visited map, max depth 25. CSS-aware spacing suppresses spaces around `(`, `)`, `,`, etc.

`GenN(ruleName, n)` generates up to `n` distinct values, filtering out degenerate results (empty function calls, CSS-wide keywords like `inherit`/`revert`).

### 3. Template Cloning (`main.go`)

For each property:

1. Check if `chrome-testing/templates/{property}.html` exists (525 hand-written templates)
2. If yes: extract all `{property}: {value}` patterns via regex, generate the same count of replacement values from the grammar, do 1-to-1 substitution throughout the file
3. If no: use a fallback generic template with 8 generated values and iframe-based demos

### 4. Screenshotting

`run.sh --generated` uses `snap.sh` with chromerpc (headless Chrome) to capture each generated HTML page at 1440x900.

### 5. Gallery

A single `generated-gallery.html` shows all 528 property screenshots in a responsive grid.

## Key Files

| File | Purpose |
|------|---------|
| `lang/*.ebnf` | CSS EBNF grammar (12 files, ~3900 rules) |
| `chrome-testing/cmd/generate/main.go` | Entry point, template cloning logic |
| `chrome-testing/cmd/generate/grammargen.go` | CSS value generator from grammar rules |
| `chrome-testing/run.sh` | Pipeline: generate → screenshot → gallery |
| `chrome-testing/templates/*.html` | Hand-written HTML templates (525) |
| `chrome-testing/generated/*.html` | Output: templates with grammar-generated values |
| `chrome-testing/gen-screenshots/*.png` | Screenshots of generated pages |
| `chrome-testing/generated-gallery.html` | Gallery page |

## Batched Execution

Process subsets of properties for faster iteration:

```bash
START=0   COUNT=20  ./chrome-testing/run.sh --generated   # properties 0-19
START=20  COUNT=20  ./chrome-testing/run.sh --generated   # properties 20-39
START=100 COUNT=50  ./chrome-testing/run.sh --generated   # properties 100-149
```

Properties are sorted alphabetically by their `Expr` rule name.

## CLI Flags

```
go run ./chrome-testing/cmd/generate/ [flags]

  --start N       Index of first property to process (default: 0)
  --count N       Number of properties, 0 = all (default: 0)
  --lang DIR      Directory with .ebnf files (default: "lang")
  --templates DIR Hand-written template directory (default: "chrome-testing/templates")
  --out DIR       Output directory (default: "chrome-testing/generated")
```

## Stats

- 528 CSS property expressions extracted from grammar
- 523 pages cloned from hand-written templates
- 5 pages using fallback generic template (`grid-column-gap`, `grid-gap`, `grid-row-gap`, `vendor-prop`, `word-wrap`)
- ~3900 grammar rules parsed
