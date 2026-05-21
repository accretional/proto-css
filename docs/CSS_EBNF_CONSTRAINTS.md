# CSS to EBNF Translation Constraints

Constraints and information losses that occur when translating CSS documentation
(MDN, W3C VDS) into EBNF. These are inherent gaps between what the CSS spec expresses 
and what EBNF can represent.

## Summary

### Addressed

| Constraint | Short description | Note |
|---|---|---|
| `{m,n}` bounded repetition | No EBNF repetition bounds; manually expanded inline | |
| `expr!` at-least-one | Bracketed group must have ≥1 non-absent component | Alternation patterns A/B/C |
| `#` comma-list | Shorthand for comma-separated list; expanded explicitly | |
| `<'property-name'>` constituent refs | Quoting convention subtle; resolved via `_prop` naming | |
| Pseudo-class/element pages have no formal syntax | No VDS to translate; scraped from `#syntax` section separately | |
| Selector pages have no VDS | Written manually from prose | |
| Primitive types defined in prose | `<length>`, `<number>`, etc. are lexer-level terminals, not VDS | |
| CSS-wide keywords absent from property syntax | `initial`, `inherit`, `unset`, etc. not in per-property rules | `AllProp` wired into every `*Expr` |
| Type definitions duplicated across MDN pages | Same type inlined by multiple property pages; only first processed | |
| `<url-set>` aliased to `image-set()` | Overly permissive but within spec; no MDN page exists | By design |
| Keyword / property name collisions | `left`, `fill`, `clip` etc. are both values and property names | Resolved by cross-reference |

### Not addressed

| Constraint | Short description | Status | Reason |
|---|---|---|---|
| `\|\|` / `&&` ordering fixed | Any-order operands become canonical left-to-right sequence | Partial | Properties with 2–4 operands are enumerated correctly; 5+ operands use an approximate `{ Item }` dispatch (see below) |
| Range annotations stripped | `<integer [0,∞]>` → `integer_type`; range not in grammar | No | Runtime validation only |
| Optional prefix greedily consumes ident | `[prefix]` eats `url` before `url(…)` alternative is tried | Partial | `@namespace` unfixed; 1 known failure |
| MDN formal syntax / constituent properties disagree | `formal_syntax_refs` and `constituent_properties` sometimes differ | No | Both captured in `properties.json`; resolution is property-specific |
| Pseudo-element allowable-property lists | Which properties each `::pseudo` accepts is not expressible in CFG | No | Too many permutations |
| WebKit extensions omitted | ~110 `-webkit-*` items; inconsistent docs, duplicate standard rules | No | Intentional omission |

---

## VDS to EBNF Translation

The main problem here is that CSS is not a pure CFG. CSS rules, which are written in Value Definition Syntax (VDS) 
format, is not completely convertible into EBNF without making a few key decisions.

### `||` loses the "at least one" requirement

CSS VDS `a || b || c` means *one or more* of the operands, any order.
The naive translation `[ a ] , [ b ] , [ c ]` allows all three to be absent,
silently dropping the "at least one must be present" constraint.

The cascading enumeration patterns (2, 3, 4 operands below) naturally enforce
this: every branch starts with a mandatory operand, so the empty case is
excluded. For the 5+ operand approximate pattern `PropItem , { PropItem }`,
the leading `PropItem` (non-optional) enforces at least one operand.

### `||` and `&&` — any-order encoding strategy

CSS VDS `a || b || c` (one or more, any order) and `a && b && c` (all required,
any order) have no native EBNF equivalent. The approach depends on operand count.

#### 2 operands — enumerate both orderings (exact)

```ebnf
Prop = A , [ B ] | B , [ A ] ;
```

Valid states: `A`, `B`, `A B`, `B A`. No invalid states.

#### 3 operands — cascading enumeration (exact)

Pick one operand to lead; the remaining two recurse as a 2-operand any-order:

```ebnf
Prop =
    A , [ B , [ C ] | C , [ B ] ]
  | B , [ A , [ C ] | C , [ A ] ]
  | C , [ A , [ B ] | B , [ A ] ] ;
```

Valid states: all 15 ordered subsets of {A, B, C} of size 1–3. No invalid states.

For `&&` (all required), the outer `[ ]` brackets are dropped — every branch
mandates both remaining operands.

#### 4 operands — cascading with helper rules (exact)

Extract each 3-operand tail as a named helper to keep the rule readable:

```ebnf
PropBCD = B , [ C , [D] | D , [C] ] | C , [ B , [D] | D , [B] ] | D , [ B , [C] | C , [B] ] ;
PropACD = A , [ C , [D] | D , [C] ] | C , [ A , [D] | D , [A] ] | D , [ A , [C] | C , [A] ] ;
PropABD = A , [ B , [D] | D , [B] ] | B , [ A , [D] | D , [A] ] | D , [ A , [B] | B , [A] ] ;
PropABC = A , [ B , [C] | C , [B] ] | B , [ A , [C] | C , [A] ] | C , [ A , [B] | B , [A] ] ;

Prop = A , [ PropBCD ] | B , [ PropACD ] | C , [ PropABD ] | D , [ PropABC ] ;
```

