// Command server runs the CssService gRPC server.
package main

import (
	"flag"
	"log"
	"net"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	cssservicepb "github.com/accretional/proto-css/proto/pb/cssservice"
	"github.com/accretional/proto-css/service"
)

func main() {
	addr := flag.String("addr", ":50051", "listen address")
	flag.Parse()

	lis, err := net.Listen("tcp", *addr)
	if err != nil {
		log.Fatalf("listen %s: %v", *addr, err)
	}

	s := grpc.NewServer(grpc.MaxRecvMsgSize(64*1024*1024), grpc.MaxSendMsgSize(64*1024*1024))
	cssservicepb.RegisterCssServiceServer(s, service.NewServer())
	reflection.Register(s) // enables grpc reflection / discovery over the schema

	log.Printf("CssService listening on %s", lis.Addr())
	if err := s.Serve(lis); err != nil {
		log.Fatalf("serve: %v", err)
	}
}
