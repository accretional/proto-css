package main

import (
	"regexp"
	"strings"

	"google.golang.org/protobuf/types/descriptorpb"
)

var (
	collapseWS = regexp.MustCompile(`\s+`)
	// These normalizations MUST mirror the codec's registered spacing policy
	// (service/service.go): "," ")" "]" hug their left, "(" "#" "[" hug their
	// right, and "/" keeps spaces on BOTH sides ("50% / 0.5").
	spaceBeforePunct = regexp.MustCompile(`\s+([,)\]])`)
	spaceAfterOpen   = regexp.MustCompile(`([(#\[])\s+`)
)

// Renderer walks the FileDescriptorProto message graph (proto reflection over
// the compiled grammar) and emits concrete CSS value strings for any message.
//
//   - keyword message (empty, recorded literal) -> the literal text
//   - alternation message (proto oneof)         -> union of each variant
//   - sequence message (ordered fields)         -> space-joined product
//   - open-ended leaf type (in reps)            -> representative samples
//
// Recursion is bounded by depth, a per-FQN visit cap (cycles), a per-result
// value cap, and a per-sequence product cap.
type Renderer struct {
	byFQN    map[string]*descriptorpb.DescriptorProto
	kw       map[string]string
	optional map[string]bool // "<msgFQN>/<fieldName>" -> field is EBNF-optional

	maxDepth   int
	maxVals    int
	maxProduct int

	cur    *prov // provenance of the in-progress Render()
	argIdx int   // position of the current leaf within a function/arg list (for value cycling)
}

// prov records how a property's value set was produced, so we can distinguish
// fully exhaustive grammar path-walking from assisted/bounded rendering.
type prov struct {
	usedRep  bool                // an open-ended leaf type was substituted from reps.go
	capped   bool                // a value/product cap truncated the enumeration
	depthCut bool                // the depth limit cut a path
	cycleCut bool                // a recursive rule was stopped to break a cycle
	uniform  bool                // a uniform <t>{1,n} shorthand was collapsed to 1-value form
	repeated bool                // a `{ }` zero-or-more list was omitted
	assists  map[string][]string // leaf type message name -> sample values used
}

func (p *prov) addAssist(name string, vals []string) {
	if p.assists == nil {
		p.assists = map[string][]string{}
	}
	if _, ok := p.assists[name]; !ok {
		p.assists[name] = vals
	}
}

func newRenderer(fdp *descriptorpb.FileDescriptorProto, kw map[string]string) *Renderer {
	r := &Renderer{
		byFQN:      map[string]*descriptorpb.DescriptorProto{},
		kw:         kw,
		optional:   globalOptional,
		maxDepth:   16,
		maxVals:    50, // show every finite value up to 50; truncate above
		maxProduct: 50,
	}
	for _, m := range fdp.GetMessageType() {
		r.index(m, ".css."+m.GetName())
	}
	return r
}

func (r *Renderer) index(m *descriptorpb.DescriptorProto, fqn string) {
	r.byFQN[fqn] = m
	for _, n := range m.GetNestedType() {
		r.index(n, fqn+"."+n.GetName())
	}
}

func simpleName(fqn string) string {
	if i := strings.LastIndex(fqn, "."); i >= 0 {
		return fqn[i+1:]
	}
	return fqn
}

// Render returns the distinct value strings for the message at fqn.
func (r *Renderer) Render(fqn string) []string {
	r.cur = &prov{}
	return dedupe(r.render(fqn, 0, map[string]int{}, false))
}

// RenderP renders and returns the provenance of how the values were produced.
func (r *Renderer) RenderP(fqn string) ([]string, prov) {
	vals := r.Render(fqn)
	return vals, *r.cur
}

