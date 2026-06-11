package service

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

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

// Render serializes the request's CssStyleSheet to CSS text.
func (s *Server) Render(_ context.Context, req *cssservicepb.RenderRequest) (*cssservicepb.RenderResponse, error) {
	sheet := req.GetSheet()
	if sheet == nil {
		return nil, status.Error(codes.InvalidArgument, "sheet is required")
	}
	css, err := Render(sheet)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "render: %v", err)
	}
	return &cssservicepb.RenderResponse{Css: css}, nil
}

// RenderStream renders the stylesheet and streams the CSS text in chunks.
func (s *Server) RenderStream(req *cssservicepb.RenderRequest, stream cssservicepb.CssService_RenderStreamServer) error {
	sheet := req.GetSheet()
	if sheet == nil {
		return status.Error(codes.InvalidArgument, "sheet is required")
	}
	css, err := Render(sheet)
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

// Parse parses CSS text into a CssStyleSheet.
func (s *Server) Parse(_ context.Context, req *cssservicepb.ParseRequest) (*cssservicepb.ParseResponse, error) {
	sheet, err := Parse(req.GetCss())
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "parse: %v", err)
	}
	return &cssservicepb.ParseResponse{Sheet: sheet}, nil
}
