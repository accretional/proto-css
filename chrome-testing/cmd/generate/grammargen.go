package main

import (
	"fmt"
	"math/rand"
	"os"
	"sort"
	"strings"
	"unicode"

	pb "github.com/accretional/gluon/v2/pb"
	csspb "github.com/accretional/proto-css/chrome-testing/proto"
	"google.golang.org/protobuf/encoding/prototext"
)

// Grammar wraps a GrammarDescriptor and provides random CSS value generation
// by walking the EBNF rule tree.
type Grammar struct {
	rules map[string]*pb.RuleDescriptor

	// repValues maps grammar type names to representative sample values.
	// Loaded from representative_values.textproto.
	repValues map[string][]string

	// repPrimaryOf maps a CSS property name (kebab-case) to the set of type
	// names that consider it a "primary rule". When generating values for a
	// primary property, the representative values for those types are skipped
	// so the grammar is expanded fully.
	repPrimaryOf map[string]map[string]bool
}

// NewGrammar indexes all rules by name for O(1) lookup.
func NewGrammar(gd *pb.GrammarDescriptor) *Grammar {
	m := make(map[string]*pb.RuleDescriptor, len(gd.GetRules()))
	for _, r := range gd.GetRules() {
		m[r.GetName()] = r
	}
	return &Grammar{
		rules:        m,
		repValues:    make(map[string][]string),
		repPrimaryOf: make(map[string]map[string]bool),
	}
}

// LoadRepresentativeValues reads a RepresentativeTypes textproto file and
// populates repValues and repPrimaryOf.
func (g *Grammar) LoadRepresentativeValues(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("read representative values: %w", err)
	}
	var rt csspb.RepresentativeTypes
	if err := prototext.Unmarshal(data, &rt); err != nil {
		return fmt.Errorf("parse representative values: %w", err)
	}
	for _, t := range rt.GetTypes() {
		name := t.GetTypeName()
		g.repValues[name] = t.GetValues()
		for _, prop := range t.GetPrimaryRules() {
			if g.repPrimaryOf[prop] == nil {
				g.repPrimaryOf[prop] = make(map[string]bool)
			}
			g.repPrimaryOf[prop][name] = true
		}
	}
	fmt.Printf("Loaded %d representative types (%d with primary rules)\n",
		len(rt.GetTypes()), countWithPrimary(rt.GetTypes()))
	return nil
}

func countWithPrimary(types []*csspb.RepresentativeType) int {
	n := 0
	for _, t := range types {
		if len(t.GetPrimaryRules()) > 0 {
			n++
		}
	}
	return n
}

const maxDepth = 25

// GenN generates up to n distinct CSS values for the named rule.
func (g *Grammar) GenN(ruleName string, n int) []string {
	rule := g.rules[ruleName]
	if rule == nil {
		return nil
	}
	var results []string
	seen := map[string]bool{}
	for i := 0; len(results) < n && i < n*20; i++ {
		rng := rand.New(rand.NewSource(int64(i)))
		visited := map[string]bool{}
		s := g.generate(ruleName, rng, 0, visited)
		s = strings.TrimSpace(s)
		if s != "" && !seen[s] && !isDegenerate(s) {
			seen[s] = true
			results = append(results, s)
		}
	}
	return results
}

// isTokenRule returns true for snake_case rule names, which by convention
// define single CSS tokens (numbers, identifiers, colors, units) whose parts
// should be concatenated without spaces. PascalCase rules represent
// space-separated CSS value components.
func isTokenRule(name string) bool {
	if len(name) == 0 {
		return false
	}
	return name[0] >= 'a' && name[0] <= 'z'
}

// generate produces one CSS string by walking the rule's expression tree.
func (g *Grammar) generate(ruleName string, rng *rand.Rand, depth int, visited map[string]bool) string {
	if depth > maxDepth {
		return ""
	}
	if visited[ruleName] {
		return "" // cycle
	}
	rule := g.rules[ruleName]
	if rule == nil {
		return "" // unknown rule
	}
	visited[ruleName] = true
	defer delete(visited, ruleName)
	tight := isTokenRule(ruleName)
	return g.evalExprs(rule.GetExpressions(), rng, depth, visited, tight)
}

