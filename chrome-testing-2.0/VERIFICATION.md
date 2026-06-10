# Screenshot Verification — The CSS Codex

Visual verification of every value screenshot for **(1)** correctness (does the UI
reflect the value) and **(2)** distinctness (do different values look different).
Judged by eye by one multimodal subagent per property over the embed-view frames
in `screenshots/<prop>/` — a single PNG for static values, `frame-*.png` sequences
+ a GIF for temporal ones, a stacked-page PNG for printed (paged) ones. No byte
comparison. The verifier runs through `verify-batch.workflow.js` (one agent per
property, schema-validated verdict):

| | meaning |
|---|---|
| **A** | correct **and** distinct — the goal |
| **B** | value applied but the demos don't look distinct across values |
| **C** | value present but the demo is incorrect / broken |
| **D** | genuinely uncapturable in a headless still (cursor sprite, paged `page`, …) |

## Result

| Category | Count | Share |
|---|---:|---:|
| **A** correct + distinct | **375** | 73.2% |
| **B** applied, not distinct | 114 | 22.3% |
| **C** incorrect / broken | 7 | 1.4% |
| **D** uncapturable in a still | 16 | 3.1% |
| **Total** | 512 | |

Latest verdict per property wins. Trajectory: **89 A** (original) → **264 A**
(contextual demos) → **352 A** (coverage pass) → **368 A** (generator + automation)
→ **375 A** (fonts + masks + interaction). The residual ~135 are overwhelmingly
*inherent* — applied correctly but not uniquely renderable in one static headless
frame — classified with a reason each in [`INHERENT-LIMITS.md`](INHERENT-LIMITS.md).

Every change kept the project rules: the grammar is walked, only the very-last
literal leaves are replaced by representatives, no property logic lives in the
generators — the per-property *demos* (`gallery/demos2.jsx`, `gallery/live.jsx`)
carry the visual context, and genuine grammar bugs are fixed at source (`lang/*.ebnf`).

## What each pass changed

**Contextual demos (→264).** A real demo per family instead of a bare box: borders
paint a visible edge; SVG props render into an actual `<svg>`; lists use a real
`<ul>`; backgrounds/clip/mask use a photo-filled box; grid/flex apply item-level
styles; effects cast against a rich backdrop; 3D transforms sit in a perspective
scene. Variable/feature fonts fetched. Grammar bug fixes (`stroke-dasharray`,
`stroke-linejoin`, `text-decoration-line`, `text-shadow`, corner-radius ordering).

**Coverage pass (→352).** Embed-view capture per value (`#/embed/<family>/<prop>/<i>`);
temporal values post-processed to GIFs.

**Generator + automation (→368).**
- *Per-terminal value permutation* — inside a function/arg list each open-ended leaf
  takes a different, deterministic sample, so `accent-color` shows `rgb(50%, 80%, 30%)`
  not `rgb(50%, 50%, 50%)`; `calc()`/`clamp()` operands vary. Flipped the colour-function
  family + the math-coincidence size props (`min-width`, `height`, padding/border).
- *Matched-ident wiring* — `anchor-name` / `container-name` connect to a demo counterpart.
- *Chrome-149 `CSS.supports` truth-table* corrected mis-filed "unsupported" claims →
  `field-sizing`, `overflow-clip-margin`, `text-spacing-trim`, `text-wrap-style`,
  `table-layout`, `color-interpolation`, `vertical-align`.
- *chromerpc* `setFocusEmulationEnabled` (steady caret → `caret-color`/`caret-shape`),
  a select recipe (`user-select`), a settle late-capture (`animation-iteration-count`).

**Fonts + masks + interaction (→375).** All verified by screenshot.
- *Real OpenType behaviour, real fonts* — `font-feature-settings` / `font-variant-caps`
  route to EB Garamond (carries smcp/swsh/frac/liga/onum); `font-palette` to a COLR font
  with named `@font-palette-values`. → `font-feature-settings`, `font-variant-caps`,
  `font-palette` A.
- *Axis values that move the axis* — a dedicated `AxisValueType` leaf spans the real
  ranges instead of the too-small generic `<number>`. → `font-variation-settings` A.
- *Mask sources that actually mask* — a `MaskUrlType` leaf points the source at an alpha
  cut-out SVG; `mask-type` demoed as raw SVG `<mask mask-type>`; `mask-composite` uses two
  overlapping layers. → `mask-type`, `mask-composite` A; `mask-image` distinct cut-out.
- *Synthetic touch* — a `DispatchTouch` chromerpc op pans a scroll container; before/after
  shows `touch-action: auto/pan-y` scrolling vs `none/pan-x` blocking. → `touch-action` A.
- *Native-control `appearance`* — checkbox/radio/select so `none` (stripped) ≠ `auto`
  (native); the compat keywords coincide *by design* (engine aliases, like `display`).
- *Paged media* — a printed-to-PDF document (print-emulated, rasterised with `pdftoppm`)
  makes page breaks visible. → `break-before`/`-after` page values, `page-break-*`.

## chromerpc capabilities added (in `~/Documents/chromerpc`)

- **`Hover`** (mouseMoved) — renders `:hover` state. Headless captures the compositor
  surface, which excludes the OS cursor sprite, so `cursor` *shape* still can't be shown.
- **`PrintToPdf`** + **`SetEmulatedMedia`** — real paginated output for the paged props.
- **`DispatchTouch`** — touch pan for `touch-action`.

---

*Re-run any slice with* `Workflow({scriptPath: ".../verify-batch.workflow.js", args: "prop-a,prop-b,..."})`.
