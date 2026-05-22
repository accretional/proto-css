
# CSS Terminal Value Constraints

Every constraint on a leaf (terminal) CSS value type that is not expressible
in a context-free grammar. Collected from MDN formal-syntax sections,
CSS specifications (CSS Values L4, CSS Color L4, CSS Backgrounds L4,
CSS Flexbox, CSS Grid, CSS Transforms, CSS Filters, CSS Shapes, etc.),
and the EBNF grammar in `lang/datatype.ebnf`.

Notation:
- `non-negative`  = [0,∞]
- `positive`      = (0,∞) — strictly greater than zero
- `[a, b]`        = closed range, inclusive
- `(a, b)`        = open range, exclusive on that bound
- `clamped`       = out-of-range values are clamped, not rejected

---

## Data Type

alpha-value: number [0, 1] clamped , percentage [0, 100] clamped

flex_value: number non-negative
flex_value: (the fr unit value must be non-negative)

ratio: number non-negative / number non-negative
ratio: (both components must be non-negative; degenerate ratios 0/x are valid)

resolution: number positive
resolution: (dpi, dpcm, dppx/x units; must be strictly greater than zero)

---

## Function

### Filter Functions

blur(): length non-negative

brightness(): number non-negative , percentage non-negative

contrast(): number non-negative , percentage non-negative

drop-shadow(): blur-radius length non-negative
drop-shadow(): (offset-x, offset-y are length unrestricted; blur-radius is non-negative)

grayscale(): number [0, 1] clamped , percentage [0, 100] clamped

hue-rotate(): angle unrestricted

invert(): number [0, 1] clamped , percentage [0, 100] clamped

opacity(): number [0, 1] clamped , percentage [0, 100] clamped

saturate(): number non-negative , percentage non-negative

sepia(): number [0, 1] clamped , percentage [0, 100] clamped

### Color Functions

rgb(): R,G,B number [0, 255] , R,G,B percentage [0, 100] , alpha number [0, 1] , alpha percentage [0, 100]
rgb(): (values outside range are valid in modern syntax but clamped to gamut)

hsl(): H angle unrestricted , S percentage [0, 100] , L percentage [0, 100] , alpha number [0, 1]
hsl(): (modern syntax also accepts number for S,L; hue wraps modulo 360)

hwb(): H angle unrestricted , W percentage [0, 100] , B percentage [0, 100] , alpha number [0, 1]
hwb(): (W+B > 100% is valid; they are normalized proportionally)

lab(): L number [0, 100] , L percentage [0, 100] , a number [-125, 125] , b number [-125, 125] , alpha number [0, 1]
lab(): (a,b percentage maps to [-100%, 100%] → [-125, 125])

lch(): L number [0, 100] , L percentage [0, 100] , C number [0, 150] , C percentage [0, 100] , H angle unrestricted , alpha number [0, 1]
lch(): (C percentage maps [0,100%] → [0,150]; negative C is invalid)

oklab(): L number [0, 1] , L percentage [0, 100] , a number [-0.4, 0.4] , b number [-0.4, 0.4] , alpha number [0, 1]
oklab(): (a,b percentage maps [-100%,100%] → [-0.4,0.4])

oklch(): L number [0, 1] , L percentage [0, 100] , C number [0, 0.4] , C percentage [0, 100] , H angle unrestricted , alpha number [0, 1]
oklch(): (C percentage maps [0,100%] → [0,0.4]; negative C is invalid)

color(): components number [0, 1] , components percentage [0, 100] , alpha number [0, 1]
color(): (predefined RGB spaces: srgb, display-p3, a98-rgb, prophoto-rgb, rec2020, etc.)

color-mix(): percentage [0, 100] , percentage [0, 100]
color-mix(): (mixing percentages; if both specified, must sum to ≤100%; remainder auto-distributed)

device-cmyk(): C,M,Y,K number [0, 1] , C,M,Y,K percentage [0, 100] , alpha number [0, 1]

### Easing Functions

cubic-bezier(): x1 number [0, 1] , y1 number unrestricted , x2 number [0, 1] , y2 number unrestricted
cubic-bezier(): (x coordinates must be [0,1]; y coordinates are unrestricted for overshoot)

steps(): integer positive
steps(): (step count must be ≥ 1)

linear(): output number unrestricted , input percentage unrestricted
linear(): (input percentages should be ascending for well-defined behavior)

### Transform Functions

matrix(): number unrestricted (6 values)

matrix3d(): number unrestricted (16 values)

perspective(): length positive
perspective(): (must be strictly > 0; 0 and negative values are invalid)

