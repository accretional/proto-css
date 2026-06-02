// generate reads EBNF grammar files and textproto blueprint files, generates
// exhaustive CSS values by walking the grammar tree, and produces HTML pages
// in chrome-testing/html/generated/.
//
// For each property, if a blueprint exists in chrome-testing/blueprints/,
// the generator stamps out N demo cards (one per grammar-derived value) using
// the blueprint's demo structure. Properties without a blueprint get a generic
// fallback page.
//
// Run from the repo root:
//
//	go run ./chrome-testing/cmd/generate/
package main

import (
	"flag"
	"fmt"
	"html"
	"os"
	"path/filepath"
	"sort"
	"strings"

	bppb "github.com/accretional/proto-css/chrome-testing/proto"
	metaparser "github.com/accretional/gluon/v2/metaparser"
	"google.golang.org/protobuf/encoding/prototext"
)

var ebnfFiles = []string{
	"css.ebnf", "symbol.ebnf", "primitive.ebnf", "keyword.ebnf",
	"combinator.ebnf", "datatype.ebnf", "functions.ebnf",
	"pseudo-class.ebnf", "pseudo-element.ebnf", "selector.ebnf",
	"property.ebnf", "atrule.ebnf",
}

func loadGrammar(langDir string) *Grammar {
	var sb strings.Builder
	for _, name := range ebnfFiles {
		data, err := os.ReadFile(filepath.Join(langDir, name))
		if err != nil {
			panic(fmt.Sprintf("read %s: %v", name, err))
		}
		sb.Write(data)
		sb.WriteByte('\n')
	}
	doc := metaparser.WrapString(sb.String())
	doc.Name = "css"
	gd, err := metaparser.ParseEBNF(doc)
	if err != nil {
		panic(fmt.Sprintf("ParseEBNF: %v", err))
	}
	fmt.Printf("Parsed %d grammar rules\n", len(gd.GetRules()))
	return NewGrammar(gd)
}

// ---------------------------------------------------------------------------
// Blueprint loading
// ---------------------------------------------------------------------------

func loadBlueprint(path string) (*bppb.TemplateBlueprint, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	bp := &bppb.TemplateBlueprint{}
	if err := prototext.Unmarshal(data, bp); err != nil {
		return nil, fmt.Errorf("parse %s: %w", path, err)
	}
	return bp, nil
}

// ---------------------------------------------------------------------------
// Grid column calculation
// ---------------------------------------------------------------------------

func gridColumns(n int) int {
	switch {
	case n <= 3:
		return 2
	case n <= 6:
		return 3
	case n <= 12:
		return 4
	case n <= 20:
		return 5
	default:
		return 6
	}
}

// ---------------------------------------------------------------------------
// Blueprint-based HTML generation
// ---------------------------------------------------------------------------

