# Screenshot Validation Report

Generated: 2026-05-29

Validation of all 528 generated CSS property screenshots. Each property was visually inspected and categorized.

## Categories

1. **GOOD** - Distinct, visually unique panels for each CSS value
2. **NOT_UNIQUE** - Valid CSS values but panels look identical or nearly identical (HTML blueprint needs improvement)
3. **BAD_VALUES** - Wrong or invalid generated CSS values (grammar/generator changes needed)
4. **AMBIGUOUS** - Property can't be demonstrated visually, requires interaction, or cause is unclear

## Summary

| Category | Count | Percentage |
|----------|-------|------------|
| GOOD | 310 | 58.7% |
| NOT_UNIQUE | 186 | 35.2% |
| BAD_VALUES | 3 | 0.6% |
| AMBIGUOUS | 29 | 5.5% |

## Multi-Frame Analysis

Properties with temporal/scroll/hover/focus/selection modes produce multiple screenshot frames.
Many temporal (animation/transition) properties show **identical frames** across all 5 captures,
indicating the animation/transition did not trigger or was not captured at the right timing.

| Mode | Properties | Frames Different | Frames Identical |
|------|-----------|-----------------|-----------------|
| temporal (5 frames) | 28 | 5 | 23 |
| scroll (3 frames) | 35 | 8 | 27 |
| hover (2 frames) | 4 | 0 | 4 |
| focus (2 frames) | 5 | 1 | 4 |
| selection (2 frames) | 1 | 1 | 0 |

---

## Category 1: GOOD (310 properties)

These properties show distinct, visually unique panels for each CSS value.

