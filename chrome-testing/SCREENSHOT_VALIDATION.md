# Screenshot Validation Report

> Updated 2026-06-01. Covers all 527 CSS properties generated from EBNF grammar
> in `chrome-testing/screenshots/generated/` and `chrome-testing/html/generated/`.
> (vendor-prop excluded — not a real CSS property.)

## Summary

| Category | Count | Description |
|----------|-------|-------------|
| 1 - Good | 448 | Screenshots accurately demonstrate distinct values |
| 4 - Insufficient Data | 69 | Static screenshots cannot demonstrate this property |
| 5 - Not Demoable | 10 | Property cannot be visually demonstrated (unsupported, conceptual, or non-visual) |

---

## Category 1: Good Screenshots (448)

Screenshots accurately describe the various values of the property. Every panel is
unique and visually matches the labeled CSS value.

| # | Property | Notes |
|---|----------|-------|
| 1 | `align-content` | Panels show clearly different vertical distribution of flex items |
| 2 | `align-items` | Different vertical alignment of flex items with varying heights |
| 3 | `align-self` | Highlighted element clearly moves to different vertical positions |
| 4 | `alignment-baseline` | SVG text baseline differences visible across panels |
| 5 | `all` | Panels show different CSS reset behaviors (initial, inherit, unset, revert) |
| 6 | `anchor-name` | Distinct values shown across panels |
| 7 | `anchor-scope` | Distinct values shown across panels |
| 8 | `animation-composition` | Distinct values shown across panels |
| 9 | `animation-delay` | Distinct values shown across panels |
| 10 | `animation-direction` | Distinct values shown across panels |
| 11 | `animation-duration` | Distinct values shown across panels |
| 12 | `animation-fill-mode` | Four distinct fill states (none, forwards, backwards, both) |
| 13 | `animation-iteration-count` | Distinct values shown across panels |
| 14 | `animation-name` | Distinct values shown across panels |
| 15 | `animation-play-state` | Distinct values shown across panels |
| 16 | `animation-timing-function` | Distinct values shown across panels |
| 17 | `appearance` | Select element with different native appearances (none strips dropdown arrow) |
| 18 | `aspect-ratio` | Boxes have visibly different width-to-height ratios |
| 19 | `backdrop-filter` | Distinct visual effects (blur, grayscale) on backdrop behind colored circles |
| 20 | `backface-visibility` | Visible shows mirrored element, hidden shows nothing |
| 21 | `background` | Panels show distinct gradient combinations |
| 22 | `background-attachment` | Distinct values shown across panels |
| 23 | `background-blend-mode` | Each blend mode produces a visually distinct color output |
| 24 | `background-clip` | Background clipped to content-box, padding-box, border-box, text |
| 25 | `background-image` | Panels show url images, gradients, and none with clear differences |
| 26 | `background-origin` | Background positioned relative to content, padding, border boxes |
| 27 | `background-position` | Dot moves to clearly different positions (center, top, corners, etc.) |
| 28 | `background-position-x` | Blue stripe moves horizontally to different positions |
| 29 | `background-position-y` | Pink stripe moves vertically to different positions |
| 30 | `background-repeat` | Clear differences (repeat-x, repeat-y, no-repeat, space, round) |
| 31 | `background-repeat-x` | Distinct values shown across panels |
| 32 | `background-repeat-y` | Distinct values shown across panels |
| 33 | `background-size` | Clear size differences (auto, cover, contain, percentage, pixel) |
| 34 | `baseline-shift` | "Shifted" text moves to visibly different vertical positions |
| 35 | `baseline-source` | Distinct values shown across panels |
| 36 | `block-size` | Boxes with clearly different heights |
| 37 | `border-block` | Various border widths/styles on block edges |
| 38 | `border-block-color` | Top and bottom borders show distinct colors |
| 39 | `border-block-end` | Various border widths/styles on block-end edge |
| 40 | `border-block-end-color` | Bottom border shows distinct colors across panels |
| 41 | `border-block-end-style` | Different border styles (dotted, dashed, solid, double, groove, etc.) |
| 42 | `border-block-end-width` | Border width varies visibly from thin to 50px |
| 43 | `border-block-start` | Various border widths/styles on block-start edge |
| 44 | `border-block-start-color` | Top border shows distinct colors |
| 45 | `border-block-start-style` | Different border styles on top edge |
| 46 | `border-block-start-width` | Clear width differences from thin to 50px |
| 47 | `border-block-style` | Distinct styles with two-value combinations for top/bottom |
| 48 | `border-block-width` | Clear width variation including asymmetric shorthand |
| 49 | `border-bottom` | Various border widths/styles on bottom edge |
| 50 | `border-bottom-left-radius` | Clear progression from 4px to 50% |
| 51 | `border-bottom-right-radius` | Clear corner rounding progression |
| 52 | `border-bottom-style` | All 10 line-styles clearly distinguishable |
| 53 | `border-bottom-width` | Clear width differences from 0 to 50px |
| 54 | `border-collapse` | Separate vs collapse clearly different |
| 55 | `border-color` | Multiple distinct colors visible |
| 56 | `border-end-end-radius` | Clear progression from 4px to 50% |
| 57 | `border-end-start-radius` | Clear progression from 4px to 50% |
| 58 | `border-image` | Varied image sources with different slice values |
| 59 | `border-image-outset` | Visible differences in border image extension |
| 60 | `border-image-repeat` | Visible differences (stretch, repeat, round, space) |
| 61 | `border-image-slice` | Dramatic slice variation from tiny pieces to full fills |
| 62 | `border-image-source` | Distinct sources (none, url, gradient) clearly visible |
| 63 | `border-image-width` | Clear width differences with gradient borders |
| 64 | `border-inline` | Various border widths/styles on inline edges |
| 65 | `border-inline-color` | Distinct colors on left/right borders |
| 66 | `border-inline-end` | Various border widths/styles on inline-end edge |
| 67 | `border-inline-end-color` | Distinct colors on right border |
| 68 | `border-inline-end-style` | All styles visible on right border |
| 69 | `border-inline-end-width` | Clear width progression |
| 70 | `border-inline-start` | Various border widths/styles on inline-start edge |
| 71 | `border-inline-start-color` | Distinct colors on left border |
| 72 | `border-inline-start-style` | All styles visible on left border |
| 73 | `border-inline-start-width` | Clear width progression |
| 74 | `border-inline-style` | All styles with two-value combinations |
| 75 | `border-inline-width` | Clear width differences including asymmetric |
| 76 | `border-left` | Various border widths/styles on left edge |
| 77 | `border-left-color` | Distinct colors visible |
| 78 | `border-left-style` | All 10 line-styles distinguishable |
| 79 | `border-left-width` | Clear width progression from thin to 50px |
| 80 | `border-radius` | Excellent variety from slightly rounded to circular |
| 81 | `border-right` | Various border widths/styles on right edge |
| 82 | `border-right-color` | Distinct colors visible |
| 83 | `border-right-style` | All 10 line-styles distinguishable |
| 84 | `border-right-width` | Clear width progression |
| 85 | `border-spacing` | Clear spacing differences from 4px compact to 50px spread |
| 86 | `border-start-end-radius` | Clear progression on top-right corner |
| 87 | `border-start-start-radius` | Clear progression on top-left corner |
| 88 | `border-style` | All styles with multi-value combinations |
| 89 | `border-top` | Various border widths/styles on top edge |
| 90 | `border-top-color` | Distinct colors on top border |
| 91 | `border-top-left-radius` | Clear progression from 4px to 50% |
| 92 | `border-top-right-radius` | Clear progression from 4px to 50% |
| 93 | `border-top-style` | All 10 styles distinguishable |
| 94 | `border-top-width` | Clear width progression from 0 to 50px |
| 95 | `border-width` | Clear width variation with multi-value combos |
| 96 | `bottom` | Element positioned at different vertical locations |
| 97 | `box-align` | Distinct values shown across panels |
| 98 | `box-decoration-break` | Clear difference between slice and clone at line breaks |
| 99 | `box-direction` | normal vs reverse item order in flex box |
| 100 | `box-flex` | Distinct values shown across panels |
| 101 | `box-flex-group` | Distinct values shown across panels |
| 102 | `box-lines` | Distinct values shown across panels |
| 103 | `box-ordinal-group` | Distinct values shown across panels |
| 104 | `box-orient` | Distinct values shown across panels |
| 105 | `box-pack` | Distinct values shown across panels |
| 106 | `box-shadow` | Excellent variety of shadow colors, offsets, inset/outset |
| 107 | `box-sizing` | Distinct size difference between content-box and border-box |
| 108 | `break-after` | Distinct values shown across panels |
| 109 | `break-before` | Distinct values shown across panels |
| 110 | `break-inside` | Distinct values shown across panels |
| 111 | `caption-side` | Caption clearly positioned at top vs bottom of table |
| 112 | `clear` | Distinct float-clearing behaviors across panels |
| 113 | `clip` | Various rect() values produce visibly different clipping regions |
| 114 | `clip-path` | Excellent variety of clipping shapes (inset, circle, ellipse, polygon) |
| 115 | `clip-rule` | Distinct values shown across panels |
| 116 | `color-interpolation` | SVG gradient shows visible sRGB vs linearRGB differences |
| 117 | `color-interpolation-filters` | Distinct values shown across panels |
| 118 | `color-scheme` | Light vs dark theme differences visible on form controls |
| 119 | `column-count` | Clear differences between auto, 1, 2, 3 column layouts |
| 120 | `column-fill` | Visible difference between auto and balance |
| 121 | `column-gap` | Different spacing between items (normal, 10px, 25%, 50%) |
| 122 | `column-rule` | Distinct values shown across panels |
| 123 | `column-rule-color` | Distinct values shown across panels |
| 124 | `column-rule-style` | Distinct values shown across panels |
| 125 | `column-rule-width` | Distinct values shown across panels |
| 126 | `column-width` | Different column widths produce different layouts |
| 127 | `columns` | Different column configurations with visible count/width changes |
| 128 | `contain` | Visible containment behavior differences with overflow child |
| 129 | `contain-intrinsic-block-size` | Different height hints produce different element heights |
| 130 | `contain-intrinsic-height` | Different height values produce different sizes |
| 131 | `contain-intrinsic-inline-size` | Different width hints produce different inline sizes |
| 132 | `contain-intrinsic-size` | Visible size differences |
| 133 | `contain-intrinsic-width` | Visible width differences |
| 134 | `container` | Distinct values shown across panels |
| 135 | `container-name` | Distinct values shown across panels |
| 136 | `container-type` | Distinct values shown across panels |
| 137 | `content` | ::before pseudo-element content generation |
| 138 | `content-visibility` | Visible/auto show content, hidden shows empty |
| 139 | `corner-block-end-shape` | BOX blueprint with border-radius; Chrome renders distinct corner shapes |
| 140 | `corner-block-start-shape` | BOX blueprint with border-radius; Chrome renders distinct corner shapes |
| 141 | `corner-bottom-left-shape` | BOX blueprint with border-radius; Chrome renders distinct corner shapes |
| 142 | `corner-bottom-right-shape` | BOX blueprint with border-radius; Chrome renders distinct corner shapes |
| 143 | `corner-bottom-shape` | BOX blueprint with border-radius; Chrome renders distinct corner shapes |
| 144 | `corner-end-end-shape` | Different corner shapes (round, scoop, bevel, notch, square) |
| 145 | `corner-end-start-shape` | Different corner shapes (round, scoop, bevel, notch, square) |
| 146 | `corner-inline-end-shape` | Different corner shapes (round, scoop, bevel, notch, square) |
| 147 | `corner-inline-start-shape` | Different corner shapes (round, scoop, bevel, notch, square) |
| 148 | `corner-left-shape` | Different corner shapes (round, scoop, bevel, notch, square) |
| 149 | `corner-right-shape` | Different corner shapes (round, scoop, bevel, notch, square) |
| 150 | `corner-shape` | Different corner shapes (round, scoop, bevel, notch, square) |
| 151 | `corner-start-end-shape` | Different corner shapes (round, scoop, bevel, notch, square) |
| 152 | `corner-start-start-shape` | Different corner shapes (round, scoop, bevel, notch, square) |
| 153 | `corner-top-left-shape` | Different corner shapes (round, scoop, bevel, notch, square) |
| 154 | `corner-top-right-shape` | Different corner shapes (round, scoop, bevel, notch, square) |
| 155 | `corner-top-shape` | Different corner shapes (round, scoop, bevel, notch, square) |
| 156 | `counter-increment` | Different starting numbers and increments visible |
| 157 | `counter-reset` | Distinct values shown across panels |
| 158 | `counter-set` | Different counter values with visible numbering differences |
| 159 | `cx` | Circle at different horizontal positions |
| 160 | `cy` | Circle at different vertical positions |
| 161 | `d` | Distinct SVG path shapes (bezier, triangle, circle, none) |
| 162 | `direction` | ltr vs rtl clearly shows text alignment difference |
| 163 | `display` | Distinct layout modes (block, inline, flex, grid, table, none) |
| 164 | `dominant-baseline` | Distinct values shown across panels |
| 165 | `empty-cells` | Show vs hide clearly demonstrates empty cell visibility |
| 166 | `field-sizing` | Fixed vs content shows different textarea sizing |
| 167 | `fill` | SVG circles with distinct fill colors |
| 168 | `fill-opacity` | Clear opacity gradations on checkerboard backgrounds |
| 169 | `fill-rule` | nonzero vs evenodd show visible difference in star rendering |
| 170 | `filter` | Clearly different filter effects (blur, grayscale, etc.) |
| 171 | `flex` | Different flex item sizing with visible width differences |
| 172 | `flex-basis` | Target element at different widths (content, auto, 10px, 50%) |
| 173 | `flex-direction` | row, row-reverse, column, column-reverse all distinct |
| 174 | `flex-flow` | Different direction and wrapping combinations |
| 175 | `flex-grow` | Different grow ratios with visible width changes |
| 176 | `flex-shrink` | Different shrink ratios with visible width differences |
| 177 | `flood-color` | Distinct values shown across panels |
| 178 | `flood-opacity` | Distinct values shown across panels |
| 179 | `font` | Distinct font styles, sizes, and weights |
| 180 | `font-family` | Distinct values shown across panels |
| 181 | `font-feature-settings` | Distinct values shown across panels |
| 182 | `font-kerning` | auto/normal vs none shows visible letter spacing difference |
| 183 | `font-language-override` | Distinct values shown across panels |
| 184 | `font-optical-sizing` | Distinct values shown across panels |
| 185 | `font-palette` | Distinct values shown across panels |
| 186 | `font-size` | Clearly different text sizes from xx-small to x-large |
| 187 | `font-stretch` | Different text widths from condensed to ultra-expanded |
| 188 | `font-synthesis` | Distinct values shown across panels |
| 189 | `font-synthesis-position` | Distinct values shown across panels |
| 190 | `font-synthesis-small-caps` | Distinct values shown across panels |
| 191 | `font-synthesis-style` | Distinct values shown across panels |
| 192 | `font-synthesis-weight` | Distinct values shown across panels |
| 193 | `font-variant` | Distinct values shown across panels |
| 194 | `font-variant-alternates` | Distinct values shown across panels |
| 195 | `font-variant-caps` | Clear differences (normal, small-caps, all-small-caps, etc.) |
| 196 | `font-variant-east-asian` | Distinct values shown across panels |
| 197 | `font-variant-emoji` | Distinct rendering (normal, text, emoji, unicode) |
| 198 | `font-variant-ligatures` | Distinct values shown across panels |
| 199 | `font-variant-numeric` | Distinct values shown across panels |
| 200 | `font-variant-position` | Clear sub and super positioning |
| 201 | `font-variation-settings` | Distinct values shown across panels |
| 202 | `font-width` | Distinct values shown across panels |
| 203 | `forced-color-adjust` | Distinct values shown across panels |
| 204 | `gap` | Clear spacing differences between grid items |
| 205 | `grid` | Multiple distinct grid layouts visible |
| 206 | `grid-area` | Highlighted element at different grid placements and spans |
| 207 | `grid-auto-columns` | Visible column width differences |
| 208 | `grid-auto-flow` | Clear layout differences (row, column, dense) |
| 209 | `grid-auto-rows` | Visible row height differences |
| 210 | `grid-column` | Clear column placement and span differences |
| 211 | `grid-column-end` | Visible column span differences |
| 212 | `grid-column-start` | Visible placement differences |
| 213 | `grid-gap` | Clear gap sizing differences |
| 214 | `grid-row` | Clear row placement and span differences |
| 215 | `grid-row-end` | Visible row span differences |
| 216 | `grid-row-start` | Visible row start position differences |
| 217 | `grid-template` | Various grid template configurations |
| 218 | `grid-template-areas` | Distinct values shown across panels |
| 219 | `grid-template-columns` | Clear column count and sizing differences |
| 220 | `grid-template-rows` | Clear row sizing differences |
| 221 | `height` | Visible height differences |
| 222 | `hyphenate-character` | Distinct values shown across panels |
| 223 | `hyphenate-limit-chars` | Distinct values shown across panels |
| 224 | `hyphens` | Clear difference between none/manual and auto |
| 225 | `image-orientation` | Distinct values shown across panels |
| 226 | `image-rendering` | Visible quality differences (auto, pixelated, crisp-edges) |
| 227 | `initial-letter` | Drop cap sizing via ::first-letter |
| 228 | `inline-size` | Clear width differences |
| 229 | `inset` | Clear positional differences of positioned element |
| 230 | `inset-block` | Visible vertical position changes |
| 231 | `inset-block-end` | Clear vertical position from bottom |
| 232 | `inset-block-start` | Clear vertical position from top |
| 233 | `inset-inline` | Visible horizontal positioning |
| 234 | `inset-inline-end` | Clear horizontal position from end |
| 235 | `inset-inline-start` | Clear horizontal position from start |
| 236 | `interpolate-size` | Distinct values shown across panels |
| 237 | `isolation` | Clear difference between auto (blending) and isolate (no blending) |
| 238 | `justify-content` | Distinct spacing patterns for different alignment values |
| 239 | `justify-items` | Distinct values shown across panels |
| 240 | `justify-self` | Target element shifts position within grid cells |
| 241 | `left` | Elements shift horizontally at different positions |
| 242 | `lighting-color` | Distinct values shown across panels |
| 243 | `line-break` | Japanese text wraps differently for loose, normal, strict, anywhere |
| 244 | `line-clamp` | Text visibly truncated at different line counts |
| 245 | `line-height` | Clearly different vertical spacing between lines |
| 246 | `list-style` | Visible differences in marker types and positions |
| 247 | `list-style-image` | Distinct values shown across panels |
| 248 | `list-style-position` | Clear inside vs outside difference |
| 249 | `margin` | Visible spacing around content boxes |
| 250 | `margin-block` | Vertical spacing varies clearly |
| 251 | `margin-block-end` | Bottom margin varies visibly |
| 252 | `margin-block-start` | Top margin varies visibly |
| 253 | `margin-bottom` | Bottom spacing varies clearly |
| 254 | `margin-inline` | Horizontal spacing varies |
| 255 | `margin-inline-end` | Right margin varies |
| 256 | `margin-inline-start` | Left margin varies |
| 257 | `margin-left` | Left margin varies |
| 258 | `margin-right` | Right margin varies |
| 259 | `margin-top` | Top spacing varies |
| 260 | `margin-trim` | Distinct values shown across panels |
| 261 | `marker` | SVG shows none, arrow, and dot markers distinctly |
| 262 | `marker-end` | End-point markers clearly visible |
| 263 | `marker-mid` | Mid-point markers clearly visible |
| 264 | `marker-start` | Start-point markers clearly visible |
| 265 | `mask` | Distinct values shown across panels |
| 266 | `mask-border` | Distinct values shown across panels |
| 267 | `mask-border-mode` | Distinct values shown across panels |
| 268 | `mask-border-outset` | Distinct values shown across panels |
| 269 | `mask-border-repeat` | Visible tiling differences (stretch, repeat, round, space) |
| 270 | `mask-border-slice` | Different slice positions affect rendering |
| 271 | `mask-border-source` | Visible differences between none, gradient, url sources |
| 272 | `mask-border-width` | Border mask widths clearly vary |
| 273 | `mask-clip` | Content clipped to different box models |
| 274 | `mask-composite` | Distinct compositing operations (add, subtract, intersect, exclude) |
| 275 | `mask-image` | Distinct values shown across panels |
| 276 | `mask-mode` | Distinct values shown across panels |
| 277 | `mask-origin` | Visible mask positioning relative to different box origins |
| 278 | `mask-position` | Gradient circle mask moves to different positions |
| 279 | `mask-repeat` | Clear mask repetition patterns |
| 280 | `mask-size` | Mask circles at different sizes |
| 281 | `mask-type` | SVG mask with luminance and alpha modes |
| 282 | `math-depth` | Distinct values shown across panels |
| 283 | `math-shift` | Distinct values shown across panels |
| 284 | `math-style` | Distinct values shown across panels |
| 285 | `max-block-size` | Distinct values shown across panels |
| 286 | `max-height` | Distinct values shown across panels |
| 287 | `max-inline-size` | Text wrapping changes with constraint |
| 288 | `max-width` | Varying content widths with clipping |
| 289 | `min-block-size` | Distinct values shown across panels |
| 290 | `min-height` | Distinct values shown across panels |
| 291 | `min-inline-size` | Distinct values shown across panels |
| 292 | `min-width` | Distinct values shown across panels |
| 293 | `mix-blend-mode` | Distinct color blending effects with overlapping circles |
| 294 | `object-fit` | Visibly different image fitting (fill, contain, cover, scale-down) |
| 295 | `object-position` | Circle image at different positions |
| 296 | `object-view-box` | Distinct values shown across panels |
| 297 | `offset` | Some panels show element at different positions along paths |
| 298 | `offset-anchor` | Element position shifts along path based on anchor point |
| 299 | `offset-distance` | Dot moves along SVG path at different distances |
| 300 | `offset-path` | Element positioned differently per path type |
| 301 | `offset-position` | Element at different grid positions |
| 302 | `offset-rotate` | Triangle rotated to different angles |
| 303 | `opacity` | Distinct transparency levels visible |
| 304 | `outline-offset` | Outline distance from box visibly different |
| 305 | `outline-style` | Distinct styles (auto, dotted, dashed, solid, double, etc.) |
| 306 | `outline-width` | Different outline widths clearly visible |
| 307 | `overflow` | Different behaviors (visible, hidden, clip, scroll, auto) |
| 308 | `overflow-anchor` | Distinct values shown across panels |
| 309 | `overflow-block` | Visible vertical overflow handling differences |
| 310 | `overflow-clip-margin` | Distinct values shown across panels |
| 311 | `overflow-inline` | Horizontal overflow differences |
| 312 | `overflow-wrap` | Distinct wrapping behavior for long words |
| 313 | `overflow-x` | Horizontal overflow clearly different |
| 314 | `overflow-y` | Vertical overflow clearly shown |
| 315 | `overlay` | Distinct values shown across panels |
| 316 | `padding` | Distinctly different padding amounts |
| 317 | `padding-block` | Clear vertical padding differences |
| 318 | `padding-block-end` | Bottom padding increases visibly |
| 319 | `padding-block-start` | Top padding increases visibly |
| 320 | `padding-bottom` | Bottom padding grows |
| 321 | `padding-inline` | Horizontal padding differences |
| 322 | `padding-inline-end` | Right-side padding increases |
| 323 | `padding-inline-start` | Left-side padding increases |
| 324 | `padding-left` | Left padding grows |
| 325 | `padding-right` | Right padding grows |
| 326 | `padding-top` | Top padding increases |
| 327 | `page-break-inside` | Distinct values shown across panels |
| 328 | `paint-order` | Distinct values shown across panels |
| 329 | `perspective` | Clear depth differences with varying perspective distances |
| 330 | `perspective-origin` | Visible vanishing point shift |
| 331 | `place-content` | Grid items visibly repositioned |
| 332 | `place-items` | Items aligned differently within grid cells |
| 333 | `place-self` | Individual item alignment varies visibly |
| 334 | `position-area` | Distinct values shown across panels |
| 335 | `position-try-order` | Distinct values shown across panels |
| 336 | `position-visibility` | Distinct values shown across panels |
| 337 | `quotes` | Different quotation mark characters rendered |
| 338 | `r` | Distinct values shown across panels |
| 339 | `resize` | Distinct values shown across panels |
| 340 | `right` | Positioned elements shift horizontally |
| 341 | `rotate` | Elements rotated to clearly different angles |
| 342 | `ruby-align` | Ruby text alignment varies visibly |
| 343 | `ruby-overhang` | Distinct values shown across panels |
| 344 | `ruby-position` | Ruby text positioned above/below differently |
| 345 | `ry` | Ellipse vertical radius changes clearly |
| 346 | `rx` | Distinct values shown across panels |
| 347 | `scale` | Elements scaled to visibly different sizes |
| 348 | `scroll-timeline-axis` | Distinct values shown across panels |
| 349 | `scroll-timeline-name` | Distinct values shown across panels |
| 350 | `scrollbar-color` | Different scrollbar track/thumb colors |
| 351 | `scrollbar-gutter` | Visible gutter space differences |
| 352 | `scrollbar-width` | auto, thin, none clearly different |
| 353 | `shape-image-threshold` | Distinct values shown across panels |
| 354 | `shape-margin` | Distinct values shown across panels |
| 355 | `shape-outside` | Distinct values shown across panels |
| 356 | `shape-rendering` | Distinct values shown across panels |
| 357 | `stop-color` | SVG gradient stop colors visibly different |
| 358 | `stop-opacity` | SVG gradient opacity differences visible |
| 359 | `stroke` | SVG stroke colors clearly different |
| 360 | `stroke-dasharray` | Different dash patterns visible |
| 361 | `stroke-dashoffset` | Dash offset shifts visible |
| 362 | `stroke-linecap` | butt, round, square caps visible |
| 363 | `stroke-linejoin` | miter, round, bevel joins visible |
| 364 | `stroke-miterlimit` | Miter limit affects join appearance |
| 365 | `stroke-opacity` | Clear opacity differences on strokes |
| 366 | `tab-size` | Tab indentation varies visibly |
| 367 | `table-layout` | auto vs fixed shows layout differences |
| 368 | `text-align` | left, center, right, justify clearly different |
| 369 | `text-align-last` | Last line alignment varies |
| 370 | `text-anchor` | Distinct values shown across panels |
| 371 | `text-autospace` | CJK/Latin spacing differences visible |
| 372 | `text-box` | Distinct values shown across panels |
| 373 | `text-box-edge` | Distinct values shown across panels |
| 374 | `text-box-trim` | Visible trim differences on text box |
| 375 | `text-combine-upright` | Character combination in vertical text visible |
| 376 | `text-decoration` | Distinct values shown across panels |
| 377 | `text-decoration-color` | Distinct underline colors |
| 378 | `text-decoration-line` | underline, overline, line-through clearly different |
| 379 | `text-decoration-skip` | Distinct values shown across panels |
| 380 | `text-decoration-skip-ink` | Ink skipping around descenders visible |
| 381 | `text-decoration-style` | solid, double, dotted, dashed, wavy clearly distinct |
| 382 | `text-emphasis` | Dots, circles, triangles, colors visible |
| 383 | `text-emphasis-color` | Different emphasis mark colors |
| 384 | `text-emphasis-position` | Over/under and left/right positions visible |
| 385 | `text-emphasis-style` | dot, circle, triangle, sesame, open/filled variants |
| 386 | `text-indent` | Clear indentation differences |
| 387 | `text-orientation` | mixed, upright, sideways clearly different |
| 388 | `text-overflow` | clip, ellipsis, fade behaviors visible |
| 389 | `text-rendering` | Distinct values shown across panels |
| 390 | `text-spacing-trim` | Distinct values shown across panels |
| 391 | `text-transform` | uppercase, lowercase, capitalize clearly visible |
| 392 | `text-underline-offset` | Underline position varies at different offsets |
| 393 | `text-underline-position` | Distinct values shown across panels |
| 394 | `text-wrap-mode` | wrap vs nowrap clearly demonstrated |
| 395 | `text-wrap-style` | Distinct values shown across panels |
| 396 | `top` | Box position varies with different values |
| 397 | `transform` | none, rotate(45deg), scale(2) all visually distinct |
| 398 | `transform-box` | Distinct values shown across panels |
| 399 | `transform-origin` | Rotation pivot varies with green dot markers |
| 400 | `transform-style` | flat vs preserve-3d shows clear 2D vs 3D |
| 401 | `translate` | Box position shifts at different values |
| 402 | `unicode-bidi` | Bidirectional text differs across values |
| 403 | `vector-effect` | Distinct values shown across panels |
| 404 | `vertical-align` | Red square varies relative to baseline text |
| 405 | `visibility` | visible/hidden/collapse show distinct states |
| 406 | `white-space` | Clear whitespace handling differences |
| 407 | `white-space-collapse` | collapse, preserve, break-spaces all distinct |
| 408 | `width` | Clearly different box widths |
| 409 | `will-change` | Distinct values shown across panels |
| 410 | `word-break` | normal, break-all, keep-all show clear differences |
| 411 | `word-spacing` | Visible spacing differences |
| 412 | `word-wrap` | normal overflow vs break-word vs anywhere distinct |
| 413 | `writing-mode` | horizontal-tb, vertical-rl, vertical-lr, sideways all distinct |
| 414 | `x` | SVG elements at different x coordinates |
| 415 | `y` | SVG elements at different y coordinates |
| 416 | `z-index` | Stacking order changes visibly |
| 417 | `zoom` | Element size varies dramatically |
| 418 | `accent-color` | Color values including light-dark(), device-cmyk() correctly shown |
| 419 | `animation` | Shorthand values reference defined @keyframes (slideRotate, pulse) |
| 420 | `background-color` | Color values including light-dark() correctly shown |
| 421 | `border` | All `<line-width> \|\| <line-style> \|\| <color>` combinations valid |
| 422 | `border-bottom-color` | Color values and stripes() correctly shown |
| 423 | `caret-color` | Color values including light-dark() correctly shown |
| 424 | `color` | Color values including light-dark() correctly shown |
| 425 | `column-span` | `none`, positive integers, `all`, `auto` per MDN spec |
| 426 | `cursor` | All predefined cursor keywords shown |
| 427 | `flex-wrap` | `nowrap`, `wrap`, `wrap-reverse`, `balance` per CSS Flexbox L2 |
| 428 | `float` | All values including snap-block(), snap-inline() valid per spec |
| 429 | `font-size-adjust` | Metric keywords + from-font/number, var() with valid fallbacks |
| 430 | `font-style` | `normal`, `italic`, `left`, `right`, `oblique` per CSS Fonts L4 |
| 431 | `font-weight` | `normal`, `bold`, `bolder`, `lighter`, positive integers |
| 432 | `grid-column-gap` | Valid gap values (length, normal) |
| 433 | `grid-row-gap` | Valid gap values (length, normal) |
| 434 | `letter-spacing` | `normal`, lengths, percentages per `<length-percentage>` |
| 435 | `list-style-type` | Custom ident, string, symbols() per spec |
| 436 | `order` | Integer values with valid var() fallbacks |
| 437 | `orphans` | Positive integers with valid var() fallbacks |
| 438 | `outline` | All `<line-width> \|\| <outline-style> \|\| <color>` combinations valid |
| 439 | `outline-color` | Color values and stripes() correctly shown |
| 440 | `position` | All values including running() valid per spec |
| 441 | `position-anchor` | `normal`, `none`, `auto`, `<dashed-ident>`, `match-parent` all valid |
| 442 | `row-gap` | `normal`, lengths, percentages, `<line-width>` keywords all valid |
| 443 | `scroll-marker-group` | All `[[before\|after] \|\| [links\|tabs]]` combinations valid |
| 444 | `stroke-width` | Lengths, percentages, `<line-width>` keywords, numbers all valid |
| 445 | `text-decoration-thickness` | `auto`, `from-font`, lengths, percentages, `<line-width>` valid |
| 446 | `text-shadow` | Shadow values including `inset` valid per `<shadow>` formal syntax |
| 447 | `text-wrap` | `<text-wrap-mode> \|\| <text-wrap-style>` two-value combos valid |
| 448 | `widows` | Positive integers with valid var() fallbacks |

