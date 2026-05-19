# CSS EBNF Grammar Fixes

Grammar changes made to the CSS EBNF files, based on parsing failures observed through gluon's `ParseAST`. Each fix is grounded in MDN or the relevant W3C spec.

Gluon parser changes (single-character keyword boundary exemption, `%q` quoting bug, `DefaultIsLexical` switch) are tracked separately in the gluon repo and are not listed here.

Fixes that exist solely to work around `||` / `&&` ordering constraints are intentionally **not** applied here — those are EBNF representation limitations, not grammar bugs. They are documented in `docs/CSS_EBNF_CONSTRAINTS.md`.

---

## Fix 1 — `string_literal` was an empty placeholder (`primitive.ebnf`)

**Issue:** `string_literal` had no body — it was defined as a comment:
```ebnf
string_literal = (* Need something for string literals *) ;
```
This caused every grammar rule that referenced `string_type` (font-family names, `src: url(...)`, attribute selector values, `content`, etc.) to silently accept the empty string, so any CSS that actually contained a quoted value failed to parse.

**Fix:** Replaced the placeholder with a real character-level definition. Both quote styles are handled separately so the enclosing delimiter is excluded from the character set.
```ebnf
string_literal       = double_quoted_string | single_quoted_string ;
double_quoted_string = quotation_mark_symbol , { string_char_dq } , quotation_mark_symbol ;
single_quoted_string = apostrophe_symbol     , { string_char_sq } , apostrophe_symbol ;
string_char_dq = " " ... "!" | "#" ... "~" ;   (* 0x20–0x7E excluding " *)
string_char_sq = " " ... "&" | "(" ... "~" ;   (* 0x20–0x7E excluding ' *)
```
Escape sequences (`\<hex>`) are not yet modelled; they are spec-legal but absent from current test files.