rotate(): angle unrestricted
rotate3d(): x number unrestricted , y number unrestricted , z number unrestricted , angle unrestricted
rotateX(): angle unrestricted
rotateY(): angle unrestricted
rotateZ(): angle unrestricted

scale(): number unrestricted , percentage unrestricted (1-2 values)
scale3d(): number unrestricted , number unrestricted , number unrestricted
scaleX(): number unrestricted
scaleY(): number unrestricted
scaleZ(): number unrestricted

skew(): angle unrestricted , angle unrestricted
skewX(): angle unrestricted
skewY(): angle unrestricted

translate(): length-percentage unrestricted , length-percentage unrestricted
translate3d(): length-percentage unrestricted , length-percentage unrestricted , length unrestricted
translateX(): length-percentage unrestricted
translateY(): length-percentage unrestricted
translateZ(): length unrestricted

### Basic Shape Functions

circle(): radius length-percentage non-negative

ellipse(): rx length-percentage non-negative , ry length-percentage non-negative

inset(): offsets length-percentage unrestricted , round border-radius length-percentage non-negative

polygon(): coordinates length-percentage unrestricted

xywh(): x length-percentage unrestricted , y length-percentage unrestricted , width length-percentage non-negative , height length-percentage non-negative , round border-radius length-percentage non-negative

rect(): sides length-percentage unrestricted , round border-radius length-percentage non-negative

### Gradient Functions

radial-gradient(): explicit-size length non-negative (circle) , explicit-size length-percentage non-negative (ellipse, 2 values)
radial-gradient(): (color stop positions are length-percentage unrestricted)

conic-gradient(): from angle unrestricted
conic-gradient(): (angular color stop positions are angle-percentage unrestricted)

### Math Functions

clamp(): min value , central value , max value (all same type; result clamped to [min,max])

round(): value (type-dependent) , interval (type-dependent, non-zero)

### Other Functions

cross-fade(): percentage [0, 100]
cross-fade(): (image mixing percentage; percentages across images should sum to 100%)

fit-content(): length-percentage non-negative

minmax(): min length-percentage non-negative | flex non-negative , max length-percentage non-negative | flex non-negative

repeat(): integer positive | auto-fill | auto-fit
repeat(): (integer repetition count must be ≥ 1)

superellipse(): number [2, ∞]
superellipse(): (curvature parameter; 2 = ellipse, ∞ = rectangle; values below 2 invalid)

image-set(): resolution positive
image-set(): (resolution descriptor must be strictly positive)

ray(): angle unrestricted

---

## Property

### Opacity & Alpha

opacity: alpha-value
alpha-value: number [0, 1] clamped , percentage [0, 100] clamped

fill-opacity: alpha-value
alpha-value: number [0, 1] clamped

flood-opacity: alpha-value
alpha-value: number [0, 1] clamped

stop-opacity: alpha-value
alpha-value: number [0, 1] clamped

stroke-opacity: alpha-value
alpha-value: number [0, 1] clamped

shape-image-threshold: number [0, 1] clamped

### Box Sizing (Width / Height)

width: length-percentage non-negative , auto , min-content , max-content , fit-content , fit-content()
height: length-percentage non-negative , auto , min-content , max-content , fit-content , fit-content()

min-width: length-percentage non-negative , auto , min-content , max-content , fit-content , fit-content()
min-height: length-percentage non-negative , auto , min-content , max-content , fit-content , fit-content()

max-width: length-percentage non-negative , none , min-content , max-content , fit-content , fit-content()
max-height: length-percentage non-negative , none , min-content , max-content , fit-content , fit-content()

block-size: length-percentage non-negative , auto , min-content , max-content , fit-content
inline-size: length-percentage non-negative , auto , min-content , max-content , fit-content

min-block-size: length-percentage non-negative , auto , min-content , max-content , fit-content
min-inline-size: length-percentage non-negative , auto , min-content , max-content , fit-content

max-block-size: length-percentage non-negative , none , min-content , max-content , fit-content
max-inline-size: length-percentage non-negative , none , min-content , max-content , fit-content

### Margin

margin-top: length-percentage unrestricted , auto
margin-right: length-percentage unrestricted , auto
margin-bottom: length-percentage unrestricted , auto
margin-left: length-percentage unrestricted , auto

margin-block-start: length-percentage unrestricted , auto
margin-block-end: length-percentage unrestricted , auto
margin-inline-start: length-percentage unrestricted , auto
margin-inline-end: length-percentage unrestricted , auto

### Padding

padding-top: length-percentage non-negative
padding-right: length-percentage non-negative
padding-bottom: length-percentage non-negative
padding-left: length-percentage non-negative