| Property | Notes |
|----------|-------|
| accent-color | Distinct accent colors visible on checkboxes/sliders (red, green, blue, etc.) |
| align-content | Clear differences in content positioning (normal, baseline, space-between, center, stretch) |
| align-items | Numbered items with varying heights clearly show different alignment behaviors |
| align-self | Highlighted item shows distinct positioning across panels (start, end, center, stretch) |
| all | Good contrast between initial/inherit/unset vs revert-layer/revert-rule |
| animation-composition | Frames show animation progress with different rotation angles per composition mode |
| animation-direction | Frames show different positions/colors for normal/reverse/alternate/alternate-reverse |
| animation-duration | Different box positions across frames show varied animation progress |
| animation-fill-mode | Clear visual differences - none/forwards/backwards/both show different box positions and colors |
| animation-play-state | Running circles moving while paused circles stay still |
| animation-timing-function | Circle positions vary between frames showing different easing progressions |
| appearance | Clear differences: none shows plain input, auto/base show dropdown arrow |
| aspect-ratio | Clearly different box shapes (square, wide, tall) for auto/1/0.5/2 |
| backdrop-filter | Distinct visual effects: blur, grayscale, none show original colors |
| backface-visibility | Visible shows mirrored text, hidden shows empty panel |
| background | Distinct gradients per panel with different color combinations |
| background-blend-mode | Excellent variety of blend effects all visually distinct |
| background-clip | Clear differences: content-box, border-box, text, padding-box |
| background-color | Distinct colors visible (red, green, blue, black, white, transparent) |
| background-origin | Clear differences in gradient placement relative to content/padding/border |
| background-position | Dot clearly moves to different positions |
| background-position-x | Blue stripe shifts horizontally across panels |
| background-position-y | Pink stripe shifts vertically across panels |
| background-repeat | Clear differences: repeat-x, repeat-y, no-repeat, space, round |
| background-size | Clear size differences: auto, cover, contain, 50%, 200px |
| baseline-shift | Shifted text clearly moves up/down relative to baseline |
| block-size | Different box heights visible |
| border | Mix of visible border styles clearly different |
| border-block-color | Distinct border colors visible on top/bottom |
| border-block-end-color | Distinct bottom border colors |
| border-block-end-style | Clear style differences: dotted, dashed, solid, double, groove, ridge |
| border-block-end-width | Clear width differences from thin to 50px |
| border-block-start-color | Distinct top border colors |
| border-block-start-style | Clear style differences |
| border-block-start-width | Clear width differences |
| border-block-style | Good variety showing top+bottom border styles with combinations |
| border-block-width | Clear differences in top/bottom border widths |
| border-bottom | Mix of visible styles |
| border-bottom-color | Distinct bottom border colors |
| border-bottom-left-radius | Clear progression from sharp corner to large curve |
| border-bottom-right-radius | Clear progression from sharp corner to large curve |
| border-bottom-style | Clear style differences |
| border-bottom-width | Clear width progression |
| border-collapse | Separate shows spaced cells, collapse shows merged borders |
| border-color | Distinct border colors on boxes |
| border-end-end-radius | Clear progression from sharp to curved |
| border-end-start-radius | Clear progression from sharp to curved |
| border-image | Panels show varied border images with gradients |
| border-image-outset | Visibly different outset distances |
| border-image-slice | Distinct slice values produce different border appearances |
| border-image-width | Clearly different border widths |
| border-inline-color | Several distinct colors visible |
| border-inline-end-color | Several distinct colors visible |
| border-inline-end-style | Clearly distinct styles shown |
| border-inline-end-width | Width differences clearly visible |
| border-inline-start-color | Several distinct colors visible |
| border-inline-start-style | Clearly distinct styles |
| border-inline-start-width | Width differences clearly visible |
| border-inline-style | Many distinct style combinations visible |
| border-inline-width | Width differences clearly visible |
| border-left-color | Several distinct colors visible |
| border-left-style | Clearly distinct styles visible |
| border-left-width | Width differences clearly visible |
| border-radius | Excellent variety of shapes from square to circle |
| border-right-color | Several distinct colors visible |
| border-right-style | Clearly distinct styles |
| border-right-width | Width differences clearly visible |
| border-spacing | Table cell spacing clearly varies |
| border-start-end-radius | Clear progression from sharp to curved |
| border-start-start-radius | Clear progression from sharp to curved |
| border-style | Excellent variety of border styles |
| border-top | Multiple distinct top border variations |
| border-top-color | Several distinct colors visible |
| border-top-left-radius | Clear progression from sharp to curved |
| border-top-right-radius | Clear progression from sharp to curved |
| border-top-style | Clearly distinct styles |
| border-top-width | Width differences clearly visible |
| border-width | Clear width variations |
| bottom | Positioned element moves to different vertical positions |
| box-decoration-break | Slice vs clone clearly different |
| box-flex | Different flex values produce different item widths |
| box-shadow | Excellent variety of shadows |
| box-sizing | Content-box vs border-box clearly shows different sizes |
| caption-side | Top vs bottom clearly shows caption position change |
| clear | Clear differences visible with float clearing |
| clip | Different rect() values produce different clipping |
| clip-path | Excellent variety of clip shapes |
| color | Multiple distinct text colors visible |
| color-interpolation | auto/sRGB vs linearRGB show different gradient blending |
| color-scheme | Light vs dark clearly changes form control appearance |
| column-count | Panels show 1, 2, 3 columns with different text layouts |
| column-fill | auto, balance, balance-all show different column distribution |
| column-gap | Multiple gap values show clearly different spacing |
| column-rule-style | Dotted, dashed, solid, hidden are distinguishable |
| column-span | "all" clearly spans across columns |
| column-width | Varied widths produce different column layouts |
| columns | Shorthand produces visibly different column counts and widths |
| contain-intrinsic-block-size | Different size values show different element heights |
| contain-intrinsic-height | Different height values clearly different |
| contain-intrinsic-inline-size | Different inline-size values show different widths |
| contain-intrinsic-size | Multiple size combinations produce different dimensions |
| contain-intrinsic-width | Different width values clearly different |
| content-visibility | Visible shows content, hidden shows empty space |
| corner-block-end-shape | round, scoop, bevel, notch, square all different |
| corner-block-start-shape | round, scoop, bevel, notch, square all different |
| corner-bottom-left-shape | Each value shows distinct corner shape |
| corner-bottom-right-shape | Each value shows distinct corner shape |
| corner-bottom-shape | Both bottom corners show different shapes |
| corner-end-end-shape | round, scoop, bevel, notch, square each different |
| corner-end-start-shape | round, scoop, bevel, notch, square each different |
| corner-inline-end-shape | Each value shows different shapes |
| corner-inline-start-shape | Each value shows different shapes |
| corner-left-shape | Each value shows different shapes |
| corner-right-shape | Each value shows different shapes |
| corner-shape | Each value shows different all-corner shapes |
| corner-start-end-shape | Each value shows different shapes |
| corner-start-start-shape | Each value shows different shapes |
| corner-top-left-shape | Each value shows different shapes |
| corner-top-right-shape | Each value shows different shapes |
| corner-top-shape | Each value shows different shapes |
| counter-increment | Different increment values show different numbers |
| counter-reset | Different reset values produce different numbering |
| counter-set | Different set values produce different starting points |
| cx | Circle moves horizontally across panels |
| cy | Circle moves vertically across panels |
| d | Four distinct SVG path shapes shown |
| direction | ltr left-aligned, rtl right-aligned |
| display | Many display modes with clearly different layouts |
| empty-cells | Show displays borders, hide removes them |
| field-sizing | Fixed vs content shows different input sizes |
| fill | none, red, gradient, blue all clearly different |
| fill-opacity | Opacity values show clearly different transparency levels |
| fill-rule | nonzero fills entire star, evenodd shows transparent center |
| filter | blur, grayscale, none all clearly distinct |
| flex | Different flex values produce different item sizing |
| flex-basis | Different basis values show different widths |
| flex-direction | row, row-reverse, column, column-reverse all different |
| flex-flow | Different combinations produce different layouts |
| flex-grow | Grow values produce different proportional sizes |
| flex-shrink | Shrink values produce different behaviors |
| flex-wrap | nowrap, wrap, balance show different wrapping |
| float | Different float positions with text wrapping |
| font | Panels show clear size, style, and weight differences |
| font-size | Clear size differences from xx-small to x-large |
| font-size-adjust | Visibly different font sizes due to adjustment metrics |
| font-stretch | Clear differences between condensed and expanded |
| font-style | Clear differences between normal, italic, oblique |
| font-synthesis-style | auto shows italic, none shows upright |
| font-variant-caps | Clear differences between small-caps, all-small-caps, etc. |
| font-variant-emoji | Clear difference between text and emoji presentations |
| font-variant-position | Clear differences between normal, sub, super |
| font-weight | Clear differences between normal, bolder, lighter, bold |
| forced-color-adjust | Well-designed demo with colorful UI elements |
| gap | Clear visual differences in spacing between grid items |
| grid | Distinct layouts showing different grid configurations |
| grid-area | Pink item clearly positioned differently in each grid |
| grid-auto-columns | Auto columns show different widths |
| grid-auto-flow | Clear differences between row, column, dense |
| grid-auto-rows | Auto rows show different heights |
| grid-column | Item spans different column positions |
| grid-column-end | Item spans differently with distinct visual results |
| grid-column-start | Item positioned at different column starts |
| grid-gap | Clear spacing differences |
| grid-row | Item spans different row positions |
| grid-row-end | Item spans 1 vs 2 rows with clear difference |
| grid-row-start | Item positioned at different row starts |
| grid-template | Different template configurations produce different layouts |
| grid-template-columns | Clear column layout differences |
| grid-template-rows | Clear row height differences |
| height | Clear height differences from 10px to stretch |
| hyphens | auto shows hyphenation, none and manual do not |
| image-rendering | Visible differences between auto, pixelated, crisp-edges |
| inline-size | Clear width differences |
| inset | Positioned elements at different inset values |
| inset-block | Clear vertical positioning differences |
| inset-block-end | Element positioned at different distances from bottom |
| inset-block-start | Element positioned at different distances from top |
| inset-inline | Clear horizontal positioning differences |
| inset-inline-end | Element at different distances from right edge |
| inset-inline-start | Element at different distances from left edge |
| isolation | Clear difference between auto and isolate blending |
| justify-content | Visibly different item spacing/alignment |
| justify-self | Target element visibly shifts position |
| left | Pink box clearly shifts horizontal position |
| letter-spacing | Clear visual differences in character spacing |
| line-clamp | Text clamped to different line counts |
| line-height | Different line spacing from overlapping to spacious |
| list-style | Varied list markers (bullets, numbers, custom strings) |
| list-style-position | Clear difference between inside and outside |
| margin | Content box shifts with different margin values |
| margin-block | Different vertical spacing from siblings |
| margin-block-end | Visible differences in spacing below |
| margin-block-start | Visible differences in spacing above |
| margin-bottom | Visible differences in bottom spacing |
| margin-inline | Different horizontal positioning |
| margin-inline-end | Visible differences in right-side spacing |
| margin-inline-start | Visible differences in left-side spacing |
| margin-left | Content shifts right with different margin-left values |
| margin-right | Visible differences in right-side spacing |
| margin-top | Visible differences in top spacing |
| margin-trim | Different trimming behavior with dashed borders |
| marker | No markers, arrow markers, dot markers clearly different |
| marker-end | No end marker, arrow, dot at end |
| marker-mid | No mid markers, arrows, dots at midpoints |
| marker-start | No start marker, arrow, dot at start |
| mask | Varied masking effects |
| mask-border | Varied mask-border effects |
| mask-border-outset | Visible differences in mask border extent |
| mask-border-repeat | Different repetition patterns |
| mask-border-slice | Different slice positions with dashed guidelines |
| mask-border-source | Clear difference between none and gradient |
| mask-border-width | Different mask border widths |
| mask-clip | Different clipping regions |
| mask-composite | Excellent differences between add/subtract/intersect/exclude |
| mask-image | Clear differences: visible, hidden, none |
| mask-mode | Differences between match-source, luminance, alpha |
| mask-origin | Different origin boxes produce different positioning |
| mask-position | Gradient circle moves to different positions |
| mask-repeat | Excellent differences showing repeat patterns |
| mask-size | Circle mask shows different sizes |
| max-block-size | Different constrained heights |
| max-height | Different height constraints |
| max-inline-size | Clear differences in text wrapping width |
| max-width | Different width constraints |
| min-block-size | Different minimum block sizes |
| min-height | Different minimum heights |
| min-inline-size | Different minimum widths |
| min-width | Different minimum widths |
| mix-blend-mode | Excellent visual differences between all blend modes |
| object-fit | Clear differences between fill, none, contain, cover |
| object-position | Circle positioned differently in each panel |
| offset-anchor | Element at different positions along path |
| offset-distance | Element at different positions along path |
| offset-path | Different path types position element differently |
| offset-position | Element at different grid positions |
| opacity | Clear opacity differences visible |
| order | Target item reorders based on order value |
| outline | Various outline styles clearly different |
| outline-color | Clearly different outline colors |
| outline-offset | Outline at different distances from box |
| outline-style | Visually distinct outline styles |
| outline-width | Clear width differences |
| overflow | Visible/hidden/clip/scroll/auto with different behaviors |
| overflow-block | Shows visible, hidden, clip, scroll, auto |
| overflow-inline | Shows visible, hidden, scroll, auto |
| overflow-wrap | Normal (overflow) vs break-word vs anywhere |
| overflow-x | Shows visible, hidden, scroll, auto |
| overflow-y | Shows different vertical overflow behaviors |
| padding | Clearly different padding sizes |
| padding-block | Increasing block padding differences |
| padding-block-end | Increasing bottom padding |
| padding-block-start | Increasing top padding |
| padding-bottom | Clear bottom padding differences |
| padding-inline | Different inline padding combinations |
| padding-inline-end | Increasing right padding |
| padding-inline-start | Increasing left padding |
| padding-left | Increasing left padding |
| padding-right | Increasing right padding |
| padding-top | Increasing top padding |
| perspective | Dramatically different 3D perspective effects |
| perspective-origin | 3D card viewed from different origins |
| place-content | Grid items distributed differently |
| place-items | Grid items sized/positioned differently |
| place-self | Target item positioned differently in grid cell |
| position | Different position values show different flows |
| quotes | auto, none, custom strings show different quote marks |
| r | SVG circles with different radii |
| resize | Shows resizable boxes (though requires interaction) |
| right | Positioned box at different right offsets |
| rotate | Clearly different rotations |
| row-gap | Different vertical gaps between rows |
| ruby-align | Four panels show clear ruby annotation positioning differences |
| ruby-position | Ruby text above/below and alternating positions |
| rx | Different horizontal radii on SVG ellipses |
| ry | Different vertical radii |
| scale | Many panels with visibly different sizes |
| scroll-snap-align | Different snap alignment positions visible |
| scroll-snap-type | Different snap types with visible layout differences |
| scrollbar-color | Clearly different scrollbar colors |
| scrollbar-gutter | Visible differences in gutter space reservation |
| scrollbar-width | Clear width differences (auto, thin, none) |
| shape-margin | Different text wrapping distances around shape |
| stop-color | Different gradient stop colors visible |
| stop-opacity | Different opacity levels in gradient stops |
| stroke | Clearly different stroke colors |
| stroke-dasharray | Distinctly different dash patterns |
| stroke-linecap | Clear differences (butt, round, square) |
| stroke-linejoin | Clear differences (miter, round, bevel) |
| stroke-miterlimit | Visible differences in miter extension |
| stroke-opacity | Clear opacity differences |
| tab-size | Clearly different tab indentation widths |
| table-layout | auto vs fixed shows different column widths |
| text-align | Distinct text alignment |
| text-align-last | Clear differences in last-line alignment |
| text-autospace | Visible spacing differences between CJK and Latin |
| text-combine-upright | Vertical text with digits combined/separate |
| text-decoration-color | Distinct underline colors visible |
| text-decoration-line | underline, overline, line-through, combinations all distinct |
| text-decoration-skip-ink | Subtle but visible differences in underline interaction |
| text-decoration-style | solid, double, dotted, dashed, wavy all distinct |
| text-decoration-thickness | Visible thickness differences |
| text-emphasis | None, custom string, filled/open dots all visible |
| text-emphasis-color | Emphasis marks in different colors |
| text-emphasis-position | Marks over vs under text |
| text-emphasis-style | Distinct shapes: dot, circle, triangle, sesame |
| text-indent | Clear indentation differences |
| text-orientation | mixed vs upright vs sideways clearly different |
| text-overflow | clip vs ellipsis clearly visible |
| text-shadow | Varied shadow offsets, colors, blur visible |
| text-transform | none, capitalize, uppercase, lowercase clearly different |
| text-underline-offset | Underline position varies from touching to far below |
| text-wrap | wrap vs nowrap clearly different |
| text-wrap-mode | wrap vs nowrap clearly different |
| top | Pink boxes at different vertical positions |
| transform | none vs rotate vs scale+translate clearly distinct |
| transform-origin | Different rotation pivot points clearly visible |
| transform-style | flat vs preserve-3d clearly distinct |
| translate | Pink boxes at different x/y positions |
| unicode-bidi | Different bidi behaviors with mixed LTR/RTL text |
| vertical-align | Red box moves up/down relative to text baseline |
| visibility | visible shows items, hidden/collapse affect visibility |
| white-space | Different whitespace handling behaviors |
| white-space-collapse | Different collapse/preserve behaviors |
| width | Boxes at different widths clearly visible |
| word-break | Different line breaking behaviors |
| word-spacing | Clear spacing differences |
| word-wrap | normal (overflow) vs break-word vs anywhere |
| writing-mode | horizontal, vertical-rl, vertical-lr, sideways all distinct |
| x | SVG elements at different x positions |
| y | SVG elements at different y positions |
| z-index | Stacking order changes visible |
| zoom | Elements at different zoom levels |

