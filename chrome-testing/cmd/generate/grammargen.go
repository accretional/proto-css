package main

import (
	"math/rand"
	"sort"
	"strings"
	"unicode"

	pb "github.com/accretional/gluon/v2/pb"
)

// Grammar wraps a GrammarDescriptor and provides random CSS value generation
// by walking the EBNF rule tree.
type Grammar struct {
	rules map[string]*pb.RuleDescriptor
}

// NewGrammar indexes all rules by name for O(1) lookup.
func NewGrammar(gd *pb.GrammarDescriptor) *Grammar {
	m := make(map[string]*pb.RuleDescriptor, len(gd.GetRules()))
	for _, r := range gd.GetRules() {
		m[r.GetName()] = r
	}
	return &Grammar{rules: m}
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
