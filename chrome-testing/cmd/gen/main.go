// gen walks the CSS EBNF grammar — parsed by the gluon v2 metaparser into a
// proto FileDescriptorProto — and renders every CSS property/value pair via
// proto reflection over the compiled message graph. It emits the gallery data
// file (window.CODEX) consumed by chrome-testing/gallery.
//
// Pipeline:  EBNF files -> WrapString -> ParseEBNF -> GrammarToAST -> Compile
//
//	-> FileDescriptorProto -> (reflection) -> property/value pairs.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	"github.com/accretional/gluon/v2/compiler"
	metaparser "github.com/accretional/gluon/v2/metaparser"
	pb "github.com/accretional/gluon/v2/pb"
	"google.golang.org/protobuf/types/descriptorpb"
)

var ebnfFiles = []string{
	"css.ebnf", "symbol.ebnf", "primitive.ebnf", "keyword.ebnf",
	"combinator.ebnf", "datatype.ebnf", "functions.ebnf",
	"pseudo-class.ebnf", "pseudo-element.ebnf", "selector.ebnf",
	"property.ebnf", "atrule.ebnf",
}

// Property is one rendered CSS property and its value set.
type Property struct {
	Name   string   // kebab name, e.g. "flex-direction"
	Expr   string   // grammar Expr message, e.g. "FlexDirectionExpr"
	Prop   string   // grammar Prop message, e.g. "FlexDirectionProp"
	Values []string // rendered terminal values
	Syntax string   // raw EBNF RHS of the Prop rule (for the grammar drawer)

	// provenance
	Provenance string   // "pure" | "assisted" | "empty"
	Truncated  bool     // true grammar set exceeds what is shown
	TrueCount  int      // total distinct values the grammar yields (capped probe)
	Assists    []Assist // leaf types substituted (assisted only)

	Description string // MDN summary paragraph (inner HTML, links kept)
	// MDN status notecards
	Experimental bool
	Nonstandard  bool
	Deprecated   bool
	Warning      string // warning notecard inner HTML (links kept)
}

// mdnDoc mirrors cmd/mdndesc's per-property output.
type mdnDoc struct {
	Description  string `json:"description"`
	Experimental bool   `json:"experimental"`
	Nonstandard  bool   `json:"nonstandard"`
	Deprecated   bool   `json:"deprecated"`
	Warning      string `json:"warning"`
}

// descAlias maps legacy/aliased property names to the MDN page that describes
// them, for the few that MDN redirects.
var descAlias = map[string]string{
	"grid-gap":        "gap",
	"grid-column-gap": "column-gap",
	"grid-row-gap":    "row-gap",
	"word-wrap":       "overflow-wrap",
}

// attachDescriptions loads the MDN descriptions and attaches one to each
// property (falling back through aliases).
func attachDescriptions(props []Property, path string) {
	raw, err := os.ReadFile(path)
	if err != nil {
		fmt.Printf("note: %s missing — run cmd/mdndesc first; descriptions will be blank\n", path)
		return
	}
	descs := map[string]mdnDoc{}
	if err := json.Unmarshal(raw, &descs); err != nil {
		panic(err)
	}
	n := 0
	for i := range props {
		d, ok := descs[props[i].Name]
		if !ok || (d.Description == "" && !d.Experimental && !d.Nonstandard && !d.Deprecated && d.Warning == "") {
			if alias, has := descAlias[props[i].Name]; has {
				d = descs[alias]
			}
		}
		props[i].Description = d.Description
		props[i].Experimental = d.Experimental
		props[i].Nonstandard = d.Nonstandard
		props[i].Deprecated = d.Deprecated
		props[i].Warning = d.Warning
		if d.Description != "" {
			n++
		}
	}
	fmt.Printf("Attached %d/%d MDN descriptions\n", n, len(props))
}

// Assist names one open-ended leaf type that was sampled and the samples used.
type Assist struct {
	Type    string   // CSS spelling, e.g. "<length>"
	Samples []string // e.g. ["24px","48px","8px"]
}

func main() {
	langDir := flag.String("lang", "lang", "directory of EBNF files")
	out := flag.String("out", "chrome-testing/generated", "output directory")
	debug := flag.String("debug", "", "comma-separated property names to dump (no emit)")
	analyze := flag.Bool("analyze", false, "report how each property's values were produced (no emit)")
	flag.Parse()

	fdp, kw, src := compileGrammar(*langDir)
	ruleText := parseRuleTexts(src)
	r := newRenderer(fdp, kw)

	if *analyze {
		analyzeProvenance(fdp, r)
		return
	}

	props := enumerate(fdp, r, ruleText)
	fmt.Printf("Rendered %d properties\n", len(props))
	attachDescriptions(props, filepath.Join(*out, "descriptions.json"))

	if *debug != "" {
		want := map[string]bool{}
		for _, n := range strings.Split(*debug, ",") {
			want[strings.TrimSpace(n)] = true
		}
		for _, p := range props {
			if want[p.Name] || *debug == "all" {
				fmt.Printf("\n%s  (%s)\n", p.Name, p.Prop)
				for _, v := range p.Values {
					fmt.Printf("    %s\n", v)
				}
			}
		}
		return
	}

	emit(props, *out)
}