Valid states: all 64 ordered subsets of {A, B, C, D} of size 1–4. No invalid states.

#### 5+ operands — approximate dispatch (inexact)

The number of valid ordered subsets grows as `sum(P(n,k), k=1..n)`:
n=5 → 325, n=6 → 1956, n=8 → 109601, n=21 (font-variant) → astronomical.
Full enumeration is not viable.

**Approximate pattern** — introduce a union item type and allow any sequence:

```ebnf
PropItem = A | B | C | D | E ;
Prop = PropItem , { PropItem } ;
```

This accepts all valid orderings and supersets of valid values. It admits
invalid states (e.g., two `A`s), but that's a compromise we need to have.

Properties using this pattern:
- `<single-animation>` — 8 operands
- `<bg-layer>` / `<final-bg-layer>` — 5–6 operands
- `<mask-layer>` — 6 operands
- `font-variant` — 21 operands

#### Choosing the wrong pattern (known pitfall)

The expression `[ A ] , [ B ] , [ C ]` (each typed separately) looks like
any-order but is actually fixed-order: `solid 1px` fails because slot 1 expects
a width, not a style. The correct 3-operand form requires a union item type
or the cascading enumeration above.

### `{m,n}` bounded repetition must be manually expanded

CSS VDS `expr{2,4}` (between 2 and 4 occurrences) has no EBNF equivalent.
Must be written as `expr , expr , [ expr ] , [ expr ]` — verbose, and the
bounds are no longer visible in the grammar.

### `expr!` "at least one non-default" — representable via alternation

The `!` suffix in CSS VDS means at least one component in a bracketed group
must be present (non-absent). This can be expressed in EBNF by enumerating
the non-empty combinations as explicit alternations rather than wrapping all
components in `[ ]`. Two structural patterns cover all occurrences in the CSS spec:

**Pattern A — internal comma separator: `[ A? , B? ]!`**
The comma only appears when both operands are present.
→ `A | B | ( A , comma_symbol , B )`

**Pattern B — juxtaposition: `[ A? B? ]!`** (also applies to nested optionals `[ A? [B]? ]!`)
→ `( A , [ B ] ) | B`

**Pattern C — ident + zero-or-more: `[ A? B* ]!`**
→ `( A , { B } ) | B , { B }`

#### Rules transformed (2025-05-19)

| File | Rule | VDS `!` form | Translation pattern |
|---|---|---|---|
| `functions.ebnf` | `ImageFn` | `[ <image-src>? , <color>? ]!` | Pattern A |
| `property.ebnf` | `BackgroundPositionXPropItem` | `[ [left\|right\|…]? <length-percentage>? ]!` | Pattern B |
| `property.ebnf` | `BackgroundPositionYPropItem` | `[ [top\|bottom\|…]? <length-percentage>? ]!` | Pattern B |
| `property.ebnf` | `OffsetProp` (via `OffsetPathGroup`) | `[ <offset-position>? [<offset-path> …]? ]!` | Pattern B |
| `atrule.ebnf` | `ScopeBoundariesType` | `[ [(<scope-start>)]? [to (<scope-end>)]? ]!` | Pattern B |
| `atrule.ebnf` | `PageSelectorType` | `[ <ident>? <pseudo-page>* ]!` | Pattern C |

The prior `(* ! at-least-one *)` comment markers in the above rules have been replaced
by the correct alternation structure. No render-layer workaround is needed for these rules.

### `#` comma-list notation is not native to EBNF

CSS VDS `<value>#` means a comma-separated list of one or more values.
EBNF requires explicit expansion: `value , { comma_symbol , value }`.
The `#` shorthand and its comma semantics are invisible in the resulting grammar.

### Range annotations on type references are constraints, not structure

CSS VDS annotates types with value ranges: `<integer [0,∞]>`, `<number [0,100]>`,
`<length [0,∞]>`. These are stripped — the referenced type name is used bare.
Range validity must be enforced at runtime, not in the grammar.

### `<'property-name'>` constituent references aren't obviously constituent

In CSS VDS, `<'outline-width'>` means "accept the same values as the
`outline-width` property" — i.e., a shorthand delegating to a longhand.
This is easy to confuse with a type reference (`<outline-width>` without quotes).
The quoting convention is subtle and required cross-referencing against the
formal syntax to resolve correctly. See also: MDN disagreement below.

### Optional rules greedily consume shared identifier prefixes

When an optional rule `[ A ]` is followed by a mandatory alternative `( B | C )`,
and `A` and `B` both start with an identifier, the optional rule always wins
the leading identifier characters — even when the longer intended match is `B`.

