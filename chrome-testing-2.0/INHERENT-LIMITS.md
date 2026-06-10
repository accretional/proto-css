# What can't be shown distinctly in a static headless frame

After the fonts + masks + interaction pass, **375 / 512 properties (73.2%) are
category A** (every value correct *and* visibly distinct). The remaining ~135 are not demo bugs —
each value *is* applied correctly; what's impossible is a *unique per-value render in
one static Chrome screenshot*, given the project rules (grammar-walked values, only
leaf literals replaced, no property logic in the generators).

They fall into the categories below. Categories **A–E** are the ones a user can't
get around: the browser draws nothing different, or the difference only exists in
time / on interaction / in another medium. **F–J** are representation limits —
the value is valid but the grammar's generic representative, or the lack of a
matching font/script/context, makes neighbouring values coincide.

> **Engine truth-table.** Category A below was re-checked against Chrome 149 with
> `CSS.supports`. Several props previously filed here were actually supported and
> only failed for demo reasons — they were retried and are now A (`field-sizing`,
> `overflow-clip-margin`, `text-spacing-trim`, `text-wrap-style`, `table-layout`,
> `color-interpolation`, `vertical-align`). What remains in A is genuinely ignored
> by the engine.

## A. Chrome does not implement the property (or the value)
Nothing any demo can do — the engine ignores it (confirmed against Chrome 149).
`font-smooth`, `text-size-adjust` (desktop), `hanging-punctuation`,
`line-clamp` (standard syntax — only `-webkit-line-clamp` works), `column-wrap`
(multicol-2), `image-resolution`, `text-autospace`,
`line-height-step`, `text-decoration-skip`, `text-decoration-inset`, `box-lines`,
`box-direction`, `overlay`, `dynamic-range-limit`, `margin-trim`, `text-box`
(`-edge`/`-trim` partial), and the whole `mask-border*` family (standard longhands
unimplemented; Chrome only has `-webkit-mask-box-image`).

## B. No visual without user interaction
Pointer shape, resize handle, hover, none exist in a headless still.
`cursor`, `overflow-anchor`, `pointer-events`, `resize`,
`interest-delay`, `interest-delay-start`, `interest-delay-end`, `caret`
(`caret-animation` blink — the *steady* `caret-color`/`caret-shape` are now A).
*(Unlocked across passes: `setFocusEmulationEnabled` renders the steady caret;
a select recipe flips `user-select`; a new `DispatchTouch` op pans a scroll
container so `touch-action` (auto/pan-y scroll vs none/pan-x block) is now A.)*

> **`cursor` — verified wall.** A `Hover` op was added to chromerpc and confirmed
> to fire `:hover` styles, but headless screenshots capture the compositor surface,
> which never includes the OS cursor sprite — so `cursor: grab` vs `crosshair`
> render identically. Showing the pointer shape would require compositing the
> cursor bitmap ourselves (us drawing it, not the engine).

