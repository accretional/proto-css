package lang_test

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"

	metaparser "github.com/accretional/gluon/v2/metaparser"
	pb "github.com/accretional/gluon/v2/pb"
)

// ebnfCommentRE strips EBNF block comments before grammar parsing.
var ebnfCommentRE = regexp.MustCompile(`(?s)\(\*.*?\*\)`)

// ebnfFiles lists the EBNF sources in load order.
// css.ebnf must be first: ParseCST uses the first rule as the start rule,
// which must be CssStyleSheet.
var ebnfFiles = []string{
	"css.ebnf",
	"symbol.ebnf",
	"primitive.ebnf",
	"keyword.ebnf",
	"combinator.ebnf",
	"datatype.ebnf",
	"functions.ebnf",
	"pseudo-class.ebnf",
	"pseudo-element.ebnf",
	"selector.ebnf",
	"property.ebnf",
	"atrule.ebnf",
}

// requiredRules are checked for presence during EBNF validation.
var requiredRules = []string{
	"CssStyleSheet",
	"CssRule",
	"Property",
	"AtRule",
	"ComplexSelectorList",
	"PseudoClass",
	"PseudoElement",
	"Combinator",
	"ColorType",
	"RgbFn",
	"AllProp",
}

// loadGrammar concatenates all EBNF files and parses them into a GrammarDocument.
// The test is marked fatal if any file cannot be read or if ParseEBNF fails.
func loadGrammar(t *testing.T) *pb.GrammarDescriptor {
	t.Helper()
	var combined strings.Builder
	for _, name := range ebnfFiles {
		src, err := os.ReadFile(name)
		if err != nil {
			t.Fatalf("read %s: %v", name, err)
		}
		combined.Write(src)
		combined.WriteByte('\n')
	}
	stripped := ebnfCommentRE.ReplaceAllString(combined.String(), "")
	doc := metaparser.WrapString(stripped)
	doc.Name = "css-combined.ebnf"
	gd, err := metaparser.ParseEBNF(doc)
	if err != nil {
		t.Fatalf("ParseEBNF: %v", err)
	}
	return gd
}

// TestGrammarEBNF validates that the combined EBNF grammar is structurally sound:
//   - Parses without error
//   - Contains the minimum expected number of rules
//   - All required top-level rules are present
//   - No nonterminal references are undefined
func TestGrammarEBNF(t *testing.T) {
	gd := loadGrammar(t)
	rules := gd.GetRules()

	t.Run("MinRuleCount", func(t *testing.T) {
		const minRules = 2000
		if len(rules) < minRules {
			t.Errorf("got %d rules, want >= %d", len(rules), minRules)
		}
	})

	t.Run("RequiredRules", func(t *testing.T) {
		defined := make(map[string]bool, len(rules))
		for _, r := range rules {
			defined[r.GetName()] = true
		}
		for _, name := range requiredRules {
			if !defined[name] {
				t.Errorf("required rule %q not found", name)
			}
		}
	})

	t.Run("NoUnresolvedRefs", func(t *testing.T) {
		defined := make(map[string]bool, len(rules))
		for _, r := range rules {
			defined[r.GetName()] = true
		}
		for ref, usedBy := range collectMissingRefs(rules, defined) {
			t.Errorf("undefined nonterminal %q (referenced by %q)", ref, usedBy)
		}
	})
}

// TestCSSFiles walks a testdata directory recursively and runs each .css file
// through ParseCST, reporting a named subtest per file.
//
// The directory defaults to "testdata". Override with the CSS_TESTDATA env var:
//
//	CSS_TESTDATA=/tmp/mydir go test -v -run TestCSSFiles
//
// Without -v: prints a progress dot per file and a pass/fail summary at the end.
// With -v:    prints PASS/FAIL and the error for each file as it runs.
func TestCSSFiles(t *testing.T) {
	gd := loadGrammar(t)
	verbose := testing.Verbose()

	testdataDir := os.Getenv("CSS_TESTDATA")
	if testdataDir == "" {
		testdataDir = "testdata"
	}

	// Count total files first so we can show progress as N/total.
	var total int
	_ = filepath.WalkDir(testdataDir, func(_ string, d os.DirEntry, err error) error {
		if err == nil && !d.IsDir() && strings.HasSuffix(d.Name(), ".css") {
			total++
		}
		return nil
	})

	type result struct {
		rel string
		err error
	}
	var results []result
	done, failed := 0, 0

	err := filepath.WalkDir(testdataDir, func(path string, d os.DirEntry, err error) error {
		if err != nil || d.IsDir() || !strings.HasSuffix(d.Name(), ".css") {
			return err
		}
		rel, _ := filepath.Rel(testdataDir, path)
		rel = filepath.ToSlash(rel)

		src, readErr := os.ReadFile(path)
		if readErr != nil {
			if verbose {
				fmt.Printf("SKIP  %s — %v\n", rel, readErr)
			}
			return nil
		}

		cssDoc := metaparser.WrapString(string(src))
		cssDoc.Uri = path
		_, parseErr := metaparser.ParseCST(&pb.CstRequest{
			Grammar:  gd,
			Document: cssDoc,
		})

		done++
		if parseErr != nil {
			failed++
		}

		if verbose {
			if parseErr != nil {
				fmt.Printf("FAIL  %s\n        %v\n", rel, parseErr)
			} else {
				fmt.Printf("PASS  %s\n", rel)
			}
		} else {
			fmt.Fprintf(os.Stderr, "\rTesting %d/%d   FAILED: %d", done, total, failed)
		}

		results = append(results, result{rel, parseErr})

		// Register with the test framework for correct exit code and subtest naming.
		t.Run(rel, func(t *testing.T) {
			if parseErr != nil {
				t.Fail()
			}
		})
		return nil
	})
	if err != nil {
		t.Fatalf("walk %s: %v", testdataDir, err)
	}

	if !verbose {
		pass := len(results) - failed
		fmt.Fprintf(os.Stderr, "\r%d passed, %d failed out of %d files\n", pass, failed, len(results))
	}
}

// collectMissingRefs walks every production in every rule and returns a map of
// undefined nonterminal names to an example rule that references them.
func collectMissingRefs(rules []*pb.RuleDescriptor, defined map[string]bool) map[string]string {
	missing := map[string]string{}
	for _, r := range rules {
		walkProductions(r.GetExpressions(), func(p *pb.Production) {
			nt := p.GetNonterminal()
			if nt != "" && !defined[nt] {
				if _, seen := missing[nt]; !seen {
					missing[nt] = r.GetName()
				}
			}
		})
	}
	return missing
}

func walkProductions(prods []*pb.Production, fn func(*pb.Production)) {
	for _, p := range prods {
		fn(p)
		if s := p.GetScoper(); s != nil {
			walkProductions(s.GetBody(), fn)
		}
	}
}
