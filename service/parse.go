package service

import (
	"fmt"
	"strings"

	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/reflect/protoregistry"

	csspb "github.com/accretional/proto-css/proto/pb/css"
)

// Parse parses CSS text into a typed CssStyleSheet. All CSS is rooted at the
// stylesheet, so that is the start symbol. The parser is pure reflection over
// the generated css schema plus the prefix/separator tables — the proto schema
// IS the grammar. It walks the descriptor, matching MessagePrefix tokens and
// capturing scalar leaf text, skipping CSS whitespace between tokens.
//
// This is the inverse of Render and round-trips the structured output Render
// produces. Free-form CSS with constructs the scalarized grammar can't
// distinguish structurally (e.g. arbitrary whitespace inside shorthands) is
// best-effort; see the demo notes for known limits.
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

// ParseAs parses CSS text against an arbitrary css.* message type (the start
// symbol), e.g. "css.Property" for a single declaration or
// "css.ComplexSelectorList" for a selector. Same pure-reflection engine as
// Parse, rooted wherever the caller asks. Best-effort: see Parse's note.
func ParseAs(input, typeName string) (proto.Message, error) {
	mt, err := protoregistry.GlobalTypes.FindMessageByName(protoreflect.FullName(typeName))
	if err != nil {
		return nil, fmt.Errorf("%s not registered: %w", typeName, err)
	}
	msg := mt.New()

	p := &parser{prefix: csspb.MessagePrefix, sep: csspb.FieldSeparator}
	pos, err := p.parseMsg(input, p.skipWS(input, 0), msg, nil)
	if err != nil {
		return nil, err
	}
	pos = p.skipWS(input, pos)
	if pos < len(input) {
		return nil, fmt.Errorf("unconsumed input at %d: %q", pos, snippet(input[pos:]))
	}
	return msg.Interface(), nil
}

type parser struct {
	prefix map[string][]string
	sep    map[string]string
	depth  int
	steps  int
}

// maxParseDepth bounds recursion; maxParseSteps bounds total work. The CSS
// selector grammar is recursive (:is(), :not(), :has() take selector lists),
// so a naive longest-match descent can recurse or backtrack without bound.
// Parse is a best-effort inverse of Render — these caps make it fail fast
// instead of hanging on inputs the scalarized schema can't resolve.
const (
	maxParseDepth = 160
	maxParseSteps = 2_000_000
)

// parseMsg populates msg from input starting at pos. outerStops are stop
// strings inherited from the parent (where this message's text must end).
func (p *parser) parseMsg(input string, pos int, msg protoreflect.Message, outerStops []string) (int, error) {
	if p.depth > maxParseDepth {
		return pos, fmt.Errorf("max parse depth exceeded")
	}
	if p.steps++; p.steps > maxParseSteps {
		return pos, fmt.Errorf("parse step budget exceeded")
	}
	p.depth++
	defer func() { p.depth-- }()

	md := msg.Descriptor()
	fqn := "." + string(md.FullName())

	// 1. Consume the message's leading prefix tokens (keyword/punctuation).
	if pfx, ok := p.prefix[fqn]; ok {
		for _, tok := range pfx {
			pos = p.skipWS(input, pos)
			if !strings.HasPrefix(input[pos:], tok) {
				return pos, fmt.Errorf("expected %q for %s at %d", tok, md.Name(), pos)
			}
			pos += len(tok)
		}
	}

	// 2. Scalar leaf — caller captures the text via parseScalar.
	if isScalar(md) {
		return pos, nil
	}

	// 3. Walk fields in declaration order.
	fields := md.Fields()
	handledOneofs := map[int]bool{}
	for i := 0; i < fields.Len(); i++ {
		fd := fields.Get(i)
		stops := p.fieldStops(md, i, outerStops)

		if od := fd.ContainingOneof(); od != nil {
			if handledOneofs[od.Index()] {
				continue
			}
			handledOneofs[od.Index()] = true
			pos = p.parseOneof(input, pos, msg, od, stops)
			continue
		}
		if fd.IsList() {
			pos = p.parseRepeated(input, pos, msg, fd, stops)
			continue
		}
		if np, err := p.parseSingular(input, pos, msg, fd, stops); err == nil {
			pos = np
		}
		// optional fields that don't match are simply left unset
	}
	return pos, nil
}

