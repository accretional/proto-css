package service

import (
	"context"
	"net"
	"strings"
	"testing"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/reflection"
	reflectionpb "google.golang.org/grpc/reflection/grpc_reflection_v1"
	"google.golang.org/grpc/test/bufconn"

	cssservicepb "github.com/accretional/proto-css/proto/pb/cssservice"
)

// startBufServer runs the CssService (plus gRPC reflection) on an in-memory
// listener, mirroring service/cmd/server's wiring.
func startBufServer(t *testing.T) *grpc.ClientConn {
	t.Helper()
	lis := bufconn.Listen(1 << 20)
	s := grpc.NewServer()
	cssservicepb.RegisterCssServiceServer(s, NewServer())
	reflection.Register(s)
	go func() { _ = s.Serve(lis) }()
	t.Cleanup(s.Stop)

	conn, err := grpc.NewClient("passthrough:///bufnet",
		grpc.WithContextDialer(func(ctx context.Context, _ string) (net.Conn, error) {
			return lis.DialContext(ctx)
		}),
		grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatalf("dial bufconn: %v", err)
	}
	t.Cleanup(func() { _ = conn.Close() })
	return conn
}

// TestGRPCParseRenderOverWire: the full client→server→codec path.
func TestGRPCParseRenderOverWire(t *testing.T) {
	client := cssservicepb.NewCssServiceClient(startBufServer(t))
	ctx := context.Background()

	parsed, err := client.Parse(ctx, &cssservicepb.ParseRequest{Css: serverSheet})
	if err != nil {
		t.Fatalf("Parse: %v", err)
	}
	rendered, err := client.Render(ctx, &cssservicepb.RenderRequest{Sheet: parsed.GetSheet()})
	if err != nil {
		t.Fatalf("Render: %v", err)
	}
	stream, err := client.RenderStream(ctx, &cssservicepb.RenderRequest{Sheet: parsed.GetSheet()})
	if err != nil {
		t.Fatalf("RenderStream: %v", err)
	}
	var chunks []string
	for {
		chunk, err := stream.Recv()
		if err != nil {
			break
		}
		chunks = append(chunks, chunk.GetCss())
	}
	if got := strings.Join(chunks, ""); got != rendered.GetCss() {
		t.Errorf("stream != render:\n render: %s\n stream: %s", rendered.GetCss(), got)
	}
}

// TestGRPCReflectionServesSchema: gRPC reflection on the CssService server
// resolves the css.* schema — service and grammar messages alike — so clients
// can fetch the whole grammar over the wire.
func TestGRPCReflectionServesSchema(t *testing.T) {
	rc := reflectionpb.NewServerReflectionClient(startBufServer(t))
	stream, err := rc.ServerReflectionInfo(context.Background())
	if err != nil {
		t.Fatalf("ServerReflectionInfo: %v", err)
	}
	defer func() { _ = stream.CloseSend() }()

	for _, symbol := range []string{
		"css.CssService",
		"css.CssStyleSheet",
	} {
		if err := stream.Send(&reflectionpb.ServerReflectionRequest{
			MessageRequest: &reflectionpb.ServerReflectionRequest_FileContainingSymbol{
				FileContainingSymbol: symbol,
			},
		}); err != nil {
			t.Fatalf("send %s: %v", symbol, err)
		}
		resp, err := stream.Recv()
		if err != nil {
			t.Fatalf("recv %s: %v", symbol, err)
		}
		fdr := resp.GetFileDescriptorResponse()
		if fdr == nil || len(fdr.GetFileDescriptorProto()) == 0 {
			t.Errorf("reflection: no file descriptor for %s (got %v)", symbol, resp.GetMessageResponse())
		}
	}
}