## Category 2: NOT_UNIQUE (186 properties)

Valid CSS values but panels look identical or nearly identical. The HTML blueprint template
needs improvement to better showcase the visual differences.

### Border/Box Shorthand Properties
These shorthand properties generate complex combined values that often don't produce visible borders.
The individual sub-properties (color, style, width) work well.

| Property | Notes |
|----------|-------|
| border-block | Most panels identical; shorthand values don't produce visible borders |
| border-block-end | Most panels identical |
| border-block-start | Most panels identical |
| border-inline | Nearly all panels identical |
| border-inline-end | Nearly all panels identical |
| border-inline-start | Nearly all panels identical |
| border-left | Nearly all panels identical |
| border-right | Nearly all panels identical |
| border-image-repeat | Panels nearly identical; striped pattern differences too subtle |
| border-image-source | Most panels identical; url/image-set reference nonexistent files |

### Deprecated/Legacy Properties
These properties are deprecated and not supported in modern Chrome.

| Property | Notes |
|----------|-------|
| box-align | Deprecated -webkit-box-align not rendering |
| box-direction | Deprecated property not reversing order |
| box-flex-group | Deprecated; no visible effect |
| box-lines | Deprecated; not supported |
| box-ordinal-group | Deprecated; not reordering |
| box-orient | Deprecated; vertical not rendering differently |
| box-pack | Deprecated; not working in modern Chrome |

