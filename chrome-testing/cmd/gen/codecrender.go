package main

import (
	"fmt"
	"os"
	"sort"
	"strings"

	svc "github.com/accretional/proto-css/service"
)

// codecrender.go — make the gluon codec the RENDERER OF RECORD for the CSS
// gallery. The gen still walks every property's value grammar; each walked
// declaration ("property: value") is round-tripped through the codec (Parse
// structures it into the shipped css AST, Render re-emits it) so the codec, not
// the gen, owns the CSS text. Mirrors proto-svg / proto-html. Parsing is done at
// the declaration-list level (not a full stylesheet rule) — lighter and, with the
// codec's packrat memo, tractable across the whole property set.

const declRoot = "css.DeclarationListType"

// codecDecl round-trips one "property: value" declaration through the css codec,
// returning the codec's canonical text. On any failure it returns the original
// declaration and false.
func codecDecl(prop, value string) (string, bool) {
	in := prop + ":" + value
	m, err := svc.ParseAs(in, declRoot)
	if err != nil {
		return prop + ": " + value, false
	}
	out, err := svc.Render(m)
	if err != nil {
		return prop + ": " + value, false
	}
	return strings.TrimSpace(out), true
}

// checkDecl round-trips a declaration and records a failure if the codec errors
// or rewrites the value. Returns the css text to show in the gallery: the codec's
// rendering on success, the raw declaration on failure.
func checkDecl(prop, value string) string {
	decl, ok := codecDecl(prop, value)
	if !ok {
		recordCodecFailure(prop, value, "error", "css codec did not round-trip the declaration")
		return prop + ": " + value + ";"
	}
	got := strings.TrimSpace(strings.TrimPrefix(decl, prop))
	got = strings.TrimSpace(strings.TrimPrefix(got, ":"))
	if squash(got) != squash(value) {
		recordCodecFailure(prop, value, "mismatch", fmt.Sprintf("value %q -> %q", value, got))
	}
	return decl + ";"
}

func squash(s string) string { return strings.Join(strings.Fields(s), " ") }

// ── per-declaration codec report ──────────────────────────────────────────────

type codecFailure struct{ prop, value, kind, detail string }

var codecFailures []codecFailure

func recordCodecFailure(prop, value, kind, detail string) {
	codecFailures = append(codecFailures, codecFailure{prop, value, kind, detail})
}

func codecReport(total int, outDir string) int {
	var b strings.Builder
	b.WriteString("property\tkind\tvalue\tdetail\n")
	for _, f := range codecFailures {
		fmt.Fprintf(&b, "%s\t%s\t%s\t%s\n", f.prop, f.kind, f.value, f.detail)
	}
	_ = os.WriteFile(outDir+"/_codec_failures.tsv", []byte(b.String()), 0o644)

	if len(codecFailures) == 0 {
		fmt.Printf("codec round-trip: all %d walked declarations render faithfully ✓\n", total)
		return 0
	}
	errs := 0
	for _, f := range codecFailures {
		if f.kind == "error" {
			errs++
		}
	}
	byProp := map[string]int{}
	var props []string
	for _, f := range codecFailures {
		if _, ok := byProp[f.prop]; !ok {
			props = append(props, f.prop)
		}
		byProp[f.prop]++
	}
	sort.Strings(props)
	fmt.Printf("\ncodec round-trip: %d/%d walked declarations FAILED (%d errors, %d mismatches):\n",
		len(codecFailures), total, errs, len(codecFailures)-errs)
	shown := 0
	for _, pr := range props {
		if shown >= 30 {
			fmt.Printf("  … and %d more properties\n", len(props)-shown)
			break
		}
		fmt.Printf("  %s (%d)\n", pr, byProp[pr])
		shown++
	}
	return len(codecFailures)
}
