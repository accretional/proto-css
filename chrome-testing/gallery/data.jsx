/* ============================================================
   THE CSS CODEX — Data Contract (§9)
   The frontend renders purely from window.CODEX.
   Focus families (flexbox, transforms, color) are richly authored;
   all others are catalogued honestly and degrade gracefully.
   ============================================================ */

(function () {
  // compact value helper:  v(value, cssDeclaration, note, label?)
  const v = (value, css, note, label) => ({ value, css, note, label: label || value });

  // ---------------------------------------------------------
  // FOCUS FAMILY 1 — FLEXBOX  (demonstrator: flex playground)
  // ---------------------------------------------------------
  const FLEXBOX = {
    id: "flexbox", sigil: "03", title: "Flexbox", focus: true,
    demo: "flex", sampleKind: "flex", count: 17, group: "families",
    blurb: "One-dimensional layout. A flex container distributes free space along a main axis and aligns its children across the cross axis. Every property here answers a single question: where does the slack go?",
    properties: [
      {
        number: 38, name: "justify-content", maturity: "modern",
        description: "Distributes leftover space along the main axis — the master control for horizontal rhythm in a row.",
        syntax: "normal | <content-distribution> | <content-position>",
        ebnf: "justify-content =\n  normal                |\n  <content-distribution>|\n  <overflow-position>? <content-position>\n\n<content-distribution> =\n  space-between | space-around |\n  space-evenly  | stretch",
        valueType: "keyword", defaultValue: "space-between",
        related: ["align-items", "justify-items", "place-content", "gap"],
        values: [
          v("flex-start", "justify-content: flex-start;", "Items packed toward the start of the main axis."),
          v("center", "justify-content: center;", "Items collected at the centre, slack split to the outside."),
          v("flex-end", "justify-content: flex-end;", "Items packed toward the end."),
          v("space-between", "justify-content: space-between;", "First and last flush to the edges; equal gaps between."),
          v("space-around", "justify-content: space-around;", "Equal space around each item — edges get a half-gap."),
          v("space-evenly", "justify-content: space-evenly;", "Every gap, including the edges, is identical."),
        ],
      },
      {
        number: 39, name: "align-items", maturity: "modern",
        description: "Aligns items along the cross axis — the default cross-axis position for every child at once.",
        syntax: "normal | stretch | <baseline-position> | <self-position>",
        ebnf: "align-items =\n  normal | stretch |\n  <baseline-position> |\n  <overflow-position>? <self-position>",
        valueType: "keyword", defaultValue: "center",
        related: ["align-self", "align-content", "justify-content", "place-items"],
        values: [
          v("stretch", "align-items: stretch;", "Items grow to fill the cross axis (the initial value)."),
          v("flex-start", "align-items: flex-start;", "Aligned to the cross-start edge."),
          v("center", "align-items: center;", "Centred on the cross axis."),
          v("flex-end", "align-items: flex-end;", "Aligned to the cross-end edge."),
          v("baseline", "align-items: baseline;", "Text baselines line up regardless of box height."),
        ],
      },
      {
        number: 40, name: "flex-direction", maturity: "modern",
        description: "Sets which way the main axis points — turning a row into a column and reversing flow.",
        syntax: "row | row-reverse | column | column-reverse",
        ebnf: "flex-direction =\n  row | row-reverse |\n  column | column-reverse",
        valueType: "keyword", defaultValue: "row",
        related: ["flex-wrap", "flex-flow", "writing-mode"],
        values: [
          v("row", "flex-direction: row;", "Main axis follows the inline direction — left to right."),
          v("row-reverse", "flex-direction: row-reverse;", "Inline direction, reversed."),
          v("column", "flex-direction: column;", "Main axis runs block-wise — top to bottom."),
          v("column-reverse", "flex-direction: column-reverse;", "Block direction, reversed."),
        ],
      },
      {
        number: 41, name: "flex-wrap", maturity: "modern",
        description: "Allows items to break onto new lines instead of shrinking to fit a single track.",
        syntax: "nowrap | wrap | wrap-reverse",
        ebnf: "flex-wrap = nowrap | wrap | wrap-reverse",
        valueType: "keyword", defaultValue: "wrap",
        related: ["flex-flow", "flex-direction", "align-content"],
        values: [
          v("nowrap", "flex-wrap: nowrap;", "Single line; items shrink past their basis if needed."),
          v("wrap", "flex-wrap: wrap;", "Overflowing items flow to the next line."),
          v("wrap-reverse", "flex-wrap: wrap-reverse;", "Wraps upward — new lines stack before, not after."),
        ],
      },
      {
        number: 42, name: "gap", maturity: "modern",
        description: "The gutter between flex (or grid) items — replaces margin hacks with a single honest value.",
        syntax: "<'row-gap'> <'column-gap'>?",
        ebnf: "gap = <length-percentage [0,∞]>{1,2}",
        valueType: "length", defaultValue: "16px",
        min: 0, max: 64, step: 2, unit: "px",
        related: ["row-gap", "column-gap", "justify-content"],
        values: [
          v("0px", "gap: 0px;", "No gutter."),
          v("8px", "gap: 8px;", "Tight."),
          v("16px", "gap: 16px;", "Comfortable."),
          v("32px", "gap: 32px;", "Airy."),
        ],
      },
      {
        number: 43, name: "align-content", maturity: "modern",
        description: "Distributes space between wrapped lines on the cross axis — only meaningful once content wraps.",
        syntax: "normal | <content-distribution> | <content-position>",
        ebnf: "align-content =\n  normal | <baseline-position> |\n  <content-distribution> |\n  <overflow-position>? <content-position>",
        valueType: "keyword", defaultValue: "space-between",
        related: ["align-items", "flex-wrap", "place-content"],
        values: [
          v("flex-start", "align-content: flex-start;", "Lines packed to the cross-start."),
          v("center", "align-content: center;", "Lines collected at the centre."),
          v("space-between", "align-content: space-between;", "First/last lines to the edges; equal space between."),
          v("space-around", "align-content: space-around;", "Equal space around each line."),
          v("stretch", "align-content: stretch;", "Lines grow to fill the cross axis."),
        ],
      },
      {
        number: 44, name: "flex-grow", maturity: "modern",
        description: "A unitless growth factor — how greedily an item claims a share of leftover space.",
        syntax: "<number [0,∞]>",
        ebnf: "flex-grow = <number [0,∞]>",
        valueType: "number", defaultValue: "1",
        min: 0, max: 4, step: 1,
        related: ["flex-shrink", "flex-basis", "flex"],
        values: [
          v("0", "flex-grow: 0;", "Never grows past its basis."),
          v("1", "flex-grow: 1;", "Takes an equal share of free space."),
          v("2", "flex-grow: 2;", "Claims twice the share of its siblings."),
          v("3", "flex-grow: 3;", "Claims three times the share."),
        ],
      },
    ],
  };

  // ---------------------------------------------------------
  // FOCUS FAMILY 2 — TRANSFORMS (demonstrator: 3D stage)
  // ---------------------------------------------------------
  const TRANSFORMS = {
    id: "transforms", sigil: "17", title: "Transforms", focus: true,
    demo: "transform3d", sampleKind: "box3d", count: 11, group: "families",
    blurb: "Re-map an element's coordinate space without disturbing layout. Translate, rotate, scale and skew compose into a single matrix; add perspective and the plane lifts into three dimensions.",
    properties: [
      {
        number: 211, name: "transform", maturity: "modern",
        description: "The shorthand stage — an ordered list of transform functions applied right-to-left to the box.",
        syntax: "none | <transform-list>",
        ebnf: "transform = none | <transform-function>+\n\n<transform-function> =\n  translate() | scale() | rotate() |\n  skew() | matrix() | perspective() |\n  rotate3d() | translate3d() | …",
        valueType: "function", defaultValue: "rotate(-12deg) scale(1.05)",
        related: ["translate", "rotate", "scale", "transform-origin", "transform-style"],
        values: [
          v("none", "transform: none;", "The identity — box sits in its natural place."),
          v("rotate(-12deg) scale(1.05)", "transform: rotate(-12deg) scale(1.05);", "A tilt and a touch of zoom."),
          v("rotateY(40deg)", "transform: rotateY(40deg);", "Swung around the vertical axis (needs perspective)."),
          v("skewX(-14deg)", "transform: skewX(-14deg);", "Sheared along the horizontal."),
          v("translate(24px, -12px) rotate(8deg)", "transform: translate(24px, -12px) rotate(8deg);", "Moved and tilted together."),
        ],
      },
      {
        number: 212, name: "rotate", maturity: "modern",
        description: "The individual rotation property — independent of translate and scale, so each can animate alone.",
        syntax: "none | <angle> | [ x | y | z | <number>{3} ] && <angle>",
        ebnf: "rotate =\n  none |\n  <angle> |\n  [ x | y | z | <number>{3} ] && <angle>",
        valueType: "angle", defaultValue: "30deg",
        min: -180, max: 180, step: 1, unit: "deg",
        related: ["transform", "translate", "scale", "rotate3d"],
        values: [
          v("0deg", "rotate: 0deg;", "No rotation."),
          v("30deg", "rotate: 30deg;", "Gentle clockwise tilt."),
          v("90deg", "rotate: 90deg;", "Quarter turn."),
          v("180deg", "rotate: 180deg;", "Upside-down."),
        ],
      },
      {
        number: 213, name: "scale", maturity: "modern",
        description: "Independent scaling along x and y — values above 1 enlarge, below 1 shrink, negative mirrors.",
        syntax: "none | <number-percentage>{1,3}",
        ebnf: "scale = none | [ <number> | <percentage> ]{1,3}",
        valueType: "number", defaultValue: "1.2",
        min: 0.2, max: 2, step: 0.05,
        related: ["transform", "rotate", "translate"],
        values: [
          v("0.6", "scale: 0.6;", "Shrunk to 60%."),
          v("1", "scale: 1;", "Natural size."),
          v("1.2", "scale: 1.2;", "Enlarged 20%."),
          v("1.6", "scale: 1.6;", "Enlarged 60%."),
        ],
      },
      {
        number: 214, name: "translate", maturity: "modern",
        description: "Moves the box along x, y and z without removing it from flow — pairs cleanly with transitions.",
        syntax: "none | <length-percentage> [ <length-percentage> <length>? ]?",
        ebnf: "translate =\n  none |\n  <length-percentage>\n  [ <length-percentage> <length>? ]?",
        valueType: "length", defaultValue: "24px",
        min: -80, max: 80, step: 2, unit: "px",
        related: ["transform", "rotate", "scale", "inset"],
        values: [
          v("0px", "translate: 0px;", "In place."),
          v("24px", "translate: 24px;", "Nudged along x."),
          v("0 28px", "translate: 0 28px;", "Pushed down the y axis."),
          v("-30px -16px", "translate: -30px -16px;", "Up and to the left."),
        ],
      },
      {
        number: 215, name: "perspective", maturity: "modern",
        description: "Distance from the viewer to the z=0 plane — smaller values exaggerate depth dramatically.",
        syntax: "none | <length [0,∞]>",
        ebnf: "perspective = none | <length [0,∞]>",
        valueType: "length", defaultValue: "600px",
        min: 200, max: 1400, step: 20, unit: "px",
        related: ["perspective-origin", "transform-style", "transform"],
        values: [
          v("300px", "perspective: 300px;", "Strong, fish-eye depth."),
          v("600px", "perspective: 600px;", "Natural depth."),
          v("1000px", "perspective: 1000px;", "Subtle, telephoto depth."),
          v("none", "perspective: none;", "Flat — no foreshortening."),
        ],
      },
      {
        number: 216, name: "transform-origin", maturity: "modern",
        description: "The fixed point a transform pivots and scales around — change it and the whole motion changes.",
        syntax: "[ <length-percentage> | left | center | right | top | bottom ]{1,2} <length>?",
        ebnf: "transform-origin =\n  [ left | center | right |\n    top | bottom | <length-percentage> ]{1,2}\n  <length>?",
        valueType: "keyword", defaultValue: "center",
        related: ["transform", "rotate", "scale", "perspective-origin"],
        values: [
          v("center", "transform-origin: center;", "Pivots about the middle."),
          v("top left", "transform-origin: top left;", "Pivots about the top-left corner."),
          v("bottom right", "transform-origin: bottom right;", "Pivots about the bottom-right corner."),
          v("top center", "transform-origin: top center;", "Hangs from the top edge."),
        ],
      },
      {
        number: 217, name: "transform-style", maturity: "modern",
        description: "Whether descendants live in their own flattened plane or share the parent's 3D space.",
        syntax: "flat | preserve-3d",
        ebnf: "transform-style = flat | preserve-3d",
        valueType: "keyword", defaultValue: "preserve-3d",
        related: ["perspective", "transform", "backface-visibility"],
        values: [
          v("flat", "transform-style: flat;", "Children are flattened onto the parent's plane."),
          v("preserve-3d", "transform-style: preserve-3d;", "Children keep their own positions in 3D space."),
        ],
      },
    ],
  };

  // ---------------------------------------------------------
  // FOCUS FAMILY 3 — COLOR & OPACITY (demonstrator: color lab)
  // ---------------------------------------------------------
  const COLOR = {
    id: "color", sigil: "12", title: "Color & Opacity", focus: true,
    demo: "color", sampleKind: "swatch", count: 6, group: "families",
    blurb: "How pigment is chosen, mixed and made translucent. Modern CSS treats colour as computation — mixing in any colour space, resolving light and dark at use time, and letting the UA paint its own controls.",
    properties: [
      {
        number: 118, name: "color", maturity: "modern",
        description: "The foreground paint — text, the current value of currentColor, and the default for many other inks.",
        syntax: "<color>",
        ebnf: "color = <color>\n\n<color> =\n  <named-color> | <hex-color> |\n  rgb() | hsl() | oklch() | lab() |\n  color() | color-mix() | currentColor",
        valueType: "color", defaultValue: "var(--accent)",
        related: ["background-color", "opacity", "color-mix", "caret-color"],
        values: [
          v("#c5483c", "color: #c5483c;", "Oxblood — the codex accent."),
          v("oklch(70% 0.15 150)", "color: oklch(70% 0.15 150);", "A botanical green in OKLCH."),
          v("oklch(72% 0.15 250)", "color: oklch(72% 0.15 250);", "A cool slate blue."),
          v("currentColor", "color: currentColor;", "Inherits the cascade's current ink."),
        ],
      },
      {
        number: 119, name: "opacity", maturity: "modern",
        description: "Flattens the whole element — content and background alike — toward transparency in one step.",
        syntax: "<opacity-value>",
        ebnf: "opacity = <number> | <percentage>",
        valueType: "number", defaultValue: "0.6",
        min: 0, max: 1, step: 0.05,
        related: ["color", "filter", "mix-blend-mode", "visibility"],
        values: [
          v("1", "opacity: 1;", "Fully opaque."),
          v("0.6", "opacity: 0.6;", "Partly see-through — the element and its children."),
          v("0.3", "opacity: 0.3;", "Mostly transparent."),
          v("0", "opacity: 0;", "Invisible, but still occupies layout and is hit-testable."),
        ],
      },
      {
        number: 120, name: "accent-color", maturity: "modern",
        description: "Tints native form controls — checkboxes, radios, ranges, progress — to your brand in one line.",
        syntax: "auto | <color>",
        ebnf: "accent-color = auto | <color>",
        valueType: "color", defaultValue: "var(--accent)",
        related: ["color-scheme", "caret-color", "color"],
        values: [
          v("#c5483c", "accent-color: #c5483c;", "Oxblood controls."),
          v("oklch(60% 0.15 150)", "accent-color: oklch(60% 0.15 150);", "Botanical green controls."),
          v("oklch(60% 0.15 250)", "accent-color: oklch(60% 0.15 250);", "Slate-blue controls."),
          v("auto", "accent-color: auto;", "Defers to the user agent's own accent."),
        ],
      },
      {
        number: 121, name: "color-scheme", maturity: "modern",
        description: "Declares which schemes an element supports so the UA paints form controls and scrollbars to match.",
        syntax: "normal | [ light | dark | <custom-ident> ]+ && only?",
        ebnf: "color-scheme =\n  normal |\n  [ light | dark | <custom-ident> ]+\n  && only?",
        valueType: "keyword", defaultValue: "dark",
        related: ["accent-color", "light-dark", "color"],
        values: [
          v("light", "color-scheme: light;", "UA controls render in their light palette."),
          v("dark", "color-scheme: dark;", "UA controls render in their dark palette."),
          v("light dark", "color-scheme: light dark;", "Supports both; follows the user's preference."),
          v("normal", "color-scheme: normal;", "No declared preference."),
        ],
      },
      {
        number: 122, name: "color-mix()", maturity: "modern",
        description: "Blends two colours in a chosen colour space — interpolation made declarative, no preprocessor required.",
        syntax: "color-mix( <color-interpolation-method> , [ <color> && <percentage>? ]#{2} )",
        ebnf: "color-mix() =\n  color-mix(\n    <color-interpolation-method>,\n    [ <color> && <percentage>? ],\n    [ <color> && <percentage>? ]\n  )",
        valueType: "function", defaultValue: "color-mix(in oklch, #c5483c 50%, #2f5fd0)",
        related: ["color", "light-dark", "background-color"],
        values: [
          v("color-mix(in oklch, #c5483c, #2f5fd0)", "background: color-mix(in oklch, #c5483c, #2f5fd0);", "Even mix through OKLCH."),
          v("color-mix(in srgb, #c5483c, #2f5fd0)", "background: color-mix(in srgb, #c5483c, #2f5fd0);", "The same two inks mixed in sRGB — note the muddier midpoint."),
          v("color-mix(in oklch, #c5483c 75%, white)", "background: color-mix(in oklch, #c5483c 75%, white);", "A tint — three parts oxblood to one part white."),
        ],
      },
      {
        number: 123, name: "light-dark()", maturity: "modern",
        description: "Resolves to its first or second colour depending on the element's used color-scheme — themeable in one value.",
        syntax: "light-dark( <color> , <color> )",
        ebnf: "light-dark() = light-dark( <color>, <color> )",
        valueType: "function", defaultValue: "light-dark(#1c1813, #ece6d8)",
        related: ["color-scheme", "color", "color-mix"],
        values: [
          v("light-dark(#1c1813, #ece6d8)", "color: light-dark(#1c1813, #ece6d8);", "Ink on paper, bone on ink — text that follows the scheme."),
          v("light-dark(#f3efe4, #0c0d10)", "background: light-dark(#f3efe4, #0c0d10);", "A surface that inverts with the scheme."),
        ],
      },
    ],
  };

  // ---------------------------------------------------------
  // NON-FOCUS FAMILIES — catalogued honestly, generic glass.
  // Terse: name + plain-english description (+ a few values
  // where a generic preview is meaningful).
  // ---------------------------------------------------------
  let N = 1; // running plate number for the lean catalogue
  const lean = (name, description, sampleKind, values) => ({
    number: 300 + (N++), name, description,
    valueType: values ? "keyword" : "none",
    values: values || [],
    defaultValue: values ? values[Math.min(1, values.length - 1)].value : "",
    related: [], maturity: "modern",
  });

  const OTHER = [
    { id: "box-display", sigil: "01", title: "Box Model & Display", demo: "generic", sampleKind: "box", count: 14,
      blurb: "How a box is generated, what kind of formatting context it makes, and what happens when content exceeds it.",
      props: [
        ["display", "Sets the box type and the inner/outer formatting context an element generates.", [["block","display:block;"],["inline","display:inline;"],["flex","display:flex;"],["grid","display:grid;"],["inline-block","display:inline-block;"],["none","display:none;"]]],
        ["position", "Chooses the positioning scheme: normal flow, relative offset, absolute, fixed or sticky.", [["static","position:static;"],["relative","position:relative;"],["absolute","position:absolute;"],["sticky","position:sticky;"]]],
        ["overflow", "What to do with content that overflows the box — clip, scroll, or let it spill.", [["visible","overflow:visible;"],["hidden","overflow:hidden;"],["scroll","overflow:scroll;"],["auto","overflow:auto;"]]],
        ["visibility", "Hides a box while preserving its layout footprint (unlike display:none).", [["visible","visibility:visible;"],["hidden","visibility:hidden;"]]],
        ["box-sizing", "Whether width/height measure the content box or include padding and border.", [["content-box","box-sizing:content-box;"],["border-box","box-sizing:border-box;"]]],
        ["z-index", "Stacking order within a positioning context.", null],
        ["float", "Pulls a box to one side and lets inline content wrap around it.", [["left","float:left;"],["right","float:right;"],["none","float:none;"]]],
      ] },
    { id: "positioning", sigil: "02", title: "Positioning & Inset", demo: "generic", sampleKind: "box", count: 9,
      blurb: "Offsets that place a positioned box relative to its containing block.",
      props: [
        ["top", "Distance from the containing block's top edge for a positioned box.", null],
        ["inset", "Shorthand for top/right/bottom/left in one declaration.", null],
        ["inset-block", "Logical shorthand for the block-axis offsets.", null],
        ["inset-inline", "Logical shorthand for the inline-axis offsets.", null],
      ] },
    { id: "grid", sigil: "04", title: "Grid", demo: "generic", sampleKind: "box", count: 18,
      blurb: "Two-dimensional layout: explicit tracks, implicit tracks, named areas and line-based placement.",
      props: [
        ["grid-template-columns", "Defines the explicit column tracks of the grid.", null],
        ["grid-template-rows", "Defines the explicit row tracks.", null],
        ["grid-template-areas", "Names regions of the grid as an ASCII map.", null],
        ["grid-auto-flow", "How auto-placed items fill the implicit grid.", [["row","grid-auto-flow:row;"],["column","grid-auto-flow:column;"],["dense","grid-auto-flow:dense;"]]],
        ["grid-area", "Places an item by line numbers or a named area.", null],
        ["place-items", "Shorthand for align-items and justify-items.", null],
      ] },
    { id: "margin", sigil: "05", title: "Spacing — Margin", demo: "generic", sampleKind: "box", count: 11,
      blurb: "Outer space that pushes neighbours away — physical and logical, including margin-trim.",
      props: [
        ["margin", "Shorthand for all four outer margins.", null],
        ["margin-block", "Logical block-axis margins (top/bottom in horizontal writing).", null],
        ["margin-inline", "Logical inline-axis margins (left/right in horizontal writing).", null],
        ["margin-trim", "Trims margins of children that meet the container's edge.", null],
      ] },
    { id: "padding", sigil: "06", title: "Spacing — Padding", demo: "generic", sampleKind: "box", count: 9,
      blurb: "Inner space between the content box and the border, physical and logical.",
      props: [
        ["padding", "Shorthand for all four inner paddings.", null],
        ["padding-block", "Logical block-axis padding.", null],
        ["padding-inline", "Logical inline-axis padding.", null],
      ] },
    { id: "sizing", sigil: "07", title: "Sizing", demo: "generic", sampleKind: "box", count: 16,
      blurb: "Width, height and their min/max bounds — physical, logical, and intrinsic via aspect-ratio.",
      props: [
        ["width", "The content-box (or border-box) width of an element.", null],
        ["aspect-ratio", "Preferred width-to-height ratio when one dimension is auto.", null],
        ["min-inline-size", "Logical minimum size along the inline axis.", null],
        ["max-block-size", "Logical maximum size along the block axis.", null],
      ] },
    { id: "typography", sigil: "08", title: "Typography & Font", demo: "type", sampleKind: "text", count: 28,
      blurb: "Choosing and tuning the typeface — family, size, weight, optical sizing and OpenType features.",
      props: [
        ["font-family", "Prioritised list of typefaces to render text with.", null],
        ["font-weight", "Stroke thickness, from 100 to 900.", [["300","font-weight:300;"],["400","font-weight:400;"],["600","font-weight:600;"],["700","font-weight:700;"]]],
        ["font-style", "Upright, italic, or oblique.", [["normal","font-style:normal;"],["italic","font-style:italic;"]]],
        ["font-variant-numeric", "OpenType numeric figures — tabular, oldstyle, fractions.", [["normal","font-variant-numeric:normal;"],["tabular-nums","font-variant-numeric:tabular-nums;"],["oldstyle-nums","font-variant-numeric:oldstyle-nums;"]]],
        ["font-feature-settings", "Low-level access to OpenType feature tags.", null],
        ["letter-spacing", "Tracking added between characters.", null],
      ] },
    { id: "text-styling", sigil: "09", title: "Text Styling & Decoration", demo: "type", sampleKind: "text", count: 30,
      blurb: "Alignment, transformation, decoration and emphasis applied to runs of text.",
      props: [
        ["text-align", "Horizontal alignment of inline content.", [["left","text-align:left;"],["center","text-align:center;"],["right","text-align:right;"],["justify","text-align:justify;"]]],
        ["text-transform", "Forces case — uppercase, lowercase, capitalize.", [["none","text-transform:none;"],["uppercase","text-transform:uppercase;"],["lowercase","text-transform:lowercase;"],["capitalize","text-transform:capitalize;"]]],
        ["text-decoration-line", "Underline, overline or line-through.", [["none","text-decoration-line:none;"],["underline","text-decoration-line:underline;"],["line-through","text-decoration-line:line-through;"]]],
        ["text-shadow", "One or more drop shadows behind glyphs.", null],
        ["text-indent", "First-line indentation of a block.", null],
      ] },
    { id: "line-spacing", sigil: "10", title: "Line & Inline Spacing", demo: "type", sampleKind: "text", count: 16,
      blurb: "Leading, word and letter spacing, wrapping, breaking and hyphenation.",
      props: [
        ["line-height", "Vertical rhythm — the height of each line box.", [["1","line-height:1;"],["1.5","line-height:1.5;"],["2","line-height:2;"]]],
        ["white-space", "How whitespace and line breaks are handled.", [["normal","white-space:normal;"],["nowrap","white-space:nowrap;"],["pre","white-space:pre;"]]],
        ["word-break", "Rules for breaking within words.", [["normal","word-break:normal;"],["break-all","word-break:break-all;"]]],
        ["hyphens", "Whether and how words may be hyphenated.", [["none","hyphens:none;"],["auto","hyphens:auto;"]]],
      ] },
    { id: "writing-mode", sigil: "11", title: "Writing Mode & Direction", demo: "type", sampleKind: "text", count: 4,
      blurb: "Block direction, inline direction and the orientation of characters.",
      props: [
        ["writing-mode", "Whether lines stack horizontally or vertically.", [["horizontal-tb","writing-mode:horizontal-tb;"],["vertical-rl","writing-mode:vertical-rl;"]]],
        ["direction", "Inline base direction — ltr or rtl.", [["ltr","direction:ltr;"],["rtl","direction:rtl;"]]],
        ["text-orientation", "Orientation of characters in vertical modes.", null],
      ] },
    { id: "backgrounds", sigil: "13", title: "Backgrounds", demo: "generic", sampleKind: "box", count: 16,
      blurb: "Layered fills behind content — colours, images, gradients, position, sizing and blend.",
      props: [
        ["background-color", "A solid fill behind the box.", [["#c5483c","background-color:#c5483c;"],["oklch(60% .12 150)","background-color:oklch(60% 0.12 150);"]]],
        ["background-image", "One or more images or gradients, layered front to back.", [["linear","background-image:linear-gradient(135deg,#c5483c,#2f5fd0);"],["radial","background-image:radial-gradient(circle,#c5483c,#2f5fd0);"],["conic","background-image:conic-gradient(#c5483c,#2f5fd0,#c5483c);"]]],
        ["background-size", "Sizing of each background layer.", [["cover","background-size:cover;"],["contain","background-size:contain;"]]],
        ["background-clip", "The painting area for the background.", [["border-box","background-clip:border-box;"],["text","background-clip:text;-webkit-background-clip:text;"]]],
        ["background-blend-mode", "How background layers blend with each other.", null],
      ] },
    { id: "borders", sigil: "14", title: "Borders, Outlines & Radius", demo: "generic", sampleKind: "box", count: 34,
      blurb: "Edges of the box — style, width, colour, rounded corners, images and outlines.",
      props: [
        ["border-style", "The line style of the border.", [["solid","border:3px solid var(--accent);"],["dashed","border:3px dashed var(--accent);"],["dotted","border:3px dotted var(--accent);"],["double","border:4px double var(--accent);"]]],
        ["border-radius", "Rounds the corners of the border box.", [["0","border-radius:0;border:2px solid var(--accent);"],["8px","border-radius:8px;border:2px solid var(--accent);"],["24px","border-radius:24px;border:2px solid var(--accent);"],["50%","border-radius:50%;border:2px solid var(--accent);"]]],
        ["border-width", "Thickness of the border.", null],
        ["outline", "A line drawn outside the border that does not affect layout.", [["solid","outline:3px solid var(--accent);outline-offset:3px;"],["dashed","outline:3px dashed var(--accent);outline-offset:3px;"]]],
        ["corner-shape", "Shapes corners beyond a simple arc — bevel, notch, squircle.", null],
      ] },
    { id: "effects", sigil: "15", title: "Effects & Filters", demo: "generic", sampleKind: "box", count: 6,
      blurb: "Compositing-level effects: shadows, filters, backdrop filters and blend modes.",
      props: [
        ["box-shadow", "One or more shadows cast by the box.", [["soft","box-shadow:0 18px 40px -12px var(--accent);"],["hard","box-shadow:8px 8px 0 var(--accent);"]]],
        ["filter", "Graphical filters — blur, brightness, contrast, hue-rotate.", [["blur","filter:blur(3px);"],["grayscale","filter:grayscale(1);"],["hue-rotate","filter:hue-rotate(90deg);"],["contrast","filter:contrast(1.6);"]]],
        ["backdrop-filter", "Filters applied to whatever sits behind the element.", null],
        ["mix-blend-mode", "How the element blends with what is below it.", null],
      ] },
    { id: "clip-mask", sigil: "16", title: "Clipping & Masking", demo: "generic", sampleKind: "box", count: 18,
      blurb: "Constrain what is painted — clip paths, masks and their geometry.",
      props: [
        ["clip-path", "A shape that clips the visible region of the box.", [["circle","clip-path:circle(45%);"],["polygon","clip-path:polygon(50% 0,100% 100%,0 100%);"],["inset","clip-path:inset(10% round 12px);"]]],
        ["mask-image", "An image whose alpha masks the element.", null],
        ["clip-rule", "Fill rule used when clipping with a path.", null],
      ] },
    { id: "transitions", sigil: "18", title: "Transitions", demo: "generic", sampleKind: "box", count: 6,
      blurb: "Interpolate property changes over time with a duration, delay and easing curve.",
      props: [
        ["transition-property", "Which properties animate when they change.", null],
        ["transition-duration", "How long the transition takes.", null],
        ["transition-timing-function", "The easing curve of the transition.", [["ease","transition-timing-function:ease;"],["linear","transition-timing-function:linear;"],["ease-in-out","transition-timing-function:ease-in-out;"]]],
        ["transition-behavior", "Whether discrete properties (like display) transition.", null],
      ] },
    { id: "animations", sigil: "19", title: "Animations & Timelines", demo: "generic", sampleKind: "box", count: 22,
      blurb: "Keyframe animations and the scroll/view timelines that can drive them.",
      props: [
        ["animation-name", "The @keyframes rule to run.", null],
        ["animation-duration", "One iteration's length.", null],
        ["animation-timing-function", "Easing between keyframes.", null],
        ["animation-iteration-count", "How many times to play.", null],
        ["scroll-timeline", "Drives an animation from a scroll position.", null],
      ] },
    { id: "scroll", sigil: "20", title: "Scroll Behavior & Snap", demo: "generic", sampleKind: "box", count: 24,
      blurb: "Smooth scrolling, snap points, scroll margins and styled scrollbars.",
      props: [
        ["scroll-behavior", "Smooth or instant programmatic scrolling.", [["auto","scroll-behavior:auto;"],["smooth","scroll-behavior:smooth;"]]],
        ["scroll-snap-type", "Whether and how a scroll container snaps.", null],
        ["scroll-snap-align", "Where an item snaps within the viewport.", null],
        ["scrollbar-width", "Thin, auto or no scrollbar.", [["auto","scrollbar-width:auto;"],["thin","scrollbar-width:thin;"]]],
      ] },
    { id: "object-image", sigil: "21", title: "Object & Image", demo: "generic", sampleKind: "box", count: 6,
      blurb: "How replaced elements like images and video fit and render in their box.",
      props: [
        ["object-fit", "How a replaced element fills its content box.", [["fill","object-fit:fill;"],["contain","object-fit:contain;"],["cover","object-fit:cover;"]]],
        ["object-position", "Alignment of the replaced content within the box.", null],
        ["image-rendering", "The scaling algorithm for images.", [["auto","image-rendering:auto;"],["pixelated","image-rendering:pixelated;"]]],
      ] },
    { id: "columns", sigil: "22", title: "Columns (Multicol)", demo: "type", sampleKind: "text", count: 9,
      blurb: "Flow text into multiple newspaper-style columns with rules and spans.",
      props: [
        ["column-count", "The ideal number of columns.", [["2","column-count:2;"],["3","column-count:3;"]]],
        ["column-gap", "Gutter between columns.", null],
        ["column-rule", "A rule drawn in the gutter.", null],
        ["column-span", "Whether an element spans all columns.", null],
      ] },
    { id: "tables", sigil: "23", title: "Tables", demo: "generic", sampleKind: "box", count: 5,
      blurb: "Table-specific layout: fixed layout, border collapse, caption side and empty cells.",
      props: [
        ["table-layout", "Automatic or fixed column sizing.", [["auto","table-layout:auto;"],["fixed","table-layout:fixed;"]]],
        ["border-collapse", "Whether adjacent cell borders merge.", [["separate","border-collapse:separate;"],["collapse","border-collapse:collapse;"]]],
        ["caption-side", "Where the caption sits relative to the table.", null],
      ] },
    { id: "lists", sigil: "24", title: "Lists & Counters", demo: "type", sampleKind: "text", count: 9,
      blurb: "Markers, generated content and the counters that number things.",
      props: [
        ["list-style-type", "The marker glyph or counter style.", [["disc","list-style-type:disc;"],["decimal","list-style-type:decimal;"],["square","list-style-type:square;"]]],
        ["list-style-position", "Marker inside or outside the principal box.", null],
        ["content", "Generated content for ::before/::after and counters.", null],
        ["counter-increment", "Advances a named counter.", null],
      ] },
    { id: "interactivity", sigil: "25", title: "Interactivity & Cursor", demo: "generic", sampleKind: "box", count: 14,
      blurb: "Pointer behaviour, selection, resizing and the cursor itself.",
      props: [
        ["cursor", "The mouse cursor shown over the element.", [["pointer","cursor:pointer;"],["crosshair","cursor:crosshair;"],["grab","cursor:grab;"],["not-allowed","cursor:not-allowed;"]]],
        ["pointer-events", "Whether the element is a pointer target.", [["auto","pointer-events:auto;"],["none","pointer-events:none;"]]],
        ["user-select", "Whether text can be selected.", [["auto","user-select:auto;"],["none","user-select:none;"]]],
        ["resize", "Whether and how the user can resize the box.", null],
        ["caret-color", "Colour of the text insertion caret.", null],
      ] },
    { id: "containment", sigil: "26", title: "Containment & Performance", demo: "generic", sampleKind: "box", count: 8,
      blurb: "Hints that isolate subtrees so the engine can skip work.",
      props: [
        ["contain", "Limits a subtree's effect on the rest of the page.", [["layout","contain:layout;"],["paint","contain:paint;"],["strict","contain:strict;"]]],
        ["content-visibility", "Skips rendering of off-screen content.", [["auto","content-visibility:auto;"],["hidden","content-visibility:hidden;"]]],
        ["will-change", "Hints which properties are about to animate.", null],
      ] },
    { id: "container-queries", sigil: "27", title: "Container Queries", demo: "generic", sampleKind: "box", count: 3,
      blurb: "Turn an element into a query container so descendants can respond to its size.",
      props: [
        ["container-type", "Establishes a size or inline-size query container.", [["normal","container-type:normal;"],["inline-size","container-type:inline-size;"],["size","container-type:size;"]]],
        ["container-name", "Names a container for targeted @container rules.", null],
      ] },
    { id: "anchor", sigil: "28", title: "Anchor Positioning", demo: "generic", sampleKind: "box", count: 9,
      blurb: "Tether a positioned element to one or more anchor elements.",
      props: [
        ["anchor-name", "Registers an element as an anchor.", null],
        ["position-anchor", "The default anchor for a positioned element.", null],
        ["position-try-fallbacks", "Alternative positions tried to keep the element on-screen.", null],
      ] },
    { id: "offset", sigil: "29", title: "Offset / Motion Path", demo: "generic", sampleKind: "box", count: 6,
      blurb: "Move an element along an arbitrary path with a distance and rotation.",
      props: [
        ["offset-path", "The path the element travels along.", null],
        ["offset-distance", "How far along the path the element sits.", null],
        ["offset-rotate", "How the element rotates as it follows the path.", null],
      ] },
    { id: "shapes", sigil: "30", title: "Shapes (Float Shaping)", demo: "generic", sampleKind: "box", count: 3,
      blurb: "Shape the area that inline content wraps around a float.",
      props: [
        ["shape-outside", "The contour around which content wraps.", null],
        ["shape-margin", "Margin added around the shape.", null],
      ] },
    { id: "view-transitions", sigil: "31", title: "View Transitions", demo: "generic", sampleKind: "box", count: 4,
      blurb: "Name elements so the engine can animate between two DOM states.",
      props: [
        ["view-transition-name", "Tags an element for cross-document/state transitions.", null],
        ["view-transition-class", "Groups named transitions for shared styling.", null],
      ] },
    { id: "svg", sigil: "32", title: "SVG Paint & Geometry", demo: "generic", sampleKind: "box", count: 30,
      blurb: "Paint and geometry properties that apply to SVG figures.",
      props: [
        ["fill", "The paint inside an SVG shape.", null],
        ["stroke", "The paint along an SVG shape's outline.", null],
        ["stroke-width", "Thickness of the stroke.", null],
        ["paint-order", "Order in which fill, stroke and markers paint.", null],
      ] },
    { id: "breaks", sigil: "33", title: "Breaks & Pagination", demo: "generic", sampleKind: "box", count: 10,
      blurb: "Where content may break across pages, columns and regions.",
      props: [
        ["break-inside", "Whether a box may break internally.", [["auto","break-inside:auto;"],["avoid","break-inside:avoid;"]]],
        ["break-before", "Forced or avoided break before a box.", null],
        ["orphans", "Minimum lines left at the bottom of a fragment.", null],
        ["widows", "Minimum lines carried to the next fragment.", null],
      ] },
    { id: "misc", sigil: "34", title: "Misc / Global", demo: "generic", sampleKind: "box", count: 16,
      blurb: "Cross-cutting and global keywords that resist neat classification.",
      props: [
        ["all", "Resets every property at once to a CSS-wide keyword.", null],
        ["zoom", "Scales an element and its layout box.", null],
        ["forced-color-adjust", "Opts in or out of forced-colors remapping.", null],
        ["initial-letter", "Sizes and sinks a drop cap.", null],
      ] },
    // ---- GALLERIES ----
    { id: "selectors", sigil: "35", title: "Selectors & Combinators", demo: "generic", sampleKind: "box", count: 0, group: "galleries", gallery: true,
      blurb: "Not properties but patterns — how rules find their elements. A live sandbox lets you watch matches fire.",
      props: [
        ["descendant ( )", "Matches an element nested anywhere inside another.", null],
        ["child ( > )", "Matches a direct child only.", null],
        [":has()", "The relational pseudo-class — match a parent by its contents.", null],
        [":nth-child()", "Match by position with an an+b formula.", null],
      ] },
    { id: "pseudo", sigil: "36", title: "Pseudo-classes & Elements", demo: "generic", sampleKind: "box", count: 0, group: "galleries", gallery: true,
      blurb: "State and structure selectors, plus the synthetic boxes of ::before, ::marker and ::selection.",
      props: [
        [":hover", "Matches while the pointer is over the element.", null],
        [":focus-visible", "Matches focus that should be visibly indicated.", null],
        ["::before", "A generated box injected before an element's content.", null],
        ["::first-letter", "Targets the first letter of a block for drop caps.", null],
      ] },
    { id: "at-rules", sigil: "37", title: "At-rules", demo: "generic", sampleKind: "box", count: 0, group: "galleries", gallery: true,
      blurb: "Statements that configure the stylesheet itself — media, container, supports, layer, property and keyframes.",
      props: [
        ["@media", "Conditional rules based on viewport and device.", null],
        ["@container", "Conditional rules based on a container's size.", null],
        ["@supports", "Feature detection inside CSS.", null],
        ["@property", "Registers a typed custom property.", null],
        ["@keyframes", "Defines the stages of an animation.", null],
      ] },
    { id: "functions", sigil: "38", title: "Functions & Units", demo: "generic", sampleKind: "box", count: 0, group: "galleries", gallery: true,
      blurb: "The vocabulary of values — relative units and the math, colour and shape functions that compute them.",
      props: [
        ["calc()", "Mixes units and arithmetic in a single value.", null],
        ["clamp()", "A value bounded by a minimum and maximum.", null],
        ["min() / max()", "Pick the smaller or larger of several values.", null],
        ["ch / rem / vw / cqi", "Relative units — to the 0-glyph, root, viewport and container.", null],
      ] },
  ];

  // expand the lean OTHER families into the full Family/Property shape
  const expanded = OTHER.map((f) => ({
    id: f.id, sigil: f.sigil, title: f.title, blurb: f.blurb,
    demo: f.demo, sampleKind: f.sampleKind, count: f.count,
    group: f.group || "families", gallery: !!f.gallery, focus: false,
    properties: f.props.map(([name, desc, vals]) => {
      const values = vals ? vals.map(([value, css]) => v(value, css)) : [];
      return {
        number: 300 + (N++), name, description: desc,
        valueType: values.length ? "keyword" : "none",
        values,
        defaultValue: values.length ? values[Math.min(1, values.length - 1)].value : "",
        related: [], maturity: "modern",
        syntax: "", ebnf: "",
      };
    }),
  }));

  // assemble — focus families first within the property group order
  const focusById = { "box-display": null };
  const all = [FLEXBOX, TRANSFORMS, COLOR, ...expanded];
  // order families by sigil number for the rail/map
  all.sort((a, b) => parseInt(a.sigil, 10) - parseInt(b.sigil, 10));

  window.CODEX = {
    total: 525,
    familyCount: all.filter((f) => f.group !== "galleries").length,
    galleryCount: all.filter((f) => f.group === "galleries").length,
    families: all,
    byId: Object.fromEntries(all.map((f) => [f.id, f])),
  };
})();
