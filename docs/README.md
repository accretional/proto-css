# proto-css Docs

Reference documentation for the CSS → EBNF grammar project.

---

## What is written

### Properties — `lang/property.ebnf`

523 CSS properties, each with:
- A `_prop` rule defining the value syntax (e.g. `color_prop`)
- An `_expr` rule for the full declaration including `!important` (e.g. `color_expr = color , colon_symbol , color_prop , [ exclamation_mark_symbol , important ] , semicolon_symbol`)
- A top-level `property` union rule covering all 523 `_expr` rules

Shorthand properties reference their constituent `_prop` rules (not raw keywords). Source data in `docs/data/properties.json`.

### At-rules — `lang/atrule.ebnf`

All 21 standard CSS at-rules:
`@charset`, `@color-profile`, `@container`, `@counter-style`, `@font-face`,
`@font-feature-values`, `@font-palette-values`, `@import`, `@keyframes`,
`@layer`, `@media`, `@namespace`, `@page`, `@position-try`, `@property`,
`@scope`, `@starting-style`, `@supports`, `@view-transition`, `@viewport`,
`@font-feature-values` sub-rules (`@annotation`, `@character-variant`,
`@ornaments`, `@styleset`, `@stylistic`, `@swash`).

### Functions and data types — `lang/functions.ebnf`, `lang/datatype.ebnf`

All CSS function types (`color-mix()`, `calc()`, `env()`, `image-set()`, grid track functions, etc.) and data types (`<color>`, `<image>`, `<gradient>`, `<transform-function>`, `<basic-shape>`, `<position>`, etc.). Primitive types (`<length>`, `<number>`, `<angle>`, etc.) are defined as opaque terminals in `lang/primitive.ebnf`.

### Selectors — `lang/selector.ebnf`

Full CSS selector hierarchy:
- **Basic**: type, universal, class (`.foo`), ID (`#foo`), attribute (`[attr~=val]`)
- **Compound and complex**: `CompoundSelector`, `ComplexSelector`, with combinator support (`>`, `+`, `~`, `||`, and descendant)
- **Lists**: `ComplexSelectorList`, `ForgivingSelectorList`, `CompoundSelectorList`, `RelativeSelectorList`
- **Nested CSS**: `NestedCompoundSelector` (with `&`), `NestedComplexSelector`, `NestedComplexSelectorList`
- **`NoPe` variants**: selector forms excluding `PseudoElement`, used as arguments to `:is()`, `:not()`, `:where()`

**Descendant combinator** — encoded implicitly. The CSS spec defines the descendant combinator as whitespace between two selectors in the absence of another combinator. Because the parser skips whitespace automatically, the combinator inside the complex-selector repetition is made optional (`{ [ Combinator ] , CompoundSelector }`): an absent explicit combinator with consumed whitespace represents a descendant relationship. CSS comments inside the whitespace (e.g. `div /* c */ span`) are also handled transparently. See `lang/GRAMMAR_FIXES.md` Fix 11 for full rationale.

### Pseudo-classes — `lang/pseudo-class.ebnf`

96 of 100 scraped pseudo-classes (4 excluded as non-CSS pages — HTML elements and Web APIs). Includes all functional pseudo-classes (`:is()`, `:not()`, `:has()`, `:nth-child()`, `:lang()`, etc.).

### Pseudo-elements — `lang/pseudo-element.ebnf`

All 29 standard CSS pseudo-elements. 19 simple (`::before`, `::after`, `::backdrop`, etc.), 6 functional (`::highlight()`, `::part()`, `::slotted()`, `::picker()`, `::scroll-button()`, `::cue()`), 4 view-transition (`::view-transition-group()`, `::view-transition-image-pair()`, `::view-transition-new()`, `::view-transition-old()`). Allowable-property constraints (e.g. `::selection` accepts 7 properties) are captured in `docs/data/pseudo-elements.json` but not encoded in EBNF — left to the semantic validation layer.

### Keywords and symbols — `lang/keyword.ebnf`, `lang/symbol.ebnf`

All CSS value keywords used across the grammar. All punctuation and operator symbols (`:`, `::`, `,`, `;`, `{`, `}`, `[`, `]`, `(`, `)`, `!`, `*`, `+`, `~`, `>`, `||`, `|`, `=`, etc.).

### Top-level grammar — `lang/css.ebnf`

```ebnf
css_style_sheet = { at_rules | css_rule } ;
css_rule        = complex_selector_list , "{" , rule_body , "}" ;
rule_body       = { property | nested_css_rule | at_rule } ;
nested_css_rule = nested_complex_selector_list , "{" , rule_body , "}" ;
```

---

## What is not written

### Experimental (no stable formal syntax yet)
- `reading-flow`, `reading-order` — no formal syntax on MDN
- `if()` function — CSS conditional values, still in flux
- `dashed-function` (`--foo()`) — custom functions, still experimental

### Deprecated (intentionally omitted)
- `@document` — non-standard, removed from spec
- `-moz-image-rect()` — Firefox-only, deprecated

### WebKit (`-webkit-`) vendor extensions
The full list (~110 items: properties, pseudo-classes, pseudo-elements, media features) is in `docs/data/webkit_extensions.json`. Not written in EBNF because:
- Most have standard replacements already covered (e.g. `:-webkit-any()` → `:is()`)
- Many are Safari-only or discontinued
- MDN documentation is inconsistent with no formal syntax

### `!important` scope
`!important` is syntactically present in all 523 `_expr` rules as `[ exclamation_mark_symbol , important ]`. However, the CSS-wide keywords it interacts with (`initial`, `inherit`, `unset`, `revert`, `revert-layer`) are only in the `all_prop` rule — individual `_prop` rules do not list them. Validators must add CSS-wide keywords universally.

---

## Data files

| File | Contents |
|---|---|
| `docs/data/properties.json` | 93 shorthand properties with `constituent_properties` (from MDN) and `formal_syntax_refs` (parsed from VDS) |
| `docs/data/pseudo-elements.json` | 29 pseudo-elements with syntax, intro, description, parameters, and `allowable_properties` |
| `docs/data/webkit_extensions.json` | All WebKit CSS extensions grouped by section, with standard equivalents where available |

## Reference docs

| File | Contents |
|---|---|
| `docs/GUIDE_TO_EBNF_TRANSFORMATION.md` | VDS → EBNF operator mapping and naming conventions |
| `docs/CSS_EBNF_CONSTRAINTS.md` | Information losses and constraints in the CSS → EBNF translation |
| `docs/syntax/MISSING_SYNTAX.md` | Entries not covered by the scraper and how they were handled |
