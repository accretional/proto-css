package service

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/anypb"

	cssservicepb "github.com/accretional/proto-css/proto/pb/cssservice"
)

// streamChunkBytes bounds each RenderStream chunk so a single gRPC message
// stays small (the chromerpc lesson: keep streamed payloads well under 4MB).
const streamChunkBytes = 64 * 1024

// Server implements cssservicepb.CssServiceServer. It holds no per-property
// state — Render and Parse are reflection over the generated css schema and
// tables, rooted at CssStyleSheet.
type Server struct {
	cssservicepb.UnimplementedCssServiceServer
}

// NewServer returns a ready CssService server.
func NewServer() *Server { return &Server{} }

// renderRoot resolves a RenderRequest's root message: the Any-packed subtree
// in `node` when set (as produced by Parse with a `type`), else `sheet`.
func renderRoot(req *cssservicepb.RenderRequest) (proto.Message, error) {
	if n := req.GetNode(); n != nil {
		msg, err := n.UnmarshalNew()
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "node: %v", err)
		}
		return msg, nil
	}
	if sheet := req.GetSheet(); sheet != nil {
		return sheet, nil
	}
	return nil, status.Error(codes.InvalidArgument, "sheet or node is required")
}

// Render serializes the request's CssStyleSheet (or Any-packed subtree) to CSS text.
func (s *Server) Render(_ context.Context, req *cssservicepb.RenderRequest) (*cssservicepb.RenderResponse, error) {
	root, err := renderRoot(req)
	if err != nil {
		return nil, err
	}
	css, err := Render(root)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "render: %v", err)
	}
	return &cssservicepb.RenderResponse{Css: css}, nil
}

// RenderStream renders the stylesheet and streams the CSS text in chunks.
func (s *Server) RenderStream(req *cssservicepb.RenderRequest, stream cssservicepb.CssService_RenderStreamServer) error {
	root, err := renderRoot(req)
	if err != nil {
		return err
	}
	css, err := Render(root)
	if err != nil {
		return status.Errorf(codes.InvalidArgument, "render: %v", err)
	}
	for i := 0; i < len(css); i += streamChunkBytes {
		end := i + streamChunkBytes
		if end > len(css) {
			end = len(css)
		}
		if err := stream.Send(&cssservicepb.RenderChunk{Css: css[i:end]}); err != nil {
			return err
		}
	}
	return nil
}

// Parse parses CSS text into a CssStyleSheet, or — when req.Type names a
// non-root grammar message — into that subtree, returned Any-packed in `node`.
func (s *Server) Parse(_ context.Context, req *cssservicepb.ParseRequest) (*cssservicepb.ParseResponse, error) {
	if typ := req.GetType(); typ != "" {
		msg, err := ParseAs(req.GetCss(), typ)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "parse as %s: %v", typ, err)
		}
		node, err := anypb.New(msg)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "pack %s: %v", typ, err)
		}
		return &cssservicepb.ParseResponse{Node: node}, nil
	}
	sheet, err := Parse(req.GetCss())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "parse: %v", err)
	}
	return &cssservicepb.ParseResponse{Sheet: sheet}, nil
}
