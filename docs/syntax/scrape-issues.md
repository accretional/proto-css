# Scrape issues — all categories

## Summary

| Category | URLs | With syntax | Missing | Notes |
|---|---|---|---|---|
| properties | 545 | 543 | 2 | Best coverage |
| functions | 113 | 108 | 5 | Good coverage |
| atrules | 54 | 51 | 3 | Good coverage |
| datatypes | 62 | 28 | 34 | High miss rate — see below |
| selectors | 68 | 0 | 68 | Wrong page structure — see below |
| pseudo-classes | 122 | 2 | 120 | Wrong page structure; 2 scraped are noise entries (`scroll-marker-group`, `@page`) — see below |
| pseudo-elements | 29 | 0 | 29 | Wrong page structure — see below |
| combinators | 5 | 0 | 5 | Wrong page structure — see below |
| miscvalues | 9 | 0 | 9 | Wrong page structure — see below |

---

## Issue 1 — Selectors, pseudo-classes, pseudo-elements, combinators, miscvalues: no formal syntax block on MDN

**Affected:** selectors (68/68), pseudo-classes (120/122), pseudo-elements (29/29),
combinators (5/5), miscvalues (9/9) — **236 actual pseudo-class/selector entries, 0 scraped**.

Note: 2 entries in pseudo-classes did scrape (`scroll-marker-group` and `@page`) but
these are noise entries from Issue 4, not actual pseudo-classes.

These MDN pages use `id="syntax"` (not `id="formal_syntax"`) and show only usage
examples, not CSS Value Definition Syntax. This is expected — selectors and combinators
don't have value grammars; their "syntax" is simply their name/notation.

**Resolution options:**

- **Selectors / pseudo-classes / pseudo-elements**: syntax is trivially their name
  (e.g. `::after`, `:hover`, `:nth-child(An+B)`). Can be enumerated manually or
  sourced from the webref `ed/css.json` `selectors` key (158 entries with `syntax`).
- **Combinators**: 5 tokens (`>`, `+`, `~`, ` `, `||`). Fully hand-enumerable.
- **Miscvalues** (`inherit`, `initial`, `unset`, `revert`, `revert-layer`,
  `fit-content`, `max-content`, `min-content`, `!important`): keyword terminals
  with no VDS grammar. Hand-enumerable.

## Issue 2 — Datatypes: high miss rate (34/62 missing)

Many CSS data type pages on MDN are prose-only reference pages (no formal syntax block),
because the types are defined informally or by specification prose rather than VDS. Examples:

- Primitive types with no formal syntax: `<length>`, `<number>`, `<integer>`,
  `<percentage>`, `<angle>`, `<time>`, `<resolution>`, `<frequency>` — MDN describes
  these in prose, not VDS.
- Abstract/informal types: `<custom-ident>`, `<dashed-ident>`, `<string>`, `<url>`,
  `<ident>`, `<dimension>`, `<hex-color>`, `<named-color>`, `<system-color>`.
- Keyword-set types: `<absolute-size>`, `<relative-size>`, `<baseline-position>`,
  `<content-distribution>`, `<content-position>`, `<overflow-position>`, `<self-position>`.
- Others: `<basic-shape>`, `<shape>`, `<transform-function>`, `<calc-sum>`,
  `<calc-keyword>`, `<flex>`, `<box-edge>`, `<dashed-function>`.

**Resolution**: source these from webref `ed/css.json` `types` key, which has VDS
syntax strings for many of them. Remaining gaps are primitive leaf types that map to
proto scalar fields (analogous to `scalarizeX` in proto-sqlite).

## Issue 3 — Specific missing entries (properties, functions, atrules)

### Properties (2 missing)
- `reading-flow` — very new; MDN page is a stub with no formal syntax block yet.
- `reading-order` — same.

### Functions (5 missing)
- `-moz-image-rect` — deprecated non-standard; no formal syntax block.
- `contrast-color` — very new; stub page.
- `if()` — new CSS conditional function; stub page.
- `sibling-count()` — very new; stub page.
- `sibling-index()` — very new; stub page.

### At-rules (3 missing)
- `@charset` — W3C spec says it's not a real parsed at-rule; MDN prose confirms but
  documents the practical syntax `@charset "<charset>";` inline (not as a formal syntax
  block). Needs manual entry.
- `@document` — deprecated/removed; no formal syntax block.
- `font-display` (second occurrence, under `@font-feature-values`) — the descriptor
  page for this context has no formal syntax block. The standalone `font-display`
  descriptor under `@font-face` did scrape successfully.

## Issue 4 — Reference doc quality issues

### Selectors reference: URLs have `#syntax` fragment appended
All 68 URLs in `selectors-reference.md` end with `#syntax` (e.g. `:hover#syntax`),
making the extracted name `:hover#syntax` instead of `:hover`. This is a formatting
issue in the reference doc — these fragment anchors are client-side only and don't
affect page fetching, but they corrupt the name extraction. Fix: strip `#...` from
URLs before name extraction in the scraper, or clean up the reference doc.

### Pseudo-classes reference: many non-selector URLs
The pseudo-classes reference contains category anchor links (e.g.
`Pseudo-classes#elemental_pseudo-classes`) and unrelated page links (`textarea`,
`input`, `WebVTT_API`, `View_Transition_API`, `scroll-marker-group`, `@page`) mixed
in with actual pseudo-class entries. These should be removed from the reference doc.

### Duplicate URLs in properties reference
`inset`, `inset-block`, `inset-inline`, `list-style` each appear twice.

### Properties reference: two files, only one is MDN
`properties-reference.md` contains w3schools URLs; `mdnproperties-reference.md` contains MDN URLs.
The scraper must use `mdnproperties-reference.md` for properties — the w3schools pages have no
formal syntax block and will produce 100% NO_SYNTAX output.
