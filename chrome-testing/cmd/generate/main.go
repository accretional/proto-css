// generate reads EBNF grammar files, parses them with gluon v2, extracts
// property expressions, generates CSS values by walking the grammar tree,
// and produces HTML pages in chrome-testing/generated/.
//
// For each property, if a hand-written template exists in chrome-testing/templates/,
// the generated page preserves its exact HTML structure — only the CSS property
// values are replaced with grammar-generated ones. Properties without a template
// get a generic fallback page.
//
// Run from the repo root:
//
//	go run ./chrome-testing/cmd/generate/
package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"text/template"

	metaparser "github.com/accretional/gluon/v2/metaparser"
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
// Template-cloning approach: read the hand-written template, find all places
// where the CSS property appears with a value, collect the distinct (old)
// values, generate the same number of new values from the grammar, then do
// a 1-to-1 replacement throughout the file.
// ---------------------------------------------------------------------------

// extractPropertyValues finds all distinct values for a CSS property in the
// HTML source. It matches patterns like:
//
//	property-name: value      (in labels, style blocks)
//	property-name: value;     (in declarations)
//
// Returns the unique values in order of first appearance.
func extractPropertyValues(html, prop string) []string {
	// Match "property: value" stopping at ; or } or " or < or newline.
	// The property name might appear with varied whitespace.
	pattern := regexp.QuoteMeta(prop) + `\s*:\s*([^;}"<\n]+)`
	re := regexp.MustCompile(pattern)
	matches := re.FindAllStringSubmatch(html, -1)

	seen := map[string]bool{}
	var vals []string
	for _, m := range matches {
		v := strings.TrimSpace(m[1])
		if v == "" || seen[v] {
			continue
		}
		seen[v] = true
		vals = append(vals, v)
	}
	return vals
}

// replacePropertyValues substitutes each old CSS value with a new one
// throughout the HTML. It replaces both the declaration form (with semicolons
// or line-end) and label form (plain text).
func replacePropertyValues(html, prop string, oldVals, newVals []string) string {
	for i, oldVal := range oldVals {
		if i >= len(newVals) {
			break
		}
		newVal := newVals[i]
		// Extract just the value part from the generated declaration.
		// GenN produces full declarations like "accent-color: auto;"
		// We want just the value part "auto" for substitution.
		justValue := extractValuePart(newVal, prop)

		// Replace all occurrences of the old value in declarations of this property.
		// Use a regex to only replace when preceded by "property:" to avoid
		// false matches in unrelated CSS.
		pattern := `(` + regexp.QuoteMeta(prop) + `\s*:\s*)` + regexp.QuoteMeta(oldVal)
		re := regexp.MustCompile(pattern)
		html = re.ReplaceAllString(html, "${1}"+escapeReplacement(justValue))
	}
	return html
}

// extractValuePart extracts the value from a full CSS declaration.
// "accent-color: auto;" → "auto"
// "accent-color: rgb(255, 0, 0) ! important;" → "rgb(255, 0, 0) ! important"
func extractValuePart(decl, prop string) string {
	// Try to extract after "property:"
	idx := strings.Index(strings.ToLower(decl), strings.ToLower(prop)+":")
	if idx >= 0 {
		val := decl[idx+len(prop)+1:]
		val = strings.TrimSpace(val)
		val = strings.TrimSuffix(val, ";")
		val = strings.TrimSpace(val)
		return val
	}
	// If the declaration doesn't contain the property name, return as-is
	// minus trailing semicolon.
	return strings.TrimSuffix(strings.TrimSpace(decl), ";")
}

// escapeReplacement escapes $ signs in replacement strings for regexp.
func escapeReplacement(s string) string {
	return strings.ReplaceAll(s, "$", "$$")
}

// generateFromTemplate reads a hand-written template, generates new CSS values,
// and writes the result with values swapped.
func generateFromTemplate(tmplPath, outPath, prop string, grammar *Grammar, exprType string) error {
	data, err := os.ReadFile(tmplPath)
	if err != nil {
		return err
	}
	html := string(data)

	// Find existing CSS values for this property in the template.
	oldVals := extractPropertyValues(html, prop)
	if len(oldVals) == 0 {
		// No values found — just copy the template as-is.
		return os.WriteFile(outPath, data, 0644)
	}

	// Generate the same number of new values from the grammar.
	newVals := grammar.GenN(exprType, len(oldVals))
	if len(newVals) == 0 {
		// Generation failed — copy as-is.
		return os.WriteFile(outPath, data, 0644)
	}

	// Replace old values with new ones throughout the HTML.
	html = replacePropertyValues(html, prop, oldVals, newVals)

	return os.WriteFile(outPath, []byte(html), 0644)
}

