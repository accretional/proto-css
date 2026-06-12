# proto-css

CSS as a formal grammar. 10 EBNF files define the complete syntax of CSS — properties, selectors, at-rules, functions, data types, pseudo-classes, and pseudo-elements (keyword and symbol terminals are inlined). The grammar compiles to a protobuf AST exposed as a gRPC parse/render service, and to a visual reference of grammar-generated templates demonstrating every CSS property.

## CSS as a gRPC service

`proto/` + `service/` expose CSS parsing and rendering as a structured gRPC
service, derived entirely from the grammar:

```
lang/*.ebnf ──genproto──► proto/css.proto (the CSS AST as protobuf)
                          + MessagePrefix / FieldSeparator tables
                                    │ protoc
                                    ▼
            CssService { Render(CssStyleSheet) → CSS text
                         Parse(CSS text) → CssStyleSheet }
```

- **`lang/cmd/genproto/`** — compiles the EBNF to `proto/css.proto` (2848
  messages) via gluon v2, scalarizing leaf value types and stripping keywords
  into lookup tables. One command, reproducible (`tools/gen_proto.sh`).
- **`service/`** — `Render` and `Parse` are **pure reflection** over the
  generated schema + tables; there is no per-property code. `service/cmd/server`
  runs the gRPC server. See `proto/GENPROTO_AUDIT.md` for what the grammar→proto
  step keeps, drops, and the issues recorded against the (frozen) grammar.
- **`../proto-css-demo/`** — a separate project that generates themed marketing
  pages whose CSS is authored as `CssStyleSheet` textprotos and rendered by the
  service. Demonstrates structured, grammar-validated CSS generation.

```bash
tools/gen_proto.sh      # EBNF → css.proto + Go
tools/test_service.sh   # regenerate + test render/parse
```

## What's here

- **`lang/`** — 10 EBNF grammar files (~2100 rules covering CSS)
- **`chrome-testing/`** — **The CSS Codex**: a specimen atlas where every property/value
  pair is walked from the grammar, rendered in a React gallery, and screenshotted in headless
  Chrome. This is the current gallery — see [its README](chrome-testing/README.md) for the
  screenshot showcase.
- **`chrome-testing/`** — the original hand-written HTML template galleries
- **`docs/`** — Reference documentation, syntax data, and EBNF transformation guides

## Getting started

Prerequisites: Go, Google Chrome, Python 3.

```bash
./LET_IT_RIP.sh     # The CSS Codex: setup → generate → screenshot → serve (chrome-testing)
```

The original template pipeline still lives under `chrome-testing/` (`./build.sh`, `./test.sh`).

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