// evalExprs evaluates a flat Production list by splitting on alternation,
// picking one alternative, and evaluating each item in it.
// When tight is true (snake_case rule context), parts are concatenated
// without spaces to form a single CSS token. When false (PascalCase rule),
// parts are joined with CSS-aware spacing.
func (g *Grammar) evalExprs(exprs []*pb.Production, rng *rand.Rand, depth int, visited map[string]bool, tight bool) string {
	alts := splitByAlternation(exprs)
	if len(alts) == 0 {
		return ""
	}
	// Pick a random alternative.
	chosen := alts[rng.Intn(len(alts))]

	var parts []string
	for _, prod := range chosen {
		switch k := prod.GetKind().(type) {
		case *pb.Production_Delimiter:
			// Skip concatenation delimiters within the chosen alternative.
			if k.Delimiter == pb.Delimiter_CONCATENATION {
				continue
			}
		case *pb.Production_Terminal:
			parts = append(parts, k.Terminal)
		case *pb.Production_Nonterminal:
			s := g.generate(k.Nonterminal, rng, depth+1, visited)
			if s != "" {
				parts = append(parts, s)
			}
		case *pb.Production_Scoper:
			sp := k.Scoper
			if sp == nil {
				continue
			}
			switch sp.GetKind() {
			case pb.Scoper_GROUP:
				s := g.evalExprs(sp.GetBody(), rng, depth, visited, tight)
				if s != "" {
					parts = append(parts, s)
				}
			case pb.Scoper_OPTIONAL:
				// 50% chance to include optional content.
				if rng.Intn(2) == 0 {
					s := g.evalExprs(sp.GetBody(), rng, depth, visited, tight)
					if s != "" {
						parts = append(parts, s)
					}
				}
			case pb.Scoper_REPETITION:
				// 0 or 1 times.
				if rng.Intn(2) == 0 {
					s := g.evalExprs(sp.GetBody(), rng, depth, visited, tight)
					if s != "" {
						parts = append(parts, s)
					}
				}
			case pb.Scoper_TERMINAL:
				// Wraps literal text; concatenate all terminal strings in the body.
				var buf strings.Builder
				for _, bp := range sp.GetBody() {
					if t, ok := bp.GetKind().(*pb.Production_Terminal); ok {
						buf.WriteString(t.Terminal)
					}
				}
				if buf.Len() > 0 {
					parts = append(parts, buf.String())
				}
			case pb.Scoper_COMMENT:
				// Skip comments entirely.
			}
		case *pb.Production_Range:
			r := k.Range
			if r != nil && len(r.GetLower()) > 0 && len(r.GetUpper()) > 0 {
				lo := []rune(r.GetLower())[0]
				hi := []rune(r.GetUpper())[0]
				if hi >= lo {
					ch := lo + rune(rng.Intn(int(hi-lo+1)))
					parts = append(parts, string(ch))
				}
			}
		}
	}
	if tight {
		return strings.Join(parts, "")
	}
	return cssJoin(parts)
}

// splitByAlternation splits a flat production list into groups separated by
// ALTERNATION delimiters.
func splitByAlternation(exprs []*pb.Production) [][]*pb.Production {
	var groups [][]*pb.Production
	var current []*pb.Production
	for _, p := range exprs {
		if d, ok := p.GetKind().(*pb.Production_Delimiter); ok && d.Delimiter == pb.Delimiter_ALTERNATION {
			groups = append(groups, current)
			current = nil
			continue
		}
		current = append(current, p)
	}
	if len(current) > 0 || len(groups) > 0 {
		groups = append(groups, current)
	}
	return groups
}

// ---------------------------------------------------------------------------
// CSS-aware spacing (ported from proto-css render.go)
// ---------------------------------------------------------------------------

// cssJoin concatenates parts with CSS-aware spacing: certain punctuation
// tokens suppress the space before or after them.
func cssJoin(parts []string) string {
	if len(parts) == 0 {
		return ""
	}
	var b strings.Builder
	b.WriteString(parts[0])
	for i := 1; i < len(parts); i++ {
		if !cssSuppressSpace(parts[i-1], parts[i]) {
			b.WriteByte(' ')
		}
		b.WriteString(parts[i])
	}
	return b.String()
}

// cssSuppressSpace returns true when no space should appear between prev and
// curr tokens.
func cssSuppressSpace(prev, curr string) bool {
	if curr == "" || prev == "" {
		return true
	}
	// No space before these characters.
	switch curr[0] {
	case '(', ')', ',', ';', ':', '|':
		return true
	}
	// No space after these.
	if len(prev) > 0 {
		switch prev[len(prev)-1] {
		case '(', '#', ':', '|':
			return true
		}
	}
	if prev == "::" || prev == "@" {
		return true
	}
	return false
}

// ---------------------------------------------------------------------------
// Degenerate value filter (ported from proto-css valuegen.go)
// ---------------------------------------------------------------------------

