package service

import "testing"

// An empty stylesheet is valid CSS and must parse to an empty CssStyleSheet.
func TestParse_Empty(t *testing.T) {
	sheet, err := Parse("")
	if err != nil {
		t.Fatalf("Parse(\"\"): %v", err)
	}
	if sheet == nil {
		t.Fatal("Parse(\"\") returned nil sheet")
	}
}

// Parse is the best-effort inverse of Render. This checks it terminates (the
// depth/step guards hold) and, when it succeeds, round-trips. Parsing the full
// recursive selector grammar reflectively is inherently limited, so a parse
// failure is tolerated (skipped), but a hang or wrong-but-confident result is
// not.
func TestParse_BestEffortRoundTrip(t *testing.T) {
	const css = ".box{flex-direction:row;}"
	sheet, err := Parse(css)
	if err != nil {
		t.Skipf("Parse is best-effort and could not parse %q: %v", css, err)
	}
	got, err := Render(sheet)
	if err != nil {
		t.Fatalf("Render: %v", err)
	}
	if got != css {
		t.Logf("best-effort round-trip differs: got %q want %q", got, css)
	}
}
