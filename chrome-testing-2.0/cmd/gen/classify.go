package main

import (
	"regexp"
	"strings"
)

// Family is presentation metadata for a group of properties in the gallery.
// (Grouping/labels only — every value shown comes from the grammar.)
type Family struct {
	ID, Sigil, Title, Blurb string
	Demo, SampleKind, Group string
	Focus                   bool
}

// families mirror the gallery's taxonomy. The three focus families carry the
// hand-built live demonstrators (flex / transform3d / color); the rest use the
// generic glass. Order is by sigil.
var families = []Family{
	{"box-display", "01", "Box Model & Display", "How a box is generated and what formatting context it makes.", "generic", "box", "families", false},
	{"positioning", "02", "Positioning & Inset", "Offsets that place a positioned box relative to its containing block.", "generic", "box", "families", false},
	{"flexbox", "03", "Flexbox", "One-dimensional layout: where the slack goes along main and cross axes.", "flex", "flex", "families", true},
	{"grid", "04", "Grid", "Two-dimensional layout: tracks, areas and line-based placement.", "generic", "box", "families", false},
	{"margin", "05", "Spacing — Margin", "Outer space that pushes neighbours away — physical and logical.", "generic", "box", "families", false},
	{"padding", "06", "Spacing — Padding", "Inner space between the content box and the border.", "generic", "box", "families", false},
	{"sizing", "07", "Sizing", "Width, height and their min/max bounds, plus aspect-ratio.", "generic", "box", "families", false},
	{"typography", "08", "Typography & Font", "Choosing and tuning the typeface — family, size, weight, features.", "type", "text", "families", false},
	{"text-styling", "09", "Text Styling & Decoration", "Alignment, transformation, decoration and emphasis of text.", "type", "text", "families", false},
	{"line-spacing", "10", "Line & Inline Spacing", "Leading, spacing, wrapping, breaking and hyphenation.", "type", "text", "families", false},
	{"writing-mode", "11", "Writing Mode & Direction", "Block direction, inline direction and character orientation.", "type", "text", "families", false},
	{"color", "12", "Color & Opacity", "How pigment is chosen, mixed and made translucent.", "color", "swatch", "families", true},
	{"backgrounds", "13", "Backgrounds", "Layered fills behind content — colours, images, gradients.", "generic", "box", "families", false},
	{"borders", "14", "Borders, Outlines & Radius", "Edges of the box — style, width, colour, rounded corners.", "generic", "box", "families", false},
	{"effects", "15", "Effects & Filters", "Shadows, filters, backdrop filters and blend modes.", "generic", "box", "families", false},
	{"clip-mask", "16", "Clipping & Masking", "Constrain what is painted — clip paths, masks and geometry.", "generic", "box", "families", false},
	{"transforms", "17", "Transforms", "Re-map an element's coordinate space in 2D and 3D.", "transform3d", "box3d", "families", true},
	{"transitions", "18", "Transitions", "Interpolate property changes over time with easing.", "generic", "box", "families", false},
	{"animations", "19", "Animations & Timelines", "Keyframe animations and scroll/view timelines.", "generic", "box", "families", false},
	{"scroll", "20", "Scroll Behavior & Snap", "Smooth scrolling, snap points, margins and scrollbars.", "generic", "box", "families", false},
	{"object-image", "21", "Object & Image", "How replaced elements fit and render in their box.", "generic", "box", "families", false},
	{"columns", "22", "Columns (Multicol)", "Flow text into multiple newspaper-style columns.", "type", "text", "families", false},
	{"tables", "23", "Tables", "Table-specific layout: fixed layout, collapse, captions.", "generic", "box", "families", false},
	{"lists", "24", "Lists & Counters", "Markers, generated content and counters.", "type", "text", "families", false},
	{"interactivity", "25", "Interactivity & Cursor", "Pointer behaviour, selection, resizing and the cursor.", "generic", "box", "families", false},
	{"containment", "26", "Containment & Performance", "Hints that isolate subtrees so the engine can skip work.", "generic", "box", "families", false},
	{"container-queries", "27", "Container Queries", "Turn an element into a query container for its descendants.", "generic", "box", "families", false},
	{"anchor", "28", "Anchor Positioning", "Tether a positioned element to one or more anchors.", "generic", "box", "families", false},
	{"offset", "29", "Offset / Motion Path", "Move an element along an arbitrary path.", "generic", "box", "families", false},
	{"shapes", "30", "Shapes (Float Shaping)", "Shape the area that inline content wraps around a float.", "generic", "box", "families", false},
	{"view-transitions", "31", "View Transitions", "Name elements so the engine can animate between states.", "generic", "box", "families", false},
	{"svg", "32", "SVG Paint & Geometry", "Paint and geometry properties that apply to SVG figures.", "generic", "box", "families", false},
	{"breaks", "33", "Breaks & Pagination", "Where content may break across pages and columns.", "generic", "box", "families", false},
	{"misc", "34", "Misc / Global", "Cross-cutting and global keywords that resist classification.", "generic", "box", "families", false},
}

// classifyRule maps a property name to a family id; first match wins.
type classifyRule struct {
	famID string
	test  func(string) bool
}

func has(subs ...string) func(string) bool {
	return func(n string) bool {
		for _, s := range subs {
			if strings.Contains(n, s) {
				return true
			}
		}
		return false
	}
}
func pre(prefixes ...string) func(string) bool {
	return func(n string) bool {
		for _, p := range prefixes {
			if strings.HasPrefix(n, p) {
				return true
			}
		}
		return false
	}
}
func exact(names ...string) func(string) bool {
	set := map[string]bool{}
	for _, n := range names {
		set[n] = true
	}
	return func(n string) bool { return set[n] }
}