Concrete example: `@namespace [ <ident> ] [ <string> | url(<string>) ]`.
In CSS's tokenizer, `url` and a bare `<ident>` are distinct token types, so
no ambiguity exists at the token level. In EBNF, both are matched by the same
`ident_type` character-level rule, so `[ NamespacePrefixType ]` consumes `url`
as a valid identifier, leaving `(<string>)` stranded — and the whole rule fails.

The only fix within EBNF is to reorder: place the non-optional longer alternatives
before the optional prefix, so that the optional arm is only tried when those fail.
This means the grammar rule order carries information that the CSS spec expresses
through token-type distinctions.

---

## MDN Documentation Constraints

### Pseudo-class and pseudo-element pages have no formal syntax

Pseudo-class and pseudo-element MDN pages use `id="syntax"` with usage examples,
not `id="formal_syntax"` with VDS strings. Their "syntax" is simply their name
and any arguments — there is no VDS grammar to translate. Scraped via a
separate script (`scrape_pseudo.py`) targeting the `#syntax` section.

### Selector pages have no VDS syntax at all

Selectors (type, class, ID, attribute, combinators) have no CSS Value Definition
Syntax. Their syntax is their notation (`div`, `.class`, `#id`, `[attr]`,
`>`, `+`, etc.). Written manually in `lang/selector.ebnf` from MDN's prose
descriptions, not scraped from formal syntax.

### Primitive types are defined in prose, not VDS

`<length>`, `<number>`, `<integer>`, `<percentage>`, `<angle>`, `<time>`,
`<resolution>`, `<frequency>` are described on MDN in prose (e.g.,
"a number followed by a unit"), not as VDS strings. They map to lexer-level
terminals. The EBNF treats them as opaque named rules (`length_type`,
`number_type`, etc.) that ultimately require a tokenizer, not a grammar rule.

### CSS-wide keywords are absent from individual property formal syntax

`initial`, `inherit`, `unset`, `revert`, `revert-layer`, and `revert-rule` are valid
values for every CSS property but the formal syntax of individual properties almost
never lists them. Resolved by `AllProp = initial | inherit | unset | revert |
revert_layer | revert_rule` in `property.ebnf`, wired as a second alternative in every
`*Expr` rule: `prop_name : ( FooProp | AllProp )`. No validator injection needed.

### Formal syntax and constituent_properties section sometimes disagree

MDN's `#constituent_properties` section and the `<'...'>` refs in the formal
syntax sometimes list different properties as constituent (e.g., `outline`
formal syntax includes `<'border-top-color'>` but MDN's constituent list does
not). Both sources are captured in `docs/data/properties.json` under
`formal_syntax_refs` and `constituent_properties` respectively.

### Type definitions appear multiple times across MDN pages

Several types are defined redundantly — e.g., `<color-interpolation-method>`
appears three times in `docs/syntax/datatypes.txt` (inlined by different
property pages that each include it). The transformation script processes only
the first occurrence; subsequent ones are marked `[done]`.

---

## CSS Semantic Constraints (not expressible in EBNF)

### Pseudo-element allowable-property lists

MDN documents which CSS properties each pseudo-element accepts
(e.g., `::selection` accepts only 7 properties; `::first-letter` accepts 57).
This information is scraped into `docs/data/pseudo-elements.json`. It has no
representation in the CSS formal syntax and cannot be expressed in a
context-free grammar without a dedicated rule-body variant per pseudo-element, 
which is too verbose and complicated. Left to the semantic/validation layer.

### `<url-set>` mapped to `image_set_fn`

The `cursor` property formal syntax uses `<url-set>` alongside `<url>`. Per the CSS UI Level 4
spec, `<url-set>` is a restricted form of `image-set()` where the image sub-production is limited
to `<url>` strings (no gradients or generated images). However, the spec also notes that support
for the broader `<image>` type in cursor is "allowed but optional." Accordingly, `url_set_type`
is aliased to `image_set_fn` in `datatype.ebnf` — this is overly permissive (accepts gradients)
but within spec. There is no standalone MDN page for `<url-set>`; the definition is in the
CSS UI Level 4 spec at `https://drafts.csswg.org/css-ui-4/#cursor`.

### WebKit (`-webkit-`) extensions are not written

MDN's WebKit extensions reference lists ~110 items across properties, pseudo-classes,
pseudo-elements, and media features. The documentation is inconsistent: some entries
have standard replacements (e.g. `:-webkit-any()` -> `:is()`), some are deprecated
with no replacement, some are Safari-only, and several have no formal syntax at all.
Rather than encoding vendor-prefixed aliases that duplicate already-written standard
rules, Webkit extensions are omitted from the EBNF. The full list is scraped into
`docs/data/webkit_extensions.json` for reference.

### Keyword name collisions between CSS values and CSS property names

Tokens such as `left`, `right`, `top`, `bottom`, `fill`, `content`, `clip`,
`contain`, `all`, `page`, `stroke` are both CSS keyword values (in property
value lists) and CSS property names (in `<'property-name'>` constituent refs).
Distinguishing the two required cross-referencing each occurrence against the
formal syntax — the grammar itself cannot disambiguate them structurally.
