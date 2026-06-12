package main

// Representative values substitute ONLY the atomic, open-ended leaf types of the
// CSS value grammar — the scalars and tokens that bottom out in infinite
// character ranges (digits, hex digits, string/ident characters) and so cannot
// be exhaustively enumerated. Every COMPOSITE above a leaf (colors, gradients,
// images, shapes, filter/easing/transform functions, calc(), position,
// length-percentage, ratio, var()/env()/anchor(), …) is walked structurally and
// bottoms out at these leaves. No shortcuts at any higher level.
//
// Keys are compiled proto message names (PascalCase of the grammar rule). The
// leaf token rule and its `*Type` wrapper collide on name (e.g. `length_type`
// and `LengthType` both → "LengthType"), so one key covers the leaf. Lead with
// the most visually distinct sample (never 0 first).
var reps = map[string][]string{
	// lengths — varied so cycled operands (calc, shadow, rect, channels) differ
	"LengthType":            {"24px", "48px", "8px", "16px", "64px"},
	"NonNegativeLengthType": {"24px", "48px", "8px", "16px", "64px"},
	"DimensionType":         {"24px", "2em", "48px", "0.5rem"},
	// percentages — a spread so cycled colour channels (rgb 50% 80% 30%) read
	"PercentageType":            {"50%", "80%", "30%", "65%", "15%", "100%"},
	"NonNegativePercentageType": {"50%", "80%", "30%", "65%", "15%", "100%"},
	// numbers / integers
	"NumberType":             {"1", "0.5", "2", "0.75", "0.25"},
	"NonNegativeNumberType":  {"1", "2", "0.5", "0.75", "0.25"},
	"IntegerType":            {"2", "1", "3", "5", "4"},
	"NegativeIntegerType":    {"-1", "-2", "-3"},
	"NonNegativeIntegerType": {"2", "1", "3", "5", "4"},
	"PositiveIntegerType":    {"2", "3", "1", "5", "4"},
	// angles — a hue spread so cycled hsl/conic hues read; all valid for rotate too
	"AngleType":           {"45deg", "135deg", "250deg", "320deg", "90deg"},
	// Range-constrained scalars the CFG cannot bound (see datatype.ebnf range note):
	// a dedicated rule + rep keeps every sample inside the documented range so Chrome
	// does not drop it. oblique angle ∈ [-90deg,90deg]; cubic-bezier control-point x
	// ∈ [0,1]; stroke-miterlimit ∈ [1,∞].
	"ObliqueAngleType":        {"14deg", "-14deg", "45deg", "-45deg", "90deg"},
	"CubicBezierProgressType": {"0.25", "0.5", "0.75", "0", "1"},
	"MiterlimitType":          {"4", "1", "10", "2", "1.5"},
	// initial-letter SIZE ∈ <number [1,∞]>; Chrome drops sizes < 1, so every rep ≥ 1.
	"InitialLetterSizeType": {"2", "1.5", "3", "1", "2.5"},
	// filter amounts: brightness(1)/contrast(1)/… are the IDENTITY (no visible change);
	// 0.4 darkens/desaturates/lowers and 1.8 brightens/over-saturates — every filter fn
	// reads as a real effect. 0.4 first so even opacity()/grayscale() (clamped at 1) show.
	"FilterAmountType": {"0.4", "1.8", "0.7", "2"},
	// transform scale factors: scale(1)=identity; 2 doubles, 0.5 halves — visible.
	"ScaleFactorType": {"2", "0.5", "1.6", "0.7"},
	// font-weight numbers: 1..5 all render ~thin; 100..900 span thin→black on a
	// variable face (the demo uses Roboto Flex, which carries the wght axis).
	"FontWeightNumberType": {"900", "100", "400", "700", "300"},
	// rotate's <number>{3} axis vector. Three identical adjacent <number> leaves
	// collapse to one repeated proto field (emitting a single number → the invalid
	// "1 45deg"), so the whole triple is supplied as one multi-token rep.
	"RotateAxisVectorType": {"1 1 1", "1 0 0", "0 1 0", "1 1 0"},
	// border-image / mask-border slice·width·outset are <num|len|%>{1,4} lists whose
	// identical leaves collapse to "1 1 1 X"; supply VARIED 1-4 value tuples so each
	// edge differs (top right bottom left), per the documented {1,4} shorthand order.
	"BorderImageSliceList":  {"30% 10% 20% 5%", "0.5 3 1 0.75", "33%", "2 4 6 8", "1 2 3"},
	"BorderImageWidthList":  {"4px 8px 2px 6px", "2 1 3 auto", "10px", "30% 10% 20% 5%", "1 4"},
	"BorderImageOutsetList": {"4px 8px 2px 6px", "1 2 3 0.5", "10px", "2 5", "0"},
	// border-radius corner tuples — varied per corner, incl. the elliptical "/" form.
	"BorderRadiusList": {"24px", "12px 36px 24px 8px", "40% 20%", "30px 10px 30px 10px / 10px 30px", "16px 8px 24px"},
	// font shorthand: a couple real sizes + one line-height so each subrule row stays
	// lean and the value cap isn't drowned by one alternative.
	"FontShortSizeType":       {"24px", "16px"},
	"FontShortLineHeightType": {"1.4"},
	// translate / scale: x[y[z]] tuples that collapse to "24px 24px 24px" / "2 2 2" — varied.
	"TranslateList": {"24px", "24px 12px", "40px 8px 16px", "10% 30%"},
	"ScaleList":     {"2", "2 0.5", "1.5 2 0.8", "150% 80%"},
	// box-shadow / text-shadow: identical offsets collapse to "24px 24px 24px" — supply
	// curated varied shadows (colour, inset, offsets, blur, spread) as one rep each.
	"SpreadShadowType": {"#c5483c 8px 8px 16px", "0 6px 18px 2px #2f5fd0", "inset 3px 3px 8px #c5483c", "8px 8px 0 #2f5fd0"},
	"ShadowType":       {"#c5483c 3px 3px 6px", "0 2px 8px #2f5fd0", "2px 2px 0 #c5483c"},
	// clip rect( top, right, bottom, left ): a single valid window (right>left,
	// bottom>top) so the clip is a real visible sub-rectangle, not an empty box.
	"ClipRectEdgesType": {"8px, 56px, 56px, 8px"},
	// quotes pairs: QuotesPropItem is <string> <string> (open + close). Two
	// identical adjacent <string> leaves collapse to one, so the whole pair is a
	// single multi-token rep — a real open/close quote pair per nesting level.
	"QuotesPropItem": {`"\201C" "\201D"`, `"\00AB" "\00BB"`, `"\2039" "\203A"`},
	"TimeType":            {"0.3s", "1s", "200ms"},
	"NonNegativeTimeType": {"0.3s", "1s"},
	"FrequencyType":       {"440Hz", "1kHz"},
	"ResolutionType":      {"96dpi", "2x", "300dpi"},
	"FlexType":            {"1fr", "2fr", "3fr"},
	"NonNegativeFlexType": {"1fr", "2fr"},
	// color token leaf (hex). Named colors, color functions, currentcolor,
	// system colors, color-mix(), light-dark() are all walked.
	"HexColorType": {"#c5483c", "#2f5fd0"},
	// OpenType tags are 4-char <string> leaves; supply real, context-valid tags
	// so font-feature-settings / font-variation-settings actually fire a feature
	// or drive a real variation axis (still replacing only the string literal).
	// Feature tags are all carried by the demo face (EB Garamond): small-caps,
	// swash, fractions, ligatures, old-style + tabular figures.
	"FeatureTagType": {`"smcp"`, `"swsh"`, `"frac"`, `"liga"`, `"onum"`, `"tnum"`},
	"AxisTagType":    {`"wght"`, `"wdth"`, `"opsz"`, `"slnt"`},
	// Variation-axis values: the generic <number> rep (1, 0.5, …) sits far below
	// every real axis range (wght 100–1000, wdth 25–151), so each card clamped to
	// the same weight. These span the axes so cards read black/thin/condensed/
	// expanded instead of identical. Cross-producted with each axis tag.
	"AxisValueType": {"900", "100", "650", "25"},
	// strings / idents
	"StringType":      {`"Specimen"`, `"Aa"`},
	"IdentType":       {"alpha", "beta"},
	"CustomIdentType": {"my-ident", "tag-a"},
	// transition-property / will-change name a real animatable property so the
	// transition is meaningful rather than 'my-ident' (which transitions nothing).
	"TransitionPropertyNameType": {"opacity", "transform", "background-color", "width", "color"},
	"DashedIdentType": {"--my-var"},
	// url() token — point at a real asset so image properties show a real image
	// (the "very last literal" of a url is its string; we supply a real one).
	"UrlType": {"url(assets/photo.jpg)"},
	// a mask source's url must carry alpha to reveal anything — point it at a
	// shape-on-transparent SVG so mask-image/mask cut a real silhouette.
	"MaskUrlType": {"url(assets/mask-shape.svg)"},
	// Gradients and basic shapes: their internal stop-list / parameter list is
	// not a meaningful enumeration — a single-stop walk renders a flat solid and
	// a tiny shape. Supply a canonical, visually meaningful instance per kind so
	// the gradient/shape actually reads (same spirit as supplying a real url).
	"LinearGradientFn":          {"linear-gradient(135deg, #c5483c, #e0a13c, #2f5fd0)"},
	"RepeatingLinearGradientFn": {"repeating-linear-gradient(45deg, #c5483c 0 12px, #2f5fd0 12px 24px)"},
	"RadialGradientFn":          {"radial-gradient(circle at 40% 40%, #e0a13c, #c5483c, #2f5fd0)"},
	"RepeatingRadialGradientFn": {"repeating-radial-gradient(circle, #c5483c 0 12px, #2f5fd0 12px 24px)"},
	"ConicGradientFn":           {"conic-gradient(from 20deg, #c5483c, #e0a13c, #2f8f6b, #2f5fd0, #c5483c)"},
	"RepeatingConicGradientFn":  {"repeating-conic-gradient(from 0deg, #c5483c 0 30deg, #2f5fd0 30deg 60deg)"},
	"BasicShapeType":            {"circle(44%)", "ellipse(48% 32%)", "inset(14% round 14px)", "polygon(50% 4%, 96% 96%, 4% 96%)"},
}

