# docs/

## Step 1 — Collect formal syntax from MDN

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

## Known issues

- Pseudo-elements URLs in `reference/` were malformed and have been fixed.
- A few entries have no formal syntax block on MDN; leave them out and note them.
