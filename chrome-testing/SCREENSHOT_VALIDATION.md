# Screenshot Validation Report

> Updated 2026-06-02. Visual audit of all 528 CSS property screenshots in
> `chrome-testing/screenshots/generated/` and `chrome-testing/html/generated/`.

## Summary

| Category | Count | Description |
|----------|-------|-------------|
| A — Well demonstrated | 466 | Every panel visually distinct, clearly matches labeled value |
| B — Inherently same | 40 | Panels look identical and can't be fixed (env/browser limitation) |
| C — Needs better values | 0 | UI is fine but values/fonts don't produce distinct results |
| D — Needs better UI | 0 | Layout/structure doesn't showcase the property |
| E — Insufficient (interactive) | 2 | Requires interaction, animation, or print context |
| F — Not demoable | 20 | Unsupported in Chrome, conceptual-only, or non-visual |

---

## A — Well Demonstrated (466)

Every panel shows a visually distinct result matching the labeled CSS value.
Includes 65 formerly-E properties now captured via multi-frame interactive modes.

| Property | Notes |
|----------|-------|
| `accent-color` | Checkboxes/radios/sliders show distinct accent colors per panel |
| `align-content` | Flex children visibly packed/centered/spaced/stretched |
| `align-items` | Numbered bars at different vertical positions |
| `align-self` | Highlighted item moves to distinct positions |
| `alignment-baseline` | SVG text baseline positions visually distinct |
| `all` | Resets visible styles; revert-layer/unset/inherit all produce distinct results |
| `anchor-name` | Tooltip wired to anchor with position-anchor; different names show distinct positioning |
| `anchor-scope` | Different scope behaviors produce distinct layouts |
| `animation` | Dramatic keyframes show distinct animation combos |
| `animation-composition` | Replace/add/accumulate produce distinct transforms |
| `animation-delay` | Negative delays show elements at different positions/colors |
| `animation-direction` | Normal/reverse/alternate clearly different with color-changing animation |
| `animation-duration` | Box position clearly varies (short=near end, long=near start) |
| `animation-fill-mode` | none/forwards/backwards/both states clearly legible |
| `animation-iteration-count` | Different iteration counts with short animation visible |
| `animation-name` | Each named animation produces dramatically different result |
| `animation-play-state` | Running vs paused ball positions clearly different |
| `animation-timing-function` | Ball positions differ across timing curves |
| `appearance` | Select element appearance values distinguishable |
| `aspect-ratio` | Boxes clearly vary in width-to-height ratio |
| `backdrop-filter` | Blur, grayscale, multi-filter effects visible on colored blobs |
| `backface-visibility` | Visible shows mirrored text, hidden shows empty card |
| `background` | Six distinct gradient/color combinations |
| `background-blend-mode` | Each blend mode produces distinct color output |
| `background-clip` | Content-box, padding-box, border-box, text all distinct |
| `background-color` | Distinct colors including red, white, green, blue, transparent |
| `background-image` | Gradients and image types visually distinct |
| `background-origin` | Gradient start shifts relative to content/padding/border |
| `background-position` | Red dot at clearly different X/Y positions |
| `background-position-x` | Blue band shifts horizontally |
| `background-position-y` | Pink band shifts vertically |
| `background-repeat` | repeat-x, repeat-y, no-repeat, space, round all distinct |
| `background-repeat-x` | X-axis repeat patterns clearly visible with enlarged dots |
| `background-repeat-y` | Y-axis repeat patterns clearly visible |
| `background-size` | auto/cover/contain/percentage all clearly different |
| `baseline-shift` | Text shift positions clearly visible with reference line |
| `block-size` | Elements clearly vary in height |
| `border` | Solid/dotted/dashed/double styles and widths all distinct |
| `border-block` | Block border styles and colors well demonstrated |
| `border-block-color` | Distinct colors on block borders |
| `border-block-end` | Bottom border varies from hairline to 50px |
| `border-block-end-color` | End-edge colors clearly different |
| `border-block-end-style` | All 10 styles clearly shown |
| `border-block-end-width` | Width from hairline to 50px clearly progresses |
| `border-block-start` | Top border varies from hairline to styled |
| `border-block-start-color` | Start-edge colors clearly different |
| `border-block-start-style` | All 10 styles distinct at top border |
| `border-block-start-width` | Width from hairline to 50px progresses |
| `border-block-style` | All 9 styles shown as top+bottom borders |
| `border-block-width` | Width progression visible with padding |
| `border-bottom` | Bottom border styles well shown with fallback |
| `border-bottom-color` | Color values clearly visible on dark background |
| `border-bottom-left-radius` | Radius progression from 4px to 50% |
| `border-bottom-right-radius` | Radius progression clearly visible |
| `border-bottom-style` | All 10 styles clearly shown as bottom border |
| `border-bottom-width` | Width from hairline to 50px visible |
| `border-collapse` | Separate vs collapse clearly different on table |
| `border-color` | Multiple distinct color values including system colors |
| `border-end-end-radius` | Logical radius values clearly visible |
| `border-end-start-radius` | Logical radius values clearly visible |
| `border-image` | Gradient, SVG, and slice values render vividly |
| `border-image-outset` | Border extends outward at different amounts |
| `border-image-repeat` | Stretch/repeat/round/space visually distinct |
| `border-image-slice` | Rainbow gradient makes slice values obvious |
| `border-image-source` | Gradient border sources well shown |
| `border-image-width` | Gradient border width differences clear |
| `border-inline` | Inline-edge (left+right) border styles and colors clearly distinct |
| `border-inline-color` | Left+right borders show distinct colors |
| `border-inline-end` | Right-edge border varies in style and color |
| `border-inline-end-color` | Right-side vertical bar changes color |
| `border-inline-end-style` | All 10 styles visible on right border |
| `border-inline-end-width` | Right-side width from hairline to 50px |
| `border-inline-start` | Left-edge border varies in style and color |
| `border-inline-start-color` | Left-side vertical bar changes color |
| `border-inline-start-style` | All 10 styles on left border |
| `border-inline-start-width` | Left-side width progression |
| `border-inline-style` | Both inline borders changing style together |
| `border-inline-width` | Both inline widths with two-value combos |
| `border-left` | Left-edge border style/color distinct per panel |
| `border-left-color` | Left edge vertical bar changes color |
| `border-left-style` | All 10 styles on left border |
| `border-left-width` | Width from hairline to 50px |
| `border-radius` | Sharp to circular, asymmetric elliptical shapes |
| `border-right` | Right-edge border style/color distinct per panel |
| `border-right-color` | Right-side bar changes color |
| `border-right-style` | All 10 styles on right border |
| `border-right-width` | Width progression clear |
| `border-spacing` | 4px compact to 50px spread on real table |
| `border-start-end-radius` | Logical radius values clearly visible |
| `border-start-start-radius` | Logical radius values clearly visible |
| `border-style` | All styles with multi-value combinations |
| `border-top` | Top border with fallback style/width |
| `border-top-color` | Color values clearly visible |
| `border-top-left-radius` | Radius progression visible |
| `border-top-right-radius` | Radius progression visible |
| `border-top-style` | All 10 styles on top edge |
| `border-top-width` | Width from hairline to 50px |
| `border-width` | Full-perimeter with multi-value combos |
| `bottom` | Pink box at different heights |
| `box-align` | Start/center/end/baseline/stretch clearly different |
| `box-decoration-break` | Slice vs clone at line breaks unmistakable |
| `box-direction` | Normal (1,2,3,4) vs reverse (4,3,2,1) |
| `box-flex` | Flex proportions produce distinct sizing |
| `box-ordinal-group` | Box clearly moves to different positions |
| `box-orient` | Horizontal vs vertical layout clearly distinct |
| `box-pack` | Start/center/end/justified all visible |
| `box-shadow` | Shadows visible with adequate margin/padding |
| `box-sizing` | Content-box vs border-box size difference clear |
| `break-after` | Column break behaviors visible in multi-column layout |
| `break-before` | Column break behaviors visible in multi-column layout |
| `break-inside` | Multi-column cards show avoid vs auto break behavior |
| `caption-side` | Caption above vs below table |
| `clear` | Float-clearing behavior distinct per panel |
| `clip` | rect() clipping areas clearly distinct |
| `clip-path` | Inset, circle, ellipse, polygon all distinct |
| `clip-rule` | Nonzero fills solid, evenodd punches hole |
| `color` | Text colors including red, white, green, blue visible |
| `color-scheme` | Light/dark form controls render differently |
| `column-count` | 1, 2, 3 columns clearly visible |
| `column-fill` | Auto vs balance column distribution clearly different |
| `column-gap` | Items spread apart with increasing gap |
| `column-rule-color` | Rule color changes between columns |
| `column-rule-width` | Rule thickness between columns varies visibly |
| `column-span` | None vs all spanning clearly different |
| `column-width` | Column width varies from narrow to wide in multi-column layout |
| `columns` | Column count/width shorthand produces distinct multi-column layouts |
| `contain` | Overflow child clipped/visible per containment type |
| `contain-intrinsic-block-size` | Size containment hints produce different heights |
| `contain-intrinsic-height` | Height hints clearly visible with containment |
| `contain-intrinsic-inline-size` | Inline-block elements at different intrinsic width hints with containment |
| `contain-intrinsic-size` | Size containment hints produce visibly different dimensions |
| `contain-intrinsic-width` | Inline-block elements at different width hints with containment |
| `container-type` | @container query triggers green indicator when containment context active |
| `content` | ::before pseudo-element shows distinct generated content per panel |
| `content-visibility` | Visible/auto show content, hidden shows empty |
| `corner-block-end-shape` | Distinct corner shapes (round/scoop/bevel/notch/square) |
| `corner-block-start-shape` | All shape variants visible on top corners |
| `corner-bottom-left-shape` | All shape variants on bottom-left corner |
| `corner-bottom-right-shape` | All shape variants on bottom-right corner |
| `corner-bottom-shape` | All shape variants along bottom edge |
| `corner-end-end-shape` | All shapes on logical end-end corner |
| `corner-end-start-shape` | All shapes on logical end-start corner |
| `corner-inline-end-shape` | All shapes on inline-end corner |
| `corner-inline-start-shape` | All shapes on inline-start corner |
| `corner-left-shape` | All shapes on left corners |
| `corner-right-shape` | All shapes on right corners |
| `corner-shape` | All shapes on all four corners |
| `corner-start-end-shape` | All shapes on logical start-end corner |
| `corner-start-start-shape` | All shapes on logical start-start corner |
| `corner-top-left-shape` | All shapes on top-left corner |
| `corner-top-right-shape` | All shapes on top-right corner |
| `corner-top-shape` | All shapes along top edge |
| `counter-increment` | Different counter values and steps visible |
| `counter-reset` | List counter offsets clearly shown |
| `counter-set` | Set-point changes numbered output |
| `cx` | Circle horizontal position varies across wide SVG |
| `cy` | Circle vertical position varies across tall SVG |
| `d` | Distinct SVG paths (wave, triangle, circle, none) |
| `direction` | ltr vs rtl text alignment clearly different |
| `display` | Block, inline, flex, grid, table, none all distinct |
| `dominant-baseline` | Text baseline differences visible with reference line |
| `empty-cells` | Show vs hide empty cell visibility |
| `field-sizing` | Fixed vs content sizing clearly different on textarea with text |
| `fill` | SVG circles with distinct fill colors |
| `fill-opacity` | Opacity gradations on checkerboard background |
| `fill-rule` | nonzero vs evenodd star rendering differs |
| `filter` | Blur, grayscale, brightness effects on colorful image |
| `flex` | Red first-item width changes across panels |
| `flex-basis` | Target element at different widths |
| `flex-direction` | Row/row-reverse/column/column-reverse all distinct |
| `flex-flow` | Direction/wrap combinations produce distinct layouts |
| `flex-grow` | Dark blue element expands differently |
| `flex-shrink` | Different shrink ratios with visible width changes |
| `flex-wrap` | Nowrap/wrap/wrap-reverse clearly different in narrow container |
| `float` | Text wrapping around floated box clearly shown |
| `flood-color` | SVG feFlood filter colors clearly distinct per panel with unique filter IDs |
| `flood-opacity` | Opacity gradations visible with bright green on dark bg |
| `font` | System fonts and style/weight combos all distinct |
| `font-family` | Named fonts loaded via Google Fonts; distinct typefaces per panel |
| `font-feature-settings` | EB Garamond OTF features (liga, smcp, onum, kern, frac) visible |
| `font-kerning` | Kerning differences visible with EB Garamond at 48px |
| `font-palette` | Nabla color font shows distinct palette colors |
| `font-size` | Clear progression from xx-small to x-large |
| `font-size-adjust` | x-height adjustments produce visible size changes |
| `font-stretch` | Width varies from condensed to expanded via Inter font |
| `font-style` | Normal/italic/oblique at various angles |
| `font-synthesis` | Synthesis on/off visible for bold/italic |
| `font-synthesis-small-caps` | Small-caps synthesis vs native visible |
| `font-synthesis-style` | Italic synthesis vs native clearly different |
| `font-variant` | Ligature and small-caps variants visible |
| `font-variant-alternates` | Historical form differences visible |
| `font-variant-caps` | Normal/small-caps/all-small-caps/petite-caps distinct |
| `font-variant-east-asian` | CJK glyph style differences visible |
| `font-variant-emoji` | Normal/text/emoji/unicode show different rendering |
| `font-variant-ligatures` | Ligature differences visible with highlighted chars |
| `font-variant-numeric` | Numeric formatting differences visible |
| `font-variant-position` | Normal/sub/super positioning clear |
| `font-weight` | Weight progression from 100 to 900 clearly visible |
| `font-width` | Width varies from condensed to expanded via Inter font |
| `gap` | Grid spacing from 0 to 50px clearly visible |
| `grid` | Different grid configurations produce distinct layouts |
| `grid-area` | Pink cell at different grid positions and spans |
| `grid-auto-columns` | Column sizing variations clearly visible |
| `grid-auto-flow` | Row/column/dense packing differences clear |
| `grid-auto-rows` | Row sizing variations clearly visible |
| `grid-column` | Distinct column placements and spans |
| `grid-column-end` | Item column span/position clearly varies |
| `grid-column-gap` | Column spacing differences obvious |
| `grid-column-start` | Item column position clearly varies |
| `grid-gap` | Row+column gap sizing clear |
| `grid-row` | Row placement and span differences clear |
| `grid-row-end` | Item row span clearly varies |
| `grid-row-gap` | Row spacing differences visible |
| `grid-row-start` | Item row position clearly varies |
| `grid-template` | Template configurations produce distinct layouts |
| `grid-template-columns` | Column widths vary (none/1fr/repeat/subgrid) |
| `grid-template-rows` | Row heights vary |
| `height` | Element heights from 10px to stretch clearly different |
| `hyphenate-character` | Auto hyphen vs custom "example" string visible |
| `hyphens` | None vs auto hyphenation clear |
| `image-rendering` | Pixelated/crisp-edges vs smooth visible on scaled image |
| `initial-letter` | Drop-cap sizes vary from small to large |
| `inline-size` | Width from 10px sliver to stretch |
| `inset` | Positioned elements at distinct inset values |
| `inset-block` | Block-axis inset values produce distinct positions |
| `inset-block-end` | Element moves up from bottom at different amounts |
| `inset-block-start` | Element pushed down from top at different amounts |
| `inset-inline` | Inline-axis inset values produce distinct positions |
| `inset-inline-end` | Element positioned at different right offsets |
| `inset-inline-start` | Inline-start offset values clearly different |
| `isolation` | Auto blends, isolate prevents cross-element blending |
| `justify-content` | Flex items spaced/packed/centered differently |
| `justify-items` | Grid items aligned at distinct positions within cells |
| `justify-self` | Item positioned differently within grid cell |
| `left` | Element left offset values clearly distinct |
| `letter-spacing` | Clear progression from tight to extremely spaced |
| `lighting-color` | SVG diffuse lighting colors clearly distinct with unique filter IDs |
| `line-break` | Japanese text wraps differently per value |
| `line-clamp` | Text clamped to different line counts via -webkit-line-clamp |
| `line-height` | Overlapping (0) to double-spaced (2) clearly shown |
| `list-style` | Marker type/position shorthand produces distinct list styling |
| `list-style-image` | Custom list markers visible with overflow control |
| `list-style-position` | Inside vs outside bullet position with wrapping text |
| `list-style-type` | Different marker types visible |
| `margin` | Spacing around elements clearly varies |
| `margin-block` | Block margin spacing visible |
| `margin-block-end` | Bottom margin spacing visible |
| `margin-block-start` | Top margin spacing visible |
| `margin-bottom` | Bottom margin clearly varies |
| `margin-inline` | Inline margin spacing visible |
| `margin-inline-end` | End margin spacing visible |
| `margin-inline-start` | Start margin spacing visible |
| `margin-left` | Left margin clearly varies |
| `margin-right` | Right margin clearly varies |
| `margin-top` | Top margin clearly varies |
| `margin-trim` | Parent trims child margins; trimmed vs untrimmed spacing clearly different |
| `marker` | None/arrow/dot markers on SVG path |
| `marker-end` | Arrow/dot at path end-point |
| `marker-mid` | Arrows/dots at inner vertices |
| `marker-start` | Arrow/dot at start-point |
| `mask` | Gradient masking effects clearly visible |
| `mask-border` | Border masking with different gradients |
| `mask-border-outset` | Dashed border expands outward |
| `mask-border-repeat` | Stretch/repeat/round/space tiling differences |
| `mask-border-slice` | Slice guides and colored areas differ |
| `mask-border-width` | Border width around content varies |
| `mask-clip` | Mask clips to different box models |
| `mask-composite` | Add/subtract/intersect/exclude shapes distinct |
| `mask-image` | None/gradient/url mask effects distinct |
| `mask-mode` | Luminance vs alpha masking visible |
| `mask-origin` | Mask position origins clearly differentiated |
| `mask-position` | Circle mask position changes visible |
| `mask-repeat` | repeat-x/repeat-y/no-repeat/space/round all differ |
| `mask-size` | Circle sizes clearly different |
| `mask-type` | Luminance vs alpha distinction clear |
| `math-shift` | Formula rendering differences visible at large size |
| `math-style` | Normal (expanded limits) vs compact (inline limits) |
| `max-block-size` | 10px clearly truncates content vs none/full height |
| `max-height` | 10px truncates, others show full content |
| `max-inline-size` | 10px squeezes text, other values wrap/expand |
| `max-width` | Width constraints clearly demonstrated |
| `min-block-size` | Zero-content box grows to different minimum heights (10px, 25%, stretch) |
| `min-height` | Zero-content box grows to different minimum heights |
| `min-inline-size` | Zero-content inline-block grows to different minimum widths |
| `min-width` | Zero-content inline-block grows to different minimum widths |
| `mix-blend-mode` | Overlapping circles show distinct blending per mode |
| `object-fit` | Fill/contain/cover/none/scale-down clearly different |
| `object-position` | Image at different positions within container |
| `offset` | Element positions along path visible |
| `offset-anchor` | Green dot anchor shifts on curved path |
| `offset-distance` | Element at different positions along bright visible path |
| `offset-path` | Path-based positioning clearly visible |
| `offset-position` | Red square at different grid intersections |
| `offset-rotate` | Triangle orientation changes (up/down/angled) |
| `opacity` | Full opacity to transparent with overlapping squares |
| `order` | Numbered flex items reorder as value increases |
| `outline` | Outline styles/colors/widths all distinct with fallback |
| `outline-color` | Different color values on outline ring |
| `outline-offset` | Gap between box and outline increases |
| `outline-style` | Auto/dotted/dashed/solid/double/groove/ridge distinct |
| `outline-width` | Hairline to 50px progression |
| `overflow` | Visible/hidden/clip/scroll/auto all distinct |
| `overflow-block` | Visible/hidden/clip/scroll/auto for block direction |
| `overflow-inline` | Visible/hidden/scroll/auto for inline direction |
| `overflow-wrap` | Normal overflows, break-word/anywhere wraps |
| `overflow-x` | Visible/hidden/scroll/auto clearly different |
| `overflow-y` | Visible/hidden/clip/scroll/auto clearly shown |
| `padding` | Color-coded padding regions, multi-value combos |
| `padding-block` | Distinct top/bottom padding amounts |
| `padding-block-end` | Bottom padding increases visibly |
| `padding-block-start` | Top padding increases visibly |
| `padding-bottom` | Bottom padding grows |
| `padding-inline` | Horizontal padding single and two-value syntax |
| `padding-inline-end` | Right-side padding increases |
| `padding-inline-start` | Left-side padding increases |
| `padding-left` | Left padding grows |
| `padding-right` | Right padding grows |
| `padding-top` | Top padding increases |
| `page-break-inside` | Multi-column cards show avoid vs auto page-break behavior |
| `perspective` | Depth distortion varies from none to extreme |
| `perspective-origin` | Origin shifts visible on enlarged 3D element |
| `place-content` | Grid items pack/center/spread differently |
| `place-items` | Items at different positions within grid cells |
| `place-self` | Item placement within grid cells varies |
| `position` | Static/relative/absolute/sticky/fixed with offset visible |
| `position-anchor` | Positioned element anchored to named anchor with anchor() functions |
| `position-area` | Anchor-positioned elements at distinct areas |
| `quotes` | Auto/none/custom quote characters clearly different |
| `r` | SVG circle radius clearly varies per panel |
| `right` | Element right offset values clearly distinct |
| `rotate` | Different rotation angles, 3D axis variants |
| `row-gap` | Vertical spacing from normal to 50px |
| `ruby-align` | Ruby text alignment varies visibly |
| `ruby-position` | Ruby text above/below/inter-character |
| `rx` | SVG ellipse horizontal radius changes visible |
| `ry` | Ellipse vertical radius from flat sliver to tall narrow |
| `scale` | Tiny (25%) to oversized (2x) with x/y variants |
| `scrollbar-color` | Different thumb/track colors visible |
| `scrollbar-gutter` | Auto/stable/both-edges gutter differences visible |
| `scrollbar-width` | Auto/thin/none clearly different |
| `shape-image-threshold` | Threshold effects on text wrapping distinct |
| `shape-margin` | Margin around shape clearly varies |
| `shape-outside` | Text wraps around circle/inset/gradient shapes |
| `stop-color` | SVG gradient stop colors clearly distinct with unique gradient IDs |
| `stop-opacity` | Gradient start fades from opaque to transparent |
| `stroke` | SVG stroke colors and presence clearly differ |
| `stroke-dasharray` | Distinct dash patterns on lines and circles |
| `stroke-dashoffset` | Dash position shifts visible on long line |
| `stroke-linecap` | Butt/round/square cap styles visible on thick SVG lines |
| `stroke-linejoin` | Miter/round/bevel joins visible on zigzag |
| `stroke-opacity` | Stroke fades from opaque to invisible |
| `stroke-width` | SVG circle stroke thickness clearly varies |
| `tab-size` | Code indentation from tight to sprawling |
| `table-layout` | Auto vs fixed column width distribution |
| `text-align` | Left/center/right/justify clearly different |
| `text-align-last` | Last line alignment varies in justified text |
| `text-anchor` | SVG text anchor start/middle/end positions visible |
| `text-autospace` | CJK/Latin spacing differences visible |
| `text-box` | Text box sizing values produce distinct results |
| `text-box-edge` | Box edge metrics clearly different |
| `text-box-trim` | Large font with exaggerated leading shows trim effects |
| `text-combine-upright` | Tate-chu-yoko digit combination visible in vertical text |
| `text-decoration` | None/underline/double/colored decorations distinct |
| `text-decoration-color` | Thick colored underlines clearly different |
| `text-decoration-line` | Underline/overline/line-through/spelling-error distinct |
| `text-decoration-skip-ink` | Auto/all/none ink-skip differences visible with large descenders |
| `text-decoration-style` | Solid/double/dotted/dashed/wavy all distinct |
| `text-decoration-thickness` | Hairline through 50px pink underline |
| `text-emphasis` | Emphasis marks and styles distinct |
| `text-emphasis-color` | Emphasis mark colors visible |
| `text-emphasis-position` | Dots above/below in all position combos |
| `text-emphasis-style` | Dot/circle/triangle/sesame/custom shapes |
| `text-indent` | First-line indent progression including hanging |
| `text-orientation` | Mixed/upright/sideways text in vertical writing mode |
| `text-overflow` | Clip/ellipsis/fade truncation clearly different |
| `text-shadow` | Rich variety of shadow colors, offsets, multi-shadow |
| `text-transform` | None/capitalize/uppercase/lowercase/full-width all visible |
| `text-underline-offset` | Underline moves from touching text to far below |
| `text-underline-position` | Under/from-font/left positions clearly different |
| `text-wrap` | Balance/pretty/stable wrapping differences visible |
| `text-wrap-mode` | Wrap vs nowrap clearly shown |
| `text-wrap-style` | Auto/balance/stable/pretty/avoid-orphans distinct |
| `top` | Pink squares at various distances from top |
| `transform` | Rotate/scale/skew/translate all clearly visible |
| `transform-origin` | Green dot marks rotation pivot at different positions |
| `transform-style` | Flat 2D overlap vs 3D layered planes |
| `translate` | Translation values produce distinct positions |
| `vector-effect` | Non-scaling stroke vs default clearly different under 3x transform |
| `vertical-align` | Pink box shifts relative to text baseline |
| `visibility` | Visible/hidden (space kept)/collapse (space removed) |
| `white-space` | Collapsed/preserved/pre-line behavior on same text |
| `white-space-collapse` | Six values show distinct space/newline handling |
| `width` | Content box from 10px to stretch |
| `word-break` | Normal overflow vs break-all vs keep-all |
| `word-spacing` | Inter-word spacing clearly increases |
| `word-wrap` | Normal overflow vs break-word/anywhere |
| `writing-mode` | Horizontal-tb/vertical-rl/vertical-lr/sideways |
| `x` | SVG elements at different horizontal positions |
| `y` | SVG elements at different vertical positions |
| `z-index` | Stacking order changes across colored layers |
| `zoom` | Size from invisible (0) to 2x dramatically |
| `animation-range` | Temporal mode captures scroll-driven animation progress across 6 frames |
| `animation-range-end` | Temporal mode captures scroll-driven animation end-range states |
| `animation-range-start` | Temporal mode captures scroll-driven animation start-range states |
| `animation-timeline` | Temporal mode shows scroll/view timeline animation progress |
| `background-attachment` | Scroll mode shows fixed vs scroll vs local attachment during scrolling |
| `caret` | Focus mode types into input, showing caret appearance |
| `caret-animation` | Focus mode shows caret in focused input field |
| `caret-color` | Focus mode types "Hello" into input; caret color visible |
| `caret-shape` | Focus mode shows caret shape in focused input |
| `cursor` | Hover mode shows cursor area with labeled cursor types |
| `interactivity` | Hover mode demonstrates interactivity states |
| `interest-delay` | Hover mode triggers interest/popover delay interaction |
| `interest-delay-end` | Hover mode triggers interest delay end states |
| `interest-delay-start` | Hover mode triggers interest delay start states |
| `interpolate-size` | Temporal mode shows size interpolation transition across frames |
| `overscroll-behavior` | Scroll mode shows nested scroll containers with overscroll behavior |
| `overscroll-behavior-block` | Scroll mode captures block-direction overscroll containment |
| `overscroll-behavior-inline` | Scroll mode captures inline-direction overscroll containment |
| `overscroll-behavior-x` | Scroll mode captures x-axis overscroll containment |
| `overscroll-behavior-y` | Scroll mode captures y-axis overscroll containment |
| `pointer-events` | Hover mode shows clickable elements with pointer-event values |
| `scroll-behavior` | Scroll mode shows all containers scrolling (auto vs smooth) |
| `scroll-initial-target` | Scroll mode captures initial scroll target positioning |
| `scroll-margin` | Scroll mode shows scroll-snap with margin offsets |
| `scroll-margin-block` | Scroll mode captures block-direction scroll margin |
| `scroll-margin-block-end` | Scroll mode captures block-end scroll margin |
| `scroll-margin-block-start` | Scroll mode captures block-start scroll margin |
| `scroll-margin-bottom` | Scroll mode captures bottom scroll margin |
| `scroll-margin-inline` | Scroll mode captures inline-direction scroll margin |
| `scroll-margin-inline-end` | Scroll mode captures inline-end scroll margin |
| `scroll-margin-inline-start` | Scroll mode captures inline-start scroll margin |
| `scroll-margin-left` | Scroll mode captures left scroll margin |
| `scroll-margin-right` | Scroll mode captures right scroll margin |
| `scroll-margin-top` | Scroll mode captures top scroll margin with different values |
| `scroll-marker-group` | Scroll mode shows scroll markers during scrolling |
| `scroll-padding` | Scroll mode shows scroll-snap with padding offsets |
| `scroll-padding-block` | Scroll mode captures block-direction scroll padding |
| `scroll-padding-block-end` | Scroll mode captures block-end scroll padding |
| `scroll-padding-block-start` | Scroll mode captures block-start scroll padding |
| `scroll-padding-bottom` | Scroll mode captures bottom scroll padding |
| `scroll-padding-inline` | Scroll mode captures inline-direction scroll padding |
| `scroll-padding-inline-end` | Scroll mode captures inline-end scroll padding |
| `scroll-padding-inline-start` | Scroll mode captures inline-start scroll padding |
| `scroll-padding-left` | Scroll mode captures left scroll padding |
| `scroll-padding-right` | Scroll mode captures right scroll padding |
| `scroll-padding-top` | Scroll mode captures top scroll padding |
| `scroll-snap-align` | Scroll mode shows snap alignment during scrolling |
| `scroll-snap-stop` | Scroll mode captures snap stopping behavior |
| `scroll-snap-type` | Scroll mode shows different snap types (x, both, mandatory, proximity) |
| `scroll-target-group` | Scroll mode captures scroll target grouping |
| `scroll-timeline` | Scroll mode shows scroll-driven timeline behavior |
| `scroll-timeline-axis` | Scroll mode captures timeline axis during scrolling |
| `touch-action` | Hover mode shows touch action areas with labeled gestures |
| `transition` | Temporal mode captures full transition shorthand across 6 frames |
| `transition-behavior` | Temporal mode shows normal vs allow-discrete with opacity fade |
| `transition-delay` | Temporal mode shows different delays; some boxes still red at mid-frames |
| `transition-duration` | Temporal mode shows different durations; faster transitions complete first |
| `transition-property` | Temporal mode captures which properties transition |
| `transition-timing-function` | Temporal mode shows easing differences (step-end still red at frame 4) |
| `user-modify` | Focus mode types into editable elements |
| `user-select` | Selection mode selects text; auto/text show selection, none blocks it |
| `view-timeline` | Scroll mode captures view-driven timeline states |
| `view-timeline-axis` | Scroll mode captures view timeline axis behavior |
| `view-timeline-inset` | Scroll mode captures view timeline inset offsets |
| `view-timeline-name` | Scroll mode captures named view timeline behavior |