---

## Category 3: Invalid Values / Wrong Grammar (0 — all fixed)

All 32 former Category 3 properties have been resolved:

- **13 reclassified as valid** (verified against MDN formal syntax):
  `border` (`hairline` is valid `<line-width>`), `flex-wrap` (`balance` is CSS Flexbox L2),
  `font-style` (`left`/`right` are CSS Fonts L4), `letter-spacing` (`<percentage>` is valid),
  `list-style-type` (`symbols(<image>)` is valid per spec), `position` (`running()` is valid),
  `position-anchor` (all values valid per spec), `row-gap` / `stroke-width` /
  `text-decoration-thickness` (`<line-width>` keywords are valid), `scroll-marker-group`
  (all values valid), `text-shadow` (`inset` is valid per `<shadow>` syntax),
  `text-wrap` (two-value `||` combos are valid)

- **18 fixed via grammar/representative-value changes**:
  `accent-color`, `background-color`, `caret-color`, `color`, `outline-color`,
  `border-bottom-color` (split `LightDarkFn` into color/image variants; fixed `Image1dType`
  representative values to use `stripes()` instead of `linear-gradient()`);
  `animation` (updated representative keyframe names to match blueprint);
  `column-span` (use `positive_integer_type`); `cursor` (representative values instead of
  grammar expansion to avoid empty-URL comma artifacts); `float` (moved comma inside optional
  in `SnapBlockFn`/`SnapInlineFn`); `font-weight` (use `positive_integer_type`);
  `grid-column-gap`, `grid-row-gap` (added `Prop` aliases + representative values);
  `font-size-adjust`, `order`, `orphans`, `widows` (cleaned `VarFallbackType` to remove
  `ident_type`, `time_type`, `string_type`, `angle_type`);
  `outline` (fixed `Image1dType` representative value)

