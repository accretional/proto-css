// Package service renders typed CSS messages to CSS text and parses CSS text
// back. It carries no CSS logic: it registers the grammar-derived tables
// (csspb.MessagePrefix / FieldSeparator) with gluon's generic codec and
// delegates every operation to it. Importing this package "links" the CSS
// grammar, so any other grammar embedding CSS can descend into it at runtime.
package service

import (
	"fmt"

	"google.golang.org/protobuf/proto"

	"github.com/accretional/gluon/v2/codec"
	csspb "github.com/accretional/proto-css/proto/pb/css"
)

func init() {
	codec.Register(&codec.Grammar{
		Package:      "css",
		Prefix:       csspb.MessagePrefix,
		Separator:    csspb.FieldSeparator,
		Seam:         nil, // CSS has no outward seams yet (path()/d added later).
		SmartSpacing: true, // CSS: convention-aware spacing, whitespace-insignificant.
	})
}

// Render serializes any typed CSS message back into CSS text.
func Render(msg proto.Message) (string, error) {
	return codec.Render(codec.Default, msg)
}

// Parse parses CSS text into a typed CssStyleSheet (the start symbol).
func Parse(input string) (*csspb.CssStyleSheet, error) {
	msg, err := ParseAs(input, "css.CssStyleSheet")
	if err != nil {
		return nil, err
	}
	sheet, ok := msg.(*csspb.CssStyleSheet)
	if !ok {
		return nil, fmt.Errorf("internal: parsed %T", msg)
	}
	return sheet, nil
}

// ParseAs parses CSS text against an arbitrary css.* message type.
func ParseAs(input, typeName string) (proto.Message, error) {
	return codec.Parse(codec.Default, input, typeName)
}