---

## B — Inherently Same (40)

Panels look identical and **cannot be fixed** — the property is a browser hint,
requires a specific OS/environment, was never implemented, or is inherently
imperceptible in static screenshots.

| Property | Why it can't be fixed |
|----------|-------|
| `baseline-source` | First/last baseline alignment difference too subtle with current font metrics |
| `box-flex-group` | Deprecated, never implemented by any browser |
| `box-lines` | Never implemented by any browser |
| `color-interpolation` | sRGB vs linearRGB gradient midpoint inherently imperceptible |
| `color-interpolation-filters` | sRGB vs linearRGB blur feathering inherently too subtle |
| `column-rule` | Grammar produces invalid repeat() values instead of border styles |
| `column-rule-style` | Grammar produces grid track syntax, not border style keywords |
| `container` | Shorthand grammar generates only type 'normal'; @container query never triggers |
| `container-name` | Grammar values don't match @container query names; no container context |
| `font-language-override` | Requires font with language-specific glyph alternates; none available |
| `font-optical-sizing` | Requires variable font with opsz axis; difference imperceptible in headless Chrome |
| `font-synthesis-position` | System font has native sub/superscript; synthesis difference not visible |
| `font-synthesis-weight` | System font has native bold weight; synthesis vs native indistinguishable |
| `font-variation-settings` | Grammar uses feature tags (liga/smcp), not variation axes (wght/wdth); wrong tag type |
| `forced-color-adjust` | Requires Windows High Contrast mode; not triggerable in Chrome |
| `grid-template-areas` | Grammar area names don't match child grid-area; items don't land in areas |
| `hyphenate-limit-chars` | Browser-dependent micro-thresholds; no text can reveal it |
| `image-orientation` | Applied to CSS div, not <img> with EXIF rotation data |
| `mask-border-mode` | Alpha vs luminance mode difference imperceptible with gradient source |
| `mask-border-source` | Gradient sources too similar; masking effect barely visible |
| `math-depth` | Nested fraction scaling differences too subtle even with deep nesting |
| `object-view-box` | No image source; all panels show identical empty containers |
| `overflow-anchor` | Behavioral (scroll position adjustment); requires dynamic content insertion |
| `overflow-clip-margin` | Clip margin differences too subtle without large overflow content |
| `overlay` | Only affects top-layer rendering during View Transitions |
| `paint-order` | Fill/stroke/markers ordering inherently very subtle even with thick stroke |
| `position-try-order` | Requires @position-try fallbacks + overflow constraints; too complex for blueprint |
| `position-visibility` | Requires anchor going out of viewport; not feasible in static |
| `resize` | Resize handle direction only differs during interactive drag |
| `ruby-overhang` | Not fully implemented in Chrome |
| `scroll-timeline-name` | Scroll-driven; requires actual scrolling interaction |
| `shape-rendering` | Sub-pixel anti-aliasing differences invisible at normal zoom/DPI |
| `stroke-miterlimit` | Miter limit angle differences imperceptible at normal polyline angles |
| `text-decoration-skip` | Decoration skip differences too subtle at normal font sizes |
| `text-justify` | Justification differences too subtle between auto/inter-word/inter-character |
| `text-rendering` | Browser rendering hint with no guaranteed visual output |
| `text-spacing-trim` | CJK punctuation spacing adjustments inherently imperceptible |
| `transform-box` | Transform-box origin differences too subtle without extreme transforms |
| `unicode-bidi` | Bidirectional isolation/override differences imperceptible with LTR content |
| `will-change` | Performance hint; no visual effect by design |