padding-block-start: length-percentage non-negative
padding-block-end: length-percentage non-negative
padding-inline-start: length-percentage non-negative
padding-inline-end: length-percentage non-negative

### Border Width

border-top-width: line-width
border-right-width: line-width
border-bottom-width: line-width
border-left-width: line-width
line-width: length non-negative , thin , medium , thick

border-block-start-width: line-width
border-block-end-width: line-width
border-inline-start-width: line-width
border-inline-end-width: line-width
border-block-width: line-width
border-inline-width: line-width

outline-width: line-width

column-rule-width: line-width

### Border Radius

border-top-left-radius: length-percentage non-negative (1-2 values)
border-top-right-radius: length-percentage non-negative (1-2 values)
border-bottom-right-radius: length-percentage non-negative (1-2 values)
border-bottom-left-radius: length-percentage non-negative (1-2 values)

border-start-start-radius: length-percentage non-negative (1-2 values)
border-start-end-radius: length-percentage non-negative (1-2 values)
border-end-start-radius: length-percentage non-negative (1-2 values)
border-end-end-radius: length-percentage non-negative (1-2 values)

border-radius: length-percentage non-negative
border-radius: (1-4 values [ / 1-4 values ]; all components non-negative)

### Border Image

border-image-outset: length non-negative , number non-negative (1-4 values)

border-image-slice: number non-negative , percentage [0, 100] (1-4 values)
border-image-slice: (percentage is [0,100]; number has no upper bound)

border-image-width: length-percentage non-negative , number non-negative , auto (1-4 values)

### Border Spacing

border-spacing: length non-negative (1-2 values)

### Positioning

top: length-percentage unrestricted , auto
right: length-percentage unrestricted , auto
bottom: length-percentage unrestricted , auto
left: length-percentage unrestricted , auto

inset-block-start: length-percentage unrestricted , auto
inset-block-end: length-percentage unrestricted , auto
inset-inline-start: length-percentage unrestricted , auto
inset-inline-end: length-percentage unrestricted , auto

z-index: integer unrestricted , auto

### Flexbox

flex-grow: number non-negative
flex-shrink: number non-negative
flex-basis: length-percentage non-negative , auto , content

order: integer unrestricted

### Grid

column-count: integer positive , auto
column-count: (must be ≥ 1)

column-width: length non-negative , auto
column-width: (must be > 0 in practice; 0 is treated as invalid by some UAs)

column-gap: length-percentage non-negative , normal
row-gap: length-percentage non-negative , normal

grid-column-start: integer non-zero , auto , custom-ident , span
grid-column-end: integer non-zero , auto , custom-ident , span
grid-row-start: integer non-zero , auto , custom-ident , span
grid-row-end: integer non-zero , auto , custom-ident , span
grid-column-start: (integer can be negative but not zero)

grid-auto-columns: length-percentage non-negative , flex non-negative , min-content , max-content , auto
grid-auto-rows: length-percentage non-negative , flex non-negative , min-content , max-content , auto
grid-template-columns: length-percentage non-negative , flex non-negative , min-content , max-content , auto
grid-template-rows: length-percentage non-negative , flex non-negative , min-content , max-content , auto

### Font

font-size: length-percentage non-negative , absolute-size , relative-size

font-weight: number [1, 1000] , normal , bold

font-width: percentage non-negative , normal , condensed , expanded , ultra-condensed , extra-condensed , semi-condensed , semi-expanded , extra-expanded , ultra-expanded
font-stretch: percentage non-negative , normal , condensed , expanded , ultra-condensed , extra-condensed , semi-condensed , semi-expanded , extra-expanded , ultra-expanded

font-size-adjust: number non-negative , none , from-font

font-style: normal , italic , oblique angle [-90deg, 90deg]
font-style: (oblique angle defaults to 14deg if omitted)

font-variation-settings: normal , string number unrestricted
font-variation-settings: (tag string + number value pairs; number is unrestricted)

### Line Height & Spacing

line-height: number non-negative , length-percentage non-negative , normal

line-height-step: length non-negative

letter-spacing: length unrestricted , normal

word-spacing: length-percentage unrestricted , normal

text-indent: length-percentage unrestricted

### Text

text-decoration-thickness: length unrestricted , percentage unrestricted , auto , from-font

text-underline-offset: length unrestricted , auto

text-shadow: offset-x length unrestricted , offset-y length unrestricted , blur-radius length non-negative

text-size-adjust: percentage non-negative , auto , none

### Tab

tab-size: number non-negative , length non-negative

### Box Shadow

box-shadow: shadow
shadow: offset-x length unrestricted , offset-y length unrestricted , blur-radius length non-negative , spread-radius length unrestricted

### Aspect Ratio

