// shoot reads generated/values.json and emits chromerpc AutomationSequence
// textproto chunks that screenshot:
//
//	screenshots/index.png            — the home page
//	screenshots/<property>/NN-<value>.png  — one shot per value of every property
//
// Each value is selected by clicking its hidden #codex-anchors toggle, so the
// capture works regardless of a demo's control style. Output is chunked so each
// RunAutomation response (which carries the screenshot bytes) stays < 4MB.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

func main() {
	values := flag.String("values", "chrome-testing-2.0/generated/values.json", "values.json path")
	manifest := flag.String("manifest", "chrome-testing-2.0/generated/manifest.tsv", "manifest path (for family ids)")
	base := flag.String("base", "", "gallery entry URL")
	outdir := flag.String("outdir", "", "absolute screenshots output dir")
	seq := flag.String("seq", "", "output textproto path prefix")
	settle := flag.Int("settle", 2600, "ms after initial load")
	navWait := flag.Int("navwait", 240, "ms after a hash change / embed navigation")
	frameWait := flag.Int("framewait", 150, "ms between frames of a temporal capture")
	perChunk := flag.Int("chunk", 20, "screenshots per chunk")
	only := flag.String("only", "", "comma-separated property names to limit to")
	flag.Parse()
	if *base == "" || *outdir == "" || *seq == "" {
		fmt.Fprintln(os.Stderr, "usage: shoot -base URL -outdir DIR -seq PREFIX")
		os.Exit(2)
	}

	fam := familyMap(*manifest)
	valsByName := map[string][]string{}
	raw, err := os.ReadFile(*values)
	if err != nil {
		panic(err)
	}
	if err := json.Unmarshal(raw, &valsByName); err != nil {
		panic(err)
	}

	limit := map[string]bool{}
	for _, n := range strings.Split(*only, ",") {
		if n = strings.TrimSpace(n); n != "" {
			limit[n] = true
		}
	}

	names := make([]string, 0, len(valsByName))
	for n := range valsByName {
		if len(limit) > 0 && !limit[n] {
			continue
		}
		names = append(names, n)
	}
	// stable order
	sortStrings(names)

	prefix := strings.TrimSuffix(*seq, filepath.Ext(*seq))
	w := &chunkWriter{navWait: *navWait, frameWait: *frameWait, prefix: prefix, perChunk: *perChunk}
	_ = settle
	w.start()

	// index page first (full page; the SPA is pre-loaded by shoot.sh's warmup).
	w.shot("location.hash='#/';void 0", filepath.Join(*outdir, "index.png"), true)

	shots, temporal := 0, 0
	for _, name := range names {
		vals := valsByName[name]
		f := fam[name]
		if f == "" || len(vals) == 0 {
			continue
		}
		mode := captureMode(name)
		dir := filepath.Join(*outdir, name)
		if err := os.MkdirAll(dir, 0o755); err != nil {
			panic(err)
		}
		for i, v := range vals {
			embed := fmt.Sprintf("location.hash='#/embed/%s/%s/%d';void 0", f, name, i)
			tag := fmt.Sprintf("%02d-%s", i, sanitize(v))
			if mode == "" {
				w.shot(embed, filepath.Join(dir, tag+".png"), false)
				shots++
			} else if mode == "print" {
				// printed to PDF (print media); shoot.sh rasterises it to <tag>.png
				w.printPdf(embed, filepath.Join(dir, tag+".pdf"))
				shots++
			} else {
				// temporal: capture a short frame sequence into a per-value folder
				framedir := filepath.Join(dir, tag)
				if err := os.MkdirAll(framedir, 0o755); err != nil {
					panic(err)
				}
				w.frames(embed, framedir, mode)
				shots += frameCount(mode)
				temporal++
			}
		}
	}
	w.flush()
	fmt.Printf("Wrote %d chunks (%s-NNN.textproto) — index + %d screenshots (%d temporal frame-sets)\n",
		w.nChunks, prefix, shots, temporal)
}