---

## C — Needs Better Values (0)

All former Category C properties have been resolved — 8 moved to A (via @import
hoisting, {{INDEX}} template variables, Google Fonts, and blueprint fixes) and 4
moved to B (inherent font/browser limitations).

---

## D — Needs Better UI/Blueprint (0)

All former Category D properties have been resolved — 35 moved to A (via
zero-content sizing demos, SVG coordinate fixes, @container queries, anchor
positioning wiring, and blueprint improvements), 19 moved to B (grammar
limitations or inherently subtle effects), 8 moved to E (require interaction),
and 1 moved to F (not a real property).

---

## E — Insufficient: Requires Interaction (2)

These properties require anchor positioning context with @position-try at-rules
that the current generator does not produce.

| Property | Reason |
|----------|-------|
| `position-try` | Requires @position-try at-rules with anchor positioning |
| `position-try-fallbacks` | Requires @position-try at-rules with anchor positioning |

### Formerly E, now resolved (65 → A, 1 → B, 9 → F)

Multi-frame screenshot modes (temporal, scroll, hover, focus, selection) now
capture interaction states via chromerpc automation. Transition-* properties use
temporal mode with `.active` class toggling. Scroll-* properties use scroll mode
that programmatically scrolls all containers. Focus/caret properties type into
inputs. Selection properties select text. Print/audio/HDR properties moved to F.