// leafDisplay maps a leaf rep message name to its CSS data-type spelling, for
// the per-property provenance banner (e.g. "LengthType" -> "<length>").
var leafDisplay = map[string]string{
	"LengthType":                "<length>",
	"NonNegativeLengthType":     "<length [0,∞]>",
	"DimensionType":             "<dimension>",
	"PercentageType":            "<percentage>",
	"NonNegativePercentageType": "<percentage [0,∞]>",
	"NumberType":                "<number>",
	"NonNegativeNumberType":     "<number [0,∞]>",
	"IntegerType":               "<integer>",
	"NegativeIntegerType":       "<integer [-∞,-1]>",
	"NonNegativeIntegerType":    "<integer [0,∞]>",
	"PositiveIntegerType":       "<integer [1,∞]>",
	"AngleType":                 "<angle>",
	"TimeType":                  "<time>",
	"NonNegativeTimeType":       "<time [0,∞]>",
	"FrequencyType":             "<frequency>",
	"ResolutionType":            "<resolution>",
	"FlexType":                  "<flex>",
	"NonNegativeFlexType":       "<flex [0,∞]>",
	"HexColorType":              "<hex-color>",
	"StringType":                "<string>",
	"IdentType":                 "<ident>",
	"CustomIdentType":           "<custom-ident>",
	"DashedIdentType":           "<dashed-ident>",
}

func leafName(msgName string) string {
	if d, ok := leafDisplay[msgName]; ok {
		return d
	}
	return msgName
}