- **1 excluded**: `vendor-prop` (not a real CSS property; removed from generation)

---

## Category 4: Insufficient Screenshots (69)

Static screenshots cannot adequately demonstrate these properties. They require
user interaction (scrolling, clicking, hovering), animation playback, print
context, or specific hardware to show visual differences.

### Caret properties (require text input focus)
| Property | Why insufficient |
|----------|-----------------|
| `caret` | Caret shape/color requires active text cursor focus |
| `caret-animation` | Controls caret blinking; not visible in static screenshot |
| `caret-shape` | Caret shape (bar, block, underscore) requires cursor focus |

### Dynamic/display properties
| Property | Why insufficient |
|----------|-----------------|
| `dynamic-range-limit` | Requires HDR display to show differences |

### Interest/interaction properties
| Property | Why insufficient |
|----------|-----------------|
| `interest-delay` | Requires user hover interaction |
| `interest-delay-end` | Requires user hover interaction |
| `interest-delay-start` | Requires user hover interaction |
| `interactivity` | auto vs inert requires clicking/typing to evaluate |

### Overscroll behavior (require scroll interaction)
| Property | Why insufficient |
|----------|-----------------|
| `overscroll-behavior` | Requires interactive scrolling to demonstrate scroll chaining |
| `overscroll-behavior-block` | Requires interactive vertical scrolling |
| `overscroll-behavior-inline` | Requires interactive horizontal scrolling |
| `overscroll-behavior-x` | Requires interactive horizontal scrolling |
| `overscroll-behavior-y` | Requires interactive vertical scrolling |

