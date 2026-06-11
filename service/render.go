// Package service implements CssService: rendering typed CSS messages to CSS
// text and parsing CSS text back, both purely by reflection over the
// grammar-derived schema in css.proto plus the generated tables
// (csspb.MessagePrefix, csspb.FieldSeparator). There is no per-property logic.
package service

import (
	"fmt"
	"strings"

	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protoreflect"

	csspb "github.com/accretional/proto-css/proto/pb/css"
)

// Render serializes any typed CSS message back into CSS text. It walks the
// message via reflection:
//
//   - emits the message's leading terminal tokens recorded in
//     csspb.MessagePrefix (the property name, colon, punctuation, and keyword
//     literals that genproto's StripKeywords moved out of the schema),
//   - recurses into populated message fields in proto declaration order,
//   - emits scalar string fields (the leaf value types — <length>, <color>,
//     <ident>, … — that genproto collapsed to `string value`) verbatim,
//   - interleaves csspb.FieldSeparator between elements of a repeated field.
//
// The emitted tokens are then stitched with CSS-appropriate spacing. Nothing
// here knows about any specific CSS property: the grammar-derived schema and
// tables carry all the structure.
func Render(msg proto.Message) (string, error) {
	var toks []string
	if err := renderMessage(msg.ProtoReflect(), &toks); err != nil {
		return "", err
	}
	return joinTokens(toks), nil
}

func renderMessage(m protoreflect.Message, toks *[]string) error {
	fqn := "." + string(m.Descriptor().FullName())
	if prefix, ok := csspb.MessagePrefix[fqn]; ok {
		*toks = append(*toks, prefix...)
	}

	fds := m.Descriptor().Fields()
	for i := 0; i < fds.Len(); i++ {
		fd := fds.Get(i)
		if !m.Has(fd) {
			continue
		}
		val := m.Get(fd)
		if fd.IsList() {
			list := val.List()
			sep := csspb.FieldSeparator[fqn+"."+string(fd.Name())]
			for j := 0; j < list.Len(); j++ {
				if j > 0 && sep != "" {
					*toks = append(*toks, sep)
				}
				if err := renderValue(fd, list.Get(j), toks); err != nil {
					return err
				}
			}
			continue
		}
		if err := renderValue(fd, val, toks); err != nil {
			return err
		}
	}
	return nil
}

func renderValue(fd protoreflect.FieldDescriptor, val protoreflect.Value, toks *[]string) error {
	switch fd.Kind() {
	case protoreflect.MessageKind, protoreflect.GroupKind:
		return renderMessage(val.Message(), toks)
	case protoreflect.StringKind:
		if s := val.String(); s != "" {
			*toks = append(*toks, s)
		}
		return nil
	default:
		return fmt.Errorf("unsupported field kind %v at %s", fd.Kind(), fd.FullName())
	}
}

// joinTokens stitches tokens into CSS text. Tokens are separated by a single
// space, except where CSS convention attaches punctuation to its neighbour.
// The result is always valid CSS; the spacing favours the compact-but-legal
// form (e.g. "display:flex", "16px/1.5", "rgb(1,2,3)", "a:hover").
func joinTokens(toks []string) string {
	var b strings.Builder
	for i, t := range toks {
		if t == "" {
			continue
		}
		if b.Len() == 0 {
			b.WriteString(t)
			continue
		}
		prev := toks[i-1]
		if !noSpaceBefore(t) && !noSpaceAfter(prev) {
			b.WriteByte(' ')
		}
		b.WriteString(t)
	}
	return b.String()
}

// noSpaceBefore reports whether tok hugs the preceding token (no space before).
func noSpaceBefore(tok string) bool {
	switch tok {
	case ",", "(", ")", ";", ":", "/", ".", "]":
		return true
	}
	return false
}

// noSpaceAfter reports whether prev suppresses the following space (no space
// after).
func noSpaceAfter(prev string) bool {
	switch prev {
	case "(", ":", "/", ".", "[", "!", "#":
		return true
	}
	return false
}