// ---------------------------------------------------------------------------
// Fallback generic template for properties without a hand-written template.
// ---------------------------------------------------------------------------

type propEntry struct {
	Name    string
	Values  []string
	Demo    string
	Context string
}

type pageData struct {
	Title string
	Props []propEntry
}

func defaultDemoType(kebab string) (demoType string, context string) {
	for _, prefix := range []string{
		"font-", "text-", "letter-", "word-", "line-", "white-space", "writing-",
		"direction", "unicode-", "vertical-", "hyphens", "hanging-", "ruby-",
		"dominant-", "alignment-", "baseline-", "quotes", "list-style", "math-",
		"speak-", "initial-letter", "tab-size",
	} {
		if strings.HasPrefix(kebab, prefix) || kebab == prefix {
			return "text", "background: darkslateblue; color: white;"
		}
	}
	for _, name := range []string{
		"flex-direction", "flex-wrap", "flex-flow", "align-content", "align-items",
		"align-self", "justify-content", "justify-items", "justify-self",
		"place-content", "place-items", "place-self", "order",
		"box-align", "box-direction", "box-orient", "box-pack",
	} {
		if kebab == name {
			return "flex", "gap: 4px;"
		}
	}
	if strings.HasPrefix(kebab, "grid-") {
		return "grid", "gap: 4px;"
	}
	if strings.HasPrefix(kebab, "margin") && kebab != "margin-trim" {
		return "margin", "background: cornflowerblue; width: 40px; height: 40px; border-radius: 4px;"
	}
	if strings.HasPrefix(kebab, "padding") {
		return "box", "background: cornflowerblue;"
	}
	if kebab == "gap" || kebab == "row-gap" || kebab == "column-gap" {
		return "flex", "flex-direction: row;"
	}
	return "box", "background: cornflowerblue;"
}

const fallbackTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{.Title}}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #1a1a2e; color: #e0e0e0;
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    padding: 24px 32px;
  }
  h1 { font-size: 28px; font-weight: 700; margin-bottom: 6px; color: #fff; }
  .subtitle { font-size: 12px; color: #8888aa; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .card {
    background: #16213e; border-radius: 10px; padding: 12px;
    border: 1px solid #2a2a4a;
  }
  .demo-frame { width: 100%; height: 64px; border-radius: 6px; margin-bottom: 8px; overflow: hidden; }
  .demo-frame.tall { height: 80px; }
  .prop { font-size: 10px; color: #8888aa; margin-bottom: 2px; }
  .value {
    font-size: 10px; color: #64b5f6;
    font-family: "SF Mono", "Fira Code", monospace;
    word-break: break-all;
  }
</style>
</head>
<body>
<h1>{{.Title}}</h1>
<p class="subtitle">Generated from EBNF grammar (no template)</p>

{{range $spec := .Props}}
<div style="margin-bottom: 24px;">
  <div class="grid">
    {{- range $i, $v := $spec.Values}}
    <div class="card">
      {{- if or (eq $spec.Demo "flex") (eq $spec.Demo "grid")}}
      <div class="demo-frame tall">
      {{- else}}
      <div class="demo-frame">
      {{- end}}
        <iframe data-type="{{$spec.Demo}}" data-ctx="{{$spec.Context}}" data-val="{{$v}}" style="border:none;display:block;width:100%;height:100%;"></iframe>
      </div>
      <div class="prop">{{$spec.Name}}</div>
      <div class="value">{{$v}}</div>
    </div>
    {{- end}}
  </div>
</div>
{{end}}

<script>
(function () {
  var FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  var BASE = '* { box-sizing: border-box; margin: 0; padding: 0; } html, body { width: 100%; height: 100%; overflow: hidden; }';
  function srcdoc(type, ctx, val) {
    if (type === 'text') {
      return '<!DOCTYPE html><html><head><style>' + BASE +
        ' body { display:flex;align-items:center;justify-content:center;' +
        'padding:8px;font-family:' + FONT + ';font-size:13px;line-height:1.4;' +
        'text-align:center;word-break:break-word;' + ctx + ' ' + val +
        '}</style></head><body>The quick brown fox jumps over the lazy dog.</body></html>';
    }
    if (type === 'flex') {
      return '<!DOCTYPE html><html><head><style>' + BASE +
        ' body{background:darkslategray;padding:6px;display:flex;' + ctx + ' ' + val + '}' +
        '.item{background:cornflowerblue;border-radius:3px;width:28px;height:28px;flex-shrink:0}' +
        '</style></head><body>' +
        '<div class="item"></div><div class="item" style="height:18px"></div><div class="item" style="height:36px"></div>' +
        '</body></html>';
    }
    if (type === 'grid') {
      return '<!DOCTYPE html><html><head><style>' + BASE +
        ' body{background:darkslategray;padding:6px;display:grid;' + ctx + ' ' + val + '}' +
        '.gi{background:cornflowerblue;border-radius:3px;min-height:18px}' +
        '</style></head><body>' +
        '<div class="gi"></div><div class="gi"></div><div class="gi"></div>' +
        '<div class="gi"></div><div class="gi"></div><div class="gi"></div>' +
        '</body></html>';
    }
    if (type === 'margin') {
      return '<!DOCTYPE html><html><head><style>' + BASE +
        ' body{background:darkslategray}</style></head><body>' +
        '<div style="' + val + ';' + ctx + '"></div></body></html>';
    }
    return '<!DOCTYPE html><html><head><style>' + BASE +
      '</style></head><body><div style="width:100%;height:100%;' + ctx + ' ' + val + '"></div></body></html>';
  }
  document.querySelectorAll('iframe[data-val]').forEach(function(f,i){
    f.srcdoc=srcdoc(f.getAttribute('data-type')||'box',f.getAttribute('data-ctx')||'',f.getAttribute('data-val')||'');
  });
}());
</script>
</body>
</html>`

func main() {
	start := flag.Int("start", 0, "index of first property to process")
	count := flag.Int("count", 0, "number of properties (0 = all)")
	langDir := flag.String("lang", "lang", "directory containing .ebnf files")
	tmplDir := flag.String("templates", "chrome-testing/html/template", "directory containing hand-written HTML templates")
	outDir := flag.String("out", "chrome-testing/html/generated", "output directory for generated HTML")
	flag.Parse()

	// 1. Load and parse EBNF grammar.
	fmt.Println("Loading EBNF grammar...")
	grammar := loadGrammar(*langDir)

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

	// 5. Parse fallback template for properties without a hand-written template.
	fbTmpl, err := template.New("fallback").Parse(fallbackTemplate)
	if err != nil {
		panic(fmt.Sprintf("parse fallback template: %v", err))
	}

	// 6. Generate HTML for each property.
	generated, cloned, fallback := 0, 0, 0
	for _, typeName := range props {
		kebab := exprToKebab(typeName)
		outFile := filepath.Join(*outDir, kebab+".html")

		// Check for hand-written template.
		tmplFile := filepath.Join(*tmplDir, kebab+".html")
		if _, err := os.Stat(tmplFile); err == nil {
			// Template exists — clone its structure with generated values.
			if err := generateFromTemplate(tmplFile, outFile, kebab, grammar, typeName); err != nil {
				fmt.Printf("  error %s: %v\n", kebab, err)
				continue
			}
			cloned++
			generated++
			continue
		}

		// No template — use fallback.
		demo, ctx := defaultDemoType(kebab)
		vals := grammar.GenN(typeName, 8)
		if len(vals) == 0 {
			fmt.Printf("  skip %s (no values generated)\n", typeName)
			continue
		}
		for i, v := range vals {
			vals[i] = strings.ReplaceAll(v, `"`, `&quot;`)
		}

		data := pageData{
			Title: kebab,
			Props: []propEntry{{
				Name:    kebab,
				Values:  vals,
				Demo:    demo,
				Context: ctx,
			}},
		}
		f, err := os.Create(outFile)
		if err != nil {
			panic(err)
		}
		if err := fbTmpl.Execute(f, data); err != nil {
			f.Close()
			panic(fmt.Sprintf("execute %s: %v", kebab, err))
		}
		f.Close()
		fallback++
		generated++
	}

	fmt.Printf("\nGenerated %d HTML pages (%d cloned from templates, %d fallback) in %s\n",
		generated, cloned, fallback, *outDir)
}