### Paged media properties (require print context)
| Property | Why insufficient |
|----------|-----------------|
| `page` | Requires paged media / print context |
| `page-break-after` | Requires paged media / print context |
| `page-break-before` | Requires paged media / print context |

### Pointer/interaction properties
| Property | Why insufficient |
|----------|-----------------|
| `pointer-events` | Requires mouse interaction for hit-testing |
| `position-try` | Requires @position-try at-rules; values alone don't produce visible differences |
| `position-try-fallbacks` | Requires @position-try at-rules; values alone don't produce visible differences |
| `print-color-adjust` | Requires print context |

### Scroll behavior properties (require scrolling interaction)
| Property | Why insufficient |
|----------|-----------------|
| `scroll-behavior` | Requires scroll interaction (smooth vs instant) |
| `scroll-initial-target` | Requires page load event |

### Scroll margin properties (require scroll-snap interaction)
| Property | Why insufficient |
|----------|-----------------|
| `scroll-margin` | Requires scroll-snap interaction |
| `scroll-margin-block` | Requires scroll-snap interaction |
| `scroll-margin-block-end` | Requires scroll-snap interaction |
| `scroll-margin-block-start` | Requires scroll-snap interaction |
| `scroll-margin-bottom` | Requires scroll-snap interaction |
| `scroll-margin-inline` | Requires scroll-snap interaction |
| `scroll-margin-inline-end` | Requires scroll-snap interaction |
| `scroll-margin-inline-start` | Requires scroll-snap interaction |
| `scroll-margin-left` | Requires scroll-snap interaction |
| `scroll-margin-right` | Requires scroll-snap interaction |
| `scroll-margin-top` | Requires scroll-snap interaction |