// captureMode returns the temporal capture mode for a property, or "" (single
// frame). Mirrors the live-demo behaviour classification in gallery/live.jsx.
func captureMode(name string) string {
	switch {
	case name == "animation-fill-mode" || name == "animation-iteration-count" || name == "animation-composition":
		return "settle" // capture after the run completes so the held/stopped state shows
	case strings.HasPrefix(name, "animation"):
		return "anim"
	case strings.HasPrefix(name, "transition"):
		return "transition"
	case name == "page" || hasAnyPrefix(name, "page-break", "break-") || name == "orphans" || name == "widows":
		return "print" // print the document to PDF so page-boundary behaviour shows
	case name == "scroll-behavior" || hasAnyPrefix(name, "scroll-snap", "scroll-padding", "scroll-margin", "overflow", "overscroll", "scrollbar"):
		return "scroll"
	case name == "pointer-events":
		return "click"
	case name == "user-select" || name == "user-modify":
		return "select" // programmatically select the demo text → before/after
	case name == "touch-action":
		return "touch" // pan the scroll container with a touch gesture → before/after
	case strings.HasPrefix(name, "caret"):
		return "focus" // focus the editable element so the (steady) caret shows
	default:
		return ""
	}
}

func frameCount(mode string) int {
	switch mode {
	case "click", "select", "focus", "settle", "touch":
		return 2
	default:
		return 4
	}
}

func hasAnyPrefix(s string, prefixes ...string) bool {
	for _, p := range prefixes {
		if strings.HasPrefix(s, p) {
			return true
		}
	}
	return false
}

// chunkWriter emits steps into capped textproto chunks. The SPA is navigated
// once by shoot.sh (and re-warmed after a browser restart); chunks only set the
// embed hash per value and screenshot — no per-chunk reload, no clicking.
type chunkWriter struct {
	prefix             string
	navWait, frameWait int
	perChunk           int
	b                  strings.Builder
	shots, nChunks     int
}

func (w *chunkWriter) start() {
	w.b.Reset()
	fmt.Fprintf(&w.b, "name: \"codex-shots-%03d\"\n", w.nChunks)
	// embed view is framed at ~976x600 + 22px padding -> 1024x656 viewport.
	fmt.Fprintf(&w.b, "steps { set_viewport { width: 1024 height: 656 device_scale_factor: 1 } }\n")
}
func (w *chunkWriter) line(s string) { w.b.WriteString(s); w.b.WriteByte('\n') }
func (w *chunkWriter) rollover() {
	path := fmt.Sprintf("%s-%03d.textproto", w.prefix, w.nChunks)
	if err := os.WriteFile(path, []byte(w.b.String()), 0o644); err != nil {
		panic(err)
	}
	w.nChunks++
	w.shots = 0
	w.start()
}

// shot navigates (evaluate_script) and captures one screenshot. fullPage uses a
// full-page capture (for the index); otherwise a viewport-sized embed frame.
func (w *chunkWriter) shot(expr, out string, fullPage bool) {
	if w.shots >= w.perChunk {
		w.rollover()
	}
	w.line(fmt.Sprintf("steps { evaluate_script { expression: %q } }", expr))
	w.line(fmt.Sprintf("steps { wait { milliseconds: %d } }", w.navWait))
	if fullPage {
		w.line(fmt.Sprintf("steps { full_page_screenshot { output_path: %q format: \"png\" } }", out))
	} else {
		w.line(fmt.Sprintf("steps { screenshot { output_path: %q format: \"png\" } }", out))
	}
	w.shots++
}

// printPdf navigates to the embed view, switches to print media, and renders the
// page to a PDF on disk. shoot.sh later rasterises (and stacks) the PDF pages into
// <out-without-.pdf>.png. Used for paged-media props whose behaviour only exists
// across page boundaries (page / page-break-* / break-* / orphans / widows).
func (w *chunkWriter) printPdf(embed, out string) {
	if w.shots > 0 && w.shots+1 > w.perChunk {
		w.rollover()
	}
	w.line(fmt.Sprintf("steps { evaluate_script { expression: %q } }", embed))
	w.line(fmt.Sprintf("steps { wait { milliseconds: %d } }", w.navWait))
	w.line(`steps { set_emulated_media { media: "print" } }`)
	w.line("steps { wait { milliseconds: 160 } }")
	w.line(fmt.Sprintf("steps { print_to_pdf { output_path: %q print_background: true prefer_css_page_size: true } }", out))
	w.line(`steps { set_emulated_media { media: "screen" } }`)
	w.shots++
}

