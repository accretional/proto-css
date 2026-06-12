package service

import "testing"

// TestBattery_Declarations probes how much real-world declaration syntax the
// reflection parser+renderer round-trips, parsed as a single css.Property (the
// oneof auto-selects the property's Expr by its leading keyword). Informational:
// it logs pass/fail per case so we can see the demo builder's safe surface.
func TestBattery_Declarations(t *testing.T) {
	cases := []string{
		"display:flex;",
		"flex-direction:column;",
		"justify-content:space-between;",
		"align-items:center;",
		"text-align:center;",
		"font-weight:700;",
		"color:#1a1a2e;",
		"background-color:#667eea;",
		"width:100%;",
		"max-width:1200px;",
		"padding:80px 40px;",
		"margin:0 auto;",
		"border-radius:12px;",
		"gap:24px;",
		"font-size:18px;",
		"line-height:1.6;",
		"opacity:0.9;",
		"letter-spacing:-0.02em;",
		"box-shadow:0 10px 30px #00000033;",
		"background:linear-gradient(135deg,#667eea,#764ba2);",
		"transition:all 0.3s ease;",
		"text-transform:uppercase;",
		"position:absolute;",
		"cursor:pointer;",
		"backdrop-filter:blur(10px);",
		"transform:translateY(-4px);",
	}
	pass := 0
	for _, c := range cases {
		msg, err := ParseAs(c, "css.Property")
		if err != nil {
			t.Logf("PARSE-FAIL %-50q %v", c, err)
			continue
		}
		got, err := Render(msg)
		if err != nil {
			t.Logf("RENDER-FAIL %-48q %v", c, err)
			continue
		}
		if got != c {
			t.Logf("DIFF        %-48q -> %q", c, got)
			continue
		}
		pass++
	}
	t.Logf("round-trip OK: %d/%d", pass, len(cases))
}