**Reference:** [MDN — `<string>`](https://developer.mozilla.org/en-US/docs/Web/CSS/string)

---

## Fix 2 — Syntactic rules renamed to PascalCase; lexical rules kept lowercase (`*.ebnf`)

**Issue:** Every production was treated as syntactic (whitespace-skipping), so `ident_type` absorbed characters across spaces. `li li {}` parsed as selector `lili`; files with descendant-combinator selectors appeared to pass but were silently mis-parsed.

**Fix:** Renamed all structural/syntactic rules to `PascalCase` across `css.ebnf`, `selector.ebnf`, `pseudo-class.ebnf`, `pseudo-element.ebnf`, `property.ebnf`, `atrule.ebnf`, `functions.ebnf`, `combinator.ebnf`, and compound rules in `datatype.ebnf`. Rules that remain lowercase (lexical, no internal WS-skipping):

- Everything in `symbol.ebnf` and `primitive.ebnf`
- Everything in `keyword.ebnf`
- Token-building rules in `datatype.ebnf`: `number_type`, `integer_type`, `percentage_type`, `length_type`, `time_type`, `angle_type`, `frequency_type`, `resolution_type`, `flex_type`, `ident_type`, `ident_start`, `ident_continue`, `custom_ident_type`, `dashed_ident_type`, `hex_color_type`, `string_type`, etc.

**Descendant combinator** — resolved in Fix 11 below.

**Reference:** [MDN — CSS selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors)

---

## Fix 3 — Color channel values in LCH/Lab functions too restrictive (`functions.ebnf`)

**Issue:** `LabFn`, `LchFn`, `OklabFn`, `OklchFn`, and related perceptual color functions only accepted `percentage_type | number_type | none` for channel values. CSS relative color syntax (e.g. `lch(from rebeccapurple l c calc(h + 80))`) uses channel-name identifiers (`l`, `c`, `h`) as channel values, which are `ident_type`. These were rejected.

**Fix:** Introduced `ColorChannelValue` and used it in all affected functions:
```ebnf
ColorChannelValue = percentage_type | number_type | none | ident_type | MathFunctionType | VarFn ;
```

**Reference:** [MDN — CSS relative colors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors/Relative_colors) — channel keywords (`r`, `g`, `b`, `l`, `c`, `h`, etc.) stand for the corresponding channel value of the origin color and resolve to a number at computed-value time.

---

## Fix 4 — `--custom-property` declarations missing from rule bodies (`css.ebnf`)

**Issue:** `RuleBody` only allowed `Property | NestedCssRule | AtRule`. Custom property declarations (`--my-var: value;`) start with a `dashed_ident_type` (`--` prefix), which does not match any standard `Property` rule, so they were rejected.

**Fix:** Added `CustomPropertyDecl` as a first alternative in `RuleBody`:
```ebnf
RuleBody = { CustomPropertyDecl | Property | NestedCssRule | AtRule } ;

CustomPropertyDecl  = dashed_ident_type , colon_symbol , CustomPropertyValue ,
                      [ exclamation_mark_symbol , important ] , semicolon_symbol ;
CustomPropertyValue = { ident_type | number_type | length_type | percentage_type
                      | string_type | ColorType | comma_symbol | solidus_symbol
                      | left_parenthesis_symbol | right_parenthesis_symbol } ;
```

**Reference:** [MDN — custom properties (`--*`)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) — a custom property name must begin with two hyphens (`--`); its value is any sequence of valid CSS tokens.

---

## Fix 5 — `:future()` had no functional form (`pseudo-class.ebnf`)

**Issue:** `PcFuture` was defined as bare `:future` with no argument. The spec also allows `:future(<compound-selector-list>)` to filter which future cues match.

**Fix:**
```ebnf
PcFuture = colon_symbol , future ,
           [ left_parenthesis_symbol , ForgivingSelectorListType , right_parenthesis_symbol ] ;
```

**Reference:** [MDN — `:future`](https://developer.mozilla.org/en-US/docs/Web/CSS/:future) — may optionally accept a compound selector list, mirroring `:current()`.

---

## Fix 6 — Vendor-prefixed pseudo-elements not handled (`pseudo-element.ebnf`)

**Issue:** Pseudo-elements like `::-webkit-file-upload-button`, `::-ms-browse`, `::-moz-placeholder` start with `::` followed by a hyphen and an identifier. No rule matched this pattern, so they were rejected.

**Fix:** Added `PeVendor` as the first alternative in `PseudoElement`:
```ebnf
PeVendor = double_colon_symbol , hyphen_symbol , ident_type ;
```
Placed first so it is always attempted before the specific named rules.

**Reference:** [MDN — pseudo-elements](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-elements) — vendor-prefixed forms (`::-webkit-*`, `::-moz-*`, `::-ms-*`) are widely used in real-world CSS even though they are non-standard.

---

## Fix 7 — `@font-face` block used generic `RuleBody`; `src` and range descriptors not handled (`atrule.ebnf`)

**Issue:** `AtFontFace` was routed through `DeclarationListType = RuleBody`, which only knows standard CSS properties. The `src` descriptor is not a CSS property. `font-weight: 300 700` (a two-value range) is valid only inside `@font-face`; the standard `font-weight` property accepts only one value.

**Fix:** Added a dedicated block type with specific descriptor rules:
```ebnf
AtFontFaceSrcItem    = UrlType , [ format-hint ] , [ tech-hint ]
                     | local , left_parenthesis_symbol ,
                       ( string_type | ident_type ) , right_parenthesis_symbol ;
AtFontFaceSrcDesc    = src        , colon_symbol , AtFontFaceSrcItem ,
                       { comma_symbol , AtFontFaceSrcItem } , semicolon_symbol ;
AtFontFaceWeightDesc = font_weight , colon_symbol , FontFaceWeightDescType , semicolon_symbol ;
AtFontFaceStyleDesc  = font_style  , colon_symbol , FontFaceStyleDescType  , semicolon_symbol ;
AtFontFaceWidthDesc  = font_width  , colon_symbol , FontFaceWidthDescType  , semicolon_symbol ;

AtFontFaceBlock = { Property | AtFontFaceSrcDesc
                  | AtFontFaceWeightDesc | AtFontFaceStyleDesc | AtFontFaceWidthDesc } ;
```
Added missing keyword `src = "src" ;` to `keyword.ebnf`.

**Reference:** [MDN — `@font-face`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face) — `src`, `font-weight` (range), `font-style` (range), and `font-width` (range) are descriptors specific to `@font-face` and differ from their property counterparts.

---

## Fix 8 — `@counter-style` block used generic `RuleBody`; descriptors not handled (`atrule.ebnf`)

**Issue:** `AtCounterStyle` used `DeclarationListType = RuleBody`, which has no knowledge of `system`, `symbols`, `range`, `negative`, `pad`, or `speak-as` — all are `@counter-style`-specific descriptors, not CSS properties.

**Fix:** Added a dedicated block type with one rule per descriptor:
```ebnf
AtCounterStyleSystemDesc   = system   , colon_symbol , CounterStyleSystemType   , semicolon_symbol ;
AtCounterStyleSymbolsDesc  = symbols  , colon_symbol , CounterStyleSymbolType ,
                             { CounterStyleSymbolType } , semicolon_symbol ;
AtCounterStyleRangeDesc    = range    , colon_symbol , CounterStyleRangeType    , semicolon_symbol ;
AtCounterStyleNegativeDesc = negative , colon_symbol , CounterStyleNegativeType , semicolon_symbol ;
AtCounterStylePadDesc      = pad      , colon_symbol , CounterStylePadType      , semicolon_symbol ;
AtCounterStyleSpeakAsDesc  = speak_as , colon_symbol , CounterStyleSpeakAsType  , semicolon_symbol ;

AtCounterStyleBlock = { Property | AtCounterStyleSystemDesc | AtCounterStyleSymbolsDesc
                      | AtCounterStyleRangeDesc | AtCounterStyleNegativeDesc
                      | AtCounterStylePadDesc | AtCounterStyleSpeakAsDesc } ;
```
Added missing keywords to `keyword.ebnf`: `system`, `range`, `negative`, `pad`.

**Reference:** [MDN — `@counter-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/@counter-style) — `system`, `symbols`, `range`, `negative`, `pad`, `speak-as` are all descriptor-only; none are standard CSS properties.

---

## Fix 9 — `ListStyleProp` referenced the property-name keyword instead of the value rule (`property.ebnf`)

**Issue:**
```ebnf
ListStyleProp = [ ListStylePositionProp ] , [ ListStyleImageProp ] , [ list_style_type ] ;
```
`list_style_type` is the keyword terminal `"list-style-type"` (the property name string), not the value rule `ListStyleTypeProp`. The third slot only ever matched the literal string `"list-style-type"`, making `list-style: range-multi-example` (a valid custom counter-style name) unparseable.

**Fix:**
```ebnf
ListStyleProp = [ ListStylePositionProp ] , [ ListStyleImageProp ] , [ ListStyleTypeProp ] ;
```

**Reference:** [MDN — `list-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/list-style) — `<'list-style-type'>` accepts a `<counter-style>` (including custom identifiers), a `<string>`, or `none`.

---

## Fix 10 — Namespace-qualified selectors not handled (`selector.ebnf`)

**Issue:** `TypeSelector = ElementName` and `UniversalSelector = asterisk_symbol` had no provision for a namespace prefix. Selectors like `svg|a` and `*|a` failed at the `|` character.

**Fix:** Added a lexical `ns_prefix` rule and made the prefix optional on both selectors:
```ebnf
ns_prefix = ident_type , vertical_line_symbol
          | asterisk_symbol , vertical_line_symbol ;

TypeSelector      = [ ns_prefix ] , ElementName ;
UniversalSelector = [ ns_prefix ] , asterisk_symbol ;
```
`ns_prefix` is lowercase (lexical) so no whitespace is permitted between the prefix and the pipe.

**Reference:** [MDN — namespace separator (`|`)](https://developer.mozilla.org/en-US/docs/Web/CSS/Namespace_separator)

---

## Fix 11 — Descendant combinator encoded implicitly; `DescendantCombinator` rule removed (`combinator.ebnf`, `selector.ebnf`)

**Issue:** `DescendantCombinator = space_symbol` could never match. The parser (gluon) skips whitespace automatically before every syntactic production, so by the time it attempted to match `space_symbol` the space had already been consumed. Every selector using the descendant combinator (e.g. `li li`, `nav a`, `.bar p`) therefore failed to parse.

A token-level fix (suppressing whitespace-skipping around `space_symbol`) would require changes to gluon's universal parser — undesirable because gluon is a language-agnostic tool that should not carry CSS-specific behaviour.

**Fix:** Removed `DescendantCombinator` from `combinator.ebnf` entirely. The descendant relationship is now encoded implicitly in the complex-selector repetition by making `Combinator` optional:

```ebnf
(* before *)
ComplexSelector = CompoundSelector , { Combinator , CompoundSelector } ;

(* after *)
ComplexSelector = CompoundSelector , { [ Combinator ] , CompoundSelector } ;
```

The same change applies to `NestedComplexSelector` and `ComplexSelectorNoPe`.

**Why this is correct per the CSS spec:**

The CSS spec defines the descendant combinator as *"one or more CSS whitespace characters — space, carriage return, form feed, newline, or tab — between two selectors **in the absence of another combinator**"* (MDN). The spec also states the whitespace may contain any number of CSS block comments (`/* … */`).

The implicit model satisfies all three requirements:

1. **Whitespace required** — lexical compound-selector rules consume identifier characters greedily. Without intervening whitespace, `divspan` is parsed as a single compound selector, not two. Whitespace is the only thing that can separate two compound selectors, so a descendant relationship in the AST implicitly confirms whitespace existed.

2. **In the absence of another combinator** — when an explicit combinator token (`>`, `+`, `~`, `||`) is present it is matched first; the optional `[ Combinator ]` succeeds with that token. When it is absent, the optional is empty and the relationship is descendant.

3. **Comments inside the whitespace** — gluon's whitespace-skipping already consumes CSS block comments together with whitespace in one pass, so `div /* comment */ span` parses as a descendant selector with no extra handling.

**Reference:** [MDN — Descendant combinator](https://developer.mozilla.org/en-US/docs/Web/CSS/Descendant_combinator)