// render walks the message at fqn. argPos is true when this node sits inside a
// function/sequence argument list: there, open-ended leaf types contribute a
// single canonical sample (their concrete value is arbitrary, so the full
// product of leaf samples would just be noise), while finite keyword sets still
// multiply out fully. At the top level / in alternations, leaves yield all their
// samples so e.g. `width: <length>` shows 24px, 48px, 8px.
func (r *Renderer) render(fqn string, depth int, seen map[string]int, argPos bool) []string {
	if depth > r.maxDepth {
		if r.cur != nil {
			r.cur.depthCut = true
		}
		return nil
	}
	name := simpleName(fqn)

	// 1. Open-ended leaf type -> representative samples.
	if v, ok := reps[name]; ok {
		if r.cur != nil {
			r.cur.usedRep = true
			r.cur.addAssist(name, v)
		}
		if argPos {
			// Inside a function / argument list every successive open-ended leaf
			// takes a DIFFERENT sample (position-cycled, deterministic) so the
			// channels/operands of one instance vary — rgb(50%, 80%, 30%) instead
			// of rgb(50%, 50%, 50%), calc(24px + 8px) instead of calc(1 + 1).
			s := v[r.argIdx%len(v)]
			r.argIdx++
			return []string{s}
		}
		return v
	}
	// 2. Keyword literal message.
	if lit, ok := r.kw[fqn]; ok {
		if lit == "" {
			return nil
		}
		return []string{lit}
	}
	m := r.byFQN[fqn]
	if m == nil {
		return nil // unresolved (e.g. .unicode.UTF8 ranges, reached only past reps)
	}
	if seen[fqn] >= 2 {
		if r.cur != nil {
			r.cur.cycleCut = true
		}
		return nil
	}
	seen[fqn]++
	defer func() { seen[fqn]-- }()

	if len(m.GetOneofDecl()) > 0 {
		fields := m.GetField()
		// A calc-value inside a math function (argPos) must stay dimensional:
		// emit only the leading dimensional alternative so calc() resolves to a
		// length — calc(24px), never the type-invalid calc(1)/calc(pi)/calc(NaN)
		// /calc(infinity) — and so the MathFunctionType branch is never taken,
		// which also prevents nested calc(calc(...)).
		if name == "CalcValueType" && argPos && len(fields) > 0 {
			return r.renderField(fields[0], depth, seen, argPos)
		}
		// Alternation: union of all variants, capped at maxVals*2. To stop one
		// exploding variant (e.g. linear()'s cartesian product) from filling the
		// cap before its siblings (cubic-bezier/ease/steps) are reached, cap each
		// variant's *own* contribution — but only loosely (maxVals), so a
		// legitimately large variant (e.g. the 147 named colors) keeps its values.
		var out []string
		for _, f := range fields {
			vs := r.renderField(f, depth, seen, argPos)
			if len(vs) > r.maxVals {
				vs = vs[:r.maxVals]
			}
			out = append(out, vs...)
			if len(out) >= r.maxVals*2 {
				if r.cur != nil {
					r.cur.capped = true
				}
				break
			}
		}
		return out
	}

	// Uniform shorthand sequence (e.g. margin / border-style / gap — every
	// position is the same type, written `<t>{1,4}`): show the single-value
	// form rather than the full n-tuple product.
	if uniform := uniformSeqType(m); uniform != "" {
		if r.cur != nil {
			r.cur.uniform = true
		}
		return r.render(uniform, depth+1, seen, argPos)
	}

	// Sequence. A *function* sequence (contains a "(" ) is rendered as one
	// canonical instance — e.g. rgb(1, 1, 1), not every channel permutation —
	// and its arguments collapse open-ended leaves to a single sample. A plain
	// sequence (shorthand, comma-list head, multi-keyword) is a full product and
	// propagates the parent argPos, so a top-level `<time>#` list head still
	// shows 0.3s / 1s / 200ms.
	fnSeq := r.isFunctionSeq(m)
	if fnSeq {
		// each function instance cycles its own leaves from position 0
		saved := r.argIdx
		r.argIdx = 0
		defer func() { r.argIdx = saved }()
	}
	childArg := argPos || fnSeq
	parts := [][]string{}
	for _, f := range m.GetField() {
		vals := r.renderField(f, depth, seen, childArg)
		if len(vals) == 0 {
			continue // skipped/repeated part contributes nothing
		}
		// An EBNF-optional field may be absent: append "" (ordered last so
		// all-present combinations still come first under the product cap).
		if r.optional[fqn+"/"+f.GetName()] && vals[len(vals)-1] != "" {
			vals = append(append([]string(nil), vals...), "")
		}
		parts = append(parts, vals)
	}
	if fnSeq || argPos {
		single := make([][]string, len(parts))
		for i, p := range parts {
			single[i] = p[:1]
		}
		return joinProduct(single, r.maxProduct)
	}
	out := joinProduct(parts, r.maxProduct)
	if r.cur != nil && productOverflows(parts, r.maxProduct) {
		r.cur.capped = true
	}
	return out
}