// Ordered: specific rules before broad ones.
var classifyRules = []classifyRule{
	{"flexbox", exact("flex", "flex-grow", "flex-shrink", "flex-basis", "flex-direction", "flex-wrap", "flex-flow", "order", "justify-content", "align-items", "align-self", "align-content", "place-content", "place-items", "place-self", "justify-items", "justify-self", "gap", "row-gap", "column-gap")},
	{"transforms", exact("transform", "transform-origin", "transform-style", "transform-box", "rotate", "scale", "translate", "perspective", "perspective-origin", "backface-visibility")},
	{"color", exact("color", "opacity", "accent-color", "color-scheme", "forced-color-adjust", "print-color-adjust", "color-adjust")},
	{"grid", has("grid")},
	{"padding", pre("padding")},
	{"margin", pre("margin")},
	{"positioning", exact("position", "top", "right", "bottom", "left", "inset", "inset-block", "inset-inline", "inset-block-start", "inset-block-end", "inset-inline-start", "inset-inline-end", "z-index")},
	{"sizing", exact("width", "height", "min-width", "min-height", "max-width", "max-height", "block-size", "inline-size", "min-block-size", "max-block-size", "min-inline-size", "max-inline-size", "aspect-ratio", "box-sizing", "contain-intrinsic-size", "contain-intrinsic-width", "contain-intrinsic-height", "contain-intrinsic-block-size", "contain-intrinsic-inline-size")},
	{"backgrounds", pre("background")},
	{"borders", pre("border", "outline", "corner")},
	{"effects", exact("box-shadow", "filter", "backdrop-filter", "mix-blend-mode", "isolation")},
	{"clip-mask", pre("clip", "mask")},
	{"scroll", pre("scroll", "overscroll", "scrollbar")},
	{"transitions", pre("transition")},
	{"animations", pre("animation", "view-timeline", "scroll-timeline", "timeline")},
	{"object-image", pre("object", "image")},
	{"columns", pre("column", "columns")},
	{"writing-mode", exact("writing-mode", "direction", "text-orientation", "unicode-bidi", "text-combine-upright")},
	{"line-spacing", exact("line-height", "line-break", "white-space", "white-space-collapse", "word-break", "word-spacing", "word-wrap", "overflow-wrap", "hyphens", "hyphenate-character", "hyphenate-limit-chars", "tab-size", "text-wrap", "text-wrap-mode", "text-wrap-style")},
	{"typography", pre("font")},
	{"text-styling", pre("text")},
	{"lists", pre("list", "counter")},
	{"tables", exact("table-layout", "border-collapse", "border-spacing", "caption-side", "empty-cells")},
	{"interactivity", exact("cursor", "pointer-events", "user-select", "resize", "caret-color", "caret", "caret-shape", "caret-animation", "touch-action", "appearance", "field-sizing", "accent-color")},
	{"containment", exact("contain", "content-visibility", "will-change", "container", "container-type", "container-name")},
	{"anchor", pre("anchor", "position-")},
	{"offset", pre("offset", "motion")},
	{"shapes", pre("shape")},
	{"view-transitions", pre("view-transition")},
	{"svg", exact("fill", "fill-rule", "fill-opacity", "stroke", "stroke-width", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "paint-order", "marker", "marker-start", "marker-mid", "marker-end", "stop-color", "stop-opacity", "flood-color", "flood-opacity", "lighting-color", "color-interpolation", "color-interpolation-filters", "shape-rendering", "text-anchor", "dominant-baseline", "alignment-baseline", "baseline-shift", "vector-effect", "d", "cx", "cy", "r", "rx", "ry", "x", "y")},
	{"breaks", pre("break", "page", "orphans", "widows")},
	{"typography", pre("font", "tab")},
	{"text-styling", has("text", "letter-spacing", "writing")},
	{"writing-mode", has("writing", "direction")},
}

func classify(name string) string {
	for _, r := range classifyRules {
		if r.test(name) {
			return r.famID
		}
	}
	// prefix fallbacks for whole logical groups
	switch {
	case strings.HasPrefix(name, "overflow"):
		return "box-display"
	case strings.HasPrefix(name, "display") || strings.HasPrefix(name, "visibility") || strings.HasPrefix(name, "float") || strings.HasPrefix(name, "clear"):
		return "box-display"
	}
	return "misc"
}

var (
	reNumber = regexp.MustCompile(`^-?\d+(\.\d+)?$`)
	reLength = regexp.MustCompile(`(\d)(px|em|rem|ex|ch|vw|vh|vmin|vmax|cm|mm|in|pt|pc|q|fr|%|cap|ic|lh|rlh|vi|vb|cqw|cqh|cqi|cqb|cqmin|cqmax)\b`)
	reAngle  = regexp.MustCompile(`(\d)(deg|grad|rad|turn)\b`)
	reColor  = regexp.MustCompile(`^(#|rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color\(|color-mix|rebeccapurple|currentcolor|transparent)`)
)

// inferValueType picks a control hint from the rendered values.
func inferValueType(values []string) string {
	if len(values) == 0 {
		return "none"
	}
	num, length, angle, color, fn := 0, 0, 0, 0, 0
	for _, v := range values {
		lv := strings.ToLower(v)
		switch {
		case reNumber.MatchString(v):
			num++
		case reAngle.MatchString(lv):
			angle++
		case reLength.MatchString(lv):
			length++
		case reColor.MatchString(lv):
			color++
		case strings.Contains(v, "("):
			fn++
		}
	}
	n := len(values)
	switch {
	case angle*2 >= n:
		return "angle"
	case color*2 >= n:
		return "color"
	case length*2 >= n:
		return "length"
	case num*2 >= n:
		return "number"
	case fn*2 >= n:
		return "function"
	default:
		return "keyword"
	}
}
