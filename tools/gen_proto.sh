#!/usr/bin/env bash
# gen_proto.sh — regenerate the CSS proto schema, tables, and Go bindings from
# the EBNF grammar. Idempotent: safe to re-run any time. Run from anywhere.
#
#   tools/gen_proto.sh
#
# Pipeline:
#   1. genproto  : lang/*.ebnf -> proto/css.proto + css.fdset + prefix/separator maps
#   2. protoc    : proto/css.proto         -> proto/pb/css/css.pb.go
#                  proto/css_service.proto -> proto/pb/cssservice/*.pb.go (+grpc)
#   3. go build  : sanity-check the generated packages compile
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> genproto: EBNF -> css.proto + tables"
go run ./lang/cmd/genproto/

echo "==> protoc: css.proto -> Go"
protoc -I proto \
  --go_out=. --go_opt=module=github.com/accretional/proto-css \
  proto/css.proto

echo "==> protoc: css_service.proto -> Go + gRPC"
protoc -I proto \
  --go_out=. --go_opt=module=github.com/accretional/proto-css \
  --go-grpc_out=. --go-grpc_opt=module=github.com/accretional/proto-css \
  proto/css_service.proto

echo "==> go build ./proto/... ./service/..."
go build ./proto/... ./service/...

echo "==> done"
