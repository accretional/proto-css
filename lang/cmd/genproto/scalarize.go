package main

import (
	"strings"

	"github.com/accretional/gluon/v2/compiler"
	pb "github.com/accretional/gluon/v2/pb"
)

// leafTypes are the atomic, open-ended CSS value leaf types — the scalars and
// tokens that bottom out in infinite character ranges (digits, units, ident
// characters, hex digits, string chars). The grammar fully expands them, but a
// caller constructing a value structurally has no business building a digit
// tree to spell "16px"; these collapse to a proto3 `string value = 1` field
// that the caller fills with the literal token. Everything composite above a
// leaf (colors, gradients, shapes, calc(), functions, shorthands) stays a
// structured message graph walked by the renderer.
//
// Both the snake_case atom (`time_type`) and the PascalCase wrapper
// (`TimeType = time_type | TimeVarFn`) normalize to the same message name and
// are scalarized together; the var()/calc alternative folds into the scalar
// (callers may still pass "var(--x)" as the literal string).
//
// This mirrors proto-sqlite's scalarizeX: a small, local, grammar-specific
// transform composed into the otherwise grammar-agnostic gluon pipeline.
var leafTypes = normSet(
	"number_type", "non_negative_number_type",
	"integer_type", "non_negative_integer_type", "positive_integer_type", "negative_integer_type",
	"percentage_type", "non_negative_percentage_type",
	"length_type", "non_negative_length_type",
	"time_type", "non_negative_time_type",
	"angle_type",
	"flex_type", "non_negative_flex_type",
	"frequency_type",
	"resolution_type",
	"ident_type", "custom_ident_type", "dashed_ident_type",
	"hex_color_type",
	"string_type",
	"dimension_type",
)

// normSet builds a set of names normalized to lowercase-without-underscores, so
// "time_type" and "TimeType" map to the same key.
func normSet(names ...string) map[string]bool {
	s := make(map[string]bool, len(names))
	for _, n := range names {
		s[norm(n)] = true
	}
	return s
}

func norm(s string) string { return strings.ToLower(strings.ReplaceAll(s, "_", "")) }

// scalarizeLeaves walks the AST and replaces the body of every leaf rule with a
// single scalar node, so it lowers to `message X { string value = 1; }`. A rule
// is a leaf when either:
//
//   - its normalized name is in leafTypes (the curated open-ended value types), or
//   - its body contains a character range (e.g. digit = "0"…"9"). A range is a
//     lexical primitive; collapsing it keeps css.proto self-contained (ranges
//     otherwise lower to .unicode.UTF8 fields and pull in unicode/utf_8.proto)
//     and is the right shape for construction anyway — callers spell the token
//     directly (e.g. "2n+1" for an An+B nth expression).
//
// Rules are matched by normalized name, so both the snake_case atom and its
// PascalCase wrapper collapse to the same scalar message. The input is not
// mutated; a deep copy is returned.
func scalarizeLeaves(root *pb.ASTNode) *pb.ASTNode {
	if root == nil {
		return nil
	}
	if root.GetKind() == compiler.KindRule && (leafTypes[norm(root.GetValue())] || hasRange(root)) {
		return &pb.ASTNode{
			Kind:     compiler.KindRule,
			Value:    root.GetValue(),
			Children: []*pb.ASTNode{{Kind: compiler.KindScalar, Value: "value"}},
		}
	}
	kids := make([]*pb.ASTNode, 0, len(root.GetChildren()))
	for _, c := range root.GetChildren() {
		kids = append(kids, scalarizeLeaves(c))
	}
	return &pb.ASTNode{Kind: root.GetKind(), Value: root.GetValue(), Children: kids}
}

// hasRange reports whether the node's own subtree contains a character range.
// Nonterminal references are leaf nodes pointing at other rules, so this only
// sees ranges written inline in this rule's body.
func hasRange(node *pb.ASTNode) bool {
	if node == nil {
		return false
	}
	if node.GetKind() == compiler.KindRange {
		return true
	}
	for _, c := range node.GetChildren() {
		if hasRange(c) {
			return true
		}
	}
	return false
}