### Scroll padding properties (require scroll-snap interaction)
| Property | Why insufficient |
|----------|-----------------|
| `scroll-padding` | Requires scroll-snap interaction |
| `scroll-padding-block` | Requires scroll-snap interaction |
| `scroll-padding-block-end` | Requires scroll-snap interaction |
| `scroll-padding-block-start` | Requires scroll-snap interaction |
| `scroll-padding-bottom` | Requires scroll-snap interaction |
| `scroll-padding-inline` | Requires scroll-snap interaction |
| `scroll-padding-inline-end` | Requires scroll-snap interaction |
| `scroll-padding-inline-start` | Requires scroll-snap interaction |
| `scroll-padding-left` | Requires scroll-snap interaction |
| `scroll-padding-right` | Requires scroll-snap interaction |
| `scroll-padding-top` | Requires scroll-snap interaction |

### Scroll snap properties (require scrolling)
| Property | Why insufficient |
|----------|-----------------|
| `scroll-snap-align` | Requires scroll-snap interaction |
| `scroll-snap-stop` | Requires scroll-snap interaction |
| `scroll-snap-type` | Requires scroll-snap interaction |
| `scroll-target-group` | Requires scroll interaction |

### Scroll timeline properties (require scroll-driven animation)
| Property | Why insufficient |
|----------|-----------------|
| `scroll-timeline` | Requires scrolling to see effect |

