// mdndesc downloads every MDN property doc page listed in
// docs/reference/mdnproperties-reference.md, extracts the first description
// paragraph (the first <p> of the content-section inside the
// reference-layout__header), and writes generated/descriptions.json mapping
// property name -> description. Raw HTML is cached so re-runs are offline/fast.
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"
)

const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) CodexDocFetch/1.0"

var (
	reURL  = regexp.MustCompile(`https://developer\.mozilla\.org/[^\s)]+/Properties/([A-Za-z0-9_-]+)`)
	reTag  = regexp.MustCompile(`<[^>]+>`)
	reWS   = regexp.MustCompile(`\s+`)
	rePara = regexp.MustCompile(`(?s)<p>(.*?)</p>`)
	// the four MDN status notecards (each wraps a single <p>)
	reNotecard = regexp.MustCompile(`(?s)<div class="notecard (experimental|nonstandard|deprecated|warning)"\s*>\s*<p>(.*?)</p>\s*</div>`)
)

// Doc is the per-property documentation extracted from its MDN page:
// the summary paragraph plus the status flags MDN shows as notecards.
type Doc struct {
	Description  string `json:"description,omitempty"`  // summary <p>, inner HTML (links kept)
	Experimental bool   `json:"experimental,omitempty"`
	Nonstandard  bool   `json:"nonstandard,omitempty"`
	Deprecated   bool   `json:"deprecated,omitempty"`
	Warning      string `json:"warning,omitempty"` // warning notecard inner HTML (links kept)
}

func main() {
	ref := flagDefault("REF", "docs/reference/mdnproperties-reference.md")
	cacheDir := flagDefault("CACHE", "chrome-testing-2.0/generated/mdn-cache")
	out := flagDefault("OUT", "chrome-testing-2.0/generated/descriptions.json")
	if len(os.Args) > 1 {
		ref = os.Args[1]
	}

	data, err := os.ReadFile(ref)
	if err != nil {
		panic(err)
	}
	type job struct{ url, name string }
	seen := map[string]bool{}
	var jobs []job
	for _, m := range reURL.FindAllStringSubmatch(string(data), -1) {
		name := m[1]
		if seen[name] {
			continue
		}
		seen[name] = true
		jobs = append(jobs, job{m[0], name})
	}
	fmt.Printf("Found %d property doc URLs\n", len(jobs))
	if err := os.MkdirAll(cacheDir, 0o755); err != nil {
		panic(err)
	}

	descs := map[string]Doc{}
	var mu sync.Mutex
	var wg sync.WaitGroup
	sem := make(chan struct{}, 8)
	var fetched, cached, failed int

	for _, j := range jobs {
		wg.Add(1)
		sem <- struct{}{}
		go func(j job) {
			defer wg.Done()
			defer func() { <-sem }()
			cachePath := filepath.Join(cacheDir, j.name+".html")
			var body string
			if b, err := os.ReadFile(cachePath); err == nil && len(b) > 1024 {
				body = string(b)
				mu.Lock()
				cached++
				mu.Unlock()
			} else {
				b, err := fetch(j.url)
				if err != nil {
					mu.Lock()
					failed++
					mu.Unlock()
					return
				}
				body = b
				_ = os.WriteFile(cachePath, []byte(b), 0o644)
				mu.Lock()
				fetched++
				mu.Unlock()
			}
			if doc := extract(body); doc.Description != "" || doc.Experimental || doc.Nonstandard || doc.Deprecated || doc.Warning != "" {
				mu.Lock()
				descs[j.name] = doc
				mu.Unlock()
			}
		}(j)
	}
	wg.Wait()

	// stable JSON
	names := make([]string, 0, len(descs))
	for n := range descs {
		names = append(names, n)
	}
	sort.Strings(names)
	ordered := map[string]Doc{}
	for _, n := range names {
		ordered[n] = descs[n]
	}
	js, _ := json.MarshalIndent(ordered, "", " ")
	if err := os.WriteFile(out, js, 0o644); err != nil {
		panic(err)
	}
	fmt.Printf("fetched %d · cached %d · failed %d · extracted %d descriptions -> %s\n",
		fetched, cached, failed, len(descs), out)
}

func fetch(url string) (string, error) {
	client := &http.Client{Timeout: 30 * time.Second}
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", userAgent)
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("status %d", resp.StatusCode)
	}
	b, err := io.ReadAll(resp.Body)
	return string(b), err
}

// extract pulls, from the content-section inside the reference-layout__header:
//   - the status notecards (experimental / nonstandard / deprecated / warning),
//     set as flags; the warning's message HTML (with its link) is kept,
//   - the summary paragraph — the first bare <p> that ISN'T a notecard — kept as
//     inner HTML so its inline links survive into the gallery.
func extract(htmlSrc string) Doc {
	var doc Doc
	i := strings.Index(htmlSrc, "reference-layout__header")
	if i < 0 {
		i = 0
	}
	seg := htmlSrc[i:]
	if j := strings.Index(seg, "content-section"); j >= 0 {
		seg = seg[j:]
	}
	if e := strings.Index(seg, "</section>"); e >= 0 {
		seg = seg[:e] // stop at the end of the header section
	}

	// Pull out the notecards: set flags, capture the warning message, and strip
	// them from the segment so the real description <p> is what's left.
	rest := reNotecard.ReplaceAllStringFunc(seg, func(m string) string {
		sub := reNotecard.FindStringSubmatch(m)
		switch sub[1] {
		case "experimental":
			doc.Experimental = true
		case "nonstandard":
			doc.Nonstandard = true
		case "deprecated":
			doc.Deprecated = true
		case "warning":
			doc.Warning = cleanInline(sub[2])
		}
		return ""
	})

	if m := rePara.FindStringSubmatch(rest); m != nil {
		txt := cleanInline(m[1])
		plain := strings.TrimSpace(reWS.ReplaceAllString(reTag.ReplaceAllString(txt, ""), " "))
		// guard against any stray banner text leaking in
		if !strings.HasPrefix(plain, "This feature is") && !strings.HasPrefix(plain, "Baseline") && plain != "" {
			doc.Description = txt
		}
	}
	return doc
}

// cleanInline collapses whitespace but KEEPS inline markup (<a>/<strong>/<code>/
// <em>) so links survive; hrefs are left relative for the UI to localize.
func cleanInline(s string) string {
	return strings.TrimSpace(reWS.ReplaceAllString(s, " "))
}

func flagDefault(env, def string) string {
	if v := os.Getenv(env); v != "" {
		return v
	}
	return def
}