### Paged/Print Context Properties
These properties only affect paged media or multi-column break contexts.

| Property | Notes |
|----------|-------|
| break-after | Only affects paged/column contexts |
| break-before | Only affects paged/column contexts |
| break-inside | Only affects multi-column/paged layout |
| widows | Only affects paged/multi-column contexts |

### Animation/Transition Properties (Identical Frames)
These temporal-mode properties produced identical frames across all captures.

| Property | Frames | Notes |
|----------|--------|-------|
| animation | 5 | All frames identical; animations frozen |
| animation-delay | 5 | Box position barely differs between delay values |
| animation-iteration-count | 5 | Just pink boxes in same position |
| animation-name | 5 | None vs my-animation shows no difference |
| animation-range | 5 | All panels identical |
| animation-range-end | 5 | All panels identical |
| animation-range-start | 5 | All panels identical |
| animation-timeline | 5 | Scrollbar indicator nearly identical |
| transition | 5 | Static screenshots cannot capture transitions |
| transition-behavior | 5 | Not visible in static capture |
| transition-delay | 5 | No visual demo |
| transition-duration | 5 | No visual demo |
| transition-property | 5 | All identical |
| transition-timing-function | 5 | No visual demo |

### Scroll Properties (Identical Frames)
Scroll-margin and scroll-padding properties are invisible without active scroll-snap interaction.

