// Scalar stop-chars: the lexical boundary scalarization erases, recovered.
//
// scalarizeLeaves collapses a leaf rule's range/terminal structure into a bare
// `string value = 1`, so the parser loses what characters the token may
// contain — an ident happily swallows ":;{}" and a custom element name
// swallows quotes and spaces. leafStopChars re-derives, per leaf rule, the
// printable ASCII characters the rule can NEVER match (the complement of the
// union of its ranges and terminal characters, nonterminals resolved). The
// codec cuts a scalar capture before the first such character, restoring the
// token boundary without needing a real lexer.
//
// Conservative by construction: any unresolvable or already-scalarized part
// of a rule makes its character set unbounded and the rule emits no stops
// (old swallow-to-stop-token behavior). Control characters are never emitted
// as stops so multi-line text keeps working.
package main

import (
	"sort"
	"strconv"
	"strings"

	"github.com/accretional/gluon/v2/compiler"
	pb "github.com/accretional/gluon/v2/pb"
)

// leafStopChars returns, for every rule that scalarizeLeaves will collapse,
// the set of printable ASCII characters the rule's grammar can never contain,
// keyed by rule name (mapped to message FQNs via the compile OnMessage hook).
// Rules whose character set is unbounded are omitted.
func leafStopChars(root *pb.ASTNode) map[string]string {
	rules := map[string]*pb.ASTNode{}
	for _, r := range root.GetChildren() {
		if r.GetKind() == compiler.KindRule {
			if _, ok := rules[r.GetValue()]; !ok {
				rules[r.GetValue()] = r
			}
		}
	}
	out := map[string]string{}
	for name, r := range rules {
		if !(leafTypes[norm(name)] || hasRange(r)) {
			continue
		}
		set := make([]bool, 128)
		if !charUnion(r, rules, map[string]bool{name: true}, set) {
			continue // unbounded — no lexical boundary derivable
		}
		var excluded []byte
		for c := byte(0x20); c < 0x7f; c++ {
			if !set[c] {
				excluded = append(excluded, c)
			}
		}
		if len(excluded) > 0 {
			out[name] = string(excluded)
		}
	}
	return out
}

// charUnion accumulates into set every printable ASCII character node can
// match, resolving nonterminals through rules (cycles contribute nothing new).
// Returns false when the set is unbounded: an unknown rule reference or an
// already-scalarized part means anything could appear.
func charUnion(node *pb.ASTNode, rules map[string]*pb.ASTNode, seen map[string]bool, set []bool) bool {
	if node == nil {
		return true
	}
	switch node.GetKind() {
	case compiler.KindScalar:
		return false
	case compiler.KindTerminal:
		for _, b := range []byte(node.GetValue()) {
			if b >= 0x20 && b < 0x7f {
				set[b] = true
			}
		}
		return true
	case compiler.KindRange:
		kids := node.GetChildren()
		if len(kids) != 2 {
			return false
		}
		lo, hi := firstRune(kids[0].GetValue()), firstRune(kids[1].GetValue())
		if lo < 0 || hi < 0 {
			return false
		}
		for c := max(lo, 0x20); c <= min(hi, 0x7e); c++ {
			set[c] = true
		}
		return true
	case compiler.KindNonterminal:
		name := node.GetValue()
		if seen[name] {
			return true // cycle: no new characters on revisit
		}
		r, ok := rules[name]
		if !ok {
			return false // dangling reference — unbounded
		}
		seen[name] = true
		return charUnion(r, rules, seen, set)
	case compiler.KindAlternation:
		// Function-shaped arms (anything whose content contains "(") are
		// STRUCTURE folded into the leaf for construction convenience — a
		// var()/calc() alternative — not token content the scalar captures.
		// Merging their charset would launder "," and parens into the token
		// and let an angle capture "45deg," whole. Skip them.
		for _, c := range node.GetChildren() {
			tmp := make([]bool, 128)
			if !charUnion(c, rules, seen, tmp) {
				return false
			}
			if tmp['('] {
				continue
			}
			for i, v := range tmp {
				if v {
					set[i] = true
				}
			}
		}
		return true
	default:
		for _, c := range node.GetChildren() {
			if !charUnion(c, rules, seen, set) {
				return false
			}
		}
		return true
	}
}

func firstRune(s string) rune {
	for _, r := range s {
		return r
	}
	return -1
}

