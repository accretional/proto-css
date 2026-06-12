package service

import (
	"testing"

	"google.golang.org/protobuf/proto"

	csspb "github.com/accretional/proto-css/proto/pb/css"
)

func mustRender(t *testing.T, m proto.Message) string {
	t.Helper()
	s, err := Render(m)
	if err != nil {
		t.Fatalf("Render(%T): %v", m, err)
	}
	return s
}

// Scalar leaf type collapses to a string field; the renderer emits it verbatim.
func TestRender_ScalarLeaf(t *testing.T) {
	got := mustRender(t, &csspb.LengthType{Value: "16px"})
	if got != "16px" {
		t.Errorf("LengthType: got %q want %q", got, "16px")
	}
}

// Keyword enum + full declaration: the property name, colon, keyword value and
// trailing semicolon are all grammar-derived empty markers / prefixes.
func TestRender_KeywordDeclaration(t *testing.T) {
	expr := &csspb.FlexDirectionExpr{
		Alt1: &csspb.FlexDirectionExpr_Alt1{
			Value: &csspb.FlexDirectionExpr_Alt1_FlexDirectionProp{
				FlexDirectionProp: &csspb.FlexDirectionProp{
					Value: &csspb.FlexDirectionProp_RowKeyword{RowKeyword: &csspb.RowKeyword{}},
				},
			},
		},
		SemicolonKeyword: &csspb.SemicolonKeyword{},
	}
	got := mustRender(t, expr)
	if got != "flex-direction:row;" {
		t.Errorf("flex-direction: got %q want %q", got, "flex-direction:row;")
	}
}