func generateFromBlueprint(bp *bppb.TemplateBlueprint, outPath, prop string, values []string) error {
	maxVals := int(bp.GetMaxValues())
	if maxVals <= 0 {
		maxVals = 36
	}
	if len(values) > maxVals {
		values = values[:maxVals]
	}

	cols := gridColumns(len(values))
	tag := bp.GetTargetTag()
	if tag == "" {
		tag = "div"
	}

	var sb strings.Builder

	// Page header.
	sb.WriteString(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>`)
	sb.WriteString(html.EscapeString(prop))
	sb.WriteString(`</title>
<style>
`)

	// Extract @import rules from extra_css and place them first (CSS spec requirement).
	extraCSS := bp.GetExtraCss()
	var importLines, otherCSS []string
	if extraCSS != "" {
		for _, line := range strings.Split(extraCSS, "\n") {
			trimmed := strings.TrimSpace(line)
			if strings.HasPrefix(trimmed, "@import ") {
				importLines = append(importLines, trimmed)
			} else if trimmed != "" {
				otherCSS = append(otherCSS, line)
			}
		}
	}
	for _, imp := range importLines {
		sb.WriteString("  ")
		sb.WriteString(imp)
		sb.WriteByte('\n')
	}

	sb.WriteString(`  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #1a1a2e; color: #e0e0e0; font-family: system-ui, sans-serif; padding: 32px; }
  h1 { font-size: 22px; color: #fff; margin-bottom: 4px; }
  .prop-name { font-size: 14px; color: #7b8794; font-family: monospace; margin-bottom: 24px; }
  .demos { display: grid; grid-template-columns: repeat(`)
	sb.WriteString(fmt.Sprintf("%d", cols))
	sb.WriteString(`, 1fr); gap: 20px; }
  .demo-box { background: #16213e; border-radius: 10px; padding: 16px; }
  .demo-area { width: 100%; }
  .label { font-size: 11px; font-family: monospace; color: #9ca3af; margin-top: 8px; word-break: break-all; }
`)

	// Remaining extra CSS (non-import rules) from blueprint.
	if len(otherCSS) > 0 {
		sb.WriteString("  ")
		sb.WriteString(strings.Join(otherCSS, "\n"))
		sb.WriteByte('\n')
	}

	sb.WriteString(`</style>
</head>
<body>
<h1>`)
	title := bp.GetTitle()
	if title == "" {
		title = prop
	}
	sb.WriteString(html.EscapeString(title))
	sb.WriteString(`</h1>
<p class="prop-name">`)
	sb.WriteString(html.EscapeString(prop))
	sb.WriteString(`</p>
<div class="demos">
`)

	// Determine the CSS property name to emit (allow vendor-prefix override).
	cssProp := prop
	if override := bp.GetPropertyNameOverride(); override != "" {
		cssProp = override
	}

	// Check if property should be applied via a selector instead of inline.
	targetSelector := bp.GetPropertyTargetSelector()

	// expandIndex replaces {{INDEX}} placeholders with the card number,
	// allowing blueprints to use unique SVG IDs per card.
	expandIndex := func(s string, idx int) string {
		return strings.ReplaceAll(s, "{{INDEX}}", fmt.Sprintf("%d", idx))
	}

	// Stamp out one card per value.
	for i, val := range values {
		sb.WriteString(`  <div class="demo-box">
`)
		// Demo area wrapper.
		wrapStyle := bp.GetWrapperStyle()
		if wrapStyle != "" {
			sb.WriteString(fmt.Sprintf(`    <div class="demo-area" style="%s">`, html.EscapeString(wrapStyle)))
		} else {
			sb.WriteString(`    <div class="demo-area">`)
		}
		sb.WriteByte('\n')

		// Per-card <style> block when property_target_selector is set.
		if targetSelector != "" {
			targetID := fmt.Sprintf("t%d", i)
			// Pseudo-elements/classes (starting with :) attach directly;
			// other selectors (child combinator, class, etc.) need a space.
			sep := " "
			if strings.HasPrefix(targetSelector, ":") {
				sep = ""
			}
			sb.WriteString(fmt.Sprintf("      <style>#%s%s%s { %s: %s; }</style>\n",
				targetID, sep, targetSelector, cssProp, val))
		}

		// Siblings before.
		for _, sib := range bp.GetSiblingsBefore() {
			sb.WriteString("      ")
			sb.WriteString(expandIndex(sib, i))
			sb.WriteByte('\n')
		}

		// Target element with inline style.
		baseStyle := bp.GetTargetBaseStyle()
		var fullStyle string
		if targetSelector != "" {
			// Property goes in the <style> block, not inline.
			fullStyle = strings.TrimSpace(baseStyle)
		} else {
			fullStyle = buildInlineStyle(baseStyle, cssProp, val)
		}

		if targetSelector != "" {
			targetID := fmt.Sprintf("t%d", i)
			sb.WriteString(fmt.Sprintf("      <%s id=\"%s\" style=\"%s\">",
				tag, targetID, html.EscapeString(fullStyle)))
		} else {
			sb.WriteString(fmt.Sprintf("      <%s style=\"%s\">", tag, html.EscapeString(fullStyle)))
		}

		// Inner HTML or child elements.
		if inner := bp.GetTargetInnerHtml(); inner != "" {
			sb.WriteString(expandIndex(inner, i))
		}
		for _, child := range bp.GetChildElements() {
			sb.WriteString(child)
		}

		sb.WriteString(fmt.Sprintf("</%s>\n", tag))

		// Siblings after.
		for _, sib := range bp.GetSiblingsAfter() {
			sb.WriteString("      ")
			sb.WriteString(expandIndex(sib, i))
			sb.WriteByte('\n')
		}

		sb.WriteString("    </div>\n")

		// Label.
		sb.WriteString(fmt.Sprintf("    <div class=\"label\">%s: %s</div>\n",
			html.EscapeString(prop), html.EscapeString(val)))
		sb.WriteString("  </div>\n")
	}

	sb.WriteString(`</div>
</body>
</html>
`)

	return os.WriteFile(outPath, []byte(sb.String()), 0644)
}

// buildInlineStyle combines the base style with the tested property: value.
func buildInlineStyle(baseStyle, prop, value string) string {
	base := strings.TrimSpace(baseStyle)
	if base != "" && !strings.HasSuffix(base, ";") {
		base += ";"
	}
	return fmt.Sprintf("%s %s: %s;", base, prop, value)
}

// ---------------------------------------------------------------------------
// Fallback for properties without a blueprint (kept for backward compat)
// ---------------------------------------------------------------------------

func generateFallback(outPath, prop, title string, values []string) error {
	cols := gridColumns(len(values))

	var sb strings.Builder
	sb.WriteString(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>`)
	sb.WriteString(html.EscapeString(prop))
	sb.WriteString(`</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #1a1a2e; color: #e0e0e0; font-family: system-ui, sans-serif; padding: 32px; }
  h1 { font-size: 22px; color: #fff; margin-bottom: 4px; }
  .prop-name { font-size: 14px; color: #7b8794; font-family: monospace; margin-bottom: 24px; }
  .demos { display: grid; grid-template-columns: repeat(`)
	sb.WriteString(fmt.Sprintf("%d", cols))
	sb.WriteString(`, 1fr); gap: 20px; }
  .demo-box { background: #16213e; border-radius: 10px; padding: 16px; }
  .target { width: 100%; height: 80px; background: cornflowerblue; border-radius: 6px; }
  .label { font-size: 11px; font-family: monospace; color: #9ca3af; margin-top: 8px; word-break: break-all; }
</style>
</head>
<body>
<h1>`)
	sb.WriteString(html.EscapeString(title))
	sb.WriteString(`</h1>
<p class="prop-name">`)
	sb.WriteString(html.EscapeString(prop))
	sb.WriteString(`</p>
<div class="demos">
`)

	for _, val := range values {
		sb.WriteString(fmt.Sprintf(`  <div class="demo-box">
    <div class="target" style="%s: %s;"></div>
    <div class="label">%s: %s</div>
  </div>
`, html.EscapeString(prop), html.EscapeString(val),
			html.EscapeString(prop), html.EscapeString(val)))
	}

	sb.WriteString(`</div>
</body>
</html>
`)
	return os.WriteFile(outPath, []byte(sb.String()), 0644)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

func main() {
	start := flag.Int("start", 0, "index of first property to process")
	count := flag.Int("count", 0, "number of properties (0 = all)")
	langDir := flag.String("lang", "lang", "directory containing .ebnf files")
	bpDir := flag.String("blueprints", "chrome-testing/textproto/blueprints", "directory containing .textproto blueprints")
	outDir := flag.String("out", "chrome-testing/html/generated", "output directory for generated HTML")
	repValsFile := flag.String("repvals", "chrome-testing/textproto/representative_values.textproto", "representative values textproto file")
	maxVals := flag.Int("max", 36, "default max values per property")
	flag.Parse()

	// 1. Load and parse EBNF grammar.
	fmt.Println("Loading EBNF grammar...")
	grammar := loadGrammar(*langDir)

	// 1b. Load representative values.
	if err := grammar.LoadRepresentativeValues(*repValsFile); err != nil {
		panic(err)
	}

	// 2. Extract property expression names.
	allProps := grammar.PropertyExprs()
	fmt.Printf("Found %d property expressions\n", len(allProps))

	// 3. Apply batch slicing.
	props := allProps
	if *start > 0 && *start < len(allProps) {
		props = props[*start:]
	}
	if *count > 0 && *count < len(props) {
		props = props[:*count]
	}
	fmt.Printf("Processing %d properties (start=%d, count=%d)\n", len(props), *start, *count)

	// 4. Prepare output directory.
	if err := os.MkdirAll(*outDir, 0755); err != nil {
		panic(err)
	}

	// 5. Generate HTML for each property.
	generated, withBlueprint, fallback := 0, 0, 0
	modes := make(map[string]string) // property → screenshot mode
	for _, typeName := range props {
		kebab := exprToKebab(typeName)
		outFile := filepath.Join(*outDir, kebab+".html")

		// Find the Prop rule name: strip "Expr" suffix, add "Prop".
		propRuleName := strings.TrimSuffix(typeName, "Expr") + "Prop"

		// Generate exhaustive values from the grammar.
		vals := grammar.GenAll(propRuleName, *maxVals, kebab)
		if len(vals) == 0 {
			// Fallback to GenN random sampling.
			vals = grammar.GenN(typeName, 8)
		}
		if len(vals) == 0 {
			fmt.Printf("  skip %s (no values generated)\n", kebab)
			continue
		}

		// Extract just the value part from each generated declaration.
		for i, v := range vals {
			vals[i] = extractValuePart(v, kebab)
		}

		// Check for blueprint.
		bpFile := filepath.Join(*bpDir, kebab+".textproto")
		if bp, err := loadBlueprint(bpFile); err == nil {
			if err := generateFromBlueprint(bp, outFile, kebab, vals); err != nil {
				fmt.Printf("  error %s: %v\n", kebab, err)
				continue
			}
			if m := bp.GetScreenshotTextproto(); m != "" {
				modes[kebab] = m
			} else {
				modes[kebab] = "static"
			}
			withBlueprint++
		} else {
			// No blueprint — use fallback.
			title := kebab
			if err := generateFallback(outFile, kebab, title, vals); err != nil {
				fmt.Printf("  error %s: %v\n", kebab, err)
				continue
			}
			modes[kebab] = "static"
			fallback++
		}
		generated++
	}

	// 6. Write screenshot modes manifest.
	manifestPath := filepath.Join(*outDir, "screenshot_modes.txt")
	if err := writeManifest(modes, manifestPath); err != nil {
		fmt.Printf("WARNING: could not write manifest: %v\n", err)
	} else {
		fmt.Printf("Wrote screenshot modes manifest: %s (%d entries)\n", manifestPath, len(modes))
	}

	fmt.Printf("\nGenerated %d HTML pages (%d from blueprints, %d fallback) in %s\n",
		generated, withBlueprint, fallback, *outDir)
}

// writeManifest writes a property→mode mapping file (tab-separated).
func writeManifest(modes map[string]string, path string) error {
	// Collect and sort keys for deterministic output.
	keys := make([]string, 0, len(modes))
	for k := range modes {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var sb strings.Builder
	for _, k := range keys {
		sb.WriteString(k)
		sb.WriteByte('\t')
		sb.WriteString(modes[k])
		sb.WriteByte('\n')
	}
	return os.WriteFile(path, []byte(sb.String()), 0644)
}

// extractValuePart extracts the value from a full CSS declaration.
// "accent-color: auto;" → "auto"
func extractValuePart(decl, prop string) string {
	idx := strings.Index(strings.ToLower(decl), strings.ToLower(prop)+":")
	if idx >= 0 {
		val := decl[idx+len(prop)+1:]
		val = strings.TrimSpace(val)
		val = strings.TrimSuffix(val, ";")
		val = strings.TrimSpace(val)
		return val
	}
	return strings.TrimSuffix(strings.TrimSpace(decl), ";")
}
