package service

import (
	"context"
	"strings"
	"testing"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	cssservicepb "github.com/accretional/proto-css/proto/pb/cssservice"
)

const serverSheet = `body { color:red; margin:0 } @media screen { a { color:blue } }`

// TestServerParseRenderRoundTrip: the gRPC surface round-trips a stylesheet.
// The codec re-renders with its own smart spacing, so the invariant is the
// codec's fixed point — rendering is stable across a second parse — not
// byte-equality with the input.
func TestServerParseRenderRoundTrip(t *testing.T) {
	s := NewServer()
	parsed, err := s.Parse(context.Background(), &cssservicepb.ParseRequest{Css: serverSheet})
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	if parsed.GetSheet() == nil {
		t.Fatal("Parse returned nil sheet")
	}
	rendered, err := s.Render(context.Background(), &cssservicepb.RenderRequest{Sheet: parsed.GetSheet()})
	if err != nil {
		t.Fatalf("Render: %v", err)
	}
	for _, w := range []string{"color:red", "margin:0", "@media", "color:blue"} {
		if !strings.Contains(rendered.GetCss(), w) {
			t.Errorf("rendered output missing %q: %s", w, rendered.GetCss())
		}
	}
	reparsed, err := s.Parse(context.Background(), &cssservicepb.ParseRequest{Css: rendered.GetCss()})
	if err != nil {
		t.Fatalf("re-Parse: %v", err)
	}
	rerendered, err := s.Render(context.Background(), &cssservicepb.RenderRequest{Sheet: reparsed.GetSheet()})
	if err != nil {
		t.Fatalf("re-Render: %v", err)
	}
	if rerendered.GetCss() != rendered.GetCss() {
		t.Errorf("render not a fixed point:\n 1st: %s\n 2nd: %s", rendered.GetCss(), rerendered.GetCss())
	}
}

// TestServerParseAsSubtree: ParseRequest.type parses an arbitrary grammar
// subtree (here a bare declaration list), returns it Any-packed in `node`,
// and RenderRequest.node renders it back. This is the path the css gallery
// generator drives for every walked declaration.
func TestServerParseAsSubtree(t *testing.T) {
	s := NewServer()
	const decl = "color:red"
	parsed, err := s.Parse(context.Background(), &cssservicepb.ParseRequest{Css: decl, Type: "css.DeclarationListType"})
	if err != nil {
		t.Fatalf("Parse(type): %v", err)
	}
	if parsed.GetSheet() != nil {
		t.Error("Parse(type) should not set sheet")
	}
	node := parsed.GetNode()
	if node == nil {
		t.Fatal("Parse(type) returned nil node")
	}
	if want := "type.googleapis.com/css.DeclarationListType"; node.GetTypeUrl() != want {
		t.Errorf("node type_url = %q, want %q", node.GetTypeUrl(), want)
	}
	rendered, err := s.Render(context.Background(), &cssservicepb.RenderRequest{Node: node})
	if err != nil {
		t.Fatalf("Render(node): %v", err)
	}
	if !strings.Contains(rendered.GetCss(), "color:red") {
		t.Errorf("subtree render missing declaration: %q", rendered.GetCss())
	}

	if _, err := s.Parse(context.Background(), &cssservicepb.ParseRequest{Css: decl, Type: "css.NoSuchType"}); status.Code(err) != codes.InvalidArgument {
		t.Errorf("Parse(unknown type): got %v, want InvalidArgument", err)
	}
}

// renderStreamCollector implements CssService_RenderStreamServer for tests;
// only Send is called by the server.
type renderStreamCollector struct {
	cssservicepb.CssService_RenderStreamServer
	chunks []string
}

func (c *renderStreamCollector) Send(chunk *cssservicepb.RenderChunk) error {
	c.chunks = append(c.chunks, chunk.GetCss())
	return nil
}

// TestServerRenderStream: chunk concatenation equals Render's css.
func TestServerRenderStream(t *testing.T) {
	s := NewServer()
	parsed, err := s.Parse(context.Background(), &cssservicepb.ParseRequest{Css: serverSheet})
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	rendered, err := s.Render(context.Background(), &cssservicepb.RenderRequest{Sheet: parsed.GetSheet()})
	if err != nil {
		t.Fatalf("Render: %v", err)
	}
	col := &renderStreamCollector{}
	if err := s.RenderStream(&cssservicepb.RenderRequest{Sheet: parsed.GetSheet()}, col); err != nil {
		t.Fatalf("RenderStream: %v", err)
	}
	if got := strings.Join(col.chunks, ""); got != rendered.GetCss() {
		t.Errorf("stream mismatch:\n render: %s\n stream: %s", rendered.GetCss(), got)
	}
}

// TestServerInvalidArgument: missing inputs surface as InvalidArgument.
func TestServerInvalidArgument(t *testing.T) {
	s := NewServer()
	if _, err := s.Render(context.Background(), &cssservicepb.RenderRequest{}); status.Code(err) != codes.InvalidArgument {
		t.Errorf("Render(nil sheet): got %v, want InvalidArgument", err)
	}
	if err := s.RenderStream(&cssservicepb.RenderRequest{}, &renderStreamCollector{}); status.Code(err) != codes.InvalidArgument {
		t.Errorf("RenderStream(nil sheet): got %v, want InvalidArgument", err)
	}
	if _, err := s.Parse(context.Background(), &cssservicepb.ParseRequest{Css: "@@@ not css {"}); status.Code(err) != codes.InvalidArgument {
		t.Errorf("Parse(garbage): got %v, want InvalidArgument", err)
	}
}