func compileGrammar(langDir string) (*descriptorpb.FileDescriptorProto, map[string]string, string) {
	var sb strings.Builder
	for _, name := range ebnfFiles {
		data, err := os.ReadFile(filepath.Join(langDir, name))
		if err != nil {
			panic(fmt.Sprintf("read %s: %v", name, err))
		}
		sb.Write(data)
		sb.WriteByte('\n')
	}
	src := sb.String()
	doc := metaparser.WrapString(sb.String())
	doc.Name = "css"
	gd, err := metaparser.ParseEBNF(doc)
	if err != nil {
		panic(fmt.Sprintf("ParseEBNF: %v", err))
	}
	ast, err := compiler.GrammarToAST(gd)
	if err != nil {
		panic(fmt.Sprintf("GrammarToAST: %v", err))
	}
	kw := map[string]string{}
	optional := map[string]bool{}
	opts := compiler.Options{
		Package: "css",
		OnMessage: func(fqn string, node *pb.ASTNode) {
			if node.GetKind() == compiler.KindTerminal {
				kw[fqn] = node.GetValue()
			}
		},
		OnField: func(parentFQN, fieldName string, node *pb.ASTNode) {
			// EBNF `[ x ]` optional groups arrive here unpeeled as KindOptional;
			// record them so the renderer can offer an "absent" variant.
			if node.GetKind() == compiler.KindOptional {
				optional[parentFQN+"/"+fieldName] = true
			}
		},
	}
	fdp, err := compiler.Compile(ast, opts)
	if err != nil {
		panic(fmt.Sprintf("Compile: %v", err))
	}
	globalOptional = optional
	return fdp, kw, src
}

// globalOptional records (parentFQN/fieldName) -> isOptional, captured during
// compile and consumed by the renderer.
var globalOptional map[string]bool

// parseRuleTexts extracts each EBNF rule's right-hand side text, keyed by rule
// name, for display in the gallery's grammar drawer. Line-based: a rule starts
// at `Name =` and runs to the line ending in `;`.
func parseRuleTexts(src string) map[string]string {
	out := map[string]string{}
	lines := strings.Split(src, "\n")
	reHead := regexp.MustCompile(`^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.*)$`)
	for i := 0; i < len(lines); i++ {
		line := lines[i]
		m := reHead.FindStringSubmatch(line)
		if m == nil {
			continue
		}
		name := m[1]
		body := m[2]
		for !strings.Contains(body, ";") && i+1 < len(lines) {
			i++
			body += "\n" + lines[i]
		}
		body = strings.TrimSpace(strings.TrimSuffix(strings.TrimSpace(body), ";"))
		if _, exists := out[name]; !exists {
			out[name] = body
		}
	}
	return out
}

// analyzeProvenance reports, per property, how its value set was produced. It
// renders each property twice — once with the production caps, once with
// effectively-unbounded caps (recursion still broken by the cycle guard) — so a
// genuine count difference means values were truncated, independent of the
// noisy internal cap flags.
func analyzeProvenance(fdp *descriptorpb.FileDescriptorProto, r *Renderer) {
	hi := newRenderer(fdp, r.kw)
	hi.maxVals, hi.maxProduct, hi.maxDepth = 160, 160, r.maxDepth

	byName := map[string]*descriptorpb.DescriptorProto{}
	for _, m := range fdp.GetMessageType() {
		byName[m.GetName()] = m
	}
	prop := byName["Property"]

	var empty, rep, truncated, complete, reduced []string
	var total int
	for _, f := range prop.GetField() {
		exprName := simpleName(f.GetTypeName())
		exprMsg := byName[exprName]
		if exprMsg == nil {
			continue
		}
		name := propertyKeyword(exprMsg, r)
		if name == "" {
			continue
		}
		propFQN := ".css." + strings.TrimSuffix(exprName, "Expr") + "Prop"
		if r.byFQN[propFQN] == nil {
			propFQN = findPropFQN(exprMsg)
			if propFQN == "" {
				continue
			}
		}
		total++
		vals, p := r.RenderP(propFQN)
		hiVals := hi.Render(propFQN)
		switch {
		case len(vals) == 0:
			empty = append(empty, name)
		case p.usedRep:
			rep = append(rep, name)
		case len(hiVals) > len(vals):
			truncated = append(truncated, name) // unbounded yields more -> genuinely cut
		case p.uniform || p.repeated:
			reduced = append(reduced, name) // all keyword choices shown; multiplicity/order variants collapsed
		default:
			complete = append(complete, name)
		}
	}
	sort.Strings(truncated)
	sort.Strings(reduced)

	pure := len(complete) + len(reduced) + len(truncated)
	pct := func(n int) string { return fmt.Sprintf("%3d (%4.1f%%)", n, 100*float64(n)/float64(total)) }
	fmt.Printf("Total properties: %d\n\n", total)
	fmt.Printf("PURE grammar path-walking — no representative samples:   %s\n", pct(pure))
	fmt.Printf("   ├─ complete: every grammar path/value enumerated:     %s\n", pct(len(complete)))
	fmt.Printf("   ├─ all keyword choices, multiplicity/order collapsed: %s\n", pct(len(reduced)))
	fmt.Printf("   └─ truncated: too many paths, bounded subset shown:   %s\n", pct(len(truncated)))
	fmt.Printf("REPRESENTATIVE-assisted — ≥1 open-ended leaf sampled:    %s\n", pct(len(rep)))
	fmt.Printf("   (length/color/number/time/image/function types)\n")
	fmt.Printf("EMPTY — no enumerable terminal values:                   %s\n", pct(len(empty)))

	show := func(label string, names []string) {
		fmt.Printf("\n%s (%d):\n  %s\n", label, len(names), strings.Join(names, ", "))
	}
	show("truncated (subset shown)", truncated)
	show("empty", empty)
}