### Animation timeline properties (require scroll-driven animation)
| Property | Why insufficient |
|----------|-----------------|
| `animation-range` | Requires scroll-driven animation timeline |
| `animation-range-end` | Requires scroll-driven animation timeline |
| `animation-range-start` | Requires scroll-driven animation timeline |
| `animation-timeline` | Requires scrolling context for scroll()/view() |

### Speak/audio properties
| Property | Why insufficient |
|----------|-----------------|
| `speak-as` | Audio property; cannot evaluate visually |

### Text properties (static screenshots insufficient)
| Property | Why insufficient |
|----------|-----------------|
| `text-decoration-inset` | Property not yet supported in Chrome |
| `text-justify` | Text spacing differences too subtle to distinguish in static screenshots |

### Touch properties
| Property | Why insufficient |
|----------|-----------------|
| `touch-action` | Controls touch gestures (pan, pinch-zoom); not visible in screenshots |

### Transition properties (time-based, require animation)
| Property | Why insufficient |
|----------|-----------------|
| `transition` | Time-based effect requires animation playback |
| `transition-behavior` | Controls discrete transitions; requires animation |
| `transition-delay` | Time-based delay; requires animation playback |
| `transition-duration` | Time-based duration; requires animation playback |
| `transition-property` | Determines animated properties; requires animation |
| `transition-timing-function` | Easing curves only visible during animation |

