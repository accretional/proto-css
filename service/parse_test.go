package service

import "testing"

// Parse the structured CSS that Render emits and render it back; the second
// rendering must equal the first (round-trip through the typed CssStyleSheet).
func TestParse_RoundTripDeclaration(t *testing.T) {
	const css = ".box{flex-direction:row;}"
	sheet, err := Parse(css)
	if err != nil {
		t.Fatalf("Parse(%q): %v", css, err)
	}
	got, err := Render(sheet)
	if err != nil {
		t.Fatalf("Render: %v", err)
	}
	if got != css {
		t.Errorf("round-trip: got %q want %q", got, css)
	}
}