// enumerate walks the Property rule's oneof, and for each XExpr resolves the
// kebab property name (the leading keyword) and renders its XProp value rule.
func enumerate(fdp *descriptorpb.FileDescriptorProto, r *Renderer, ruleText map[string]string) []Property {
	byName := map[string]*descriptorpb.DescriptorProto{}
	for _, m := range fdp.GetMessageType() {
		byName[m.GetName()] = m
	}
	prop := byName["Property"]
	if prop == nil {
		panic("no Property message in compiled grammar")
	}

	// A high-cap renderer probes the true size of each grammar value set so we
	// can report whether the shown set is complete or a truncated subset.
	hi := newRenderer(fdp, r.kw)
	hi.maxVals, hi.maxProduct, hi.maxDepth = 160, 160, r.maxDepth

	var out []Property
	for _, f := range prop.GetField() {
		exprName := simpleName(f.GetTypeName()) // e.g. "FlexDirectionExpr"
		exprMsg := byName[exprName]
		if exprMsg == nil {
			continue
		}
		name := propertyKeyword(exprMsg, r)
		if name == "" {
			continue
		}
		propMsg := strings.TrimSuffix(exprName, "Expr") + "Prop"
		propFQN := ".css." + propMsg
		if r.byFQN[propFQN] == nil {
			// fallback: locate a *Prop field inside the Expr (skip AllProp)
			propFQN = findPropFQN(exprMsg)
			if propFQN == "" {
				continue
			}
			propMsg = simpleName(propFQN)
		}
		vals, pr := r.RenderP(propFQN)
		trueCount := len(hi.Render(propFQN))
		out = append(out, Property{
			Name: name, Expr: exprName, Prop: propMsg, Values: vals, Syntax: ruleText[propMsg],
			Provenance: classifyProvenance(vals, pr),
			Truncated:  trueCount > len(vals),
			TrueCount:  trueCount,
			Assists:    assistsOf(pr),
		})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out
}

// classifyProvenance labels how a property's values were produced.
func classifyProvenance(vals []string, p prov) string {
	switch {
	case len(vals) == 0:
		return "empty"
	case p.usedRep:
		return "assisted"
	default:
		return "pure"
	}
}

// assistsOf turns the recorded leaf substitutions into display Assists, sorted.
func assistsOf(p prov) []Assist {
	if len(p.assists) == 0 {
		return nil
	}
	var as []Assist
	for name, samples := range p.assists {
		as = append(as, Assist{Type: leafName(name), Samples: samples})
	}
	sort.Slice(as, func(i, j int) bool { return as[i].Type < as[j].Type })
	return as
}

// propertyKeyword reads the leading keyword of an Expr sequence (the property
// name) and returns its literal, e.g. "flex-direction". The keyword is a
// nonterminal (e.g. `accent_color = "accent-color"`), so it is resolved through
// the renderer; the colon and other punctuation are skipped.
func propertyKeyword(expr *descriptorpb.DescriptorProto, r *Renderer) string {
	for _, f := range expr.GetField() {
		vals := r.Render(f.GetTypeName())
		if len(vals) == 0 {
			continue
		}
		v := vals[0]
		if v == ":" || v == ";" || v == "!" {
			continue
		}
		return v
	}
	return ""
}

// findPropFQN locates the property value rule reference inside an Expr message,
// preferring a field whose target message name ends in "Prop" but is not
// "AllProp". Handles the `( XProp | AllProp )` group as a nested alternation.
func findPropFQN(expr *descriptorpb.DescriptorProto) string {
	var scan func(m *descriptorpb.DescriptorProto, fqn string) string
	scan = func(m *descriptorpb.DescriptorProto, fqn string) string {
		for _, f := range m.GetField() {
			tn := f.GetTypeName()
			sn := simpleName(tn)
			if strings.HasSuffix(sn, "Prop") && sn != "AllProp" {
				return tn
			}
		}
		for _, n := range m.GetNestedType() {
			if got := scan(n, fqn+"."+n.GetName()); got != "" {
				return got
			}
		}
		return ""
	}
	return scan(expr, ".css."+expr.GetName())
}