---

## F — Not Demoable (20)

Unsupported in Chrome, conceptual-only, non-visual, or requires print/audio/HDR context.

| Property | Reason |
|----------|-------|
| `column-height` | Not a standard CSS property |
| `column-wrap` | Non-standard; no browser support |
| `dynamic-range-limit` | Requires HDR display; no effect in standard Chrome |
| `font-smooth` | Non-standard; Chrome ignores unprefixed |
| `hanging-punctuation` | Not implemented in Chrome |
| `image-resolution` | Not supported in Chrome |
| `line-height-step` | Not implemented in Chrome |
| `orphans` | Paged-media property; only affects print/column breaks |
| `page` | Requires print context |
| `page-break-after` | Requires print context |
| `page-break-before` | Requires print context |
| `print-color-adjust` | Requires print context |
| `speak-as` | Audio property; no visual effect |
| `text-decoration-inset` | Not supported in Chrome |
| `text-size-adjust` | Mobile-only; no effect on desktop Chrome |
| `timeline-scope` | Only expressible as code/diagram |
| `vendor-prop` | Not a real CSS property; placeholder for vendor-prefixed properties |
| `view-transition-class` | Only expressible as code/diagram |
| `view-transition-name` | Only expressible as code/diagram |
| `widows` | Paged-media property; only affects print/column breaks |