## C. The value is an arbitrary identifier
A name (`--foo` vs `--bar`) produces an identical layout — only *whether* the
wiring connects matters, and that's the same render for every name.
`anchor-scope`, `position-anchor`, `scroll-timeline-name`, `view-timeline-name`,
`view-transition-name`, `view-transition-class`, `will-change`, `timeline-scope`,
`scroll-marker-group`, `scroll-target-group`, `scroll-initial-target`.
*(Where the ident drives a matching counterpart we DID make it distinct —
`anchor-name`, `container-name`, `animation-name` and the `counter-*` family are
now A via a demo-defined anchor / `@container`-named child / keyframes / `content:
counter()` named after the generator's idents.)*

## D. Only manifests on overflow / scroll / container-query / paged media
No static trigger fires the behaviour.
`position-try`, `position-try-fallbacks`, `position-try-order`,
`position-visibility`, `overscroll-behavior(-block/-inline)`, `container`,
`container-type`, `page`,
`page-break-after/-before/-inside`, `break-after` (print values), `orphans`,
`widows`, `column-fill`. *(`overflow-clip-margin` was moved to A — a deliberately
overflowing child under `overflow:clip` renders the margin band.)*

## E. Temporal — a short frame sequence can't distinguish it
Held start/end state or scroll-driven progress look the same across 3–5 frames.
`animation-fill-mode`, `animation-composition`,
`animation-duration` (math values resolve to invalid units), `animation-range(-start/-end)`,
`animation-timeline`, `view-timeline(-axis/-inset)`, `scroll-timeline(-axis)`,
`interpolate-size`, `transition`, `transition-behavior`, `transition-property`
(ident values). *(The valid, visible cases — `animation-name`, `animation-delay`,
`scroll-behavior`, `transition` easing where property≠none — are A. A late-capture
"settle" frame after a finite run flips `animation-iteration-count` to A.)*

## F. Needs a font / script / content the grammar can't supply
A curated face set (RobotoFlex, Inter, EB Garamond, Cormorant, Recursive, Noto
Sans JP, Special Elite, Bungee Spice) — each font-* demo routed to the face that
*carries* its feature — flipped `font-weight/stretch/kerning/style/size-adjust`,
`font-variant-caps/-alternates/-ligatures/-numeric`, `font-synthesis(/-style/-small-caps)`,
`text-orientation`, and (this pass) `font-feature-settings` (EB Garamond carries
smcp/swsh/frac/liga/onum), `font-variation-settings` (a real `AxisValueType` leaf
spans wght/wdth ranges instead of the too-small generic `<number>`) and
`font-palette` (named `@font-palette-values` recolour a COLR font) to A. Still
short of a face/script/character the grammar can supply:
`font` (shorthand collapses every field to its first value),
`font-variant`, `font-variant-east-asian` (partial),
`font-variant-emoji`, `font-variant-position`, `font-width` (Chrome alias
gap vs `font-stretch`), `font-optical-sizing`, `font-language-override`,
`font-synthesis-position`, `font-synthesis-weight`.

## G. Sub-perceptual or context-blind difference
The effect is real but below visual threshold in a thumbnail, or needs CJK/RTL/
punctuation the sample lacks.
`color-interpolation-filters`, `math-depth`, `math-shift`, `baseline-source`,
`hyphenate-limit-chars`, `line-break`, `shape-rendering`,
`shape-image-threshold`, `shape-margin`, `text-box-edge`, `text-box-trim`,
`text-rendering`, `unicode-bidi`, `text-combine-upright`, `ruby-position` (partial),
`ruby-overhang`, `object-view-box` (partial), `text-overflow` (clip/ellipsis ARE
distinct; fade/custom-string coincide), `display` (many keywords map to the same
inline box), `appearance`, `box-flex`, `box-flex-group`, `vector-effect` (only
`non-scaling-stroke` is implemented), `background-clip`, `background-attachment`
(`fixed` is distinct; `scroll`/`local` need scrolling), `box-decoration-break`,
`scrollbar-color`, `forced-color-adjust`, `print-color-adjust`, `image-orientation`
(needs EXIF), `speak-as` (speech), `interactivity`.
*(Moved to A this pass: `color-interpolation`, `text-wrap-style` and `table-layout`
were below threshold in the old demo but render distinctly with a stronger sample —
a multi-stop gradient, a balance-vs-pretty paragraph, and a lopsided-content table.)*

## H. The mask source is opaque (mostly resolved)
A CSS mask reveals by the source's alpha/luminance. Giving the mask source its own
grammar leaf (`MaskUrlType` → an alpha shape SVG) made `mask-image` cut a real
silhouette; `mask-type` (raw SVG `<mask mask-type>`: alpha = full reveal vs
luminance = graded) and `mask-composite` (two overlapping layers — add/subtract/
intersect/exclude) are now A, joining the already-A modifiers (`mask-clip`,
`mask-mode`, `mask-origin`, `mask-position`, `mask-repeat`, `mask-size`). What
remains: `mask` (the shorthand still leads with opaque photo/gradient layers for
most cards) and `mask-border*` (Chrome ships only `-webkit-mask-box-image`).

## I. Math / keyword values that resolve to the same number
*(Largely resolved this pass.)* The headline case was per-terminal coincidence:
every leaf of a `calc()`/`clamp()` drew the *same* sampled length, so neighbouring
math values collapsed. The generator now cycles a different deterministic sample per
terminal position and `CalcValueType` prefers a real length, so `min-width`,
`height`, the `padding-*` and `border-*-width` families and `grid-column-gap` now
vary visibly and are A. What can still coincide are pure trig/anchor expressions
that genuinely evaluate to ~1px regardless of operands — a small residue, not the
whole family.

## J. Deprecated, or a generic representative can't be made meaningful
`clip` (uniform length reps → a degenerate zero-area `rect()`), `content`
(only paints on pseudo-elements / replaced content), `quotes` (the grammar emits
single strings, not the required pairs), `initial-letter` (needs `-webkit-`;
partial), `all` (the meta-shorthand — no own rendering), `grid-template-areas`
(generic area-name string), `position`, `scroll-snap-type`.
