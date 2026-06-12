# genproto audit — pruned rules & grammar issues

`genproto` compiles `lang/*.ebnf` → `proto/css.proto`. It prunes rules
unreachable from `CssStyleSheet`. This documents what was pruned and why, plus
grammar issues found along the way. The grammar is **frozen**; any further
correction is recorded here, not edited into the EBNF.

## Grammar migration: keyword.ebnf + symbol.ebnf inlined (done)

`keyword.ebnf` (1764 rules) and `symbol.ebnf` (36 rules) were flat tables of
`name = "literal" ;`. They were removed and every reference across the other
grammar files was replaced inline with the literal terminal (verbatim, so
special quoting like `'"'`, `"'"`, `"\"`, `"--"`, `"::"` is preserved) by
`tools/inline_keywords.py` (6661 replacements). Effects:

- Rules dropped from 3922 → 2124; messages from ~3600 → **2848**.
- Property keyword + colon now strip cleanly into each `*Expr`'s prefix
  (`FlexDirectionExpr` prefix `["flex-direction", ":"]`), so a declaration is
  just its value + `;` — leaner protos, easier construction.
- Inline `","` terminals let `CollapseCommaList` recognise comma-lists, so the
  separator map is now populated (114 entries) and list values render correctly.
- New genproto pass `uniquifyFields` renames duplicate inline-terminal field
  names within a message (e.g. the four commas in `device-cmyk(c,m,y,k)`), which
  the compiler does not dedup — 44 fields renamed.

## Pruned-rule audit (was 320 pre-inline; 225 post-inline — conclusions unchanged)

Conclusion: pruning is overwhelmingly safe. No CSS property or its value set is
lost; selectors, colors, gradients, shadows, transitions, grid, and flexbox are
all fully representable.

| Bucket | Count | Verdict |
|---|---|---|
| `*Type` / `*TypeItem` | 150 | **0 genuine loss.** 104 redundant with a reachable sibling `*Prop` rule (the grammar defines values twice: `XxxType` and `XxxProp`; properties reference `XxxProp` via `XxxExpr`, so the `Type` twin is pruned with identical values preserved). 46 are orphan-chains never referenced. |
| lowercase (units/primitives/encodings) | 136 | **Expected.** Units (`px`,`em`,`deg`,`ms`,`fr`…), lexical primitives (`digit`,`hex_digit`,`ident_start`,`whole_number`…), and `@charset` encoding labels (`utf_8`,`iso_8859_*`,`shift_jis`…) all sat inside leaf types that scalarized to `string value=1`. They are absorbed into the scalar token (`"16px"` is now just scalar text). |
| `*Fn` | 27 | 6 typed `var()` wrappers (`LengthVarFn`…) folded into the scalar — pass `var(--x)` as the literal string. ~21 math/utility functions — see grammar issue 2 below. |
| misc | ~7 | `GridColumnGapProp`/`GridRowGapProp` superseded by the reachable `GridGapProp` shorthand (the properties still work). `VendorPropRule`/`VendorPropValue` intentionally excluded by the grammar ("not a real CSS property"). `ColorStopListItem`/`AngularColorStopListItem` are CollapseCommaList/NameSequence artifacts; parent list types carry them. |

## Grammar / toolchain issues found (recorded, not fixed)

1. **gluon v2 EBNF parser drops comment-bearing rule bodies.** A `(* … *)`
   comment anywhere inside a rule's right-hand side (leading or between
   alternation arms) makes `ParseEBNF` return an *empty* body for that rule.
   The CSS grammar comments heavily inside alternations (`PseudoClass`,
   `PseudoElement`, many value rules), so the raw source would silently lose
   those rules and orphan everything they reference (~300 rules). **Worked
   around in genproto** by stripping EBNF comments from the parser input before
   `ParseEBNF` (the grammar files keep their comments). This is an upstream
   gluon bug; the gallery generator (`chrome-testing/cmd/gen`) shares it and
   would benefit from the same fix.

2. **Math / utility functions are defined but never wired in.** `sin cos tan
   asin acos atan atan2 exp log pow sqrt hypot sign mod rem random progress
   paint url(as a function) sibling-count sibling-index` are defined in
   `functions.ebnf` but **no rule references them** — they are unreachable in
   the grammar itself, independent of pruning. Consequence: they cannot be
   constructed *structurally*. They remain expressible as literal text in a
   scalarized numeric leaf (e.g. `width: calc(sin(45deg) * 100px)` as a
   `LengthType{value:"…"}`). To make them structural, the grammar would need to
   reference them from `calc-sum` / the math-function value type.

3. **Dangling reference: `miter_clip`.** `StrokeLinejoinProp` references
   `miter_clip`, which no rule defines. genproto drops the dangling field and
   records it in `GENPROTO_DANGLING.txt`. Net effect: `stroke-linejoin` is
   missing its `miter-clip` value.

## Design choices in genproto (intentional)

- **Leaf scalarization.** Atomic value types (`<length>`,`<number>`,`<color>`
  hex, `<string>`,`<ident>`, etc.) and any rule containing a character range
  collapse to `string value=1`. Callers supply the literal token; the renderer
  emits it verbatim. This keeps `css.proto` self-contained (no `unicode/utf_8`
  import) and makes values constructible without building digit trees. The
  trade-off is that `var()`/`calc()`/math live inside the scalar string rather
  than as structured sub-trees.
- **Composite values stay structured.** Colors (named/rgb/hsl/mix), gradients,
  shapes, shadows, shorthands, functions, and keyword enums remain full message
  graphs walked by the reflection renderer.