// isDegenerate returns true for CSS values that are empty function calls or
// CSS-wide keywords that are uninteresting for visual testing.
func isDegenerate(s string) bool {
	// Empty function calls like "rgb()" or "calc()".
	if strings.Contains(s, "()") {
		return true
	}
	// Extract the value part after "property:" to check for CSS-wide keywords.
	val := s
	if idx := strings.Index(s, ":"); idx >= 0 {
		val = s[idx+1:]
	}
	// Strip optional "! important" and trailing semicolon.
	if i := strings.Index(val, "!"); i >= 0 {
		val = val[:i]
	}
	val = strings.TrimSuffix(strings.TrimSpace(val), ";")
	val = strings.TrimSpace(val)
	switch strings.ToLower(val) {
	case "revert", "inherit", "initial", "unset", "revert-layer":
		return true
	}
	return false
}

// ---------------------------------------------------------------------------
// Exhaustive value generation (GenAll)
// ---------------------------------------------------------------------------

// GenAll generates an exhaustive list of CSS values for the named rule,
// up to maxResults. forProperty is the CSS property name (kebab-case) being
// generated — types that list it as a primary rule will be expanded fully
// instead of short-circuited with representative values.
func (g *Grammar) GenAll(ruleName string, maxResults int, forProperty string) []string {
	rule := g.rules[ruleName]
	if rule == nil {
		return nil
	}

	// Build the set of types to skip short-circuiting for this property.
	skipTypes := g.repPrimaryOf[forProperty]

	visited := map[string]bool{}
	all := g.enumerate(ruleName, maxResults, 0, visited, skipTypes)

	// Deduplicate and filter.
	seen := map[string]bool{}
	var results []string
	for _, s := range all {
		s = strings.TrimSpace(s)
		if s == "" || seen[s] || isDegenerate(s) {
			continue
		}
		seen[s] = true
		results = append(results, s)
		if len(results) >= maxResults {
			break
		}
	}
	return results
}

const maxEnumDepth = 15

// enumerate returns all possible values for a rule, up to limit.
// skipTypes contains type names that should NOT be short-circuited (because
// the current property is a primary rule for those types).
func (g *Grammar) enumerate(ruleName string, limit int, depth int, visited map[string]bool, skipTypes map[string]bool) []string {
	if depth > maxEnumDepth {
		return nil
	}

	// Check representative values (short-circuit for open-ended types),
	// unless this type is skipped for the current property.
	if !skipTypes[ruleName] {
		if vals, ok := g.repValues[ruleName]; ok {
			return vals
		}
	}

	if visited[ruleName] {
		return nil // cycle
	}
	rule := g.rules[ruleName]
	if rule == nil {
		return nil
	}

	visited[ruleName] = true
	defer delete(visited, ruleName)

	tight := isTokenRule(ruleName)
	return g.enumerateExprs(rule.GetExpressions(), limit, depth, visited, tight, skipTypes)
}

// enumerateExprs expands all alternatives in a production list exhaustively.
// It allocates budget fairly across branches so later alternatives are not
// starved by early cartesian-product-heavy branches.
func (g *Grammar) enumerateExprs(exprs []*pb.Production, limit int, depth int, visited map[string]bool, tight bool, skipTypes map[string]bool) []string {
	alts := splitByAlternation(exprs)
	if len(alts) == 0 {
		return nil
	}

	// Two-pass approach: first collect all branches with their budget,
	// then redistribute unused budget.
	perBranch := limit / len(alts)
	if perBranch < 2 {
		perBranch = 2
	}

	// First pass: expand each branch with its fair share.
	branchResults := make([][]string, len(alts))
	totalUsed := 0
	for i, branch := range alts {
		bl := perBranch
		if bl+totalUsed > limit {
			bl = limit - totalUsed
		}
		if bl <= 0 {
			break
		}
		branchResults[i] = g.enumerateBranch(branch, bl, depth, visited, tight, skipTypes)
		totalUsed += len(branchResults[i])
	}

	// Second pass: if we have leftover budget, give it to branches that
	// could produce more (those that maxed out their allocation).
	leftover := limit - totalUsed
	if leftover > 0 {
		for i, branch := range alts {
			if len(branchResults[i]) >= perBranch && leftover > 0 {
				extra := g.enumerateBranch(branch, perBranch+leftover, depth, visited, tight, skipTypes)
				// Only keep genuinely new results.
				seen := map[string]bool{}
				for _, v := range branchResults[i] {
					seen[v] = true
				}
				for _, v := range extra {
					if !seen[v] && leftover > 0 {
						branchResults[i] = append(branchResults[i], v)
						leftover--
					}
				}
			}
		}
	}

	var all []string
	for _, br := range branchResults {
		all = append(all, br...)
	}
	return all
}