// isFunctionSeq reports whether a sequence message represents a function call,
// i.e. one of its fields is the "(" terminal (left_parenthesis_symbol).
func (r *Renderer) isFunctionSeq(m *descriptorpb.DescriptorProto) bool {
	for _, f := range m.GetField() {
		// "(" is now an inline string-literal terminal (recorded in kw), not a
		// named LeftParenthesisSymbol message. Detect either form so functions
		// still render as one canonical instance instead of exploding.
		if r.kw[f.GetTypeName()] == "(" || simpleName(f.GetTypeName()) == "LeftParenthesisSymbol" {
			return true
		}
	}
	return false
}

// productOverflows reports whether the cartesian product of parts would exceed
// the cap (i.e. joinProduct truncated it).
func productOverflows(parts [][]string, max int) bool {
	total := 1
	for _, p := range parts {
		if len(p) == 0 {
			continue
		}
		total *= len(p)
		if total > max {
			return true
		}
	}
	return false
}

func (r *Renderer) renderField(f *descriptorpb.FieldDescriptorProto, depth int, seen map[string]int, argPos bool) []string {
	if f.GetType() == descriptorpb.FieldDescriptorProto_TYPE_STRING {
		return nil // bare scalar text — no grammar-derived value
	}
	// Repeated fields encode EBNF `{ }` (zero-or-more). The zero case is
	// valid, so they are omittable; the mandatory head of a `+`/`#` list is a
	// separate singular field that is still rendered. Omitting avoids leading
	// separators (e.g. `cursor: ,, default`) and combinatorial blow-up.
	if f.GetLabel() == descriptorpb.FieldDescriptorProto_LABEL_REPEATED {
		if r.cur != nil {
			r.cur.repeated = true
		}
		return nil
	}
	target := f.GetTypeName()
	if target == "" {
		return nil
	}
	return r.render(target, depth+1, seen, argPos)
}

// uniformSeqType returns the shared field type name when a sequence message has
// 2+ fields that all reference the same message type (an `<t>{1,n}` shorthand);
// otherwise "". Repeated fields are ignored (they are omittable).
func uniformSeqType(m *descriptorpb.DescriptorProto) string {
	typ := ""
	n := 0
	for _, f := range m.GetField() {
		if f.GetLabel() == descriptorpb.FieldDescriptorProto_LABEL_REPEATED {
			continue
		}
		tn := f.GetTypeName()
		if tn == "" {
			return ""
		}
		if typ == "" {
			typ = tn
		} else if tn != typ {
			return ""
		}
		n++
	}
	if n >= 2 {
		return typ
	}
	return ""
}

// joinProduct builds the bounded cartesian product of parts, joining each tuple
// with a single space (punctuation parts attach without surrounding spaces).
func joinProduct(parts [][]string, max int) []string {
	if len(parts) == 0 {
		return nil
	}
	acc := []string{""}
	for _, opts := range parts {
		var next []string
		for _, a := range acc {
			for _, o := range opts {
				next = append(next, glue(a, o))
				if len(next) >= max {
					break
				}
			}
			if len(next) >= max {
				break
			}
		}
		acc = next
	}
	return acc
}

// glue concatenates two value fragments with CSS-appropriate spacing. The
// conventions MUST mirror the codec's registered NoSpaceBefore/NoSpaceAfter
// policy (service/service.go) — the codec is the renderer of record and every
// walked value must round-trip through it byte-exact: "," ")" "]" hug their
// left, "(" "[" hug their right, and "/" keeps spaces on both sides.
func glue(a, b string) string {
	if a == "" {
		return b
	}
	if b == "" {
		return a
	}
	if b == "," || b == ")" || b == "]" || b == "(" {
		return a + b
	}
	if strings.HasSuffix(a, "(") || strings.HasSuffix(a, "[") {
		return a + b
	}
	return a + " " + b
}

func dedupe(in []string) []string {
	seen := map[string]bool{}
	var out []string
	for _, s := range in {
		s = cleanValue(s)
		if s == "" || seen[s] {
			continue
		}
		seen[s] = true
		out = append(out, s)
	}
	return out
}

// cleanValue strips leading/trailing separators left by omitted optional parts
// (a leading "," or "/" is never valid CSS) and collapses internal whitespace.
func cleanValue(s string) string {
	s = strings.TrimSpace(s)
	s = strings.Trim(s, " ,/")
	s = collapseWS.ReplaceAllString(s, " ")
	s = spaceBeforePunct.ReplaceAllString(s, "$1") // "50% , 1" -> "50%, 1"
	s = spaceAfterOpen.ReplaceAllString(s, "$1")   // "element(# alpha)" -> "element(#alpha)"
	return strings.TrimSpace(s)
}