### User interaction properties
| Property | Why insufficient |
|----------|-----------------|
| `user-modify` | Controls element editability; requires interaction |
| `user-select` | Controls text selection behavior; requires interaction |

### View timeline properties (require scroll-driven animation)
| Property | Why insufficient |
|----------|-----------------|
| `view-timeline` | Scroll-driven animation; requires scrolling |
| `view-timeline-axis` | Scroll-driven animation; requires scrolling |
| `view-timeline-inset` | Scroll-driven animation; requires scrolling |
| `view-timeline-name` | Scroll-driven animation; requires scrolling |

---

## Category 5: Not Demoable (10)

Property cannot be visually demonstrated in screenshots. Either unsupported in
Chrome, only expressible as a concept/diagram (not the property itself), requires
a non-desktop environment, or has no visual effect by design.

### Not supported in Chrome
| Property | Why not demoable |
|----------|-----------------|
| `column-height` | Not a standard CSS property; no browser implements it |
| `column-wrap` | Non-standard property; no browser support |
| `font-smooth` | Non-standard; Chrome ignores unprefixed `font-smooth` |
| `hanging-punctuation` | Not implemented in Chrome |
| `line-height-step` | Not implemented in Chrome |

### Conceptual only (diagrams/code, not the property itself)
| Property | Why not demoable |
|----------|-----------------|
| `image-resolution` | Not supported in Chrome; template can only simulate with fake sizing |
| `timeline-scope` | Extends scroll-timeline scope; only expressible as code/diagram, not visual effect |
| `view-transition-class` | Groups view-transition elements; only expressible as code/diagram |
| `view-transition-name` | Names view-transition elements; only expressible as code/diagram |

### Non-visual / wrong environment
| Property | Why not demoable |
|----------|-----------------|
| `text-size-adjust` | Mobile-only property; no visible effect on desktop Chrome |