// leafStartChars returns, for every rule scalarizeLeaves will collapse, the
// printable ASCII characters the rule can START with (its first-set), keyed
// by rule name. Unbounded rules are omitted. The codec rejects a capture
// whose first character is outside the set — an angle's charset contains ","
// via a folded var() arm, but its first-set never does.
func leafStartChars(root *pb.ASTNode) map[string]string {
	rules := map[string]*pb.ASTNode{}
	for _, r := range root.GetChildren() {
		if r.GetKind() == compiler.KindRule {
			if _, ok := rules[r.GetValue()]; !ok {
				rules[r.GetValue()] = r
			}
		}
	}
	out := map[string]string{}
	for name, r := range rules {
		if !(leafTypes[norm(name)] || hasRange(r)) {
			continue
		}
		set := make([]bool, 128)
		ok, _ := firstSet(r, rules, map[string]bool{name: true}, set)
		if !ok {
			continue
		}
		var chars []byte
		for c := byte(0x21); c < 0x7f; c++ {
			if set[c] {
				chars = append(chars, c)
			}
		}
		if len(chars) > 0 {
			out[name] = string(chars)
		}
	}
	return out
}

// firstSet accumulates the characters node can start with. Returns
// (bounded, canMatchEmpty): bounded=false means the first-set is unknowable
// (already-scalarized part, dangling reference) and the rule gets no entry.
func firstSet(node *pb.ASTNode, rules map[string]*pb.ASTNode, seen map[string]bool, set []bool) (bool, bool) {
	if node == nil {
		return true, true
	}
	switch node.GetKind() {
	case compiler.KindScalar:
		return false, false
	case compiler.KindTerminal:
		v := node.GetValue()
		if v == "" {
			return true, true
		}
		if v[0] >= 0x20 && v[0] < 0x7f {
			set[v[0]] = true
		}
		return true, false
	case compiler.KindRange:
		kids := node.GetChildren()
		if len(kids) != 2 {
			return false, false
		}
		lo, hi := firstRune(kids[0].GetValue()), firstRune(kids[1].GetValue())
		if lo < 0 || hi < 0 {
			return false, false
		}
		for c := max(lo, 0x20); c <= min(hi, 0x7e); c++ {
			set[c] = true
		}
		return true, false
	case compiler.KindNonterminal:
		name := node.GetValue()
		if seen[name] {
			return true, false // cycle: no new first characters
		}
		r, ok := rules[name]
		if !ok {
			return false, false
		}
		seen[name] = true
		defer delete(seen, name)
		return firstSet(r, rules, seen, set)
	case compiler.KindOptional, compiler.KindRepetition:
		if len(node.GetChildren()) != 1 {
			return false, false
		}
		ok, _ := firstSet(node.GetChildren()[0], rules, seen, set)
		return ok, true
	case compiler.KindAlternation:
		// Mirror charUnion: function-shaped arms are folded structure, not
		// token spellings; their first characters don't belong to the token.
		empty := false
		for _, c := range node.GetChildren() {
			tmp := make([]bool, 128)
			ok, e := firstSet(c, rules, seen, tmp)
			if !ok {
				return false, false
			}
			cs := make([]bool, 128)
			if charUnion(c, rules, map[string]bool{}, cs) && cs['('] {
				continue
			}
			for i, v := range tmp {
				if v {
					set[i] = true
				}
			}
			empty = empty || e
		}
		return true, empty
	case compiler.KindSequence, compiler.KindRule, compiler.KindGroup:
		empty := true
		for _, c := range node.GetChildren() {
			ok, e := firstSet(c, rules, seen, set)
			if !ok {
				return false, false
			}
			if !e {
				empty = false
				break
			}
		}
		return true, empty
	default:
		return false, false
	}
}

// leafQuoteChars returns, for every rule scalarizeLeaves will collapse whose
// every alternative is a sequence opening and closing with the SAME
// single-character terminal (a quoted string: `'"' … '"'` | `"'" … "'"`),
// the set of possible delimiter characters, keyed by rule name. The codec
// captures such leaves inclusive of their quotes as one token.
func leafQuoteChars(root *pb.ASTNode) map[string]string {
	rules := map[string]*pb.ASTNode{}
	for _, r := range root.GetChildren() {
		if r.GetKind() == compiler.KindRule {
			if _, ok := rules[r.GetValue()]; !ok {
				rules[r.GetValue()] = r
			}
		}
	}
	out := map[string]string{}
	for name, r := range rules {
		if !(leafTypes[norm(name)] || hasRange(r)) {
			continue
		}
		if q := quoteSet(r, rules, map[string]bool{name: true}); q != "" {
			out[name] = q
		}
	}
	return out
}