| Property | Frames | Notes |
|----------|--------|-------|
| scroll-behavior | 3 | auto vs smooth identical in static screenshots |
| scroll-initial-target | 3 | Both show same scroll position |
| scroll-margin | 3 | Invisible without scroll-snap interaction |
| scroll-margin-block | 3 | Not visible statically |
| scroll-margin-block-end | 3 | Not visible statically |
| scroll-margin-block-start | 3 | Not visible statically |
| scroll-margin-bottom | 3 | Not visible statically |
| scroll-margin-inline | 3 | Not visible statically |
| scroll-margin-inline-end | 3 | Not visible statically |
| scroll-margin-inline-start | 3 | Not visible statically |
| scroll-margin-left | 3 | Not visible statically |
| scroll-margin-right | 3 | Not visible statically |
| scroll-margin-top | 3 | Not visible statically |
| scroll-marker-group | 3 | All panels show "Slide 1" identically |
| scroll-padding | 3 | Not visible without scroll snap |
| scroll-padding-block | 3 | Not visible statically |
| scroll-padding-block-end | 3 | Not visible statically |
| scroll-padding-block-start | 3 | Not visible statically |
| scroll-padding-bottom | 3 | Not visible statically |
| scroll-padding-inline | 3 | Not visible statically |
| scroll-padding-inline-end | 3 | Not visible statically |
| scroll-padding-inline-start | 3 | Not visible statically |
| scroll-padding-left | 3 | Not visible statically |
| scroll-padding-right | 3 | Not visible statically |
| scroll-padding-top | 3 | Not visible statically |
| scroll-snap-stop | 3 | Requires scroll interaction |
| scroll-target-group | 3 | Not visible statically |
| scroll-timeline | 5 | Same pink square in same position |
| scroll-timeline-axis | 5 | Axis direction not distinguishable |
| scroll-timeline-name | 5 | Name differences are not visual |