func (p *parser) parseSingular(input string, pos int, msg protoreflect.Message, fd protoreflect.FieldDescriptor, stops []string) (int, error) {
	if fd.Kind() != protoreflect.MessageKind {
		text, np := matchUntilAny(input, p.skipWS(input, pos), stops)
		text = strings.TrimSpace(text)
		if text != "" {
			msg.Set(fd, protoreflect.ValueOfString(text))
		}
		return np, nil
	}
	sub := newSub(fd.Message())
	if sub == nil {
		return pos, fmt.Errorf("cannot create %s", fd.Message().FullName())
	}
	if isScalar(fd.Message()) {
		return p.parseScalar(input, pos, msg, fd, sub, stops)
	}
	np, err := p.parseMsg(input, pos, sub, stops)
	if err != nil {
		return pos, err
	}
	msg.Set(fd, protoreflect.ValueOfMessage(sub))
	return np, nil
}

// parseScalar handles a `string value = 1` leaf message: capture text up to the
// next stop and store it on the sub-message's value field.
func (p *parser) parseScalar(input string, pos int, parent protoreflect.Message, fd protoreflect.FieldDescriptor, sub protoreflect.Message, stops []string) (int, error) {
	text, np := matchUntilAny(input, p.skipWS(input, pos), stops)
	text = strings.TrimSpace(text)
	if text == "" {
		return pos, fmt.Errorf("empty scalar for %s", fd.Name())
	}
	if vfd := sub.Descriptor().Fields().ByName("value"); vfd != nil {
		sub.Set(vfd, protoreflect.ValueOfString(text))
	}
	parent.Set(fd, protoreflect.ValueOfMessage(sub))
	return np, nil
}

// parseOneof tries each variant and keeps the one that consumes the most input.
func (p *parser) parseOneof(input string, pos int, msg protoreflect.Message, od protoreflect.OneofDescriptor, stops []string) int {
	bestPos := pos
	var bestFD protoreflect.FieldDescriptor
	var bestMsg protoreflect.Message

	for i := 0; i < od.Fields().Len(); i++ {
		fd := od.Fields().Get(i)
		if fd.Kind() != protoreflect.MessageKind {
			continue
		}
		sub := newSub(fd.Message())
		if sub == nil {
			continue
		}
		if isScalar(fd.Message()) {
			continue // try structured variants first; scalar is the fallback
		}
		if np, err := p.parseMsg(input, pos, sub, stops); err == nil && np > bestPos {
			bestPos, bestFD, bestMsg = np, fd, sub
		}
	}
	// Fallback: first scalar variant captures the text.
	if bestFD == nil {
		for i := 0; i < od.Fields().Len(); i++ {
			fd := od.Fields().Get(i)
			if fd.Kind() != protoreflect.MessageKind || !isScalar(fd.Message()) {
				continue
			}
			sub := newSub(fd.Message())
			text, np := matchUntilAny(input, p.skipWS(input, pos), stops)
			text = strings.TrimSpace(text)
			if text == "" {
				continue
			}
			if vfd := fd.Message().Fields().ByName("value"); vfd != nil {
				sub.Set(vfd, protoreflect.ValueOfString(text))
			}
			bestPos, bestFD, bestMsg = np, fd, sub
			break
		}
	}
	if bestFD != nil {
		msg.Set(bestFD, protoreflect.ValueOfMessage(bestMsg))
	}
	return bestPos
}

// parseRepeated matches zero or more elements, separated by FieldSeparator (or
// just whitespace when no separator was recorded).
func (p *parser) parseRepeated(input string, pos int, msg protoreflect.Message, fd protoreflect.FieldDescriptor, outerStops []string) int {
	if fd.Kind() != protoreflect.MessageKind {
		return pos
	}
	list := msg.Mutable(fd).List()
	sepKey := "." + string(msg.Descriptor().FullName()) + "." + string(fd.Name())
	sep := p.sep[sepKey]

	for {
		tryPos := pos
		if list.Len() > 0 && sep != "" {
			tryPos = p.skipWS(input, tryPos)
			if !strings.HasPrefix(input[tryPos:], sep) {
				break
			}
			tryPos += len(sep)
		}
		sub := newSub(fd.Message())
		if sub == nil {
			break
		}
		np, err := p.parseMsg(input, tryPos, sub, outerStops)
		if err != nil || np <= tryPos {
			break
		}
		list.Append(protoreflect.ValueOfMessage(sub))
		pos = np
	}
	return pos
}