// frames captures a short sequence into framedir (frame-00.png …). For
// transition/scroll it fires the demo's trigger first; for click it captures
// before/after the click. The whole sequence is kept in one chunk so the
// browser state (running animation / triggered transition) is preserved.
func (w *chunkWriter) frames(embed, framedir, mode string) {
	const trig = "var t=document.querySelector('[data-codex-trigger]'); if(t) t.click(); void 0"
	n := frameCount(mode)
	if w.shots > 0 && w.shots+n+3 > w.perChunk {
		w.rollover()
	}
	w.line(fmt.Sprintf("steps { evaluate_script { expression: %q } }", embed))
	w.line(fmt.Sprintf("steps { wait { milliseconds: %d } }", w.navWait))
	// JS recipes run with evaluate_script — no extra proto steps needed.
	const selectJS = "var el=document.querySelector('.glass [data-codex-select]')||document.querySelector('.glass p')||document.querySelector('.glass');var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);void 0"
	const focusJS = "var el=document.querySelector('.glass [contenteditable],.glass input,.glass textarea');if(el)el.focus();void 0"
	if mode == "transition" || mode == "scroll" {
		w.line(fmt.Sprintf("steps { evaluate_script { expression: %q } }", trig))
		w.line("steps { wait { milliseconds: 40 } }")
	}
	for i := 0; i < n; i++ {
		if mode == "click" && i == 1 {
			w.line(fmt.Sprintf("steps { evaluate_script { expression: %q } }", trig))
			w.line("steps { wait { milliseconds: 220 } }")
		}
		if mode == "select" && i == 1 {
			w.line(fmt.Sprintf("steps { evaluate_script { expression: %q } }", selectJS))
			w.line("steps { wait { milliseconds: 120 } }")
		}
		if mode == "focus" && i == 1 {
			w.line(fmt.Sprintf("steps { evaluate_script { expression: %q } }", focusJS))
			w.line("steps { wait { milliseconds: 120 } }")
		}
		if mode == "touch" && i == 1 {
			// pan the scroll container upward with a synthetic touch gesture; the
			// value (touch-action) decides whether it actually scrolls.
			w.line(`steps { touch { selector: "[data-codex-touch]" dy: -150 } }`)
			w.line("steps { wait { milliseconds: 220 } }")
		}
		if mode == "settle" && i == 1 {
			w.line("steps { wait { milliseconds: 2600 } }") // let a finite animation finish → held/stopped state
		}
		w.line(fmt.Sprintf("steps { screenshot { output_path: %q format: \"png\" } }", filepath.Join(framedir, fmt.Sprintf("frame-%02d.png", i))))
		w.line(fmt.Sprintf("steps { wait { milliseconds: %d } }", w.frameWait))
		w.shots++
	}
}

func (w *chunkWriter) flush() {
	if w.b.Len() > 0 {
		path := fmt.Sprintf("%s-%03d.textproto", w.prefix, w.nChunks)
		if err := os.WriteFile(path, []byte(w.b.String()), 0o644); err != nil {
			panic(err)
		}
		w.nChunks++
	}
}

func familyMap(manifest string) map[string]string {
	out := map[string]string{}
	data, err := os.ReadFile(manifest)
	if err != nil {
		return out
	}
	for _, line := range strings.Split(string(data), "\n") {
		c := strings.Split(line, "\t")
		if len(c) >= 2 {
			out[c[0]] = c[1]
		}
	}
	return out
}

var nonName = regexp.MustCompile(`[^a-z0-9]+`)

func sanitize(v string) string {
	s := nonName.ReplaceAllString(strings.ToLower(v), "-")
	s = strings.Trim(s, "-")
	if s == "" {
		s = "v"
	}
	if len(s) > 40 {
		s = s[:40]
	}
	return s
}

func sortStrings(s []string) {
	for i := 1; i < len(s); i++ {
		for j := i; j > 0 && s[j-1] > s[j]; j-- {
			s[j-1], s[j] = s[j], s[j-1]
		}
	}
}