### View Timeline Properties (Identical Frames)

| Property | Frames | Notes |
|----------|--------|-------|
| view-timeline | 5 | All panels identical scroll layout |
| view-timeline-axis | 5 | Identical panels |
| view-timeline-inset | 5 | Identical panels |
| view-timeline-name | 5 | Identical panels |

### Font/Text Properties
Many font variant and feature properties require specific font support to show differences.

| Property | Notes |
|----------|-------|
| font-family | Generic families show no visible rendering difference |
| font-feature-settings | All panels identical; feature tags not supported by font |
| font-kerning | auto, normal, none look identical |
| font-language-override | Both panels render identically |
| font-optical-sizing | auto and none look identical |
| font-palette | All panels identical white text |
| font-smooth | All panels identical |
| font-synthesis | All panels identical bold text |
| font-synthesis-position | auto and none look identical |
| font-synthesis-small-caps | auto and none look identical |
| font-synthesis-weight | auto and none look identical |
| font-variant | All panels identical text rendering |
| font-variant-alternates | All panels identical |
| font-variant-east-asian | CJK characters identical |
| font-variant-ligatures | All panels identical |
| font-variant-numeric | All panels identical number rendering |
| font-variation-settings | All panels identical "Default Text" |
| font-width | All panels identical text width |
| text-decoration | Many panels identical; shorthand sub-values misapplied |
| text-decoration-inset | Not widely supported; no visible difference |
| text-decoration-skip | Only 2 panels, both look identical |
| text-justify | Subtle spacing differences hard to distinguish |
| text-rendering | All 4 panels look identical |
| text-size-adjust | Only affects mobile text inflation |
| text-spacing-trim | CJK punctuation differences unsupported |
| text-underline-position | Minimal visible difference |
| text-wrap-style | All panels look identical |

