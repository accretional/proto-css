# CSS → EBNF Translation Constraints

Constraints and information losses that occur when translating CSS documentation
(MDN, W3C VDS) into EBNF. These are not structural decisions we made — they are
inherent gaps between what the CSS spec expresses and what EBNF can represent.

---

## VDS → EBNF Translation

### `||` loses the "at least one" requirement

CSS VDS `a || b || c` means *one or more* of the operands, any order.
Translated as `[ a ] , [ b ] , [ c ]` — which allows all three to be absent.
The "at least one must be present" constraint is dropped silently.

### `||` and `&&` both lose ordering flexibility

`a || b || c` (any order, one or more) and `a && b && c` (any order, all required)
both become sequential EBNF. The CSS spec permits any order; the EBNF fixes a
canonical order. Parsers accepting out-of-order values need the render layer to
handle reordering.

### `{m,n}` bounded repetition must be manually expanded

CSS VDS `expr{2,4}` (between 2 and 4 occurrences) has no EBNF equivalent.
Must be written as `expr , expr , [ expr ] , [ expr ]` — verbose, and the
bounds are no longer visible in the grammar.

### `expr!` "at least one non-default" is unrepresentable

The `!` suffix in CSS VDS means at least one component in a bracketed group
must be set to a non-initial value. No EBNF construct captures this.
Noted in comments where encountered; constraint lives in the render layer only.

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

`initial`, `inherit`, `unset`, `revert`, and `revert-layer` are valid values for
every CSS property but the formal syntax of individual properties almost never
lists them. They appear in `docs/syntax/miscvalues.txt` and are defined in the
`all_prop` rule, but are not injected into each `_prop` rule. Any property
validator must add them universally.

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
context-free grammar without a dedicated rule-body variant per pseudo-element.
Left to the semantic/validation layer.

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
have standard replacements (e.g. `:-webkit-any()` → `:is()`), some are deprecated
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
