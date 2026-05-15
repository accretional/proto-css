# Instructions to write the CSS structure in EBNF Format

## Step 1: Collect formal syntax from MDN

### instructions

For each category in `docs/reference/`, fetch the MDN page for every URL and extract
the formal syntax block (`<h2 id="formal_syntax">` → `<pre><code class="language-css">`).

Write results to `docs/syntax/`, one file per category:

```
docs/syntax/properties.txt
docs/syntax/datatypes.txt
docs/syntax/functions.txt
docs/syntax/atrules.txt
docs/syntax/selectors.txt
docs/syntax/pseudo-classes.txt
docs/syntax/pseudo-elements.txt
docs/syntax/combinators.txt
docs/syntax/miscvalues.txt
```

Format — one entry per line:

```
<name>: <formal syntax string>
```

### Known issues

- Pseudo-elements URLs in `reference/` were malformed and have been fixed.
- A few entries have no formal syntax block on MDN; leave them out and note them in `syntax/MISSING_SYNTAX.md`.

### Pseudo-classes and pseudo-elements

MDN pseudo-class and pseudo-element pages do not have a `#formal_syntax` section. Instead, their syntax is in the `#syntax` h2 section, rendered as a `brush: css` or `brush: plain` pre block showing the selector with its argument signature (e.g. `:nth-child([ <An+B> | even | odd ] [of <complex-selector-list>]?) { /* ... */ }`).

Write a script for these cases. It should target the syntax section, and optionally the formal syntax section if present.

## Step 1.5: Checking the missing syntax

Go through the webpages in `syntax/MISSING_SYNTAX.md` file. For each element in the markdown, mark it if it is `DEPRECATED`, `EXPERIMENTAL`, or `UNCLEAR`:
- `DEPRECATED` if it is mentioned as such in the webpage
- `EXXPERIMENTAL` if it is mentioned as such in the webpage
- `UNCLEAR` if the document has no formal syntax in any part of the page (Syntax, Formal Syntax, etc)

## Step 2: Transforming the formal syntax to EBNF

### Things to note
1. CSS syntax is written in VDS (Value Definition Syntax) format, which isn't so straightforward to transform to EBNF. For example, VDS format has operators that denote repeatable and concatenation of expressions *in any order* for which there's no simple EBNF syntax. Check out our [Guide to EBNF Transformation](GUIDE_TO_EBNF_TRANSFORMATION.md) for the transformation details and [CSS EBNF Constraints](CSS_EBNF_CONSTRAINTS.md) for the constraints encountered.

2. There were quite a lot of doc pages where the formal syntax is not defined. It's either embedded in plain text in the Syntax definition, or expressed in other pages. They are listed in [`syntax/MISSING_SYNTAX.md`](syntax/MISSING_SYNTAX.md) and needs to be handled in a special way.

### Instructions
- Write a script to transform the CSS formal syntax definition to their corresponding EBNF format under `lang/`. Each category should be in their own file, and add the category as prefix to the elements. For example, a CSS type `<basic_shape>` should be written as `basic_shape_type`, and a CSS Function `<color()>` should be written as `color_fn`. Refer to `GUIDE_TO_EBNF_TRANSFORMATION.md` for rules of transformation

- Once they are generated, verify that the EBNF format generated is valid. 
    a. Make sure that there's no name collision in any of the EBNF files
    b. Pick 10 random elements from the generated EBNF file and verify with the source VDS definition

### Order of EBNF file generation
To avoid duplication of implementations, follow a bottom-up dependency implementation in this order:

- [x] Primitives (basics like digit, letter, etc)
- [x] Keywords (pulled from [WebKit](https://github.com/WebKit/WebKit))
- [x] Datatypes
- [x] Functions
- [x] Properties
- [x] At-rules
- [x] Selectors
- [x] Pseudo-classes
- [x] Pseudo-elements
- [x] Combinators
- [x] Top-level CSS