### Container/Layout Properties

| Property | Notes |
|----------|-------|
| contain | All panels identical despite containment values |
| container | All panels identical |
| container-name | All panels identical |
| container-type | All panels identical |
| content | Nearly all panels show "Original Text" identically |

### SVG/Filter Properties

| Property | Notes |
|----------|-------|
| alignment-baseline | Baseline differences too subtle |
| baseline-source | All three panels nearly identical |
| clip-rule | nonzero vs evenodd look identical with current shape |
| color-interpolation-filters | All three panels identical |
| dominant-baseline | Baseline differences very subtle |
| flood-color | All panels show identical rectangles |
| flood-opacity | All panels identical pink rectangles |
| lighting-color | All panels identical gray |
| shape-image-threshold | All panels identical |
| shape-outside | Text wrapping identical with square float |
| shape-rendering | All panels identical |
| stroke-dashoffset | Small offset differences not perceptible |
| stroke-width | All panels show very thin identical lines |
| text-anchor | Text too small/faint to see anchor differences |
| vector-effect | Effects require transform context |

### Interaction-Dependent Properties

| Property | Notes |
|----------|-------|
| interactivity | auto/inert look identical; requires user interaction |
| interest-delay | Timing-based; needs hover interaction |
| interest-delay-end | Timing-based; needs hover interaction |
| interest-delay-start | Timing-based; needs hover interaction |
| interpolate-size | Only shows during transitions |
| line-height-step | Not widely supported |
| overflow-anchor | Requires scroll interaction |
| overlay | Affects transition behavior only |

### Positioning Properties

| Property | Notes |
|----------|-------|
| anchor-name | Tooltip not visually anchored differently |
| anchor-scope | No visual difference between scope values |
| position-anchor | Anchor positioning differences not visible |
| position-area | All panels show element in same center position |
| position-try | All panels show same position |
| position-try-fallbacks | Fallback positioning not triggered |
| position-try-order | Order affects fallback, not visible without constraint |
| position-visibility | Visibility conditions not triggered |

### Other NOT_UNIQUE Properties

| Property | Notes |
|----------|-------|
| background-attachment | 3 frames identical; scroll behavior not captured |
| background-image | Most panels empty; url/image-set fail to load |
| background-repeat-x | All showing full dot grids with subtle differences |
| background-repeat-y | All showing full dot grids with subtle differences |
| column-rule | Invalid shorthand values; rules barely visible |
| column-rule-color | Only "red" shows visible rule line |
| column-rule-width | Invalid values like repeat() |
| dynamic-range-limit | No visible difference on SDR displays |
| grid-template-areas | All panels nearly identical |
| hanging-punctuation | All panels identical |
| hyphenate-character | No visible hyphenation |
| hyphenate-limit-chars | Identical hyphenation patterns |
| image-orientation | Same orientation despite different values |
| image-resolution | Identical image at same size |
| initial-letter | No visible drop-cap effect |
| justify-items | Grid items appear similar across most values |
| line-break | Most panels identical; only "anywhere" shows difference |
| list-style-image | url/image values fail to load |
| list-style-type | Many symbols() values show default bullets |
| mask-border-mode | luminance and alpha look identical |
| mask-type | luminance and alpha look identical |
| math-depth | Identical formula rendering |
| math-shift | normal and compact identical |
| math-style | normal and compact identical |
| object-view-box | All panels identical despite different values |
| offset | Most panels show element in same position |
| offset-rotate | Most panels identical; only "reverse" differs |
| overflow-clip-margin | Clip margin differences too subtle |
| overscroll-behavior | Requires active scrolling interaction |
| overscroll-behavior-block | Requires scroll interaction |
| overscroll-behavior-inline | Requires scroll interaction |
| overscroll-behavior-x | Requires scroll interaction |
| overscroll-behavior-y | Requires scroll interaction |
| paint-order | Paint order differences too subtle |
| ruby-overhang | auto and spaces look identical |
| text-box | All panels identical |
| text-box-edge | All panels identical |
| text-box-trim | Differences very subtle |
| timeline-scope | Effect not visually demonstrable |
| transform-box | All panels nearly identical |
| will-change | Performance hint with no visual effect |