// enumerateBranch expands a single concatenation branch, producing the cartesian
// product of all parts.
func (g *Grammar) enumerateBranch(prods []*pb.Production, limit int, depth int, visited map[string]bool, tight bool, skipTypes map[string]bool) []string {
	if limit <= 0 {
		return nil
	}

	// Collect the set of possible values for each position in the concatenation.
	var parts [][]string
	for _, prod := range prods {
		var vals []string
		switch k := prod.GetKind().(type) {
		case *pb.Production_Delimiter:
			if k.Delimiter == pb.Delimiter_CONCATENATION {
				continue
			}
		case *pb.Production_Terminal:
			vals = []string{k.Terminal}
		case *pb.Production_Nonterminal:
			vals = g.enumerate(k.Nonterminal, limit, depth+1, visited, skipTypes)
			if len(vals) == 0 {
				// Non-terminal produced nothing — skip this part.
				continue
			}
		case *pb.Production_Scoper:
			sp := k.Scoper
			if sp == nil {
				continue
			}
			switch sp.GetKind() {
			case pb.Scoper_GROUP:
				vals = g.enumerateExprs(sp.GetBody(), limit, depth, visited, tight, skipTypes)
			case pb.Scoper_OPTIONAL:
				// Generate both with and without.
				inner := g.enumerateExprs(sp.GetBody(), limit, depth, visited, tight, skipTypes)
				vals = append([]string{""}, inner...) // "" = omitted
			case pb.Scoper_REPETITION:
				// 0 or 1 times.
				inner := g.enumerateExprs(sp.GetBody(), limit, depth, visited, tight, skipTypes)
				vals = append([]string{""}, inner...)
			case pb.Scoper_TERMINAL:
				var buf strings.Builder
				for _, bp := range sp.GetBody() {
					if t, ok := bp.GetKind().(*pb.Production_Terminal); ok {
						buf.WriteString(t.Terminal)
					}
				}
				if buf.Len() > 0 {
					vals = []string{buf.String()}
				}
			case pb.Scoper_COMMENT:
				continue
			}
		case *pb.Production_Range:
			r := k.Range
			if r != nil && len(r.GetLower()) > 0 && len(r.GetUpper()) > 0 {
				lo := []rune(r.GetLower())[0]
				hi := []rune(r.GetUpper())[0]
				for ch := lo; ch <= hi && len(vals) < limit; ch++ {
					vals = append(vals, string(ch))
				}
			}
		}

		if len(vals) > 0 {
			parts = append(parts, vals)
		}
	}

	if len(parts) == 0 {
		return nil
	}

	// Cartesian product of all parts, with limit cap.
	return cartesianProduct(parts, limit, tight)
}

// cartesianProduct computes the cartesian product of part sets, joining with
// CSS-aware spacing. Caps intermediate growth at limit but always processes
// all parts so trailing tokens (like closing parens) are never dropped.
func cartesianProduct(parts [][]string, limit int, tight bool) []string {
	result := []string{""}
	for _, vals := range parts {
		var next []string
	expand:
		for _, prefix := range result {
			for _, v := range vals {
				if v == "" {
					next = append(next, prefix)
				} else if prefix == "" {
					next = append(next, v)
				} else if tight {
					next = append(next, prefix+v)
				} else {
					// CSS-aware join for the last two tokens.
					if cssSuppressSpace(prefix, v) {
						next = append(next, prefix+v)
					} else {
						next = append(next, prefix+" "+v)
					}
				}
				if len(next) >= limit {
					break expand
				}
			}
		}
		result = next
	}
	return result
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// exprToKebab converts a PascalCase expression name like "BackgroundColorExpr"
// to the corresponding CSS property name "background-color".
func exprToKebab(typeName string) string {
	s := strings.TrimSuffix(typeName, "Expr")
	var b strings.Builder
	for i, r := range s {
		if unicode.IsUpper(r) && i > 0 {
			b.WriteByte('-')
		}
		b.WriteRune(unicode.ToLower(r))
	}
	return b.String()
}

// PropertyExprs returns the sorted list of all rule names that end with "Expr",
// which by convention correspond to CSS property value expressions.
func (g *Grammar) PropertyExprs() []string {
	var names []string
	for name := range g.rules {
		if strings.HasSuffix(name, "Expr") {
			names = append(names, name)
		}
	}
	sort.Strings(names)
	return names
}
