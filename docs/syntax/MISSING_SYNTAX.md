# Missing formal syntax entries

The following entries/webpages did not have a formal syntax section (or our script could not pick up from there). So we had to handle them specially: write a dedicated script or write the EBNF manually

**DONE**: Added to the EBNF files (manually after deeper dive into the docs).
**EXPERIMENTAL**: The feature is still experimental and not enough documentation is available to get the syntax.
**DEPRECATED**: The feature is deprecated and is encouraged to not use it.
**UNCLEAR**: The Syntax definition in the page is not well formatted or not very obvious
**EXCLUDED**: These are either covered by other pages, or are not relevant for the CSS syntax definition

## properties

- [EXPERIMENTAL] reading-flow — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/reading-flow
- [EXPERIMENTAL] reading-order — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/reading-order

## functions

- [DEPRECATED] -moz-image-rect() — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/-moz-image-rect
- [DONE] contrast-color — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/contrast-color
- [EXPERIMENTAL] if() — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/if
- [DONE] sibling-count() — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-count
- [DONE] sibling-index() — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/sibling-index

## atrules

- [DONE] @charset — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@charset
- [DEPRECATED] @document () — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@document
- [DONE] font-display (@font-feature-values) — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-feature-values/font-display



## datatypes

- [DONE] absolute-size — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/absolute-size
- [DONE] angle — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/angle
- [DONE] baseline-position — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/baseline-position
- [DONE] basic-shape — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/basic-shape
- [DONE] box-edge — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/box-edge
- [DONE] calc-keyword — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/calc-keyword
- [DONE] content-distribution — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/content-distribution
- [DONE] content-position — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/content-position
- [DONE] custom-ident — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/custom-ident
- [EXPERIMENTAL] dashed-function — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/dashed-function 
- [DONE] dashed-ident — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/dashed-ident
- [DONE] dimension — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/dimension
- [DONE] flex — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/flex_value
- [DONE] frequency — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/frequency
- [DONE] hex-color — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/hex-color
- [DONE] ident — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/ident
- [DONE] integer — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/integer
- [DONE] length — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length
- [DONE] named-color — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/named-color
- [DONE] number — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/number
- [DONE] overflow-position — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/overflow-position
- [DONE] overflow — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/overflow_value
- [DONE] percentage — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/percentage
- [DONE] position-area — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/position-area_value
- [DONE] relative-size — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/relative-size
- [DONE] resolution — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/resolution
- [DONE] self-position — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/self-position
- [DEPRECATED] shape — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/shape
- [DONE] string — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/string
- [DONE] system-color — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/system-color
- [DONE] time — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/time
- [DONE] transform-function — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/transform-function
- [DONE] url — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/url_value



## selectors

Note: names had `#syntax` fragment appended by the scraper — stripped here.

- [ ] Webkit pseudo-classes — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Webkit_extensions#pseudo-classes
- [DONE] Attribute selectors — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Attribute_selectors
- [DONE] Class selectors — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Class_selectors
- [DONE] ID selectors — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/ID_selectors
- [DONE] Type selectors — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Type_selectors
- [DONE] Universal selectors — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Universal_selectors



## pseudo-classes

Scraped via `scripts/scrape_pseudo.py`, targeting the `#syntax` h2 section (MDN pseudo pages
don't have `#formal_syntax`). 96/100 entries found. The 4 remaining are non-CSS-selector pages
and are excluded (they're HTML elements and higher level APIs):

- [EXCLUDED] textarea — https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/textarea
- [EXCLUDED] input — https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input
- [EXCLUDED] WebVTT_API — https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API
- [EXCLUDED] View_Transition_API — https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API


## combinators

Scraped via `scripts/scrape_pseudo.py`. 5/5 entries found — no missing entries.

## miscvalues

- [DONE] !important — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/important
- [DONE] fit-content — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/fit-content
- [DONE] inherit — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/inherit
- [DONE] initial — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/initial
- [DONE] max-content — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/max-content
- [DONE] min-content — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/min-content
- [DONE] revert — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/revert
- [DONE] revert-layer — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/revert-layer
- [DONE] unset — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/unset
