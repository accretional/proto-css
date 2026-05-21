# proto-css

CSS as a formal grammar. 12 EBNF files define the complete syntax of CSS — properties, selectors, at-rules, functions, data types, pseudo-classes, and pseudo-elements. A visual reference with 525 hand-written HTML templates and 528 grammar-generated templates demonstrates every CSS property.

## What's here

- **`lang/`** — 12 EBNF grammar files (~3900 rules covering CSS)
- **`chrome-testing/`** — HTML templates, screenshots, and browsable galleries for all CSS properties
- **`docs/`** — Reference documentation, syntax data, and EBNF transformation guides

## Getting started

Prerequisites: Go, Google Chrome, Python 3.

```bash
./setup.sh          # check prerequisites, build chromerpc, tidy modules
./build.sh          # screenshot all templates, generate galleries
./test.sh           # validate everything
./LET_IT_RIP.sh     # full pipeline + open gallery in browser
```

Generate HTML from EBNF grammar:

```bash
./tools/gen.sh                        # all properties
START=0 COUNT=20 ./tools/gen.sh       # first 20 only
```

## Documentation

| Doc | What it covers |
|---|---|
| [docs/README.md](docs/README.md) | What the grammar covers (and doesn't) |
| [docs/GUIDE_TO_EBNF_TRANSFORMATION.md](docs/GUIDE_TO_EBNF_TRANSFORMATION.md) | How CSS value definition syntax maps to EBNF |
| [docs/CSS_EBNF_CONSTRAINTS.md](docs/CSS_EBNF_CONSTRAINTS.md) | Information losses in the CSS → EBNF translation |
| [GEN-SETUP.md](GEN-SETUP.md) | EBNF-driven HTML generation architecture |
| [chrome-testing/CHROME-SETUP.md](chrome-testing/CHROME-SETUP.md) | Screenshot pipeline setup and workflow |
| [chrome-testing/USAGE_INSTRUCTIONS.md](chrome-testing/USAGE_INSTRUCTIONS.md) | Usage instructions for the chrome-testing module |