## Category 3: BAD_VALUES (3 properties)

The generated CSS values are wrong, invalid, or nonsensical.

| Property | Notes |
|----------|-------|
| grid-column-gap | Invalid values like `env()`, `clamp(none,...)` generated; all panels identical |
| grid-row-gap | Invalid values like `env()`, `clamp(none,...)` generated; all panels identical |
| vendor-prop | Nonsensical generated values (random unicode, garbled property names); all panels identical |

## Category 4: AMBIGUOUS (29 properties)

Property can't be demonstrated visually in a headless screenshot, requires user interaction,
or the cause of issues is unclear.

### Requires Focus/Caret Interaction

| Property | Frames | Notes |
|----------|--------|-------|
| caret | 2 | All panels identical; requires focus to see caret |
| caret-animation | 5 | Requires active focus to observe blinking |
| caret-color | 2 | Requires focus on input to see caret |
| caret-shape | 2 | Requires focus on input to see caret |

### Requires Hover/Touch/Click Interaction

| Property | Frames | Notes |
|----------|--------|-------|
| cursor | 2 | Cursor changes require hover; frames identical |
| pointer-events | 2 | Requires mouse interaction; frames identical |
| touch-action | 2 | Requires touch interaction; frames identical |
| user-modify | 2 | Controls editability; requires interaction; frames identical |

### Print/Paged Media Only

| Property | Notes |
|----------|-------|
| orphans | Print/pagination property; var() values questionable |
| page | Print/pagination; no visual effect on screen |
| page-break-after | Print-only property |
| page-break-before | Print-only property |
| page-break-inside | Break behavior not visible in column demo |
| print-color-adjust | Only affects print rendering |

### Requires Navigation/Transition Context

| Property | Notes |
|----------|-------|
| view-transition-class | Requires actual navigation/transition to see effect |
| view-transition-name | Requires actual navigation/transition to see effect |

### Selection Mode

| Property | Frames | Notes |
|----------|--------|-------|
| user-select | 2 | Frame 2 shows selection highlight on "auto" panel only |

### Non-Standard/Audio Properties

| Property | Notes |
|----------|-------|
| column-height | Not a standard CSS property |
| column-wrap | Not a standard CSS property |
| speak-as | Audio-only property; cannot be demonstrated visually |

### Inherently Difficult to Capture

| Property | Notes |
|----------|-------|
| resize | Requires user drag interaction |

---

## Recommendations

### Priority 1: Fix BAD_VALUES (3 properties)
- `grid-column-gap`: Fix EBNF grammar to not generate invalid values like `env()`, `clamp(none,...)`
- `grid-row-gap`: Same issue as grid-column-gap
- `vendor-prop`: Review if this property should be included at all

### Priority 2: Improve Multi-Frame Capture
23 of 28 temporal-mode and 27 of 35 scroll-mode properties produce identical frames.
Consider:
- Triggering CSS class toggles before captures for animation properties
- Actually scrolling the container between captures for scroll properties
- Adding JS-triggered hover states for hover-mode properties

### Priority 3: Improve NOT_UNIQUE Templates
Focus on the most impactful groups:
- **Scroll margin/padding properties** (25 properties): Need scroll-snap containers that demonstrate the margin/padding during snap
- **Font variant properties** (10 properties): Need fonts that actually support the requested features
- **Transition properties** (6 properties): Need JS to trigger transitions between frames
- **Border shorthand properties** (8 properties): Need the generated values to include visible style+color+width combinations
- **Container properties** (3 properties): Need container queries that visually respond to container type