// quoteSet resolves a rule body to its delimiter set: every alternative must
// be a sequence whose first and last children are the same single-char
// terminal. Nonterminals resolve through rules; anything else disqualifies.
func quoteSet(node *pb.ASTNode, rules map[string]*pb.ASTNode, seen map[string]bool) string {
	switch node.GetKind() {
	case compiler.KindRule, compiler.KindGroup:
		if len(node.GetChildren()) != 1 {
			return ""
		}
		return quoteSet(node.GetChildren()[0], rules, seen)
	case compiler.KindNonterminal:
		name := node.GetValue()
		if seen[name] {
			return ""
		}
		r, ok := rules[name]
		if !ok {
			return ""
		}
		seen[name] = true
		return quoteSet(r, rules, seen)
	case compiler.KindAlternation:
		set := ""
		for _, c := range node.GetChildren() {
			q := quoteSet(c, rules, seen)
			if q == "" {
				return ""
			}
			set += q
		}
		return set
	case compiler.KindSequence:
		kids := node.GetChildren()
		if len(kids) < 2 {
			return ""
		}
		first, last := kids[0], kids[len(kids)-1]
		if first.GetKind() != compiler.KindTerminal || last.GetKind() != compiler.KindTerminal {
			return ""
		}
		if first.GetValue() != last.GetValue() || len(first.GetValue()) != 1 {
			return ""
		}
		return first.GetValue()
	default:
		return ""
	}
}

func formatScalarStopsMap(goPkgName string, stops, quotes, starts map[string]string) string {
	keys := make([]string, 0, len(stops))
	for k := range stops {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var b strings.Builder
	b.WriteString("// Code generated by genproto. DO NOT EDIT.\n\n")
	b.WriteString("package " + goPkgName + "\n\n")
	b.WriteString("// ScalarStopChars maps a scalarized leaf message's FQN to the printable\n")
	b.WriteString("// ASCII characters its grammar rule can never contain. The parser cuts a\n")
	b.WriteString("// scalar capture before the first such character — the lexical boundary\n")
	b.WriteString("// that collapsing the rule to `string value = 1` erased.\n")
	b.WriteString("var ScalarStopChars = map[string]string{\n")
	for _, k := range keys {
		b.WriteString("\t")
		b.WriteString(strconv.Quote(k))
		b.WriteString(": ")
		b.WriteString(strconv.Quote(stops[k]))
		b.WriteString(",\n")
	}
	b.WriteString("}\n")

	skeys := make([]string, 0, len(starts))
	for k := range starts {
		skeys = append(skeys, k)
	}
	sort.Strings(skeys)
	b.WriteString("\n// ScalarStartChars maps a scalarized leaf's FQN to the printable ASCII\n")
	b.WriteString("// characters its rule can START with (the first-set); the parser rejects\n")
	b.WriteString("// captures beginning outside it.\n")
	b.WriteString("var ScalarStartChars = map[string]string{\n")
	for _, k := range skeys {
		b.WriteString("\t")
		b.WriteString(strconv.Quote(k))
		b.WriteString(": ")
		b.WriteString(strconv.Quote(starts[k]))
		b.WriteString(",\n")
	}
	b.WriteString("}\n")

	qkeys := make([]string, 0, len(quotes))
	for k := range quotes {
		qkeys = append(qkeys, k)
	}
	sort.Strings(qkeys)
	b.WriteString("\n// ScalarQuoteChars maps a quote-delimited scalarized leaf's FQN to its\n")
	b.WriteString("// possible delimiter characters; the parser captures the whole literal\n")
	b.WriteString("// (quotes included) as one token.\n")
	b.WriteString("var ScalarQuoteChars = map[string]string{\n")
	for _, k := range qkeys {
		b.WriteString("\t")
		b.WriteString(strconv.Quote(k))
		b.WriteString(": ")
		b.WriteString(strconv.Quote(quotes[k]))
		b.WriteString(",\n")
	}
	b.WriteString("}\n")
	return b.String()
}