// fieldStops returns the stop strings for field[i]: the leading terminals of
// all later siblings (so a scalar knows where to stop), plus inherited stops.
func (p *parser) fieldStops(md protoreflect.MessageDescriptor, fieldIdx int, outerStops []string) []string {
	stops := append([]string(nil), outerStops...)
	fields := md.Fields()
	var skipOneof protoreflect.OneofDescriptor
	if fieldIdx < fields.Len() {
		skipOneof = fields.Get(fieldIdx).ContainingOneof()
	}
	handled := map[int]bool{}
	for j := fieldIdx + 1; j < fields.Len(); j++ {
		fd := fields.Get(j)
		if od := fd.ContainingOneof(); od != nil {
			if skipOneof != nil && od.Index() == skipOneof.Index() {
				continue
			}
			if handled[od.Index()] {
				continue
			}
			handled[od.Index()] = true
			for k := 0; k < od.Fields().Len(); k++ {
				if vfd := od.Fields().Get(k); vfd.Kind() == protoreflect.MessageKind {
					if t := p.leadingTerminal(vfd.Message()); t != "" {
						stops = append(stops, t)
					}
				}
			}
		} else if fd.Kind() == protoreflect.MessageKind {
			if t := p.leadingTerminal(fd.Message()); t != "" {
				stops = append(stops, t)
			}
		}
	}
	return stops
}

// leadingTerminal returns the first prefix token reachable at the front of a
// message (recursing into the first field / first oneof variant).
func (p *parser) leadingTerminal(md protoreflect.MessageDescriptor) string {
	fqn := "." + string(md.FullName())
	if pfx, ok := p.prefix[fqn]; ok && len(pfx) > 0 {
		return pfx[0]
	}
	if md.Fields().Len() > 0 {
		fd := md.Fields().Get(0)
		if od := fd.ContainingOneof(); od != nil {
			for i := 0; i < od.Fields().Len(); i++ {
				if vfd := od.Fields().Get(i); vfd.Kind() == protoreflect.MessageKind {
					if t := p.leadingTerminal(vfd.Message()); t != "" {
						return t
					}
				}
			}
			return ""
		}
		if fd.Kind() == protoreflect.MessageKind {
			return p.leadingTerminal(fd.Message())
		}
	}
	return ""
}

func (p *parser) skipWS(input string, pos int) int {
	for pos < len(input) {
		switch input[pos] {
		case ' ', '\t', '\n', '\r', '\f':
			pos++
		default:
			return pos
		}
	}
	return pos
}

// matchUntilAny captures text from pos until the earliest stop string (or end).
func matchUntilAny(input string, pos int, stops []string) (string, int) {
	end := len(input)
	for _, s := range stops {
		if s == "" {
			continue
		}
		if idx := strings.Index(input[pos:], s); idx >= 0 && pos+idx < end {
			end = pos + idx
		}
	}
	return input[pos:end], end
}

// isScalar reports whether a message is a single `string value = 1` leaf.
func isScalar(md protoreflect.MessageDescriptor) bool {
	fields := md.Fields()
	if fields.Len() != 1 {
		return false
	}
	fd := fields.Get(0)
	return string(fd.Name()) == "value" && fd.Kind() == protoreflect.StringKind
}

// newSub builds a fresh mutable message from a descriptor via the global registry.
func newSub(md protoreflect.MessageDescriptor) protoreflect.Message {
	mt, err := protoregistry.GlobalTypes.FindMessageByName(md.FullName())
	if err != nil {
		return nil
	}
	return mt.New()
}

func snippet(s string) string {
	if len(s) > 48 {
		return s[:48] + "…"
	}
	return s
}