aspect-ratio: auto , ratio
ratio: number non-negative / number non-negative

### Background

background-size: length-percentage non-negative , auto , cover , contain

background-position-x: length-percentage unrestricted , left , center , right
background-position-y: length-percentage unrestricted , top , center , bottom

### Mask

mask-size: length-percentage non-negative , auto , cover , contain

mask-border-outset: length non-negative , number non-negative (1-4 values)

mask-border-slice: number non-negative , percentage non-negative (1-4 values)

mask-border-width: length-percentage non-negative , number non-negative , auto (1-4 values)

### Contain Intrinsic Size

contain-intrinsic-width: length non-negative , none , auto length non-negative
contain-intrinsic-height: length non-negative , none , auto length non-negative
contain-intrinsic-block-size: length non-negative , none , auto length non-negative
contain-intrinsic-inline-size: length non-negative , none , auto length non-negative

### Scroll

scroll-margin-top: length unrestricted
scroll-margin-right: length unrestricted
scroll-margin-bottom: length unrestricted
scroll-margin-left: length unrestricted
scroll-margin-block-start: length unrestricted
scroll-margin-block-end: length unrestricted
scroll-margin-inline-start: length unrestricted
scroll-margin-inline-end: length unrestricted

scroll-padding-top: length-percentage non-negative , auto
scroll-padding-right: length-percentage non-negative , auto
scroll-padding-bottom: length-percentage non-negative , auto
scroll-padding-left: length-percentage non-negative , auto
scroll-padding-block-start: length-percentage non-negative , auto
scroll-padding-block-end: length-percentage non-negative , auto
scroll-padding-inline-start: length-percentage non-negative , auto
scroll-padding-inline-end: length-percentage non-negative , auto

### Overflow

overflow-clip-margin: length non-negative , visual-box

### Animation & Transition Timing

animation-duration: time non-negative , auto

animation-delay: time unrestricted

animation-iteration-count: number non-negative , infinite

transition-duration: time non-negative

transition-delay: time unrestricted

### Transform (Property)

perspective: length positive , none
perspective: (value must be strictly > 0)

translate: length-percentage unrestricted , length unrestricted
translate: (x: length-percentage, y: length-percentage, z: length; all unrestricted)

scale: number unrestricted , percentage unrestricted

rotate: angle unrestricted

### Outline

outline-offset: length unrestricted

### Shape

shape-margin: length-percentage non-negative

### SVG Geometry

r: length-percentage non-negative
rx: length-percentage non-negative , auto
ry: length-percentage non-negative , auto

cx: length-percentage unrestricted
cy: length-percentage unrestricted
x: length-percentage unrestricted
y: length-percentage unrestricted

### SVG Stroke

stroke-width: line-width , number non-negative
stroke-width: (also accepts <length-percentage [0,∞]> and line-width keywords: hairline, thin, medium, thick)

stroke-miterlimit: number [1, ∞]
stroke-miterlimit: (must be ≥ 1; default is 4)

stroke-dasharray: length-percentage non-negative , number non-negative , none
stroke-dasharray: (comma/space separated list; all values must be non-negative)

stroke-dashoffset: length-percentage unrestricted

### Counters & Integers

counter-increment: custom-ident integer unrestricted
counter-reset: custom-ident integer unrestricted
counter-set: custom-ident integer unrestricted

orphans: integer positive
orphans: (must be ≥ 1)

widows: integer positive
widows: (must be ≥ 1)

### Zoom

zoom: number non-negative , percentage non-negative , normal

### Miscellaneous

initial-letter: number [1, ∞] , integer positive (optional sink)
initial-letter: (size must be ≥ 1; optional integer sink value must be ≥ 1)

line-clamp: integer positive , none
line-clamp: (must be ≥ 1)

hyphenate-limit-chars: integer positive (1-3 values) , auto
hyphenate-limit-chars: (each integer must be ≥ 1 when specified)

math-depth: integer unrestricted , auto-add , add(integer unrestricted)

image-resolution: resolution positive , from-image , snap
image-resolution: (resolution must be strictly > 0)

vertical-align: length-percentage unrestricted , baseline , sub , super , text-top , text-bottom , middle , top , bottom

offset-distance: length-percentage unrestricted

view-timeline-inset: length-percentage unrestricted , auto (1-2 values)

baseline-shift: length-percentage unrestricted , sub , super

box-flex: number unrestricted
box-flex-group: integer positive
box-ordinal-group: integer positive

interest-delay: time non-negative , auto

### Filter / Backdrop Filter (Property)

filter: filter-function-list , none , url
backdrop-filter: filter-function-list , none

(see Filter Functions section above for per-function constraints)
